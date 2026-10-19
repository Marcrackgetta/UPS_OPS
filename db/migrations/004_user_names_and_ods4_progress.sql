-- =========================================================================================
-- MIGRACIÓN 004: Soporte de Nombre, Apellido y Progreso Gamificado ODS 4 en public.usuarios
-- Proyecto: Kawsay Eco-Dash
-- =========================================================================================

BEGIN;

-- 1. Asegurar columnas en public.usuarios sin afectar cuentas antiguas
ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS nombre TEXT,
    ADD COLUMN IF NOT EXISTS apellido TEXT,
    ADD COLUMN IF NOT EXISTS curiosidades_desbloqueadas INTEGER[] DEFAULT ARRAY[1]::INTEGER[];

-- 2. Sincronizar cuentas existentes (respetando cuentas antiguas y calculando progreso ODS 4 real)
UPDATE public.usuarios u
SET
    nombre = COALESCE(
        NULLIF(TRIM(au.raw_user_meta_data->>'nombre'), ''),
        NULLIF(TRIM(u.nombre), ''),
        NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
        SPLIT_PART(COALESCE(u.email, au.email, 'Estudiante'), '@', 1)
    ),
    apellido = COALESCE(
        NULLIF(TRIM(u.apellido), ''),
        NULLIF(TRIM(au.raw_user_meta_data->>'apellido'), '')
    ),
    curiosidades_desbloqueadas = ARRAY(
        SELECT DISTINCT cid
        FROM UNNEST(
            COALESCE(u.curiosidades_desbloqueadas, ARRAY[1]::INTEGER[])
            || ARRAY[1]
            || CASE WHEN COALESCE(u.nivel_actual, 1) >= 1 AND COALESCE(u.xp_acumulada, 0) >= 50  THEN ARRAY[2] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN COALESCE(u.nivel_actual, 1) >= 2 AND COALESCE(u.xp_acumulada, 0) >= 100 THEN ARRAY[3] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN COALESCE(u.nivel_actual, 1) >= 2 AND COALESCE(u.xp_acumulada, 0) >= 200 THEN ARRAY[4] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN COALESCE(u.nivel_actual, 1) >= 3 AND COALESCE(u.xp_acumulada, 0) >= 282 THEN ARRAY[5] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN COALESCE(u.nivel_actual, 1) >= 4 AND COALESCE(u.xp_acumulada, 0) >= 519 THEN ARRAY[6] ELSE ARRAY[]::INTEGER[] END
            || CASE WHEN COALESCE(u.nivel_actual, 1) >= 5 AND COALESCE(u.xp_acumulada, 0) >= 800 THEN ARRAY[7] ELSE ARRAY[]::INTEGER[] END
        ) AS cid
        ORDER BY cid
    )
FROM auth.users au
WHERE u.id = au.id;

-- 3. Política RLS para permitir inserción/upsert seguro del propio perfil desde el cliente
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON public.usuarios;
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON public.usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Actualizar Trigger de Creación de Perfil (auth.users -> public.usuarios)
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

DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
CREATE TRIGGER on_auth_user_created_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- 5. Actualizar RPC registrar_accion_usuario para persistir desbloqueos progresivos ODS 4
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
    v_curiosidades INTEGER[];
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() != p_usuario_id THEN
        RAISE EXCEPTION 'No autorizado. El ID de usuario no coincide con el token.';
    END IF;

    v_fecha_actual := (TIMEZONE('America/Guayaquil', NOW()))::DATE;

    SELECT * INTO v_accion FROM public.catalogo_acciones WHERE id = p_accion_id AND activo = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Acción no encontrada o inactiva.';
    END IF;

    SELECT * INTO v_usuario FROM public.usuarios WHERE id = p_usuario_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado.';
    END IF;

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

    v_nueva_xp := COALESCE(v_usuario.xp_acumulada, 0) + COALESCE(v_accion.xp_otorgada, 0);
    v_nuevo_nivel := COALESCE(v_usuario.nivel_actual, 1);
    v_xp_siguiente := FLOOR(100 * POWER(v_nuevo_nivel, 1.5));

    IF v_nueva_xp >= v_xp_siguiente THEN
        v_nuevo_nivel := v_nuevo_nivel + 1;
        v_subio_nivel := TRUE;
    END IF;

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

    INSERT INTO public.historial_registros (
        usuario_id, accion_id, co2_calculado, calorias_calculadas, xp_ganada, fecha_registro
    ) VALUES (
        p_usuario_id, p_accion_id, v_accion.impacto_co2_kg, v_accion.calorias_estimadas, v_accion.xp_otorgada, v_fecha_actual
    );

    UPDATE public.usuarios SET
        xp_acumulada = v_nueva_xp,
        nivel_actual = v_nuevo_nivel,
        racha_dias = v_nueva_racha,
        fecha_ultimo_registro = v_fecha_actual,
        curiosidades_desbloqueadas = v_curiosidades
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
