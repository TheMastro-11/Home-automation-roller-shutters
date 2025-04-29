document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const usernameInput = document.getElementById("username");
      const passwordInput = document.getElementById("password");
      const submitButton = registerForm.querySelector('button[type="submit"]');

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) {
        alert("Please enter both username and password.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Registering..."; 

      try {
        if (typeof sha256 !== 'function') {
             throw new Error("Hashing function (sha256) not found.");
        }
        const hashedPassword = await sha256(password);
        const userData = {
          username: username,
          password: hashedPassword,
        };

         if (typeof fetchApi !== 'function') {
             throw new Error("API function (fetchApi) not found.");
        }
        const responseData = await fetchApi(
          "/api/auth/register",
          "POST",
          userData,
          {},
          false
        );

        console.log("Registration response:", responseData); 

        alert("Registration successful! Please login."); 
        window.location.href = "login.html"; 
      } catch (error) {
        console.error("Registration failed:", error); 
        alert("Registration failed: " + error.message); 
        submitButton.disabled = false;
        submitButton.textContent = "Register";
      }
    });
  } else {
      console.warn("Register form with ID 'registerForm' not found.");
  }
});