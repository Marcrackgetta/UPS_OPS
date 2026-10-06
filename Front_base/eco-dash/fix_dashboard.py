import re

with open("components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix showHistoryModal
content = content.replace("const [showStreakModal, setShowStreakModal] = useState(false);", "const [showStreakModal, setShowStreakModal] = useState(false);\n  const [showHistoryModal, setShowHistoryModal] = useState(false);")

streakData_fix = """
  const streakData = [
    { id: 1, date: 'Hoy', co2: co2, cal: calories }
  ];
  const history: any[] = [];
"""
content = content.replace("const CHART_COLORS = ['#34d399', '#fcd34d', '#fb923c', '#60a5fa', '#a78bfa'];", "const CHART_COLORS = ['#34d399', '#fcd34d', '#fb923c', '#60a5fa', '#a78bfa'];\n" + streakData_fix)

content = re.sub(r'onChange=\{\(e\) => setGoalCo2\(e\.target\.value\)\}', 'onChange={(e) => setGoalCo2(Number(e.target.value))}', content)
content = re.sub(r'onChange=\{\(e\) => setGoalCalories\(e\.target\.value\)\}', 'onChange={(e) => setGoalCalories(Number(e.target.value))}', content)

content = content.replace("onClick={resetDashboard}", "onClick={onLogout}")
content = content.replace("resetDashboard", "onLogout")

with open("components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
