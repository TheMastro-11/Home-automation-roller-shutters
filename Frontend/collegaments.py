import requests
import json

# URL dell'endpoint API (sostituiscilo con il tuo vero URL)
url='http://84.220.36.142:8080/RegisterUser'

# Dati utente in formato JSON
data = {
    "name": "testuser@example.com",
    "password": "mypassword123"
}

# Header per indicare che stiamo inviando JSON
headers = {
    "Content-Type": "application/json"
}

# Effettuare la richiesta POST
response = requests.post(url, data=json.dumps(data), headers=headers)

# Stampare la risposta del server
print("Status Code:", response.status_code)
print("Response:", response.text)
