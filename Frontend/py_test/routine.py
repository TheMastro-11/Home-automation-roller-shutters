import requests
import sys

# Base URL of your Spring Boot application
BASE_URL = "http://localhost:8080/api/entities/routine"

# Headers for the requests
HEADERS = {
    "Content-Type": "application/json"
}

def getAllRoutines(jwtToken):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/"

    
    response = requests.get(url, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)

def createRoutineActiontime(jwtToken, name, actionTime, rollerShutters):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/create/actionTime"
    data = {
        "name": name,
        "actionTime" : actionTime,
        "rollerShutters" : rollerShutters
    }

    
    response = requests.post(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def createRoutineLightSensor(jwtToken, name, lightSensor, rollerShutters):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/create/lightSensor"
    data = {
        "name": name,
        "lightSensor" : lightSensor,
        "rollerShutters" : rollerShutters
    }

    
    response = requests.post(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def deleteRoutine(jwtToken, id):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/delete/{id}"
    
    response = requests.delete(url, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchNameRoutine(jwtToken, id, name):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/patch/name/{id}"
    data = {
        "name" : name
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchActualTimeRoutine(jwtToken, id, actualTime):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/patch/lightSensor/{id}"
    data = {
        "actualTime" : actualTime
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)

def patchLightSensorRoutine(jwtToken, id, lightSensor):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/patch/lightSensor/{id}"
    data = {
        "lightSensor" : lightSensor
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchRollerShutterRoutine(jwtToken, id, rollerShutters):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}/patch/rollerShutters/{id}"
    data = {
        "rollerShutters" : rollerShutters
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    if response.status_code != 200: sys.exit(response.status_code)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)