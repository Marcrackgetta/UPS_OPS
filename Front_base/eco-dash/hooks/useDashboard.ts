"use client";
import { useState, useEffect, useCallback } from 'react';
import {
  getDashboard,
  getCatalogoAcciones,
  registrarAccion,
  getHistorialRegistros,
  mapHistorialItem,
  getFechaGuayaquilISO,
  HistoryItemRecord,
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

export interface RecompensaEducativaItem {
  ods: number;
  titulo: string;
  contenido: string;
}

export interface DashboardData {
  nombre_usuario: string;
  nivel_actual: number;
  xp_total: number;
  racha_dias: number;
  fecha_ultimo_registro?: string | null;
  impacto_global_co2: number;
  impacto_global_calorias: number;
  desglose_grafico?: Array<{ categoria: string; total_co2_kg: number }>;
  historial?: Array<Record<string, unknown>>;
  desglose_racha?: RachaDiaItem[];
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [acciones, setAcciones] = useState<CatalogoAccionItem[]>([]);
  const [history, setHistory] = useState<HistoryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [recompensa, setRecompensa] = useState<RecompensaEducativaItem | null>(null);
  const [showReward, setShowReward] = useState(false);

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

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHistoryError(null);
    try {
      const [dashRes, catRes] = await Promise.all([
        getDashboard(),
        getCatalogoAcciones(),
      ]);
      setDashboard(dashRes);
      setAcciones(catRes.data || []);

      if (Array.isArray(dashRes?.historial)) {
        setHistory(dashRes.historial.map((item: Record<string, unknown>) => mapHistorialItem(item)));
      } else {
        await cargarHistorial();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [cargarHistorial]);

  useEffect(() => {
    let active = true;
    Promise.all([getDashboard(), getCatalogoAcciones()])
      .then(async ([dashRes, catRes]) => {
        if (!active) return;
        setDashboard(dashRes);
        setAcciones(catRes.data || []);
        if (Array.isArray(dashRes?.historial)) {
          setHistory(dashRes.historial.map((item: Record<string, unknown>) => mapHistorialItem(item)));
        } else {
          await cargarHistorial();
        }
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
  }, [cargarHistorial]);

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

        return {
          ...prev,
          impacto_global_co2: Number((Number(prev.impacto_global_co2 || 0) + co2Ganado).toFixed(3)),
          impacto_global_calorias: Number((Number(prev.impacto_global_calorias || 0) + calGanadas).toFixed(2)),
          xp_total: res.estado_usuario.xp_total,
          nivel_actual: res.estado_usuario.nivel_actual,
          racha_dias: nuevaRacha,
          fecha_ultimo_registro: fechaHoy,
          desglose_racha: nuevoDesgloseRacha,
        };
      });

      if (res.recompensa_educativa) {
        setRecompensa(res.recompensa_educativa);
      }

      return res;
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al registrar la acción';
      setError(msg);
      throw err;
    }
  };

  const closeReward = () => {
    setShowReward(false);
    setRecompensa(null);
  };

  return {
    dashboard,
    history,
    acciones,
    loading,
    error,
    historyLoading,
    historyError,
    recompensa,
    showReward,
    handleAction,
    closeReward,
    refreshData: cargarDatos,
    refreshHistory: cargarHistorial,
  };
}
