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
