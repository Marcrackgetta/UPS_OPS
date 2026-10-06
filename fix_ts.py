with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix goalCo2 / goalCalories used before declaration
state_inject_fixed = """  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryShown, setVictoryShown] = useState(false);
  const goalCo2 = 20;
  const goalCalories = 2000;

  useEffect(() => {
    const currentCo2 = dashboard?.impacto_global_co2 || 0;
    const currentCal = dashboard?.impacto_global_calorias || 0;
    if (currentCo2 >= goalCo2 && currentCal >= goalCalories && !victoryShown) {
      setShowVictoryModal(true);
      setVictoryShown(true);
    }
  }, [dashboard?.impacto_global_co2, dashboard?.impacto_global_calorias, victoryShown]);
"""
# Replace the old inject block
old_inject = """  const [showGoalModal, setShowGoalModal] = useState(false);
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
content = content.replace(old_inject, state_inject_fixed)

# Remove the latter declarations of goalCo2 and goalCalories
content = content.replace("  const goalCo2 = 20;\n", "")
content = content.replace("  const goalCalories = 2000;\n", "")

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
