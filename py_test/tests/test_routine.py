import requests
import pytest
import uuid

import datetime 

def test_create_routine_actionTime(entities_url, auth_token, created_roller_shutters_list):
    routine_base_url = f"{entities_url}/routine"
    create_endpoint = f"{routine_base_url}/create/actionTime"

    shutters_to_link = created_roller_shutters_list
    shutter_names = [s["name"] for s in shutters_to_link]

    routine_name = f"TimeRoutine_{uuid.uuid4().hex[:6]}"
    routine_time_to_send = "10:30:00"
    expected_time_in_response = "10:30"
    payload = {
        "name": routine_name,
        "time": routine_time_to_send,
        "rollerShutters": [{"name": name} for name in shutter_names]
    }
    # -----------------------------------------------------------------
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] Running test_create_routine_actionTime: {routine_name}")
    print(f"[Test] Endpoint: {create_endpoint}")
    print(f"[Test] Payload: {payload}") 

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code in [200, 201]

        try:
            response_data = response.json()
            print(f"\nDEBUG: Received JSON: {response_data}\n")

            # ... (asserzioni su Response, Entity, ID, name) ...
            assert "Response" in response_data
            assert response_data.get("Response") == "Routine created successfully!"
            assert "Entity" in response_data
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert "ID" in entity
            # ...
            assert entity.get("name") == routine_name

            # Verifica la chiave "actionTime" nella RISPOSTA (come visto precedentemente)
            # Se anche questo fallisce, potrebbe essere che la risposta usi "time" o ci sia ancora il bug del 'null'
            assert "actionTime" in entity, "Entity missing 'actionTime' key in response"
            returned_time = entity["actionTime"]
            # Confronta con il formato HH:MM atteso nella risposta
            assert returned_time == expected_time_in_response, \
                   f"Expected actionTime string '{expected_time_in_response}', but got: {returned_time!r} (type: {type(returned_time)})"

            # ... (asserzioni su rollerShutters) ...
            assert "rollerShutters" in entity
            # ...

            print(f"[Test] ActionTime Routine creation verified. ID: {entity.get('ID')}, Name: {entity.get('name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             pytest.fail(f"Assertion failed on create response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        if status_code == 400:
             body = e.response.text if e.response is not None else "(No response body)"
             print(f"\nINFO: Request failed with status 400. Server Response: {body}\n") # Utile per vedere errori specifici
        pytest.fail(f"Request to {create_endpoint} failed (Status: {status_code}): {e}")
        

def test_create_routine_lightSensor(entities_url, auth_token, created_light_sensor, created_roller_shutters_list):
    routine_base_url = f"{entities_url}/routine" 
    create_endpoint = f"{routine_base_url}/create/lightSensor"

    light_sensor_info = created_light_sensor
    sensor_name = light_sensor_info["name"]
    shutters_to_link = created_roller_shutters_list
    shutter_names = [s["name"] for s in shutters_to_link]

    routine_name = f"SensorRoutine_{uuid.uuid4().hex[:6]}"

    payload = {
        "name": routine_name,
        "lightSensor": {"name": sensor_name}, 
        "rollerShutters": [{"name": name} for name in shutter_names]
    }
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] Running test_create_routine_lightSensor: {routine_name}")
    print(f"[Test] Endpoint: {create_endpoint}")
    print(f"[Test] Payload: {payload}")

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code in [200, 201]

        try:
            response_data = response.json()
            assert "Response" in response_data, "Response JSON missing 'Response' key"
            assert response_data.get("Response") == "Routine created successfully!", \
                   f"Unexpected response message: {response_data.get('Response')}"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert "ID" in entity, "Entity data missing 'ID' key"
            routine_id = entity.get("ID")
            assert isinstance(routine_id, str) and len(routine_id) > 0
            assert entity.get("name") == routine_name, f"Expected name '{routine_name}', got '{entity.get('name')}'"

            assert "lightSensor" in entity, "Entity missing 'lightSensor' key"
            returned_sensor = entity["lightSensor"]
            assert isinstance(returned_sensor, dict)
            assert returned_sensor.get("name") == sensor_name, "Mismatch in linked sensor name"

            assert "rollerShutters" in entity, "Entity missing 'rollerShutters' key"
            returned_shutters = entity["rollerShutters"]
            assert isinstance(returned_shutters, list)
            assert len(returned_shutters) == len(shutter_names)
            returned_shutter_names = {s.get("name") for s in returned_shutters if isinstance(s, dict)}
            assert returned_shutter_names == set(shutter_names), "Mismatch in linked shutter names"

            print(f"[Test] LightSensor Routine creation verified. ID: {routine_id}, Name: {entity.get('name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on create response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"Request to {create_endpoint} failed (Status: {status_code}): {e}")
        
# Usiamo una delle fixture di creazione (es. actionTime) per avere un ID da cancellare
def test_delete_routine(entities_url, auth_token, created_actionTime_routine):
    routine_info = created_actionTime_routine
    routine_id = routine_info["id"]
    # Assumiamo esista l'endpoint /routine/delete/{id}
    delete_url = f"{entities_url}/routine/delete/{routine_id}"
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] DELETE Routine ID: {routine_id}")
    try:
        response = requests.delete(delete_url, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code == 200
        # Assumiamo questo messaggio di successo, adatta se necessario (controlla virgolette)
        expected_body = '"Routine deleted successfully!"'
        assert response.text == expected_body, f"Unexpected response body: '{response.text}'"
        print(f"[Test] Routine deletion verified. ID: {routine_id}")
    # Usiamo Exception generica per brevità
    except Exception as e:
        pytest.fail(f"DELETE Routine failed: {e}")

# Usiamo la fixture actionTime per i test generici (nome, tapparelle)
def test_patch_routine_name(entities_url, auth_token, created_actionTime_routine):
    routine_info = created_actionTime_routine
    routine_id = routine_info["id"]
    original_name = routine_info["name"]
    # Assumiamo esista l'endpoint /routine/patch/name/{id}
    patch_url = f"{entities_url}/routine/patch/name/{routine_id}"
    new_name = f"Updated_{original_name}"
    payload = {"name": new_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Name for Routine ID: {routine_id} to '{new_name}'")
    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code == 200
        response_data = response.json()
        # Nessuna chiave "Response" per PATCH
        assert "Response" not in response_data
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert entity.get("ID") == routine_id
        assert entity.get("name") == new_name # Assumiamo chiave 'name' minuscola
        print(f"[Test] Routine Name update verified. ID: {routine_id}, New Name: {entity.get('name')}")
    # Usiamo Exception generica per brevità, potresti dettagliare meglio
    except Exception as e:
        pytest.fail(f"PATCH Routine Name failed: {e}")

def test_patch_routine_rollerShutters(entities_url, auth_token, created_actionTime_routine, created_roller_shutters_list):
    routine_info = created_actionTime_routine
    routine_id = routine_info["id"]
    # Usiamo la fixture standard per ottenere tapparelle da collegare
    shutters_to_link = created_roller_shutters_list
    # Assumiamo esista l'endpoint /routine/patch/rollerShutters/{id}
    patch_url = f"{entities_url}/routine/patch/rollerShutters/{routine_id}"
    # Colleghiamo tramite nome
    payload = {"rollerShutters": [{"name": s["name"]} for s in shutters_to_link]}
    headers = {"Authorization": f"Bearer {auth_token}"}
    expected_names = {s["name"] for s in shutters_to_link}

    print(f"\n[Test] PATCH RollerShutters for Routine ID: {routine_id} to link {len(expected_names)} shutters")
    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code == 200
        response_data = response.json()
        assert "Response" not in response_data
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert entity.get("ID") == routine_id
        assert "rollerShutters" in entity
        linked_shutters = entity["rollerShutters"]
        assert isinstance(linked_shutters, list)
        returned_names = {s.get("name") for s in linked_shutters if isinstance(s, dict)} # Chiave 'name' minuscola
        assert returned_names == expected_names
        print(f"[Test] Routine RollerShutters update verified. ID: {routine_id}, Linked Names: {returned_names}")
    except Exception as e:
        pytest.fail(f"PATCH Routine RollerShutters failed: {e}")

# Usiamo la fixture specifica per routine actionTime
def test_patch_routine_actionTime(entities_url, auth_token, created_actionTime_routine):
    routine_info = created_actionTime_routine
    routine_id = routine_info["id"]
    # Assumiamo esista l'endpoint /routine/patch/actionTime/{id}
    patch_url = f"{entities_url}/routine/patch/actionTime/{routine_id}"
    new_time_to_send = "11:45:00" # Nuovo orario HH:MM:SS
    expected_time_in_response = "11:45" # Formato atteso nella risposta HH:MM
    # Usa chiave "time" nel payload per coerenza con create
    payload = {"time": new_time_to_send}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH actionTime for Routine ID: {routine_id} to '{new_time_to_send}'")
    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code == 200
        response_data = response.json()
        assert "Response" not in response_data
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert entity.get("ID") == routine_id
        # Verifica chiave "actionTime" nella risposta e formato HH:MM
        assert "actionTime" in entity
        returned_time = entity["actionTime"]
        assert returned_time == expected_time_in_response
        print(f"[Test] Routine actionTime update verified. ID: {routine_id}, New Time: {returned_time}")
    except Exception as e:
        pytest.fail(f"PATCH Routine actionTime failed: {e}")
        
def test_patch_routine_lightSensor(entities_url, auth_token, created_lightSensor_routine, another_created_light_sensor):
    routine_info = created_lightSensor_routine
    routine_id = routine_info["id"]
    # Usa il SECONDO sensore creato dalla fixture 'another_created_light_sensor'
    new_sensor_info = another_created_light_sensor
    new_sensor_name = new_sensor_info["name"]
    # Assumiamo esista l'endpoint /routine/patch/lightSensor/{id}
    patch_url = f"{entities_url}/routine/patch/lightSensor/{routine_id}"
    # Colleghiamo tramite nome
    payload = {"lightSensor": {"name": new_sensor_name}}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH LightSensor for Routine ID: {routine_id} to link Sensor '{new_sensor_name}'")
    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code == 200
        response_data = response.json()
        assert "Response" not in response_data
        assert "Entity" in response_data
        entity = response_data["Entity"]
        assert entity.get("ID") == routine_id
        assert "lightSensor" in entity
        linked_sensor = entity["lightSensor"]
        assert isinstance(linked_sensor, dict)
        assert linked_sensor.get("name") == new_sensor_name # Assumiamo 'name' minuscola
        print(f"[Test] Routine LightSensor update verified. ID: {routine_id}, Linked Sensor Name: {linked_sensor.get('name')}")
    except Exception as e:
        pytest.fail(f"PATCH Routine LightSensor failed: {e}")
