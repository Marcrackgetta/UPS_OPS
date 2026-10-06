import os
from dotenv import load_dotenv

# Carga las variables de entorno desde el archivo .env a la memoria
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Kawsay Eco-Dash API"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")

# Instanciamos la clase para poder importarla en otros archivos
settings = Settings()