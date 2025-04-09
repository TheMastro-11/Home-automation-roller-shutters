async function fetchApi(path, method = 'GET', body = null, extraHeaders = {}) {
    const token = localStorage.getItem("jwt");
    const headers = {
        'Content-Type': 'application/json',
        ...extraHeaders, // Permette di aggiungere altri header se necessario
    };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    const options = {
        method: method,
        headers: headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, options);

        // Gestiamo subito gli errori HTTP più comuni
        if (!response.ok) {
            let errorData;
            try {
                // Prova a leggere un messaggio di errore JSON dal backend
                errorData = await response.json();
            } catch (e) {
                // Altrimenti usa il testo di stato HTTP
                errorData = { message: response.statusText };
            }
            console.error(`API Error (${response.status} ${method} ${path}):`, errorData);
            // Lancia un errore per interrompere l'esecuzione nel blocco chiamante
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        // Se la risposta non ha contenuto (es. DELETE, o 204 No Content)
        if (response.status === 204) {
            return null; // O un valore che indichi successo senza dati
        }

        // Altrimenti, prova a parsare il JSON
        return await response.json();

    } catch (error) {
        console.error(`Network or API call error (${method} ${path}):`, error);
        // Rilancia l'errore per poterlo gestire nel chiamante (es. con alert)
        throw error;
    }
}