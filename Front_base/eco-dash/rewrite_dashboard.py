import re

with open("components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Change imports to add PieChart, Pie, Cell, ResponsiveContainer from recharts
import_statement = """import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { getDashboard, getCatalogoAcciones, registrarAccion } from '../lib/api';
"""
content = re.sub(r"import React,.*?from 'react';", import_statement, content, flags=re.DOTALL)

# Change function signature
content = content.replace("export default function KawsayEcoDash() {", "export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {")

# We will replace the state setup. We'll search for the block from "const [co2, setCo2]..." until the start of "return ("
state_block_pattern = r"const \[co2, setCo2\].*?const resetDashboard = \(\) => \{.*?\};\n"

new_state_block = """
  const [isLoaded, setIsLoaded] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [acciones, setAcciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);
  const [recompensa, setRecompensa] = useState<any>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [goalCo2, setGoalCo2] = useState(20);
  const [goalCalories, setGoalCalories] = useState(2000);
  
  useEffect(() => {
    setIsLoaded(true);
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dashRes, catRes] = await Promise.all([
        getDashboard(),
        getCatalogoAcciones()
      ]);
      setDashboard(dashRes);
      setAcciones(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (accion_id: number) => {
    try {
      const res = await registrarAccion(accion_id);
      
      // Actualizar dashboard optimista
      setDashboard((prev: any) => ({
        ...prev,
        impacto_global_co2: prev.impacto_global_co2 + res.transaccion.co2_ganado_kg,
        impacto_global_calorias: prev.impacto_global_calorias + res.transaccion.calorias_ganadas,
        xp_total: res.estado_usuario.xp_total,
        nivel_actual: res.estado_usuario.nivel_actual,
        racha_dias: res.estado_usuario.racha_dias
      }));

      // Mostrar recompensa si hay
      if (res.recompensa_educativa) {
        setRecompensa(res.recompensa_educativa);
        setShowReward(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error registrando acción");
    }
  };

  if (loading || !dashboard) {
    return <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-950 flex items-center justify-center text-white">Cargando tu progreso...</div>;
  }

  const co2 = dashboard.impacto_global_co2 || 0;
  const calories = dashboard.impacto_global_calorias || 0;
  const streak = dashboard.racha_dias || 0;
  const totalScore = dashboard.xp_total || 0;
  const nivel = dashboard.nivel_actual || 1;
  const nombre = dashboard.nombre_usuario || "Estudiante";

  const co2Percent = Math.min((co2 / goalCo2) * 100, 100);
  const calPercent = Math.min((calories / goalCalories) * 100, 100);
  const desglose_grafico = dashboard.desglose_grafico || [];
  const CHART_COLORS = ['#34d399', '#fcd34d', '#fb923c', '#60a5fa', '#a78bfa'];

"""
content = re.sub(state_block_pattern, new_state_block, content, flags=re.DOTALL)

# Replace local mocked variables inside the JSX
content = content.replace("{totalScore}", "{totalScore}")
# Actually {totalScore} is matched already.
# Fix reset/logout button.
content = content.replace('onClick={resetDashboard} className="flex-1 border border-stone-200 text-stone-600', 'onClick={onLogout} className="flex-1 border border-stone-200 text-stone-600')
content = content.replace('Empezar de cero', 'Cerrar Sesión')

# Replace the two hardcoded action buttons with a dynamic map of 'acciones'
actions_html_pattern = r'<div className="bg-gradient-to-br from-emerald-400 to-green-500 p-8 rounded-3xl.*?<h3 className="text-xl font-bold text-white mb-6">¿Qué hiciste hoy\?</h3>.*?<div className="grid grid-cols-2 gap-4">.*?</div>.*?</div>'

new_actions_html = """
<div className="bg-gradient-to-br from-emerald-400 to-green-500 p-8 rounded-3xl shadow-xl border border-white/20 relative overflow-hidden group">
  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-700"></div>
  <h3 className="text-xl font-bold text-white mb-6 relative z-10">¿Qué hiciste hoy?</h3>
  <div className="grid grid-cols-2 gap-4 relative z-10">
    {acciones.map((acc, idx) => {
      // Pick icon based on some string matching, or default
      const iconMap: Record<string, any> = { 'clima': Wind, 'salud': HeartPulse, 'default': Leaf };
      const IconCmp = iconMap[acc.categoria?.toLowerCase() || 'default'] || Leaf;
      return (
        <button key={acc.id} onClick={() => handleAction(acc.id)} className="group flex flex-col items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-white/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95">
          <div className={`p-3 rounded-xl shadow-inner ${idx % 2 === 0 ? 'bg-gradient-to-br from-emerald-100 to-white text-emerald-600' : 'bg-gradient-to-br from-orange-100 to-white text-orange-500'}`}>
            <IconCmp className="w-6 h-6" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">{acc.titulo}</span>
        </button>
      );
    })}
  </div>
</div>
"""
content = re.sub(actions_html_pattern, new_actions_html, content, flags=re.DOTALL)

# Let's also add Recharts to some place. Maybe replace the "Tus Metas Actuales" card (or add it next to it).
# But the user asked to implement recharts explicitly.
# Wait, there's a card for "Historial de Racha". I'll put the Recharts donut there.
recharts_html = """
<div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl relative overflow-hidden">
  <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
    <Activity className="w-5 h-5 text-emerald-500" /> Desglose de Impacto
  </h3>
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
      <div className="flex items-center justify-center h-full text-stone-400">Sin datos registrados</div>
    )}
  </div>
</div>
"""

# Replace the history or some part of the grid with the chart.
# Let's replace the History card (the one with the list of history) or the "Streak modal" content with it. No, we can just replace the whole history section with the chart since history array is mocked.
history_card_pattern = r'<div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl relative overflow-hidden group">.*?<h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">.*?<div className="space-y-4 relative z-10">.*?</div>.*?<button.*?Ver historial completo.*?</button>.*?</div>'
content = re.sub(history_card_pattern, recharts_html, content, flags=re.DOTALL)

# Modals: Reward Modal
# Currently the Reward Modal shows static text. Replace with `recompensa` dynamic text.
reward_modal_pattern = r'<h2 className="text-3xl font-black text-stone-800 tracking-tight">¡ODS 13 Desbloqueado!</h2>.*?<p className="text-stone-600 mb-6 font-medium">.*?El uso de bicicleta.*?<div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-8">'
new_reward_modal = """
<h2 className="text-3xl font-black text-stone-800 tracking-tight">¡Nuevo Logro Desbloqueado!</h2>
<p className="text-stone-600 mb-6 font-medium">
  {recompensa?.titulo || "¡Has avanzado en tu compromiso con el planeta!"}
</p>
<div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-8 text-sm text-stone-700">
  {recompensa?.contenido}
</div>
<div className="hidden">
"""
content = re.sub(reward_modal_pattern, new_reward_modal, content, flags=re.DOTALL)


with open("components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)

