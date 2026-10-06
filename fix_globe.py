with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { BookOpen, Flame, Leaf, Wind, Clock, TrendingUp, Target, X, CalendarDays, Sparkles, RefreshCw, Activity, HeartPulse, SlidersHorizontal } from 'lucide-react';", "import { BookOpen, Flame, Leaf, Wind, Clock, TrendingUp, Target, X, CalendarDays, Sparkles, RefreshCw, Activity, HeartPulse, SlidersHorizontal, Globe } from 'lucide-react';\nimport Background from './Background';\nimport { AnimatedHeartIcon, AnimatedWindIcon } from './AnimatedIcons';")

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
