document.addEventListener("DOMContentLoaded", () => {
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
      submitButton.textContent = "Registering..."; // Feedback visivo

      // In js/register.js, dentro l'event listener del form submit

      try {
        const hashedPassword = await sha256(password);
        const userData = {
          username: username,
          password: hashedPassword,
        };

        // Chiama fetchApi specificando sendAuthToken = false
        const responseData = await fetchApi(
          "/api/auth/register",
          "POST",
          userData,
          {},
          false
        ); // << AGGIUNTO false ALLA FINE

        // Puoi aggiungere un controllo sulla risposta se l'API ritorna qualcosa di utile
        console.log("Registration response:", responseData);

        alert("Registration successful! Please login.");
        window.location.href = "login.html";
      } catch (error) {
        console.error("Registration failed:", error);
        alert("Registration failed: " + error.message);
        submitButton.disabled = false;
        submitButton.textContent = "Register";
      }
      // Non è necessario riabilitare il bottone qui se la registrazione ha successo,
      // perché la pagina viene reindirizzata.
    });
  }
});