from pydantic import BaseModel
from typing import List, Optional, Union

# Sub-modelo para que Chart.js o Recharts puedan pintar el gráfico de anillo fácilmente
class GraficoCategoria(BaseModel):
    categoria: str
    total_co2_kg: float

# Sub-modelo para cada registro del historial del usuario
class HistorialItem(BaseModel):
    id: Union[int, str]
    accion_id: Optional[int] = None
    titulo: str
    categoria: str
    ods_principal: int = 13
    co2_calculado: float
    calorias_calculadas: float
    xp_ganada: int = 0
    fecha_registro: Optional[str] = None
    created_at: Optional[str] = None

# Sub-modelo para el desglose diario de la racha activa
class RachaDiaResumen(BaseModel):
    fecha: str
    co2_total_kg: float
    calorias_totales: float
    acciones_registradas: int = 1

# Modelo principal del Dashboard
class DashboardResumen(BaseModel):
    nombre_usuario: str
    nivel_actual: int
    xp_total: int
    racha_dias: int
    fecha_ultimo_registro: Optional[str] = None
    impacto_global_co2: float
    impacto_global_calorias: float
    desglose_grafico: List[GraficoCategoria] = []
    historial: List[HistorialItem] = []
    desglose_racha: List[RachaDiaResumen] = []