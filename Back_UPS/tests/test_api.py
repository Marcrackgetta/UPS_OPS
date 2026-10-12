import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Importamos la app de FastAPI
from app.main import app

client = TestClient(app)

# ==========================================================
# Pruebas de Rutas Públicas y CORS
# ==========================================================
def test_raiz():
    response = client.get("/")
    assert response.status_code == 200
    assert "mensaje" in response.json()

def test_catalogo_publico():
    response = client.get("/api/v1/acciones/")
    # Si la DB está accesible o no, queremos al menos un 200 o el formato correcto
    assert response.status_code == 200
    assert "status" in response.json()

def test_cors_headers():
    response = client.options(
        "/api/v1/acciones/",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    # FastAPI CORSMiddleware responderá con headers adecuados
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

# ==========================================================
# Pruebas de Autenticación JWT (Bloqueo 401)
# ==========================================================
def test_dashboard_sin_token():
    response = client.get("/api/v1/dashboard/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_registrar_accion_sin_token():
    response = client.post("/api/v1/acciones/registrar", json={"accion_id": 1})
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

@patch("app.core.security.supabase.auth.get_user")
def test_token_invalido(mock_get_user):
    # Simulamos que supabase lanza un error al verificar un token malo
    mock_get_user.side_effect = Exception("Token expired")
    
    response = client.get("/api/v1/dashboard/me", headers={"Authorization": "Bearer BAD_TOKEN"})
    assert response.status_code == 401
    assert "Credenciales inválidas" in response.json()["detail"]

# ==========================================================
# Pruebas de Usuario Autenticado (Mocks)
# ==========================================================
@patch("app.routers.acciones_router.supabase.rpc")
@patch("app.routers.acciones_router.supabase.table")
@patch("app.core.security.supabase.auth.get_user")
def test_registrar_accion_con_token(mock_get_user, mock_table, mock_rpc):
    # 1. Mock de Auth
    mock_user = MagicMock()
    mock_user.user.id = "falso-uuid-1234"
    mock_get_user.return_value = mock_user

    # 2. Mock de RPC (Registro Atómico)
    mock_rpc_response = MagicMock()
    mock_rpc_response.data = {
        "status": "success",
        "transaccion": {"co2_ganado_kg": 10.5, "calorias_ganadas": 50, "xp_ganada": 20},
        "estado_usuario": {"xp_total": 120, "nivel_actual": 2, "racha_dias": 2, "subio_de_nivel": True},
        "ods_info": {"ods": 13}
    }
    # Aseguramos que la cadena execute() devuelva nuestro objeto mockeado
    mock_rpc.return_value.execute.return_value = mock_rpc_response

    # 3. Mock de Catálogo Educativo
    mock_table_response = MagicMock()
    mock_table_response.data = [
        {"ods": 13, "titulo": "Lección 1", "contenido": "El CO2 es..."}
    ]
    mock_table.return_value.select.return_value.eq.return_value.lte.return_value.execute.return_value = mock_table_response

    # Ejecutar Petición
    response = client.post(
        "/api/v1/acciones/registrar",
        json={"accion_id": 1},
        headers={"Authorization": "Bearer VALID_TOKEN"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["transaccion"]["status"] == "success"
    assert data["estado_usuario"]["nivel_actual"] == 2
    assert data["estado_usuario"]["subio_de_nivel"] is True
    # Verificamos que el RPC fue llamado con el ID correcto extraído del token
    mock_rpc.assert_called_once_with("registrar_accion_usuario", {
        "p_usuario_id": "falso-uuid-1234",
        "p_accion_id": 1
    })

@patch("app.routers.dashboard_router.supabase.table")
@patch("app.core.security.supabase.auth.get_user")
def test_dashboard_aislamiento_usuario(mock_get_user, mock_table):
    # Simula que get_current_user extrae el id "user-auth"
    mock_user = MagicMock()
    mock_user.user.id = "user-auth"
    mock_get_user.return_value = mock_user

    # Mocks para base de datos
    mock_db_perfil = MagicMock()
    mock_db_perfil.data = [{"id": "user-auth", "nombre": "Test", "nivel_actual": 3}]
    
    mock_db_historial = MagicMock()
    mock_db_historial.data = []

    # Configurar el side_effect del chain execute() para que devuelva perfil o historial dependiendo del nombre de la tabla
    def table_side_effect(table_name):
        chain = MagicMock()
        if table_name == "usuarios":
            chain.select.return_value.eq.return_value.execute.return_value = mock_db_perfil
        elif table_name == "historial_registros":
            chain.select.return_value.eq.return_value.execute.return_value = mock_db_historial
        return chain

    mock_table.side_effect = table_side_effect

    response = client.get(
        "/api/v1/dashboard/me",
        headers={"Authorization": "Bearer VALID_TOKEN"}
    )
    
    assert response.status_code == 200
    assert response.json()["nivel_actual"] == 3


# ==========================================================
# Pruebas de Sistema de Rachas, Vigencia Temporal e Historial
# ==========================================================
from datetime import date, timedelta
from app.services.racha_service import (
    calcular_racha_vigente,
    procesar_racha_diaria,
    sincronizar_racha_usuario_db,
)

def test_logica_racha_vigente_y_cambios_de_fecha():
    hoy = date(2026, 10, 12)
    ayer = hoy - timedelta(days=1)
    hace_dos_dias = hoy - timedelta(days=2)
    hace_cinco_dias = hoy - timedelta(days=5)

    # 1. Usuario sin actividad previa
    assert calcular_racha_vigente(None, 0, hoy) == 0
    assert calcular_racha_vigente(None, 3, hoy) == 0

    # 2. Racha vigente hoy (delta = 0) y ayer (delta = 1)
    assert calcular_racha_vigente(hoy, 4, hoy) == 4
    assert calcular_racha_vigente(ayer.isoformat(), 4, hoy) == 4

    # 3. Racha vencida al cruzar límite diario (delta >= 2)
    assert calcular_racha_vigente(hace_dos_dias, 4, hoy) == 0
    assert calcular_racha_vigente(hace_cinco_dias.isoformat(), 1, hoy) == 0

    # 4. Progresión al registrar actividad en cambios de fecha
    assert procesar_racha_diaria(None, hoy, 0) == 1
    assert procesar_racha_diaria(hoy, hoy, 3) == 3
    assert procesar_racha_diaria(ayer, hoy, 3) == 4
    assert procesar_racha_diaria(hace_dos_dias, hoy, 3) == 1


@patch("app.routers.dashboard_router.supabase.rpc")
@patch("app.routers.dashboard_router.supabase.table")
@patch("app.core.security.supabase.auth.get_user")
def test_dashboard_racha_vencida_se_reinicia_a_cero(mock_get_user, mock_table, mock_rpc):
    mock_user = MagicMock()
    mock_user.user.id = "5d4fe8d2-a8e1-4f41-9541-2b8e854ebea4"
    mock_get_user.return_value = mock_user

    # En BD tenía racha_dias=3 de hace 5 días, pero el RPC de sincronización devuelve 0
    mock_db_perfil = MagicMock()
    mock_db_perfil.data = [{
        "id": "5d4fe8d2-a8e1-4f41-9541-2b8e854ebea4",
        "nombre": "soymarcelo",
        "nivel_actual": 1,
        "xp_acumulada": 75,
        "racha_dias": 3,
        "fecha_ultimo_registro": "2026-10-07",
    }]

    mock_db_historial = MagicMock()
    mock_db_historial.data = [
        {
            "id": 17,
            "accion_id": 1,
            "co2_calculado": 1.45,
            "calorias_calculadas": 0.0,
            "xp_ganada": 25,
            "fecha_registro": "2026-10-07",
            "created_at": "2026-10-07T12:53:14.5495+00:00",
            "catalogo_acciones": {"titulo": "Uso de Transporte Público", "categoria": "MOVILIDAD", "ods_principal": 13},
        }
    ]

    def table_side_effect(table_name):
        chain = MagicMock()
        if table_name == "usuarios":
            chain.select.return_value.eq.return_value.execute.return_value = mock_db_perfil
        elif table_name == "historial_registros":
            chain.select.return_value.eq.return_value.execute.return_value = mock_db_historial
        return chain

    mock_table.side_effect = table_side_effect

    mock_rpc_res = MagicMock()
    mock_rpc_res.data = 0
    mock_rpc.return_value.execute.return_value = mock_rpc_res

    response = client.get("/api/v1/dashboard/me", headers={"Authorization": "Bearer VALID_TOKEN"})
    assert response.status_code == 200
    body = response.json()
    assert body["racha_dias"] == 0
    assert body["desglose_racha"] == []
    assert len(body["historial"]) == 1
    assert body["historial"][0]["titulo"] == "Uso de Transporte Público"
    mock_rpc.assert_called_once_with(
        "sincronizar_racha_usuario",
        {"p_usuario_id": "5d4fe8d2-a8e1-4f41-9541-2b8e854ebea4"}
    )


@patch("app.routers.dashboard_router.supabase.rpc")
@patch("app.routers.dashboard_router.supabase.table")
@patch("app.core.security.supabase.auth.get_user")
def test_dashboard_racha_vigente_y_desglose_diario(mock_get_user, mock_table, mock_rpc):
    mock_user = MagicMock()
    mock_user.user.id = "830046e9-cca5-4cc8-ad08-0860897cebea"
    mock_get_user.return_value = mock_user

    mock_db_perfil = MagicMock()
    mock_db_perfil.data = [{
        "id": "830046e9-cca5-4cc8-ad08-0860897cebea",
        "nombre": "allanzambrano858",
        "nivel_actual": 3,
        "xp_acumulada": 420,
        "racha_dias": 2,
        "fecha_ultimo_registro": "2026-10-12",
    }]

    mock_db_historial = MagicMock()
    mock_db_historial.data = [
        {
            "id": 20,
            "accion_id": 3,
            "co2_calculado": 0.85,
            "calorias_calculadas": 0.0,
            "xp_ganada": 20,
            "fecha_registro": "2026-10-12",
            "created_at": "2026-10-12T20:58:25+00:00",
            "catalogo_acciones": {"titulo": "Apagado de Aire Acondicionado", "categoria": "ENERGIA", "ods_principal": 13},
        },
        {
            "id": 19,
            "accion_id": 2,
            "co2_calculado": 2.10,
            "calorias_calculadas": 180.0,
            "xp_ganada": 40,
            "fecha_registro": "2026-10-11",
            "created_at": "2026-10-11T18:00:00+00:00",
            "catalogo_acciones": {"titulo": "Caminata o Bicicleta", "categoria": "MOVILIDAD", "ods_principal": 3},
        },
    ]

    def table_side_effect(table_name):
        chain = MagicMock()
        if table_name == "usuarios":
            chain.select.return_value.eq.return_value.execute.return_value = mock_db_perfil
        elif table_name == "historial_registros":
            chain.select.return_value.eq.return_value.execute.return_value = mock_db_historial
        return chain

    mock_table.side_effect = table_side_effect
    mock_rpc_res = MagicMock()
    mock_rpc_res.data = 2
    mock_rpc.return_value.execute.return_value = mock_rpc_res

    response = client.get("/api/v1/dashboard/me", headers={"Authorization": "Bearer VALID_TOKEN"})
    assert response.status_code == 200
    body = response.json()
    assert body["racha_dias"] == 2
    assert len(body["desglose_racha"]) == 2
    assert body["desglose_racha"][0]["fecha"] == "2026-10-12"
    assert body["desglose_racha"][0]["co2_total_kg"] == 0.85
    assert body["desglose_racha"][1]["fecha"] == "2026-10-11"
    assert body["desglose_racha"][1]["calorias_totales"] == 180.0


@patch("app.routers.dashboard_router.supabase.rpc")
@patch("app.routers.dashboard_router.supabase.table")
@patch("app.core.security.supabase.auth.get_user")
def test_bloqueo_acceso_cruzado_sincronizar_racha(mock_get_user, mock_table, mock_rpc):
    mock_user = MagicMock()
    mock_user.user.id = "user-intruso"
    mock_get_user.return_value = mock_user

    mock_db_perfil = MagicMock()
    mock_db_perfil.data = [{"id": "user-intruso", "nombre": "Intruso", "racha_dias": 2, "fecha_ultimo_registro": "2026-10-12"}]
    mock_table.return_value.select.return_value.eq.return_value.execute.return_value = mock_db_perfil

    # Simular rechazo de autorización desde PostgreSQL RPC
    mock_rpc.return_value.execute.side_effect = Exception("No autorizado. El ID de usuario no coincide con el token.")

    response = client.get("/api/v1/dashboard/me", headers={"Authorization": "Bearer VALID_TOKEN"})
    assert response.status_code == 403
    assert "No autorizado" in response.json()["detail"]

