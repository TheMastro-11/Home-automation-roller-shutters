document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault(); // Prevent standard form submission

      const usernameInput = document.getElementById("username");
      const passwordInput = document.getElementById("password");
      const submitButton = registerForm.querySelector('button[type="submit"]');

      const username = usernameInput.value.trim();
      const password = passwordInput.value; // Do not trim password

      if (!username || !password) {
        alert("Please enter both username and password.");
        return;
      }

      submitButton.disabled = true; // Disable button during submission
      submitButton.textContent = "Registering..."; // Visual feedback

      try {
        // Ensure sha256 function is available (expected from auth.js)
        if (typeof sha256 !== 'function') {
             throw new Error("Hashing function (sha256) not found.");
        }
        const hashedPassword = await sha256(password);
        const userData = {
          username: username,
          password: hashedPassword,
        };

        // Ensure fetchApi function is available (expected from auth.js)
         if (typeof fetchApi !== 'function') {
             throw new Error("API function (fetchApi) not found.");
        }
        // Call fetchApi specifying sendAuthToken = false for registration
        const responseData = await fetchApi(
          "/api/auth/register",
          "POST",
          userData,
          {},
          false // Do not send auth token for registration
        ); //

        // Optional: Check responseData if the API returns useful info on success
        console.log("Registration response:", responseData); //

        alert("Registration successful! Please login."); //
        window.location.href = "login.html"; // Redirect to login page
      } catch (error) {
        console.error("Registration failed:", error); //
        // Display the specific error message from fetchApi or the catch block
        alert("Registration failed: " + error.message); //
        submitButton.disabled = false; // Re-enable button on failure
        submitButton.textContent = "Register";
      }
      // No need to re-enable button here if registration succeeds,
      // because the page redirects.
    });
  } else {
      console.warn("Register form with ID 'registerForm' not found.");
  }
});