with open('app/routers/acciones_router.py', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'fecha_ultimo = date.fromisoformat(perfil["fecha_ultimo_registro"]) if perfil.get("fecha_ultimo_registro") else None'
replacement = 'fecha_ultimo = date.fromisoformat(perfil["fecha_ultimo_registro"][:10]) if perfil.get("fecha_ultimo_registro") else None'
content = content.replace(target, replacement)

with open('app/routers/acciones_router.py', 'w', encoding='utf-8') as f:
    f.write(content)
