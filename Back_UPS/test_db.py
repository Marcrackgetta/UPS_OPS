import json
from app.core.database import supabase

def get_schema():
    print("Testing DB connection...")
    try:
        res = supabase.table('usuarios').select('*').limit(1).execute()
        print("Usuarios columns:", list(res.data[0].keys()) if res.data else "No data, but table exists.")
    except Exception as e:
        print("Error:", e)
        
    try:
        res = supabase.table('catalogo_acciones').select('*').limit(1).execute()
        print("Acciones columns:", list(res.data[0].keys()) if res.data else "No data.")
    except Exception as e:
        print("Error:", e)

    try:
        res = supabase.table('historial_registros').select('*').limit(1).execute()
        print("Historial columns:", list(res.data[0].keys()) if res.data else "No data.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    get_schema()
