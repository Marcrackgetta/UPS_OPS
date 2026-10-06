from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Importar los enrutadores
from app.routers import acciones_router
from app.routers import dashboard_router

# Inicializar FastAPI
app = FastAPI(title=settings.PROJECT_NAME)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar los Routers a la aplicación principal
app.include_router(acciones_router.router)
app.include_router(dashboard_router.router) # <-- Nueva línea agregada

@app.get("/")
def raiz():
    return {"mensaje": "Motor Backend de Kawsay Eco-Dash en línea 🟢"}