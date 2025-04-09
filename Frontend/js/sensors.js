
async function submitEditSensor(event) {
    event.preventDefault();
    const id = document.getElementById("sensorEditId").value;
    const nameInput = document.getElementById("editSensorName");
    const openingInput = document.getElementById("editSensorOpening");
    const homeInput = document.getElementById("editSensorHome"); // Assumiamo sia l'ID casa
    const saveButton = event.submitter;

    // Recupera i NUOVI valori inseriti nel form di modifica
    const newName = nameInput.value.trim();
    const newOpeningStr = openingInput.value.trim();
    const newHomeId = homeInput.value.trim(); // Assumendo che l'ID casa sia modificabile

    // Array per contenere le promesse delle chiamate API necessarie
    const apiPromises = [];

    // 1. Prepara la chiamata PATCH per il NOME (se modificato)
    //    Consideriamo un campo compilato come un tentativo di modifica.
    //    Potresti voler aggiungere un confronto con il valore originale se necessario.
    if (newName) {
        apiPromises.push(
            fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName })
                .catch(err => { // Gestisci errore specifico per questo campo se vuoi
                    console.error(`Failed to update sensor name (ID: ${id}):`, err);
                    throw new Error(`Failed to update name: ${err.message}`); // Rilancia per Promise.all
                })
        );
    }

    // 2. Prepara la chiamata PATCH per il VALORE/OPENING (se modificato)
    if (newOpeningStr) {
        const newOpeningValue = parseInt(newOpeningStr, 10);
        if (!isNaN(newOpeningValue) && newOpeningValue >= 0 && newOpeningValue <= 100) {
            // Usa l'endpoint /patch/value/ e il campo 'value' come da API
            apiPromises.push(
                fetchApi(`/api/entities/lightSensor/patch/value/${id}`, 'PATCH', { value: newOpeningValue })
                    .catch(err => {
                        console.error(`Failed to update sensor value (ID: ${id}):`, err);
                        throw new Error(`Failed to update value/opening: ${err.message}`);
                    })
            );
        } else {
            alert("Invalid opening percentage entered (must be 0-100). Value not updated.");
            // Non blocchiamo le altre modifiche, ma non aggiungiamo questa promise
        }
    }

    // 3. Prepara la chiamata PATCH per la HOME (se modificato e permesso)
    //    Se l'input 'editSensorHome' non è readonly e l'utente inserisce un ID valido
    if (newHomeId && !homeInput.readOnly) { // Controlla anche se il campo è editabile
         apiPromises.push(
             fetchApi(`/api/entities/lightSensor/patch/home/${id}`, 'PATCH', { home: newHomeId }) // Assumendo che il backend si aspetti { home: "id_casa" }
                 .catch(err => {
                     console.error(`Failed to update sensor home (ID: ${id}):`, err);
                     throw new Error(`Failed to update home: ${err.message}`);
                 })
         );
    }

    // Controlla se ci sono effettivamente modifiche da inviare
    if (apiPromises.length === 0) {
        alert("No valid changes detected or fields were empty.");
        return; // Non fare nulla se non ci sono chiamate da fare
    }

    // Disabilita il pulsante mentre le chiamate sono in corso
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        // Esegui tutte le chiamate PATCH necessarie in parallelo
        await Promise.all(apiPromises);

        alert("Sensor updated successfully!");
        cancelEditSensor(); // Nascondi il form di modifica

        // Ricarica la lista dei sensori (potrebbe servire l'ID della casa
        // a cui apparteneva il sensore se l'API GET filtra per casa)
        // Prova a recuperare l'homeId dal campo (anche se readonly) per ricaricare correttamente
        const currentHomeId = document.getElementById("editSensorHome").value;
        loadLightSensors(currentHomeId || null);

    } catch (error) {
        // Promise.all fallisce se anche una sola delle chiamate fallisce
        // L'errore catturato qui sarà il primo che si è verificato
        console.error("Error updating sensor:", error);
        alert(`Error updating sensor: ${error.message}`);
    } finally {
        // Riabilita il pulsante in ogni caso
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}