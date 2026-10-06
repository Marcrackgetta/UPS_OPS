with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the duplicated import
content = content.replace("import { AnimatedHeartIcon, AnimatedWindIcon } from './AnimatedIcons';\n", "")

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
