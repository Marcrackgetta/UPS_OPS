-- =========================================================================================
-- MIGRACIÓN MAESTRA CONSOLIDADA: 001_init_schema.sql
-- Proyecto: Kawsay Eco-Dash (ODS 3, 4 y 13)
-- Motor: PostgreSQL 15 / Supabase
-- Zona Horaria de Negocio: America/Guayaquil (UTC-5)
-- Descripción: Esquema unificado e idempotente (tablas, índices, políticas RLS, triggers,
--              funciones RPC transaccionales, programación pg_cron y datos semilla).
-- =========================================================================================

BEGIN;

-- =========================================================================================
-- 1. EXTENSIONES
-- =========================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================================
-- 2. TABLAS DEL ESQUEMA PÚBLICO
-- =========================================================================================

-- 2.1 Catálogo de Acciones Ambientales y de Salud (ODS 3 y 13)
CREATE TABLE IF NOT EXISTS public.catalogo_acciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(40) NOT NULL,
    impacto_co2_kg NUMERIC NOT NULL DEFAULT 0.0,
    calorias_estimadas NUMERIC NOT NULL DEFAULT 0.0,
    xp_otorgada INTEGER NOT NULL DEFAULT 10,
    ods_principal INTEGER NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2.2 Catálogo Educativo (ODS 4)
CREATE TABLE IF NOT EXISTS public.catalogo_educativo (
    id SERIAL PRIMARY KEY,
    ods INTEGER NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,
    fuente VARCHAR(255),
    nivel_desbloqueo INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2.3 Perfil Gamificado de Usuarios (Vinculado 1:1 con auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    apellido TEXT,
    xp_acumulada INTEGER NOT NULL DEFAULT 0,
    nivel_actual INTEGER NOT NULL DEFAULT 1,
    racha_dias INTEGER NOT NULL DEFAULT 0,
    fecha_ultimo_registro DATE,
    curiosidades_desbloqueadas INTEGER[] DEFAULT ARRAY[1]::INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Asegurar columnas evolutivas en instalaciones preexistentes de forma idempotente
ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nombre VARCHAR(120),
    ADD COLUMN IF NOT EXISTS apellido TEXT,
    ADD COLUMN IF NOT EXISTS xp_acumulada INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nivel_actual INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS racha_dias INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fecha_ultimo_registro DATE,
    ADD COLUMN IF NOT EXISTS curiosidades_desbloqueadas INTEGER[] DEFAULT ARRAY[1]::INTEGER[],
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- 2.4 Historial Transaccional de Hábitos Registrados
CREATE TABLE IF NOT EXISTS public.historial_registros (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    accion_id INTEGER NOT NULL REFERENCES public.catalogo_acciones(id),
    co2_calculado NUMERIC NOT NULL DEFAULT 0.0,
    calorias_calculadas NUMERIC NOT NULL DEFAULT 0.0,
    xp_ganada INTEGER NOT NULL DEFAULT 0,
    fecha_registro DATE NOT NULL DEFAULT (TIMEZONE('America/Guayaquil', NOW()))::DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =========================================================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- =========================================================================================
CREATE INDEX IF NOT EXISTS idx_catalogo_acciones_activo
    ON public.catalogo_acciones(activo);

CREATE INDEX IF NOT EXISTS idx_historial_registros_usuario_id
    ON public.historial_registros(usuario_id);

CREATE INDEX IF NOT EXISTS idx_historial_registros_fecha_registro
    ON public.historial_registros(fecha_registro);

CREATE INDEX IF NOT EXISTS idx_historial_registros_usuario_fecha
    ON public.historial_registros(usuario_id, fecha_registro DESC);

-- =========================================================================================
-- 4. SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- =========================================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_educativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_registros ENABLE ROW LEVEL SECURITY;

-- 4.1 Políticas para public.usuarios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'usuarios' AND policyname = 'Usuarios pueden ver su propio perfil'
    ) THEN
        CREATE POLICY "Usuarios pueden ver su propio perfil"
            ON public.usuarios FOR SELECT
            USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'usuarios' AND policyname = 'Usuarios pueden insertar su propio perfil'
    ) THEN
        CREATE POLICY "Usuarios pueden insertar su propio perfil"
            ON public.usuarios FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'usuarios' AND policyname = 'Usuarios pueden actualizar su propio perfil'
    ) THEN
        CREATE POLICY "Usuarios pueden actualizar su propio perfil"
            ON public.usuarios FOR UPDATE
            USING (auth.uid() = id);
    END IF;

    -- 4.2 Políticas para catálogos de lectura pública
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'catalogo_acciones' AND policyname = 'Catálogo público para lectura'
    ) THEN
        CREATE POLICY "Catálogo público para lectura"
            ON public.catalogo_acciones FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'catalogo_educativo' AND policyname = 'Catálogo educativo público para lectura'
    ) THEN
        CREATE POLICY "Catálogo educativo público para lectura"
            ON public.catalogo_educativo FOR SELECT
            USING (true);
    END IF;

    -- 4.3 Políticas para public.historial_registros
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'historial_registros' AND policyname = 'Usuarios pueden ver su historial'
    ) THEN
        CREATE POLICY "Usuarios pueden ver su historial"
            ON public.historial_registros FOR SELECT
            USING (auth.uid() = usuario_id);
    END IF;
END;
$$;

-- =========================================================================================
-- 5. TRIGGER DE SINCRONIZACIÓN DE PERFIL (auth.users -> public.usuarios)
-- =========================================================================================
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nombre TEXT;
    v_apellido TEXT;
BEGIN
    v_nombre := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    v_apellido := NULLIF(TRIM(NEW.raw_user_meta_data->>'apellido'), '');

    INSERT INTO public.usuarios (id, email, nombre, apellido, curiosidades_desbloqueadas)
    VALUES (
        NEW.id,
        NEW.email,
        v_nombre,
        v_apellido,
        ARRAY[1]::INTEGER[]
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, public.usuarios.email),
        nombre = COALESCE(NULLIF(TRIM(EXCLUDED.nombre), ''), public.usuarios.nombre),
        apellido = COALESCE(NULLIF(TRIM(EXCLUDED.apellido), ''), public.usuarios.apellido),
        curiosidades_desbloqueadas = COALESCE(public.usuarios.curiosidades_desbloqueadas, ARRAY[1]::INTEGER[]);

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created_trigger'
    ) THEN
        CREATE TRIGGER on_auth_user_created_trigger
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();
    END IF;
END;
$$;

-- =========================================================================================
-- 6. FUNCIONES RPC TRANSACCIONALES (GAMIFICACIÓN, RACHAS E IMPACTO ODS)
-- =========================================================================================

-- 6.1 RPC: Registro Atómico de Acción, Cálculo de Nivel/Racha y Desbloqueo Progresivo ODS 4
CREATE OR REPLACE FUNCTION public.registrar_accion_usuario(
    p_usuario_id UUID,
    p_accion_id INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    v_curiosidades INTEGER[];
BEGIN
    -- Validar identidad cuando se invoca con JWT de usuario autenticado
    IF auth.uid() IS NOT NULL AND auth.uid() != p_usuario_id THEN
        RAISE EXCEPTION 'No autorizado. El ID de usuario no coincide con el token.';
    END IF;

    -- Fecha de negocio oficial en America/Guayaquil (UTC-5)
    v_fecha_actual := (TIMEZONE('America/Guayaquil', NOW()))::DATE;

    -- Validar que la acción exista y se encuentre activa
    SELECT * INTO v_accion FROM public.catalogo_acciones WHERE id = p_accion_id AND activo = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Acción no encontrada o inactiva.';
    END IF;

    -- Bloqueo pesimista sobre la fila del usuario para garantizar atomicidad concurrente
    SELECT * INTO v_usuario FROM public.usuarios WHERE id = p_usuario_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado.';
    END IF;

    -- Cálculo determinista de racha diaria
    IF v_usuario.fecha_ultimo_registro IS NULL THEN
        v_nueva_racha := 1;
    ELSE
        v_diferencia_dias := v_fecha_actual - v_usuario.fecha_ultimo_registro;
        IF v_diferencia_dias = 0 THEN
            v_nueva_racha := v_usuario.racha_dias;
        ELSIF v_diferencia_dias = 1 THEN
            v_nueva_racha := v_usuario.racha_dias + 1;
        ELSE
            v_nueva_racha := 1;
        END IF;
    END IF;

    -- Progresión exponencial de nivel: XP requerida = FLOOR(100 * (nivel ^ 1.5))
    v_nueva_xp := COALESCE(v_usuario.xp_acumulada, 0) + COALESCE(v_accion.xp_otorgada, 0);
    v_nuevo_nivel := COALESCE(v_usuario.nivel_actual, 1);
    v_xp_siguiente := FLOOR(100 * POWER(v_nuevo_nivel, 1.5));

    IF v_nueva_xp >= v_xp_siguiente THEN
        v_nuevo_nivel := v_nuevo_nivel + 1;
        v_subio_nivel := TRUE;
    END IF;

    -- Desbloqueo progresivo de cápsulas educativas ODS 4 según umbrales de nivel y XP
    SELECT ARRAY(
        SELECT DISTINCT cid
        FROM UNNEST(
            COALESCE(v_usuario.curiosidades_desbloqueadas, ARRAY[1]::INTEGER[])
            || ARRAY[1]
            || CASE WHEN v_nuevo_nivel >= 1 AND v_nueva_xp >= 50  THEN ARRAY[2] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN v_nuevo_nivel >= 2 AND v_nueva_xp >= 100 THEN ARRAY[3] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN v_nuevo_nivel >= 2 AND v_nueva_xp >= 200 THEN ARRAY[4] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN v_nuevo_nivel >= 3 AND v_nueva_xp >= 282 THEN ARRAY[5] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN v_nuevo_nivel >= 4 AND v_nueva_xp >= 519 THEN ARRAY[6] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN v_nuevo_nivel >= 5 AND v_nueva_xp >= 800 THEN ARRAY[7] ELSE ARRAY[]::INTEGER[] END
        ) AS cid
        ORDER BY cid
    ) INTO v_curiosidades;

    -- Insertar registro en el historial transaccional
    INSERT INTO public.historial_registros (
        usuario_id, accion_id, co2_calculado, calorias_calculadas, xp_ganada, fecha_registro
    ) VALUES (
        p_usuario_id, p_accion_id, v_accion.impacto_co2_kg, v_accion.calorias_estimadas, v_accion.xp_otorgada, v_fecha_actual
    );

    -- Actualizar estado consolidado del usuario
    UPDATE public.usuarios SET
        xp_acumulada = v_nueva_xp,
        nivel_actual = v_nuevo_nivel,
        racha_dias = v_nueva_racha,
        fecha_ultimo_registro = v_fecha_actual,
        curiosidades_desbloqueadas = v_curiosidades,
        updated_at = NOW()
    WHERE id = p_usuario_id;

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
            'subio_de_nivel', v_subio_nivel,
            'curiosidades_desbloqueadas', v_curiosidades
        ),
        'ods_info', json_build_object(
            'ods', v_accion.ods_principal
        )
    );
END;
$$;

-- 6.2 RPC: Reinicio en Lote de Rachas Vencidas (> 1 día de inactividad en America/Guayaquil)
CREATE OR REPLACE FUNCTION public.reiniciar_rachas_vencidas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_fecha_actual DATE;
    v_filas_afectadas INTEGER := 0;
BEGIN
    v_fecha_actual := (TIMEZONE('America/Guayaquil', NOW()))::DATE;

    WITH ultima_actividad AS (
        SELECT
            u.id,
            GREATEST(
                u.fecha_ultimo_registro,
                MAX(h.fecha_registro)
            ) AS fecha_efectiva
        FROM public.usuarios u
        LEFT JOIN public.historial_registros h ON h.usuario_id = u.id
        WHERE COALESCE(u.racha_dias, 0) > 0
        GROUP BY u.id, u.fecha_ultimo_registro
    ),
    actualizados AS (
        UPDATE public.usuarios u
        SET
            racha_dias = 0,
            fecha_ultimo_registro = ua.fecha_efectiva,
            updated_at = NOW()
        FROM ultima_actividad ua
        WHERE u.id = ua.id
          AND (
              ua.fecha_efectiva IS NULL
              OR (v_fecha_actual - ua.fecha_efectiva) > 1
          )
        RETURNING u.id
    )
    SELECT COUNT(*) INTO v_filas_afectadas FROM actualizados;

    RETURN v_filas_afectadas;
END;
$$;

-- 6.3 RPC: Sincronización Atómica de Racha Vigente para un Usuario Individual
CREATE OR REPLACE FUNCTION public.sincronizar_racha_usuario(p_usuario_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_fecha_actual DATE;
    v_fecha_efectiva DATE;
    v_racha_actual INTEGER;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() != p_usuario_id THEN
        RAISE EXCEPTION 'No autorizado. El ID de usuario no coincide con el token.';
    END IF;

    v_fecha_actual := (TIMEZONE('America/Guayaquil', NOW()))::DATE;

    SELECT
        COALESCE(u.racha_dias, 0),
        GREATEST(
            u.fecha_ultimo_registro,
            (SELECT MAX(h.fecha_registro) FROM public.historial_registros h WHERE h.usuario_id = u.id)
        )
    INTO v_racha_actual, v_fecha_efectiva
    FROM public.usuarios u
    WHERE u.id = p_usuario_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado.';
    END IF;

    IF v_racha_actual > 0 AND (v_fecha_efectiva IS NULL OR (v_fecha_actual - v_fecha_efectiva) > 1) THEN
        v_racha_actual := 0;

        UPDATE public.usuarios
        SET
            racha_dias = 0,
            fecha_ultimo_registro = v_fecha_efectiva,
            updated_at = NOW()
        WHERE id = p_usuario_id;
    END IF;

    RETURN v_racha_actual;
END;
$$;

-- 6.4 Permisos de Ejecución de Funciones RPC
REVOKE ALL ON FUNCTION public.reiniciar_rachas_vencidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reiniciar_rachas_vencidas() TO service_role, postgres;

REVOKE ALL ON FUNCTION public.sincronizar_racha_usuario(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sincronizar_racha_usuario(UUID) TO authenticated, service_role, postgres;

-- 6.5 Programación Diaria en pg_cron (00:00 America/Guayaquil = 05:00 UTC)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'kawsay_reiniciar_rachas_diario';

    PERFORM cron.schedule(
        'kawsay_reiniciar_rachas_diario',
        '0 5 * * *',
        $cron$SELECT public.reiniciar_rachas_vencidas();$cron$
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron no disponible o sin permisos en este entorno (%). La sincronización se ejecuta vía RPC.', SQLERRM;
END;
$$;

-- =========================================================================================
-- 7. DATOS SEMILLA (SEEDS IDEMPOTENTES)
-- =========================================================================================

-- 7.1 Semillas del Catálogo de Acciones (ODS 3 y ODS 13)
INSERT INTO public.catalogo_acciones (
    id, codigo, titulo, descripcion, categoria, impacto_co2_kg, calorias_estimadas, xp_otorgada, ods_principal, activo
) VALUES
    (1, 'BUS_URBANO', 'Uso de Transporte Público', 'Uso de Metrovía o bus urbano en lugar de auto particular o taxi.', 'MOVILIDAD', 1.45, 0.0, 25, 13, TRUE),
    (2, 'MOVILIDAD_ACTIVA', 'Caminata o Bicicleta', 'Desplazamiento a pie o bicicleta para trayectos menores a 3 km.', 'MOVILIDAD', 2.1, 180.0, 40, 3, TRUE),
    (3, 'APAGAR_AC', 'Apagado de Aire Acondicionado', 'Uso de ventilación natural durante las horas de menor radiación térmica.', 'ENERGIA', 0.85, 0.0, 20, 13, TRUE),
    (4, 'DESCONEXION_VAMPIRO', 'Desconexión de Vampiros Eléctricos', 'Desconectar cargadores y regletas durante la noche.', 'ENERGIA', 0.32, 0.0, 15, 13, TRUE),
    (5, 'TERMO_REUTILIZABLE', 'Uso de Termo Reutilizable', 'Evitar la compra de botellas plásticas de un solo uso.', 'RESIDUOS', 0.12, 0.0, 10, 13, TRUE)
ON CONFLICT (id) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    categoria = EXCLUDED.categoria,
    impacto_co2_kg = EXCLUDED.impacto_co2_kg,
    calorias_estimadas = EXCLUDED.calorias_estimadas,
    xp_otorgada = EXCLUDED.xp_otorgada,
    ods_principal = EXCLUDED.ods_principal,
    activo = EXCLUDED.activo;

SELECT setval(
    pg_get_serial_sequence('public.catalogo_acciones', 'id'),
    COALESCE((SELECT MAX(id) FROM public.catalogo_acciones), 1),
    true
);

-- 7.2 Semillas del Catálogo Educativo (ODS 3, 4 y 13)
INSERT INTO public.catalogo_educativo (
    id, ods, titulo, contenido, fuente, nivel_desbloqueo
) VALUES
    (1, 13, 'Emisiones en el Transporte Urbano', 'El sector transporte representa más del 40% de las emisiones de gases de efecto invernadero en zonas urbanas de Ecuador.', 'Ministerio del Ambiente, Agua y Transición Ecológica', 1),
    (2, 3, 'Beneficio Cardiovascular de la Movilidad Activa', 'Caminar 30 minutos al día a paso ligero reduce el riesgo de cardiopatías en un 19% y mejora los niveles de concentración matutina.', 'Organización Mundial de la Salud (OMS)', 1),
    (3, 4, 'Economía Circular en Aulas', 'Reutilizar envases y reducir consumos fantasma promueve el aprendizaje empírico sobre el ciclo de vida de los productos.', 'UNESCO - Educación para el Desarrollo Sostenible', 1),
    (4, 13, 'Eficiencia Térmica en Climas Cálidos', 'Ajustar el aire acondicionado a 24°C en lugar de 20°C reduce el consumo energético de un hogar o aula hasta en un 30%.', 'Agencia Internacional de Energía (IEA)', 2),
    (5, 3, 'Salud Mental y Entorno Limpio', 'Reducir el ruido urbano y fomentar traslados a pie disminuye los niveles de cortisol (hormona del estrés) en estudiantes.', 'The Lancet Planetary Health', 2)
ON CONFLICT (id) DO UPDATE SET
    ods = EXCLUDED.ods,
    titulo = EXCLUDED.titulo,
    contenido = EXCLUDED.contenido,
    fuente = EXCLUDED.fuente,
    nivel_desbloqueo = EXCLUDED.nivel_desbloqueo;

SELECT setval(
    pg_get_serial_sequence('public.catalogo_educativo', 'id'),
    COALESCE((SELECT MAX(id) FROM public.catalogo_educativo), 1),
    true
);

COMMIT;
