// L'URL base dell'API potrebbe essere configurato tramite variabili d'ambiente
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"; //

export async function sha256(message) {
  // Implementazione SHA-256 come nel file originale
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function fetchApi(path, method = 'GET', body = null, extraHeaders = {}, sendAuthToken = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (sendAuthToken) { //
    const token = localStorage.getItem("jwt"); //
    if (token) {
      headers['Authorization'] = 'Bearer ' + token; //
    } else {
      // In React, potresti voler gestire il caso di token mancante in modo diverso,
      // ad esempio reindirizzando al login tramite il routing.
      console.warn(`Chiamata API a ${path} - Token non trovato.`);
    }
  }

  const options = {
    method: method,
    headers: headers,
  };

  if (body !== null && body !== undefined) { //
    options.body = JSON.stringify(body); //
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options); //

    if (!response.ok) { //
      let errorData = { message: `Richiesta fallita con stato ${response.status}` }; //
       try {
         const errorJson = await response.json(); //
         if (errorJson && (errorJson.message || errorJson.error)) { //
           errorData.message = errorJson.message || errorJson.error; //
         }
       } catch (e) { /* Ignora se il corpo dell'errore non è JSON */ } //

      const error = new Error(errorData.message);
      error.status = response.status; //
      throw error; //
    }

    if (response.status === 204) { //
      return null; // Gestisce risposte No Content
    }

    // Prova a parsare come JSON, altrimenti ritorna testo
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) { //
        try {
            return await response.json();
        } catch (e) {
            console.warn(`Impossibile fare il parse della risposta JSON da ${method} ${path} ma la risposta era OK.`, e);
             return { success: true, message: "Risposta OK ma il parse del corpo JSON è fallito." };
        }
    } else {
        const textResponse = await response.text(); //
         if (response.ok && !textResponse) {
             return { success: true }; // O semplicemente null per risposte OK vuote
         }
         return textResponse; // Ritorna come testo
    }

  } catch (error) { //
    console.error(`Errore di rete o chiamata API (${method} ${path}):`, error); //
    // Rilancia l'errore per permettere al chiamante di gestirlo (es. mostrare un messaggio all'utente)
    throw error; //
  }
}