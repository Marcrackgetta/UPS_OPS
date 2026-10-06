-- =========================================================================================
-- FIX: Añadir columna email a la tabla usuarios si faltaba
-- =========================================================================================

BEGIN;

ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS email TEXT;

COMMIT;
