// ========================================
//        js/admin.js (COMPLETO Riga per Riga v. 14/04/25)
// ========================================

// Nota: Caricare DOPO api.js, utils.js, auth.js e PRIMA di dashboard.js

// ========================================
// GESTIONE CASE (Homes)
// ========================================

// Carica la lista delle case per l'admin e imposta la vista iniziale
async function loadAdminHomes() {
    const homeList = document.getElementById("admin-homes-list");
    if (!homeList) {
        console.error("Element '#admin-homes-list' not found.");
        return;
    }
    homeList.innerHTML = "<li class='list-group-item'>Loading homes...</li>";

    // --- VISIBILITÀ INIZIALE CORRETTA ---
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "block";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "block";
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if(globalAddSensorEl) globalAddSensorEl.style.display = 'block';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if(globalAddShutterEl) globalAddShutterEl.style.display = 'block';
    const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = "none";
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (sensorSectionEl) sensorSectionEl.style.display = "none";
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (shutterSectionEl) shutterSectionEl.style.display = "none";
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = "block";

    // Resetta titolo/lista routine
    const routineTitle = document.getElementById("Routines-section-title"); if(routineTitle) routineTitle.innerText = "Routines";
    const routineList = document.getElementById("Routines-list"); if(routineList) routineList.innerHTML = "<li class='list-group-item list-group-item-placeholder'>Select a home to view its Routines.</li>";
    // --- FINE BLOCCO VISIBILITÀ ---

    try {
        const homes = await fetchApi("/api/entities/home/");
        homeList.innerHTML = "";

        if (homes && Array.isArray(homes) && homes.length > 0) {
            homes.forEach((home) => {
                if(!home || !home.id) return;
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                const homeIdStr = String(home.id);
                const homeNameStr = String(home.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                li.innerHTML = `
                    <span>${home.name || 'Unnamed Home'}</span>
                    <div class="btn-group btn-group-sm admin-home-actions" role="group" aria-label="Azioni Casa">
                        <button type="button" class="btn btn-warning" onclick="showEditHomeForm('${homeIdStr}', '${homeNameStr}')">Edit</button>
                        <button type="button" class="btn btn-danger" onclick="deleteHome('${homeIdStr}')">Delete</button>
                        <button type="button" class="btn btn-info" onclick="showRoutinesForHome('${homeIdStr}', '${homeNameStr}')">Routines</button>
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
    const spinnerEl = document.getElementById("loadingSpinner"); if(spinnerEl) spinnerEl.style.display = "block";
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
     } catch(error) {
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
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if(sensorSectionEl) sensorSectionEl.style.display = 'none';
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if(shutterSectionEl) shutterSectionEl.style.display = 'none';
    const routinesSectionEl = document.getElementById("Routines-section"); if(routinesSectionEl) routinesSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if(globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if(globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Trova il DIV contenitore E il FORM interno
    const editHomeDiv = document.getElementById("edit-home-form"); if (!editHomeDiv) return;
    const editHomeInnerForm = editHomeDiv.querySelector('form'); // <-- Trova il form interno
    if (!editHomeInnerForm) { console.error("Inner form not found in #edit-home-form"); return;}

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

    if (!newName) { alert("Please enter home name."); return; }
    if(saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

    const apiCalls = [];
    const callsInfo = [];

    // 1. PATCH Nome (se cambiato)
    if (newName !== originalName) {
        console.log("Change detected for Name. Preparing PATCH...");
        const payload = { name: newName };
        callsInfo.push({ path: `/patch/name/${id}`, payload: payload });
        apiCalls.push(fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", payload).catch(err => { throw err; }));
    }

    // 2. PATCH Owner (se cambiato E un owner effettivo è selezionato)
    if (selectedOwnerId !== originalOwnerId) {
        // --- CONTROLLO AGGIUNTIVO: Invia solo se un owner è selezionato ---
        if (selectedOwnerId) { // selectedOwnerId non è vuoto ""
            console.log("Change detected for Owner. Preparing PATCH...");
            const ownerSelect = document.getElementById("editHomeOwnerSelect");
            const selectedOption = ownerSelect.options[ownerSelect.selectedIndex];
            const selectedUsername = selectedOption ? selectedOption.text : null; // Prendi username

            // Verifica ulteriore che lo username sia valido prima di creare il payload
            if (selectedUsername) {
                const ownerPayload = { user: { username: selectedUsername } }; // Payload come da test
                console.log("Owner Payload:", ownerPayload);
                callsInfo.push({ path: `/patch/owner/${id}`, payload: ownerPayload });
                apiCalls.push(fetchApi(`/api/entities/home/patch/owner/${id}`, 'PATCH', ownerPayload).catch(err => { throw err; }));
            } else {
                 console.log("Owner ID selected but username not found in option text. Skipping PATCH.");
            }
        } else {
            // Se selectedOwnerId è "" (cioè "-- Select Owner --") e diverso dall'originale
            console.log("Owner changed to '-- Select Owner --'. Skipping PATCH request (disassociation not handled).");
            // NON inviamo { user: null } per evitare errore backend (se presente)
        }
        // --------------------------------------------------------------------
    }

    // 3. PATCH Sensore (se cambiato E NON è "NONE")
    if (selectedSensorName !== originalSensorName) {
        // La logica qui sotto già salta l'invio se è "NONE"
        if (selectedSensorName && selectedSensorName !== "NONE") {
            console.log("Change detected for Sensor. Preparing PATCH...");
            const sensorPayload = { name: selectedSensorName }; // Payload come da tua info API
            console.log("Sensor Payload:", sensorPayload);
            callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: sensorPayload });
            apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, 'PATCH', sensorPayload).catch(err => { throw err; }));
        } else {
             console.log("Sensor changed to 'None'. Skipping PATCH request.");
        }
    }

    // 4. PATCH Tapparelle (se cambiate E la lista selezionata NON è vuota)
    if (selectedShuttersJson !== originalShuttersJson) {
         // --- CONTROLLO AGGIUNTIVO: Invia solo se almeno una tapparella è selezionata ---
        if (selectedShutterNames.length > 0) {
             console.log("Change detected for Shutters. Preparing PATCH...");
             const shuttersPayload = { rollerShutters: selectedShutterNames.map(name => ({ name: name })) }; // Usa NOMI
             console.log("Shutters Payload:", shuttersPayload);
             callsInfo.push({ path: `/patch/rollerShutters/${id}`, payload: shuttersPayload });
             apiCalls.push(fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, 'PATCH', shuttersPayload).catch(err => { throw err; }));
        } else {
             // Se la lista selezionata è vuota [] (e diversa dall'originale)
             console.log("Shutters changed to empty list. Skipping PATCH request (Backend fix needed for empty list).");
             // NON inviamo { rollerShutters: [] } per evitare errore 500 backend
        }
        // -------------------------------------------------------------------------
    }

    // Se non ci sono chiamate
    if (apiCalls.length === 0) {
         alert("No changes were detected or only empty selections were made."); // Messaggio aggiornato
         if(saveButton) { saveButton.disabled = false; saveButton.textContent = "Save Changes"; } return;
    }

    // Esegui chiamate
    try {
        console.log(`Executing ${apiCalls.length} PATCH call(s):`, callsInfo);
        await Promise.all(apiCalls);
        alert("Home details updated successfully!");
        cancelEditHome(); loadAdminHomes();
    } catch (error) {
        console.error("Error updating home details:", error);
        const errorDetails = error.details ? `\nDetails: ${JSON.stringify(error.details)}` : '';
        alert(`Failed to update home details: <span class="math-inline">\{error\.message\}</span>{errorDetails}`);
    } finally { if(saveButton) { saveButton.disabled = false; saveButton.textContent = "Save Changes"; } }
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
function showRoutinesForHome(homeId, homeName) {
    console.log(`Showing Routines for Home ID: ${homeId}, Name: ${homeName}`);
    // Nascondi altre sezioni admin...
    const adminHomesEl = document.getElementById("admin-homes"); if (adminHomesEl) adminHomesEl.style.display = "none";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
    const editHomeFormEl = document.getElementById("edit-home-form"); if(editHomeFormEl) editHomeFormEl.style.display = 'none';
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if(sensorSectionEl) sensorSectionEl.style.display = 'none';
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if(shutterSectionEl) shutterSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if(globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if(globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Mostra sezione routine
    const routinesSectionEl = document.getElementById("Routines-section"); if(!routinesSectionEl) return; routinesSectionEl.style.display = 'block';
    // Imposta titolo e ID nascosto
    const routineTitleEl = document.getElementById("Routines-section-title"); if(routineTitleEl) routineTitleEl.innerText = `Routines for: ${homeName}`;
    const routineHomeIdHiddenEl = document.getElementById("Routines-home-id-hidden"); if(routineHomeIdHiddenEl) routineHomeIdHiddenEl.value = homeId;
    // Chiama la funzione in routines.js
    if (typeof loadRoutines === "function") { loadRoutines(homeId); } else { console.error("loadRoutines function is not defined"); }
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
    const editHomeFormEl = document.getElementById("edit-home-form"); if(editHomeFormEl) editHomeFormEl.style.display = 'none';
    const routinesSectionEl = document.getElementById("Routines-section"); if(routinesSectionEl) routinesSectionEl.style.display = 'none';
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if(shutterSectionEl) shutterSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if(globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if(globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Mostra la sezione gestione sensori
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if (!sensorSectionEl) return; sensorSectionEl.style.display = 'block';

    // Imposta titolo e ID nascosto (per Edit/Delete)
    const titleElement = document.getElementById("admin-sensor-home-title"); if (titleElement) titleElement.textContent = `Sensors for: ${homeName}`;
    const sensorHomeIdHidden = document.getElementById("admin-sensor-home-id"); if (sensorHomeIdHidden) sensorHomeIdHidden.value = homeId;

    // Nascondi form modifica se era aperto
     const adminEditSensorFormEl = document.getElementById("admin-edit-light-sensor"); if(adminEditSensorFormEl) adminEditSensorFormEl.style.display = 'none';

    // Chiama funzione per caricare i sensori
    adminLoadLightSensors(homeId);
}

// Nasconde la sezione sensori e torna alla lista case admin
function hideSensorsForHome() {
     const sensorSectionEl = document.getElementById("admin-sensor-management"); if(sensorSectionEl) sensorSectionEl.style.display = 'none';
     loadAdminHomes(); // Ricarica la vista principale
}

// Nasconde il form di modifica sensore admin
function cancelAdminEditSensor() {
    const adminEditSensorFormEl = document.getElementById("admin-edit-light-sensor"); if(adminEditSensorFormEl) adminEditSensorFormEl.style.display = "none";
}

// Carica e visualizza i sensori per una specifica casa (Admin - con bottoni)
async function adminLoadLightSensors(homeId) {
    const sensorList = document.getElementById("admin-sensor-list"); if (!sensorList) return;
    sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";
    const apiPath = '/api/entities/lightSensor/';
    try {
        const allSensors = await fetchApi(apiPath);
        let filteredSensors = [];
        // Filtra lato client (ASSUMENDO sensor.home.id)
        if (homeId && allSensors && Array.isArray(allSensors)) { filteredSensors = allSensors.filter(sensor => sensor?.home?.id && String(sensor.home.id) === String(homeId)); }

        sensorList.innerHTML = "";
        if (filteredSensors.length > 0) {
            filteredSensors.forEach((sensor) => {
                 if (!sensor || !sensor.id) return;
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
                li.id = `admin-sensor-item-${sensor.id}`;
                const numericValue = sensor.value ?? sensor.opening ?? null; // VERIFICARE campo valore!
                const displayValue = numericValue !== null ? numericValue : 'N/A';
                const safeName = (sensor.name || '').replace(/'/g, "\\'");
                li.innerHTML = `
                    <div style="margin-right: 10px;"><strong>${sensor.name || 'Unnamed'}</strong> - Value: ${displayValue}%</div>
                    <div class="mt-1 mt-sm-0">
                        <button class="btn btn-sm btn-warning me-2" onclick="adminShowEditSensorForm('${sensor.id}', '${safeName}', ${numericValue})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDeleteLightSensor('${sensor.id}', '${homeId}')">Delete</button>
                    </div>
                `;
                sensorList.appendChild(li);
            });
        } else { sensorList.innerHTML = "<li class='list-group-item'>No sensors associated.</li>"; }
    } catch (error) {
        console.error("Error loading sensors for admin view:", error);
        sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${error.message}</li>`;
    }
}

// Mostra il form di modifica specifico per admin
function adminShowEditSensorForm(id, name, currentValue) {
    document.getElementById("admin-sensorEditId").value = id;
    document.getElementById("admin-editSensorName").value = name;
    document.getElementById("admin-editSensorValue").value = currentValue !== null ? currentValue : "";
    const adminEditFormEl = document.getElementById("admin-edit-light-sensor"); if(adminEditFormEl) adminEditFormEl.style.display = "block";
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
        apiPromises.push( fetchApi(`/api/entities/lightSensor/patch/name/${id}`, "PATCH", { name: newName }).catch(err => { throw err; }) );
    }
    // PATCH Valore (se ha valore e valido)
    if (newValueStr) { // TODO: Confronta con originale
        const newValue = parseInt(newValueStr, 10);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
             // ATTENZIONE: Il backend service SOMMA il valore invece di impostarlo! Serve fix backend.
             console.warn("Backend patchValueLightSensor ADDS value instead of setting it! Needs fix.");
            apiPromises.push( fetchApi(`/api/entities/lightSensor/patch/value/${id}`, "PATCH", { value: newValue }).catch(err => { throw err; }) ); // Usa /patch/value/
        } else { alert("Invalid value percentage (0-100). Value not updated."); }
    }

    if (apiPromises.length === 0) { alert("No valid changes detected."); return; }
    if(saveButton){ saveButton.disabled = true; saveButton.textContent = 'Saving...'; }

    try {
        await Promise.all(apiPromises);
        alert("Sensor updated successfully!");
        cancelAdminEditSensor();
        adminLoadLightSensors(homeId);
    } catch (error) {
        console.error("Error updating sensor (admin):", error);
        alert(`Error updating sensor: ${error.message}`);
     } finally {
         if(saveButton){ saveButton.disabled = false; saveButton.textContent = 'Save Changes'; }
     }
}

// Elimina un sensore (versione admin)
async function adminDeleteLightSensor(sensorId, homeId) {
    if (!confirm("Are you sure...?")) { return; }
    try { await fetchApi(`/api/entities/lightSensor/delete/${sensorId}`, "DELETE"); alert("Deleted!"); adminLoadLightSensors(homeId); }
    catch (error) { console.error(`Error deleting sensor (ID: ${sensorId}):`, error); alert(`Error: ${error.message}`); }
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
    const editHomeFormEl = document.getElementById("edit-home-form"); if(editHomeFormEl) editHomeFormEl.style.display = 'none';
    const sensorSectionEl = document.getElementById("admin-sensor-management"); if(sensorSectionEl) sensorSectionEl.style.display = 'none';
    const routinesSectionEl = document.getElementById("Routines-section"); if(routinesSectionEl) routinesSectionEl.style.display = 'none';
    const globalAddSensorEl = document.getElementById("admin-global-add-sensor"); if(globalAddSensorEl) globalAddSensorEl.style.display = 'none';
    const globalAddShutterEl = document.getElementById("admin-global-add-shutter"); if(globalAddShutterEl) globalAddShutterEl.style.display = 'none';

    // Mostra la sezione gestione tapparelle
    const shutterSectionEl = document.getElementById("admin-shutter-management"); if (!shutterSectionEl) return; shutterSectionEl.style.display = 'block';

    // Imposta titolo
    const titleElement = document.getElementById("admin-shutter-home-title"); if (titleElement) titleElement.textContent = `Roller Shutters for: ${homeName}`;

    // Chiama funzione per caricare le tapparelle
    adminLoadRollerShutters(homeId);
}

// Nasconde la sezione tapparelle e torna alla lista case admin
function hideShuttersForHome() {
     const shutterSectionEl = document.getElementById("admin-shutter-management"); if(shutterSectionEl) shutterSectionEl.style.display = 'none';
     loadAdminHomes(); // Ricarica vista principale
}

// Carica e visualizza le tapparelle ASSOCIATE a una specifica casa (Admin - SOLO VISTA)
async function adminLoadRollerShutters(homeId) {
    const shutterListUl = document.getElementById("admin-shutter-list"); if (!shutterListUl) return;
    shutterListUl.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

    try {
        // WORKAROUND: Carica tutte le case e filtra
        const allHomes = await fetchApi('/api/entities/home/');
        let homeDetails = null;
        if (allHomes && Array.isArray(allHomes)) { homeDetails = allHomes.find(home => home && String(home.id) === String(homeId)); }

        shutterListUl.innerHTML = ""; // Pulisci

        // Estrai le tapparelle da homeDetails (ASSUMENDO homeDetails.rollerShutters[])
        const filteredShutters = homeDetails?.rollerShutters || [];
        console.log(`Found ${filteredShutters.length} associated shutters for homeId ${homeId}.`, filteredShutters);

        if (filteredShutters.length > 0) {
            filteredShutters.forEach((shutter) => {
                 if (!shutter || !shutter.id) return;
                const li = document.createElement("li"); li.className = "list-group-item";
                li.id = `admin-view-shutter-item-${shutter.id}`;
                li.innerHTML = `<strong>${shutter.name || 'Unnamed'}</strong> - Opening: ${shutter.percentageOpening ?? 'N/A'}%`;
                shutterListUl.appendChild(li);
            });
        } else { shutterListUl.innerHTML = "<li class='list-group-item'>No shutters currently associated.</li>"; }
    } catch (error) {
        console.error("Error loading associated shutters for admin view:", error);
        shutterListUl.innerHTML = `<li class='list-group-item text-danger'>Error loading associated shutters: ${error.message}</li>`;
     }
}

// ========================================
// FUNZIONI GLOBALI AGGIUNTA (Admin)
// ========================================

// Gestisce l'aggiunta GLOBALE di un nuovo sensore
async function globalCreateLightSensor(event) {
    event.preventDefault();
    const nameInput = document.getElementById("global-newSensorName");
    const name = nameInput.value.trim();
    const addButton = event.submitter;
    if (!name) { alert("Please enter sensor name."); return; }
    if(addButton) { addButton.disabled = true; addButton.textContent = 'Adding...'; }
    try {
        await fetchApi('/api/entities/lightSensor/create', 'POST', { name: name }); // SOLO NOME
        alert(`Sensor '${name}' created successfully! Associate it via the 'Edit Home' form.`); nameInput.value = "";
    } catch (error) { console.error("Error creating global sensor:", error); alert(`Error: ${error.message}`); }
    finally { if(addButton) { addButton.disabled = false; addButton.textContent = '+ Add Sensor'; } }
}

// Gestisce l'aggiunta GLOBALE di una nuova tapparella
async function globalCreateRollerShutter(event) {
    event.preventDefault();
    const nameInput = document.getElementById("global-newShutterName");
    const name = nameInput.value.trim();
    const addButton = event.submitter;
    if (!name) { alert("Please enter shutter name."); return; }
    if(addButton) { addButton.disabled = true; addButton.textContent = 'Adding...'; }
    try {
        await fetchApi('/api/entities/rollerShutter/create', 'POST', { name: name }); // SOLO NOME
        alert(`Roller shutter '${name}' created successfully! Associate it via the 'Edit Home' form.`); nameInput.value = "";
    } catch (error) { console.error("Error creating global roller shutter:", error); alert(`Error: ${error.message}`); }
    finally { if(addButton) { addButton.disabled = false; addButton.textContent = '+ Add Shutter'; } }
}

// ========================================
// FINE js/admin.js
// ========================================