from fastapi import APIRouter, HTTPException, Depends

from app.core.database import supabase
from app.core.security import get_current_user
from app.schemas.accion import AccionRegistrar, AccionRespuesta, TransaccionInfo, EstadoUsuario, RecompensaEducativa

router = APIRouter(prefix="/api/v1/acciones", tags=["Acciones e Impacto"])

UMBRALES_CURIOSIDADES_ODS4 = [
    (1, 1, 0),
    (2, 1, 50),
    (3, 2, 100),
    (4, 2, 200),
    (5, 3, 282),
    (6, 4, 519),
    (7, 5, 800),
]

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

        estado_usr = data.get("estado_usuario", {})
        nivel_actual = int(estado_usr.get("nivel_actual", 1))
        xp_total = int(estado_usr.get("xp_total", 0))

        # Persistir desbloqueos progresivos de ODS 4 en la tabla usuarios
        desbloqueados = [
            cid for cid, req_niv, req_xp in UMBRALES_CURIOSIDADES_ODS4
            if nivel_actual >= req_niv and xp_total >= req_xp
        ]
        try:
            supabase.table("usuarios").update(
                {"curiosidades_desbloqueadas": desbloqueados}
            ).eq("id", current_user.id).execute()
        except Exception:
            pass

        return AccionRespuesta(
            transaccion=TransaccionInfo(**data["transaccion"]),
            estado_usuario=EstadoUsuario(**data["estado_usuario"]),
            recompensa_educativa=None
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