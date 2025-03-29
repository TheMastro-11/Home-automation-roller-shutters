import requests

# Base URL of your Spring Boot application
url = "http://localhost:8080/tmp"

# Headers for the request
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {jwt_token}"  # Add the JWT token to the Authorization header
}

# Request payload
data = {
    "string": "ciao"
}

try:
    # Send the POST request
    response = requests.post(url, json=data, headers=HEADERS)
    
    # Print the status code and raw response for debugging
    print("Status Code:", response.status_code)
    print("Raw Response:", response.text)

    # Check if the response is JSON
    if response.headers.get("Content-Type") == "application/json":
        response_data = response.json()  # Parse JSON
        print("Response Data:", response_data)
    else:
        # Handle plain text response
        print("Plain Text Response:", response.text)

except requests.exceptions.RequestException as e:
    print("An error occurred during the request:", e)
    
    