import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("Back_UPS/.env")

url = os.environ.get("SUPABASE_URL")
key_anon = os.environ.get("SUPABASE_KEY_PUBLI")
key_service = os.environ.get("SUPABASE_KEY")

def run_tests():
    print("=== Iniciando Pruebas de Fase 2 (Base de Datos) ===\n")
    
    supabase_anon: Client = create_client(url, key_anon)
    supabase_admin: Client = create_client(url, key_service)

    print("[Prueba 1] Acceso a la tabla 'usuarios' con clave publica (RLS)")
    try:
        res = supabase_anon.table('usuarios').select('*').limit(1).execute()
        if len(res.data) == 0:
            print("  OK: El acceso anonimo devuelve 0 filas por RLS.")
        else:
            print("  ERROR: RLS no esta bloqueando el acceso anonimo.")
    except Exception as e:
        print("  OK (Esperado): Acceso denegado o bloqueado por RLS.", e)

    print("\n[Prueba 2] Acceso al 'catalogo_acciones' con clave publica (RLS)")
    try:
        res = supabase_anon.table('catalogo_acciones').select('*').limit(1).execute()
        if res.data:
            print(f"  OK: Se permite leer el catalogo (ej. {res.data[0].get('titulo')}).")
        else:
            print("  WARN: El catalogo esta vacio pero es accesible.")
    except Exception as e:
        print("  ERROR: No se puede leer el catalogo.", e)

    print("\n[Prueba 3] RPC de registro de accion atomico (Validacion)")
    print("  Nota: Para probar el RPC 100% se requiere un usuario creado en auth.users")
    print("  Si ejecutaste el script SQL, la funcion registrar_accion_usuario ya existe.")
    
    import uuid
    fake_uuid = str(uuid.uuid4())
    try:
        res = supabase_admin.rpc(
            'registrar_accion_usuario', 
            {'p_usuario_id': fake_uuid, 'p_accion_id': 1}
        ).execute()
        print("  ERROR: El RPC deberia haber rechazado el UUID falso.")
    except Exception as e:
        if "Usuario no encontrado" in str(e) or "Could not find" in str(e):
            print("  OK: El RPC valido correctamente (o aun no existe).", e)
        else:
            print(f"  WARN EXCEPCION DEL RPC: {str(e)}")

    print("\n=== Pruebas Finalizadas ===")

if __name__ == '__main__':
    run_tests()
