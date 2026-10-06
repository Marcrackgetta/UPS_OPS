with open('app/routers/acciones_router.py', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'leccion_db = supabase.table("catalogo_educativo").select("*").eq("ods", ods_asociado).lte("nivel_desbloqueo", nuevo_nivel).limit(1).execute()\n        \n        recompensa = None\n        if leccion_db.data:\n            leccion = leccion_db.data[0]'
replacement = 'leccion_db = supabase.table("catalogo_educativo").select("*").eq("ods", ods_asociado).lte("nivel_desbloqueo", nuevo_nivel).execute()\n        \n        recompensa = None\n        if leccion_db.data:\n            import random\n            leccion = random.choice(leccion_db.data)'
content = content.replace(target, replacement)

with open('app/routers/acciones_router.py', 'w', encoding='utf-8') as f:
    f.write(content)
