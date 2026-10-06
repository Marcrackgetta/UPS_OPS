import re

with open("Front_Bonito/eco-dash/app/page.tsx", "r", encoding="utf-8") as f:
    bonito = f.read()

def extract_block(pattern, flags=re.DOTALL):
    m = re.search(pattern, bonito, flags)
    return m.group(1) if m else ""

# 1. Background animations component
bg_js = """import React from 'react';
import { Leaf } from 'lucide-react';

"""
bg_js += extract_block(r'(// COMPONENTE: Lluvia de Hojas de Otoño.*?};)', re.DOTALL)
bg_js += """

export default function Background() {
  return (
    <>
      <AutumnLeaves />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="luciernaga bg-yellow-300/30 blur-sm rounded-full w-5 h-5 absolute shadow-[0_0_15px_rgba(253,224,71,0.8)]" style={{ left: '20%', bottom: '30%', animationDelay: '0s' }}></div>
        <div className="luciernaga bg-yellow-300/20 blur-sm rounded-full w-7 h-7 absolute shadow-[0_0_20px_rgba(253,224,71,0.6)]" style={{ left: '80%', bottom: '50%', animationDelay: '2s' }}></div>
      </div>
      <style>{`
"""
bg_js += extract_block(r'<style>\{`(.*?)`\}</style>', re.DOTALL)
bg_js += """
      `}</style>
    </>
  );
}
"""
with open("Front_base/eco-dash/components/Background.tsx", "w", encoding="utf-8") as f:
    f.write(bg_js)

# 2. Extract SVG components
svg_code = "import React from 'react';\n"
svg_code += extract_block(r'(// COMPONENTE: Corazón.*?)(?:// COMPONENTE: Lluvia de Hojas)', re.DOTALL)
svg_code = svg_code.replace("const AnimatedHeartIcon", "export const AnimatedHeartIcon").replace("const AnimatedWindIcon", "export const AnimatedWindIcon")

with open("Front_base/eco-dash/components/AnimatedIcons.tsx", "w", encoding="utf-8") as f:
    f.write(svg_code)

print("Split UI success")
