function getUserRole() {
    const token = localStorage.getItem("jwt");
    if (token) {
        try {
            // Separa il token in parti (header, payload, signature)
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error("Invalid JWT structure");
            }
            // Decodifica la parte del payload (è la seconda parte, indice 1)
            const payload = JSON.parse(atob(parts[1]));
            // Restituisce il ruolo o null se non presente
            return payload.role || null;
        } catch (error) {
            console.error("Failed to parse JWT:", error);
            // Se il token non è valido o malformato, rimuovilo
            localStorage.removeItem("jwt");
            return null;
        }
    }
    return null;
}

function isAdmin() {
    return getUserRole() === "admin";
}

function logout() {
    console.log("Logout function called"); // Aggiungi per debug
    localStorage.removeItem("jwt");       // Rimuove il token
    alert("You have been logged out!");   // Mostra messaggio (puoi rimuoverlo se vuoi)
    window.location.href = "login.html";  // Reindirizza alla pagina di login
}
function checkAuthentication() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        console.log("No JWT found, redirecting to login.");
        window.location.href = "login.html";
        return false; // Indica che l'utente non è autenticato
    }
     // Potresti aggiungere qui un controllo sulla scadenza del token se necessario
    return true; // Utente autenticato
}