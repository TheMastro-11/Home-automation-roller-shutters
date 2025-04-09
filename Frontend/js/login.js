document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const usernameInput = document.getElementById("loginname"); // ID corretto per login
            const passwordInput = document.getElementById("loginPassword"); // ID corretto per login
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
            
                // Chiama fetchApi specificando sendAuthToken = false
                //                                                         vvvvv
                const result = await fetchApi("/api/auth/authenticate", 'POST', loginData, {}, false); // << AGGIUNTO false ALLA FINE
            
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