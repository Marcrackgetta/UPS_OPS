from fastapi import APIRouter, HTTPException, Depends

from app.core.database import supabase
from app.core.security import get_current_user
from app.schemas.accion import AccionRegistrar, AccionRespuesta, TransaccionInfo, EstadoUsuario
from app.services.metricas_service import calcular_impacto_neto

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
    except Exception:
        raise HTTPException(status_code=500, detail="Error al consultar el catálogo de acciones.")

@router.post("/registrar", response_model=AccionRespuesta, summary="Registra un hábito y calcula el impacto")
def registrar_accion(datos: AccionRegistrar, current_user = Depends(get_current_user)):
    """
    Recibe el ID de la acción. El ID de usuario se extrae del JWT validado.
    Llama al RPC de PostgreSQL para garantizar atomicidad y aplica bonificación de racha.
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

        trans_raw = dict(data.get("transaccion", {}))
        estado_usr = dict(data.get("estado_usuario", {}))
        racha_actual = int(estado_usr.get("racha_dias", 1))

        # Aplicar cálculo de impacto neto y bonificación del 10% XP por racha >= 5 días
        impacto_neto = calcular_impacto_neto(
            {
                "impacto_co2_kg": trans_raw.get("co2_ganado_kg", 0.0),
                "calorias_estimadas": trans_raw.get("calorias_ganadas", 0.0),
                "xp_otorgada": trans_raw.get("xp_ganada", 10),
            },
            racha_actual=racha_actual,
        )

        xp_base_rpc = int(trans_raw.get("xp_ganada", 0))
        xp_final = int(impacto_neto["xp_ganada"])
        xp_bonus_diff = max(0, xp_final - xp_base_rpc)

        nivel_actual = int(estado_usr.get("nivel_actual", 1))
        xp_total = int(estado_usr.get("xp_total", 0)) + xp_bonus_diff
        estado_usr["xp_total"] = xp_total
        trans_raw["co2_ganado_kg"] = impacto_neto["co2_calculado"]
        trans_raw["calorias_ganadas"] = impacto_neto["calorias_calculadas"]
        trans_raw["xp_ganada"] = xp_final

        # Persistir desbloqueos progresivos de ODS 4 (y bonificación de XP si aplica) en la tabla usuarios
        desbloqueados = [
            cid for cid, req_niv, req_xp in UMBRALES_CURIOSIDADES_ODS4
            if nivel_actual >= req_niv and xp_total >= req_xp
        ]
        campos_actualizacion = {"curiosidades_desbloqueadas": desbloqueados}
        if xp_bonus_diff > 0:
            campos_actualizacion["xp_total"] = xp_total
        try:
            supabase.table("usuarios").update(
                campos_actualizacion
            ).eq("id", current_user.id).execute()
        except Exception:
            pass

        return AccionRespuesta(
            transaccion=TransaccionInfo(**trans_raw),
            estado_usuario=EstadoUsuario(**estado_usr)
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