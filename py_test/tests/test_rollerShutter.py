import requests
import pytest
import uuid

@pytest.fixture(scope="function")
def created_roller_shutter(entities_url, auth_token):
    create_endpoint = f"{entities_url}/rollerShutter/create"
    unique_shutter_name = f"TestShutter_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_shutter_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Fixture Setup] Creating Roller Shutter: {unique_shutter_name} at {create_endpoint}")

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        assert response.status_code in [200, 201]

        response_data = response.json()
        assert "Response" in response_data, "Response JSON missing 'Response' key"
        assert response_data.get("Response") == "RollerShutter created successfully!", \
               f"Unexpected response message: {response_data.get('Response')}"

        assert "Entity" in response_data, "Response JSON missing 'Entity' key"
        entity = response_data["Entity"]
        assert isinstance(entity, dict)
        assert "ID" in entity
        shutter_id = entity.get("ID")
        assert isinstance(shutter_id, str) and len(shutter_id) > 0
        assert entity.get("name") == unique_shutter_name

        print(f"[Fixture Setup] Roller Shutter '{unique_shutter_name}' created successfully with ID: {shutter_id}.")
        return {"id": shutter_id, "name": unique_shutter_name}

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"[Fixture Setup] Roller Shutter creation request failed (Status: {status_code}): {e}")
    except (ValueError, KeyError, AssertionError) as e:
        pytest.fail(f"[Fixture Setup] Roller Shutter creation response validation failed: {e}. Status: {response.status_code}, Body: '{response.text}'")


def test_create_roller_shutter_success(entities_url, auth_token):
    create_endpoint = f"{entities_url}/rollerShutter/create"
    unique_shutter_name = f"MyShutter_{uuid.uuid4().hex[:8]}"
    payload = {"name": unique_shutter_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] Running test_create_roller_shutter_success for name: {unique_shutter_name}")

    try:
        response = requests.post(create_endpoint, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code in [200, 201]

        try:
            response_data = response.json()
            assert "Response" in response_data, "Response JSON missing 'Response' key"
            assert response_data.get("Response") == "RollerShutter created successfully!", \
                   f"Unexpected response message: {response_data.get('Response')}"

            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert "ID" in entity
            shutter_id = entity.get("ID")
            assert isinstance(shutter_id, str) and len(shutter_id) > 0
            assert "name" in entity
            assert entity.get("name") == unique_shutter_name

            print(f"[Test] Roller Shutter creation verified. ID: {shutter_id}, Name: {entity.get('Name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on create response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"Request to {create_endpoint} failed (Status: {status_code}): {e}")


def test_delete_roller_shutter_success(entities_url, auth_token, created_roller_shutter):
    shutter_info = created_roller_shutter
    shutter_id = shutter_info["id"]
    shutter_name = shutter_info["name"]
    delete_endpoint = f"{entities_url}/rollerShutter/delete/{shutter_id}"
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] Running test_delete_roller_shutter_success for ID: {shutter_id} (Name: {shutter_name})")
    print(f"[Test] Deleting at URL: {delete_endpoint}")

    try:
        response = requests.delete(delete_endpoint, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        print(f"[Test] Response Body: {response.text}")
        response.raise_for_status()
        assert response.status_code == 200

        expected_body = '"RollerShutter deleted successfully!"'
        assert response.text == expected_body, f"Unexpected response body: '{response.text}'"

        print(f"[Test] Roller Shutter deletion verified for ID: {shutter_id}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"DELETE request to {delete_endpoint} failed (Status: {status_code}): {e}")


def test_patch_roller_shutter_name(entities_url, auth_token, created_roller_shutter):
    shutter_info = created_roller_shutter
    shutter_id = shutter_info["id"]
    original_name = shutter_info["name"]
    patch_url = f"{entities_url}/rollerShutter/patch/name/{shutter_id}"
    new_name = f"UpdatedShutter_{original_name}_{uuid.uuid4().hex[:4]}"
    payload = {"name": new_name}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Name for RollerShutter ID: {shutter_id} to '{new_name}' at {patch_url}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            
            assert "Response" not in response_data, "Unexpected 'Response' key found in PATCH response"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict)
            assert entity.get("ID") == shutter_id
            assert entity.get("name") == new_name, f"Expected Name '{new_name}', got '{entity.get('name')}'"

            print(f"[Test] RollerShutter name update verified. ID: {entity.get('ID')}, New Name: {entity.get('name')}")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")
        
        
def test_patch_roller_shutter_opening(entities_url, auth_token, created_roller_shutter):
    shutter_info = created_roller_shutter
    shutter_id = shutter_info["id"]
    patch_url = f"{entities_url}/rollerShutter/patch/opening/{shutter_id}"
    new_opening_value = 75
    payload = {"value": new_opening_value}
    headers = {"Authorization": f"Bearer {auth_token}"}

    print(f"\n[Test] PATCH Opening for RollerShutter ID: {shutter_id} to {new_opening_value}% at {patch_url}")
    print(f"[Test] Payload: {payload}")

    try:
        response = requests.patch(patch_url, json=payload, headers=headers, timeout=10)
        print(f"[Test] Response Status Code: {response.status_code}")
        response.raise_for_status()
        assert response.status_code == 200

        try:
            response_data = response.json()
            assert "Response" not in response_data, "Unexpected 'Response' key found in PATCH response"
            assert "Entity" in response_data, "Response JSON missing 'Entity' key"
            entity = response_data["Entity"]
            assert isinstance(entity, dict), "'Entity' should be a dictionary"
            # Verifica ID corretto
            assert entity.get("ID") == shutter_id, f"Expected ID '{shutter_id}', got '{entity.get('ID')}'"

            assert "percentageOpening" in entity, "Entity data missing 'percentageOpening' key"
            returned_opening = entity["percentageOpening"]
            assert str(returned_opening) == str(new_opening_value), \
                   f"Expected percentageOpening '{new_opening_value}', got '{returned_opening}' (type: {type(returned_opening)})"

            print(f"[Test] RollerShutter opening update verified. ID: {entity.get('ID')}, New Opening: {returned_opening}%")

        except ValueError:
            pytest.fail(f"Response is not valid JSON: {response.text}")
        except (KeyError, AssertionError) as e:
             print(f"\nDEBUG on Fail: Received JSON: {response_data}\n")
             pytest.fail(f"Assertion failed on PATCH response JSON: {e}. Response JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else "N/A"
        pytest.fail(f"PATCH request failed (Status: {status_code}): {e}")