import re

with open("components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_buttons_html = """
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
"""

# Match both buttons blocks precisely using regex
content = re.sub(r'\{\/\*\s*BOT.*?handleAction\(\'clima\'\).*?</button>\s*\{\/\*\s*BOT.*?handleAction\(\'salud\'\).*?</button>', new_buttons_html, content, flags=re.DOTALL)

with open("components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
