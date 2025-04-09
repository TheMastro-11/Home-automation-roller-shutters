import requests

# Base URL of your Spring Boot application
BASE_URL = "http://localhost:8080/api/"

# Headers for the requests
HEADERS = {
    "Content-Type": "application/json"
}

def createHome(jwtToken, name):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/home/create"
    data = {
        "name": name
    }

    
    response = requests.post(url, json=data, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)

def deleteHome(jwtToken, id):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/home/delete/{id}"


    response = requests.delete(url, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)   

def putHome(jwtToken, id, name):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/home/put/{id}"
    data = {
        "name": name
    }

    response = requests.put(url,json=data, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def getAllHomes(jwtToken):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/home/"

    response = requests.get(url, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)