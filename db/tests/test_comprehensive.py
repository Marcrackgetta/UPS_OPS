import os
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("Back_UPS/.env")

url = os.environ.get("SUPABASE_URL")
key_anon = os.environ.get("SUPABASE_KEY_PUBLI")
key_service = os.environ.get("SUPABASE_KEY")

def run_tests():
    print("=== Iniciando Pruebas Exhaustivas Fase 2 ===\n")
    
    # 1. Clientes
    supabase_anon: Client = create_client(url, key_anon)
    supabase_admin: Client = create_client(url, key_service)

    # Variables
    test_email_1 = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_pass_1 = "TestPassword123!"
    test_email_2 = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_pass_2 = "TestPassword123!"

    user1_id = None
    user2_id = None
    
    try:
        # --- PRUEBA 1: Acceso Público al Catálogo ---
        print("[Prueba 1] Acceso a catalogo_acciones (RLS Publico)")
        res = supabase_anon.table("catalogo_acciones").select("*").limit(1).execute()
        if len(res.data) > 0:
            print("  OK: Lectura publica del catalogo habilitada.")
        else:
            print("  WARN: Catalogo vacio o RLS fallo.")

        # --- PRUEBA 2: Bloqueo a usuarios ---
        print("\n[Prueba 2] Bloqueo publico a usuarios")
        res = supabase_anon.table("usuarios").select("*").limit(1).execute()
        if len(res.data) == 0:
            print("  OK: Lectura publica de usuarios bloqueada por RLS.")
        else:
            print("  ERROR: RLS en usuarios no funciona.")

        # --- PRUEBA 3: Creacion automatica de perfil (Trigger) ---
        print("\n[Prueba 3] Trigger de creacion auth.users -> usuarios")
        auth_res1 = supabase_anon.auth.sign_up({"email": test_email_1, "password": test_pass_1})
        user1_id = auth_res1.user.id
        
        # Verificar en DB con admin
        user_db_res = supabase_admin.table("usuarios").select("*").eq("id", user1_id).execute()
        if len(user_db_res.data) == 1:
            print(f"  OK: Perfil {user1_id} creado automaticamente via Trigger.")
        else:
            print("  ERROR: No se creo el perfil en public.usuarios.")

        # Crear segundo usuario para pruebas cruzadas
        auth_res2 = supabase_anon.auth.sign_up({"email": test_email_2, "password": test_pass_2})
        user2_id = auth_res2.user.id

        # Para probar como usuario 2, necesitamos cliente con su sesion
        if auth_res2.session:
            # Login directo funciono (confirmacion de email desactivada)
            token2 = auth_res2.session.access_token
        else:
            # Forzar confirmacion via admin para obtener sesion
            supabase_admin.auth.admin.update_user_by_id(user2_id, {"email_confirm": True})
            auth_res2_login = supabase_anon.auth.sign_in_with_password({"email": test_email_2, "password": test_pass_2})
            token2 = auth_res2_login.session.access_token

        supabase_user2: Client = create_client(url, key_anon)
        supabase_user2.postgrest.auth(token2)

        # --- PRUEBA 4: Validacion auth.uid() y cruce de datos ---
        print("\n[Prueba 4] Intento de registrar accion para otro usuario (Cross-user)")
        try:
            # Usuario 2 intenta registrar para Usuario 1
            res = supabase_user2.rpc("registrar_accion_usuario", {"p_usuario_id": user1_id, "p_accion_id": 1}).execute()
            print("  ERROR: El RPC permitio registrar a nombre de otro usuario.")
        except Exception as e:
            if "No autorizado" in str(e):
                print("  OK: RPC rechazo correctamente por validacion de auth.uid().")
            else:
                print(f"  ERROR inesperado en cross-user: {e}")

        # --- PRUEBA 5: Registro RPC Exitoso (Rachas, XP) ---
        print("\n[Prueba 5] Registro RPC Valido (Atomicidad, Rachas, XP)")
        # Para esto, necesitamos que el user 2 registre para si mismo
        # Primero aseguramos que existe una accion con ID 1. 
        # Si no existe, usamos la primera que hallemos
        accion_id_test = 1
        cat_res = supabase_admin.table("catalogo_acciones").select("*").limit(1).execute()
        if len(cat_res.data) > 0:
            accion_id_test = cat_res.data[0]['id']
            xp_accion = cat_res.data[0]['xp_otorgada']
            print(f"  Usando accion_id={accion_id_test} que da {xp_accion} XP.")
            
            # Llamamos RPC
            res_rpc = supabase_user2.rpc("registrar_accion_usuario", {"p_usuario_id": user2_id, "p_accion_id": accion_id_test}).execute()
            data = res_rpc.data
            
            if data['status'] == 'success':
                estado = data['estado_usuario']
                if estado['racha_dias'] == 1 and estado['xp_total'] == xp_accion:
                    print(f"  OK: Registro exitoso. Racha={estado['racha_dias']}, XP={estado['xp_total']}")
                else:
                    print(f"  WARN: Registro exitoso pero con valores raros: {estado}")
            else:
                print(f"  ERROR en RPC: {data}")
        else:
            print("  WARN: No hay acciones en el catalogo para probar.")

        # --- PRUEBA 6: Accion Inactiva ---
        print("\n[Prueba 6] Registro de accion inexistente o inactiva")
        try:
            res_rpc2 = supabase_user2.rpc("registrar_accion_usuario", {"p_usuario_id": user2_id, "p_accion_id": 99999}).execute()
            print("  ERROR: RPC permitio accion inexistente.")
        except Exception as e:
            if "Accion no encontrada o inactiva" in str(e) or "Acción no encontrada" in str(e):
                print("  OK: RPC bloqueo accion invalida.")
            else:
                print(f"  ERROR inesperado inactiva: {e}")

    except Exception as e:
        print(f"\nExcepcion General durante pruebas: {e}")

    finally:
        print("\n[Limpieza] Eliminando usuarios de prueba...")
        if user1_id:
            try:
                supabase_admin.auth.admin.delete_user(user1_id)
            except: pass
        if user2_id:
            try:
                supabase_admin.auth.admin.delete_user(user2_id)
            except: pass
        print("=== Fin de Pruebas ===")

if __name__ == '__main__':
    run_tests()
