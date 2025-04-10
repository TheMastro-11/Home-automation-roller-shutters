import requests
import pytest
import uuid

@pytest.fixture(scope="function")
def new_test_user(base_api_url):
    register_endpoint = f"{base_api_url}/auth/register"
    username = f"owner_user_{uuid.uuid4().hex[:8]}"
    password = "owner_password_456"
    payload = {"username": username, "password": password}

    print(f"\n[Fixture Setup] Registering new owner user: {username} at {register_endpoint}")

    try:
        response = requests.post(register_endpoint, json=payload, timeout=10)
        expected_body = '"User registered successfully!"'
        if response.status_code != 200 or response.text != expected_body:
            pytest.fail(f"[Fixture Setup] New owner registration failed! Status: {response.status_code}, Body: '{response.text}'")

        print(f"[Fixture Setup] New owner user '{username}' registered successfully.")
        return username

    except requests.exceptions.RequestException as e:
        pytest.fail(f"[Fixture Setup] Request failed during new owner registration: {e}")

@pytest.fixture(scope="function")
def created_home(entities_url, auth_token):
    create_endpoint = f"{entities_url}/home/create"
    unique_home_name = f"TestHome_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_home_name}

    headers = {"Authorization": f"Bearer {auth_token}"}


    print(f"\n[Fixture Setup] Tentativo creazione home: {unique_home_name} a {create_endpoint} (Auth: Bearer ...)")

    try:

        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)

        response.raise_for_status()


        response_data = response.json()
        assert response_data.get("Response") == "Home created successfully!"

        entity = response_data["Entity"]
        home_id = entity["ID"]
        assert isinstance(home_id, str) and len(home_id) > 0
        assert entity.get("name") == unique_home_name

        print(f"[Fixture Setup] Home '{unique_home_name}' creata con ID: {home_id}.")
        return {"id": home_id, "name": unique_home_name}

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"[Fixture Setup] Richiesta creazione home fallita (Status: {status_code}): {e}")
    except (ValueError, KeyError, AssertionError) as e:
         if "Expecting value" in str(e) or "JSONDecodeError" in str(e.__class__):
              pytest.fail(f"[Fixture Setup] La risposta NON è JSON valido (API issue?). Corpo: {response.text} | Errore: {e}")
         else:
              pytest.fail(f"[Fixture Setup] Validazione risposta creazione home fallita: {e}. Status: {response.status_code}, Body: '{response.text}'")



def test_create_home_success(entities_url, auth_token):
    create_endpoint = f"{entities_url}/home/create"
    unique_home_name = f"MyHome_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_home_name}


    headers = {"Authorization": f"Bearer {auth_token}"}


    print(f"\n[Test] Esecuzione test_create_home_success per nome: {unique_home_name} (Auth: Bearer ...)")

    try:

        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)


        print(f"[Test] Ricevuto status code: {response.status_code}")


        assert response.status_code in [200, 201], f"Status code inatteso: {response.status_code}"


        try:
            response_data = response.json()

            assert response_data.get("Response") == "Home created successfully!", "Messaggio di risposta errato"
            entity = response_data["Entity"]
            home_id = entity["ID"]
            assert entity["name"] == unique_home_name
            print(f"[Test] Verifica JSON riuscita per home ID: {home_id}")

        except ValueError:
             pytest.fail(f"La risposta NON è JSON valido (API issue?). Corpo: {response.text}")
        except (KeyError, AssertionError) as e:
             pytest.fail(f"Validazione JSON fallita: {e}. Risposta JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"La richiesta a {create_endpoint} è fallita (Status: {status_code}): {e}")



def test_delete_home_success(entities_url, auth_token, created_home):
    home_info = created_home
    home_id_to_delete = home_info["id"]
    home_name_to_delete = home_info["name"]
    delete_endpoint = f"{entities_url}/home/delete/{home_id_to_delete}"


    headers = {"Authorization": f"Bearer {auth_token}"}


    print(f"\n[Test] Esecuzione test_delete_home_success per ID: {home_id_to_delete} (Nome: {home_name_to_delete}) (Auth: Bearer ...)")
    print(f"[Test] URL Chiamato: {delete_endpoint}")

    try:

        response = requests.delete(delete_endpoint, headers=headers, timeout=10)


        print(f"[Test] Ricevuto status code: {response.status_code}")
        print(f"[Test] Ricevuto corpo risposta: {response.text}")


        assert response.status_code == 200, f"Status code inatteso: {response.status_code}"


        expected_body = '"Home deleted successfully!"'
        assert response.text == expected_body, f"Corpo risposta inatteso: '{response.text}'"
        print(f"[Test] Cancellazione home ID {home_id_to_delete} verificata.")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"La richiesta a {delete_endpoint} è fallita (Status: {status_code}): {e}")


def test_patch_home_name(entities_url, auth_token, created_home):
    home_info = created_home
    home_id = home_info["id"]
    original_name = home_info["name"]
    patch_url = f"{entities_url}/home/patch/name/{home_id}"
    new_name = f"Updated_{original_name}_{uuid.uuid4().hex[:4]}"
    payload = {"name": new_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Name for Home ID: {home_id} to '{new_name}' at {patch_url}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()

        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"

        try:
            response_data = response.json()
            assert "Response" not in response_data, "Unexpected 'Response' key found in PATCH response"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict), "'Entity' should be a dictionary"
            assert entity.get("ID") == home_id, f"Expected ID '{home_id}', got '{entity.get('ID')}'"
            assert entity.get("name") == new_name, f"Expected Name '{new_name}', got '{entity.get('Name')}'"

            print(f"[Test] Name update verified. ID: {entity.get('ID')}, New Name: {entity.get('Name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
            pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")


def test_patch_home_owner(entities_url, auth_token, created_home, new_test_user):
    home_info = created_home
    home_id = home_info["id"]
    patch_url = f"{entities_url}/home/patch/owner/{home_id}"
    new_owner_name = new_test_user
    payload = {"user": {"username": new_owner_name}}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Owner for Home ID: {home_id} to Owner '{new_owner_name}' at {patch_url}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            assert "Response" not in response_data
            assert "Entity" in response_data
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert entity.get("ID") == home_id
            assert "owner" in entity, "Entity data missing 'name' key"
            owner_data = entity["owner"]
            assert isinstance(owner_data, dict), "'owner' should be a dictionary"
            assert owner_data.get("name") == new_owner_name, \
                   f"Expected owner name '{new_owner_name}', got '{owner_data.get('name')}'"

            print(f"[Test] Owner update verified. ID: {entity.get('ID')}, New Owner Name: {owner_data.get('name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
            pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")

def test_patch_home_lightSensor(entities_url, auth_token, created_home, created_light_sensor):
    home_info = created_home
    home_id = home_info["id"]
    # Ottieni i dettagli del sensore creato dalla sua fixture
    light_sensor_info = created_light_sensor
    sensor_id = light_sensor_info["id"] # Manteniamo l'ID per verifica nella risposta
    sensor_name = light_sensor_info["name"] # Prendiamo il NOME dalla fixture

    patch_url = f"{entities_url}/home/patch/lightSensor/{home_id}"

    # --- CORREZIONE: Il payload usa il NOME del sensore ---
    payload = {"lightSensor": {"name": sensor_name}}
    # ----------------------------------------------------

    headers = {"Authorization": f"Bearer {auth_token}"}

    # Aggiornato il messaggio di log per chiarezza
    print(f"\n[Test] PATCH Home ID {home_id} to link LightSensor by Name '{sensor_name}' at {patch_url}")
    print(f"[Test] Payload: {payload}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            assert "Response" not in response_data
            assert "Entity" in response_data
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert entity.get("ID") == home_id

            assert "lightSensor" in entity, "Home entity data missing 'lightSensor' key after patch"
            linked_sensor_data = entity["lightSensor"]
            assert isinstance(linked_sensor_data, dict), "Linked 'lightSensor' should be a dictionary"

            # --- CORREZIONE: Verifica prima il NOME del sensore collegato ---
            assert linked_sensor_data.get("name") == sensor_name, \
                   f"Expected linked lightSensor Name '{sensor_name}', got '{linked_sensor_data.get('name')}'"
            # --- Verifica anche l'ID se presente e corretto ---
            # Questo assume che l'API, ricevendo il nome, restituisca l'oggetto completo con l'ID corretto.
            assert linked_sensor_data.get("ID") == sensor_id, \
                   f"Expected linked lightSensor ID '{sensor_id}' (resolved from name), got '{linked_sensor_data.get('ID')}'"

            print(f"[Test] Home link to LightSensor update verified. Home ID: {entity.get('ID')}, Linked Sensor Name: {linked_sensor_data.get('Name')}, Linked Sensor ID: {linked_sensor_data.get('ID')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")
        

def test_patch_home_rollerShutters(entities_url, auth_token, created_home, created_roller_shutters_list):
    home_info = created_home
    home_id = home_info["id"]
    shutters_to_link = created_roller_shutters_list
    num_linked = len(shutters_to_link)

    patch_url = f"{entities_url}/home/patch/rollerShutters/{home_id}"

    payload = {"rollerShutters": [{"name": shutter["name"]} for shutter in shutters_to_link]}

    headers = {"Authorization": f"Bearer {auth_token}"}
    expected_names_set = {s["name"] for s in shutters_to_link}
    expected_ids_set = {s["id"] for s in shutters_to_link}

    print(f"\n[Test] PATCH Home ID {home_id} to link {num_linked} RollerShutters (Names: {expected_names_set}) at {patch_url}")
    print(f"[Test] Payload: {payload}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            assert "Response" not in response_data
            assert "Entity" in response_data
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert entity.get("ID") == home_id

            assert "rollerShutters" in entity, "Home entity data missing 'rollerShutters' key after patch"
            linked_shutters_data = entity["rollerShutters"]
            assert isinstance(linked_shutters_data, list), "Linked 'rollerShutters' should be a list"
            assert len(linked_shutters_data) == num_linked, \
                   f"Expected {num_linked} linked shutters, got {len(linked_shutters_data)}"

            # --- CORREZIONE: Usa get("name") con 'n' minuscola ---
            response_names_set = {shutter.get("name") for shutter in linked_shutters_data if isinstance(shutter, dict)}
            # --- FINE CORREZIONE ---
            response_ids_set = {shutter.get("ID") for shutter in linked_shutters_data if isinstance(shutter, dict)} # ID sembra corretto

            # Ora il confronto dei nomi dovrebbe funzionare
            assert response_names_set == expected_names_set, \
                   f"Mismatch in linked shutter Names. Expected: {expected_names_set}, Got: {response_names_set}"
            # Anche il confronto degli ID dovrebbe funzionare
            assert response_ids_set == expected_ids_set, \
                   f"Mismatch in linked shutter IDs (resolved from name). Expected: {expected_ids_set}, Got: {response_ids_set}"

            print(f"[Test] Home link to {num_linked} RollerShutters update verified. Home ID: {entity.get('ID')}, Linked Names: {response_names_set}, Linked IDs: {response_ids_set}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")