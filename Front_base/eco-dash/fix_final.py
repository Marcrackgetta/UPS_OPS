import re

with open("components/LoginScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()
content = "/* eslint-disable @typescript-eslint/no-explicit-any */\n" + content
with open("components/LoginScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = "/* eslint-disable @typescript-eslint/no-explicit-any */\n/* eslint-disable @typescript-eslint/no-unused-vars */\n" + content

sidebar_pattern = r'(<div className="flex flex-col gap-6">)'
chart_html = """\\1
            <div className="bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20">
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
content = re.sub(sidebar_pattern, chart_html, content, count=1)

with open("components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
