# Kawsay Eco-Dash | ODS 3, 4 y 13

**Kawsay Eco-Dash** es una plataforma web interactiva y gamificada desarrollada para el **Concurso Intercolegial "Multimedia Teens 2026"** (Categoría Diseño Web — Universidad Politécnica Salesiana, Sede Guayaquil) por estudiantes de la **Academia Naval Almirante Illingworth**.

Su objetivo es transformar acciones cotidianas de sostenibilidad y bienestar en métricas cuantificables alineadas con tres Objetivos de Desarrollo Sostenible de la ONU:
- **ODS 3 (Salud y Bienestar):** Seguimiento de calorías quemadas (`kcal`) mediante movilidad activa y hábitos saludables.
- **ODS 4 (Educación de Calidad):** Sistema progresivo de cápsulas educativas desbloqueables por nivel y puntos de experiencia (`XP`).
- **ODS 13 (Acción por el Clima):** Cuantificación de emisiones de $\text{CO}_2$ evitadas (`kg`), equivalencias ambientales reales y visualización por categorías mediante gráfico de anillo SVG y barras de progreso.

---

## 1. Arquitectura del Proyecto

El sistema implementa una arquitectura desacoplada de tres capas:

1. **Frontend (`Front_base/eco-dash`):**
   - **Framework:** Next.js 16 (App Router) + React 19 + TypeScript.
   - **Estilos y UI:** Tailwind CSS v4 con estética *Eco-Glassmorphism*, diseño *Mobile-First*, soporte de accesibilidad WCAG (`role="dialog"`, `aria-modal="true"`, navegación por teclado `Escape`, `aria-label` y `@media (prefers-reduced-motion: reduce)`).
   - **Estado y Sincronización:** Custom Hook `useDashboard.ts` con actualización optimista en tiempo real, persistencia local de metas diarias (`localStorage`) y sincronización dual con Supabase.

2. **Backend (`Back_UPS`):**
   - **Framework:** FastAPI (Python 3) + Pydantic v2 + Uvicorn.
   - **Servicios de Dominio:**
     - `app/services/racha_service.py`: Cálculo de rachas diarias consecutivas en zona horaria `America/Guayaquil` (`UTC-5`).
     - `app/services/metricas_service.py`: Cálculo de impacto neto y bonificación automática del **+10% de XP** al mantener rachas $\ge 5$ días consecutivos.
   - **Endpoints Principales:**
     - `GET /api/v1/acciones/`: Catálogo público de acciones sostenibles activas.
     - `POST /api/v1/acciones/registrar`: Registro atómico de hábitos validado por JWT.
     - `GET /api/v1/dashboard/me`: Resumen integral del usuario autenticado (impacto global, racha diaria, historial y `desglose_grafico` por categorías).

3. **Base de Datos (`db/migrations` — Supabase PostgreSQL):**
   - Tablas relacionales: `usuarios`, `catalogo_acciones`, `registro_habitos` y `curiosidades_ods`.
   - Función transaccional RPC `public.registrar_accion_usuario(p_usuario_id, p_accion_id)` en PL/pgSQL para cálculo atómico de niveles ($\text{Nivel} = \lfloor 0.1 \times \sqrt{\text{XP}} \rfloor + 1$), rachas y métricas.

---

## 2. Seguridad: Autenticación JWT y Row Level Security (RLS)

- **Autenticación JWT (Bearer Token):** El cliente inicia sesión mediante `@supabase/supabase-js`. Cada petición hacia FastAPI adjunta el encabezado `Authorization: Bearer <access_token>`.
- **Prevención de IDOR:** El backend valida criptográficamente el token mediante `get_current_user` (`app/core/security.py`) contra Supabase Auth y extrae el `UUID` directamente del token en `/api/v1/dashboard/me` y `/api/v1/acciones/registrar`, impidiendo la suplantación de identidad.
- **Row Level Security (RLS):** Todas las tablas sensibles en PostgreSQL tienen políticas RLS habilitadas (`auth.uid() = id` y `auth.uid() = usuario_id`), garantizando que cada estudiante solo pueda leer y actualizar sus propios registros.

---

## 3. Instrucciones de Instalación y Despliegue

### A. Variables de Entorno

**Frontend (`Front_base/eco-dash/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key-publica>
NEXT_PUBLIC_API_URL=https://kawsay-api.onrender.com
```

**Backend (`Back_UPS/.env`):**
```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_KEY=<tu-service-or-anon-key>
ENVIRONMENT=production
```

### B. Ejecución Local del Frontend
```bash
cd Front_base/eco-dash
npm install
npm run dev
```
Abrir `http://localhost:3000` en el navegador. Para verificar tipado y reglas de linter:
```bash
npx tsc --noEmit
npm run lint
```

### C. Ejecución Local del Backend y Pruebas
```bash
cd Back_UPS
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest
```

### D. Despliegue en Nube
- **Frontend (Vercel):** Conectar el repositorio seleccionando `Front_base/eco-dash` como *Root Directory* y configurar las variables `NEXT_PUBLIC_*`.
- **Backend (Render):** Configurar servicio web en `Back_UPS` con comando de inicio `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

---

## 4. Créditos, Recursos Multimedia y Transparencia IA

- **Institución Educativa:** Academia Naval Almirante Illingworth
- **Docente Tutor:** Ing. Joel Anthony Torres Urresto
- **Equipo Desarrollador:**
  - Jordán Maridueña Joel Alexander
  - Nieto Martillo Melissa Dakota
  - Narváez Durán Francisco Isaías
  - Zambrano Aguirre Marcelo Humberto
- **Recursos de Audio (`/public/Musica1-4.ogg`, `/public/sonido.ogg`):** Pistas ambientales y efectos sonoros de uso libre (Royalty-Free / Creative Commons CC0) integrados con control de silencio accesible en cabecera.
- **Declaración de Uso de IA:** Se emplearon **Google Antigravity** (asistencia en entorno de desarrollo para refactorización, tipado TypeScript, validación SQL/RPC y pruebas) y **Google Gemini** (consulta conceptual de interfaz con Tailwind CSS y plantillas de pruebas unitarias).
