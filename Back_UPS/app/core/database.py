from supabase import create_client, Client
from app.core.config import settings

# Validación de seguridad: el servidor no arrancará si faltan las credenciales
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    raise ValueError("⚠️ ERROR: Faltan las credenciales de Supabase en el archivo .env")

# Inicialización del cliente oficial de Supabase
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)