import requests
import json

# URL dell'endpoint API (sostituiscilo con il tuo vero URL)
url='http://localhost:8080/tmp'

# Dati utente in formato JSON
data = {
    "string" : "mario"
}

# Header per indicare che stiamo inviando JSON
headers = {
    "Content-Type": "application/json"
}

# Effettuare la richiesta POST
response = requests.post(url, data=json.dumps(data), headers=headers)

#response = requests.get(url)

# Stampare la risposta del server
print("Status Code:", response.status_code)
print("Response:", response.text)
