"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getDashboard,
  getCatalogoAcciones,
  registrarAccion,
  getHistorialRegistros,
  mapHistorialItem,
  getFechaGuayaquilISO,
  HistoryItemRecord,
  CURIOSIDADES_ODS4_CATALOGO,
  CuriosidadODSItem,
  calcularIdsCuriosidadesDesbloqueadas,
  sincronizarPerfilYProgresoSupabase,
  persistirCuriosidadesSupabase,
} from '../lib/api';

export interface CatalogoAccionItem {
  id: number;
  codigo?: string;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  impacto_co2_kg: number;
  calorias_estimadas?: number;
  xp_otorgada: number;
  ods_principal?: number;
}

export interface RachaDiaItem {
  fecha: string;
  co2_total_kg: number;
  calorias_totales: number;
  acciones_registradas: number;
}

export interface CuriosidadODSConEstado extends CuriosidadODSItem {
  desbloqueado: boolean;
  progresoPct: number;
  xpFaltante: number;
}

export interface DashboardData {
  nombre_usuario: string;
  apellido_usuario?: string | null;
  nivel_actual: number;
  xp_total: number;
  racha_dias: number;
  fecha_ultimo_registro?: string | null;
  impacto_global_co2: number;
  impacto_global_calorias: number;
  curiosidades_desbloqueadas?: number[];
  desglose_grafico?: Array<{ categoria: string; total_co2_kg: number }>;
  historial?: Array<Record<string, unknown>>;
  desglose_racha?: RachaDiaItem[];
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [acciones, setAcciones] = useState<CatalogoAccionItem[]>([]);
  const [history, setHistory] = useState<HistoryItemRecord[]>([]);
  const [unlockedOdsIds, setUnlockedOdsIds] = useState<number[]>([1]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const cargarHistorial = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const histRes = await getHistorialRegistros();
      setHistory(histRes || []);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al cargar el historial';
      setHistoryError(msg);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const hidratarDashboardYPerfil = useCallback(
    async (dashRes: DashboardData, catData: CatalogoAccionItem[], isActive: () => boolean = () => true) => {
      const syncInfo = await sincronizarPerfilYProgresoSupabase(
        dashRes?.nombre_usuario,
        Number(dashRes?.nivel_actual || 1),
        Number(dashRes?.xp_total || 0),
        dashRes?.curiosidades_desbloqueadas
      );
      if (!isActive()) return;

      setUnlockedOdsIds(syncInfo.curiosidadesDesbloqueadas);
      setDashboard({
        ...dashRes,
        nombre_usuario: syncInfo.nombre,
        apellido_usuario: syncInfo.apellido ?? dashRes?.apellido_usuario ?? null,
        curiosidades_desbloqueadas: syncInfo.curiosidadesDesbloqueadas,
      });
      setAcciones(catData || []);

      if (Array.isArray(dashRes?.historial)) {
        setHistory(dashRes.historial.map((item: Record<string, unknown>) => mapHistorialItem(item)));
      } else {
        await cargarHistorial();
      }
    },
    [cargarHistorial]
  );

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHistoryError(null);
    try {
      const [dashRes, catRes] = await Promise.all([
        getDashboard(),
        getCatalogoAcciones(),
      ]);
      await hidratarDashboardYPerfil(dashRes, catRes.data || []);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [hidratarDashboardYPerfil]);

  useEffect(() => {
    let active = true;
    Promise.all([getDashboard(), getCatalogoAcciones()])
      .then(async ([dashRes, catRes]) => {
        if (!active) return;
        await hidratarDashboardYPerfil(dashRes, catRes.data || [], () => active);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Error al cargar los datos';
        setError(msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hidratarDashboardYPerfil]);

  const handleAction = async (accion_id: number) => {
    try {
      const res = await registrarAccion(accion_id);
      const fechaHoy = getFechaGuayaquilISO(new Date());
      const accionInfo = acciones.find((a) => Number(a.id) === Number(accion_id));

      const co2Ganado = Number(res.transaccion?.co2_ganado_kg ?? accionInfo?.impacto_co2_kg ?? 0);
      const calGanadas = Number(res.transaccion?.calorias_ganadas ?? accionInfo?.calorias_estimadas ?? 0);
      const xpGanada = Number(res.transaccion?.xp_ganada ?? accionInfo?.xp_otorgada ?? 0);

      const nuevoItem = mapHistorialItem({
        id: `temp-${Date.now()}`,
        accion_id,
        titulo: accionInfo?.titulo || 'Acción registrada',
        categoria: accionInfo?.categoria || 'CLIMA',
        ods_principal: accionInfo?.ods_principal ?? (calGanadas > 0 ? 3 : 13),
        co2_calculado: co2Ganado,
        calorias_calculadas: calGanadas,
        xp_ganada: xpGanada,
        fecha_registro: fechaHoy,
        created_at: new Date().toISOString(),
      });

      setHistory((prev) => [nuevoItem, ...prev]);
      setHistoryError(null);

      const nuevoNivel = Number(res.estado_usuario?.nivel_actual ?? dashboard?.nivel_actual ?? 1);
      const nuevaXp = Number(res.estado_usuario?.xp_total ?? (Number(dashboard?.xp_total || 0) + xpGanada));
      const nuevosDesbloqueados = calcularIdsCuriosidadesDesbloqueadas(nuevoNivel, nuevaXp, unlockedOdsIds);

      if (nuevosDesbloqueados.length !== unlockedOdsIds.length) {
        setUnlockedOdsIds(nuevosDesbloqueados);
        void persistirCuriosidadesSupabase(nuevosDesbloqueados);
      }

      setDashboard((prev) => {
        if (!prev) return prev;
        const nuevaRacha = Number(res.estado_usuario?.racha_dias ?? prev.racha_dias ?? 1);
        const desglosePrevio: RachaDiaItem[] = Array.isArray(prev.desglose_racha) ? [...prev.desglose_racha] : [];
        const idxHoy = desglosePrevio.findIndex((d) => d.fecha === fechaHoy);

        let nuevoDesgloseRacha: RachaDiaItem[];
        if (idxHoy >= 0) {
          nuevoDesgloseRacha = desglosePrevio.map((d, i) =>
            i === idxHoy
              ? {
                  ...d,
                  co2_total_kg: Number((Number(d.co2_total_kg || 0) + co2Ganado).toFixed(3)),
                  calorias_totales: Number((Number(d.calorias_totales || 0) + calGanadas).toFixed(2)),
                  acciones_registradas: Number(d.acciones_registradas || 0) + 1,
                }
              : d
          );
        } else {
          nuevoDesgloseRacha = [
            {
              fecha: fechaHoy,
              co2_total_kg: Number(co2Ganado.toFixed(3)),
              calorias_totales: Number(calGanadas.toFixed(2)),
              acciones_registradas: 1,
            },
            ...desglosePrevio,
          ].slice(0, Math.max(nuevaRacha, 1));
        }

        const catAccion = String(accionInfo?.categoria || 'CLIMA').toUpperCase();
        const graficoPrevio = Array.isArray(prev.desglose_grafico) ? [...prev.desglose_grafico] : [];
        let nuevoDesgloseGrafico = graficoPrevio;
        if (co2Ganado > 0) {
          const idxCat = graficoPrevio.findIndex(
            (g) => String(g.categoria || '').toUpperCase() === catAccion
          );
          if (idxCat >= 0) {
            nuevoDesgloseGrafico = graficoPrevio.map((g, i) =>
              i === idxCat
                ? {
                    ...g,
                    total_co2_kg: Number((Number(g.total_co2_kg || 0) + co2Ganado).toFixed(3)),
                  }
                : g
            );
          } else {
            nuevoDesgloseGrafico = [
              ...graficoPrevio,
              { categoria: catAccion, total_co2_kg: Number(co2Ganado.toFixed(3)) },
            ];
          }
        }

        return {
          ...prev,
          impacto_global_co2: Number((Number(prev.impacto_global_co2 || 0) + co2Ganado).toFixed(3)),
          impacto_global_calorias: Number((Number(prev.impacto_global_calorias || 0) + calGanadas).toFixed(2)),
          xp_total: nuevaXp,
          nivel_actual: nuevoNivel,
          racha_dias: nuevaRacha,
          fecha_ultimo_registro: fechaHoy,
          curiosidades_desbloqueadas: nuevosDesbloqueados,
          desglose_racha: nuevoDesgloseRacha,
          desglose_grafico: nuevoDesgloseGrafico,
        };
      });

      return res;
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al registrar la acción';
      setError(msg);
      throw err;
    }
  };

  const curiosidadesOds: CuriosidadODSConEstado[] = useMemo(() => {
    const niv = Number(dashboard?.nivel_actual || 1);
    const xp = Number(dashboard?.xp_total || 0);
    const idsActivos = new Set(calcularIdsCuriosidadesDesbloqueadas(niv, xp, unlockedOdsIds));

    return CURIOSIDADES_ODS4_CATALOGO.map((item) => {
      const desbloqueado = idsActivos.has(item.id);
      const progresoPct =
        desbloqueado || item.reqXp <= 0
          ? 100
          : Math.min(99, Math.max(0, Math.round((xp / item.reqXp) * 100)));
      const xpFaltante = desbloqueado ? 0 : Math.max(0, item.reqXp - xp);

      return {
        ...item,
        desbloqueado,
        progresoPct,
        xpFaltante,
      };
    });
  }, [dashboard?.nivel_actual, dashboard?.xp_total, unlockedOdsIds]);

  return {
    dashboard,
    history,
    acciones,
    curiosidadesOds,
    loading,
    error,
    historyLoading,
    historyError,
    handleAction,
    refreshData: cargarDatos,
    refreshHistory: cargarHistorial,
  };
}

