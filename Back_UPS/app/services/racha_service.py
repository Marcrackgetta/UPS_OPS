import math
from datetime import date
from typing import Tuple

# =============================================================================
# KAWSAY ECO-DASH - Lógica de Gamificación (ODS 4 y Sistema Base)
# =============================================================================

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
    Maneja la máquina de estados de los días consecutivos.
    Evita inflación fraudulenta de rachas en un mismo día.
    """
    if not fecha_ultimo_registro:
        # Es el primer registro en la historia del usuario
        return 1

    diferencia_dias = (fecha_actual - fecha_ultimo_registro).days

    if diferencia_dias == 0:
        # Ya registró algo hoy. La racha se mantiene intacta, no suma.
        return racha_actual
    elif diferencia_dias == 1:
        # Registró ayer y volvió a registrar hoy. La racha sube.
        return racha_actual + 1
    else:
        # Dejó de registrar más de un día. La racha se rompe.
        return 1