import math
from datetime import date, datetime, timezone, timedelta
from typing import Tuple, Optional, Any

try:
    from zoneinfo import ZoneInfo
    ZONA_GUAYAQUIL = ZoneInfo("America/Guayaquil")
except Exception:
    ZONA_GUAYAQUIL = timezone(timedelta(hours=-5))

# =============================================================================
# KAWSAY ECO-DASH - Lógica de Gamificación (ODS 4 y Sistema Base)
# =============================================================================

def obtener_fecha_actual_guayaquil() -> date:
    """
    Devuelve la fecha actual en la zona horaria oficial del proyecto (America/Guayaquil, UTC-5).
    """
    return datetime.now(ZONA_GUAYAQUIL).date()

def _parse_fecha(valor: Optional[date | str]) -> Optional[date]:
    if valor is None:
        return None
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    if isinstance(valor, str):
        texto = valor.strip()
        if not texto:
            return None
        return date.fromisoformat(texto[:10])
    return None

def calcular_nuevo_nivel(xp_total: int, nivel_actual: int) -> Tuple[int, bool]:
    """
    Calcula si la XP acumulada supera el umbral del nivel actual.
    Fórmula de progresión: XP_Requerida = 100 * (Nivel ^ 1.5)
    """
    # Se calcula la XP necesaria para alcanzar el SIGUIENTE nivel
    xp_necesaria_siguiente = int(100 * math.pow(nivel_actual, 1.5))
    
    if xp_total >= xp_necesaria_siguiente:
        return nivel_actual + 1, True # Sube de nivel
    
    return nivel_actual, False # Se mantiene en el mismo nivel

def procesar_racha_diaria(fecha_ultimo_registro: date, fecha_actual: date, racha_actual: int) -> int:
    """
    Maneja la máquina de estados de los días consecutivos al registrar una acción.
    Evita inflación fraudulenta de rachas en un mismo día.
    """
    fecha_ult = _parse_fecha(fecha_ultimo_registro)
    fecha_act = _parse_fecha(fecha_actual) or obtener_fecha_actual_guayaquil()

    if not fecha_ult:
        # Es el primer registro en la historia del usuario
        return 1

    diferencia_dias = (fecha_act - fecha_ult).days

    if diferencia_dias <= 0:
        # Ya registró algo hoy (o marca futura por desfase). La racha se mantiene intacta, no suma.
        return max(racha_actual, 1)
    elif diferencia_dias == 1:
        # Registró ayer y volvió a registrar hoy. La racha sube.
        return racha_actual + 1
    else:
        # Dejó de registrar más de un día. La racha se rompe y reinicia en 1 por el registro de hoy.
        return 1

def calcular_racha_vigente(
    fecha_ultimo_registro: Optional[date | str],
    racha_actual: int,
    fecha_actual: Optional[date | str] = None
) -> int:
    """
    Determina la racha real vigente en lectura sin requerir que el usuario registre una acción.
    Si transcurrió más de 1 día calendario en America/Guayaquil desde el último registro,
    la racha se considera vencida y retorna 0.
    """
    if not racha_actual or racha_actual <= 0:
        return 0

    fecha_ult = _parse_fecha(fecha_ultimo_registro)
    if not fecha_ult:
        return 0

    fecha_act = _parse_fecha(fecha_actual) or obtener_fecha_actual_guayaquil()
    diferencia_dias = (fecha_act - fecha_ult).days

    if diferencia_dias <= 1:
        return int(racha_actual)
    return 0

def sincronizar_racha_usuario_db(
    supabase_client: Any,
    usuario_id: str,
    racha_actual: int = 0,
    fecha_ultimo_registro: Optional[date | str] = None
) -> int:
    """
    Sincroniza y obtiene la racha vigente delegando la validación y persistencia
    atómica a la función RPC public.sincronizar_racha_usuario en PostgreSQL.
    """
    racha_base = int(racha_actual or 0)
    fecha_ult = _parse_fecha(fecha_ultimo_registro)

    # Si la racha ya es 0 en BD y no hay actividad, evitamos consultas innecesarias
    if racha_base <= 0 and fecha_ult is None:
        return 0

    try:
        res_rpc = supabase_client.rpc(
            "sincronizar_racha_usuario",
            {"p_usuario_id": str(usuario_id)}
        ).execute()
        if isinstance(res_rpc.data, int) and not isinstance(res_rpc.data, bool):
            return res_rpc.data
    except Exception as exc:
        err_msg = str(exc)
        if "No autorizado" in err_msg:
            raise PermissionError("No autorizado para sincronizar la racha de otro usuario.") from exc
        if "Usuario no encontrado" in err_msg:
            raise LookupError("Usuario no encontrado al sincronizar la racha.") from exc

    # Respaldo determinista si el cliente está mockeado parcialmente en tests
    racha_calculada = calcular_racha_vigente(fecha_ult, racha_base)
    if racha_base > 0 and racha_calculada == 0:
        try:
            supabase_client.table("usuarios").update({"racha_dias": 0}).eq("id", str(usuario_id)).execute()
        except Exception:
            pass
    return racha_calculada