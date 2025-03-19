import requests

url = "http://localhost:8080/tmp"

HEADERS = {
    "Content-Type": "application/json"
}

data = {
        "string" : "ciao"
    }

response = requests.post(url, json=data, headers=HEADERS)
response_data = response.json()
print(response.text)
