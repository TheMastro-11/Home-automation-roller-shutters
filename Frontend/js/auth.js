// Controlla se l'utente è autenticato (se esiste un token JWT)
// Se non lo è, reindirizza alla pagina di login.
function checkAuthentication() {
    const token = localStorage.getItem("jwt");
    if (!token) {
        console.log("No JWT found, redirecting to login.");
        window.location.href = "login.html"; // Assicurati che login.html sia nella stessa cartella o usa il path corretto
        return false; // Non autenticato
    }
     // Nota: Qui non stiamo validando la *scadenza* o la *validità* del token,
     // solo la sua presenza. Il backend rifiuterà le richieste con token scaduti/invalidi.
    return true; // Autenticato (token presente)
}

// Legge il ruolo utente dal payload del token JWT
function getUserRole() {
    const token = localStorage.getItem("jwt");
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error("Invalid JWT structure");
                // Se il token è malformato, consideralo invalido
                // localStorage.removeItem("jwt"); // Potresti rimuoverlo qui
                return null;
            }
            // Decodifica il payload (Base64Url)
            const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadDecoded);

            // Restituisce il ruolo (o come si chiama il campo nel tuo token)
            return payload.role || null;

        } catch (error) {
            console.error("Failed to parse JWT:", error);
            // Se c'è un errore nel parsing (es. token invalido), consideralo non valido
            // localStorage.removeItem("jwt"); // Potresti rimuoverlo qui
            return null;
        }
    }
    return null; // Nessun token trovato
}

// Verifica se l'utente ha il ruolo di admin
function isAdmin() {
    return getUserRole() === "admin";
}

// Esegue il logout: rimuove il token e reindirizza al login
function logout() {
    console.log("Logout function called"); // Messaggio per debug
    localStorage.removeItem("jwt");
    // Mostra un messaggio all'utente
    // alert("You have been logged out!"); // Puoi rimuovere/modificare questo alert
    console.log("JWT removed. Redirecting to login page...");
    // Reindirizza alla pagina di login
    window.location.href = "login.html";
}