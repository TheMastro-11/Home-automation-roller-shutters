// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Auth check & logout
  if (typeof checkAuthentication === 'function') {
    if (!checkAuthentication()) return;
  } else {
    console.error("checkAuthentication is missing");
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn && typeof logout === 'function') {
    logoutBtn.addEventListener('click', logout);
  }

  // 2) Wire up all forms/buttons
  attachFormListeners();

  // 3) Initial data load
  loadHomes();
  loadGlobalLightSensors();
  loadGlobalRollerShutters();
  loadRoutines(); // Funzione da routines.js
});

function attachFormListeners() {
  // Manage Homes
  document.getElementById('add-home-form')?.addEventListener('submit', addHome);
  document.getElementById('edit-home-form')?.querySelector('form') // Listener per il form di modifica dettagli casa
    ?.addEventListener('submit', submitEditHome); // Funzione che gestisce il salvataggio

  // Global Sensors & Shutters
  document.getElementById('global-add-sensor-form')
    ?.addEventListener('submit', globalCreateLightSensor);
  document.getElementById('global-add-shutter-form')
    ?.addEventListener('submit', globalCreateRollerShutter);

  // Home selector
  document.getElementById('homeSelect')
    ?.addEventListener('change', onHomeChange);

  // Routines form (submit gestito in routines.js)

  // Listener per i form specifici di modifica sensore/tapparella
  document.getElementById('edit-home-sensor-form')?.querySelector('form')
    ?.addEventListener('submit', submitEditHomeSensor);
  document.getElementById('edit-home-shutter-form')?.querySelector('form')
    ?.addEventListener('submit', submitEditHomeShutter);
}

async function loadHomes() {
  const select = document.getElementById('homeSelect');
  const homeList = document.getElementById('manage-homes-list'); // ID Aggiornato
  if (!select || !homeList) {
    console.error("Cannot find #homeSelect or #manage-homes-list");
    return;
  }

  select.innerHTML = `<option disabled>Loading...</option>`;
  homeList.innerHTML = `<li class="list-group-item">Loading...</li>`;

  try {
    const homes = await fetchApi('/api/entities/home/'); // Lista case OK
    select.innerHTML = `<option disabled selected>Select a home…</option>`; // Testo Inglese
    homeList.innerHTML = '';
    homes.forEach(home => {
      // dropdown
      const opt = document.createElement('option');
      opt.value = home.id;
      opt.textContent = home.name;
      select.append(opt);
      // manage list
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';
      li.id = `home-item-${home.id}`;
      // Ripristinati testi bottoni in Inglese
      li.innerHTML = `
        <span class="me-auto">${home.name}</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-warning"
            onclick="showEditHomeForm('${home.id}','${home.name.replace(/'/g, "\\'")}')">
            Edit Details
          </button>
          <button class="btn btn-danger"
            onclick="deleteHome('${home.id}')">
            Delete Home
          </button>
           <button class="btn btn-info"
            onclick="showSensorsForHome('${home.id}','${home.name.replace(/'/g, "\\'")}')">
            Manage Sensors
          </button>
          <button class="btn btn-primary"
            onclick="showShuttersForHome('${home.id}','${home.name.replace(/'/g, "\\'")}')">
            Manage Shutters
          </button>
        </div>
      `;
      homeList.append(li);
    });
  } catch (err) {
    console.error('Error loading homes:', err);
    select.innerHTML = `<option disabled>Error loading homes</option>`;
    homeList.innerHTML = `<li class="list-group-item text-danger">${err.message}</li>`;
  }
}

function onHomeChange(event) {
  const homeId = event.target.value;
  const sensorStatusSection = document.getElementById('sensor-status');
  const shutterStatusSection = document.getElementById('shutters-status');

  if (!homeId) {
    if (shutterStatusSection) shutterStatusSection.style.display = 'none';
    if (sensorStatusSection) sensorStatusSection.style.display = 'none';
    return;
  };

  if (shutterStatusSection) shutterStatusSection.style.display = 'block';
  if (sensorStatusSection) sensorStatusSection.style.display = 'block';

  // Carica dispositivi per il controllo (da shutters.js e visualizzazione sensori)
  if (typeof loadRollerShutters === 'function') {
    loadRollerShutters(homeId); // Da shutters.js per controllo
  } else { console.error("loadRollerShutters function not found (expected in shutters.js)"); }

  // Visualizzazione sensori in #sensor-status/#light-sensors-list
  const sensorDisplayList = document.getElementById('light-sensors-list');
  if (sensorDisplayList) {
    sensorDisplayList.innerHTML = '<li class="list-group-item">Loading sensors...</li>';
    // Usa l'API di lista filtrando lato client o server se possibile
    fetchApi('/api/entities/lightSensor/') // Prendi tutti
      .then(sensors => {
        sensorDisplayList.innerHTML = '';
        // Filtra quelli associati a homeId (se l'API non lo fa già)
        const homeSensors = sensors.filter(s => s.home && s.home.id == homeId); // Assumi che l'API di lista includa 'home.id'
        if (homeSensors && homeSensors.length > 0) {
          homeSensors.forEach(s => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `${s.name}: ${s.lightValue ?? s.value ?? 'N/A'}%`;
            sensorDisplayList.appendChild(li);
          });
        } else {
          sensorDisplayList.innerHTML = '<li class="list-group-item">No associated sensors.</li>'; // Testo Inglese
        }
      }).catch(err => {
        console.error("Error loading sensors for display:", err);
        sensorDisplayList.innerHTML = `<li class="list-group-item text-danger">Error loading sensors.</li>`; // Testo Inglese
      });
  } else {
    console.warn("#light-sensors-list element not found for display.");
  }
}

// Aggiunge una nuova casa
async function addHome(event) {
  event.preventDefault();
  const homeNameInput = document.getElementById("newHomeName");
  const homeName = homeNameInput.value.trim();
  const addButton = event.submitter;

  if (!homeName) { alert("Please enter a home name."); return; }
  if (addButton) addButton.disabled = true;

  try {
    await fetchApi("/api/entities/home/create", "POST", { name: homeName });
    alert("Home added successfully!");
    homeNameInput.value = "";
    loadHomes(); // Ricarica la lista
  } catch (error) {
    console.error("Error adding home:", error);
    alert(`Failed to add home: ${error.message}`);
  } finally {
    if (addButton) {
      addButton.disabled = false;
      // Assicurati che il testo originale del bottone sia corretto
      addButton.textContent = '+ Add';
    }
  }
}

// ========================================
// FUNZIONI PER FORM "EDIT HOME DETAILS"
// ========================================

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
          option.value = user.id;
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
          option.value = sensor.name;
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

async function loadAvailableShuttersForEditHome(containerElementId, originalShutterNames = []) {
  const container = document.getElementById(containerElementId);
  const loadingMsg = document.getElementById("editHomeShuttersLoading");
  if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }
  if (loadingMsg) loadingMsg.textContent = "Loading..."; else container.innerHTML = "";
  const apiPath = '/api/entities/rollerShutter/';
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
  // Nasconde sezioni che non servono durante l’editing
  document.getElementById("global-devices-section")?.style.setProperty("display", "none");
  document.getElementById("Routines-section")?.style.setProperty("display", "none");
  document.getElementById("manage-sensors-section")?.style.setProperty("display", "none");
  document.getElementById("manage-shutters-section")?.style.setProperty("display", "none");
  document.getElementById("home-selection-div")?.style.setProperty("display", "none");

  // Mostra il form di edit
  const editHomeDiv = document.getElementById("edit-home-form");
  if (!editHomeDiv) return;

  const editHomeInnerForm = editHomeDiv.querySelector("form");
  if (!editHomeInnerForm) {
    console.error("Inner form not found in #edit-home-form");
    return;
  }

  // Popola campi base
  document.getElementById("editHomeId").value = homeId;
  document.getElementById("editHomeTitle").innerText = `Edit details – ${homeName}`;
  document.getElementById("editHomeName").value = homeName;

  editHomeDiv.style.display = "block";

  /* ---------- caricamento dati dinamici ---------- */
  const ownerSelect   = document.getElementById("editHomeOwnerSelect");
  const sensorSelect  = document.getElementById("editHomeSensorSelect");
  const shuttersList  = document.getElementById("editHomeShuttersList");

  ownerSelect && (ownerSelect.innerHTML  = '<option>Loading...</option>');
  sensorSelect && (sensorSelect.innerHTML = '<option>Loading...</option><option value="NONE">-- None --</option>');
  shuttersList && (shuttersList.innerHTML = '<p id="editHomeShuttersLoading">Loading...</p>');

  // Recupera i dettagli attuali della casa (work-around 403 → usa /home/ list)
  let currentOwnerId       = null;
  let currentSensorName    = null;
  let originalShutterNames = [];

  try {
    const allHomes = await fetchApi("/api/entities/home/");
    const homeDetails = Array.isArray(allHomes) ? allHomes.find(h => h?.id == homeId) : null;

    if (homeDetails) {
      currentOwnerId       = homeDetails.owner?.id || null;
      currentSensorName    = homeDetails.lightSensor?.name || null;
      originalShutterNames = (homeDetails.rollerShutters || []).map(rs => rs.name).filter(Boolean);

      // salva le versioni “originali” per il confronto nel submit
      editHomeInnerForm.dataset.originalName     = homeName;
      editHomeInnerForm.dataset.originalOwnerId  = currentOwnerId || "";
      editHomeInnerForm.dataset.originalSensor   = currentSensorName || "NONE";
      editHomeInnerForm.dataset.originalShutters = JSON.stringify([...originalShutterNames].sort());
    } else {
      console.error(`Home details for ID ${homeId} not found in list`);
      editHomeInnerForm.dataset.originalOwnerId  = "";
      editHomeInnerForm.dataset.originalSensor   = "NONE";
      editHomeInnerForm.dataset.originalShutters = "[]";
    }
  } catch (e) {
    console.error("Error fetching home list:", e);
    alert("Error fetching home details: " + e.message);
    editHomeDiv.style.display = "none";
    return;
  }

  // Popola select/checkbox con i dati ottenuti
  ownerSelect  && loadUsersForOwnerSelect("editHomeOwnerSelect", currentOwnerId);
  sensorSelect && loadAvailableSensorsForEditHome("editHomeSensorSelect", currentSensorName);
  shuttersList && loadAvailableShuttersForEditHome("editHomeShuttersList", originalShutterNames);
}



// Annulla la modifica della casa e torna alla lista
function cancelEditHome() {
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = "none";
  // Mostra di nuovo le sezioni principali
   const addHomeFormEl = document.getElementById("add-home-form");
  if (addHomeFormEl) addHomeFormEl.style.display = "block";
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';

  // ---> QUESTA RIGA MANCAVA NEL CODICE CHE HAI INVIATO <---
  const homeSelectionDiv = document.getElementById("home-selection-div"); if (homeSelectionDiv) homeSelectionDiv.style.display = 'block';


  loadHomes(); // Ricarica la lista principale
}

// Salva le modifiche della casa
async function submitEditHome(event) {
  event.preventDefault();
  const form = event.target; // Questo è il form stesso
  const id = document.getElementById("editHomeId").value;
  const saveButton = form.querySelector('button.btn-primary'); // Bottone Save dentro il form

  const originalName = form.dataset.originalName || '';
  const originalOwnerId = form.dataset.originalOwnerId || '';
  const originalSensorName = form.dataset.originalSensor || 'NONE';
  const originalShuttersJson = form.dataset.originalShutters || '[]';

  const newName = document.getElementById("editHomeName").value.trim();
  const ownerSelect = document.getElementById("editHomeOwnerSelect");
  const sensorSelect = document.getElementById("editHomeSensorSelect");
  const selectedOwnerId = ownerSelect ? ownerSelect.value : null; // Usa null se non esiste
  const selectedSensorName = sensorSelect ? sensorSelect.value : null; // Usa null se non esiste
  const selectedShutterCheckboxes = document.querySelectorAll('#editHomeShuttersList input[type="checkbox"]:checked');
  const selectedShutterNames = Array.from(selectedShutterCheckboxes).map(cb => cb.value).sort();
  const selectedShuttersJson = JSON.stringify(selectedShutterNames);

  if (!newName) { alert("Please enter home name."); return; }
  if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

  const apiCalls = [];
  const callsInfo = [];

  // 1. Name patch
  if (newName !== originalName) {
    callsInfo.push({ path: `/patch/name/${id}`, payload: { name: newName } });
    apiCalls.push(fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName }));
  }
  // 2. Owner patch (Controlla esistenza di ownerSelect)
  if (ownerSelect && selectedOwnerId !== originalOwnerId) {
    if (selectedOwnerId) { // Associa nuovo owner
      const selectedUsername = ownerSelect.selectedOptions[0].text;
      callsInfo.push({ path: `/patch/owner/${id}`, payload: { user: { username: selectedUsername } } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/owner/${id}`, "PATCH", { user: { username: selectedUsername } }));
    } else { // Dissocia owner
      callsInfo.push({ path: `/patch/owner/${id}`, payload: { user: null } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/owner/${id}`, "PATCH", { user: null }));
    }
  }
  // 3. Sensor patch (Controlla esistenza di sensorSelect)
  if (sensorSelect && selectedSensorName !== originalSensorName) {
    if (selectedSensorName && selectedSensorName !== "NONE") { // Associa/cambia sensore
      callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: { name: selectedSensorName } } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: { name: selectedSensorName } }));
    } else { // Dissocia sensore (selectedSensorName è null o "NONE")
      callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: null } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: null }));
    }
  }
  // 4. Shutters patch
  if (selectedShuttersJson !== originalShuttersJson) {
    const payload = { rollerShutters: selectedShutterNames.map(n => ({ name: n })) }; // Assumi che il backend voglia oggetti {name:..}
    callsInfo.push({ path: `/patch/rollerShutters/${id}`, payload });
    apiCalls.push(fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, "PATCH", payload));
  }

  if (apiCalls.length === 0) {
    alert("No changes detected.");
    if (saveButton) { saveButton.disabled = false; saveButton.textContent = "Save"; } // Testo Inglese
    return;
  }

  try {
    console.log(`Executing ${apiCalls.length} calls:`, callsInfo);
    await Promise.all(apiCalls);
    alert("Home details updated successfully!");
    cancelEditHome();
  } catch (error) {
    console.error(error);
    alert(`Failed to update: ${error.message}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save"; // Testo Inglese
    }
  }
}


// Elimina una casa
async function deleteHome(homeId) {
  if (!confirm("Are you sure you want to delete this home? This action might also delete associated devices and routines depending on backend logic.")) { return; }
  try {
    await fetchApi(`/api/entities/home/delete/${homeId}`, "DELETE");
    alert("Home deleted successfully!");
    loadHomes(); // Ricarica la lista
  } catch (error) {
    console.error("Error deleting home:", error);
    alert(`Failed to delete home: ${error.message}`);
  }
}

// ========================================
// GESTIONE ROUTINE (Navigazione)
// ========================================

function showAllRoutinesView() {
  console.log("Showing All Routines view");
  // Nascondi altre sezioni principali
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const manageSensorsSectionEl = document.getElementById("manage-sensors-section"); if (manageSensorsSectionEl) manageSensorsSectionEl.style.display = 'none';
  const manageShuttersSectionEl = document.getElementById("manage-shutters-section"); if (manageShuttersSectionEl) manageShuttersSectionEl.style.display = 'none';

  // Mostra sezione routine
  const routinesSectionEl = document.getElementById("Routines-section");
  if (!routinesSectionEl) { console.error("#Routines-section not found!"); return; }
  routinesSectionEl.style.display = 'block';

  if (typeof loadRoutines === 'function') {
    loadRoutines(); // Funzione da routines.js
  } else { console.error("loadRoutines function not found (expected in routines.js)"); }
}

// ========================================
// GESTIONE SENSORI ASSOCIATI ALLA CASA
// ========================================

// Mostra la sezione gestione sensori per una casa specifica
function showSensorsForHome(homeId, homeName) {
  console.log(`Showing sensors for Home ID: ${homeId}, Name: ${homeName}`);
  // Nascondi altre sezioni principali
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const manageShuttersSectionEl = document.getElementById("manage-shutters-section"); if (manageShuttersSectionEl) manageShuttersSectionEl.style.display = 'none';

  // Mostra la sezione gestione sensori
  const sensorSectionEl = document.getElementById("manage-sensors-section"); if (!sensorSectionEl) return; sensorSectionEl.style.display = 'block';

  // Imposta titolo e ID nascosto
  const titleElement = document.getElementById("manage-sensors-title"); if (titleElement) titleElement.textContent = `Sensors for: ${homeName}`; // Testo Inglese
  const sensorHomeIdHidden = document.getElementById("manage-sensors-home-id"); if (sensorHomeIdHidden) sensorHomeIdHidden.value = homeId;

  // Nascondi form modifica se era aperto
  const editSensorFormEl = document.getElementById("edit-home-sensor-form"); if (editSensorFormEl) editSensorFormEl.style.display = 'none';

  loadHomeSensors(homeId); // Funzione aggiornata
}

// Nasconde la sezione sensori e torna alla lista case
function hideSensorsForHome() {
  const sensorSectionEl = document.getElementById("manage-sensors-section"); if (sensorSectionEl) sensorSectionEl.style.display = 'none';
  // Mostra di nuovo le sezioni principali
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "block";
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';

  loadHomes(); // Ricarica la vista principale
}

// Nasconde il form di modifica sensore
function cancelEditHomeSensor() {
  const editSensorFormEl = document.getElementById("edit-home-sensor-form"); if (editSensorFormEl) editSensorFormEl.style.display = "none";
}

// Carica e visualizza i sensori ASSOCIATI a una specifica casa
async function loadHomeSensors(homeId) { // Nome funzione lasciato con L maiuscola come nel codice precedente
  const sensorList = document.getElementById("manage-sensors-list");
  if (!sensorList) { console.error("Element '#manage-sensors-list' not found."); return; }
  sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";

  try {
    let sensors = [];
    // Prova a caricare direttamente i dettagli della casa, che dovrebbero includere il sensore
    console.log(`Fetching details for home ${homeId} to get associated sensor...`);
    const homeDetails = await fetchApi(`/api/entities/home/${homeId}`); // Richiesta diretta che potrebbe fallire con 403

    if (homeDetails && homeDetails.lightSensor) {
      sensors = [homeDetails.lightSensor]; // Metti il sensore trovato in un array
      console.log("Sensor found via home details:", sensors);
    } else {
      console.log(`No light sensor found via home details DTO for homeId ${homeId}.`);
      sensors = [];
      // WORKAROUND se la chiamata sopra fallisce con 403: Filtra dalla lista globale
      try {
        console.warn(`Falling back to filtering global sensor list due to potential issue fetching home ${homeId} details.`);
        const allSensors = await fetchApi('/api/entities/lightSensor/');
        sensors = allSensors.filter(s => s.home && s.home.id == homeId); // Assumendo che /lightSensor/ includa 'home.id'
        console.log("Sensors found via fallback global list filter:", sensors);
      } catch (listError) {
        console.error("Failed to fetch global sensor list as fallback:", listError);
        sensors = []; // Mantieni vuoto se anche il fallback fallisce
      }
    }


    sensorList.innerHTML = "";

    if (sensors.length > 0) {
      sensors.forEach(sensor => {
        if (!sensor || !sensor.id) { console.warn("Skipping sensor with missing data:", sensor); return; }
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.id = `sensor-item-${sensor.id}`;
        const value = sensor.value ?? sensor.lightValue ?? 'N/A';
        // Testi Inglese
        li.innerHTML = `
                <div><strong>${sensor.name}</strong> — Value: ${value}%</div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-warning"
                    onclick="showEditHomeSensorForm('${sensor.id}','${sensor.name}',${value})">
                    Edit
                  </button>
                  <button class="btn btn-danger"
                    onclick="deleteHomeSensor('${sensor.id}','${homeId}')">
                    Delete / Dissociate
                  </button>
                </div>`;
        sensorList.appendChild(li);
      });
    } else {
      sensorList.innerHTML = "<li class='list-group-item'>No light sensor associated with this home.</li>"; // Testo Inglese
    }

  } catch (err) {
    // Se l'errore originale era il 403 sulla chiamata diretta, il fallback potrebbe aver funzionato.
    // Se anche il fallback fallisce o l'errore è diverso, mostriamo l'errore.
    if (sensorList.innerHTML.includes("Loading")) { // Mostra errore solo se il fallback non ha popolato la lista
      console.error("Error loading sensors for home (after potential fallback):", err);
      sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${err.message}</li>`; // Testo Inglese
    }
  }
}


// Mostra il form di modifica specifico per un sensore di casa
function showEditHomeSensorForm(id, name, currentValue) {
  document.getElementById("edit-home-sensor-id").value = id;
  document.getElementById("edit-home-sensor-name").value = name;
  document.getElementById("edit-home-sensor-value").value = currentValue !== null ? currentValue : "";
  const editFormEl = document.getElementById("edit-home-sensor-form"); if (editFormEl) editFormEl.style.display = "block";
}

// Salva le modifiche al sensore fatte nel form di modifica casa
async function submitEditHomeSensor(event) {
  event.preventDefault();
  const id = document.getElementById("edit-home-sensor-id").value;
  const nameInput = document.getElementById("edit-home-sensor-name");
  const valueInput = document.getElementById("edit-home-sensor-value");
  const homeId = document.getElementById("manage-sensors-home-id").value;
  const saveButton = event.submitter;

  const newName = nameInput.value.trim();
  const newValueStr = valueInput.value.trim();
  const apiPromises = [];

  // console.warn("TODO: Implement change detection in submitEditHomeSensor");

  // PATCH Nome
  if (newName) { // TODO: Confronta con originale
    apiPromises.push(fetchApi(`/api/entities/lightSensor/patch/name/${id}`, "PATCH", { name: newName }).catch(err => { throw err; }));
  }
  // PATCH Valore
  if (newValueStr) { // TODO: Confronta con originale
    const newValue = parseInt(newValueStr, 10);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
      // console.warn("Backend patchValueLightSensor ADDS value instead of setting it! Needs fix.");
      apiPromises.push(fetchApi(`/api/entities/lightSensor/patch/value/${id}`, "PATCH", { value: newValue }).catch(err => { throw err; }));
    } else { alert("Invalid value percentage (0-100). Value not updated."); }
  }

  if (apiPromises.length === 0) { alert("No valid changes detected."); return; }
  if (saveButton) { saveButton.disabled = true; saveButton.textContent = 'Saving...'; }

  try {
    await Promise.all(apiPromises);
    alert("Sensor updated successfully!");
    cancelEditHomeSensor(); // Chiude form
    loadHomeSensors(homeId); // Ricarica lista
  } catch (error) {
    console.error("Error updating sensor:", error);
    alert(`Error updating sensor: ${error.message}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Sensor Changes'; // Testo Inglese
    }
  }
}

// Elimina/Dissocia un sensore associato a una casa
async function deleteHomeSensor(sensorId, homeId) {
  if (!confirm("Are you sure you want to dissociate and delete this sensor? This action is permanent.")) return; // Testo Inglese

  const deleteBtn = document.querySelector(`#sensor-item-${sensorId} button.btn-danger`);
  deleteBtn?.setAttribute("disabled", "true");

  try {
    // 1) Dissocia (PATCH sulla casa)
    await fetchApi(
      `/api/entities/home/patch/lightSensor/${homeId}`,
      "PATCH",
      { lightSensor: null }
    );
    console.log(`Sensor dissociated from home ${homeId}`);

    // 2) Elimina globalmente (DELETE sul sensore)
    await fetchApi(
      `/api/entities/lightSensor/delete/${sensorId}`,
      "DELETE"
    );
    console.log(`Sensor ${sensorId} deleted globally`);

    alert("Sensor dissociated and deleted successfully!"); // Testo Inglese
    loadHomeSensors(homeId); // Ricarica lista

  } catch (err) {
    console.error("Error deleting/dissociating sensor:", err);
    alert("Failed to delete/dissociate sensor: " + err.message); // Testo Inglese
    deleteBtn?.removeAttribute("disabled");
  }
}

// ========================================
// GESTIONE TAPPARELLE ASSOCIATE ALLA CASA
// ========================================

// Mostra la sezione gestione tapparelle per una casa specifica
function showShuttersForHome(homeId, homeName) {
  console.log(`Showing shutters for Home ID: ${homeId}, Name: ${homeName}`);
  // Nascondi altre sezioni principali
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
  const manageSensorsSectionEl = document.getElementById("manage-sensors-section"); if (manageSensorsSectionEl) manageSensorsSectionEl.style.display = 'none';

  // Mostra la sezione gestione tapparelle
  const shutterSectionEl = document.getElementById("manage-shutters-section"); if (!shutterSectionEl) return; shutterSectionEl.style.display = 'block';

  // Imposta titolo
  const titleElement = document.getElementById("manage-shutters-title"); if (titleElement) titleElement.textContent = `Shutters for: ${homeName}`; // Testo Inglese

  // Nascondi form modifica nome tapparella se era aperto
  const editShutterFormEl = document.getElementById("edit-home-shutter-form"); if (editShutterFormEl) editShutterFormEl.style.display = 'none';

  loadHomeShuttersForManagement(homeId); // Funzione aggiornata
}

// Nasconde la sezione tapparelle e torna alla lista case
function hideShuttersForHome() {
  const shutterSectionEl = document.getElementById("manage-shutters-section"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
  // Mostra di nuovo le sezioni principali
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "block";
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';

  loadHomes(); // Ricarica vista principale
}

// Carica e visualizza le tapparelle ASSOCIATE (con bottoni Edit/Dissociate)
async function loadHomeShuttersForManagement(homeId) {
  const shutterListUl = document.getElementById("manage-shutters-list");
  if (!shutterListUl) { console.error("Element '#manage-shutters-list' not found."); return; }
  shutterListUl.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

  try {
    let associatedShutters = [];
    // Ricarica dettagli casa specifica - ** USA WORKAROUND SE NECESSARIO **
    console.log(`Fetching details for home ${homeId} to get associated shutters...`);
    let homeDetails = null;
    try {
      homeDetails = await fetchApi(`/api/entities/home/${homeId}`); // Prova chiamata diretta
      console.log("Home details fetched successfully:", homeDetails);
    } catch (detailsError) {
      if (detailsError.status === 403) {
        console.warn(`Falling back to fetching home list for shutters due to 403 on /api/entities/home/${homeId}.`);
        const allHomes = await fetchApi('/api/entities/home/');
        if (allHomes && Array.isArray(allHomes)) {
          homeDetails = allHomes.find(h => h?.id == homeId);
          console.log("Home details found via fallback list fetch:", homeDetails);
        }
      } else {
        throw detailsError; // Rilancia altri errori
      }
    }

    if (homeDetails && homeDetails.rollerShutters) {
      associatedShutters = homeDetails.rollerShutters;
    } else {
      console.log(`No roller shutters found for homeId ${homeId} (or home details inaccessible).`);
      associatedShutters = [];
    }

    shutterListUl.innerHTML = ""; // Pulisci lista

    if (associatedShutters.length === 0) {
      shutterListUl.innerHTML = "<li class='list-group-item'>No shutters currently associated.</li>"; // Testo Inglese
      return;
    }

    associatedShutters.forEach(shutter => {
      if (!shutter || !shutter.id || !shutter.name) { console.warn("Skipping invalid shutter:", shutter); return; }
      const shutterId = shutter.id;
      const shutterName = shutter.name;
      const opening = shutter.percentageOpening ?? shutter.opening ?? "N/A";

      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
      li.id = `shutter-item-${shutterId}`;

      const infoDiv = document.createElement("div");
      infoDiv.style.marginRight = "10px";
      infoDiv.innerHTML = `<strong>${shutterName}</strong> - Opening: ${opening}%`;

      const btnDiv = document.createElement("div");
      btnDiv.className = "mt-1 mt-sm-0 btn-group btn-group-sm";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-warning";
      editBtn.textContent = "Edit Name"; // Testo Inglese
      editBtn.onclick = () => showEditHomeShutterForm(String(shutterId), shutterName, String(homeId));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-danger";
      deleteBtn.textContent = "Dissociate"; // Testo Inglese per dissociazione
      deleteBtn.onclick = () => deleteManagedRollerShutter(String(shutterId), String(homeId));

      btnDiv.append(editBtn, deleteBtn);
      li.append(infoDiv, btnDiv);
      shutterListUl.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading associated shutters for management view:", err);
    shutterListUl.innerHTML = `<li class='list-group-item text-danger'>Error loading shutters: ${err.message}</li>`; // Testo Inglese
  }
}

// ========================================
// FUNZIONI GLOBALI AGGIUNTA / EDIT INLINE / DELETE
// ========================================

// --- LIGHT SENSOR ---

// Carica e mostra l’elenco dei sensori globali
async function loadGlobalLightSensors() {
  const container = document.getElementById('global-sensors-list');
  if (!container) { console.error("Element '#global-sensors-list' not found."); return; }
  container.innerHTML = '<li class="list-group-item">Loading...</li>';

  try {
    const sensors = await fetchApi('/api/entities/lightSensor/');
    if (!Array.isArray(sensors) || sensors.length === 0) {
      container.innerHTML = '<li class="list-group-item">No global sensors defined.</li>'; // Testo Inglese
      return;
    }
    container.innerHTML = '';

    sensors.forEach(s => {
      if (!s || !s.id) return;
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.id = `global-sensor-${s.id}`;

      const span = document.createElement('span');
      span.textContent = s.name || `Sensor ID: ${s.id}`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning';
      editBtn.textContent = 'Edit'; // Testo Inglese
      editBtn.onclick = () => globalShowEditLightSensorForm(s.id, s.name || '');

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Delete'; // Testo Inglese
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


// Visualizza inline il form di edit per un sensore globale
function globalShowEditLightSensorForm(id, currentName) {
  const li = document.getElementById(`global-sensor-${id}`);
  if (!li) return;
  const originalContent = li.innerHTML;

  li.innerHTML = `
    <input
      type="text"
      id="global-edit-input-sensor-${id}"
      class="form-control form-control-sm d-inline-block w-auto me-2"
      value="${currentName}"
    />
  `;

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm d-inline-block';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save'; // Testo Inglese
  saveBtn.onclick = async () => {
    const inputEl = document.getElementById(`global-edit-input-sensor-${id}`);
    const newName = inputEl ? inputEl.value.trim() : '';
    if (!newName) { alert('Please enter a valid name'); return; } // Testo Inglese
    try {
      saveBtn.disabled = true;
      await fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName });
      await loadGlobalLightSensors();
    } catch (err) {
      console.error('Error patching sensor:', err); // Testo Inglese
      alert(`Error: ${err.message}`);
      li.innerHTML = originalContent;
      saveBtn.disabled = false;
    }
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel'; // Testo Inglese
  cancelBtn.onclick = () => { li.innerHTML = originalContent; };

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup);
}


// Crea un nuovo sensore globale
async function globalCreateLightSensor(event) {
  event.preventDefault();
  const nameInput = document.getElementById('global-newSensorName');
  const sensorName = nameInput.value.trim();
  if (!sensorName) { alert('Please enter a sensor name'); return; } // Testo Inglese

  const submitBtn = event.submitter;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
  }

  try {
    await fetchApi('/api/entities/lightSensor/create', 'POST', { name: sensorName });
    await loadGlobalLightSensors();
    nameInput.value = '';
  } catch (err) {
    console.error('Error creating light sensor:', err);
    alert(`Error: ${err.message}`); // Testo Inglese
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Add Sensor'; // Testo Inglese
    }
  }
}

// Elimina un sensore globale
async function globalDeleteLightSensor(id) {
  if (!confirm('Are you sure you want to delete this global sensor? This may also remove it from associated homes and routines.')) return; // Testo Inglese
  try {
    await fetchApi(`/api/entities/lightSensor/delete/${id}`, 'DELETE');
    await loadGlobalLightSensors();
  } catch (err) {
    console.error('Error deleting global light sensor:', err);
    alert(`Error: ${err.message}`); // Testo Inglese
  }
}


// --- ROLLER SHUTTER ---

// Carica e mostra l’elenco delle tapparelle globali
async function loadGlobalRollerShutters() {
  const container = document.getElementById('global-shutters-list');
  if (!container) { console.error("Element '#global-shutters-list' not found."); return; }
  container.innerHTML = '<li class="list-group-item">Loading...</li>';

  try {
    const shutters = await fetchApi('/api/entities/rollerShutter/');
    if (!Array.isArray(shutters) || shutters.length === 0) {
      container.innerHTML = '<li class="list-group-item">No global shutters defined.</li>'; // Testo Inglese
      return;
    }
    container.innerHTML = '';

    shutters.forEach(s => {
      if (!s || !s.id) return;
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.id = `global-shutter-${s.id}`;

      const span = document.createElement('span');
      span.textContent = s.name || `Shutter ID: ${s.id}`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning';
      editBtn.textContent = 'Edit'; // Testo Inglese
      editBtn.onclick = () => globalShowEditRollerShutterForm(s.id, s.name || '');

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Delete'; // Testo Inglese
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


// Visualizza inline il form di edit per una tapparella globale
function globalShowEditRollerShutterForm(id, currentName) {
  const li = document.getElementById(`global-shutter-${id}`);
  if (!li) return;
  const originalContent = li.innerHTML;

  li.innerHTML = `
    <input
      type="text"
      id="global-edit-input-shutter-${id}"
      class="form-control form-control-sm d-inline-block w-auto me-2"
      value="${currentName}"
    />
  `;

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm d-inline-block';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save'; // Testo Inglese
  saveBtn.onclick = async () => {
    const inputEl = document.getElementById(`global-edit-input-shutter-${id}`);
    const newName = inputEl ? inputEl.value.trim() : '';
    if (!newName) { alert('Please enter a valid name'); return; } // Testo Inglese
    try {
      saveBtn.disabled = true;
      await fetchApi(`/api/entities/rollerShutter/patch/name/${id}`, 'PATCH', { name: newName });
      await loadGlobalRollerShutters();
    } catch (err) {
      console.error('Error patching shutter:', err); // Testo Inglese
      alert(`Error: ${err.message}`);
      li.innerHTML = originalContent;
      saveBtn.disabled = false;
    }
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel'; // Testo Inglese
  cancelBtn.onclick = () => { li.innerHTML = originalContent; };

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup);
}

// Crea una nuova tapparella globale
async function globalCreateRollerShutter(event) {
  event.preventDefault();
  const nameInput = document.getElementById('global-newShutterName');
  const shutterName = nameInput.value.trim();
  if (!shutterName) { alert('Please enter a shutter name'); return; } // Testo Inglese

  const submitBtn = event.submitter;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
  }

  try {
    await fetchApi('/api/entities/rollerShutter/create', 'POST', { name: shutterName });
    await loadGlobalRollerShutters();
    nameInput.value = '';
  } catch (err) {
    console.error('Error creating roller shutter:', err);
    alert(`Error: ${err.message}`); // Testo Inglese
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Add Shutter'; // Testo Inglese
    }
  }
}

// Elimina una tapparella globale
async function globalDeleteRollerShutter(id) {
  if (!confirm('Are you sure you want to delete this global shutter? This may also remove it from associated homes and routines.')) return; // Testo Inglese
  try {
    await fetchApi(`/api/entities/rollerShutter/delete/${id}`, 'DELETE');
    await loadGlobalRollerShutters();
  } catch (err) {
    console.error('Error deleting global roller shutter:', err);
    alert(`Error: ${err.message}`); // Testo Inglese
  }
}


// Mostra il form per modificare il nome della tapparella associata
function showEditHomeShutterForm(shutterId, currentName, homeId) {
  console.log(`Editing shutter ID: ${shutterId}, Current Name: ${currentName}`);
  document.getElementById("edit-home-shutter-id").value = shutterId;
  document.getElementById("edit-home-shutter-name").value = currentName;
  document.getElementById("edit-home-shutter-home-id").value = homeId;

  const editForm = document.getElementById("edit-home-shutter-form");
  if (editForm) editForm.style.display = "block";
}

// Nasconde il form di modifica nome tapparella associata
function cancelEditHomeShutter() {
  const editForm = document.getElementById("edit-home-shutter-form");
  if (editForm) editForm.style.display = "none";
}

// Gestisce l'invio del form di modifica nome tapparella associata
async function submitEditHomeShutter(event) {
  event.preventDefault();
  const shutterId = document.getElementById("edit-home-shutter-id").value;
  const homeId = document.getElementById("edit-home-shutter-home-id").value;
  const newNameInput = document.getElementById("edit-home-shutter-name");
  const newName = newNameInput.value.trim();
  const saveButton = event.submitter;

  if (!newName) { alert("Please enter a new name for the shutter."); return; }
  if (!shutterId || !homeId) { console.error("Missing shutter ID or home ID for edit submission."); alert("An error occurred. Cannot save changes."); return; }

  if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

  try {
    await fetchApi(`/api/entities/rollerShutter/patch/name/${shutterId}`, "PATCH", { name: newName });
    alert("Shutter name updated successfully!"); // Testo Inglese
    cancelEditHomeShutter();
    loadHomeShuttersForManagement(homeId);

  } catch (error) {
    console.error("Error updating shutter name:", error);
    alert(`Failed to update shutter name: ${error.message}`); // Testo Inglese
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save Name"; // Testo Inglese
    }
  }
}

// Dissocia una tapparella da una casa
async function deleteManagedRollerShutter(shutterId, homeId) { // Rinominata per chiarezza
  if (!confirm("Are you sure you want to dissociate this shutter from the home? (The shutter itself won't be deleted globally)")) { return; } // Testo Inglese e più chiaro

  if (!shutterId || !homeId) { console.error("Missing shutter ID or home ID for dissociation."); alert("An error occurred."); return; }

  const dissociateBtn = document.querySelector(`#shutter-item-${shutterId} button.btn-danger`);
  dissociateBtn?.setAttribute("disabled", "true");

  try {
    // 1. Leggi le tapparelle attuali della casa (usa workaround se necessario)
    let homeDetails = null;
    try {
      homeDetails = await fetchApi(`/api/entities/home/${homeId}`);
    } catch (detailsError) {
      if (detailsError.status === 403) {
        console.warn(`Falling back to fetching home list for dissociation due to 403 on /api/entities/home/${homeId}.`);
        const allHomes = await fetchApi('/api/entities/home/');
        if (allHomes && Array.isArray(allHomes)) {
          homeDetails = allHomes.find(h => h?.id == homeId);
        }
      } else {
        throw detailsError;
      }
    }
    if (!homeDetails || !homeDetails.rollerShutters) { throw new Error("Could not fetch current home shutters."); }

    // 2. Filtra via la tapparella da dissociare
    const updatedShutters = homeDetails.rollerShutters.filter(s => String(s.id) !== String(shutterId));

    // 3. Invia la lista aggiornata con PATCH alla casa
    //    Assicurati che il payload sia quello atteso dal backend (potrebbe volere solo ID, o oggetti completi)
    const payload = { rollerShutters: updatedShutters.map(s => ({ id: s.id })) }; // Ipotesi: invia solo ID
    console.log("Sending PATCH to dissociate shutter:", payload);
    await fetchApi(`/api/entities/home/patch/rollerShutters/${homeId}`, "PATCH", payload);

    alert("Roller shutter dissociated successfully!"); // Testo Inglese
    loadHomeShuttersForManagement(homeId);

  } catch (error) {
    console.error(`Error dissociating roller shutter (ID: ${shutterId}) from home (ID: ${homeId}):`, error);
    alert(`Error dissociating shutter: ${error.message}`); // Testo Inglese
    dissociateBtn?.removeAttribute("disabled");
  }
}
async function inlineEditHomeName(id, currentName) {
  const li = document.getElementById(`home-item-${id}`);
  if (!li) return;

  // salva contenuto precedente
  const original = li.innerHTML;

  // crea campo di input + bottoni
  li.innerHTML = `
    <input type="text"
           id="inline-home-input-${id}"
           class="form-control form-control-sm d-inline-block w-auto me-2"
           value="${currentName}">
  `;
  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm';

  // Save
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save';
  saveBtn.onclick = async () => {
    const newName = document.getElementById(`inline-home-input-${id}`).value.trim();
    if (!newName) { alert('Il nome non può essere vuoto'); return; }
    try {
      saveBtn.disabled = true;
      await fetchApi(`/api/entities/home/patch/name/${id}`, 'PATCH', { name: newName });
      // ripristina la riga aggiornando il testo
      original.replace(currentName, newName); // forza il replace visivo
      loadHomes();   // o, se preferisci, ricostruisci solo questo li...
    } catch (err) {
      console.error(err);
      alert('Errore aggiornando il nome: ' + err.message);
      li.innerHTML = original;  // rollback
    }
  };

  // Cancel
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => {
    li.innerHTML = original;
  };

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup);
}
