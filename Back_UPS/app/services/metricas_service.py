from typing import Dict

# =============================================================================
# KAWSAY ECO-DASH - Cálculo de Impacto (ODS 13 y ODS 3)
# =============================================================================

def calcular_impacto_neto(datos_accion: dict, racha_actual: int = 1) -> Dict[str, float]:
    """
    Recibe los datos crudos del catálogo de acciones (factores base) 
    y calcula el impacto final, aplicando reglas de bonificación.
    """
    
    # Extracción segura de los valores base (evitando errores si faltan datos)
    co2_base = float(datos_accion.get('impacto_co2_kg', 0.0))
    calorias_base = float(datos_accion.get('calorias_estimadas', 0.0))
    xp_base = int(datos_accion.get('xp_otorgada', 10))
    
    # Regla de Negocio (Gamificación): 
    # Si el usuario mantiene una racha mayor a 5 días, gana 10% extra de XP.
    xp_final = xp_base
    if racha_actual >= 5:
        xp_final = int(xp_base * 1.1)
    
    return {
        "co2_calculado": co2_base,
        "calorias_calculadas": calorias_base,
        "xp_ganada": xp_final
    }