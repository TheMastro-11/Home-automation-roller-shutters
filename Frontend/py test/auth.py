import requests
import json

# Base URL of your Spring Boot application
BASE_URL = "http://localhost:8080/api/"

# Headers for the requests
HEADERS = {
    "Content-Type": "application/json"
}

# Function to register a new user
def register_user(username, password):
    url = f"{BASE_URL}auth/register"
    data = {
        "username": username,
        "password": password
    }

    try:
        response = requests.post(url, json=data, headers=HEADERS)
        print("Register User - Status Code:", response.status_code)
        print("Register User - Raw Response:", response.text)

        if response.status_code == 200:
            # Handle successful registration
            print("User registered successfully!")
        else:
            # Handle error response
            print("Error:", response.text)

    except requests.exceptions.RequestException as e:
        print("An error occurred during registration:", e)
        
    
# Function to authenticate a user and get a JWT token
def authenticate_user(username, password):
    url = f"{BASE_URL}auth/authenticate"
    data = {
        "username": username,
        "password": password
    }

    try:
        response = requests.post(url, json=data, headers=HEADERS)
        print("Authenticate User - Status Code:", response.status_code)
        print("Authenticate User - Raw Response:", response.text)

        if response.status_code == 200:
            # Parse the JSON response to get the JWT token
            response_data = response.json()
            jwt_token = response_data.get("jwt")  # Look for the "jwt" key
            print("JWT Token:", jwt_token)
            return jwt_token
        else:
            # Handle error response
            print("Error:", response.text)
            return None

    except requests.exceptions.RequestException as e:
        print("An error occurred during authentication:", e)
        return None
    except json.JSONDecodeError as e:
        print("Failed to parse JSON response:", e)
        return None   