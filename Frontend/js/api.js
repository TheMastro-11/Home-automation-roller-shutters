async function fetchApi(path, method = 'GET', body = null, extraHeaders = {}, sendAuthToken = true) { // Aggiunto sendAuthToken = true
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
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }
            console.error(`API Error (${response.status} ${method} ${path}):`, errorData);
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        // Per la registrazione, il backend potrebbe rispondere con testo semplice o status 201/200 vuoto
        // Invece di dare per scontato JSON, controlliamo il content-type o gestiamo l'eccezione
        try {
            const contentType = response.headers.get("content-type");
             if (contentType && contentType.indexOf("application/json") !== -1) {
                 return await response.json(); // Parse JSON solo se è JSON
             } else {
                 return await response.text(); // Altrimenti ritorna il testo (o null se vuoto)
             }
        } catch(e) {
             console.warn("Could not parse API response body", e);
             return null; // Ritorna null se il body è vuoto o non parsabile
        }


    } catch (error) {
        console.error(`Network or API call error (${method} ${path}):`, error);
        throw error;
    }
}