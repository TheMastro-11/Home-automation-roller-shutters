import requests

# Base URL of your Spring Boot application
BASE_URL = "http://localhost:8080/api/"

# Headers for the requests
HEADERS = {
    "Content-Type": "application/json"
}

def getAllRollerShutter(jwtToken):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/rollerShutter/"

    
    response = requests.get(url, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)

def createRollerShutter(jwtToken, name, homeName):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/rollerShutter/create"
    data = {
        "name": name,
        "home" : {
            "name" : homeName
        }
    }

    
    response = requests.post(url, json=data, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def deleteRollerShutter(jwtToken, id):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/rollerShutter/delete/{id}"
    
    response = requests.delete(url, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchNameRollerShutter(jwtToken, id, name):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/rollerShutter/patch/name/{id}"
    data = {
        "name" : name
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchOpeningRollerShutter(jwtToken, id, percentageOpening):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/rollerShutter/patch/opening/{id}"
    data = {
        "percentageOpening" : percentageOpening
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)
    
def patchHomeRollerShutter(jwtToken, id, homeName):
    HEADERS_BEARER = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwtToken}"
    }

    url = f"{BASE_URL}entities/rollerShutter/patch/home/{id}"
    data = {
        "home" : {
            "name" : homeName}
    }

    
    response = requests.patch(url, json=data, headers=HEADERS_BEARER)
    print("Authenticate User - Status Code:", response.status_code)
    print("Authenticate User - Raw Response:", response.text)