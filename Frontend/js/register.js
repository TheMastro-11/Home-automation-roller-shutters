document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Impedisce l'invio standard del form

            const usernameInput = document.getElementById("username");
            const passwordInput = document.getElementById("password");
            const submitButton = registerForm.querySelector('button[type="submit"]');

            const username = usernameInput.value.trim();
            const password = passwordInput.value; // Non trimmare la password

            if (!username || !password) {
                alert("Please enter both username and password.");
                return;
            }

            submitButton.disabled = true; // Disabilita durante l'invio
            submitButton.textContent = 'Registering...'; // Feedback visivo

            try {
                // Usa la funzione sha256 dal file utils.js
                const hashedPassword = await sha256(password);

                const userData = {
                    username: username,
                    password: hashedPassword // Invia la password hashata
                };

                // Usa fetchApi per la chiamata (presuppone che l'endpoint non richieda token per registrarsi)
                // Modifica il path se necessario e verifica se fetchApi gestisce correttamente
                // le chiamate che NON devono inviare un token (attualmente lo fa)
                await fetchApi("/api/auth/register", 'POST', userData);

                alert("Registration successful! Please login.");
                window.location.href = "login.html"; // Reindirizza al login

            } catch (error) {
                // fetchApi lancia l'errore con il messaggio del server (se disponibile)
                console.error("Registration failed:", error);
                alert("Registration failed: " + error.message);
                submitButton.disabled = false; // Riabilita in caso di errore
                submitButton.textContent = 'Register';
            }
            // Non è necessario riabilitare il bottone qui se la registrazione ha successo,
            // perché la pagina viene reindirizzata.
        });
    }
});