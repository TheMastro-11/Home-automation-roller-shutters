import requests
import pytest
import uuid

@pytest.fixture(scope="function")
def created_light_sensor(entities_url, auth_token):
    create_endpoint = f"{entities_url}/lightSensor/create"
    unique_sensor_name = f"TestSensor_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_sensor_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Fixture Setup] Creating Light Sensor: {unique_sensor_name} at {create_endpoint}")

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()

        assert response.status_code in [200, 201], f"Unexpected status code: {response.status_code}"

        response_data = response.json()
        # Verifica che la chiave "Response" esista e abbia il valore corretto
        assert "Response" in response_data, "Response JSON missing 'Response' key"
        assert response_data.get("Response") == "LightSensor created successfully!", \
               f"Unexpected response message: {response_data.get('Response')}"
        assert "Entity" in response_data, "Response JSON missing 'Entity' key"
        entity = response_data["Entity"]
        assert isinstance(entity, dict), "'Entity' should be a dictionary"

        assert "ID" in entity, "Entity data missing 'ID' key"
        sensor_id = entity.get("ID")
        assert isinstance(sensor_id, str) and len(sensor_id) > 0, f"Invalid ID received: {sensor_id!r}"

        assert entity.get("Name") == unique_sensor_name, \
               f"Expected name '{unique_sensor_name}', got '{entity.get('Name')}'"

        print(f"[Fixture Setup] Light Sensor '{unique_sensor_name}' created successfully with ID: {sensor_id}.")
        return {"id": sensor_id, "name": unique_sensor_name}

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"[Fixture Setup] Light Sensor creation request failed (Status: {status_code}): {e}")
    except (ValueError, KeyError, AssertionError) as e:
        pytest.fail(f"[Fixture Setup] Light Sensor creation response validation failed: {e}. Status: {response.status_code}, Body: '{response.text}'")


def test_create_light_sensor_success(entities_url, auth_token):
    create_endpoint = f"{entities_url}/lightSensor/create"
    unique_sensor_name = f"MySensor_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_sensor_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] Running test_create_light_sensor_success for name: {unique_sensor_name}")

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()

        assert response.status_code in [200, 201], f"Unexpected status code: {response.status_code}"

        try:
            response_data = response.json()
            # Verifica che la chiave "Response" esista e abbia il valore corretto
            assert "Response" in response_data, "Response JSON missing 'Response' key"
            assert response_data.get("Response") == "LightSensor created successfully!", \
               f"Unexpected response message: {response_data.get('Response')}"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict), "'Entity' should be a dictionary"

            assert "ID" in entity, "Entity data missing 'ID' key"
            sensor_id = entity.get("ID")
            assert isinstance(sensor_id, str) and len(sensor_id) > 0, f"Invalid ID received: {sensor_id!r}"

            assert "Name" in entity, "Entity data missing 'Name' key"
            assert entity.get("Name") == unique_sensor_name, \
                   f"Expected name '{unique_sensor_name}', got '{entity.get('Name')}'"

            print(f"[Test] Light Sensor creation verified. ID: {sensor_id}, Name: {entity.get('Name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
            pytest.fail(f"Assertion failed on create response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"Request to {create_endpoint} failed (Status: {status_code}): {e}")


def test_delete_light_sensor_success(entities_url, auth_token, created_light_sensor):
    sensor_info = created_light_sensor
    sensor_id = sensor_info["id"]
    sensor_name = sensor_info["name"]
    delete_endpoint = f"{entities_url}/lightSensor/delete/{sensor_id}"
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] Running test_delete_light_sensor_success for ID: {sensor_id} (Name: {sensor_name})")
    print(f"[Test] Deleting at URL: {delete_endpoint}")

    try:
        response = requests.delete(delete_endpoint, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        print(f"[Test] Response Body: {response.text}")

        response.raise_for_status()

        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"

        expected_body = '"LightSensor deleted successfully!"'
        assert response.text == expected_body, f"Unexpected response body: '{response.text}'"

        print(f"[Test] Light Sensor deletion verified for ID: {sensor_id}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"DELETE request to {delete_endpoint} failed (Status: {status_code}): {e}")

def test_patch_lightSensor_name(entities_url, auth_token, created_light_sensor):
    sensor_info = created_light_sensor
    sensor_id = sensor_info["id"]
    original_name = sensor_info["name"]
    patch_url = f"{entities_url}/lightSensor/patch/name/{sensor_id}"
    new_name = f"UpdatedSensorName_{uuid.uuid4().hex[:6]}"
    payload = {"name": new_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Name for LightSensor ID: {sensor_id} to '{new_name}' at {patch_url}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            # Verifica assenza chiave "Response"
            assert "Response" not in response_data, "Unexpected 'Response' key found in PATCH response"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict), "'Entity' should be a dictionary"
            # Verifica ID corretto
            assert entity.get("ID") == sensor_id, f"Expected ID '{sensor_id}', got '{entity.get('ID')}'"
            # Verifica che il nome sia stato aggiornato
            assert entity.get("Name") == new_name, f"Expected Name '{new_name}', got '{entity.get('Name')}'"

            print(f"[Test] LightSensor name update verified. ID: {entity.get('ID')}, New Name: {entity.get('Name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")


def test_patch_lightSensor_value(entities_url, auth_token, created_light_sensor):
    sensor_info = created_light_sensor
    sensor_id = sensor_info["id"]
    patch_url = f"{entities_url}/lightSensor/patch/value/{sensor_id}"
    # Scegli un valore intero per l'aggiornamento
    new_value = 789
    payload = {"value": new_value}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Value for LightSensor ID: {sensor_id} to {new_value} at {patch_url}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            # Verifica assenza chiave "Response"
            assert "Response" not in response_data, "Unexpected 'Response' key found in PATCH response"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict), "'Entity' should be a dictionary"
            # Verifica ID corretto
            assert entity.get("ID") == sensor_id, f"Expected ID '{sensor_id}', got '{entity.get('ID')}'"

            # Verifica che il valore sia stato aggiornato
            assert "LightValue" in entity, "Entity data missing 'LightValue' key"
            returned_value = entity["LightValue"]
            # Confronta i valori come stringhe per sicurezza contro differenze di tipo (es. API restituisce "789" invece di 789)
            assert str(returned_value) == str(new_value), \
                   f"Expected LightValue '{new_value}', got '{returned_value}' (type: {type(returned_value)})"

            print(f"[Test] LightSensor value update verified. ID: {entity.get('ID')}, New Value: {returned_value}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")