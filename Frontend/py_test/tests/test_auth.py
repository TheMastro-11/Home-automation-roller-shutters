# tests/test_auth.py
import requests 
import pytest   
import uuid     

@pytest.fixture(scope="function")
def registered_user(base_api_url):
    unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "a_secure_password_123!" 
    credentials = {"username": unique_username, "password": password}
    register_endpoint = f"{base_api_url}/auth/register"

    print(f"\n[Fixture Setup] Tentativo di registrazione utente: {unique_username} a {register_endpoint}")

    try:
        response = requests.post(register_endpoint, json=credentials, timeout=10) 
        
        response.raise_for_status() 
        
        expected_body = '"User registered successfully!"'
        assert response.text == expected_body, f"Corpo risposta inatteso: {response.text}"

        print(f"[Fixture Setup] Utente {unique_username} registrato con successo.")
        return credentials

    except requests.exceptions.RequestException as e:
        pytest.fail(f"[Fixture Setup] Richiesta di registrazione fallita: {e}")
    except AssertionError as e:
         pytest.fail(f"[Fixture Setup] Asserzione registrazione fallita: {e}. Status: {response.status_code}, Body: '{response.text}'")


# --- Test per /auth/register ---
def test_register_success(base_api_url):
    """
    Verifica che la registrazione di un nuovo utente vada a buon fine.
    """
    # 1. Prepara i dati per un nuovo utente (di nuovo unico)
    register_endpoint = f"{base_api_url}/auth/register"
    unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "testpassword123"
    payload = {"username": unique_username, "password": password}

    print(f"\n[Test] Esecuzione test_register_success per utente: {unique_username}")

    try:
        # 2. Esegui la richiesta POST
        response = requests.post(register_endpoint, json=payload, timeout=10)

        print(f"[Test] Ricevuto status code: {response.status_code}")
        print(f"[Test] Ricevuto corpo risposta: {response.text}")

        # 3. Verifica Status Code = 200 OK
        assert response.status_code == 200, f"Status code inatteso: {response.status_code}"

        # 4. Verifica Corpo Risposta = "User registered successfully!"
        # Nota: response.text restituisce il corpo come stringa.
        # La specifica ResponseEntity.ok("\"User...\"") implica che le virgolette fanno parte della stringa.
        expected_body = '"User registered successfully!"'
        assert response.text == expected_body, f"Corpo risposta inatteso: {response.text}"

    except requests.exceptions.RequestException as e:
        pytest.fail(f"La richiesta a {register_endpoint} è fallita: {e}")

# --- Test per /auth/authenticate ---
def test_authenticate_success(base_api_url, registered_user):
    """
    Verifica che l'autenticazione di un utente registrato vada a buon fine
    e restituisca un JWT. Utilizza la fixture 'registered_user'.
    """
    # 1. Prepara i dati: usa le credenziali dell'utente creato dalla fixture
    authenticate_endpoint = f"{base_api_url}/auth/authenticate"
    # 'registered_user' è il dizionario {'username': ..., 'password': ...} restituito dalla fixture
    payload = registered_user

    print(f"\n[Test] Esecuzione test_authenticate_success per utente: {payload['username']}")

    try:
        # 2. Esegui la richiesta POST per autenticare
        response = requests.post(authenticate_endpoint, json=payload, timeout=10)

        print(f"[Test] Ricevuto status code: {response.status_code}")

        # 3. Verifica Status Code = 200 OK
        assert response.status_code == 200, f"Status code inatteso: {response.status_code}"

        # 4. Verifica che la risposta sia JSON e contenga un token JWT valido
        try:
            response_data = response.json() # Prova a parsare il corpo come JSON
            print(f"[Test] Ricevuto JSON: {response_data}")

            # Assicurati che sia un dizionario (oggetto JSON)
            assert isinstance(response_data, dict), "La risposta non è un oggetto JSON."
            # Verifica che la chiave 'token' (o come si chiama nel tuo caso) esista
            assert "jwt" in response_data, "La chiave 'token' non è presente nella risposta JSON."
            # Verifica che il token sia una stringa non vuota
            jwt_token = response_data["jwt"]
            assert isinstance(jwt_token, str), "Il valore del token non è una stringa."
            assert len(jwt_token) > 0, "Il token JWT è vuoto."

            print(f"[Test] Token JWT ricevuto con successo.")

        except ValueError: # response.json() fallisce se il corpo non è JSON valido
            pytest.fail(f"La risposta non è JSON valido. Corpo: {response.text}")
        except AssertionError as e: # Le nostre asserzioni sul token sono fallite
             pytest.fail(f"Asserzione sul token JWT fallita: {e}. Risposta JSON: {response_data}")

    except requests.exceptions.RequestException as e:
        pytest.fail(f"La richiesta a {authenticate_endpoint} è fallita: {e}")

# --- Potenziali test aggiuntivi (da implementare se necessario) ---
# def test_register_duplicate_user(base_api_url):
#     # Prova a registrare lo stesso utente due volte, la seconda dovrebbe fallire (es. 409 Conflict)
#     pass
#
# def test_authenticate_invalid_password(base_api_url, registered_user):
#     # Usa la fixture per avere un utente, ma prova ad autenticarti con password sbagliata (es. 401 Unauthorized)
#     pass
#
# def test_authenticate_non_existent_user(base_api_url):
#     # Prova ad autenticarti con un utente che non esiste (es. 401 Unauthorized)
#     pass