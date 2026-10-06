from fastapi import APIRouter, HTTPException, Depends
from typing import List
import random

from app.core.database import supabase
from app.core.security import get_current_user
from app.schemas.accion import AccionRegistrar, AccionRespuesta, TransaccionInfo, EstadoUsuario, RecompensaEducativa

router = APIRouter(prefix="/api/v1/acciones", tags=["Acciones e Impacto"])

@router.get("/", summary="Lista todas las acciones ambientales disponibles")
def obtener_catalogo_acciones():
    """
    Devuelve los botones/acciones disponibles para el frontend.
    Es público, no requiere autenticación.
    """
    try:
        respuesta = supabase.table("catalogo_acciones").select("*").eq("activo", True).execute()
        return {"status": "success", "data": respuesta.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al consultar el catálogo de acciones.")

@router.post("/registrar", response_model=AccionRespuesta, summary="Registra un hábito y calcula el impacto")
def registrar_accion(datos: AccionRegistrar, current_user = Depends(get_current_user)):
    """
    Recibe el ID de la acción. El ID de usuario se extrae del JWT validado.
    Llama al RPC de PostgreSQL para garantizar atomicidad.
    """
    try:
        # Llamar al RPC en Supabase usando el cliente oficial.
        # Pasamos el current_user.id que extrajimos de forma segura del JWT.
        res_rpc = supabase.rpc(
            "registrar_accion_usuario",
            {
                "p_usuario_id": current_user.id,
                "p_accion_id": datos.accion_id
            }
        ).execute()

        # El RPC devuelve un JSON estructurado con el resultado de la transacción.
        data = res_rpc.data
        if not data or data.get("status") != "success":
            raise HTTPException(status_code=400, detail="Error en la base de datos al registrar la acción.")

        # Obtener ODS para la recompensa educativa
        ods_asociado = data.get("ods_info", {}).get("ods", 13)
        nivel_actual = data.get("estado_usuario", {}).get("nivel_actual", 1)
        
        # Buscar recompensa educativa (ODS 4)
        leccion_db = supabase.table("catalogo_educativo").select("*").eq("ods", ods_asociado).lte("nivel_desbloqueo", nivel_actual).execute()
        recompensa = None
        
        if leccion_db.data:
            leccion = random.choice(leccion_db.data)
            recompensa = RecompensaEducativa(
                ods=leccion["ods"],
                titulo=leccion["titulo"],
                contenido=leccion["contenido"]
            )

        return AccionRespuesta(
            transaccion=TransaccionInfo(**data["transaccion"]),
            estado_usuario=EstadoUsuario(**data["estado_usuario"]),
            recompensa_educativa=recompensa
        )

    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        if "Acción no encontrada o inactiva" in err_msg:
            raise HTTPException(status_code=404, detail="Acción inactiva o inexistente.")
        if "Usuario no encontrado" in err_msg:
            raise HTTPException(status_code=404, detail="Usuario no encontrado en la base de datos.")
        
        raise HTTPException(status_code=500, detail="Error interno del servidor al procesar la acción.")