// ========================================
//        js/admin.js (COMPLETO v. 11/04/25)
// ========================================

// Nota: Assicurati che questo file sia caricato DOPO api.js e auth.js
// e PRIMA di dashboard.js

// ========================================
// GESTIONE CASE (Homes)
// ========================================

// Carica la lista delle case per l'admin
async function loadAdminHomes() {
    const homeList = document.getElementById("admin-homes-list");
    if (!homeList) { console.error("Element '#admin-homes-list' not found."); return; }
    homeList.innerHTML = "<li class='list-group-item'>Loading homes...</li>";

    // Mostra/Nascondi sezioni di default per la vista admin
    const adminHomesSection = document.getElementById("admin-homes"); if (adminHomesSection) adminHomesSection.style.display = "block";
    const addHomeForm = document.getElementById("add-home-form"); if (addHomeForm) addHomeForm.style.display = "block";
    const editHomeForm = document.getElementById("edit-home-form"); if (editHomeForm) editHomeForm.style.display = "none";
    const sensorSection = document.getElementById("admin-sensor-management"); if (sensorSection) sensorSection.style.display = "none";
    const routinesSection = document.getElementById("Routines-section"); if (routinesSection) routinesSection.style.display = "block"; // Mostra anche le routine inizialmente

    try {
        const homes = await fetchApi("/api/entities/home/"); // GET all homes (admin)
        homeList.innerHTML = ""; // Pulisci

        if (homes && Array.isArray(homes) && homes.length > 0) {
            homes.forEach((home) => {
                if(!home || !home.id) return; // Salta case invalide
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                const homeIdStr = String(home.id);
                // Gestisce apici singoli e doppi nel nome per sicurezza nell'HTML onclick
                const homeNameStr = String(home.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                li.innerHTML = `
                    <span>${home.name || 'Unnamed Home'}</span>
                    <div class="btn-group btn-group-sm admin-home-actions" role="group" aria-label="Azioni Casa">
                        <button type="button" class="btn btn-warning" onclick="showEditHomeForm('${homeIdStr}', '${homeNameStr}')">Edit</button>
                        <button type="button" class="btn btn-danger" onclick="deleteHome('${homeIdStr}')">Delete</button>
                        <button type="button" class="btn btn-info" onclick="showRoutinesForHome('${homeIdStr}', '${homeNameStr}')">Routines</button>
                        <button type="button" class="btn btn-success" onclick="showSensorsForHome('${homeIdStr}', '${homeNameStr}')">Sensors</button>
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
    if (spinner) spinner.style.display = "block";
    if (addButton) addButton.disabled = true;

    try {
        await fetchApi("/api/entities/home/create", "POST", { name: homeName });
        alert("Home added successfully!");
        homeNameInput.value = "";
        loadAdminHomes(); // Ricarica lista
    } catch (error) {
         console.error("Error adding home:", error);
        alert(`Failed to add home: ${error.message}`);
    } finally {
        if (spinner) spinner.style.display = "none";
        if (addButton) addButton.disabled = false;
    }
}

// Carica la lista di utenti e popola un elemento <select> (USA ID COME VALUE)
async function loadUsersForOwnerSelect(selectElementId, currentOwnerId) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
    selectElement.innerHTML = '<option value="" selected disabled>Loading users...</option>';

    try {
        const users = await fetchApi('/api/users/'); // Path API corretto per lista utenti
        selectElement.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = ""; // Valore vuoto per "nessuno" / non selezionato
        defaultOption.textContent = "-- Select Owner --";
        selectElement.appendChild(defaultOption);

        if (users && Array.isArray(users) && users.length > 0) {
            users.forEach(user => {
                if (user && user.id && user.username) {
                    const option = document.createElement('option');
                    option.value = user.id; // <-- USA ID COME VALUE
                    option.textContent = user.username; // Mostra username

                    if (currentOwnerId && String(user.id) === String(currentOwnerId)) {
                        option.selected = true;
                        console.log(`Pre-selected owner: ${user.username} (ID: ${user.id})`);
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

// Carica i sensori disponibili e popola la select nel form Edit Home (USA NOME COME VALUE)
async function loadAvailableSensorsForEditHome(selectElementId, currentSensorName) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
    selectElement.innerHTML = '<option value="" selected disabled>Loading sensors...</option>';

    try {
        const sensors = await fetchApi('/api/entities/lightSensor/'); // GET tutti i sensori
        selectElement.innerHTML = ''; // Pulisci

        const noneOption = document.createElement('option');
        noneOption.value = "NONE"; // Valore speciale per "nessuno"
        noneOption.textContent = "-- None --";
        selectElement.appendChild(noneOption);

        if (sensors && Array.isArray(sensors) && sensors.length > 0) {
            sensors.forEach(sensor => {
                if (sensor && sensor.id && sensor.name) {
                    const option = document.createElement('option');
                    option.value = sensor.name; // <-- USA NOME COME VALUE
                    option.textContent = sensor.name; // Mostra nome
                    if (currentSensorName && sensor.name === currentSensorName) {
                        option.selected = true;
                        noneOption.selected = false; // Deseleziona "None"
                    }
                    selectElement.appendChild(option);
                }
            });
            // Se nessun sensore attuale è stato passato O se l'originale era null/NONE, seleziona "NONE"
            if (!currentSensorName || currentSensorName === "NONE") {
                 selectElement.value = "NONE";
            }
        } else {
             console.log("No available light sensors found.");
             selectElement.value = "NONE"; // Seleziona "None" se non ci sono sensori
        }
    } catch (error) {
        console.error(`Error loading available sensors into select #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="" selected disabled>Error!</option>`;
        const noneOptionErr = document.createElement('option');
        noneOptionErr.value = "NONE"; noneOptionErr.textContent = "-- None --";
        selectElement.appendChild(noneOptionErr); // Aggiungi comunque None
    }
}

// Carica tapparelle disponibili e popola checkbox nel form Edit Home (USA NOME COME VALUE)
async function loadAvailableShuttersForEditHome(containerElementId, originalShutterNames = []) {
     const container = document.getElementById(containerElementId);
     const loadingMsg = document.getElementById("editHomeShuttersLoading");
     if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }
     // Pulisci contenitore e rimuovi messaggio loading (se esiste)
     container.innerHTML = '';
     if (loadingMsg && loadingMsg.parentNode === container) loadingMsg.remove(); // Rimuovi solo se è figlio diretto

     // === API DA CONFERMARE ===
     const apiPath = '/api/entities/rollerShutter/'; // Prendiamo tutte le tapparelle per ora
     console.warn("API path for loading available shutters needs confirmation. Using:", apiPath);

     // Messaggio temporaneo se l'API è lenta
     container.innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading available shutters...</p>';

     try {
        const allShutters = await fetchApi(apiPath);
        // Rimuovi di nuovo il messaggio loading (se la chiamata è stata veloce)
        document.getElementById("editHomeShuttersLoading")?.remove();
        container.innerHTML = ''; // Pulisci di nuovo per sicurezza

         if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
             const originalNamesSet = new Set(originalShutterNames);
             allShutters.forEach(shutter => {
                 if (shutter && shutter.id && shutter.name) {
                     const div = document.createElement('div');
                     div.className = 'form-check';
                     const isChecked = originalNamesSet.has(shutter.name);
                     const checkId = `edit_shutter_check_${shutter.id}`;
                     const safeName = shutter.name.replace(/"/g, '&quot;'); // Escape double quotes

                     div.innerHTML = `
                         <input class="form-check-input" type="checkbox" value="${safeName}" id="${checkId}" ${isChecked ? 'checked' : ''}>
                         <label class="form-check-label" for="${checkId}">
                             ${shutter.name}
                         </label>
                     `;
                     container.appendChild(div);
                 }
             });
         } else {
             container.innerHTML = '<p style="color: #ccc;">No available shutters found.</p>';
         }

     } catch(error) {
         console.error("Error loading shutters for Edit Home form:", error);
         document.getElementById("editHomeShuttersLoading")?.remove(); // Rimuovi loading anche in caso di errore
         container.innerHTML = '<p class="text-danger">Error loading shutters.</p>';
     }
}


// Mostra il form per modificare i dettagli di una casa
async function showEditHomeForm(homeId, homeName) {
    console.log(`Showing edit form for Home ID: ${homeId}`);
    // Nascondi altre sezioni admin...
    const adminHomes = document.getElementById("admin-homes"); if (adminHomes) adminHomes.style.display = "none";
    const addHomeForm = document.getElementById("add-home-form"); if (addHomeForm) addHomeForm.style.display = "none";
    const sensorSection = document.getElementById("admin-sensor-management"); if(sensorSection) sensorSection.style.display = 'none';
    const routinesSection = document.getElementById("Routines-section"); if(routinesSection) routinesSection.style.display = 'none';

    // Trova il form
    const editHomeForm = document.getElementById("edit-home-form"); if (!editHomeForm) return;

    // Popola campi base
    document.getElementById("editHomeId").value = homeId;
    document.getElementById("editHomeName").value = homeName;

    // Mostra il form di modifica
    editHomeForm.style.display = "block";

    // Reset/Loading state per campi dinamici
    document.getElementById("editHomeOwnerSelect").innerHTML = '<option value="" selected disabled>Loading details...</option>';
    document.getElementById("editHomeShuttersList").innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading details...</p>';
    document.getElementById("editHomeSensorSelect").innerHTML = '<option value="" selected disabled>Loading details...</option><option value="NONE">-- None --</option>';

    // --- CARICA DETTAGLI CASA ATTUALE ---
    let currentOwnerId = null; // <-- Torniamo a usare ID per Owner per coerenza interna
    let currentOwnerUsername = null; // Manteniamo anche username per il payload PATCH
    let originalShutterNames = [];
    let currentSensorName = null;

    try {
        // WORKAROUND: Carica tutte le case e filtra
        console.log("Fetching home list to find details for homeId:", homeId);
        const allHomes = await fetchApi('/api/entities/home/');
        let homeDetails = null;
        if (allHomes && Array.isArray(allHomes)) { homeDetails = allHomes.find(home => home && String(home.id) === String(homeId)); }

        if (homeDetails) {
            console.log("Found home details:", homeDetails);
            // Estrai dati ORIGINALI (ASSUMENDO che GET /home/ li ritorni!)
            currentOwnerId = homeDetails.owner?.id || null; // Estrai ID
            currentOwnerUsername = homeDetails.owner?.username || null; // Estrai anche Username
            currentSensorName = homeDetails.lightSensor?.name || null; // Estrai NOME sensore
            originalShutterNames = homeDetails.rollerShutters?.map(rs => rs.name).filter(name => name != null) || []; // Estrai NOMI tapparelle

            // Memorizza i valori originali nel dataset del form
            editHomeForm.dataset.originalName = homeName;
            editHomeForm.dataset.originalOwnerId = currentOwnerId || ""; // Usa ID nel dataset
            editHomeForm.dataset.originalSensor = currentSensorName || "NONE";
            editHomeForm.dataset.originalShutters = JSON.stringify(originalShutterNames.sort());

            console.log("Stored Original Data:", editHomeForm.dataset);

        } else { console.error(`Home details for ID ${homeId} not found.`); }
    } catch (error) { console.error(`Failed to fetch home details for ID ${homeId}:`, error); }

    // Popola i campi dinamici passando il valore attuale per pre-selezione
    loadUsersForOwnerSelect('editHomeOwnerSelect', currentOwnerId); // <--- Passa ID a loadUsers...
    loadAvailableSensorsForEditHome('editHomeSensorSelect', currentSensorName);
    loadAvailableShuttersForEditHome('editHomeShuttersList', originalShutterNames);
}

// Annulla la modifica della casa e torna alla lista
function cancelEditHome() {
    const editHomeForm = document.getElementById("edit-home-form"); if (editHomeForm) editHomeForm.style.display = "none";
    loadAdminHomes(); // Ricarica la vista principale
}

// Salva le modifiche della casa
async function submitEditHome(event) {
    event.preventDefault();
    const form = event.target;
    const id = document.getElementById("editHomeId").value; // Home ID
    const saveButton = event.submitter;

    // Leggi i valori ORIGINALI dal dataset del form
    const originalName = form.dataset.originalName || '';
    const originalOwnerId = form.dataset.originalOwnerId || ''; // Leggi ID originale
    const originalSensorName = form.dataset.originalSensor || 'NONE';
    const originalShuttersJson = form.dataset.originalShutters || '[]';

    // Leggi i valori NUOVI dai campi del form
    const newName = document.getElementById("editHomeName").value.trim();
    const selectedOwnerId = document.getElementById("editHomeOwnerSelect").value; // Legge l'ID dal value=""
    const selectedSensorName = document.getElementById("editHomeSensorSelect").value; // Legge NOME o "NONE"
    const selectedShutterCheckboxes = document.querySelectorAll('#editHomeShuttersList input[type="checkbox"]:checked');
    const selectedShutterNames = Array.from(selectedShutterCheckboxes).map(cb => cb.value).sort(); // Legge NOMI e ordina
    const selectedShuttersJson = JSON.stringify(selectedShutterNames);

    if (!newName) { alert("Please enter the home name."); return; }
    if(saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

    const apiCalls = []; // Array per le chiamate da fare

    // 1. Confronta e prepara PATCH Nome
    if (newName !== originalName) {
        console.log("Change detected for Name");
        apiCalls.push(
            fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName })
                .catch(err => { console.error("Error patching name:", err); throw err; })
        );
    }

    // 2. Confronta e prepara PATCH Owner
    if (selectedOwnerId !== originalOwnerId) {
        console.log("Change detected for Owner");
         // Trova lo username corrispondente all'ID selezionato per inviarlo (come da test backend)
         const ownerSelect = document.getElementById("editHomeOwnerSelect");
         const selectedOwnerOption = ownerSelect.options[ownerSelect.selectedIndex];
         const selectedUsername = selectedOwnerOption ? selectedOwnerOption.text : null; // Prendi lo username dal testo dell'opzione

        // Costruisci payload: { user: { username: ... } } o { user: null }
        const ownerPayload = selectedUsername ? { user: { username: selectedUsername } } : { user: null };
        console.log(`Attempting PATCH /patch/owner/${id} with payload:`, JSON.stringify(ownerPayload, null, 2));
        apiCalls.push(
            fetchApi(`/api/entities/home/patch/owner/${id}`, 'PATCH', ownerPayload) // Path /owner/, payload {user:{username:...}}
                .catch(err => { console.error("Error patching owner:", err); throw err; })
        );
    }

    // 3. Confronta e prepara PATCH Sensore
    if (selectedSensorName !== originalSensorName) {
        // Invia { name: "nome_sensore" } o { name: null } se selezionato "NONE" (come da tua info API)
        // Ma per disassociare potremmo dover inviare { lightSensor: null } ? Chiedere al backend!
        // Per ora, seguiamo l'info e non inviamo nulla se "NONE" è selezionato per evitare 500.
        if (selectedSensorName && selectedSensorName !== "NONE") {
            console.log("Change detected for Sensor: Associating new sensor.");
            sensorPayload = {
                lightSensor: { // <-- Oggetto esterno "lightSensor"
                    name: selectedSensorName // <-- Nome interno
                }
            };
            console.log(`Attempting PATCH /patch/lightSensor/${id} with payload:`, JSON.stringify(sensorPayload, null, 2));
            apiCalls.push(
                fetchApi(`/api/entities/home/patch/lightSensor/${id}`, 'PATCH', sensorPayload)
                    .catch(err => { console.error("Error patching sensor:", err); throw err; })
            );
        } else {
             // L'utente vuole disassociare, ma il backend dava errore 500. Non inviamo nulla.
             console.log("Change detected for Sensor: '-- None --' selected. Skipping PATCH request.");
        }
    }

    // 4. Confronta e prepara PATCH Tapparelle
    if (selectedShuttersJson !== originalShuttersJson) {
         console.log("Change detected for Shutters");
         const shuttersPayload = { rollerShutters: selectedShutterNames.map(name => ({ name: name })) }; // Usa nomi
         console.log(`Attempting PATCH /patch/rollerShutters/${id} with payload:`, JSON.stringify(shuttersPayload, null, 2));
         apiCalls.push(
             fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, 'PATCH', shuttersPayload)
                 .catch(err => { console.error("Error patching shutters:", err); throw err; })
         );
    }

    // Se non ci sono chiamate
    if (apiCalls.length === 0) {
         alert("No changes were detected.");
         if(saveButton) { saveButton.disabled = false; saveButton.textContent = "Save Changes"; }
         return;
    }

    // Esegui solo le chiamate necessarie
    try {
        console.log(`Executing ${apiCalls.length} PATCH call(s)...`);
        await Promise.all(apiCalls);
        alert("Home details updated successfully!");
        cancelEditHome();
        loadAdminHomes();
    } catch (error) {
        console.error("Error updating home details:", error);
        const errorDetails = error.details ? `\nDetails: ${JSON.stringify(error.details)}` : '';
        alert(`Failed to update home details: ${error.message}${errorDetails}`);
    } finally {
        if(saveButton) { saveButton.disabled = false; saveButton.textContent = "Save Changes"; }
    }
}


// Elimina una casa
async function deleteHome(homeId) {
    if (!confirm("Are you sure...?")) { return; }
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
    // Nascondi sezioni admin...
    const adminHomes = document.getElementById("admin-homes"); if (adminHomes) adminHomes.style.display = "none";
    const addHomeForm = document.getElementById("add-home-form"); if (addHomeForm) addHomeForm.style.display = "none";
    const editHomeForm = document.getElementById("edit-home-form"); if(editHomeForm) editHomeForm.style.display = 'none';
    const sensorSection = document.getElementById("admin-sensor-management"); if(sensorSection) sensorSection.style.display = 'none';
    // Mostra sezione routine
    const routinesSection = document.getElementById("Routines-section"); if(routinesSection) routinesSection.style.display = 'block';
    // Imposta titolo e ID nascosto
    const routineTitle = document.getElementById("Routines-section-title"); if(routineTitle) routineTitle.innerText = `Routines for: ${homeName}`;
    const routineHomeIdHidden = document.getElementById("Routines-home-id-hidden"); if(routineHomeIdHidden) routineHomeIdHidden.value = homeId;
    // Chiama la funzione in routines.js
    if (typeof loadRoutines === "function") { loadRoutines(homeId); } else { console.error("loadRoutines function is not defined"); }
}

// ========================================
// GESTIONE SENSORI (Specifica Admin)
// ========================================

// Mostra la sezione gestione sensori per una casa specifica
function showSensorsForHome(homeId, homeName) {
    console.log(`Showing sensors for Home ID: ${homeId}, Name: ${homeName}`);
    // Nascondi sezioni admin...
    const adminHomes = document.getElementById("admin-homes"); if (adminHomes) adminHomes.style.display = "none";
    const addHomeForm = document.getElementById("add-home-form"); if (addHomeForm) addHomeForm.style.display = "none";
    const editHomeForm = document.getElementById("edit-home-form"); if(editHomeForm) editHomeForm.style.display = 'none';
    const routinesSection = document.getElementById("Routines-section"); if(routinesSection) routinesSection.style.display = 'none';
    // Mostra la sezione gestione sensori
    const sensorSection = document.getElementById("admin-sensor-management"); if (!sensorSection) return; sensorSection.style.display = 'block';
    // Imposta titolo e ID nascosto
    const titleElement = document.getElementById("admin-sensor-home-title"); if (titleElement) titleElement.textContent = `Sensors for: ${homeName}`;
    const sensorHomeIdHidden = document.getElementById("admin-sensor-home-id"); if (sensorHomeIdHidden) sensorHomeIdHidden.value = homeId;
    // Nascondi form modifica se era aperto
    const adminEditSensorForm = document.getElementById("admin-edit-light-sensor"); if(adminEditSensorForm) adminEditSensorForm.style.display = 'none';
    // Chiama funzione per caricare i sensori
    adminLoadLightSensors(homeId);
}

// Nasconde la sezione sensori e torna alla lista case admin
function hideSensorsForHome() {
     const sensorSection = document.getElementById("admin-sensor-management"); if(sensorSection) sensorSection.style.display = 'none';
     // Ricarica la vista principale
     loadAdminHomes();
}

// Nasconde il form di modifica sensore admin
function cancelAdminEditSensor() {
    const adminEditSensorForm = document.getElementById("admin-edit-light-sensor"); if(adminEditSensorForm) adminEditSensorForm.style.display = "none";
}

// Carica e visualizza i sensori per una specifica casa (Admin)
async function adminLoadLightSensors(homeId) {
    const sensorList = document.getElementById("admin-sensor-list"); if (!sensorList) return;
    sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";
    const apiPath = '/api/entities/lightSensor/';
    console.log(`adminLoadLightSensors: Fetching from ${apiPath}`);

    try {
        const allSensors = await fetchApi(apiPath);
        let filteredSensors = [];
        // Filtra lato client (ASSUMENDO sensor.home.id)
        if (homeId && allSensors && Array.isArray(allSensors)) {
            filteredSensors = allSensors.filter(sensor => sensor?.home?.id && String(sensor.home.id) === String(homeId));
        }
        console.log(`Found ${filteredSensors.length} sensors for homeId ${homeId}.`, filteredSensors);

        sensorList.innerHTML = "";
        if (filteredSensors.length > 0) {
            filteredSensors.forEach((sensor) => {
                 if (!sensor || !sensor.id) return;
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
                li.id = `admin-sensor-item-${sensor.id}`;
                const numericValue = sensor.value ?? sensor.opening ?? null; // VERIFICARE!
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
        } else { sensorList.innerHTML = "<li class='list-group-item'>No sensors assigned to this home.</li>"; }
    } catch (error) {
        console.error("adminLoadLightSensors Error:", error);
        sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${error.message}</li>`;
     }
}

// Mostra il form di modifica specifico per admin
function adminShowEditSensorForm(id, name, currentValue) {
    console.log(`Editing sensor ID: ${id}, Name: ${name}, Value: ${currentValue}`);
    document.getElementById("admin-sensorEditId").value = id;
    document.getElementById("admin-editSensorName").value = name;
    document.getElementById("admin-editSensorValue").value = currentValue !== null ? currentValue : "";

    const adminEditForm = document.getElementById("admin-edit-light-sensor"); if(adminEditForm) adminEditForm.style.display = "block";
}

// Aggiunge un nuovo sensore (SOLO CREAZIONE)
async function adminCreateLightSensor(event) {
    event.preventDefault();
    const nameInput = document.getElementById("admin-newSensorName");
    const homeId = document.getElementById("admin-sensor-home-id").value;
    const addButton = event.submitter;
    const name = nameInput.value.trim();

    if (!name) { alert("Please enter sensor name."); return; }
    if (!homeId) { console.error("Home ID missing in adminCreateLightSensor"); return; }
    if(addButton) { addButton.disabled = true; addButton.textContent = 'Adding...'; }

    try {
        console.log(`Creating sensor with name: ${name}`);
        await fetchApi('/api/entities/lightSensor/create', 'POST', { name: name }); // SOLO NOME

        alert("Light sensor created successfully! Associate it via the 'Edit Home' form.");
        nameInput.value = "";
        adminLoadLightSensors(homeId); // Ricarica lista (ma non lo vedrai finché non associato)
        console.warn("Newly created sensor needs association via 'Edit Home'.");

    } catch (error) {
        console.error("Error creating sensor via admin:", error);
        alert(`Error creating sensor: ${error.message}`);
     } finally {
         if(addButton) { addButton.disabled = false; addButton.textContent = '+ Add Sensor'; }
     }
}

// Salva le modifiche al sensore fatte nel form admin
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

    // TODO: Aggiungere confronto con valore originale prima di aggiungere a apiPromises

    // PATCH Nome
    if (newName) { // TODO: Confronta con originale
        apiPromises.push(
            fetchApi(`/api/entities/lightSensor/patch/name/${id}`, "PATCH", { name: newName })
                .catch(err => { /*...*/ throw err; })
        );
    }
    // PATCH Valore
    if (newValueStr) { // TODO: Confronta con originale
        const newValue = parseInt(newValueStr, 10);
        if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
            apiPromises.push(
                fetchApi(`/api/entities/lightSensor/patch/value/${id}`, "PATCH", { value: newValue }) // Usa /patch/value/ e campo 'value'
                    .catch(err => { /*...*/ throw err; })
            );
        } else { alert("Invalid value percentage (0-100). Value not updated."); }
    }

    if (apiPromises.length === 0) { alert("No valid changes detected or fields were empty."); return; } // Modificato messaggio
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
    try {
        await fetchApi(`/api/entities/lightSensor/delete/${sensorId}`, "DELETE");
        alert("Sensor deleted successfully!");
        adminLoadLightSensors(homeId);
    } catch (error) {
        console.error(`Error deleting sensor (ID: ${sensorId}):`, error);
        alert(`Error deleting sensor: ${error.message}`);
     }
}

// ========================================
// FINE js/admin.js
// ========================================