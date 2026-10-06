from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Importar los enrutadores
from app.routers import acciones_router
from app.routers import dashboard_router

# Inicializar FastAPI
app = FastAPI(title=settings.PROJECT_NAME)

# Configuración CORS
# Evitamos allow_origins=["*"] cuando usamos credenciales.
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler para no exponer detalles internos
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Por favor, intente más tarde."},
    )

# Conectar los Routers a la aplicación principal
app.include_router(acciones_router.router)
app.include_router(dashboard_router.router)

@app.get("/")
def raiz():
    return {"mensaje": "Motor Backend de Kawsay Eco-Dash en línea"}