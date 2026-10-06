import { supabase } from './supabaseClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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


export async function getHistorialRegistros() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    
    const { data, error } = await supabase
        .from('historial_registros')
        .select(`
            id,
            creado_en,
            co2_calculado,
            calorias_calculadas,
            catalogo_acciones (
                titulo,
                categoria
            )
        `)
        .eq('usuario_id', session.user.id)
        .order('creado_en', { ascending: false })
        .limit(20);
        
    if (error) {
        console.error("Error obteniendo historial:", error);
        return [];
    }
    
    return data.map((item: any) => {
        const title = item.catalogo_acciones?.titulo || "Acción registrada";
        const cat = item.catalogo_acciones?.categoria || "clima";
        const date = new Date(item.creado_en);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();
        
        return {
            id: item.id,
            text: title,
            time: `${dateStr} ${timeStr}`,
            type: cat.toLowerCase(),
            co2: item.co2_calculado,
            cal: item.calorias_calculadas
        };
    });
}
