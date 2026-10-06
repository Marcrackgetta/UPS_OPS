import re

def process_bonito():
    with open("Front_Bonito/eco-dash/app/page.tsx", "r", encoding="utf-8") as f:
        bonito = f.read()

    # Extract Login Modal
    login_match = re.search(r'\{/\*\s*PANTALLA 1: PORTADA / LOGIN\s*\*/\}(.*?)\{/\*\s*=========================================================================\s*\*/\}', bonito, re.DOTALL)
    if login_match:
        with open("scratch_login.tsx", "w", encoding="utf-8") as f:
            f.write(login_match.group(1))
            
    # Extract Dashboard
    dashboard_match = re.search(r'\{/\*\s*PANTALLA 2: DASHBOARD PRINCIPAL\s*\*/\}(.*?)(?:\{/\*\s*MODAL|$)', bonito, re.DOTALL)
    if dashboard_match:
        with open("scratch_dashboard.tsx", "w", encoding="utf-8") as f:
            f.write(dashboard_match.group(1))

process_bonito()
