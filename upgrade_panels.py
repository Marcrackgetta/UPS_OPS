with open("Front_base/eco-dash/components/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace panel styles
content = content.replace('bg-white p-6 rounded-3xl border border-stone-200 shadow-sm', 'bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20')
content = content.replace('bg-white p-8 rounded-3xl border border-stone-200 shadow-sm', 'bg-white/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20')
content = content.replace('bg-white p-7 rounded-[2rem] border border-stone-100 shadow-md', 'bg-white/80 backdrop-blur-2xl p-7 rounded-[2rem] border border-white/60 shadow-2xl shadow-black/20')

with open("Front_base/eco-dash/components/DashboardScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
