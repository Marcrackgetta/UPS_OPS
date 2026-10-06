from fastapi import APIRouter, HTTPException, Depends
from app.core.database import supabase
from app.core.security import get_current_user
from app.schemas.dashboard import DashboardResumen, GraficoCategoria

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard y Estadísticas"])

@router.get("/me", response_model=DashboardResumen, summary="Obtiene las métricas totales del usuario autenticado")
def obtener_resumen_dashboard(current_user = Depends(get_current_user)):
    """
    Consolida toda la información del estudiante extraída de forma segura mediante su token JWT.
    """
    try:
        # 1. Consultar el perfil del usuario autenticado
        usuario_db = supabase.table("usuarios").select("*").eq("id", current_user.id).execute()
        if not usuario_db.data:
            raise HTTPException(status_code=404, detail="Perfil no encontrado.")
        perfil = usuario_db.data[0]

        # 2. Consultar el historial completo del usuario
        historial_db = supabase.table("historial_registros").select("co2_calculado, calorias_calculadas, catalogo_acciones(categoria)").eq("usuario_id", current_user.id).execute()
        registros = historial_db.data

        # 3. Procesar los totales y agrupar para el gráfico
        total_co2 = 0.0
        total_calorias = 0.0
        categorias_acumuladas = {}

        for registro in registros:
            co2 = float(registro.get("co2_calculado", 0))
            calorias = float(registro.get("calorias_calculadas", 0))
            total_co2 += co2
            total_calorias += calorias

            categoria = registro.get("catalogo_acciones", {}).get("categoria", "OTROS")
            categorias_acumuladas[categoria] = categorias_acumuladas.get(categoria, 0) + co2

        # 4. Formatear para el gráfico
        desglose = [
            GraficoCategoria(categoria=cat, total_co2_kg=round(val, 3))
            for cat, val in categorias_acumuladas.items()
        ]

        # 5. Devolver JSON seguro
        return DashboardResumen(
            nombre_usuario=perfil.get("nombre") or "Estudiante",
            nivel_actual=perfil.get("nivel_actual", 1),
            xp_total=perfil.get("xp_acumulada", 0),
            racha_dias=perfil.get("racha_dias", 0),
            impacto_global_co2=round(total_co2, 3),
            impacto_global_calorias=round(total_calorias, 2),
            desglose_grafico=desglose
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al generar el dashboard.")