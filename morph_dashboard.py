import re

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
imports = """/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { BookOpen, Flame, Leaf, Wind, Clock, TrendingUp, Target, X, CalendarDays, Sparkles, RefreshCw, Activity, HeartPulse, SlidersHorizontal, Globe, User, Mail, ArrowRight, LogIn } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import Background from './Background';
import { AnimatedHeartIcon, AnimatedWindIcon } from './AnimatedIcons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const CHART_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
"""
content = re.sub(r'"use client";.*?type HistoryItem = \{.*?\};', imports, content, flags=re.DOTALL)

# Remove local components that were moved out
content = re.sub(r'// COMPONENTE: Corazón.*?export default function KawsayEcoDash\(\) \{', 'export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {', content, flags=re.DOTALL)

# Replace state and variables
state_replacement = """  const { dashboard, acciones, loading, error, recompensa, showReward, handleAction, closeReward, refreshData } = useDashboard();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryShown, setVictoryShown] = useState(false);

  // Derived state from dashboard
  const co2 = dashboard?.impacto_global_co2 || 0;
  const calories = dashboard?.impacto_global_calorias || 0;
  const streak = dashboard?.racha_dias || 0;
  const history = dashboard?.historial_acciones || [];
  const streakData = dashboard?.racha_dias > 0 ? [{ id: 1, date: 'Hoy', co2: co2, cal: calories }] : [];
  const desglose_grafico = dashboard?.desglose_grafico || [];

  const goalCo2 = 20;
  const goalCalories = 2000;
  const co2Percent = Math.min((co2 / goalCo2) * 100, 100);
  const calPercent = Math.min((calories / goalCalories) * 100, 100);
  const totalScore = dashboard?.xp_total || 0;

  useEffect(() => {
    if (co2 >= goalCo2 && calories >= goalCalories && !victoryShown) {
      setShowVictoryModal(true);
      setVictoryShown(true);
    }
  }, [co2, calories, victoryShown, goalCo2, goalCalories]);

"""
content = re.sub(r'  // --- ESTADOS DE AUTENTICACIÓN.*?(?:return \()', state_replacement + '  return (', content, flags=re.DOTALL)

# Remove PANTALLA 1 (Login)
content = re.sub(r'\{/\* PANTALLA 1: PORTADA / LOGIN \*/\}.*?\{/\* PANTALLA 2: DASHBOARD PRINCIPAL \*/\}', '{/* PANTALLA 2: DASHBOARD PRINCIPAL */}', content, flags=re.DOTALL)

# Fix background tag
content = content.replace('<AutumnLeaves />', '<Background />')

# Remove the inner `{!isAuthenticated &&` and `{isAuthenticated &&` wrappers
content = re.sub(r'\{isAuthenticated && \(\s*<div', '<div', content)
# We also need to remove the closing bracket of isAuthenticated.
# Instead of perfect regex, I will just do string replacement where possible.

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
