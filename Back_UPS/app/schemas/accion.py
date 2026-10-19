from pydantic import BaseModel, Field

# 1. Modelo de ENTRADA (No requiere usuario_id desde el cliente; se extrae del JWT)
class AccionRegistrar(BaseModel):
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

# 3. Modelo de SALIDA (El JSON final que FastAPI le entregará al Frontend)
class AccionRespuesta(BaseModel):
    transaccion: TransaccionInfo
    estado_usuario: EstadoUsuario