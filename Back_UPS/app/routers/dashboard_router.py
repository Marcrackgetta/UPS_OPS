from fastapi import APIRouter, HTTPException
from uuid import UUID

# Importar base de datos
from app.core.database import supabase

# Importar el esquema que definimos antes
from app.schemas.dashboard import DashboardResumen, GraficoCategoria

# Crear el enrutador
router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard y Estadísticas"])

@router.get("/{usuario_id}", response_model=DashboardResumen, summary="Obtiene las métricas totales de un usuario")
def obtener_resumen_dashboard(usuario_id: UUID):
    """
    Consolida toda la información de un estudiante:
    - Nivel, XP y racha actual.
    - Suma total histórica de CO2 ahorrado y calorías quemadas.
    - Desglose de CO2 por categoría (Energía, Movilidad, Residuos) para gráficos.
    """
    try:
        # 1. Consultar el perfil del usuario
        usuario_db = supabase.table("usuarios").select("*").eq("id", str(usuario_id)).execute()
        if not usuario_db.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        perfil = usuario_db.data[0]

        # 2. Consultar el historial completo del usuario
        historial_db = supabase.table("historial_registros").select("co2_calculado, calorias_calculadas, catalogo_acciones(categoria)").eq("usuario_id", str(usuario_id)).execute()
        registros = historial_db.data

        # 3. Procesar los totales y agrupar para el gráfico
        total_co2 = 0.0
        total_calorias = 0.0
        categorias_acumuladas = {}

        for registro in registros:
            # Sumar totales
            co2 = float(registro.get("co2_calculado", 0))
            calorias = float(registro.get("calorias_calculadas", 0))
            total_co2 += co2
            total_calorias += calorias

            # Agrupar por categoría para el gráfico (Donut Chart)
            # Nota: Supabase devuelve las relaciones foráneas dentro de un diccionario
            categoria = registro.get("catalogo_acciones", {}).get("categoria", "OTROS")
            
            if categoria in categorias_acumuladas:
                categorias_acumuladas[categoria] += co2
            else:
                categorias_acumuladas[categoria] = co2

        # 4. Formatear los datos para el esquema GraficoCategoria
        desglose = [
            GraficoCategoria(categoria=cat, total_co2_kg=round(val, 3))
            for cat, val in categorias_acumuladas.items()
        ]

        # 5. Construir y devolver la respuesta final estructurada
        return DashboardResumen(
            nombre_usuario=perfil.get("nombre") or "Estudiante",
            nivel_actual=perfil["nivel_actual"],
            xp_total=perfil["xp_acumulada"],
            racha_dias=perfil["racha_dias"],
            impacto_global_co2=round(total_co2, 3),
            impacto_global_calorias=round(total_calorias, 2),
            desglose_grafico=desglose
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el dashboard: {str(e)}")