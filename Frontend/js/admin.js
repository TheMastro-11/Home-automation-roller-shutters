// ========================================
// admin.js
// ========================================

// Carica la lista delle case per l'admin e imposta la vista iniziale
async function loadAdminHomes() {
    const homeList = document.getElementById("admin-homes-list");
    if (!homeList) {
        console.error("Element '#admin-homes-list' not found.");
        return;
    }
    homeList.innerHTML = "<li class='list-group-item'>Loading homes...</li>";

    // --- BLOCCO CORRETTO PER VISIBILITÀ INIZIALE ---
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "block";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "block";
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if (globalAddSensorEl) globalAddSensorEl.style.display = 'block';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if (globalAddShutterEl) globalAddShutterEl.style.display = 'block';
    const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = "none";
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (sensorSectionEl) sensorSectionEl.style.display = "none";
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (shutterSectionEl) shutterSectionEl.style.display = "none";
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = "block"; // Nota: impostato a block come nel tuo codice

    // Resetta titolo/lista routine
    const routineTitle = document.getElementById("Routines-section-title"); if (routineTitle) routineTitle.innerText = "Routines";
    const routineList = document.getElementById("Routines-list"); if (routineList) routineList.innerHTML = "<li class='list-group-item ...'></li>";
    // --- FINE BLOCCO CORRETTO ---

    // Il resto della funzione try...catch continua qui sotto...

    try {
        const homes = await fetchApi("/api/entities/home/");
        homeList.innerHTML = "";

        if (homes && Array.isArray(homes) && homes.length > 0) {
            homes.forEach((home) => {
                if (!home || !home.id) return;
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                const homeIdStr = String(home.id);
                const homeNameStr = String(home.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                li.innerHTML = `
                    <span>${home.name || 'Unnamed Home'}</span>
                    <div class="btn-group btn-group-sm admin-home-actions" role="group" aria-label="Azioni Casa">
                        <button type="button" class="btn btn-warning" onclick="showEditHomeForm('${homeIdStr}', '${homeNameStr}')">Edit</button>
                        <button type="button" class="btn btn-danger" onclick="deleteHome('${homeIdStr}')">Delete</button>
                        <button type="button" class="btn btn-success" onclick="showSensorsForHome('${homeIdStr}', '${homeNameStr}')">Sensors</button>
                        <button type="button" class="btn btn-primary" onclick="showShuttersForHome('${homeIdStr}', '${homeNameStr}')">Shutters</button>
                    </div>
                `;
                homeList.appendChild(li);
            });
        } else {
            homeList.innerHTML = "<li class='list-group-item'>No homes found.</li>";
        }
    } catch (error) {
        console.error("Error loading admin homes:", error);
        homeList.innerHTML = `<li class='list-group-item text-danger'>Error loading homes: ${error.message}</li>`;
    }
}

// Aggiunge una nuova casa
async function addHome(event) {
    event.preventDefault();
    const homeNameInput = document.getElementById("newHomeName");
    const homeName = homeNameInput.value.trim();
    const spinner = document.getElementById("loadingSpinner");
    const addButton = event.submitter;

    if (!homeName) { alert("Please enter a home name."); return; }
    const spinnerEl = document.getElementById("loadingSpinner"); if (spinnerEl) spinnerEl.style.display = "block";
    if (addButton) addButton.disabled = true;

    try {
        await fetchApi("/api/entities/home/create", "POST", { name: homeName });
        alert("Home added successfully!");
        homeNameInput.value = "";
        loadAdminHomes();
    } catch (error) {
        console.error("Error adding home:", error);
        alert(`Failed to add home: ${error.message}`);
    } finally {
        if (spinnerEl) spinnerEl.style.display = "none";
        if (addButton) addButton.disabled = false;
    }
}

// ========================================
// FUNZIONI PER FORM "EDIT HOME DETAILS"
// ========================================

// Carica la lista di utenti e popola un elemento <select> (USA ID COME VALUE)
async function loadUsersForOwnerSelect(selectElementId, currentOwnerId) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
    selectElement.innerHTML = '<option value="" selected disabled>Loading users...</option>';

    try {
        const users = await fetchApi('/api/users/');
        selectElement.innerHTML = ''; // Pulisci

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "-- Select Owner --";
        selectElement.appendChild(defaultOption);

        if (users && Array.isArray(users) && users.length > 0) {
            users.forEach(user => {
                if (user && user.id && user.username) {
                    const option = document.createElement('option');
                    option.value = user.id; // <-- USA ID COME VALUE
                    option.textContent = user.username;
                    if (currentOwnerId && String(user.id) === String(currentOwnerId)) {
                        option.selected = true;
                    }
                    selectElement.appendChild(option);
                }
            });
        } else { console.log("No users found from API."); }
    } catch (error) {
        console.error(`Error loading users into select #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="" selected disabled>Error loading users!</option>`;
    }
}

// Carica i sensori disponibili e popola la select (USA NOME COME VALUE)
async function loadAvailableSensorsForEditHome(selectElementId, currentSensorName) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
    selectElement.innerHTML = '<option value="" selected disabled>Loading sensors...</option>';

    try {
        const sensors = await fetchApi('/api/entities/lightSensor/');
        selectElement.innerHTML = ''; // Pulisci

        const noneOption = document.createElement('option');
        noneOption.value = "NONE";
        noneOption.textContent = "-- None --";
        selectElement.appendChild(noneOption);

        if (sensors && Array.isArray(sensors) && sensors.length > 0) {
            sensors.forEach(sensor => {
                if (sensor && sensor.id && sensor.name) {
                    const option = document.createElement('option');
                    option.value = sensor.name; // <-- USA NOME COME VALUE
                    option.textContent = sensor.name;
                    if (currentSensorName && sensor.name === currentSensorName) {
                        option.selected = true;
                        noneOption.selected = false;
                    }
                    selectElement.appendChild(option);
                }
            });
            if (!currentSensorName) { selectElement.value = "NONE"; }
        } else {
            console.log("No available light sensors found.");
            selectElement.value = "NONE";
        }
    } catch (error) {
        console.error(`Error loading sensors into select #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="" selected disabled>Error!</option>`;
        const noneOptionErr = document.createElement('option');
        noneOptionErr.value = "NONE"; noneOptionErr.textContent = "-- None --";
        selectElement.appendChild(noneOptionErr);
    }
}

// Carica tapparelle disponibili e popola checkbox (USA NOME COME VALUE)
async function loadAvailableShuttersForEditHome(containerElementId, originalShutterNames = []) {
    const container = document.getElementById(containerElementId);
    const loadingMsg = document.getElementById("editHomeShuttersLoading");
    if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }
    if (loadingMsg) loadingMsg.textContent = "Loading..."; else container.innerHTML = "";
    const apiPath = '/api/entities/rollerShutter/'; // Ipotesi API
    if (!loadingMsg) { container.innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading...</p>'; }

    try {
        const allShutters = await fetchApi(apiPath);
        document.getElementById("editHomeShuttersLoading")?.remove(); container.innerHTML = '';

        if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
            const originalNamesSet = new Set(originalShutterNames);
            allShutters.forEach(shutter => {
                if (shutter && shutter.id && shutter.name) {
                    const div = document.createElement('div'); div.className = 'form-check';
                    const isChecked = originalNamesSet.has(shutter.name);
                    const checkId = `edit_shutter_check_${shutter.id}`;
                    const safeName = shutter.name.replace(/"/g, '&quot;');
                    div.innerHTML = `<input class="form-check-input" type="checkbox" value="${safeName}" id="${checkId}" ${isChecked ? 'checked' : ''}><label class="form-check-label" for="${checkId}">${shutter.name}</label>`;
                    container.appendChild(div);
                }
            });
        } else { container.innerHTML = '<p style="color: #ccc;">No shutters found.</p>'; }
    } catch (error) {
        console.error("Error loading shutters for Edit Home form:", error);
        document.getElementById("editHomeShuttersLoading")?.remove();
        container.innerHTML = '<p class="text-danger">Error loading shutters.</p>';
    }
}

// Mostra il form per modificare i dettagli di una casa
async function showEditHomeForm(homeId, homeName) {
    console.log(`Showing edit form for Home ID: ${homeId}`);
    // Nascondi altre sezioni admin...
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "none";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (sensorSectionEl) sensorSectionEl.style.display = 'none';
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if (globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if (globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Trova il DIV contenitore E il FORM interno
    const editHomeDiv = document.getElementById("edit-home-form"); if (!editHomeDiv) return;
    const editHomeInnerForm = editHomeDiv.querySelector('form'); // <-- Trova il form interno
    if (!editHomeInnerForm) { console.error("Inner form not found in #edit-home-form"); return; }

    // Popola campi base
    document.getElementById("editHomeId").value = homeId;
    document.getElementById("editHomeName").value = homeName;

    // Mostra il DIV contenitore
    editHomeDiv.style.display = "block";

    // Reset/Loading state
    document.getElementById("editHomeOwnerSelect").innerHTML = '<option>Loading...</option>';
    document.getElementById("editHomeShuttersList").innerHTML = '<p id="editHomeShuttersLoading">Loading...</p>';
    document.getElementById("editHomeSensorSelect").innerHTML = '<option>Loading...</option><option value="NONE">-- None --</option>';

    // Carica dettagli casa attuale
    let currentOwnerId = null; let currentOwnerUsername = null;
    let originalShutterNames = []; let currentSensorName = null;
    try {
        const allHomes = await fetchApi('/api/entities/home/'); let homeDetails = null;
        if (allHomes && Array.isArray(allHomes)) { homeDetails = allHomes.find(h => h?.id == homeId); }
        if (homeDetails) {
            currentOwnerId = homeDetails.owner?.id || null; currentOwnerUsername = homeDetails.owner?.username || null;
            currentSensorName = homeDetails.lightSensor?.name || null;
            originalShutterNames = homeDetails.rollerShutters?.map(rs => rs.name).filter(n => n != null) || [];

            // --- CORREZIONE: Memorizza valori originali sul FORM INTERNO ---
            editHomeInnerForm.dataset.originalName = homeName;
            editHomeInnerForm.dataset.originalOwnerId = currentOwnerId || "";
            editHomeInnerForm.dataset.originalSensor = currentSensorName || "NONE";
            editHomeInnerForm.dataset.originalShutters = JSON.stringify(originalShutterNames.sort());
            // ---------------------------------------------------------------
            console.log("Stored Original Data on form:", editHomeInnerForm.dataset);

        } else { console.error(`Home details for ID ${homeId} not found.`); }
    } catch (error) { console.error(`Failed to fetch home details for ID ${homeId}:`, error); }

    // Popola i campi dinamici
    loadUsersForOwnerSelect('editHomeOwnerSelect', currentOwnerId);
    loadAvailableSensorsForEditHome('editHomeSensorSelect', currentSensorName);
    loadAvailableShuttersForEditHome('editHomeShuttersList', originalShutterNames);
}

// Annulla la modifica della casa e torna alla lista
function cancelEditHome() {
    const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = "none";
    loadAdminHomes(); // Ricarica la vista principale admin
}

// Salva le modifiche della casa (con Change Detection e Skip Null/Empty)
async function submitEditHome(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById("editHomeId").value; // Home ID
    const saveButton = event.submitter;

    // Leggi valori ORIGINALI
    const originalName = form.dataset.originalName || '';
    const originalOwnerId = form.dataset.originalOwnerId || ''; // Legge ID originale
    const originalSensorName = form.dataset.originalSensor || 'NONE';
    const originalShuttersJson = form.dataset.originalShutters || '[]';
    console.log("Comparing against Original:", { name: originalName, ownerId: originalOwnerId, sensorName: originalSensorName, shuttersJson: originalShuttersJson });

    // Leggi valori NUOVI
    const newName = document.getElementById("editHomeName").value.trim();
    const selectedOwnerId = document.getElementById("editHomeOwnerSelect").value; // Legge l'ID o ""
    const selectedSensorName = document.getElementById("editHomeSensorSelect").value; // Legge NOME o "NONE"
    const selectedShutterCheckboxes = document.querySelectorAll('#editHomeShuttersList input[type="checkbox"]:checked');
    const selectedShutterNames = Array.from(selectedShutterCheckboxes).map(cb => cb.value).sort();
    const selectedShuttersJson = JSON.stringify(selectedShutterNames);
    console.log("New Values:", { name: newName, ownerId: selectedOwnerId, sensorName: selectedSensorName, shuttersJson: selectedShuttersJson });


    // Dopo aver preparato newName, selectedOwnerId, selectedSensorName...
    if (!newName) { alert("Please enter home name."); return; }
    if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

    const apiCalls = [];
    const callsInfo = [];

    // 1. Name patch
    if (newName !== originalName) {
        callsInfo.push({ path: `/patch/name/${id}`, payload: { name: newName } });
        apiCalls.push(fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName }));
    }

    // 2. Owner patch (solo se cambia e non vuoto)
    if (selectedOwnerId !== originalOwnerId && selectedOwnerId) {
        const selectedUsername = document.getElementById("editHomeOwnerSelect")
            .selectedOptions[0].text;
        callsInfo.push({ path: `/patch/owner/${id}`, payload: { user: { username: selectedUsername } } });
        apiCalls.push(fetchApi(`/api/entities/home/patch/owner/${id}`, "PATCH", { user: { username: selectedUsername } }));
    }

    // 3. Sensor patch (ora fuori dall’if owner!)
    if (selectedSensorName !== originalSensorName && selectedSensorName !== "NONE") {
        callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: { name: selectedSensorName } } });
        apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: { name: selectedSensorName } }));
    }

    // 4. Shutters patch (stessa cosa)
    if (selectedShuttersJson !== originalShuttersJson && selectedShutterNames.length > 0) {
        const payload = { rollerShutters: selectedShutterNames.map(n => ({ name: n })) };
        callsInfo.push({ path: `/patch/rollerShutters/${id}`, payload });
        apiCalls.push(fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, "PATCH", payload));
    }

    // Se non ci sono chiamate
    if (apiCalls.length === 0) {
        alert("No changes detected.");
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
        return;
    }

    // Esegui tutte le patch
    try {
        console.log(`Executing ${apiCalls.length} calls:`, callsInfo);
        await Promise.all(apiCalls);
        alert("Home details updated successfully!");
        cancelEditHome();
        loadAdminHomes();
    } catch (error) {
        console.error(error);
        alert(`Failed to update: ${error.message}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }

}


// Elimina una casa
async function deleteHome(homeId) {
    if (!confirm("Are you sure you want to delete this home? This action might also delete associated devices and routines depending on backend logic.")) { return; }
    try {
        await fetchApi(`/api/entities/home/delete/${homeId}`, "DELETE");
        alert("Home deleted successfully!");
        loadAdminHomes();
    } catch (error) {
        console.error("Error deleting home:", error);
        alert(`Failed to delete home: ${error.message}`);
    }
}

// ========================================
// GESTIONE ROUTINE (Solo Navigazione da Admin)
// ========================================

function showAllRoutinesView() {
    console.log("Showing All Routines view");
    // Nascondi altre sezioni admin...
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "none";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
    const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (sensorSectionEl) sensorSectionEl.style.display = 'none';
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if (globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if (globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Mostra sezione routine
    const routinesSectionEl = document.getElementById("Routines-section");
    if (!routinesSectionEl) { console.error("#Routines-section not found!"); return; }
    routinesSectionEl.style.display = 'block';

    // Imposta titolo generico
    const routineTitleEl = document.getElementById("Routines-section-title");
    if (routineTitleEl) routineTitleEl.innerText = `All Routines`;

    loadRoutines();

}

// ========================================
// GESTIONE SENSORI (Admin - Per Casa Specifica)
// ========================================

// Mostra la sezione gestione sensori per una casa specifica
function showSensorsForHome(homeId, homeName) {
    console.log(`Showing sensors for Home ID: ${homeId}, Name: ${homeName}`);
    // Nascondi altre sezioni admin...
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "none";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
    const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if (globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if (globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Mostra la sezione gestione sensori
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (!sensorSectionEl) return; sensorSectionEl.style.display = 'block';

    // Imposta titolo e ID nascosto (per Edit/Delete)
    const titleElement = document.getElementById("admin-sensor-home-title"); if (titleElement) titleElement.textContent = `Sensors for: ${homeName}`;
    const sensorHomeIdHidden = document.getElementById("admin-sensor-home-id"); if (sensorHomeIdHidden) sensorHomeIdHidden.value = homeId;

    // Nascondi form modifica se era aperto
    const adminEditSensorFormEl = document.getElementById("admin-edit-light-sensor"); if (adminEditSensorFormEl) adminEditSensorFormEl.style.display = 'none';

    // Chiama funzione per caricare i sensori
    adminLoadLightSensors(homeId);
}

// Nasconde la sezione sensori e torna alla lista case admin
function hideSensorsForHome() {
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (sensorSectionEl) sensorSectionEl.style.display = 'none';
    loadAdminHomes(); // Ricarica la vista principale
}

// Nasconde il form di modifica sensore admin
function cancelAdminEditSensor() {
    const adminEditSensorFormEl = document.getElementById("admin-edit-light-sensor"); if (adminEditSensorFormEl) adminEditSensorFormEl.style.display = "none";
}

// In js/admin.js (SOSTITUISCI QUESTA FUNZIONE)

// Carica e visualizza il sensore ASSOCIATO a una specifica casa (Admin - con bottoni)
async function adminLoadLightSensors(homeId) {
    const sensorList = document.getElementById("admin-sensor-list");
    sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";

    try {
        // 1) prova a filtrare direttamente dal server
        let sensors = [];
        try {
            sensors = await fetchApi(`/api/entities/lightSensor/?homeId=${homeId}`);
        } catch {
            // fallback: prendi tutti e filtra client-side
            const all = await fetchApi('/api/entities/lightSensor/');
            sensors = all.filter(s => s.home?.id == homeId);
        }

        sensorList.innerHTML = "";

        if (sensors.length > 0) {
            sensors.forEach(sensor => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `admin-sensor-item-${sensor.id}`;
                const value = sensor.value ?? sensor.lightValue ?? 'N/A';
                li.innerHTML = `
                  <div><strong>${sensor.name}</strong> — Value: ${value}%</div>
                  <div>
                    <button class="btn btn-sm btn-warning me-2"
                      onclick="adminShowEditSensorForm('${sensor.id}','${sensor.name}',${value})">
                      Edit
                    </button>
                    <button class="btn btn-sm btn-danger"
                      onclick="adminDeleteLightSensor('${sensor.id}','${homeId}')">
                      Delete
                    </button>
                  </div>`;
                sensorList.appendChild(li);
            });
        } else {
            sensorList.innerHTML = "<li class='list-group-item'>No sensors associated to this home.</li>";
        }

    } catch (err) {
        console.error("Error loading sensors for home:", err);
        sensorList.innerHTML = `<li class='list-group-item text-danger'>Error: ${err.message}</li>`;
    }
}


// Mostra il form di modifica specifico per admin
function adminShowEditSensorForm(id, name, currentValue) {
    document.getElementById("admin-sensorEditId").value = id;
    document.getElementById("admin-editSensorName").value = name;
    document.getElementById("admin-editSensorValue").value = currentValue !== null ? currentValue : "";
    const adminEditFormEl = document.getElementById("admin-edit-light-sensor"); if (adminEditFormEl) adminEditFormEl.style.display = "block";
}

// Salva le modifiche al sensore fatte nel form admin (con change detection TODO)
async function adminSubmitEditSensor(event) {
    event.preventDefault();
    const id = document.getElementById("admin-sensorEditId").value;
    const nameInput = document.getElementById("admin-editSensorName");
    const valueInput = document.getElementById("admin-editSensorValue");
    const homeId = document.getElementById("admin-sensor-home-id").value;
    const saveButton = event.submitter;

    const newName = nameInput.value.trim();
    const newValueStr = valueInput.value.trim();
    const apiPromises = [];

    // TODO: Recuperare valori originali e confrontare prima di aggiungere a apiPromises
    console.warn("TODO: Implement change detection in adminSubmitEditSensor");

    // PATCH Nome (se ha valore)
    if (newName) { // TODO: Confronta con originale
        apiPromises.push(fetchApi(`/api/entities/lightSensor/patch/name/${id}`, "PATCH", { name: newName }).catch(err => { throw err; }));
    }
    // PATCH Valore (se ha valore e valido)
    if (newValueStr) { // TODO: Confronta con originale
        const newValue = parseInt(newValueStr, 10);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
            // ATTENZIONE: Il backend service SOMMA il valore invece di impostarlo! Serve fix backend.
            console.warn("Backend patchValueLightSensor ADDS value instead of setting it! Needs fix.");
            apiPromises.push(fetchApi(`/api/entities/lightSensor/patch/value/${id}`, "PATCH", { value: newValue }).catch(err => { throw err; })); // Usa /patch/value/
        } else { alert("Invalid value percentage (0-100). Value not updated."); }
    }

    if (apiPromises.length === 0) { alert("No valid changes detected."); return; }
    if (saveButton) { saveButton.disabled = true; saveButton.textContent = 'Saving...'; }

    try {
        await Promise.all(apiPromises);
        alert("Sensor updated successfully!");
        cancelAdminEditSensor();
        adminLoadLightSensors(homeId);
    } catch (error) {
        console.error("Error updating sensor (admin):", error);
        alert(`Error updating sensor: ${error.message}`);
    } finally {
        if (saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Changes'; }
    }
}

// Elimina un sensore (versione admin)
async function adminDeleteLightSensor(sensorId, homeId) {
    if (!confirm("Are you sure you want to delete this light sensor?")) return;

    const deleteBtn = document.querySelector(`#admin-sensor-item-${sensorId} button.btn-danger`);
    deleteBtn?.setAttribute("disabled", "true");

    try {
        // 1) Dissocia il sensore impostando lightSensor a null
        await fetchApi(
            `/api/entities/home/patch/lightSensor/${homeId}`,
            "PATCH",
            { lightSensor: null }
        );

        // 2) Elimina il sensore
        await fetchApi(
            `/api/entities/lightSensor/delete/${sensorId}`,
            "DELETE"
        );

        alert("Sensor deleted successfully!");
        adminLoadLightSensors(homeId);

    } catch (err) {
        console.error("Error deleting sensor:", err);
        alert("Failed to delete sensor: " + err.message);
    } finally {
        deleteBtn?.removeAttribute("disabled");
    }
}



// ========================================
// GESTIONE TAPPARELLE (Admin - Per Casa Specifica - SOLO VISTA)
// ========================================

// Mostra la sezione visualizzazione tapparelle per una casa specifica
function showShuttersForHome(homeId, homeName) {
    console.log(`Showing shutters for Home ID: ${homeId}, Name: ${homeName}`);
    // Nascondi altre sezioni admin...
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "none";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
    const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (sensorSectionEl) sensorSectionEl.style.display = 'none';
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if (globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if (globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Mostra la sezione gestione tapparelle
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (!shutterSectionEl) return; shutterSectionEl.style.display = 'block';

    // Imposta titolo
    const titleElement = document.getElementById("admin-shutter-home-title"); if (titleElement) titleElement.textContent = `Roller Shutters for: ${homeName}`;

    // Chiama funzione per caricare le tapparelle
    adminLoadRollerShutters(homeId);
}

// Nasconde la sezione tapparelle e torna alla lista case admin
function hideShuttersForHome() {
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
    loadAdminHomes(); // Ricarica vista principale
}

// Carica e visualizza le tapparelle ASSOCIATE (Admin - con bottoni Edit/Delete)
async function adminLoadRollerShutters(homeId) {
    const shutterListUl = document.getElementById("admin-shutter-list");
    if (!shutterListUl) {
        console.error("Element '#admin-shutter-list' not found.");
        return;
    }
    shutterListUl.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

    try {
        let associatedShutters = [];

        // Se il backend supporta il filtro via query param:
        try {
            const apiPath = `/api/entities/rollerShutter/?homeId=${homeId}`;
            associatedShutters = await fetchApi(apiPath);
            if (!Array.isArray(associatedShutters)) throw new Error("Unexpected response");
        } catch {
            // Fallback: caricamento via home DTO
            const allHomes = await fetchApi('/api/entities/home/');
            const homeDetails = Array.isArray(allHomes)
                ? allHomes.find(h => String(h.id) === String(homeId))
                : null;
            associatedShutters = homeDetails?.rollerShutters || [];
        }

        shutterListUl.innerHTML = ""; // Pulisci lista

        if (associatedShutters.length === 0) {
            shutterListUl.innerHTML = "<li class='list-group-item'>No shutters currently associated.</li>";
            return;
        }

        associatedShutters.forEach(shutter => {
            if (!shutter || !shutter.name) {
                console.warn("Skipping invalid shutter:", shutter);
                return;
            }
            const shutterId = shutter.id;
            const shutterName = shutter.name;
            // fallback su proprietà alternative per l’apertura
            const opening = shutter.percentageOpening ?? shutter.opening ?? "N/A";

            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
            // se manca l'ID, creiamo un identificativo univoco basato sul nome
            const safeKey = shutterId ? shutterId : shutterName.replace(/\s+/g, '_');
            li.id = `admin-shutter-item-${safeKey}`;

            // info (nome + apertura)
            const infoDiv = document.createElement("div");
            infoDiv.style.marginRight = "10px";
            infoDiv.innerHTML = `<strong>${shutterName}</strong> - Opening: ${opening}%`;

            // bottoni
            const btnDiv = document.createElement("div");
            btnDiv.className = "mt-1 mt-sm-0";

            // Edit Name
            const editBtn = document.createElement("button");
            editBtn.className = "btn btn-sm btn-warning me-2";
            editBtn.textContent = "Edit Name";
            if (shutterId) {
                editBtn.onclick = () => adminShowEditShutterForm(String(shutterId), shutterName, String(homeId));
            } else {
                editBtn.disabled = true;
                editBtn.title = "Cannot edit: ID missing";
            }

            // Delete
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn btn-sm btn-danger";
            deleteBtn.textContent = "Delete";
            if (shutterId) {
                deleteBtn.onclick = () => adminDeleteRollerShutter(String(shutterId), String(homeId));
            } else {
                deleteBtn.disabled = true;
                deleteBtn.title = "Cannot delete: ID missing";
            }

            btnDiv.append(editBtn, deleteBtn);
            li.append(infoDiv, btnDiv);
            shutterListUl.appendChild(li);
        });

    } catch (err) {
        console.error("Error loading associated shutters for admin view:", err);
        shutterListUl.innerHTML =
            `<li class='list-group-item text-danger'>Error loading shutters: ${err.message}</li>`;
    }
}

// ========================================
// FUNZIONI GLOBALI AGGIUNTA / EDIT INLINE / DELETE (Admin)
// ========================================

// --- LIGHT SENSOR ---

// Carica e mostra l’elenco dei sensori globali
async function loadGlobalLightSensors() {
    const container = document.getElementById('admin-global-list-sensors');
    if (!container) return;
    container.innerHTML = '<li class="list-group-item">Loading...</li>';
  
    try {
      const sensors = await fetchApi('/api/entities/lightSensor/');
      if (!Array.isArray(sensors) || sensors.length === 0) {
        container.innerHTML = '<li class="list-group-item">No global sensors.</li>';
        return;
      }
      container.innerHTML = '';
  
      sensors.forEach(s => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.id = `global-sensor-${s.id}`;
  
        // nome
        const span = document.createElement('span');
        span.textContent = s.name;
  
        // btn-group con Edit + Delete
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group btn-group-sm';
  
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-warning';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => globalShowEditLightSensorForm(s.id, s.name);
  
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger';
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => globalDeleteLightSensor(s.id);
  
        btnGroup.append(editBtn, delBtn);
        li.append(span, btnGroup);
        container.appendChild(li);
      });
    } catch (err) {
      console.error('Error loading global sensors:', err);
      container.innerHTML = `<li class="list-group-item text-danger">Error: ${err.message}</li>`;
    }
  }
  

// Visualizza inline il form di edit per un sensore
function globalShowEditLightSensorForm(id, currentName) {
    const li = document.getElementById(`global-sensor-${id}`);
    if (!li) return;
  
    li.innerHTML = `
      <input
        type="text"
        id="global-edit-input-sensor-${id}"
        class="form-control form-control-sm"
        value="${currentName}"
        style="width: auto; display: inline-block; vertical-align: middle;"
      />
    `;
  
    // Gruppo pulsanti Save e Cancel
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group btn-group-sm ms-2';
    btnGroup.style.verticalAlign = 'middle';
  
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-success';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = async () => {
      const newName = document.getElementById(`global-edit-input-sensor-${id}`).value.trim();
      if (!newName) {
        alert('Inserisci un nome valido');
        return;
      }
      try {
        await fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName });
        alert('Nome sensore aggiornato con successo!');
        await loadGlobalLightSensors();
      } catch (err) {
        console.error('Errore nel patch del sensore:', err);
        alert(`Errore: ${err.message}`);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sm btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => loadGlobalLightSensors();
  
    btnGroup.append(saveBtn, cancelBtn);
    li.appendChild(btnGroup);
  }
  

// Crea un nuovo sensore globale
async function globalCreateLightSensor(event) {
    event.preventDefault();
    const nameInput = document.getElementById('global-newSensorName');
    const sensorName = nameInput.value.trim();
    if (!sensorName) { alert('Inserisci un nome per il sensore'); return; }

    const submitBtn = event.submitter;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
        await fetchApi('/api/entities/lightSensor/create', 'POST', { name: sensorName });
        await loadGlobalLightSensors();
        nameInput.value = '';
    } catch (err) {
        console.error('Error creating light sensor:', err);
        alert(`Errore: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '+ Add Sensor';
    }
}

// Elimina un sensore globale
async function globalDeleteLightSensor(id) {
    if (!confirm('Sei sicuro di voler eliminare questo sensore globale?')) return;
    try {
        await fetchApi(`/api/entities/lightSensor/delete/${id}`, 'DELETE');
        await loadGlobalLightSensors();
    } catch (err) {
        console.error('Error deleting light sensor:', err);
        alert(`Errore: ${err.message}`);
    }
}


// --- ROLLER SHUTTER ---

// Carica e mostra l’elenco delle tapparelle globali
async function loadGlobalRollerShutters() {
    const container = document.getElementById('admin-global-list-shutters');
    if (!container) return;
    container.innerHTML = '<li class="list-group-item">Loading...</li>';
  
    try {
      const shutters = await fetchApi('/api/entities/rollerShutter/');
      if (!Array.isArray(shutters) || shutters.length === 0) {
        container.innerHTML = '<li class="list-group-item">No global shutters.</li>';
        return;
      }
      container.innerHTML = '';
  
      shutters.forEach(s => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.id = `global-shutter-${s.id}`;
  
        const span = document.createElement('span');
        span.textContent = s.name;
  
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group btn-group-sm';
  
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-warning';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => globalShowEditRollerShutterForm(s.id, s.name);
  
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger';
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => globalDeleteRollerShutter(s.id);
  
        btnGroup.append(editBtn, delBtn);
        li.append(span, btnGroup);
        container.appendChild(li);
      });
    } catch (err) {
      console.error('Error loading global shutters:', err);
      container.innerHTML = `<li class="list-group-item text-danger">Error: ${err.message}</li>`;
    }
  }
  

// Visualizza inline il form di edit per una tapparella
function globalShowEditRollerShutterForm(id, currentName) {
    const li = document.getElementById(`global-shutter-${id}`);
    if (!li) return;
  
    // Pulisce il contenuto della <li> e inserisce input + btn-group
    li.innerHTML = `
      <input
        type="text"
        id="global-edit-input-shutter-${id}"
        class="form-control form-control-sm"
        value="${currentName}"
        style="width: auto; display: inline-block; vertical-align: middle;"
      />
    `;
  
    // Gruppo pulsanti Save e Cancel
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group btn-group-sm ms-2';
    btnGroup.style.verticalAlign = 'middle';
  
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-success';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = async () => {
      const newName = document.getElementById(`global-edit-input-shutter-${id}`).value.trim();
      if (!newName) {
        alert('Inserisci un nome valido');
        return;
      }
      try {
        await fetchApi(`/api/entities/rollerShutter/patch/name/${id}`, 'PATCH', { name: newName });
        alert('Nome tapparella aggiornato con successo!');
        await loadGlobalRollerShutters();
      } catch (err) {
        console.error('Errore nel patch della tapparella:', err);
        alert(`Errore: ${err.message}`);
      }
    };
  
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sm btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => loadGlobalRollerShutters();
  
    btnGroup.append(saveBtn, cancelBtn);
    li.appendChild(btnGroup);
  }

// Crea una nuova tapparella globale
async function globalCreateRollerShutter(event) {
    event.preventDefault();
    const nameInput = document.getElementById('global-newShutterName');
    const shutterName = nameInput.value.trim();
    if (!shutterName) { alert('Inserisci un nome per la tapparella'); return; }

    const submitBtn = event.submitter;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
        await fetchApi('/api/entities/rollerShutter/create', 'POST', { name: shutterName });
        await loadGlobalRollerShutters();
        nameInput.value = '';
    } catch (err) {
        console.error('Error creating roller shutter:', err);
        alert(`Errore: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '+ Add Shutter';
    }
}

// Elimina una tapparella globale
async function globalDeleteRollerShutter(id) {
    if (!confirm('Sei sicuro di voler eliminare questa tapparella globale?')) return;
    try {
        await fetchApi(`/api/entities/rollerShutter/delete/${id}`, 'DELETE');
        await loadGlobalRollerShutters();
    } catch (err) {
        console.error('Error deleting roller shutter:', err);
        alert(`Errore: ${err.message}`);
    }
}


// Mostra il form per modificare il nome della tapparella
function adminShowEditShutterForm(shutterId, currentName, homeId) {
    console.log(`Editing shutter ID: ${shutterId}, Current Name: ${currentName}`);
    // Popola i campi del form
    document.getElementById("admin-shutterEditId").value = shutterId;
    document.getElementById("admin-editShutterName").value = currentName;
    // Salva homeId per poter ricaricare la lista corretta dopo il salvataggio
    document.getElementById("admin-shutterEditHomeId").value = homeId;

    // Mostra il form
    const editForm = document.getElementById("admin-edit-shutter-form");
    if (editForm) editForm.style.display = "block";
}

// Nasconde il form di modifica nome tapparella
function cancelAdminEditShutter() {
    const editForm = document.getElementById("admin-edit-shutter-form");
    if (editForm) editForm.style.display = "none";
}

// Gestisce l'invio del form di modifica nome tapparella
async function adminSubmitEditShutter(event) {
    event.preventDefault();
    const shutterId = document.getElementById("admin-shutterEditId").value;
    const homeId = document.getElementById("admin-shutterEditHomeId").value; // Recupera homeId per refresh
    const newNameInput = document.getElementById("admin-editShutterName");
    const newName = newNameInput.value.trim();
    const saveButton = event.submitter;

    if (!newName) {
        alert("Please enter a new name for the shutter.");
        return;
    }
    if (!shutterId || !homeId) {
        console.error("Missing shutter ID or home ID for edit submission.");
        alert("An error occurred. Cannot save changes.");
        return;
    }

    if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

    try {
        // Chiama API PATCH per il nome
        await fetchApi(`/api/entities/rollerShutter/patch/name/${shutterId}`, "PATCH", { name: newName });

        alert("Shutter name updated successfully!");
        cancelAdminEditShutter(); // Nascondi form
        adminLoadRollerShutters(homeId); // Ricarica la lista tapparelle per questa casa

    } catch (error) {
        console.error("Error updating shutter name:", error);
        alert(`Failed to update shutter name: ${error.message}`);
    } finally {
        if (saveButton) { saveButton.disabled = false; saveButton.textContent = "Save Name"; }
    }
}

// Elimina una tapparella (versione admin)
async function adminDeleteRollerShutter(shutterId, homeId) {
    if (!confirm("Are you sure you want to delete this roller shutter PERMANENTLY? This cannot be undone and might affect routines.")) {
        return;
    }
    if (!shutterId || !homeId) {
        console.error("Missing shutter ID or home ID for deletion.");
        alert("An error occurred. Cannot delete shutter.");
        return;
    }

    try {
        // Chiama API DELETE per la tapparella
        await fetchApi(`/api/entities/rollerShutter/delete/${shutterId}`, "DELETE");

        alert("Roller shutter deleted successfully!");
        adminLoadRollerShutters(homeId); // Ricarica la lista tapparelle per questa casa

    } catch (error) {
        console.error(`Error deleting roller shutter (ID: ${shutterId}):`, error);
        alert(`Error deleting shutter: ${error.message}`);
    }
}
// ========================================
// FINE js/admin.js
// ========================================