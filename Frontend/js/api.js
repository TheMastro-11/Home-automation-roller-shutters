// ============== js/api.js ==============

// Nota: Questo file dipende da config.js (per API_BASE_URL)
// e deve essere caricato prima degli altri file che usano fetchApi.

async function fetchApi(path, method = 'GET', body = null, extraHeaders = {}, sendAuthToken = true) { // sendAuthToken aggiunto
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders,
    };

    // Aggiungi l'header Authorization SOLO se sendAuthToken è true E un token esiste
    if (sendAuthToken) {
        const token = localStorage.getItem("jwt");
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        // Debug: Log headers for non-auth requests if needed
        // else { console.log(`WorkspaceApi to ${path} - No token found or sendAuthToken is false`); }
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (body !== null && body !== undefined) { // Invia body solo se non è null/undefined
        options.body = JSON.stringify(body);
    }

    // Debug: Log opzioni chiamata
    // console.log(`Calling fetchApi: ${method} ${API_BASE_URL}${path}`, options);

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, options);

        // Gestione errori HTTP
        if (!response.ok) {
            let errorData = { message: response.statusText || `Request failed with status ${response.status}` }; // Default message
            try {
                // Prova a leggere un messaggio di errore JSON più specifico dal backend
                const errorJson = await response.json();
                // Usa il messaggio dal JSON se presente, altrimenti mantieni statusText
                if (errorJson && errorJson.message) {
                     errorData = errorJson; // Usa l'intero oggetto errore se ha una struttura definita
                     errorData.message = errorJson.message; // Assicura che message sia presente
                } else if (errorJson && errorJson.error) { // A volte l'errore è in 'error'
                     errorData.message = errorJson.error;
                }
                // Aggiungi status e path per contesto se non già presenti
                if (!errorData.status) errorData.status = response.status;
                if (!errorData.path) errorData.path = path;

            } catch (e) {
                // Se il corpo dell'errore non è JSON, va bene, usiamo statusText
                 console.log("Response error body was not JSON.");
            }
            console.error(`API Error (${response.status} ${method} ${path}):`, errorData);
            // Crea un errore che contenga più dettagli possibili
            const error = new Error(errorData.message);
            error.status = response.status;
            error.details = errorData; // Allega dettagli extra
            throw error; // Lancia l'errore per interrompere l'esecuzione nel blocco chiamante
        }

        // Gestione risposte senza contenuto (es. 204 No Content per DELETE)
        if (response.status === 204) {
            return null;
        }

        // Gestione risposte con contenuto (JSON o testo)
        try {
            const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") !== -1) {
                 return await response.json(); // Parse JSON
             } else {
                 const textResponse = await response.text(); // Ottieni come testo
                 // Se il testo è vuoto ma la risposta era OK (es. 200/201), ritorna null o un indicatore di successo
                 if (response.ok && !textResponse) {
                     return { success: true }; // O semplicemente null
                 }
                 return textResponse; // Altrimenti ritorna il testo
             }
        } catch(e) {
             console.warn(`Could not parse API response body for ${method} ${path}:`, e);
             // Se il parsing fallisce ma la risposta era OK, ritorna un indicatore di successo
             if (response.ok) {
                 return { success: true, message: "Response OK but body parsing failed." };
             }
             return null; // Altrimenti null
        }

    } catch (error) {
        // Cattura sia errori di rete/fetch sia errori lanciati da !response.ok
        console.error(`Network or API call error (${method} ${path}):`, error);
        // Rilancia l'errore per poterlo gestire nel chiamante (es. con alert)
        // Assicurati che il messaggio sia utile
        throw new Error(error.message || "Network error or failed API call.");
    }
}