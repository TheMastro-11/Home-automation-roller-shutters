import requests
import sys

# Base URL of your Spring Boot application
BASE_URL = "http://localhost:8080/api/"

# Headers for the requests
HEADERS = {
    "Content-Type": "application/json"
}

def getAllLightSensor(jwtToken):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/lightSensor/"

    
    response = requests.get(url, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)

def createLightSensor(jwtToken, name, homeName):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/lightSensor/create"
    data = {
        "name": name,
        "home" : {
            "name" : homeName
        }
    }

    
    response = requests.post(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def deleteLightSensor(jwtToken, id):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/lightSensor/delete/{id}"
    
    response = requests.delete(url, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchNameLightSensor(jwtToken, id, name):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/lightSensor/patch/name/{id}"
    data = {
        "name" : name
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchValueLightSensor(jwtToken, id, lightValue):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/lightSensor/patch/value/{id}"
    data = {
        "lightValue" : lightValue
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchHomeLightSensor(jwtToken, id, homeName):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/lightSensor/patch/home/{id}"
    data = {
        "home" : {
            "name" : homeName}
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)