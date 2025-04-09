// Carica sensori (possibilmente filtrati per homeId)
async function loadLightSensors(homeId = null) { // Accetta homeId opzionale
    const sensorList = document.getElementById("light-sensors-list");
    if (!sensorList) return;
    sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";

    // Adatta path se necessario
    const apiPath = homeId ? `/api/entities/home/${homeId}/lightSensors` : '/api/entities/lightSensor/';

    try {
        const sensors = await fetchApi(apiPath);
        sensorList.innerHTML = ""; // Pulisci

        if (sensors && sensors.length > 0) {
             document.getElementById("light-sensors-section").style.display = 'block'; // Mostra sezione
            sensors.forEach((sensor) => {
                const li = document.createElement("li");
                li.className = "list-group-item";
                li.id = `sensor-item-${sensor.id}`; // ID per aggiornamento
                li.innerHTML = `
                    <div>
                        <strong>${sensor.name}</strong> - Opening: ${sensor.opening}%
                        <br>
                        <small>Home: ${sensor.home?.name || "N/A"}</small>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-warning me-2" onclick="showEditSensorForm('${sensor.id}', '${sensor.name}', ${sensor.opening}, '${sensor.home?.id || ''}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLightSensor('${sensor.id}')">Delete</button>
                    </div>
                `;
                sensorList.appendChild(li);
            });
        } else {
            // Nascondi la sezione o mostra messaggio 'no sensors'
             document.getElementById("light-sensors-section").style.display = 'none';
             // sensorList.innerHTML = "<li class='list-group-item'>No light sensors found.</li>";
        }
    } catch (error) {
         document.getElementById("light-sensors-section").style.display = 'block'; // Mostra comunque per vedere errore
        sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${error.message}</li>`;
    }
}

async function createLightSensor(event) {
    event.preventDefault();
    const nameInput = document.getElementById("newSensorName");
    const openingInput = document.getElementById("newSensorOpening");
    const homeInput = document.getElementById("newSensorHome"); // Assumi sia l'ID della casa
    const addButton = event.submitter;

    const name = nameInput.value.trim();
    const opening = parseInt(openingInput.value, 10);
    const homeId = homeInput.value.trim(); // Questo dovrebbe essere l'ID della casa corrente

    if (!name || isNaN(opening) || !homeId) {
        alert("Please fill in all fields correctly (Name, Opening 0-100, Home ID).");
        return;
    }
    if (opening < 0 || opening > 100) {
        alert("Opening percentage must be between 0 and 100.");
        return;
    }

    addButton.disabled = true;

    try {
        await fetchApi('/api/entities/lightSensor/create', 'POST', { name, opening, home: homeId }); // Assicurati che il backend si aspetti 'home' come ID
        alert("Light sensor created successfully!");
        // Pulisci form
        nameInput.value = "";
        openingInput.value = "";
        // homeInput.value = ""; // Non pulire home ID se deve rimanere quello corrente
        loadLightSensors(homeId); // Ricarica lista per la casa corrente
    } catch (error) {
        alert(`Error creating sensor: ${error.message}`);
    } finally {
        addButton.disabled = false;
    }
}

function showEditSensorForm(id, name, opening, homeId) {
     // Pre-compila i campi del form di modifica
    document.getElementById("sensorEditId").value = id;
    document.getElementById("editSensorName").value = name;
    document.getElementById("editSensorOpening").value = opening;
    document.getElementById("editSensorHome").value = homeId; // Assumendo che home sia modificabile

    // Mostra il form di modifica e nascondi quello di aggiunta (se necessario)
    document.getElementById("edit-light-sensor").style.display = "block";
    // document.getElementById("add-sensor-form").style.display = "none"; // Se hai un ID per il form di aggiunta
}

function cancelEditSensor() {
    document.getElementById("edit-light-sensor").style.display = "none";
     // document.getElementById("add-sensor-form").style.display = "block";
}

async function submitEditSensor(event) {
    event.preventDefault();
    const id = document.getElementById("sensorEditId").value;
    const nameInput = document.getElementById("editSensorName");
    const openingInput = document.getElementById("editSensorOpening");
    const homeInput = document.getElementById("editSensorHome");
    const saveButton = event.submitter;

    const name = nameInput.value.trim();
    const openingStr = openingInput.value.trim();
    const homeId = homeInput.value.trim();

    // Costruisci l'oggetto con i dati da aggiornare
    const updateData = {};
    if (name) {
        updateData.name = name;
    }
    if (openingStr) {
        const opening = parseInt(openingStr, 10);
        if (!isNaN(opening) && opening >= 0 && opening <= 100) {
            updateData.opening = opening;
        } else {
            alert("Invalid opening percentage (must be 0-100).");
            return;
        }
    }
    if (homeId) { // Se l'home ID può essere modificato
        updateData.home = homeId;
    }

    if (Object.keys(updateData).length === 0) {
        alert("No changes detected or fields are empty.");
        return;
    }

    saveButton.disabled = true;

    try {
        // Usa una singola richiesta PATCH (preferibile) o PUT
        // Assicurati che il backend supporti PATCH a /api/entities/lightSensor/{id}
        // o PUT a /api/entities/lightSensor/put/{id}
        await fetchApi(`/api/entities/lightSensor/${id}`, 'PATCH', updateData);
        // Alternativa PUT (verifica cosa si aspetta il backend):
        // await fetchApi(`/api/entities/lightSensor/put/${id}`, 'PUT', { id, ...updateData });

        alert("Sensor updated successfully!");
        cancelEditSensor(); // Nascondi form modifica
        loadLightSensors(homeId || null); // Ricarica la lista (usa l'homeId originale se disponibile)
    } catch (error) {
        alert(`Error updating sensor: ${error.message}`);
    } finally {
        saveButton.disabled = false;
    }
}


async function deleteLightSensor(id) {
    if (!confirm("Are you sure you want to delete this light sensor?")) {
        return;
    }
     const listItem = document.getElementById(`sensor-item-${id}`);
     const homeId = listItem ? listItem.querySelector('small')?.textContent.split(': ')[1] : null; // Prova a recuperare homeId dalla UI se serve per ricaricare


    try {
        await fetchApi(`/api/entities/lightSensor/delete/${id}`, 'DELETE');
        alert("Sensor deleted successfully!");
        loadLightSensors(homeId || null); // Ricarica per la casa corrente
    } catch (error) {
        alert(`Error deleting sensor: ${error.message}`);
    }
}