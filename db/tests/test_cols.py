from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv("Back_UPS/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

res = supabase.table("usuarios").select("*").limit(1).execute()
print("Cols:", list(res.data[0].keys()) if res.data else "No rows to read cols from")
