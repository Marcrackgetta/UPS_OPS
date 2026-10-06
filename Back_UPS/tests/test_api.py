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
