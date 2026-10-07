/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';

import { BookOpen, Flame, Leaf, Wind, Clock, TrendingUp, Target, X, CalendarDays, Sparkles, RefreshCw, Activity, HeartPulse, SlidersHorizontal, Globe, TreePine, Car, Zap } from 'lucide-react';
import Background from './Background';

type HistoryItem = {
  id: number;
  text: string;
  time: string;
  type: string;
};

// COMPONENTE: Corazón (EKG)
const AnimatedHeartIcon = ({ className = "" }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full opacity-50">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full drop-shadow-[0_0_5px_currentColor]">
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" pathLength="100" className="ekg-scanner-line" />
    </svg>
  </div>
);

// COMPONENTE: Viento
const AnimatedWindIcon = ({ className = "" }) => (
  <div className={`relative ${className} animar-viento-contenedor`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full opacity-40">
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2"/>
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/>
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>
    </svg>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 w-full h-full drop-shadow-[0_0_5px_currentColor]">
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2" pathLength="100" className="wind-scanner-1" />
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" pathLength="100" className="wind-scanner-2" />
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2" pathLength="100" className="wind-scanner-3" />
    </svg>
  </div>
);

// COMPONENTE: Lluvia de Hojas de Otoño
const AutumnLeaves = () => {
  const leaves = Array.from({ length: 35 }).map((_, i) => {
    const colors = ['text-orange-500', 'text-red-500', 'text-amber-500', 'text-yellow-400', 'text-orange-600', 'text-rose-500'];
    const sizes = ['w-6 h-6', 'w-8 h-8', 'w-10 h-10', 'w-12 h-12', 'w-7 h-7', 'w-9 h-9'];
    const left = `${(i * 17) % 100}%`; 
    const duration = `${(i % 8) + 6}s`; 
    const delay = `${(i * 3) % 15}s`; 
    const direction = i % 2 === 0 ? 'hoja-otono-der' : 'hoja-otono-izq';

    return (
      <Leaf
        key={i}
        className={`${direction} ${colors[i % colors.length]} ${sizes[i % sizes.length]} absolute drop-shadow-xl opacity-90`}
        style={{ left, animationDuration: duration, animationDelay: delay }}
      />
    );
  });
  return <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">{leaves}</div>;
};

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  // Estados iniciales un poquito más bajos para que puedas probar el límite rápido
  
    const { dashboard, acciones, history, loading, error, recompensa, showReward, handleAction, closeReward } = useDashboard();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryShown, setVictoryShown] = useState(false);

  useEffect(() => {
    const currentCo2 = dashboard?.impacto_global_co2 || 0;
    const currentCal = dashboard?.impacto_global_calorias || 0;
    if (currentCo2 >= goalCo2 && currentCal >= goalCalories && !victoryShown) {
      setShowVictoryModal(true);
      setVictoryShown(true);
    }
  }, [dashboard?.impacto_global_co2, dashboard?.impacto_global_calorias, victoryShown]);

  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCuriositiesModal, setShowCuriositiesModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [goalCo2, setGoalCo2] = useState(20);
  const [goalCalories, setGoalCalories] = useState(2000);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (loading || !dashboard) {
    return <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-950 flex items-center justify-center text-white">Cargando tu progreso...</div>;
  }

  const co2 = Number((dashboard.impacto_global_co2 || 0).toFixed(2));
  const calories = dashboard.impacto_global_calorias || 0;
  const streak = dashboard.racha_dias || 0;
  const totalScore = dashboard.xp_total || 0;
  const nivel = dashboard.nivel_actual || 1;
  const nombre = dashboard.nombre_usuario || "Estudiante";

  const co2Percent = Math.min((co2 / goalCo2) * 100, 100);
  const calPercent = Math.min((calories / goalCalories) * 100, 100);
      const streakData = [
    { id: 1, date: 'Hoy', co2: co2, cal: calories }
  ];
  



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 text-stone-800 p-4 md:p-8 font-sans selection:bg-green-500 selection:text-white overflow-hidden relative">
      
      <AutumnLeaves />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="luciernaga bg-yellow-300/30 blur-sm rounded-full w-5 h-5 absolute shadow-[0_0_15px_rgba(253,224,71,0.8)]" style={{ left: '20%', bottom: '30%', animationDelay: '0s' }}></div>
        <div className="luciernaga bg-yellow-300/20 blur-sm rounded-full w-7 h-7 absolute shadow-[0_0_20px_rgba(253,224,71,0.6)]" style={{ left: '80%', bottom: '50%', animationDelay: '2s' }}></div>
      </div>

      <style>{`
        @keyframes caidaOtonoDer { 0% { transform: translateY(-15vh) translateX(0px) rotate(0deg); } 100% { transform: translateY(115vh) translateX(200px) rotate(720deg); } }
        @keyframes caidaOtonoIzq { 0% { transform: translateY(-15vh) translateX(0px) rotate(0deg); } 100% { transform: translateY(115vh) translateX(-200px) rotate(-720deg); } }
        .hoja-otono-der { animation: caidaOtonoDer linear infinite; top: -15vh; }
        .hoja-otono-izq { animation: caidaOtonoIzq linear infinite; top: -15vh; }
        @keyframes pulsoLuciernaga { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; } 50% { transform: translateY(-20px) scale(1.3); opacity: 1; } }
        .luciernaga { animation: pulsoLuciernaga 4s ease-in-out infinite; }
        @keyframes scanEKG { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        .ekg-scanner-line { stroke-dasharray: 20 80; animation: scanEKG 1.5s linear infinite; }
        @keyframes scanWind { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: -100; } }
        .wind-scanner-1 { stroke-dasharray: 40 60; animation: scanWind 1.8s linear infinite; }
        .wind-scanner-2 { stroke-dasharray: 30 70; animation: scanWind 1.3s linear infinite; }
        .wind-scanner-3 { stroke-dasharray: 50 50; animation: scanWind 2.2s linear infinite; }
        @keyframes vientoRafaga { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
        .animar-viento-contenedor { animation: vientoRafaga 3s ease-in-out infinite; }
        @keyframes resplandorCarta { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        .efecto-shiny { background: linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.5) 45%, rgba(255, 255, 255, 0.5) 55%, transparent 80%); background-size: 200% auto; animation: resplandorCarta 3.5s linear infinite; }
        @keyframes flotarLibro { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .animar-libro { animation: flotarLibro 2.5s ease-in-out infinite; }

        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: #ffffff; cursor: pointer; margin-top: -10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 3px; }
        .slider-clima::-webkit-slider-runnable-track { background: #10b981; }
        .slider-clima::-webkit-slider-thumb { border: 3px solid #059669; }
        .slider-salud::-webkit-slider-runnable-track { background: #f97316; }
        .slider-salud::-webkit-slider-thumb { border: 3px solid #ea580c; }
      `}</style>

      <div className={`max-w-6xl mx-auto transition-all duration-1000 transform relative z-10 pb-16 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-2 drop-shadow-lg">
              Kawsay <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 drop-shadow-none">Eco-Dash</span>
            </h1>
            <p className="text-emerald-200/90 mt-2 font-medium text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse drop-shadow-md" /> Tu huella verde de hoy
            </p>
          </div>
          
          <div className="flex flex-row justify-center sm:justify-start flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowGoalModal(true)}
              className="group flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-3 rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:border-emerald-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-white font-bold text-sm w-auto justify-center"
            >
              <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 text-emerald-300" />
              Ajustar Metas
            </button>

            <button 
              onClick={() => setShowStreakModal(true)}
              className="group flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/20 hover:shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:border-orange-300/50 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer w-auto justify-center"
            >
              <div className="bg-gradient-to-tr from-orange-400 to-yellow-400 p-2 rounded-full shadow-[0_0_15px_rgba(251,146,60,0.5)] text-white group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 animate-bounce" />
              </div>
              <span className="font-black text-xl text-white drop-shadow-md">
                {streak} <span className="text-emerald-100 font-medium text-base group-hover:text-white transition-colors">Días</span>
              </span>
            </button>
            <button 
              onClick={onLogout}
              className="group flex items-center gap-2 bg-rose-500/20 backdrop-blur-xl px-5 py-3 rounded-full border border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-rose-500 hover:border-rose-400 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer text-rose-100 hover:text-white font-bold text-sm justify-center"
            >
              <RefreshCw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>

          </div>
        </div>

        <div className="mb-8 bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(4,120,87,0.6)] border border-white/10 transition-all duration-500 relative overflow-hidden group hover:-translate-y-1">
              <div className="absolute -right-20 -top-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-yellow-300 opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="absolute -right-6 -top-6 text-white/20 group-hover:rotate-12 transition-transform duration-700">
                <Leaf className="w-64 h-64 drop-shadow-2xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-green-50 font-bold tracking-widest uppercase text-sm mb-3 flex items-center gap-2 drop-shadow-md">
                  <Target className="w-4 h-4" /> Puntaje Kawsay Total
                </h2>
                <div className="flex items-end gap-3">
                  <span className="text-5xl md:text-7xl font-black text-white drop-shadow-xl tracking-tighter">{totalScore}</span>
                  <span className="text-2xl font-bold text-green-900 mb-2 flex items-center bg-white/90 backdrop-blur-sm px-3 py-1 rounded-2xl shadow-lg border border-white">
                    <TrendingUp className="w-6 h-6 mr-1"/> pts
                  </span>
                </div>
              </div>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          <div className="lg:col-span-2 h-full">
            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              
              <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl shadow-inner transition-transform duration-300 border border-white">
                      <AnimatedWindIcon className="w-5 h-5 md:w-8 md:h-8 text-green-700" />
                    </div>
                    <span className="text-green-700 font-black bg-white px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-green-200 shadow-sm">
                      ODS 13
                    </span>
                  </div>
                  <h3 className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-1">CO2 Evitado</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-5xl font-black text-stone-800 tracking-tighter">{co2}</span>
                    <span className="text-stone-500 font-bold">kg</span>
                  </div>
                  <div className="w-full bg-stone-200/50 rounded-full h-4 mb-2 overflow-hidden shadow-inner border border-stone-200/50">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.8)] relative" style={{ width: `${co2Percent}%` }}>
                      <div className="absolute inset-0 bg-white/30 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
                
                {/* AQUI SALTA EL MENSAJE DE VICTORIA DE CO2 */}
                {co2 >= goalCo2 ? (
                  <div className="mt-3 bg-green-100/90 border border-green-300 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                    <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
                    <span className="text-green-700 font-black text-xs uppercase tracking-widest">¡Ya alcanzaste tu meta!</span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 font-bold flex justify-between uppercase tracking-wide mt-3 px-1">
                    <span>Progreso</span><span>Meta: {goalCo2}kg</span>
                  </p>
                )}
              </div>

              <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 hover:shadow-orange-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-2xl shadow-inner transition-transform duration-300 border border-white">
                      <AnimatedHeartIcon className="w-5 h-5 md:w-8 md:h-8 text-orange-600" />
                    </div>
                    <span className="text-orange-700 font-black bg-white px-4 py-1.5 rounded-full text-xs tracking-widest uppercase border border-orange-200 shadow-sm">
                      ODS 3
                    </span>
                  </div>
                  <h3 className="text-stone-500 font-bold uppercase tracking-wider text-xs mb-1">Calorías Quemadas</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-5xl font-black text-stone-800 tracking-tighter">{calories}</span>
                    <span className="text-stone-500 font-bold">kcal</span>
                  </div>
                  <div className="w-full bg-stone-200/50 rounded-full h-4 mb-2 overflow-hidden shadow-inner border border-stone-200/50">
                    <div className="bg-gradient-to-r from-orange-400 to-rose-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,146,60,0.8)] relative" style={{ width: `${calPercent}%` }}>
                      <div className="absolute inset-0 bg-white/30 w-full h-full animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>

                {/* AQUI SALTA EL MENSAJE DE VICTORIA DE CALORÍAS */}
                {calories >= goalCalories ? (
                  <div className="mt-3 bg-orange-100/90 border border-orange-300 px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                    <Flame className="w-4 h-4 text-orange-600 animate-pulse" />
                    <span className="text-orange-700 font-black text-xs uppercase tracking-widest">¡Ya alcanzaste tu meta!</span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 font-bold flex justify-between uppercase tracking-wide mt-3 px-1">
                    <span>Progreso</span><span>Meta: {goalCalories} kcal</span>
                  </p>
                )}
              </div>

            </div>
          </div>

          <div className="flex flex-col gap-6">
            <button 
              onClick={() => setShowImpactModal(true)}
              className="bg-gradient-to-br from-green-800 to-emerald-950 p-8 rounded-[2rem] border border-green-700/50 shadow-2xl shadow-black/20 text-left hover:scale-105 transition-all group overflow-hidden relative"
            >
               <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
               <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-green-500 opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                 <div className="flex items-center justify-between">
                   <Globe className="w-10 h-10 text-green-400 group-hover:rotate-12 transition-transform duration-500" />
                   <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-white leading-tight mb-2">Impacto<br/>Ambiental Real</h2>
                   <p className="text-green-200/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2">Ver equivalencias <span className="group-hover:translate-x-1 transition-transform">&rarr;</span></p>
                 </div>
               </div>
            </button>

            
            

            

            <div className="mt-auto flex flex-col gap-3">
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="w-full py-4 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/40 hover:bg-white/90 text-white hover:text-stone-800 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-95"
              >
                <CalendarDays className="w-5 h-5" /> Ver todo mi historial
              </button>
              <button 
                onClick={() => setShowCuriositiesModal(true)}
                className="w-full py-4 rounded-2xl bg-yellow-400/20 backdrop-blur-xl border border-yellow-400/40 hover:bg-yellow-400 text-yellow-100 hover:text-yellow-900 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_10px_30px_rgba(253,224,71,0.3)] active:scale-95 mt-3"
              >
                <Sparkles className="w-5 h-5" /> Curiosidades ODS
              </button>
            </div>

          </div>
        </div>
      
        {/* BOTTOM GRID: CATALOG (SIEMBRA UNA ACCION) */}
        <div className="mt-8 bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20">
              <h2 className="text-xl font-black text-stone-800 mb-5 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-green-600"/> Siembra una acción
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                
                {acciones.map((acc, idx) => {
                  const iconMap: Record<string, any> = { 'clima': AnimatedWindIcon, 'salud': AnimatedHeartIcon, 'default': Leaf };
                  const IconCmp = iconMap[acc.categoria?.toLowerCase() || 'default'] || Leaf;
                  return (
                    <button 
                      key={acc.id}
                      onClick={() => handleAction(acc.id)}
                      className="group relative overflow-hidden flex items-center gap-5 bg-white border-2 p-4 rounded-2xl transition-all duration-300 text-left border-green-100 hover:border-green-400 active:scale-[0.97] shadow-sm hover:shadow-[0_10px_20px_rgba(74,222,128,0.3)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
                      <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-500/40 z-10 transition-transform text-white border border-green-300">
                        <IconCmp className="w-6 h-6 text-white" />
                      </div>
                      <div className="z-10">
                        <h3 className="font-black text-lg text-stone-800 group-hover:text-green-900 transition-colors">
                          {acc.titulo}
                        </h3>
                        <p className="text-stone-500 text-sm font-bold">+{acc.impacto_co2_kg}kg CO2 | +{acc.xp_otorgada} XP</p>
                      </div>
                    </button>
                  );
                })}

              </div>
            </div>

      </div>

      

      
      {/* MODAL: CURIOSIDADES / RECOMPENSA */}
      {(showReward || showCuriositiesModal) && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 p-6 md:p-8 rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] shadow-[0_-10px_60px_rgba(253,224,71,0.5)] md:shadow-[0_30px_60px_rgba(253,224,71,0.5)] animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 w-full max-w-md overflow-hidden border-t-2 md:border-2 border-yellow-400">
            <div className="absolute inset-0 w-full h-full efecto-shiny mix-blend-overlay opacity-60 z-0"></div>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-yellow-400 opacity-40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <button onClick={() => { closeReward(); setShowCuriositiesModal(false); }} className="absolute top-4 right-4 z-20 text-yellow-600 hover:text-yellow-900 bg-yellow-200/50 hover:bg-yellow-300 p-2 rounded-full transition-all">
              <X className="w-5 h-5"/>
            </button>

            <div className="flex items-center gap-4 mb-2 md:mb-5 relative z-10">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-yellow-500/50 text-white border border-yellow-300 animar-libro group-hover:-rotate-12 transition-transform">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" />
              </div>
              <div>
                <span className="text-yellow-800 font-black text-xs uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-600 animate-pulse" /> Sabías que...
                </span>
                <h3 className="font-black text-stone-800 text-lg md:text-2xl leading-tight md:leading-none mt-1 group-hover:text-amber-700 transition-colors">{recompensa?.titulo || 'Semilla de Saber'}</h3>
              </div>
            </div>
            
            <div className="relative z-10 bg-white/40 backdrop-blur-md p-2 md:p-5 rounded-xl md:rounded-2xl border border-white/60 shadow-inner group-hover:bg-white/60 transition-colors">
              <p className="text-yellow-950 font-bold text-sm md:text-base leading-snug md:leading-relaxed">
                {recompensa?.contenido || 'Caminar 30 mins diarios reduce tu huella de carbono a cero y cuida tu corazón. ¡Cada paso es un respiro para el planeta!'}</p>
            </div>
          </div>
        </div>
      )}

      
      {/* MODAL: IMPACTO AMBIENTAL REAL */}
      {showImpactModal && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-emerald-950 rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] w-full max-w-4xl flex flex-col shadow-[0_-10px_60px_rgba(0,0,0,0.5)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 border-t md:border border-emerald-800 p-6 md:p-8 overflow-hidden">
            
            {/* Background effects */}
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500 opacity-10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-4 md:mb-8 relative z-10">
              <div>
                <h2 className="text-xl md:text-3xl font-black text-white flex items-center gap-2 md:gap-3">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" /> Impacto Ambiental Real
                </h2>
                <p className="text-emerald-400 text-xs font-bold mt-2 uppercase tracking-widest">Tu esfuerzo traducido a la naturaleza</p>
              </div>
              <button 
                onClick={() => setShowImpactModal(false)}
                className="p-3 bg-emerald-800/50 border border-emerald-700/50 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 hover:rotate-90 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-6 relative z-10">
              
              {/* Card 1: Arboles */}
              <div className="bg-emerald-900/40 p-2 md:p-8 rounded-[1.25rem] md:rounded-[2rem] border border-emerald-800 flex flex-row md:flex-col items-center text-left md:text-center shadow-inner gap-3 md:gap-0">
                <div className="w-8 h-8 md:w-20 md:h-20 shrink-0 rounded-full bg-emerald-800/80 border border-emerald-600 flex items-center justify-center mb-0 md:mb-6 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  <TreePine className="w-4 h-4 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col md:items-center w-full"><span className="text-xl md:text-5xl font-black text-white mb-0 md:mb-2 leading-none">{(co2 * 0.4).toFixed(1)}</span>
                <span className="text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-4 mt-1 md:mt-0">Árboles Simulados</span>
                <p className="text-emerald-200/60 hidden md:block text-sm leading-tight">Lo que un árbol absorbería en un mes.</p></div>
              </div>

              {/* Card 2: Auto */}
              <div className="bg-emerald-900/40 p-2 md:p-8 rounded-[1.25rem] md:rounded-[2rem] border border-emerald-800 flex flex-row md:flex-col items-center text-left md:text-center shadow-inner gap-3 md:gap-0">
                <div className="w-8 h-8 md:w-20 md:h-20 shrink-0 rounded-full bg-amber-900/40 border border-amber-600/50 flex items-center justify-center mb-0 md:mb-6 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <Car className="w-4 h-4 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col md:items-center w-full"><span className="text-xl md:text-5xl font-black text-white mb-0 md:mb-2 leading-none">{(co2 * 8.3).toFixed(1)} <span className="text-xl md:text-2xl">km</span></span>
                <span className="text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-4 mt-1 md:mt-0">Viaje Evitado</span>
                <p className="text-emerald-200/60 hidden md:block text-sm leading-tight">Kilómetros que no se recorrieron en auto.</p></div>
              </div>

              {/* Card 3: Energia */}
              <div className="bg-emerald-900/40 p-2 md:p-8 rounded-[1.25rem] md:rounded-[2rem] border border-emerald-800 flex flex-row md:flex-col items-center text-left md:text-center shadow-inner gap-3 md:gap-0">
                <div className="w-8 h-8 md:w-20 md:h-20 shrink-0 rounded-full bg-yellow-900/40 border border-yellow-500/50 flex items-center justify-center mb-0 md:mb-6 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  <Zap className="w-4 h-4 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col md:items-center w-full"><span className="text-xl md:text-5xl font-black text-white mb-0 md:mb-2 leading-none">{Math.round(calories * 1.16)} <span className="text-xl md:text-2xl">Wh</span></span>
                <span className="text-yellow-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-4 mt-1 md:mt-0">Energía Humana</span>
                <p className="text-emerald-200/60 hidden md:block text-sm leading-tight">Watts generados por tu movimiento físico.</p></div>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* MODAL: AJUSTAR METAS */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] w-full max-w-md flex flex-col shadow-[0_-10px_60px_rgba(0,0,0,0.3)] md:shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-400 border-t md:border border-white overflow-hidden">
            
            <div className="p-3 md:p-8 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-stone-50 to-white">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-stone-800 flex items-center gap-2 md:gap-3">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shadow-inner">
                    <Target className="w-6 h-6" />
                  </div>
                  Tus Metas
                </h2>
                <p className="hidden md:block text-stone-500 text-sm font-bold mt-2 uppercase tracking-wider">Define tus propios límites</p>
              </div>
              <button 
                onClick={() => setShowGoalModal(false)}
                className="p-3 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 hover:rotate-90 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-2 md:p-8 bg-stone-50/50">
              <div className="flex flex-col gap-2 md:gap-8">
                
                {/* Meta de CO2 */}
                <div className="bg-transparent md:bg-white/80 md:backdrop-blur-2xl p-0 md:p-7 rounded-none md:rounded-[2rem] border-0 md:border md:border-white/60 shadow-none md:shadow-2xl md:shadow-black/20">
                  <div className="flex justify-between items-center mb-3 md:mb-6">
                    <span className="font-black text-stone-700 flex items-center gap-2">
                      <Wind className="w-5 h-5 text-green-600"/> CO2 Evitado
                    </span>
                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-xl">{goalCo2} kg</span>
                  </div>
                  <input 
                    type="range" min="5" max="100" step="5" 
                    value={goalCo2} 
                    onChange={(e) => setGoalCo2(Number(e.target.value))} 
                    className="slider-clima" 
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-2 uppercase">
                    <span>5 kg</span>
                    <span>100 kg</span>
                  </div>
                </div>

                {/* Meta de Calorías */}
                <div className="bg-transparent md:bg-white/80 md:backdrop-blur-2xl p-0 md:p-7 rounded-none md:rounded-[2rem] border-0 md:border md:border-white/60 shadow-none md:shadow-2xl md:shadow-black/20">
                  <div className="flex justify-between items-center mb-3 md:mb-6">
                    <span className="font-black text-stone-700 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-orange-600"/> Calorías
                    </span>
                    <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-xl">{goalCalories} kcal</span>
                  </div>
                  <input 
                    type="range" min="500" max="5000" step="100" 
                    value={goalCalories} 
                    onChange={(e) => setGoalCalories(Number(e.target.value))} 
                    className="slider-salud" 
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-2 uppercase">
                    <span>500 kcal</span>
                    <span>5000 kcal</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowGoalModal(false)} 
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white font-black uppercase tracking-widest text-sm py-2 md:py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" /> Guardar Mis Metas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE ACCIONES */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-lg max-h-[85vh] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-400 border border-white">
            
            <div className="p-3 md:p-8 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-stone-50 to-white rounded-t-[2.5rem]">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-stone-800 flex items-center gap-2 md:gap-3">
                  <div className="bg-green-100 p-2 rounded-xl text-green-700 shadow-inner">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  Línea de Tiempo
                </h2>
                <p className="text-stone-500 text-sm font-bold mt-2 uppercase tracking-wider">Tu impacto detallado</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-3 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 hover:rotate-90 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto scrollbar-hide">
              {history.length > 0 ? (
                <div className="flex flex-col gap-6 relative before:absolute before:inset-y-0 before:left-[15px] before:w-1 before:bg-gradient-to-b before:from-green-300 before:to-orange-300 before:rounded-full">
                  {history.map((item, index) => (
                    <div key={item.id} className="flex gap-1 md:gap-6 relative z-10 group cursor-default">
                      <div className={`w-8 h-8 rounded-full border-4 border-white flex-shrink-0 mt-1 shadow-lg transition-transform group-hover:scale-125 ${item.type === 'clima' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-orange-400 to-rose-500'}`} />
                      <div className="bg-white w-full p-4 rounded-2xl border border-stone-100 shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                        <p className="font-black text-stone-800 text-lg">{item.text}</p>
                        <p className="text-stone-400 text-xs font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.time}
                        </p>
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

      {/* MODAL: RACHAS */}
      {showStreakModal && (
        <div className="fixed inset-0 bg-orange-950/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-lg max-h-[85vh] flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-400 border border-white">
            
            <div className="p-3 md:p-8 border-b border-stone-100 flex justify-between items-center bg-gradient-to-r from-stone-50 to-orange-50/30 rounded-t-[2.5rem]">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-stone-800 flex items-center gap-2 md:gap-3">
                  <div className="bg-orange-100 p-2 rounded-xl text-orange-600 shadow-inner">
                    <Activity className="w-6 h-6" />
                  </div>
                  Progreso Diario
                </h2>
                <p className="text-stone-500 text-sm font-bold mt-2 uppercase tracking-wider">Tu racha día tras día</p>
              </div>
              <button 
                onClick={() => setShowStreakModal(false)}
                className="p-3 bg-white border border-stone-200 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 hover:rotate-90 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto scrollbar-hide bg-stone-50/50 rounded-b-[2.5rem]">
              {streakData.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {streakData.map((dia) => (
                    <div key={dia.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-stone-100 text-stone-500 p-3 rounded-2xl font-black uppercase tracking-widest text-xs w-24 text-center group-hover:bg-stone-800 group-hover:text-white transition-colors">
                          {dia.date}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
                          <Wind className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700 text-sm">{dia.co2}kg</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
                          <HeartPulse className="w-4 h-4 text-orange-600" />
                          <span className="font-bold text-orange-700 text-sm">{dia.cal} kcal</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 opacity-50">
                  <Flame className="w-12 h-12 text-stone-400" />
                  <p className="text-stone-500 font-bold uppercase tracking-widest text-sm">Tu racha está en cero</p>
                  <p className="text-stone-400 text-xs">Siembra una acción hoy para encender la llama.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}


      {/* MODAL: VICTORIA TOTAL */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-[100] bg-emerald-950/90 backdrop-blur-2xl flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-500">
          <div className="relative w-full max-w-lg p-8 md:p-10 rounded-t-[3rem] rounded-b-none md:rounded-b-[3rem] overflow-hidden shadow-[0_-10px_100px_rgba(234,179,8,0.5)] border-t-2 md:border-2 text-center animate-in slide-in-from-bottom-full md:zoom-in-95 duration-500 bg-gradient-to-br from-emerald-600 via-green-500 to-orange-500 border-yellow-300">
            <div className="absolute inset-0 w-full h-full efecto-shiny mix-blend-overlay opacity-60 z-0"></div>
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-yellow-300 opacity-40 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex justify-center mb-3 md:mb-6 gap-3 md:gap-4">
              <div className="bg-white/20 backdrop-blur-md p-3 md:p-5 rounded-full border border-white/50 shadow-2xl animar-latido-planeta">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="bg-white/20 backdrop-blur-md p-3 md:p-5 rounded-full border border-white/50 shadow-2xl animar-latido-planeta" style={{ animationDelay: '0.5s' }}>
                <HeartPulse className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>

            <h2 className="relative z-10 text-4xl font-black text-white mb-2 drop-shadow-lg tracking-tight uppercase">
              ¡DÍA SUPERADO!
            </h2>
            
            <span className="relative z-10 inline-block bg-white/20 text-white font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-widest mb-3 md:mb-6 border border-white/30 backdrop-blur-sm shadow-inner">
              Has alcanzado tus metas de hoy y tu huella verde es un ejemplo para todos.
            </span>
            
            <div className="hidden md:block relative z-10 bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-inner mb-8">
              <p className="text-white/95 font-medium text-sm md:text-base leading-snug md:leading-relaxed italic drop-shadow-sm">
                "El verdadero progreso no se mide por aquello que conquistamos, sino por la vida que logramos preservar. Cada decisión consciente que tomamos hoy, es el aliento de las generaciones del mañana."
              </p>
            </div>

            <button 
              onClick={() => setShowVictoryModal(false)}
              className="relative z-10 w-full bg-white text-stone-900 hover:bg-stone-100 font-black uppercase tracking-widest text-sm py-2 md:py-4 rounded-2xl shadow-xl hover:shadow-[0_10px_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-yellow-500" /> ¡Continuar!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
