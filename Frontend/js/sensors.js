
// Carica sensori (possibilmente filtrati per homeId)
async function loadLightSensors(homeId = null) { // Accetta homeId opzionale
    const sensorList = document.getElementById("light-sensors-list");
    if (!sensorList) return;
    sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";
    document.getElementById("edit-light-sensor").style.display = 'none'; // Nascondi form modifica all'inizio

    // Adatta path se necessario (verifica con backend se filtra per home o per token)
    const apiPath = homeId ? `/api/entities/home/${homeId}/lightSensors` : '/api/entities/lightSensor/';
    // Oppure const apiPath = '/api/entities/lightSensor/';

    try {
        const sensors = await fetchApi(apiPath);
        sensorList.innerHTML = ""; // Pulisci

        if (sensors && sensors.length > 0) {
             document.getElementById("light-sensors-section").style.display = 'block'; // Mostra sezione
            sensors.forEach((sensor) => {
                const li = document.createElement("li");
                // Usa classi Bootstrap per layout e allineamento
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `sensor-item-${sensor.id}`; // ID per aggiornamento
                // Mostra 'value' invece di 'opening' se l'API restituisce 'value'
                // Assumiamo per ora che l'API GET restituisca 'opening' come nell'HTML originale
                const displayValue = sensor.opening ?? sensor.value ?? 'N/A'; // Gestisci entrambi i nomi o chiedi conferma al backend

                li.innerHTML = `
                    <div>
                        <strong>${sensor.name}</strong> - Setting: ${displayValue}%
                        <br>
                        <small>Home: ${sensor.home?.name || "N/A"} (ID: ${sensor.home?.id || 'N/A'})</small>
                    </div>
                    <div class="mt-2 mt-sm-0"> {/* Margine per mobile */}
                        <button class="btn btn-sm btn-warning me-2" onclick="showEditSensorForm('${sensor.id}', '${sensor.name}', ${displayValue}, '${sensor.home?.id || ''}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLightSensor('${sensor.id}')">Delete</button>
                    </div>
                `;
                sensorList.appendChild(li);
            });
        } else {
            // Puoi decidere se nascondere l'intera sezione o solo mostrare il messaggio
            // document.getElementById("light-sensors-section").style.display = 'none';
             sensorList.innerHTML = "<li class='list-group-item'>No light sensors found.</li>";
        }
    } catch (error) {
         document.getElementById("light-sensors-section").style.display = 'block'; // Mostra sezione per vedere l'errore
        sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${error.message}</li>`;
    }
}

// Gestisce l'invio del form per aggiungere un nuovo sensore
async function createLightSensor(event) {
    event.preventDefault();
    const nameInput = document.getElementById("newSensorName");
    const openingInput = document.getElementById("newSensorOpening");
    // Prendiamo l'homeId dal campo nascosto che dovremmo popolare quando la casa utente viene caricata
    const homeIdInput = document.getElementById("newSensorHomeId");
    const addButton = event.submitter;

    const name = nameInput.value.trim();
    const opening = parseInt(openingInput.value, 10);
    // Assicurati che l'ID della casa sia disponibile (es. impostato da loadUserHomeDetails)
    const homeId = homeIdInput ? homeIdInput.value : null;


    if (!name || isNaN(opening) || !homeId) {
        alert("Please fill in name and opening, ensure home is loaded.");
        // Potrebbe mancare l'ID casa nel campo nascosto, controlla la logica in user.js
        console.error("Missing data for createLightSensor:", { name, opening, homeId });
        return;
    }
    if (opening < 0 || opening > 100) {
        alert("Opening percentage must be between 0 and 100.");
        return;
    }

    addButton.disabled = true;
    addButton.textContent = 'Adding...'

    try {
        // Verifica se il backend per POST /create si aspetta 'opening' o 'value'
        // Uso 'opening' come nel codice originale, ma potrebbe essere 'value'
        await fetchApi('/api/entities/lightSensor/create', 'POST', { name, opening: opening, home: homeId });

        alert("Light sensor created successfully!");
        // Pulisci form
        nameInput.value = "";
        openingInput.value = "";
        // Non pulire homeInput.value se serve per aggiunte multiple
        loadLightSensors(homeId); // Ricarica lista per la casa corrente
    } catch (error) {
        alert(`Error creating sensor: ${error.message}`);
    } finally {
        addButton.disabled = false;
        addButton.textContent = '+ Add Sensor';
    }
}

// Mostra e pre-compila il form per modificare un sensore
function showEditSensorForm(id, name, openingOrValue, homeId) {
    // Pre-compila i campi del form di modifica
    document.getElementById("sensorEditId").value = id;
    document.getElementById("editSensorName").value = name;
    document.getElementById("editSensorOpening").value = openingOrValue; // Usa il valore passato dalla lista
    document.getElementById("editSensorHome").value = homeId; // Mostra l'ID casa (readonly)

    // Mostra il form di modifica e nascondi quello di aggiunta (se visibile)
    document.getElementById("edit-light-sensor").style.display = "block";
    // Potresti voler nascondere il form di aggiunta qui, se necessario
    // document.querySelector('#light-sensors-section form').style.display = 'none';
}

// Nasconde il form di modifica
function cancelEditSensor() {
    document.getElementById("edit-light-sensor").style.display = "none";
    // Rendi di nuovo visibile il form di aggiunta, se lo avevi nascosto
     // document.querySelector('#light-sensors-section form').style.display = 'block'; // O come era prima
}

// Gestisce l'invio del form di modifica sensore (come da correzione precedente)
async function submitEditSensor(event) {
    event.preventDefault();
    const id = document.getElementById("sensorEditId").value;
    const nameInput = document.getElementById("editSensorName");
    const openingInput = document.getElementById("editSensorOpening");
    const homeInput = document.getElementById("editSensorHome"); // ID casa (readonly)
    const saveButton = event.submitter;

    const newName = nameInput.value.trim();
    const newOpeningStr = openingInput.value.trim();
    const newHomeId = homeInput.value.trim(); // Questo è readonly, quindi non dovrebbe cambiare, ma lo leggiamo per ricaricare

    const apiPromises = [];

    // 1. PATCH Nome (se compilato)
    if (newName) {
        apiPromises.push(
            fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName })
                .catch(err => {
                    console.error(`Failed to update sensor name (ID: ${id}):`, err);
                    throw new Error(`Failed to update name: ${err.message}`);
                })
        );
    }

    // 2. PATCH Valore/Opening (se compilato e valido)
    if (newOpeningStr) {
        const newOpeningValue = parseInt(newOpeningStr, 10);
        if (!isNaN(newOpeningValue) && newOpeningValue >= 0 && newOpeningValue <= 100) {
            // Usa l'endpoint /patch/value/ e il campo 'value'
            apiPromises.push(
                fetchApi(`/api/entities/lightSensor/patch/value/${id}`, 'PATCH', { value: newOpeningValue })
                    .catch(err => {
                        console.error(`Failed to update sensor value (ID: ${id}):`, err);
                        throw new Error(`Failed to update value/opening: ${err.message}`);
                    })
            );
        } else {
            alert("Invalid opening percentage entered (must be 0-100). Value not updated.");
        }
    }

    // 3. PATCH Home (se il campo non fosse readonly e avesse un valore)
    // Visto che nel nostro HTML è readonly, questo blocco probabilmente non verrà mai eseguito,
    // ma lo lasciamo per completezza se cambiassi idea.
    if (newHomeId && !homeInput.readOnly) {
         apiPromises.push(
             fetchApi(`/api/entities/lightSensor/patch/home/${id}`, 'PATCH', { home: newHomeId })
                 .catch(err => {
                     console.error(`Failed to update sensor home (ID: ${id}):`, err);
                     throw new Error(`Failed to update home: ${err.message}`);
                 })
         );
    }

    if (apiPromises.length === 0) {
        alert("No valid changes detected or fields were empty.");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        await Promise.all(apiPromises);
        alert("Sensor updated successfully!");
        cancelEditSensor(); // Nascondi form

        // Ricarica usando l'home ID letto dal campo (che non dovrebbe essere cambiato)
        loadLightSensors(newHomeId || null);

    } catch (error) {
        console.error("Error updating sensor:", error);
        alert(`Error updating sensor: ${error.message}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
    }
}

// Elimina un sensore
async function deleteLightSensor(id) {
    if (!confirm("Are you sure you want to delete this light sensor?")) {
        return;
    }
     // Prova a recuperare homeId dall'elemento della lista prima di eliminarlo, per ricaricare
     const listItem = document.getElementById(`sensor-item-${id}`);
     let homeId = null;
     if (listItem) {
        const smallElement = listItem.querySelector('small');
        const match = smallElement ? smallElement.textContent.match(/ID: (\S+)\)/) : null;
        homeId = match ? match[1] : null;
        if (homeId === 'N/A') homeId = null;
     }

    try {
        await fetchApi(`/api/entities/lightSensor/delete/${id}`, 'DELETE');
        alert("Sensor deleted successfully!");
        loadLightSensors(homeId); // Ricarica per la casa corrente
    } catch (error) {
        alert(`Error deleting sensor: ${error.message}`);
    }
}