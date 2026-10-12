from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import supabase
from app.core.security import get_current_user
from app.schemas.dashboard import DashboardResumen, GraficoCategoria, HistorialItem, RachaDiaResumen
from app.services.racha_service import sincronizar_racha_usuario_db

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard y Estadísticas"])

def _construir_desglose_racha(registros: list, racha_vigente: int) -> list[RachaDiaResumen]:
    """
    Construye el resumen diario real de los días consecutivos que componen la racha activa.
    Si la racha está en 0, devuelve una lista vacía.
    """
    if racha_vigente <= 0 or not registros:
        return []

    agrupado_por_dia = {}
    for reg in registros:
        fecha_str = reg.get("fecha_registro") or (str(reg.get("created_at") or "")[:10])
        if not fecha_str or len(fecha_str) < 10:
            continue
        fecha_key = fecha_str[:10]
        if fecha_key not in agrupado_por_dia:
            agrupado_por_dia[fecha_key] = {"co2": 0.0, "cal": 0.0, "count": 0}
        agrupado_por_dia[fecha_key]["co2"] += float(reg.get("co2_calculado") or 0.0)
        agrupado_por_dia[fecha_key]["cal"] += float(reg.get("calorias_calculadas") or 0.0)
        agrupado_por_dia[fecha_key]["count"] += 1

    if not agrupado_por_dia:
        return []

    fechas_ordenadas = sorted(agrupado_por_dia.keys(), reverse=True)
    resultado = []
    fecha_previa = None

    for fecha_key in fechas_ordenadas:
        if len(resultado) >= racha_vigente:
            break
        try:
            fecha_obj = date.fromisoformat(fecha_key)
        except ValueError:
            continue

        if fecha_previa is not None and (fecha_previa - fecha_obj).days > 1:
            break

        datos_dia = agrupado_por_dia[fecha_key]
        resultado.append(
            RachaDiaResumen(
                fecha=fecha_key,
                co2_total_kg=round(datos_dia["co2"], 3),
                calorias_totales=round(datos_dia["cal"], 2),
                acciones_registradas=datos_dia["count"]
            )
        )
        fecha_previa = fecha_obj

    return resultado

@router.get("/me", response_model=DashboardResumen, summary="Obtiene las métricas totales del usuario autenticado")
def obtener_resumen_dashboard(current_user = Depends(get_current_user)):
    """
    Consolida toda la información del estudiante extraída de forma segura mediante su token JWT.
    Sincroniza la racha de días frente a la fecha actual (America/Guayaquil) y retorna el historial.
    """
    try:
        # 1. Consultar el perfil del usuario autenticado
        usuario_db = supabase.table("usuarios").select("*").eq("id", current_user.id).execute()
        if not usuario_db.data:
            raise HTTPException(status_code=404, detail="Perfil no encontrado.")
        perfil = usuario_db.data[0]

        # 2. Sincronizar racha vigente en PostgreSQL (RPC sincronizar_racha_usuario)
        racha_vigente = sincronizar_racha_usuario_db(
            supabase_client=supabase,
            usuario_id=current_user.id,
            racha_actual=perfil.get("racha_dias", 0),
            fecha_ultimo_registro=perfil.get("fecha_ultimo_registro")
        )

        # 3. Consultar el historial completo del usuario en una sola consulta
        historial_db = (
            supabase.table("historial_registros")
            .select(
                "id, accion_id, co2_calculado, calorias_calculadas, xp_ganada, fecha_registro, created_at, "
                "catalogo_acciones(titulo, categoria, ods_principal)"
            )
            .eq("usuario_id", current_user.id)
            .execute()
        )
        registros_crudos = historial_db.data or []

        # Ordenar de más reciente a más antiguo garantizando consistencia
        registros = sorted(
            registros_crudos,
            key=lambda r: (
                str(r.get("created_at") or r.get("fecha_registro") or ""),
                int(r.get("id")) if str(r.get("id") or "").isdigit() else 0
            ),
            reverse=True
        )

        # 4. Procesar los totales, historial detallado y agrupar para el gráfico
        total_co2 = 0.0
        total_calorias = 0.0
        categorias_acumuladas = {}
        historial_items = []

        for idx, registro in enumerate(registros):
            co2 = float(registro.get("co2_calculado") or 0.0)
            calorias = float(registro.get("calorias_calculadas") or 0.0)
            xp = int(registro.get("xp_ganada") or 0)
            total_co2 += co2
            total_calorias += calorias

            info_accion = registro.get("catalogo_acciones") or {}
            categoria = info_accion.get("categoria") or "OTROS"
            titulo = info_accion.get("titulo") or "Acción registrada"
            ods_principal = int(info_accion.get("ods_principal") or (3 if calorias > 0 else 13))

            categorias_acumuladas[categoria] = categorias_acumuladas.get(categoria, 0.0) + co2

            historial_items.append(
                HistorialItem(
                    id=registro.get("id", idx + 1),
                    accion_id=registro.get("accion_id"),
                    titulo=titulo,
                    categoria=categoria,
                    ods_principal=ods_principal,
                    co2_calculado=round(co2, 3),
                    calorias_calculadas=round(calorias, 2),
                    xp_ganada=xp,
                    fecha_registro=registro.get("fecha_registro"),
                    created_at=registro.get("created_at")
                )
            )

        # 5. Formatear para el gráfico y desglose de racha activa
        desglose = [
            GraficoCategoria(categoria=cat, total_co2_kg=round(val, 3))
            for cat, val in categorias_acumuladas.items()
        ]
        desglose_racha = _construir_desglose_racha(registros, racha_vigente)

        # 6. Devolver JSON seguro
        return DashboardResumen(
            nombre_usuario=perfil.get("nombre") or "Estudiante",
            nivel_actual=perfil.get("nivel_actual", 1),
            xp_total=perfil.get("xp_acumulada", 0),
            racha_dias=racha_vigente,
            fecha_ultimo_registro=perfil.get("fecha_ultimo_registro"),
            impacto_global_co2=round(total_co2, 3),
            impacto_global_calorias=round(total_calorias, 2),
            desglose_grafico=desglose,
            historial=historial_items,
            desglose_racha=desglose_racha
        )

    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al generar el dashboard.")