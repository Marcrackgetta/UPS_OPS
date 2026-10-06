-- =========================================================================================
-- MIGRACIÓN: Fase 2 - Esquema, Relación con Auth, RLS y Funciones RPC
-- Fecha: 2026-10-05
-- Zona Horaria: America/Guayaquil
-- =========================================================================================

BEGIN;

-- 1. Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Asegurar estructura híbrida y relación con auth.users
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT,
    email TEXT,
    nivel_actual INTEGER DEFAULT 1,
    xp_acumulada INTEGER DEFAULT 0,
    racha_dias INTEGER DEFAULT 0,
    fecha_ultimo_registro DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Guayaquil', NOW())
);

CREATE TABLE IF NOT EXISTS public.historial_registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    accion_id INTEGER REFERENCES public.catalogo_acciones(id),
    co2_calculado NUMERIC DEFAULT 0,
    calorias_calculadas NUMERIC DEFAULT 0,
    xp_ganada INTEGER DEFAULT 0,
    fecha_registro DATE DEFAULT (TIMEZONE('America/Guayaquil', NOW()))::DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('America/Guayaquil', NOW())
);

-- 3. Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_registros ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (Seguridad)
-- a) Usuarios: Solo el dueño puede ver y actualizar su perfil. Service Role lo ignora.
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

-- b) Catálogo: Lectura pública (para que el frontend lo cargue), modificaciones bloqueadas
DROP POLICY IF EXISTS "Catálogo público para lectura" ON public.catalogo_acciones;
CREATE POLICY "Catálogo público para lectura" ON public.catalogo_acciones
    FOR SELECT USING (true);

-- c) Historial: Solo el dueño puede ver su historial. La inserción se hará vía RPC, 
-- pero se puede restringir igual.
DROP POLICY IF EXISTS "Usuarios pueden ver su historial" ON public.historial_registros;
CREATE POLICY "Usuarios pueden ver su historial" ON public.historial_registros
    FOR SELECT USING (auth.uid() = usuario_id);

-- 5. Trigger de Creación de Perfil (auth.users -> public.usuarios)
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
CREATE TRIGGER on_auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- 6. RPC: Registro Atómico de Acción
CREATE OR REPLACE FUNCTION public.registrar_accion_usuario(
    p_usuario_id UUID,
    p_accion_id INTEGER
) RETURNS json AS $$
DECLARE
    v_accion RECORD;
    v_usuario RECORD;
    v_fecha_actual DATE;
    v_diferencia_dias INTEGER;
    v_nueva_racha INTEGER;
    v_nueva_xp INTEGER;
    v_nuevo_nivel INTEGER;
    v_xp_siguiente INTEGER;
    v_subio_nivel BOOLEAN := FALSE;
BEGIN
    -- Validar que sea el usuario autenticado el que hace la solicitud (Protección Adicional)
    -- Si se llama con service_role auth.uid() es NULL, lo permitimos para el backend, 
    -- pero si viene de la app frontend (anon/authenticated), validamos.
    IF auth.uid() IS NOT NULL AND auth.uid() != p_usuario_id THEN
        RAISE EXCEPTION 'No autorizado. El ID de usuario no coincide con el token.';
    END IF;

    -- Fecha actual Guayaquil
    v_fecha_actual := (TIMEZONE('America/Guayaquil', NOW()))::DATE;

    -- Validar Acción
    SELECT * INTO v_accion FROM public.catalogo_acciones WHERE id = p_accion_id AND activo = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Acción no encontrada o inactiva.';
    END IF;

    -- Bloquear fila de usuario para concurrencia atómica
    SELECT * INTO v_usuario FROM public.usuarios WHERE id = p_usuario_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado.';
    END IF;

    -- Lógica de Rachas (interpretación coherente: permite saltos intradiarios, incrementa en días consecutivos)
    IF v_usuario.fecha_ultimo_registro IS NULL THEN
        v_nueva_racha := 1;
    ELSE
        v_diferencia_dias := v_fecha_actual - v_usuario.fecha_ultimo_registro;
        IF v_diferencia_dias = 0 THEN
            v_nueva_racha := v_usuario.racha_dias; -- Mismo día
        ELSIF v_diferencia_dias = 1 THEN
            v_nueva_racha := v_usuario.racha_dias + 1; -- Día consecutivo
        ELSE
            v_nueva_racha := 1; -- Racha rota
        END IF;
    END IF;

    -- Lógica de XP y Nivel (100 * (nivel)^1.5)
    v_nueva_xp := COALESCE(v_usuario.xp_acumulada, 0) + COALESCE(v_accion.xp_otorgada, 0);
    v_nuevo_nivel := COALESCE(v_usuario.nivel_actual, 1);
    v_xp_siguiente := FLOOR(100 * POWER(v_nuevo_nivel, 1.5));
    
    IF v_nueva_xp >= v_xp_siguiente THEN
        v_nuevo_nivel := v_nuevo_nivel + 1;
        v_subio_nivel := TRUE;
    END IF;

    -- Insertar Historial
    INSERT INTO public.historial_registros (
        usuario_id, accion_id, co2_calculado, calorias_calculadas, xp_ganada, fecha_registro
    ) VALUES (
        p_usuario_id, p_accion_id, v_accion.impacto_co2_kg, v_accion.calorias_estimadas, v_accion.xp_otorgada, v_fecha_actual
    );

    -- Actualizar Usuario
    UPDATE public.usuarios SET
        xp_acumulada = v_nueva_xp,
        nivel_actual = v_nuevo_nivel,
        racha_dias = v_nueva_racha,
        fecha_ultimo_registro = v_fecha_actual
    WHERE id = p_usuario_id;

    -- Retornar Respuesta Estructurada (JSON)
    RETURN json_build_object(
        'status', 'success',
        'transaccion', json_build_object(
            'co2_ganado_kg', v_accion.impacto_co2_kg,
            'calorias_ganadas', v_accion.calorias_estimadas,
            'xp_ganada', v_accion.xp_otorgada
        ),
        'estado_usuario', json_build_object(
            'xp_total', v_nueva_xp,
            'nivel_actual', v_nuevo_nivel,
            'racha_dias', v_nueva_racha,
            'subio_de_nivel', v_subio_nivel
        ),
        'ods_info', json_build_object(
            'ods', v_accion.ods_principal
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
