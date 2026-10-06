with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace("import { Leaf, Wind, Activity, Globe, Flame, CalendarDays, RefreshCw, X, Target, HeartPulse } from 'lucide-react';", "import { Leaf, Wind, Activity, Globe, Flame, CalendarDays, RefreshCw, X, Target, HeartPulse, Sparkles, BookOpen } from 'lucide-react';\nimport Background from './Background';\nimport { AnimatedHeartIcon, AnimatedWindIcon } from './AnimatedIcons';")

# 2. Add Victory Modal states to DashboardScreen
state_inject = """  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryShown, setVictoryShown] = useState(false);

  useEffect(() => {
    const currentCo2 = dashboard?.impacto_global_co2 || 0;
    const currentCal = dashboard?.impacto_global_calorias || 0;
    if (currentCo2 >= goalCo2 && currentCal >= goalCalories && !victoryShown) {
      setShowVictoryModal(true);
      setVictoryShown(true);
    }
  }, [dashboard?.impacto_global_co2, dashboard?.impacto_global_calorias, victoryShown, goalCo2, goalCalories]);
"""
content = content.replace("  const [showGoalModal, setShowGoalModal] = useState(false);", state_inject)

# 3. Update the main wrapper className and inject <Background />
old_wrapper = '<div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-green-500 selection:text-white">'
new_wrapper = '<div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 text-stone-800 font-sans selection:bg-green-500 selection:text-white overflow-hidden relative">\n      <Background />'
content = content.replace(old_wrapper, new_wrapper)

# 4. Inject Victoria Modal at the bottom
victory_modal = """
      {/* MODAL: VICTORIA TOTAL */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-[100] bg-emerald-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="relative w-full max-w-lg p-10 rounded-[3rem] shadow-[0_0_100px_rgba(234,179,8,0.5)] border-2 text-center overflow-hidden animate-in zoom-in-95 duration-500 bg-gradient-to-br from-emerald-600 via-green-500 to-orange-500 border-yellow-300">
            <div className="absolute inset-0 w-full h-full efecto-shiny mix-blend-overlay opacity-60 z-0"></div>
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-white opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-yellow-300 opacity-40 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex justify-center mb-6 gap-4">
              <div className="bg-white/20 backdrop-blur-md p-5 rounded-full border border-white/50 shadow-2xl animar-latido-planeta">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <div className="bg-white/20 backdrop-blur-md p-5 rounded-full border border-white/50 shadow-2xl animar-latido-planeta" style={{ animationDelay: '0.5s' }}>
                <HeartPulse className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="relative z-10 text-4xl font-black text-white mb-2 drop-shadow-lg tracking-tight uppercase">
              ¡DÍA SUPERADO!
            </h2>
            
            <span className="relative z-10 inline-block bg-white/20 text-white font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-widest mb-6 border border-white/30 backdrop-blur-sm shadow-inner">
              Has alcanzado tus metas de hoy y tu huella verde es un ejemplo para todos.
            </span>
            
            <div className="relative z-10 bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-inner mb-8">
              <p className="text-white/95 font-medium text-base leading-relaxed italic drop-shadow-sm">
                "El verdadero progreso no se mide por aquello que conquistamos, sino por la vida que logramos preservar. Cada decisión consciente que tomamos hoy, es el aliento de las generaciones del mañana."
              </p>
            </div>

            <button 
              onClick={() => setShowVictoryModal(false)}
              className="relative z-10 w-full bg-white text-stone-900 hover:bg-stone-100 font-black uppercase tracking-widest text-sm py-4 rounded-2xl shadow-xl hover:shadow-[0_10px_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-yellow-500" /> ¡Continuar!
            </button>
          </div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", victory_modal + "\n    </div>\n  );\n}")

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
