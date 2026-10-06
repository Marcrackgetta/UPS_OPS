from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import supabase

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependencia de FastAPI para validar el JWT mediante la API de Supabase Auth.
    Garantiza que el token es válido, no ha expirado, y devuelve el usuario.
    """
    token = credentials.credentials
    try:
        # Verificamos el token directamente contra Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_response.user
    except Exception as e:
        # Cualquier error de la API de auth (token expirado, malformado, etc.)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o no autorizadas",
            headers={"WWW-Authenticate": "Bearer"},
        )
