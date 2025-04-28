const API_BASE_URL = "http://localhost:8080"; // Local development

// Hashes a message using SHA-256.
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    // Convert buffer to hex string
    return Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Generic function to fetch data from the API.
async function fetchApi(path, method = 'GET', body = null, extraHeaders = {}, sendAuthToken = true) {
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders,
    };

    // Add Authorization header ONLY if sendAuthToken is true AND a token exists
    if (sendAuthToken) {
        const token = localStorage.getItem("jwt");
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        // else { console.log(`API call to ${path} - No token found or sendAuthToken is false`); }
    }

    const options = {
        method: method,
        headers: headers,
    };

    // Send body only if it's not null/undefined
    if (body !== null && body !== undefined) {
        options.body = JSON.stringify(body);
    }

    // console.log(`Calling fetchApi: ${method} ${API_BASE_URL}${path}`, options);

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, options);

        // Handle HTTP errors
        if (!response.ok) {
            let errorData = { message: response.statusText || `Request failed with status ${response.status}` }; // Default message
            try {
                // Try to read a more specific JSON error message from the backend
                const errorJson = await response.json();
                // Use the message from JSON if present, otherwise keep statusText
                if (errorJson && errorJson.message) {
                    errorData = errorJson; // Use the entire error object if it has a defined structure
                    errorData.message = errorJson.message; // Ensure message is present
                } else if (errorJson && errorJson.error) { // Sometimes the error is in 'error'
                    errorData.message = errorJson.error;
                }
                // Add status and path for context if not already present
                if (!errorData.status) errorData.status = response.status;
                if (!errorData.path) errorData.path = path;

            } catch (e) {
                // If the error body isn't JSON, that's okay, use statusText
                console.log("Response error body was not JSON.");
            }
            console.error(`API Error (${response.status} ${method} ${path}):`, errorData);
            // Create an error containing as much detail as possible
            const error = new Error(errorData.message);
            error.status = response.status;
            error.details = errorData; // Attach extra details
            throw error; // Throw the error to stop execution in the calling block
        }

        // Handle responses without content (e.g., 204 No Content for DELETE)
        if (response.status === 204) {
            return null;
        }

        // Handle responses with content (JSON or text)
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json(); // Parse JSON
            } else {
                const textResponse = await response.text(); // Get as text
                // If the text is empty but the response was OK (e.g., 200/201), return null or a success indicator
                if (response.ok && !textResponse) {
                    return { success: true }; // Or simply null
                }
                return textResponse; // Otherwise return the text
            }
        } catch (e) {
            console.warn(`Could not parse API response body for ${method} ${path}:`, e);
            // If parsing fails but the response was OK, return a success indicator
            if (response.ok) {
                return { success: true, message: "Response OK but body parsing failed." };
            }
            return null; // Otherwise null
        }

    } catch (error) {
        // Catch both network/fetch errors and errors thrown by !response.ok
        console.error(`Network or API call error (${method} ${path}):`, error);
        // Rethrow the error so it can be handled by the caller (e.g., with alert)
        // Make sure the message is useful
        throw new Error(error.message || "Network error or failed API call.");
    }
}

// Handles the login form submission.
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const usernameInput = document.getElementById("loginname"); // Correct ID for login
            const passwordInput = document.getElementById("loginPassword"); // Correct ID for login
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

                // Call fetchApi specifying sendAuthToken = false
                const result = await fetchApi("/api/auth/authenticate", 'POST', loginData, {}, false); // false added at the end

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


// Checks if the user is authenticated (if a JWT exists).
// Redirects to the login page if not authenticated.
function checkAuthentication() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        console.log("No JWT found, redirecting to login.");
        window.location.href = "login.html"; // Ensure login.html is in the same folder or use the correct path
        return false; // Not authenticated
    }
    // Note: We are not validating the *expiration* or *validity* of the token here,
    // only its presence. The backend will reject requests with expired/invalid tokens.
    return true; // Authenticated (token present)
}

// Performs logout: removes the token and redirects to login.
function logout() {
    console.log("Logout function called"); // Debug message
    localStorage.removeItem("jwt");
    // alert("You have been logged out!"); // You can remove/modify this alert
    console.log("JWT removed. Redirecting to login page...");
    // Redirect to the login page
    window.location.href = "login.html";
}