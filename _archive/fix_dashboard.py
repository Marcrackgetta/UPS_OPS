with open('app/routers/dashboard_router.py', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'nombre_usuario=perfil["nombre"],'
replacement = 'nombre_usuario=perfil.get("nombre") or "Estudiante",'
content = content.replace(target, replacement)

with open('app/routers/dashboard_router.py', 'w', encoding='utf-8') as f:
    f.write(content)
