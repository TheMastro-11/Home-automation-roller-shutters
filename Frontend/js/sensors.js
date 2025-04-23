
// Carica sensori (possibilmente filtrati per homeId)
async function loadLightSensors(homeId = null) {
    const sensorList = document.getElementById("light-sensors-list");
    if (!sensorList) return;
    sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";
    document.getElementById("edit-light-sensor").style.display = 'none';

    // Usa SEMPRE il path base corretto
    const apiPath = '/api/entities/lightSensor/';

    // !!! NOTA: Filtro per homeId NON implementato !!!
    // Verranno caricati i sensori accessibili dall'utente/token.
    // Se serve filtro specifico per homeId, chiedere al backend come fare.
     if (homeId) {
         console.warn(`Filtering sensors by homeId (${homeId}) is NOT YET IMPLEMENTED pending backend API details. Loading all accessible sensors from ${apiPath}`);
         // Eventuale logica filtro: apiPath = `/api/entities/lightSensor/?homeId=${homeId}`;
    }

    try {
        const sensors = await fetchApi(apiPath);
        sensorList.innerHTML = "";

        if (sensors && sensors.length > 0) {
             document.getElementById("light-sensors-section").style.display = 'block';
            sensors.forEach((sensor) => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `sensor-item-${sensor.id}`;
                // Prova a visualizzare 'value' o 'opening'
                const displayValue = sensor.value ?? sensor.opening ?? 'N/A'; // Usa 'value' se esiste, altrimenti 'opening'

                li.innerHTML = `
                    <div>
                        <strong>${sensor.name}</strong> - Value: ${displayValue}%
                        <br>
                        <small>Home: ${sensor.home?.name || "N/A"} (ID: ${sensor.home?.id || 'N/A'})</small>
                    </div>
                    <div class="mt-2 mt-sm-0">
                        <button class="btn btn-sm btn-warning me-2" onclick="showEditSensorForm('${sensor.id}', '${sensor.name}', ${displayValue}, '${sensor.home?.id || ''}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLightSensor('${sensor.id}')">Delete</button>
                    </div>
                `;
                sensorList.appendChild(li);
            });
        } else {
            sensorList.innerHTML = "<li class='list-group-item'>No light sensors found.</li>";
             document.getElementById("light-sensors-section").style.display = 'block'; // Mostra comunque sezione per aggiungere? O nascondi?
        }
    } catch (error) {
         document.getElementById("light-sensors-section").style.display = 'block';
        sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${error.message}</li>`;
    }
}

// Gestisce l'invio del form per aggiungere un nuovo sensore
async function createLightSensor(event) {
    event.preventDefault();
    const nameInput = document.getElementById("newSensorName");
    const homeIdInput = document.getElementById("newSensorHomeId"); // Prendiamo homeId da qui
    const addButton = event.submitter;

    const name = nameInput.value.trim();
    const homeId = homeIdInput ? homeIdInput.value : null; // Assicura che homeId sia disponibile

    // Rimosso controllo e lettura per 'opening'

    if (!name || !homeId) { // Ora controlla solo nome e homeId
        alert("Please enter name, ensure home is loaded.");
        console.error("Missing data for createLightSensor:", { name, homeId });
        return;
    }

    addButton.disabled = true;
    addButton.textContent = 'Adding...'

    try {
        // Invia solo name e home (assicurati che il backend si aspetti 'home' come ID)
        await fetchApi('/api/entities/lightSensor/create', 'POST', { name: name, home: homeId });

        alert("Light sensor created successfully!");
        nameInput.value = ""; // Pulisci solo nome
        loadLightSensors(homeId); // Ricarica lista

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

// Gestisce l'invio del form di modifica sensore 

async function submitEditSensor(event) {
    event.preventDefault();
    const id = document.getElementById("sensorEditId").value;
    const nameInput = document.getElementById("editSensorName");
    const openingInput = document.getElementById("editSensorOpening");
    const homeInput = document.getElementById("editSensorHome"); // Leggiamo ancora per ricaricare la lista
    const saveButton = event.submitter;

    // Recupera i NUOVI valori inseriti nel form di modifica
    const newName = nameInput.value.trim();
    const newOpeningStr = openingInput.value.trim();
    // Non serve più leggere newHomeId ai fini dell'aggiornamento PATCH

    // Array per contenere le promesse delle chiamate API necessarie
    const apiPromises = [];

    // 1. Prepara la chiamata PATCH per il NOME (se modificato)
    if (newName) {
        apiPromises.push(
            fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName })
                .catch(err => {
                    console.error(`Failed to update sensor name (ID: ${id}):`, err);
                    throw new Error(`Failed to update name: ${err.message}`);
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
        }
    }

    // 3. PARTE RIMOSSA: Non prepariamo più la chiamata PATCH per la HOME
    //    perché l'endpoint API /patch/home/{id} per i sensori non è più listato.

    // Controlla se ci sono effettivamente modifiche da inviare
    if (apiPromises.length === 0) {
        alert("No valid changes detected or fields were empty.");
        return;
    }

    // Disabilita il pulsante mentre le chiamate sono in corso
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        // Esegui tutte le chiamate PATCH necessarie in parallelo
        await Promise.all(apiPromises);

        alert("Sensor updated successfully!");
        cancelEditSensor(); // Nascondi il form di modifica

        // Ricarica la lista dei sensori usando l'homeId letto dal campo (che è readonly)
        const currentHomeId = homeInput.value;
        loadLightSensors(currentHomeId || null);

    } catch (error) {
        console.error("Error updating sensor:", error);
        alert(`Error updating sensor: ${error.message}`);
    } finally {
        // Riabilita il pulsante in ogni caso
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