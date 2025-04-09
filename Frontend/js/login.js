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
                // Usa sha256 da utils.js
                const hashedPassword = await sha256(password);

                const loginData = {
                    username: username,
                    password: hashedPassword // Invia password hashata
                };

                // Usa fetchApi per la chiamata POST
                // fetchApi gestirà il parsing della risposta JSON
                const result = await fetchApi("/api/auth/authenticate", 'POST', loginData);

                // Controlla se la risposta contiene il token JWT
                if (result && result.jwt) {
                    localStorage.setItem("jwt", result.jwt); // Salva il token
                    // alert("Login successful!"); // Forse non serve l'alert se reindirizzi subito
                    window.location.href = "dashboard.html"; // Reindirizza alla dashboard
                } else {
                    // Se fetchApi non ha lanciato errore ma manca il jwt
                    throw new Error(result?.message || "Invalid credentials or missing token.");
                }

            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed: " + error.message);
                submitButton.disabled = false; // Riabilita bottone in caso di errore
                submitButton.textContent = 'Login';
            }
        });
    }
});