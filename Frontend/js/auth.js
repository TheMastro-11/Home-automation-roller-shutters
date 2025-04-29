const API_BASE_URL = "http://localhost:8080"; 

async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function fetchApi(path, method = 'GET', body = null, extraHeaders = {}, sendAuthToken = true) {
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders,
    };

    if (sendAuthToken) {
        const token = localStorage.getItem("jwt");
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (body !== null && body !== undefined) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, options);
        if (!response.ok) {
            let errorData = { message: response.statusText || `Request failed with status ${response.status}` }; 
            try {
                const errorJson = await response.json();
                if (errorJson && errorJson.message) {
                    errorData = errorJson; 
                    errorData.message = errorJson.message; 
                } else if (errorJson && errorJson.error) { 
                    errorData.message = errorJson.error;
                }
                if (!errorData.status) errorData.status = response.status;
                if (!errorData.path) errorData.path = path;

            } catch (e) {
                console.log("Response error body was not JSON.");
            }
            console.error(`API Error (${response.status} ${method} ${path}):`, errorData);
            const error = new Error(errorData.message);
            error.status = response.status;
            error.details = errorData;
            throw error; 
        }
        if (response.status === 204) {
            return null;
        }
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                const textResponse = await response.text();
                if (response.ok && !textResponse) {
                    return { success: true };
                }
                return textResponse;
            }
        } catch (e) {
            console.warn(`Could not parse API response body for ${method} ${path}:`, e);
            if (response.ok) {
                return { success: true, message: "Response OK but body parsing failed." };
            }
            return null; 
        }

    } catch (error) {
        console.error(`Network or API call error (${method} ${path}):`, error);
        throw new Error(error.message || "Network error or failed API call.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const usernameInput = document.getElementById("loginname");
            const passwordInput = document.getElementById("loginPassword");
            const submitButton = loginForm.querySelector('button[type="submit"]');

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                alert("Please enter both username and password.");
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';

            try {
                const hashedPassword = await sha256(password);
                const loginData = {
                    username: username,
                    password: hashedPassword
                };
                const result = await fetchApi("/api/auth/authenticate", 'POST', loginData, {}, false);

                if (result && result.jwt) {
                    localStorage.setItem("jwt", result.jwt);
                    window.location.href = "dashboard.html";
                } else {
                    throw new Error(result?.message || "Invalid credentials or missing token.");
                }

            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed: " + error.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        });
    }
});

function checkAuthentication() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        console.log("No JWT found, redirecting to login.");
        window.location.href = "login.html";
        return false; 
    }
    return true; 
}

function logout() {
    console.log("Logout function called");
    localStorage.removeItem("jwt");
    console.log("JWT removed. Redirecting to login page...");
    window.location.href = "login.html";
}