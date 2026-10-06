import re

with open("components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
content = content.replace("import { getDashboard, getCatalogoAcciones, registrarAccion } from '../lib/api';", "import { useDashboard } from '../hooks/useDashboard';")

state_pattern = r"const \[isLoaded, setIsLoaded\].*?const handleAction = async.*?\}\s*catch.*?\n  \};\n"
replacement = """  const { dashboard, acciones, loading, error, recompensa, showReward, handleAction, closeReward } = useDashboard();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [goalCo2, setGoalCo2] = useState(20);
  const [goalCalories, setGoalCalories] = useState(2000);

  useEffect(() => {
    setIsLoaded(true);
  }, []);
"""

content = re.sub(state_pattern, replacement, content, flags=re.DOTALL)
content = content.replace("setShowReward(false)", "closeReward()")

with open("components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
