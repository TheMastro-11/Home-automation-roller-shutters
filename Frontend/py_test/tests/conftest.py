import requests
import pytest
import uuid


@pytest.fixture(scope="session") 
def base_api_url():
  return "http://localhost:8080/api" 

@pytest.fixture(scope="session")
def entities_url(base_api_url):
  return f"{base_api_url}/entities"


@pytest.fixture(scope="session") # Scope="session" -> Eseguita una sola volta per tutti i test
def auth_token(base_api_url):
    session_username = f"test_session_user_{uuid.uuid4().hex[:6]}"
    session_password = "test_session_password"
    credentials = {"username": session_username, "password": session_password}

    register_url = f"{base_api_url}/auth/register"
    authenticate_url = f"{base_api_url}/auth/authenticate"
    token = None

    print(f"\n[Session Fixture Setup] Inizio Setup Autenticazione per utente: {session_username}")

    try:
        # --- 1. Registra l'utente per la sessione ---
        print(f"[Session Fixture Setup] Registrazione a: {register_url}")
        reg_response = requests.post(register_url, json=credentials, timeout=10)

        # Verifica successo registrazione (Status 200 e corpo specifico)
        # Adatta queste condizioni se la tua API si comporta diversamente
        if reg_response.status_code != 200 or reg_response.text != '"User registered successfully!"':
            # Se la registrazione fallisce, non possiamo ottenere un token. Fallimento rapido.
            pytest.fail(
                f"[Session Fixture Setup] Registrazione fallita! "
                f"Status: {reg_response.status_code}, Body: {reg_response.text}",
                pytrace=False # pytrace=False rende l'output di errore più pulito per fallimenti nelle fixture
            )
        print(f"[Session Fixture Setup] Utente {session_username} registrato.")

        # --- 2. Autentica l'utente per ottenere il token ---
        print(f"[Session Fixture Setup] Autenticazione a: {authenticate_url}")
        auth_response = requests.post(authenticate_url, json=credentials, timeout=10)

        # Verifica successo autenticazione (Status 200)
        if auth_response.status_code != 200:
            pytest.fail(
                f"[Session Fixture Setup] Autenticazione fallita! "
                f"Status: {auth_response.status_code}, Body: {auth_response.text}",
                pytrace=False
            )

        try:
            auth_data = auth_response.json()
            token = auth_data.get("jwt")
            if not token or not isinstance(token, str):
                raise ValueError("Chiave 'token' non trovata o non è una stringa nella risposta.")
            print("[Session Fixture Setup] Autenticazione riuscita, token ottenuto.")
        except (ValueError, KeyError) as e:
            pytest.fail(
                f"[Session Fixture Setup] Errore nell'estrarre il token dalla risposta: {e}. "
                f"Body: {auth_response.text}",
                pytrace=False
            )

    except requests.exceptions.RequestException as e:
        pytest.fail(f"[Session Fixture Setup] Richiesta fallita durante setup auth: {e}", pytrace=False)

    if not token:
        pytest.fail("[Session Fixture Setup] Impossibile ottenere un token JWT valido.", pytrace=False)

    yield token
    
    print(f"\n[Session Fixture Teardown] Fine sessione test per utente: {session_username}")
    
@pytest.fixture(scope="function")
def created_light_sensor(entities_url, auth_token):
    create_endpoint = f"{entities_url}/lightSensor/create"
    unique_sensor_name = f"FixtureSensor_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_sensor_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Fixture Setup] Creating Light Sensor: {unique_sensor_name} at {create_endpoint}")

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code in [200, 201]

        response_data = response.json()
        # Aspettiamoci la chiave "Response" come corretto in precedenza
        assert "Response" in response_data, "Response JSON missing 'Response' key"
        assert response_data.get("Response") == "LightSensor created successfully!"

        assert "Entity" in response_data, "Response JSON missing 'Entity' key"
        entity = response_data["Entity"]
        assert isinstance(entity, dict)
        assert "ID" in entity
        sensor_id = entity.get("ID")
        assert isinstance(sensor_id, str) and len(sensor_id) > 0
        assert entity.get("name") == unique_sensor_name

        print(f"[Fixture Setup] Light Sensor '{unique_sensor_name}' created successfully with ID: {sensor_id}.")
        return {"id": sensor_id, "name": unique_sensor_name}

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"[Fixture Setup] Light Sensor creation request failed (Status: {status_code}): {e}")
    except (ValueError, KeyError, AssertionError) as e:
        pytest.fail(f"[Fixture Setup] Light Sensor creation response validation failed: {e}. Status: {response.status_code}, Body: '{response.text}'")


@pytest.fixture(scope="function")
def created_roller_shutters_list(entities_url, auth_token, num_shutters=2):
    created_shutters = []
    create_endpoint = f"{entities_url}/rollerShutter/create"
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Fixture Setup] Creating {num_shutters} Roller Shutters...")

    for i in range(num_shutters):
        unique_shutter_name = f"ListShutter_{i+1}_{uuid.uuid4().hex[:6]}"
        payload = {"name": unique_shutter_name}
        shutter_id = None
        try:
            response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            assert response.status_code in [200, 201]
            response_data = response.json()

            assert "Response" in response_data
            assert response_data.get("Response") == "RollerShutter created successfully!"
            assert "Entity" in response_data
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert "ID" in entity
            shutter_id = entity.get("ID")
            assert isinstance(shutter_id, str) and len(shutter_id) > 0
            assert entity.get("name") == unique_shutter_name

            created_shutters.append({"id": shutter_id, "name": unique_shutter_name})
            print(f"[Fixture Setup]  - Created: {unique_shutter_name} (ID: {shutter_id})")

        except requests.exceptions.RequestException as e:
            status_code = e.response.status_code if e.response is not None else "N/A"
            pytest.fail(f"[Fixture Setup] Roller Shutter creation #{i+1} req failed (Status: {status_code}): {e}")
        except (ValueError, KeyError, AssertionError) as e:
            status_code = response.status_code if 'response' in locals() else "N/A"
            body = response.text if 'response' in locals() else "N/A"
            pytest.fail(f"[Fixture Setup] Roller Shutter creation #{i+1} resp validation failed: {e}. Status: {status_code}, Body: '{body}'")

    if len(created_shutters) != num_shutters:
         pytest.fail(f"[Fixture Setup] Failed to create the expected {num_shutters} shutters.")

    return created_shutters

# In tests/conftest.py
# ... (altre importazioni e fixture come uuid, pytest, requests) ...

@pytest.fixture(scope="function")
def another_created_light_sensor(entities_url, auth_token):
    # Crea un SEOCNDO sensore di luce per i test di patch
    create_endpoint = f"{entities_url}/lightSensor/create"
    unique_sensor_name = f"FixtureSensor_B_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_sensor_name}
    headers = {"Authorization": f"Bearer {auth_token}"}
    print(f"\n[Fixture Setup] Creating ANOTHER Light Sensor: {unique_sensor_name} at {create_endpoint}")
    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code in [200, 201]
        response_data = response.json()
        assert "Response" in response_data and response_data.get("Response") == "LightSensor created successfully!"
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert "ID" in entity
        sensor_id = entity.get("ID")
        assert isinstance(sensor_id, str) and len(sensor_id) > 0
        assert entity.get("name") == unique_sensor_name
        print(f"[Fixture Setup] ANOTHER Light Sensor '{unique_sensor_name}' created with ID: {sensor_id}.")
        return {"id": sensor_id, "name": unique_sensor_name}
    except Exception as e:
        pytest.fail(f"[Fixture Setup] FAILED to create ANOTHER Light Sensor: {e}")

@pytest.fixture(scope="function")
def created_lightSensor_routine(entities_url, auth_token, created_light_sensor, created_roller_shutters_list):
    # Crea una routine di tipo LightSensor
    routine_base_url = f"{entities_url}/routine"
    create_endpoint = f"{routine_base_url}/create/lightSensor"
    light_sensor_info = created_light_sensor
    sensor_name = light_sensor_info["name"]
    shutters_to_link = created_roller_shutters_list
    shutter_names = [s["name"] for s in shutters_to_link]
    routine_name = f"FixtureSensorRoutine_{uuid.uuid4().hex[:6]}"
    payload = {
        "name": routine_name,
        "lightSensor": {"name": sensor_name},
        "rollerShutters": [{"name": name} for name in shutter_names]
    }
    headers = {"Authorization": f"Bearer {auth_token}"}
    print(f"\n[Fixture Setup] Creating LightSensor Routine: {routine_name}")
    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code in [200, 201]
        response_data = response.json()
        assert "Response" in response_data and response_data.get("Response") == "Routine created successfully!"
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert "ID" in entity
        routine_id = entity.get("ID")
        assert isinstance(routine_id, str) and len(routine_id) > 0
        assert entity.get("name") == routine_name
        print(f"[Fixture Setup] LightSensor Routine '{routine_name}' created with ID: {routine_id}.")
        # Restituisce ID e nome per l'uso nei test
        return {"id": routine_id, "name": routine_name}
    except Exception as e:
        pytest.fail(f"[Fixture Setup] FAILED to create LightSensor Routine: {e}")

@pytest.fixture(scope="function")
def created_actionTime_routine(entities_url, auth_token, created_roller_shutters_list):
    # Crea una routine di tipo ActionTime
    routine_base_url = f"{entities_url}/routine"
    create_endpoint = f"{routine_base_url}/create/actionTime"
    shutters_to_link = created_roller_shutters_list
    shutter_names = [s["name"] for s in shutters_to_link]
    routine_name = f"FixtureTimeRoutine_{uuid.uuid4().hex[:6]}"
    routine_time_to_send = "08:00:00" # Orario fisso per la fixture
    expected_time_in_response = "08:00" # Formato atteso nella risposta
    payload = {
        "name": routine_name,
        "time": routine_time_to_send, # Usa chiave "time" nel payload
        "rollerShutters": [{"name": name} for name in shutter_names]
    }
    headers = {"Authorization": f"Bearer {auth_token}"}
    print(f"\n[Fixture Setup] Creating ActionTime Routine: {routine_name}")
    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code in [200, 201]
        response_data = response.json()
        assert "Response" in response_data and response_data.get("Response") == "Routine created successfully!"
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert "ID" in entity
        routine_id = entity.get("ID")
        assert isinstance(routine_id, str) and len(routine_id) > 0
        assert entity.get("name") == routine_name
        # Verifica che actionTime sia presente e nel formato corretto nella risposta
        assert "actionTime" in entity
        assert entity.get("actionTime") == expected_time_in_response

        print(f"[Fixture Setup] ActionTime Routine '{routine_name}' created with ID: {routine_id}.")
        # Restituisce ID e nome per l'uso nei test
        return {"id": routine_id, "name": routine_name}
    except Exception as e:
        pytest.fail(f"[Fixture Setup] FAILED to create ActionTime Routine: {e}")