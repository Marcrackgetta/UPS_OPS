-- =========================================================================================
-- MIGRACIÓN 003: Reinicio Automático y Sincronización Determinista de Rachas Vencidas
-- Proyecto: Kawsay Eco-Dash
-- Zona Horaria de Negocio: America/Guayaquil (UTC-5)
-- =========================================================================================

BEGIN;

-- 1. Función para reiniciar en lote todas las rachas vencidas
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
    -- Fecha actual en la zona horaria oficial del proyecto (America/Guayaquil, UTC-5)
    v_fecha_actual := (TIMEZONE('America/Guayaquil', NOW()))::DATE;

    -- Actualiza a 0 únicamente los usuarios con racha > 0 cuya última actividad
    -- (verificando tanto fecha_ultimo_registro como historial_registros por seguridad)
    -- sea anterior a ayer (diferencia > 1 día).
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

-- 2. Función RPC para sincronizar y obtener la racha vigente de un usuario específico
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
    -- Validación de autorización: permite service_role (auth.uid() IS NULL) o el propio usuario
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

    -- Si la racha es mayor a 0 pero han pasado más de 1 día (o no hay fecha), se reinicia a 0
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

-- 3. Permisos de ejecución seguros (incluyendo revocación explícita a anon por default privileges de Supabase)
REVOKE ALL ON FUNCTION public.reiniciar_rachas_vencidas() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reiniciar_rachas_vencidas() TO service_role, postgres;

REVOKE ALL ON FUNCTION public.sincronizar_racha_usuario(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sincronizar_racha_usuario(UUID) TO authenticated, service_role, postgres;

-- 4. Asegurar políticas RLS de lectura para historial_registros, usuarios y catalogo_acciones
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_acciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su historial" ON public.historial_registros;
CREATE POLICY "Usuarios pueden ver su historial" ON public.historial_registros
    FOR SELECT USING (auth.uid() = usuario_id);

-- 5. Programar tarea diaria en pg_cron a las 00:00 America/Guayaquil (05:00 UTC)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    -- Eliminar programación previa si existe para garantizar idempotencia
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'kawsay_reiniciar_rachas_diario';

    -- Ejecutar todos los días a las 05:00 UTC (00:00 hora de Guayaquil)
    PERFORM cron.schedule(
        'kawsay_reiniciar_rachas_diario',
        '0 5 * * *',
        $cron$SELECT public.reiniciar_rachas_vencidas();$cron$
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron no disponible o sin permisos en este entorno (%). La sincronización se ejecutará vía RPC.', SQLERRM;
END;
$$;

-- 6. Ejecutar saneamiento inmediato sobre los datos actuales
SELECT public.reiniciar_rachas_vencidas() AS rachas_vencidas_reiniciadas;

COMMIT;
