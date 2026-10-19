import { supabase } from './supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface HistoryItemRecord {
    id: number | string;
    accion_id?: number;
    text: string;
    time: string;
    fecha_registro: string;
    created_at: string;
    type: 'clima' | 'salud';
    categoria: string;
    co2: number;
    cal: number;
    xp: number;
}

export function getFechaGuayaquilISO(dateInput: Date = new Date()): string {
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Guayaquil',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(dateInput);
    } catch {
        return dateInput.toISOString().slice(0, 10);
    }
}

export function mapHistorialItem(item: Record<string, unknown>): HistoryItemRecord {
    const infoAccion = (item.catalogo_acciones as Record<string, unknown> | null) || {};
    const title = String(item.titulo || infoAccion.titulo || 'Acción registrada');
    const categoriaRaw = String(item.categoria || infoAccion.categoria || 'CLIMA');
    const co2 = Number(item.co2_calculado ?? item.co2 ?? 0);
    const cal = Number(item.calorias_calculadas ?? item.cal ?? 0);
    const xp = Number(item.xp_ganada ?? item.xp ?? 0);
    const ods = Number(item.ods_principal ?? infoAccion.ods_principal ?? (cal > 0 ? 3 : 13));

    const isSalud = ods === 3 || categoriaRaw.toLowerCase() === 'salud' || cal > 0;
    const type: 'clima' | 'salud' = isSalud ? 'salud' : 'clima';

    const rawTimestamp = String(item.created_at || item.fecha_registro || new Date().toISOString());
    const parsedDate = new Date(rawTimestamp);
    const isValidDate = !Number.isNaN(parsedDate.getTime());

    let timeFormatted = String(item.fecha_registro || '');
    let fechaRegistroISO = String(item.fecha_registro || '').slice(0, 10);

    if (isValidDate) {
        const dateStr = parsedDate.toLocaleDateString('es-EC', {
            timeZone: 'America/Guayaquil',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        const timeStr = parsedDate.toLocaleTimeString('es-EC', {
            timeZone: 'America/Guayaquil',
            hour: '2-digit',
            minute: '2-digit',
        });
        timeFormatted = `${dateStr} • ${timeStr}`;
        if (!fechaRegistroISO) {
            fechaRegistroISO = getFechaGuayaquilISO(parsedDate);
        }
    }

    return {
        id: (item.id as number | string) ?? `${rawTimestamp}-${Math.random()}`,
        accion_id: typeof item.accion_id === 'number' ? item.accion_id : undefined,
        text: title,
        time: timeFormatted,
        fecha_registro: fechaRegistroISO || getFechaGuayaquilISO(),
        created_at: String(rawTimestamp),
        type,
        categoria: categoriaRaw,
        co2: Number(co2.toFixed(2)),
        cal: Math.round(cal),
        xp,
    };
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No hay sesión activa");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
}

export async function getCatalogoAcciones() {
    const res = await fetch(`${API_URL}/acciones/`);
    if (!res.ok) throw new Error("Error obteniendo catálogo");
    return res.json();
}

export async function getDashboard() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/dashboard/me`, { headers });
    if (!res.ok) throw new Error("Error obteniendo dashboard");
    return res.json();
}

export async function registrarAccion(accion_id: number) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/acciones/registrar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ accion_id })
    });
    if (!res.ok) throw new Error("Error registrando acción");
    return res.json();
}

export async function getHistorialRegistros(limit?: number): Promise<HistoryItemRecord[]> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        throw new Error(`Error verificando sesión: ${sessionError.message}`);
    }
    if (!session) {
        throw new Error("No hay sesión activa para consultar el historial");
    }

    let query = supabase
        .from('historial_registros')
        .select(`
            id,
            accion_id,
            created_at,
            fecha_registro,
            co2_calculado,
            calorias_calculadas,
            xp_ganada,
            catalogo_acciones (
                titulo,
                categoria,
                ods_principal
            )
        `)
        .eq('usuario_id', session.user.id)
        .order('created_at', { ascending: false });

    if (typeof limit === 'number' && limit > 0) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error obteniendo historial:", error);
        throw new Error("No se pudo recuperar tu historial de acciones. Intenta nuevamente.");
    }

    return (data || []).map(mapHistorialItem);
}

export interface CuriosidadODSItem {
    id: number;
    ods: 4;
    reqNivel: number;
    reqXp: number;
    requisitoTexto: string;
    titulo: string;
    contenido: string;
}

export const CURIOSIDADES_ODS4_CATALOGO: CuriosidadODSItem[] = [
    {
        id: 1,
        ods: 4,
        reqNivel: 1,
        reqXp: 0,
        requisitoTexto: 'Nivel 1 • Inicial (0 XP)',
        titulo: 'Semilla del Saber Sostenible',
        contenido:
            'La Educación para el Desarrollo Sostenible (ODS 4.7) impulsa hábitos conscientes: caminar 30 minutos diarios reduce tu huella de carbono a cero y fortalece tu salud cardiovascular.',
    },
    {
        id: 2,
        ods: 4,
        reqNivel: 1,
        reqXp: 50,
        requisitoTexto: 'Nivel 1 • 50 pts XP',
        titulo: 'Alfabetización Climática en el Campus',
        contenido:
            'Según la UNESCO (ODS 4), medir tu impacto ambiental durante la etapa universitaria triplica la probabilidad de mantener hábitos ecológicos permanentes en el hogar.',
    },
    {
        id: 3,
        ods: 4,
        reqNivel: 2,
        reqXp: 100,
        requisitoTexto: 'Alcanzar Nivel 2 (100 pts XP)',
        titulo: 'Ciencia Ciudadana Universitaria',
        contenido:
            'Al registrar cada acción verde, transformas tu rutina diaria en evidencia cuantificable que fortalece la cultura ambiental y el aprendizaje colaborativo del ODS 4.',
    },
    {
        id: 4,
        ods: 4,
        reqNivel: 2,
        reqXp: 200,
        requisitoTexto: 'Nivel 2 • 200 pts XP',
        titulo: 'Neuroeducación y Movilidad Activa',
        contenido:
            'El aprendizaje de calidad (ODS 4) se potencia con la actividad física: 20 minutos de movilidad activa oxigenan el cerebro y mejoran la concentración y memoria hasta un 15%.',
    },
    {
        id: 5,
        ods: 4,
        reqNivel: 3,
        reqXp: 282,
        requisitoTexto: 'Alcanzar Nivel 3 (282 pts XP)',
        titulo: 'Efecto Multiplicador Estudiantil',
        contenido:
            'La meta 4.7 del ODS 4 destaca el liderazgo juvenil: un estudiante que comparte y practica hábitos sostenibles inspira en promedio a 4 personas de su entorno directo.',
    },
    {
        id: 6,
        ods: 4,
        reqNivel: 4,
        reqXp: 519,
        requisitoTexto: 'Alcanzar Nivel 4 (519 pts XP)',
        titulo: 'Saberes Ancestrales y Sumak Kawsay',
        contenido:
            'La educación intercultural del ODS 4 integra la ciencia ambiental moderna con el Sumak Kawsay andino: aprender a convivir en equilibrio y respeto con la Pacha Mama.',
    },
    {
        id: 7,
        ods: 4,
        reqNivel: 5,
        reqXp: 800,
        requisitoTexto: 'Alcanzar Nivel 5 (800 pts XP)',
        titulo: 'Maestría Kawsay en Educación Verde',
        contenido:
            '¡Has completado todas las cápsulas del ODS 4! Tu constancia demuestra que la educación de calidad transforma el conocimiento en acción real por el planeta.',
    },
];

export function calcularIdsCuriosidadesDesbloqueadas(
    nivel: number,
    xp: number,
    previos: number[] = [1]
): number[] {
    const setIds = new Set<number>([1, ...previos.filter((n) => Number.isInteger(n) && n > 0)]);
    const niv = Math.max(1, Number(nivel || 1));
    const puntos = Math.max(0, Number(xp || 0));

    for (const item of CURIOSIDADES_ODS4_CATALOGO) {
        if (niv >= item.reqNivel && puntos >= item.reqXp) {
            setIds.add(item.id);
        }
    }
    return Array.from(setIds).sort((a, b) => a - b);
}

export async function persistirCuriosidadesSupabase(ids: number[]): Promise<void> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const limpios = Array.from(new Set([1, ...ids])).sort((a, b) => a - b);
        await supabase
            .from('usuarios')
            .update({ curiosidades_desbloqueadas: limpios })
            .eq('id', session.user.id);
    } catch {
        // Ignorar silenciosamente si la columna aún no fue migrada en el entorno remoto
    }
}

export async function sincronizarPerfilYProgresoSupabase(
    dashNombre?: string,
    nivelActual: number = 1,
    xpTotal: number = 0,
    dashCuriosidades?: number[]
): Promise<{
    nombre: string;
    apellido: string | null;
    curiosidadesDesbloqueadas: number[];
}> {
    const desbloqueadosBase = calcularIdsCuriosidadesDesbloqueadas(
        nivelActual,
        xpTotal,
        Array.isArray(dashCuriosidades) ? dashCuriosidades : [1]
    );

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            return {
                nombre: dashNombre || 'Estudiante',
                apellido: null,
                curiosidadesDesbloqueadas: desbloqueadosBase,
            };
        }

        const user = session.user;
        const email = (user.email || '').trim();
        const emailPrefix = email.includes('@') ? email.split('@')[0] : email;
        const meta = (user.user_metadata || {}) as Record<string, unknown>;

        let metaNombre = typeof meta.nombre === 'string' ? meta.nombre.trim() : '';
        let metaApellido = typeof meta.apellido === 'string' ? meta.apellido.trim() : '';
        const metaFullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';

        if (!metaNombre && metaFullName) {
            const partes = metaFullName.split(/\s+/);
            metaNombre = partes[0] || '';
            if (!metaApellido && partes.length > 1) {
                metaApellido = partes.slice(1).join(' ');
            }
        }

        const { data: filaUsuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        const fila = (filaUsuario || {}) as Record<string, unknown>;
        const dbNombre = typeof fila.nombre === 'string' ? fila.nombre.trim() : '';
        const dbApellido = typeof fila.apellido === 'string' ? fila.apellido.trim() : '';
        const dbCuriosidades = Array.isArray(fila.curiosidades_desbloqueadas)
            ? (fila.curiosidades_desbloqueadas as unknown[])
                  .map((x) => Number(x))
                  .filter((n) => Number.isInteger(n) && n > 0)
            : [];

        let nombreResuelto = dbNombre;
        if (metaNombre && (!dbNombre || dbNombre === emailPrefix || dbNombre === 'Estudiante')) {
            nombreResuelto = metaNombre;
        }
        if (!nombreResuelto) {
            const candidatoDash = (dashNombre || '').trim();
            if (candidatoDash && candidatoDash !== 'Estudiante') {
                nombreResuelto = candidatoDash;
            } else {
                nombreResuelto = metaNombre || emailPrefix || email || 'Estudiante';
            }
        }

        const apellidoResuelto = dbApellido || metaApellido || null;
        const curiosidadesFinales = calcularIdsCuriosidadesDesbloqueadas(
            nivelActual,
            xpTotal,
            [...desbloqueadosBase, ...dbCuriosidades]
        );

        const payloadSync: Record<string, unknown> = {};
        if (metaNombre && dbNombre !== nombreResuelto) {
            payloadSync.nombre = nombreResuelto;
        }
        if (metaApellido && !dbApellido) {
            payloadSync.apellido = metaApellido;
        }
        const cambioCuriosidades =
            dbCuriosidades.length !== curiosidadesFinales.length ||
            curiosidadesFinales.some((val, idx) => dbCuriosidades[idx] !== val);
        if (cambioCuriosidades) {
            payloadSync.curiosidades_desbloqueadas = curiosidadesFinales;
        }

        if (Object.keys(payloadSync).length > 0) {
            await supabase.from('usuarios').update(payloadSync).eq('id', user.id);
        }

        return {
            nombre: nombreResuelto,
            apellido: apellidoResuelto,
            curiosidadesDesbloqueadas: curiosidadesFinales,
        };
    } catch {
        return {
            nombre: dashNombre || 'Estudiante',
            apellido: null,
            curiosidadesDesbloqueadas: desbloqueadosBase,
        };
    }
}

