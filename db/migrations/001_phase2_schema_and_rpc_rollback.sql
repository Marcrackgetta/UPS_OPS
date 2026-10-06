-- =========================================================================================
-- ROLLBACK: Fase 2
-- =========================================================================================

BEGIN;

-- 1. Eliminar Funciones RPC
DROP FUNCTION IF EXISTS public.registrar_accion_usuario(UUID, INTEGER);

-- 2. Eliminar Triggers
DROP TRIGGER IF EXISTS on_auth_user_created_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.on_auth_user_created();

-- 3. Eliminar Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Catálogo público para lectura" ON public.catalogo_acciones;
DROP POLICY IF EXISTS "Usuarios pueden ver su historial" ON public.historial_registros;

-- 4. Deshabilitar RLS
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalogo_acciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.historial_registros DISABLE ROW LEVEL SECURITY;

-- 5. Eliminar Tablas (Opcional si es rollback duro, sino omitir esto)
-- DROP TABLE IF EXISTS public.historial_registros CASCADE;
-- DROP TABLE IF EXISTS public.usuarios CASCADE;

COMMIT;
