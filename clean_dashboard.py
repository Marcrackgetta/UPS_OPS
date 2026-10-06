import re

with open("Front_Bonito/eco-dash/app/page.tsx", "r", encoding="utf-8") as f:
    bonito = f.read()

# Start with a clean slate
clean_dashboard = """/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { BookOpen, Flame, Leaf, Wind, Clock, TrendingUp, Target, X, CalendarDays, Sparkles, RefreshCw, Activity, HeartPulse, SlidersHorizontal, Globe, User, Mail, ArrowRight, LogIn } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import Background from './Background';
import { AnimatedHeartIcon, AnimatedWindIcon } from './AnimatedIcons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const CHART_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const { dashboard, acciones, loading, error, recompensa, showReward, handleAction, closeReward, refreshData } = useDashboard();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryShown, setVictoryShown] = useState(false);

  // Derived state
  const co2 = dashboard?.impacto_global_co2 || 0;
  const calories = dashboard?.impacto_global_calorias || 0;
  const streak = dashboard?.racha_dias || 0;
  const history = dashboard?.historial_acciones || [];
  const desglose_grafico = dashboard?.desglose_grafico || [];
  const totalScore = dashboard?.xp_total || 0;

  const goalCo2 = 20;
  const goalCalories = 2000;
  const co2Percent = Math.min((co2 / goalCo2) * 100, 100);
  const calPercent = Math.min((calories / goalCalories) * 100, 100);

  useEffect(() => {
    if (co2 >= goalCo2 && calories >= goalCalories && !victoryShown) {
      setShowVictoryModal(true);
      setVictoryShown(true);
    }
  }, [co2, calories, victoryShown, goalCo2, goalCalories]);

  const streakData = streak > 0 ? [{ id: 1, date: 'Hoy', co2: co2, cal: calories }] : [];

"""

# Extract the return block from Front_Bonito
return_match = re.search(r'  return \(\s*<div className="min-h-screen(.*?)  \);\n\}', bonito, re.DOTALL)
if return_match:
    return_block = return_match.group(1)
    
    # We replace <AutumnLeaves /> with <Background />
    return_block = return_block.replace("<AutumnLeaves />", "<Background />")
    # And we remove the static styles and background divs because they are now in <Background />
    return_block = re.sub(r'<div className="absolute inset-0 pointer-events-none overflow-hidden z-0">.*?</div>\s*<style>.*?</style>', '', return_block, flags=re.DOTALL)
    
    # Remove PORTADA
    return_block = re.sub(r'\{/\* ========================================================================= \*/\}\s*\{/\* PANTALLA 1: PORTADA / LOGIN \*/\}.*?\{/\* ========================================================================= \*/\}\s*\{/\* PANTALLA 2: DASHBOARD PRINCIPAL \*/\}', '{/* PANTALLA 2: DASHBOARD PRINCIPAL */}', return_block, flags=re.DOTALL)
    
    # Remove the `{!isAuthenticated &&` and `{isAuthenticated &&` wrappers. This is tricky.
    # The `{isAuthenticated && (` wrapper starts after PANTALLA 2: DASHBOARD PRINCIPAL.
    # We will just strip it and its matching closing brace by replacing it.
    return_block = re.sub(r'\{isAuthenticated && \(\s*<div className="relative z-10', '<div className="relative z-10', return_block)
    # The end of the wrapper is `      )}` right before the victory modal.
    return_block = return_block.replace("      )}\n\n      {/* --- EL RECUADRO GIGANTE", "\n      {/* --- EL RECUADRO GIGANTE")

    # Change buttons to use real data
    # The actions are hardcoded like `onClick={() => handleAction('clima')}`. Let's replace the whole buttons section with a map.
    buttons_html = """
                {acciones.map((acc: any) => {
                  const IconCmp = acc.categoria?.toLowerCase() === 'clima' ? AnimatedWindIcon : acc.categoria?.toLowerCase() === 'salud' ? AnimatedHeartIcon : Leaf;
                  return (
                    <button 
                      key={acc.id}
                      onClick={() => handleAction(acc.id)} 
                      className={`group relative overflow-hidden flex items-center gap-5 bg-white border-2 p-4 rounded-2xl transition-all duration-300 text-left border-emerald-100 hover:border-emerald-400 active:scale-[0.97] shadow-sm hover:shadow-[0_10px_20px_rgba(52,211,153,0.3)]`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
                      <div className="bg-gradient-to-br from-emerald-400 to-green-600 p-3 rounded-xl shadow-lg shadow-emerald-500/40 z-10 transition-transform text-white border border-emerald-300">
                        <IconCmp className="w-6 h-6 text-white" />
                      </div>
                      <div className="z-10">
                        <h3 className="font-black text-lg text-stone-800 group-hover:text-emerald-900 transition-colors">
                          {acc.titulo}
                        </h3>
                        <p className="text-stone-500 text-sm font-bold">+{acc.impacto_co2_kg}kg CO2 | +{acc.xp_otorgada} XP</p>
                      </div>
                    </button>
                  );
                })}
"""
    return_block = re.sub(r'\{/\* BOTÓN CLIMA.*?</button>', buttons_html, return_block, flags=re.DOTALL)
    
    # We also need to remove the REINICIO button and replace it with onLogout
    return_block = return_block.replace("onClick={resetDashboard}", "onClick={onLogout}")
    return_block = return_block.replace("Empezar de cero", "Cerrar Sesión")
    
    # And inject Recharts somewhere. Let's put it right after the actions block.
    recharts_html = """
              <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20 mt-6">
                <h2 className="text-xl font-black text-stone-800 mb-5 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-emerald-600"/> Desglose de Impacto
                </h2>
                <div className="h-48 w-full">
                  {desglose_grafico.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={desglose_grafico} dataKey="total_co2_kg" nameKey="categoria" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                          {desglose_grafico.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-stone-400 font-medium">Sin datos registrados</div>
                  )}
                </div>
              </div>
"""
    return_block = return_block.replace("</div>\n\n            </div>\n          </div>\n        </div>", "</div>\n\n            </div>\n" + recharts_html + "\n          </div>\n        </div>")

    # For the reward modal, we replace the fake one with the real one from our recompensa state
    reward_modal_fake = r'\{showReward && \(\s*<div.*?\{/\* --- EL RECUADRO GIGANTE'
    reward_modal_real = """
      {showReward && recompensa && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-md p-10 text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-400 border border-white overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-100 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 border-4 border-white rotate-12 transition-transform hover:rotate-0">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-black text-stone-800 mb-2">{recompensa.mensaje_educativo}</h2>
              <div className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                ODS {recompensa.ods_relacionado}
              </div>
              
              <button 
                onClick={closeReward}
                className="w-full bg-stone-900 text-white hover:bg-emerald-600 font-black uppercase tracking-widest text-sm py-4 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EL RECUADRO GIGANTE"""
    return_block = re.sub(reward_modal_fake, reward_modal_real, return_block, flags=re.DOTALL)
    
    clean_dashboard += "  return (\n    <div className=\"min-h-screen" + return_block + "\n  );\n}\n"
    
    with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
        f.write(clean_dashboard)
else:
    print("Could not match return block")
