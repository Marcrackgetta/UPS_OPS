from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

# 1. Modelo de ENTRADA (Lo que Jordan y Narváez nos envían en el POST)
class AccionRegistrar(BaseModel):
    usuario_id: UUID = Field(..., description="ID único del usuario proveniente de Supabase Auth")
    accion_id: int = Field(..., description="ID de la acción en el catálogo (ej. 2 para Bicicleta)")

# 2. Sub-modelos para estructurar la SALIDA
class TransaccionInfo(BaseModel):
    status: str = "success"
    co2_ganado_kg: float
    calorias_ganadas: float
    xp_ganada: int

class EstadoUsuario(BaseModel):
    xp_total: int
    nivel_actual: int
    racha_dias: int
    subio_de_nivel: bool

class RecompensaEducativa(BaseModel):
    ods: int
    titulo: str
    contenido: str

# 3. Modelo de SALIDA (El JSON final que FastAPI le entregará al Frontend)
class AccionRespuesta(BaseModel):
    transaccion: TransaccionInfo
    estado_usuario: EstadoUsuario
    recompensa_educativa: Optional[RecompensaEducativa] = None