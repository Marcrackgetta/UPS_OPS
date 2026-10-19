"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard, RachaDiaItem } from '../hooks/useDashboard';
import { getFechaGuayaquilISO } from '../lib/api';

import {
  BookOpen,
  Flame,
  Leaf,
  Wind,
  Clock,
  TrendingUp,
  Target,
  X,
  CalendarDays,
  Sparkles,
  RefreshCw,
  Activity,
  HeartPulse,
  SlidersHorizontal,
  Globe,
  TreePine,
  Car,
  Zap,
  LogOut,
  AlertCircle,
  Loader2,
  Lock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Home,
  Info,
  Users,
  GraduationCap,
} from 'lucide-react';
import Background from './Background';
import { AnimatedHeartIcon, AnimatedWindIcon } from './AnimatedIcons';
import { useAudio } from './AudioProvider';

type StreakDayItem = {
  id: string;
  date: string;
  co2: number;
  cal: number;
  count: number;
};

function formatearEtiquetaDiaRacha(fechaISO: string, hoyISO: string): string {
  const limpia = (fechaISO || '').slice(0, 10);
  if (!limpia) return 'Día activo';
  if (limpia === hoyISO) return 'Hoy';

  const partesHoy = hoyISO.split('-').map(Number);
  const partesFecha = limpia.split('-').map(Number);
  if (partesHoy.length === 3 && partesFecha.length === 3) {
    const utcHoy = Date.UTC(partesHoy[0], partesHoy[1] - 1, partesHoy[2]);
    const utcFecha = Date.UTC(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
    const diffDias = Math.round((utcHoy - utcFecha) / (1000 * 60 * 60 * 24));
    if (diffDias === 1) return 'Ayer';

    const fechaObj = new Date(utcFecha);
    return fechaObj.toLocaleDateString('es-EC', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
    });
  }
  return limpia;
}

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const { isMuted, toggleMute } = useAudio();
  const {
    dashboard,
    acciones,
    curiosidadesOds,
    history,
    loading,
    error,
    historyLoading,
    historyError,
    handleAction,
    refreshData,
    refreshHistory,
  } = useDashboard();

  const [isLoaded, setIsLoaded] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCuriositiesModal, setShowCuriositiesModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [goalCo2, setGoalCo2] = useState<number>(() => {
    if (typeof window === 'undefined') return 20;
    try {
      const savedCo2 = localStorage.getItem('kawsay_goal_co2');
      if (savedCo2 !== null) {
        const parsedCo2 = Number(savedCo2);
        if (!Number.isNaN(parsedCo2) && parsedCo2 >= 5 && parsedCo2 <= 100) {
          return parsedCo2;
        }
      }
    } catch {
      // Ignorar si localStorage no está disponible
    }
    return 20;
  });
  const [goalCalories, setGoalCalories] = useState<number>(() => {
    if (typeof window === 'undefined') return 2000;
    try {
      const savedCal = localStorage.getItem('kawsay_goal_calories');
      if (savedCal !== null) {
        const parsedCal = Number(savedCal);
        if (!Number.isNaN(parsedCal) && parsedCal >= 500 && parsedCal <= 5000) {
          return parsedCal;
        }
      }
    } catch {
      // Ignorar si localStorage no está disponible
    }
    return 2000;
  });
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsLoaded(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Persistir metas diarias en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kawsay_goal_co2', String(goalCo2));
      localStorage.setItem('kawsay_goal_calories', String(goalCalories));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [goalCo2, goalCalories]);

  // Auto-ocultar notificación toast de XP
  useEffect(() => {
    if (!actionToast) return;
    const timer = setTimeout(() => setActionToast(null), 3500);
    return () => clearTimeout(timer);
  }, [actionToast]);

  const streak = Number(dashboard?.racha_dias || 0);

  const streakData: StreakDayItem[] = useMemo(() => {
    if (streak <= 0) return [];
    const hoyISO = getFechaGuayaquilISO(new Date());

    // 1. Preferir el desglose de racha calculado por el backend
    if (Array.isArray(dashboard?.desglose_racha) && dashboard.desglose_racha.length > 0) {
      return dashboard.desglose_racha.slice(0, streak).map((d: RachaDiaItem, index: number) => ({
        id: String(d.fecha || index),
        date: formatearEtiquetaDiaRacha(String(d.fecha || ''), hoyISO),
        co2: Number(Number(d.co2_total_kg || 0).toFixed(2)),
        cal: Math.round(Number(d.calorias_totales || 0)),
        count: Number(d.acciones_registradas || 1),
      }));
    }

    // 2. Respaldo a partir del historial real cargado si no vino desglose_racha
    if (!history || history.length === 0) return [];

    const agrupado = new Map<string, { co2: number; cal: number; count: number }>();
    for (const item of history) {
      const key = (item.fecha_registro || '').slice(0, 10);
      if (!key) continue;
      const actual = agrupado.get(key) || { co2: 0, cal: 0, count: 0 };
      actual.co2 += Number(item.co2 || 0);
      actual.cal += Number(item.cal || 0);
      actual.count += 1;
      agrupado.set(key, actual);
    }

    const fechasOrdenadas = Array.from(agrupado.keys()).sort((a, b) => b.localeCompare(a));
    const resultado: StreakDayItem[] = [];
    let fechaPreviaUTC: number | null = null;

    for (const fechaKey of fechasOrdenadas) {
      if (resultado.length >= streak) break;
      const partes = fechaKey.split('-').map(Number);
      if (partes.length !== 3) continue;
      const fechaUTC = Date.UTC(partes[0], partes[1] - 1, partes[2]);

      if (fechaPreviaUTC !== null) {
        const diffDias = Math.round((fechaPreviaUTC - fechaUTC) / (1000 * 60 * 60 * 24));
        if (diffDias > 1) break;
      }

      const info = agrupado.get(fechaKey)!;
      resultado.push({
        id: fechaKey,
        date: formatearEtiquetaDiaRacha(fechaKey, hoyISO),
        co2: Number(info.co2.toFixed(2)),
        cal: Math.round(info.cal),
        count: info.count,
      });
      fechaPreviaUTC = fechaUTC;
    }

    return resultado;
  }, [streak, dashboard, history]);

  // Progreso del día actual extraído de desglose_racha[0] (comparado contra las metas diarias)
  const hoyISO = getFechaGuayaquilISO(new Date());
  const rachaDiaActual = dashboard?.desglose_racha?.[0];
  const rachaCorrespondeAHoy =
    rachaDiaActual && (!rachaDiaActual.fecha || String(rachaDiaActual.fecha).slice(0, 10) === hoyISO);

  const dailyCo2 = Number(
    Number(
      rachaCorrespondeAHoy
        ? rachaDiaActual.co2_total_kg
        : streakData[0]?.date === 'Hoy'
        ? streakData[0].co2
        : 0
    ).toFixed(2)
  );
  const dailyCal = Math.round(
    Number(
      rachaCorrespondeAHoy
        ? rachaDiaActual.calorias_totales
        : streakData[0]?.date === 'Hoy'
        ? streakData[0].cal
        : 0
    )
  );

  const showVictoryModal = dailyCo2 >= goalCo2 && dailyCal >= goalCalories && !victoryDismissed;

  const anyModalOpen =
    showGoalModal ||
    showVictoryModal ||
    showStreakModal ||
    showHistoryModal ||
    showCuriositiesModal ||
    showImpactModal ||
    showCreditsModal;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyModalOpen]);

  const closeAllModals = () => {
    setShowGoalModal(false);
    setShowStreakModal(false);
    setShowHistoryModal(false);
    setShowCuriositiesModal(false);
    setShowImpactModal(false);
    setShowCreditsModal(false);
  };

  useEffect(() => {
    if (!anyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllModals();
        if (showVictoryModal) {
          setVictoryDismissed(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anyModalOpen, showVictoryModal]);

  const categoryBreakdown = useMemo(() => {
    const palette: Record<string, { label: string; color: string; barClass: string }> = {
      TRANSPORTE: { label: 'Movilidad Sostenible', color: '#10b981', barClass: 'from-emerald-400 to-green-600' },
      MOVILIDAD: { label: 'Movilidad Sostenible', color: '#10b981', barClass: 'from-emerald-400 to-green-600' },
      ENERGIA: { label: 'Ahorro de Energía', color: '#f59e0b', barClass: 'from-amber-400 to-orange-500' },
      RESIDUOS: { label: 'Reciclaje y Residuos', color: '#14b8a6', barClass: 'from-teal-400 to-emerald-500' },
      RECICLAJE: { label: 'Reciclaje y Residuos', color: '#14b8a6', barClass: 'from-teal-400 to-emerald-500' },
      AGUA: { label: 'Cuidado del Agua', color: '#06b6d4', barClass: 'from-cyan-400 to-teal-500' },
      ALIMENTACION: { label: 'Alimentación Consciente', color: '#84cc16', barClass: 'from-lime-400 to-green-500' },
      SALUD: { label: 'Salud y Bienestar', color: '#f97316', barClass: 'from-orange-400 to-rose-500' },
      CLIMA: { label: 'Acción por el Clima', color: '#22c55e', barClass: 'from-green-400 to-emerald-600' },
    };
    const defaultColors = ['#10b981', '#f59e0b', '#14b8a6', '#06b6d4', '#84cc16', '#f97316'];

    const rawList = Array.isArray(dashboard?.desglose_grafico) ? dashboard.desglose_grafico : [];
    const items = rawList
      .map((item, idx) => {
        const key = String(item.categoria || 'CLIMA').toUpperCase();
        const val = Number(Number(item.total_co2_kg || 0).toFixed(2));
        const meta = palette[key] || {
          label: key.charAt(0) + key.slice(1).toLowerCase(),
          color: defaultColors[idx % defaultColors.length],
          barClass: 'from-emerald-400 to-green-600',
        };
        return {
          categoria: key,
          label: meta.label,
          total_co2_kg: val,
          color: meta.color,
          barClass: meta.barClass,
        };
      })
      .filter((x) => x.total_co2_kg > 0)
      .sort((a, b) => b.total_co2_kg - a.total_co2_kg);

    const totalCo2Categorias = items.reduce((acc, cur) => acc + cur.total_co2_kg, 0);
    return items.map((item) => ({
      ...item,
      pct: totalCo2Categorias > 0 ? Math.round((item.total_co2_kg / totalCo2Categorias) * 100) : 0,
    }));
  }, [dashboard]);

  const onSelectAction = async (accion_id: number) => {
    if (submittingId !== null) return;
    setSubmittingId(accion_id);
    try {
      const accionInfo = acciones.find((a) => Number(a.id) === Number(accion_id));
      const res = await handleAction(accion_id);
      const xpGanada = Number(res?.transaccion?.xp_ganada ?? accionInfo?.xp_otorgada ?? 0);
      const co2Ganado = Number(res?.transaccion?.co2_ganado_kg ?? accionInfo?.impacto_co2_kg ?? 0);
      const calGanadas = Number(res?.transaccion?.calorias_ganadas ?? accionInfo?.calorias_estimadas ?? 0);
      const subioNivel = Boolean(res?.estado_usuario?.subio_de_nivel);

      setActionToast(
        subioNivel
          ? `¡Subiste a Nivel ${res?.estado_usuario?.nivel_actual}! +${xpGanada} XP • +${co2Ganado} kg CO2`
          : `¡Acción registrada! +${xpGanada} XP • +${co2Ganado} kg CO2${calGanadas > 0 ? ` • +${calGanadas} kcal` : ''}`
      );
    } catch {
      // El estado de error ya se actualiza en useDashboard
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-950 to-teal-950 flex items-center justify-center text-white font-bold gap-3 p-4">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span>Cargando tu progreso...</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-950 to-teal-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center text-white shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-black mb-2">No pudimos cargar tu dashboard</h2>
          <p className="text-emerald-100/80 text-sm mb-6">{error || 'Verifica tu conexión e inténtalo de nuevo.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={refreshData}
              className="min-h-[44px] px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer"
            >
              Reintentar
            </button>
            <button
              onClick={onLogout}
              className="min-h-[44px] px-5 py-3 rounded-2xl bg-rose-500/30 hover:bg-rose-500 text-white font-bold text-sm transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const co2 = Number((dashboard.impacto_global_co2 || 0).toFixed(2));
  const calories = Math.round(Number(dashboard.impacto_global_calorias || 0));
  const totalScore = dashboard.xp_total || 0;
  const nivel = dashboard.nivel_actual || 1;
  const nombre = (dashboard.nombre_usuario || '').trim() || 'Estudiante';
  const desbloqueadasCount = curiosidadesOds.filter((item) => item.desbloqueado).length;

  const co2Percent = Math.min((dailyCo2 / goalCo2) * 100, 100);
  const calPercent = Math.min((dailyCal / goalCalories) * 100, 100);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 text-stone-800 px-3.5 py-4 sm:p-6 md:p-8 font-sans selection:bg-green-500 selection:text-white overflow-x-hidden relative flex flex-col">
      <Background />

      {/* TOAST DE RETROALIMENTACIÓN AL GANAR XP */}
      {actionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-emerald-900/95 backdrop-blur-xl border-2 border-emerald-400 text-white px-5 py-3.5 rounded-2xl shadow-[0_15px_40px_rgba(16,185,129,0.45)] flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-emerald-500/30 p-2 rounded-xl border border-emerald-300/40 shrink-0">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-xs sm:text-sm font-black tracking-wide leading-snug">{actionToast}</p>
        </div>
      )}

      <div
        className={`max-w-6xl w-full mx-auto transition-all duration-1000 transform relative z-10 pb-8 md:pb-12 flex-1 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        {/* CABECERA PRINCIPAL */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 sm:mb-5 gap-4">
          <div className="min-w-0 w-full lg:w-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter flex flex-wrap items-center gap-x-2 gap-y-1 drop-shadow-lg">
              <span>Kawsay</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 drop-shadow-none">
                Eco-Dash
              </span>
            </h1>
            <p className="text-emerald-200/90 mt-1.5 sm:mt-2 font-medium text-sm sm:text-base md:text-lg flex items-start sm:items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse drop-shadow-md shrink-0 mt-0.5 sm:mt-0" />
              <span className="break-words leading-snug">
                Hola, <strong className="text-white font-extrabold">{nombre}</strong> • Tu huella verde de hoy
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="group flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3.5 sm:px-4 py-2.5 sm:py-3 min-h-[44px] rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:border-emerald-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-white font-bold text-xs sm:text-sm justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-300 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-300 shrink-0" />
              )}
              <span className="truncate">{isMuted ? 'Sonido Off' : 'Sonido On'}</span>
            </button>

            <button
              onClick={() => setShowGoalModal(true)}
              className="group flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3.5 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:border-emerald-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-white font-bold text-xs sm:text-sm justify-center"
            >
              <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 text-emerald-300 shrink-0" />
              <span className="truncate">Ajustar Metas</span>
            </button>

            <button
              onClick={() => setShowStreakModal(true)}
              className="group flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3.5 sm:px-5 py-2 sm:py-2.5 min-h-[44px] rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:border-orange-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer justify-center"
            >
              <div className="bg-gradient-to-tr from-orange-400 to-yellow-400 p-1.5 rounded-full shadow-[0_0_15px_rgba(251,146,60,0.5)] text-white group-hover:scale-110 transition-transform shrink-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
              </div>
              <span className="font-black text-base sm:text-lg md:text-xl text-white drop-shadow-md leading-none truncate">
                {streak}{' '}
                <span className="text-emerald-100 font-medium text-xs sm:text-sm md:text-base group-hover:text-white transition-colors">
                  {streak === 1 ? 'Día' : 'Días'}
                </span>
              </span>
            </button>

            <button
              onClick={onLogout}
              aria-label="Cerrar Sesión"
              className="group flex items-center gap-2 bg-rose-500/20 backdrop-blur-xl px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] rounded-full border border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-rose-500 hover:border-rose-400 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-rose-100 hover:text-white font-bold text-xs sm:text-sm justify-center"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGACIÓN ESTRUCTURADA SEMÁNTICA */}
        <nav
          aria-label="Navegación principal"
          className="mb-5 md:mb-7 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.15)] flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                closeAllModals();
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-300/40 text-white font-extrabold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAllModals();
                setShowImpactModal(true);
              }}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10 text-emerald-100 hover:text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-green-300 shrink-0" />
              <span>Impacto ODS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAllModals();
                setShowHistoryModal(true);
              }}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10 text-emerald-100 hover:text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-orange-300 shrink-0" />
              <span>Rachas / Historial</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeAllModals();
                setShowCuriositiesModal(true);
              }}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10 text-emerald-100 hover:text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Cápsulas ODS 4 ({desbloqueadasCount}/{curiosidadesOds.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              closeAllModals();
              setShowCreditsModal(true);
            }}
            className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/25 border border-white/20 text-emerald-100 hover:text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Créditos</span>
          </button>
        </nav>

        {/* BANNER PUNTAJE KAWSAY TOTAL */}
        <div className="mb-6 md:mb-8 bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(4,120,87,0.6)] border border-white/10 transition-all duration-500 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
          <div className="absolute -right-6 -top-6 text-white/20 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
            <Leaf className="w-40 h-40 sm:w-64 sm:h-64 drop-shadow-2xl" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 min-w-0">
            <div className="min-w-0">
              <h2 className="text-green-50 font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2 drop-shadow-md">
                <Target className="w-4 h-4 shrink-0" /> Puntaje Kawsay Total
              </h2>
              <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                <span className="text-4xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-xl tracking-tighter leading-none break-all">
                  {totalScore}
                </span>
                <span className="text-base sm:text-2xl font-bold text-green-900 mb-0.5 sm:mb-1 flex items-center bg-white/90 backdrop-blur-sm px-3 py-1 rounded-2xl shadow-lg border border-white">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 mr-1 shrink-0" /> pts
                </span>
              </div>
            </div>
            <div className="self-start sm:self-end bg-black/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl text-white font-black text-xs sm:text-sm uppercase tracking-widest">
              Nivel {nivel}
            </div>
          </div>
        </div>


        {/* GRILLA PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 relative">
          <div className="lg:col-span-2 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
              {/* TARJETA ODS 13: CO2 */}
              <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-5 sm:mb-6">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 p-3.5 sm:p-4 rounded-2xl shadow-inner transition-transform duration-300 border border-white">
                      <AnimatedWindIcon className="w-6 h-6 md:w-8 md:h-8 text-green-700" />
                    </div>
                    <span className="text-green-700 font-black bg-white px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-green-200 shadow-sm">
                      ODS 13
                    </span>
                  </div>
                  <h3 className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-1">CO2 Evitado Hoy</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl sm:text-5xl font-black text-stone-800 tracking-tighter">{dailyCo2}</span>
                    <span className="text-stone-500 font-bold">kg</span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-bold mb-3">
                    Acumulado histórico: {co2} kg
                  </p>
                  <div className="w-full bg-stone-200/50 rounded-full h-4 mb-2 overflow-hidden shadow-inner border border-stone-200/50">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.8)] relative"
                      style={{ width: `${co2Percent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>

                {dailyCo2 >= goalCo2 ? (
                  <div className="mt-3 bg-green-100/90 border border-green-300 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                    <Sparkles className="w-4 h-4 text-green-600 animate-pulse shrink-0" />
                    <span className="text-green-700 font-black text-xs uppercase tracking-widest">
                      ¡Ya alcanzaste tu meta de hoy!
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 font-bold flex justify-between uppercase tracking-wide mt-3 px-1">
                    <span>Progreso diario</span>
                    <span>Meta: {goalCo2} kg</span>
                  </p>
                )}
              </div>

              {/* TARJETA ODS 3: CALORÍAS */}
              <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 hover:shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-5 sm:mb-6">
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3.5 sm:p-4 rounded-2xl shadow-inner transition-transform duration-300 border border-white">
                      <AnimatedHeartIcon className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    </div>
                    <span className="text-orange-700 font-black bg-white px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-orange-200 shadow-sm">
                      ODS 3
                    </span>
                  </div>
                  <h3 className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-1">Calorías Quemadas Hoy</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl sm:text-5xl font-black text-stone-800 tracking-tighter">{dailyCal}</span>
                    <span className="text-stone-500 font-bold">kcal</span>
                  </div>
                  <p className="text-[11px] text-stone-400 font-bold mb-3">
                    Acumulado histórico: {calories} kcal
                  </p>
                  <div className="w-full bg-stone-200/50 rounded-full h-4 mb-2 overflow-hidden shadow-inner border border-stone-200/50">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,146,60,0.8)] relative"
                      style={{ width: `${calPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>

                {dailyCal >= goalCalories ? (
                  <div className="mt-3 bg-orange-100/90 border border-orange-300 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                    <Flame className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
                    <span className="text-orange-700 font-black text-xs uppercase tracking-widest">
                      ¡Ya alcanzaste tu meta de hoy!
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 font-bold flex justify-between uppercase tracking-wide mt-3 px-1">
                    <span>Progreso diario</span>
                    <span>Meta: {goalCalories} kcal</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* TERCERA COLUMNA: IMPACTO Y ACCIONES SECUNDARIAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-5 md:gap-6">
            <button
              onClick={() => setShowImpactModal(true)}
              className="bg-gradient-to-br from-green-800 to-emerald-950 p-6 sm:p-8 rounded-[2rem] border border-green-700/50 shadow-2xl shadow-black/20 text-left hover:scale-[1.02] transition-all group overflow-hidden relative cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-500 opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-center justify-between">
                  <Globe className="w-9 h-9 sm:w-10 sm:h-10 text-green-400 group-hover:rotate-12 transition-transform duration-500" />
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
                    Impacto
                    <br />
                    Ambiental Real
                  </h2>
                  <p className="text-green-200/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    Ver equivalencias <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </p>
                </div>
              </div>
            </button>

            <div className="mt-auto flex flex-col justify-center gap-3.5 h-full lg:h-auto">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full min-h-[48px] py-3.5 sm:py-4 px-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 hover:bg-white/90 text-white hover:text-stone-800 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2.5 sm:gap-3 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-95 cursor-pointer"
              >
                <CalendarDays className="w-5 h-5 shrink-0" />
                <span>Ver todo mi historial</span>
              </button>
              <button
                onClick={() => setShowCuriositiesModal(true)}
                className="w-full min-h-[48px] py-3.5 sm:py-4 px-4 rounded-2xl bg-yellow-400/20 backdrop-blur-xl border border-yellow-400/40 hover:bg-yellow-400 text-yellow-100 hover:text-yellow-950 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2.5 sm:gap-3 shadow-lg hover:shadow-[0_10px_30px_rgba(253,224,71,0.3)] active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>Curiosidades ODS ({desbloqueadasCount}/{curiosidadesOds.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* DESGLOSE POR CATEGORÍAS (GRÁFICO DE ANILLO SVG + BARRAS) */}
        <div className="mt-6 md:mt-8 bg-white/80 backdrop-blur-2xl p-4 sm:p-7 rounded-3xl sm:rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-black text-stone-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600 shrink-0" /> Desglose de Impacto por Categoría (ODS 13)
            </h2>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 w-fit">
              Total acumulado: {co2} kg CO2
            </span>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Anillo SVG (Donut Chart) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-sm" role="img" aria-label="Gráfico de anillo de CO2 evitado por categoría">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="transparent"
                      stroke="#e7e5e4"
                      strokeWidth="3.8"
                    />
                    {(() => {
                      let accumulatedPct = 0;
                      return categoryBreakdown.map((cat) => {
                        const dashArray = `${cat.pct} ${Math.max(0, 100 - cat.pct)}`;
                        const dashOffset = 100 - accumulatedPct;
                        accumulatedPct += cat.pct;
                        return (
                          <circle
                            key={cat.categoria}
                            cx="18"
                            cy="18"
                            r="15.9155"
                            fill="transparent"
                            stroke={cat.color}
                            strokeWidth="3.8"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="butt"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                    <span className="text-xl sm:text-2xl font-black text-stone-800 leading-none">{co2}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 mt-1">
                      kg CO2
                    </span>
                  </div>
                </div>
              </div>

              {/* Barras de progreso por categoría */}
              <div className="md:col-span-8 flex flex-col gap-3.5">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.categoria} className="bg-white/90 p-3.5 rounded-2xl border border-stone-200/80 shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm mb-1.5">
                      <span className="font-black text-stone-800 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.label}
                      </span>
                      <span className="font-extrabold text-stone-600">
                        {cat.total_co2_kg} kg CO2 ({cat.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-200/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${cat.barClass} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(4, cat.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-5 text-center text-stone-500 text-xs sm:text-sm font-bold">
              Siembra tu primera acción ecológica en el catálogo inferior para visualizar tu distribución de impacto por categoría.
            </div>
          )}
        </div>

        {/* SECCIÓN INFERIOR: CATÁLOGO (SIEMBRA UNA ACCIÓN) */}
        <div className="mt-6 md:mt-8 bg-white/80 backdrop-blur-2xl p-4 sm:p-7 rounded-3xl sm:rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20">
          <h2 className="text-lg sm:text-xl font-black text-stone-800 mb-4 sm:mb-5 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600 shrink-0" /> Siembra una acción
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {acciones.map((acc) => {
              const catLower = String(acc.categoria || '').toLowerCase();
              const isSalud =
                Number(acc.ods_principal) === 3 ||
                catLower === 'salud' ||
                Number(acc.calorias_estimadas || 0) > 0;
              const isClima =
                !isSalud &&
                (Number(acc.ods_principal) === 13 ||
                  catLower === 'clima' ||
                  catLower === 'energia' ||
                  catLower === 'movilidad');

              const IconCmp = isSalud ? AnimatedHeartIcon : isClima ? AnimatedWindIcon : Leaf;
              const isSubmittingThis = submittingId === acc.id;

              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={submittingId !== null}
                  onClick={() => onSelectAction(acc.id)}
                  className="group relative overflow-hidden w-full min-h-[68px] flex items-center gap-3.5 sm:gap-4 bg-white border-2 p-3.5 sm:p-4 rounded-2xl transition-all duration-300 text-left border-green-100 hover:border-green-400 active:scale-[0.97] shadow-sm hover:shadow-[0_10px_20px_rgba(74,222,128,0.3)] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
                  <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-500/40 z-10 transition-transform text-white border border-green-300 shrink-0">
                    {isSubmittingThis ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <IconCmp className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="z-10 min-w-0 flex-1">
                    <h3 className="font-black text-sm sm:text-lg text-stone-800 group-hover:text-green-900 transition-colors leading-snug break-words">
                      {acc.titulo}
                    </h3>
                    <p className="text-stone-500 text-xs sm:text-sm font-bold mt-0.5 break-words">
                      +{acc.impacto_co2_kg}kg CO2
                      {Number(acc.calorias_estimadas) > 0 ? ` | +${acc.calorias_estimadas} kcal` : ''} | +
                      {acc.xp_otorgada} XP
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: CURIOSIDADES ODS 4 (LISTA PROGRESIVA GAMIFICADA) */}
      {showCuriositiesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-curiosities-title"
          className="fixed inset-0 bg-emerald-950/85 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 rounded-t-[2rem] md:rounded-[2.5rem] shadow-[0_-10px_60px_rgba(253,224,71,0.35)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 w-full max-w-2xl max-h-[90dvh] flex flex-col border-t-2 md:border-2 border-yellow-400 overflow-hidden">
            {/* Cabecera Fija del Modal ODS 4 */}
            <div className="p-4 sm:p-6 md:p-7 border-b border-yellow-300/80 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-200 shrink-0 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-3 sm:p-3.5 rounded-2xl shadow-lg shadow-yellow-500/40 text-white border border-yellow-300 animar-libro shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="bg-amber-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                        ODS 4 • Educación de Calidad
                      </span>
                      <span className="bg-white/80 text-amber-900 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-300">
                        {desbloqueadasCount} / {curiosidadesOds.length} Desbloqueadas
                      </span>
                    </div>
                    <h2 id="modal-curiosities-title" className="font-black text-stone-800 text-xl sm:text-2xl leading-tight mt-1.5 break-words">
                      Curiosidades ODS
                    </h2>
                    <p className="text-amber-900/80 text-xs sm:text-sm font-bold mt-0.5">
                      Tu progreso actual: Nivel {nivel} • {totalScore} pts XP
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCuriositiesModal(false)}
                  aria-label="Cerrar modal"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-yellow-800 hover:text-yellow-950 bg-yellow-200/80 hover:bg-yellow-300 rounded-full transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Barra general de colección ODS 4 */}
              <div className="mt-3.5 w-full bg-amber-900/15 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((desbloqueadasCount / Math.max(1, curiosidadesOds.length)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Lista Progresiva Estilo Videojuego */}
            <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto scrollbar-hide flex flex-col gap-4 sm:gap-5 pb-6 sm:pb-8">
              {curiosidadesOds.map((item) =>
                item.desbloqueado ? (
                  <div
                    key={item.id}
                    className="shrink-0 relative bg-white/95 rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-amber-300 shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                          <span className="w-fit text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 leading-none">
                            Cápsula #{item.id} • ODS 4 Desbloqueada
                          </span>
                          <span className="w-fit text-[11px] font-extrabold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200/80 leading-none">
                            {item.requisitoTexto}
                          </span>
                        </div>
                        <h3 className="font-black text-stone-800 text-base sm:text-lg leading-snug break-words mt-0.5">
                          {item.titulo}
                        </h3>
                        <p className="text-stone-600 font-medium text-xs sm:text-sm leading-relaxed break-words">
                          {item.contenido}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="shrink-0 relative bg-stone-900/95 text-stone-200 rounded-2xl p-4 sm:p-5 md:p-6 border border-stone-700/90 shadow-md"
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-stone-800/90 border border-stone-600/80 text-amber-400 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                          <span className="w-fit text-[11px] font-black uppercase tracking-wider text-stone-300 bg-stone-800 px-2.5 py-1 rounded-full border border-stone-600/80 leading-none">
                            Cápsula #{item.id} • ODS 4 Bloqueada
                          </span>
                          <span className="w-fit text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-1 rounded-full leading-none">
                            Requisito: {item.requisitoTexto}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-extrabold text-stone-200 text-sm sm:text-base md:text-lg leading-snug select-none break-words">
                            ??? • Conocimiento Sostenible Oculto
                          </h3>
                          <p className="text-stone-400 text-xs sm:text-sm leading-relaxed break-words">
                            Suma puntos registrando acciones ecológicas para desbloquear esta cápsula de Educación de Calidad (ODS 4).
                          </p>
                        </div>

                        <div className="mt-1 pt-2.5 border-t border-stone-800 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                            <span className="text-stone-400 uppercase tracking-wider">
                              Progreso de desbloqueo ({item.progresoPct}%)
                            </span>
                            <span className="text-amber-300">
                              {item.xpFaltante > 0
                                ? `Faltan ${item.xpFaltante} pts XP`
                                : `Requiere Nivel ${item.reqNivel}`}
                            </span>
                          </div>
                          <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700/80">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.progresoPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPACTO AMBIENTAL REAL */}
      {showImpactModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-impact-title"
          className="fixed inset-0 bg-emerald-950/90 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="bg-emerald-950 rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] w-full max-w-4xl max-h-[90dvh] flex flex-col shadow-[0_-10px_60px_rgba(0,0,0,0.5)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 border-t md:border border-emerald-800 p-5 sm:p-6 md:p-8 pb-7 sm:pb-8 overflow-y-auto scrollbar-hide">
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-start gap-4 mb-5 md:mb-8 relative z-10">
              <div className="min-w-0">
                <h2 id="modal-impact-title" className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 md:gap-3">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 shrink-0" /> Impacto Ambiental Real
                </h2>
                <p className="text-emerald-400 text-xs font-bold mt-1.5 uppercase tracking-widest">
                  Tu esfuerzo traducido a la naturaleza
                </p>
              </div>
              <button
                onClick={() => setShowImpactModal(false)}
                aria-label="Cerrar modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 sm:p-3 bg-emerald-800/50 border border-emerald-700/50 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 hover:rotate-90 transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-6 relative z-10">
              {/* Card 1: Árboles */}
              <div className="bg-emerald-900/40 p-4 sm:p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-emerald-800 flex flex-row md:flex-col items-center text-left md:text-center shadow-inner gap-4 md:gap-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 shrink-0 rounded-full bg-emerald-800/80 border border-emerald-600 flex items-center justify-center mb-0 md:mb-6 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <TreePine className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col md:items-center w-full min-w-0">
                  <span className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-0.5 md:mb-2 leading-none">
                    {(co2 * 0.4).toFixed(1)}
                  </span>
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1 md:mb-3">
                    Árboles Simulados
                  </span>
                  <p className="text-emerald-200/70 text-xs md:text-sm leading-snug">
                    Lo que un árbol absorbería en un mes.
                  </p>
                </div>
              </div>

              {/* Card 2: Auto */}
              <div className="bg-emerald-900/40 p-4 sm:p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-emerald-800 flex flex-row md:flex-col items-center text-left md:text-center shadow-inner gap-4 md:gap-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 shrink-0 rounded-full bg-amber-900/40 border border-amber-600/50 flex items-center justify-center mb-0 md:mb-6 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <Car className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col md:items-center w-full min-w-0">
                  <span className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-0.5 md:mb-2 leading-none">
                    {(co2 * 8.3).toFixed(1)} <span className="text-lg sm:text-xl md:text-2xl">km</span>
                  </span>
                  <span className="text-amber-400 text-xs font-black uppercase tracking-widest mb-1 md:mb-3">
                    Viaje Evitado
                  </span>
                  <p className="text-emerald-200/70 text-xs md:text-sm leading-snug">
                    Kilómetros que no se recorrieron en auto.
                  </p>
                </div>
              </div>

              {/* Card 3: Energía */}
              <div className="bg-emerald-900/40 p-4 sm:p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-emerald-800 flex flex-row md:flex-col items-center text-left md:text-center shadow-inner gap-4 md:gap-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 shrink-0 rounded-full bg-yellow-900/40 border border-yellow-500/50 flex items-center justify-center mb-0 md:mb-6 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col md:items-center w-full min-w-0">
                  <span className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-0.5 md:mb-2 leading-none">
                    {Math.round(calories * 1.16)} <span className="text-lg sm:text-xl md:text-2xl">Wh</span>
                  </span>
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-1 md:mb-3">
                    Energía Humana
                  </span>
                  <p className="text-emerald-200/70 text-xs md:text-sm leading-snug">
                    Watts generados por tu movimiento físico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AJUSTAR METAS */}
      {showGoalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-goals-title"
          className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] w-full max-w-md max-h-[90dvh] flex flex-col shadow-[0_-10px_60px_rgba(0,0,0,0.3)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 border-t md:border border-white overflow-hidden">
            <div className="p-5 sm:p-6 md:p-8 border-b border-stone-100 flex justify-between items-center gap-3 bg-gradient-to-r from-stone-50 to-white shrink-0">
              <div className="min-w-0">
                <h2 id="modal-goals-title" className="text-xl md:text-2xl font-black text-stone-800 flex items-center gap-2.5 md:gap-3">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shadow-inner shrink-0">
                    <Target className="w-6 h-6" />
                  </div>
                  <span>Tus Metas</span>
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm font-bold mt-1.5 uppercase tracking-wider">
                  Define tus propios límites
                </p>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                aria-label="Cerrar modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 sm:p-3 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 hover:rotate-90 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-5 sm:p-6 md:p-8 pb-7 sm:pb-8 bg-stone-50/50 overflow-y-auto scrollbar-hide">
              <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
                {/* Meta de CO2 */}
                <div className="bg-white/90 backdrop-blur-2xl p-4 sm:p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-stone-200/80 md:border-white/60 shadow-sm md:shadow-2xl md:shadow-black/10">
                  <div className="flex justify-between items-center mb-3 md:mb-6">
                    <span className="font-black text-stone-700 flex items-center gap-2 text-sm sm:text-base">
                      <Wind className="w-5 h-5 text-green-600 shrink-0" /> CO2 Evitado
                    </span>
                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-xl text-sm">
                      {goalCo2} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Meta diaria de CO2 evitado en kilogramos"
                    min="5"
                    max="100"
                    step="5"
                    value={goalCo2}
                    onChange={(e) => setGoalCo2(Number(e.target.value))}
                    className="slider-clima min-h-[44px]"
                  />
                  <div className="flex justify-between text-[11px] text-stone-400 font-bold mt-2 uppercase">
                    <span>5 kg</span>
                    <span>100 kg</span>
                  </div>
                </div>

                {/* Meta de Calorías */}
                <div className="bg-white/90 backdrop-blur-2xl p-4 sm:p-5 md:p-7 rounded-2xl md:rounded-[2rem] border border-stone-200/80 md:border-white/60 shadow-sm md:shadow-2xl md:shadow-black/10">
                  <div className="flex justify-between items-center mb-3 md:mb-6">
                    <span className="font-black text-stone-700 flex items-center gap-2 text-sm sm:text-base">
                      <HeartPulse className="w-5 h-5 text-orange-600 shrink-0" /> Calorías
                    </span>
                    <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-xl text-sm">
                      {goalCalories} kcal
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Meta diaria de calorías quemadas en kilocalorías"
                    min="500"
                    max="5000"
                    step="100"
                    value={goalCalories}
                    onChange={(e) => setGoalCalories(Number(e.target.value))}
                    className="slider-salud min-h-[44px]"
                  />
                  <div className="flex justify-between text-[11px] text-stone-400 font-bold mt-2 uppercase">
                    <span>500 kcal</span>
                    <span>5000 kcal</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowGoalModal(false)}
                  className="w-full min-h-[48px] bg-stone-800 hover:bg-stone-900 text-white font-black uppercase tracking-widest text-sm py-3.5 md:py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Target className="w-5 h-5" /> Guardar Mis Metas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: HISTORIAL DE ACCIONES (LÍNEA DE TIEMPO) */}
      {showHistoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-history-title"
          className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] w-full max-w-lg max-h-[88dvh] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 border-t md:border border-white overflow-hidden">
            <div className="p-5 sm:p-6 md:p-8 border-b border-stone-100 flex justify-between items-center gap-3 bg-gradient-to-r from-stone-50 to-white shrink-0">
              <div className="min-w-0">
                <h2 id="modal-history-title" className="text-xl md:text-2xl font-black text-stone-800 flex items-center gap-2.5 md:gap-3">
                  <div className="bg-green-100 p-2 rounded-xl text-green-700 shadow-inner shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <span>Línea de Tiempo</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <p className="text-stone-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
                    Tu impacto detallado
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryModal(false);
                      setShowStreakModal(true);
                    }}
                    className="text-[11px] font-extrabold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    Ver Rachas ({streak}d) &rarr;
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                aria-label="Cerrar modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 sm:p-3 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 hover:rotate-90 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-5 sm:p-6 md:p-8 pb-7 sm:pb-8 overflow-y-auto scrollbar-hide">
              {historyLoading ? (
                <div className="text-center py-12 flex flex-col items-center gap-3 text-stone-500">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                  <p className="font-bold uppercase tracking-widest text-xs">Cargando tu historial...</p>
                </div>
              ) : historyError ? (
                <div className="text-center py-8 px-4 flex flex-col items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                  <p className="text-rose-800 font-bold text-sm">{historyError}</p>
                  <button
                    onClick={refreshHistory}
                    className="mt-1 min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Reintentar
                  </button>
                </div>
              ) : history.length > 0 ? (
                <div className="flex flex-col gap-5 relative before:absolute before:inset-y-0 before:left-[15px] before:w-1 before:bg-gradient-to-b before:from-green-300 before:to-orange-300 before:rounded-full">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3.5 sm:gap-5 relative z-10 group cursor-default">
                      <div
                        className={`w-8 h-8 rounded-full border-4 border-white flex-shrink-0 mt-1 shadow-lg transition-transform group-hover:scale-125 ${
                          item.type === 'clima'
                            ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                            : 'bg-gradient-to-br from-orange-400 to-rose-500'
                        }`}
                      />
                      <div className="bg-white w-full min-w-0 p-4 rounded-2xl border border-stone-100 shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-0.5">
                        <p className="font-black text-stone-800 text-base sm:text-lg leading-snug break-words">
                          {item.text}
                        </p>
                        <p className="text-stone-400 text-xs font-bold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> <span>{item.time}</span>
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {Number(item.co2) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-lg">
                              <Wind className="w-3 h-3" /> +{item.co2} kg CO2
                            </span>
                          )}
                          {Number(item.cal) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                              <HeartPulse className="w-3 h-3" /> +{item.cal} kcal
                            </span>
                          )}
                          {Number(item.xp) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                              +{item.xp} XP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 opacity-50">
                  <Leaf className="w-12 h-12 text-stone-400" />
                  <p className="text-stone-500 font-bold uppercase tracking-widest text-sm">Aún no hay datos</p>
                  <p className="text-stone-400 text-xs">Siembra una acción para verla aquí.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: RACHAS (PROGRESO DIARIO) */}
      {showStreakModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-streak-title"
          className="fixed inset-0 bg-orange-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] w-full max-w-lg max-h-[88dvh] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 border-t md:border border-white overflow-hidden">
            <div className="p-5 sm:p-6 md:p-8 border-b border-stone-100 flex justify-between items-center gap-3 bg-gradient-to-r from-stone-50 to-orange-50/30 shrink-0">
              <div className="min-w-0">
                <h2 id="modal-streak-title" className="text-xl md:text-2xl font-black text-stone-800 flex items-center gap-2.5 md:gap-3">
                  <div className="bg-orange-100 p-2 rounded-xl text-orange-600 shadow-inner shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <span>Progreso Diario</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <p className="text-stone-500 text-xs sm:text-sm font-bold uppercase tracking-wider">
                    Tu racha día tras día ({streak} {streak === 1 ? 'día activo' : 'días activos'})
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStreakModal(false);
                      setShowHistoryModal(true);
                    }}
                    className="text-[11px] font-extrabold text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    Ver Historial &rarr;
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowStreakModal(false)}
                aria-label="Cerrar modal"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 sm:p-3 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 hover:rotate-90 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-5 sm:p-6 md:p-8 pb-7 sm:pb-8 overflow-y-auto scrollbar-hide bg-stone-50/50">
              {streak > 0 && streakData.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {streakData.map((dia) => (
                    <div
                      key={dia.id}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-stone-100 text-stone-600 px-3.5 py-2.5 rounded-2xl font-black uppercase tracking-widest text-xs min-w-[6rem] text-center group-hover:bg-stone-800 group-hover:text-white transition-colors">
                          {dia.date}
                        </div>
                        <span className="text-stone-400 text-xs font-bold">
                          {dia.count} {dia.count === 1 ? 'acción' : 'acciones'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                          <Wind className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="font-bold text-green-700 text-xs sm:text-sm">{dia.co2} kg</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
                          <HeartPulse className="w-4 h-4 text-orange-600 shrink-0" />
                          <span className="font-bold text-orange-700 text-xs sm:text-sm">{dia.cal} kcal</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 opacity-60">
                  <Flame className="w-12 h-12 text-stone-400" />
                  <p className="text-stone-600 font-bold uppercase tracking-widest text-sm">Tu racha está en cero</p>
                  <p className="text-stone-400 text-xs">Siembra una acción hoy para encender la llama.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: VICTORIA TOTAL */}
      {showVictoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-victory-title"
          className="fixed inset-0 z-[100] bg-emerald-950/90 backdrop-blur-2xl flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-500"
        >
          <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto scrollbar-hide p-6 sm:p-8 md:p-10 pb-8 rounded-t-[2.5rem] md:rounded-[3rem] rounded-b-none md:rounded-b-[3rem] shadow-[0_-10px_100px_rgba(234,179,8,0.5)] border-t-2 md:border-2 text-center animate-in slide-in-from-bottom-full md:zoom-in-95 duration-500 bg-gradient-to-br from-emerald-600 via-green-500 to-orange-500 border-yellow-300">
            <div className="absolute inset-0 w-full h-full efecto-shiny mix-blend-overlay opacity-60 z-0 pointer-events-none"></div>
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-yellow-300 opacity-40 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex justify-center mb-4 md:mb-6 gap-3 md:gap-4">
              <div className="bg-white/20 backdrop-blur-md p-3.5 md:p-5 rounded-full border border-white/50 shadow-2xl animar-latido-planeta">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div
                className="bg-white/20 backdrop-blur-md p-3.5 md:p-5 rounded-full border border-white/50 shadow-2xl animar-latido-planeta"
                style={{ animationDelay: '0.5s' }}
              >
                <HeartPulse className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>

            <h2 id="modal-victory-title" className="relative z-10 text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-lg tracking-tight uppercase">
              ¡DÍA SUPERADO!
            </h2>

            <span className="relative z-10 inline-block bg-white/20 text-white font-bold px-4 py-1.5 rounded-full text-xs sm:text-sm uppercase tracking-widest mb-4 md:mb-6 border border-white/30 backdrop-blur-sm shadow-inner">
              Has alcanzado tus metas de hoy y tu huella verde es un ejemplo para todos.
            </span>

            <div className="relative z-10 bg-black/20 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/20 shadow-inner mb-5 md:mb-8">
              <p className="text-white/95 font-medium text-xs sm:text-sm md:text-base leading-snug md:leading-relaxed italic drop-shadow-sm">
                &ldquo;El verdadero progreso no se mide por aquello que conquistamos, sino por la vida que logramos
                preservar. Cada decisión consciente que tomamos hoy, es el aliento de las generaciones del
                mañana.&rdquo;
              </p>
            </div>

            <button
              onClick={() => setVictoryDismissed(true)}
              className="relative z-10 w-full min-h-[48px] bg-white text-stone-900 hover:bg-stone-100 font-black uppercase tracking-widest text-sm py-3.5 md:py-4 rounded-2xl shadow-xl hover:shadow-[0_10px_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >

              <Sparkles className="w-5 h-5 text-yellow-500" /> ¡Continuar!
            </button>
          </div>
        </div>
      )}

      {/* PIE DE PÁGINA: CRÉDITOS Y TRANSPARENCIA IA */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto pt-2 pb-4 text-emerald-100/85 text-xs">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="text-center sm:text-left">
            <p className="font-bold text-white">
              Academia Naval Almirante Illingworth • Concurso Intercolegial &ldquo;Multimedia Teens 2026&rdquo; (UPS)
            </p>
            <p className="text-[11px] text-emerald-200/80 mt-0.5">
              Integrantes: Jordán Maridueña Joel Alexander, Nieto Martillo Melissa Dakota, Narváez Durán Francisco Isaías, Zambrano Aguirre Marcelo Humberto • Docente Tutor: Ing. Joel Anthony Torres Urresto
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-300/30 text-white font-bold text-xs inline-flex items-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Créditos y Declaración IA</span>
          </button>
        </div>
      </footer>

      {/* MODAL 7: CRÉDITOS Y TRANSPARENCIA IA */}
      {showCreditsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dash-credits-title"
          className="fixed inset-0 bg-emerald-950/85 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-2xl max-h-[88dvh] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-t md:border border-white overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-200 flex justify-between items-center gap-3 bg-gradient-to-r from-emerald-50 to-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="min-w-0 text-left">
                  <h2 id="dash-credits-title" className="text-lg sm:text-xl font-black text-stone-800">
                    Créditos y Transparencia IA
                  </h2>
                  <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                    Multimedia Teens 2026 • Categoría Diseño Web (ODS 3, 4 y 13)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreditsModal(false)}
                aria-label="Cerrar modal de créditos"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto scrollbar-hide space-y-4 text-left text-stone-700 text-xs sm:text-sm">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                <h3 className="font-black text-emerald-950 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" /> Información General del Proyecto
                </h3>
                <p className="font-bold text-stone-800 mb-1">
                  Institución Educativa: <span className="font-medium">Academia Naval Almirante Illingworth</span>
                </p>
                <p className="font-bold text-stone-800 mb-2">
                  Docente Tutor: <span className="font-medium">Ing. Joel Anthony Torres Urresto</span>
                </p>
                <p className="font-bold text-stone-800 mb-1">Integrantes del Equipo:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-semibold text-stone-700">
                  <li>• Jordán Maridueña Joel Alexander</li>
                  <li>• Nieto Martillo Melissa Dakota</li>
                  <li>• Narváez Durán Francisco Isaías</li>
                  <li>• Zambrano Aguirre Marcelo Humberto</li>
                </ul>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <h3 className="font-black text-amber-950 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Declaración de Uso de Inteligencia Artificial
                </h3>
                <div>
                  <p className="font-black text-stone-800">Google Antigravity</p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Intervención directa en el entorno de desarrollo para depuración, refactorización e implementación de código en TypeScript (Next.js) y Python (FastAPI), así como la validación de consultas SQL/RPC en PostgreSQL y revisión de documentación técnica.
                  </p>
                </div>
                <div>
                  <p className="font-black text-stone-800">Google Gemini</p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Asistencia consultiva externa (vía chat) para la conceptualización de componentes de interfaz con Tailwind CSS, consulta de buenas prácticas en tipado y generación de plantillas base para pruebas unitarias con Pytest.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
