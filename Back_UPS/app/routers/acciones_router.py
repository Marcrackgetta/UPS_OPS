from fastapi import APIRouter, HTTPException, status
from datetime import date
from typing import List

# Importar configuraciones y base de datos
from app.core.database import supabase

# Importar Esquemas de validación (Pydantic)
from app.schemas.accion import AccionRegistrar, AccionRespuesta, TransaccionInfo, EstadoUsuario, RecompensaEducativa

# Importar Servicios Matemáticos
from app.services.metricas_service import calcular_impacto_neto
from app.services.racha_service import procesar_racha_diaria, calcular_nuevo_nivel

# Crear el enrutador (Router) para estas rutas específicas
router = APIRouter(prefix="/api/v1/acciones", tags=["Acciones e Impacto"])

# =============================================================================
# ENDPOINT 1: OBTENER EL CATÁLOGO DE ACCIONES (Para que el Front pinte los botones)
# =============================================================================
@router.get("/", summary="Lista todas las acciones ambientales disponibles")
def obtener_catalogo_acciones():
    """
    Devuelve los botones/acciones disponibles para el frontend.
    Filtra solo las acciones marcadas como 'activas'.
    """
    try:
        respuesta = supabase.table("catalogo_acciones").select("*").eq("activo", True).execute()
        return {"status": "success", "data": respuesta.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando el catálogo: {str(e)}")

# =============================================================================
# ENDPOINT 2: REGISTRAR UNA ACCIÓN (El corazón del proyecto)
# =============================================================================
@router.post("/registrar", response_model=AccionRespuesta, summary="Registra un hábito y calcula el impacto")
def registrar_accion(datos: AccionRegistrar):
    """
    Recibe el ID del usuario y el ID de la acción.
    Procesa toda la lógica (ODS 13, ODS 3, ODS 4) y devuelve el estado actualizado.
    """
    try:
        # 1. VALIDACIÓN: Buscar la acción solicitada en el catálogo
        accion_db = supabase.table("catalogo_acciones").select("*").eq("id", datos.accion_id).execute()
        if not accion_db.data:
            raise HTTPException(status_code=404, detail="La acción especificada no existe en el catálogo.")
        accion_info = accion_db.data[0]

        # 2. VALIDACIÓN: Buscar al usuario en la base de datos
        usuario_db = supabase.table("usuarios").select("*").eq("id", str(datos.usuario_id)).execute()
        if not usuario_db.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        perfil = usuario_db.data[0]

        # 3. LÓGICA DE NEGOCIO: Racha y Fechas
        fecha_hoy = date.today()
        fecha_ultimo = date.fromisoformat(perfil["fecha_ultimo_registro"][:10]) if perfil.get("fecha_ultimo_registro") else None
        
        # Usamos nuestro servicio puro en Python para calcular la racha
        nueva_racha = procesar_racha_diaria(fecha_ultimo, fecha_hoy, perfil["racha_dias"])

        # 4. LÓGICA DE NEGOCIO: Impacto y XP
        # Usamos nuestro servicio para el cálculo de CO2, Calorías y XP
        impacto_calculado = calcular_impacto_neto(accion_info, nueva_racha)
        
        # Acumular la XP nueva a la histórica
        nueva_xp_total = perfil["xp_acumulada"] + impacto_calculado["xp_ganada"]
        nuevo_nivel, subio_de_nivel = calcular_nuevo_nivel(nueva_xp_total, perfil["nivel_actual"])

        # 5. PERSISTENCIA: Guardar el historial en la base de datos
        supabase.table("historial_registros").insert({
            "usuario_id": str(datos.usuario_id),
            "accion_id": datos.accion_id,
            "co2_calculado": impacto_calculado["co2_calculado"],
            "calorias_calculadas": impacto_calculado["calorias_calculadas"],
            "xp_ganada": impacto_calculado["xp_ganada"],
            "fecha_registro": fecha_hoy.isoformat()
        }).execute()

        # 6. PERSISTENCIA: Actualizar el perfil del usuario
        supabase.table("usuarios").update({
            "xp_acumulada": nueva_xp_total,
            "nivel_actual": nuevo_nivel,
            "racha_dias": nueva_racha,
            "fecha_ultimo_registro": fecha_hoy.isoformat()
        }).eq("id", str(datos.usuario_id)).execute()

        # 7. GAMIFICACIÓN (ODS 4): Desbloquear un dato curioso aleatorio si aplica
        ods_asociado = accion_info.get("ods_principal", 13)
        leccion_db = supabase.table("catalogo_educativo").select("*").eq("ods", ods_asociado).lte("nivel_desbloqueo", nuevo_nivel).execute()
        
        recompensa = None
        if leccion_db.data:
            import random
            leccion = random.choice(leccion_db.data)
            recompensa = RecompensaEducativa(
                ods=leccion["ods"],
                titulo=leccion["titulo"],
                contenido=leccion["contenido"]
            )

        # 8. CONTRATO FINAL: Estructurar la respuesta en formato JSON exacto
        return AccionRespuesta(
            transaccion=TransaccionInfo(
                status="success",
                co2_ganado_kg=impacto_calculado["co2_calculado"],
                calorias_ganadas=impacto_calculado["calorias_calculadas"],
                xp_ganada=impacto_calculado["xp_ganada"]
            ),
            estado_usuario=EstadoUsuario(
                xp_total=nueva_xp_total,
                nivel_actual=nuevo_nivel,
                racha_dias=nueva_racha,
                subio_de_nivel=subio_de_nivel
            ),
            recompensa_educativa=recompensa
        )

    except HTTPException:
        raise
    except Exception as e:
        # Capturador de errores global para evitar que el servidor colapse
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")