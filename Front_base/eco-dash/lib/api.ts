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

