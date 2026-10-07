import re

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r"import\s*\{\s*PieChart.*?\}\s*from\s*'recharts';\s*\n", "", content)

# Also, desglose_grafico might be declared but unused.
# const desglose_grafico = dashboard.desglose_grafico || [];
# const CHART_COLORS = ['#34d399', '#fcd34d', '#fb923c', '#60a5fa', '#a78bfa'];
content = re.sub(r"const desglose_grafico = dashboard\.desglose_grafico \|\| \[\];\s*\n", "", content)
content = re.sub(r"const CHART_COLORS = \['#34d399', '#fcd34d', '#fb923c', '#60a5fa', '#a78bfa'\];\s*\n", "", content)

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Removed recharts imports and unused vars")
