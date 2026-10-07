"use client";
import { useState, useEffect } from 'react';
import { getDashboard, getCatalogoAcciones, registrarAccion, getHistorialRegistros } from '../lib/api';

export function useDashboard() {
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null);
  const [acciones, setAcciones] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recompensa, setRecompensa] = useState<any>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, catRes, histRes] = await Promise.all([
        getDashboard(),
        getCatalogoAcciones(),
        getHistorialRegistros()
      ]);
      setDashboard(dashRes);
      setAcciones(catRes.data || []);
      setHistory(histRes || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (accion_id: number) => {
    try {
      const res = await registrarAccion(accion_id);
      
      // Actualizar dashboard optimista
      setDashboard((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          impacto_global_co2: prev.impacto_global_co2 + res.transaccion.co2_ganado_kg,
          impacto_global_calorias: prev.impacto_global_calorias + res.transaccion.calorias_ganadas,
          xp_total: res.estado_usuario.xp_total,
          nivel_actual: res.estado_usuario.nivel_actual,
          racha_dias: res.estado_usuario.racha_dias
        };
      });

      // Mostrar recompensa si hay
      if (res.recompensa_educativa) {
        setRecompensa(res.recompensa_educativa);
        // setShowReward(true); // Desactivado para no ser intrusivo
      }
      
      return res;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar la acción');
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
    recompensa,
    showReward,
    handleAction,
    closeReward,
    refreshData: cargarDatos
  };
}
