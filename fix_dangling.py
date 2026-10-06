with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        if "      )}" in line and i > 250 and i < 350:
            f.write(line.replace("      )}", ""))
        else:
            f.write(line)
