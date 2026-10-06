from pydantic import BaseModel
from typing import List

# Sub-modelo para que Chart.js o Recharts puedan pintar el gráfico de anillo fácilmente
class GraficoCategoria(BaseModel):
    categoria: str
    total_co2_kg: float

# Modelo principal del Dashboard
class DashboardResumen(BaseModel):
    nombre_usuario: str
    nivel_actual: int
    xp_total: int
    racha_dias: int
    impacto_global_co2: float
    impacto_global_calorias: float
    desglose_grafico: List[GraficoCategoria] = []