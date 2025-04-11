// ========================================
// GESTIONE CASE (Homes)
// ========================================

// Carica la lista delle case per l'admin
async function loadAdminHomes() {
  const homeList = document.getElementById("admin-homes-list");
  if (!homeList) {
       console.error("Element '#admin-homes-list' not found.");
       return;
  }
  homeList.innerHTML = "<li class='list-group-item'>Loading homes...</li>";

  // Mostra sezione case e aggiunta, nascondi altre sezioni admin
  const adminHomesSection = document.getElementById("admin-homes");
  if (adminHomesSection) adminHomesSection.style.display = "block";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "block";
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "none";
  const sensorSection = document.getElementById("admin-sensor-management");
  if (sensorSection) sensorSection.style.display = "none";
   const routinesSection = document.getElementById("Routines-section");
   if (routinesSection) routinesSection.style.display = "block";

  try {
      const homes = await fetchApi("/api/entities/home/");
      homeList.innerHTML = "";

      if (homes && Array.isArray(homes) && homes.length > 0) { // Aggiunto Array.isArray
          homes.forEach((home) => {
              if(!home || !home.id) return; // Salta case invalide
              const li = document.createElement("li");
              li.className = "list-group-item d-flex justify-content-between align-items-center";
              // Usiamo template literals e assicuriamo che i parametri siano stringhe per l'HTML
              const homeIdStr = String(home.id);
              const homeNameStr = String(home.name || ''); // Usa stringa vuota se name è null/undefined

              li.innerHTML = `
                  <span>${homeNameStr}</span>
                  <div class="btn-group btn-group-sm admin-home-actions" role="group" aria-label="Azioni Casa">
                      <button type="button" class="btn btn-warning" onclick="showEditHomeForm('${homeIdStr}', '${homeNameStr.replace(/'/g, "\\'")}')">Edit</button>
                      <button type="button" class="btn btn-danger" onclick="deleteHome('${homeIdStr}')">Delete</button>
                      <button type="button" class="btn btn-info" onclick="showRoutinesForHome('${homeIdStr}', '${homeNameStr.replace(/'/g, "\\'")}')">Routines</button>
                      <button type="button" class="btn btn-success" onclick="showSensorsForHome('${homeIdStr}', '${homeNameStr.replace(/'/g, "\\'")}')">Sensors</button>
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
      loadAdminHomes();
  } catch (error) {
       console.error("Error adding home:", error);
      alert(`Failed to add home: ${error.message}`);
  } finally {
      if (spinner) spinner.style.display = "none";
      if (addButton) addButton.disabled = false;
  }
}

// Carica la lista di utenti e popola un elemento <select> (USA USERNAME COME VALUE)
async function loadUsersForOwnerSelect(selectElementId, currentOwnerUsername) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
  selectElement.innerHTML = '<option value="" selected disabled>Loading users...</option>';

  try {
      const users = await fetchApi('/api/users/');
      selectElement.innerHTML = ''; // Pulisci

      const defaultOption = document.createElement('option');
      defaultOption.value = ""; // Valore vuoto per "-- Select Owner --"
      defaultOption.textContent = "-- Select Owner --";
      selectElement.appendChild(defaultOption);

      if (users && Array.isArray(users) && users.length > 0) {
          users.forEach(user => {
              if (user && user.id && user.username) {
                  const option = document.createElement('option');
                  option.value = user.username; // <-- USA USERNAME COME VALUE
                  option.textContent = user.username;

                  if (currentOwnerUsername && user.username === currentOwnerUsername) {
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

// Mostra il form per modificare i dettagli di una casa

async function showEditHomeForm(homeId, homeName) {
  console.log(`Showing edit form for Home ID: ${homeId}`);
  // Nascondi altre sezioni admin... (codice omesso per brevità)
  const adminHomes = document.getElementById("admin-homes"); if (adminHomes) adminHomes.style.display = "none";
  const addHomeForm = document.getElementById("add-home-form"); if (addHomeForm) addHomeForm.style.display = "none";
  const sensorSection = document.getElementById("admin-sensor-management"); if(sensorSection) sensorSection.style.display = 'none';
  const routinesSection = document.getElementById("Routines-section"); if(routinesSection) routinesSection.style.display = 'none';

  // Popola campi base
  document.getElementById("editHomeId").value = homeId;
  document.getElementById("editHomeName").value = homeName;

  // Mostra il form di modifica
  const editHomeForm = document.getElementById("edit-home-form"); if (!editHomeForm) return; editHomeForm.style.display = "block";

  // Reset/Loading state per campi dinamici
  document.getElementById("editHomeOwnerSelect").innerHTML = '<option value="" selected disabled>Loading details...</option>';
  document.getElementById("editHomeShuttersList").innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading details...</p>';
  document.getElementById("editHomeSensorSelect").innerHTML = '<option value="" selected disabled>Loading details...</option><option value="NONE">-- None --</option>';

  // Carica dettagli casa attuale
  let currentOwnerUsername = null;
  let originalShutterIds = []; // TODO: Popolare e usare per confronto
  let currentSensorName = null;  // <-- Ora usiamo il NOME del sensore

  try {
      // WORKAROUND: Carica tutte le case e filtra
      console.log("Fetching home list to find details for homeId:", homeId);
      const allHomes = await fetchApi('/api/entities/home/');
      let homeDetails = null;
      if (allHomes && Array.isArray(allHomes)) { homeDetails = allHomes.find(home => home && String(home.id) === String(homeId)); }

      if (homeDetails) {
          console.log("Found home details:", homeDetails);
          // Estrai USERNAME owner attuale (ASSUMENDO home.owner.username)
          currentOwnerUsername = homeDetails.owner?.username || null;
          console.log("Current owner USERNAME:", currentOwnerUsername);

          // Estrai NOME sensore attuale (ASSUMENDO home.lightSensor.name)
          currentSensorName = homeDetails.lightSensor?.name || null; // <-- ESTRAI NOME
          console.log("Current sensor NAME:", currentSensorName);

          // TODO: Estrarre ID shutters attuali...
          originalShutterIds = homeDetails.rollerShutters?.map(rs => rs.id).filter(id => id != null) || [];
          console.log("Current shutter IDs:", originalShutterIds);

      } else { console.error(`Home details for ID ${homeId} not found in the list.`); }
  } catch (error) { console.error(`Failed to fetch home details for ID ${homeId}:`, error); }

  // Popola la select degli utenti, passando lo USERNAME attuale
  loadUsersForOwnerSelect('editHomeOwnerSelect', currentOwnerUsername);

  // --- NUOVA CHIAMATA ---
  // Popola la select dei sensori, passando il NOME attuale per pre-selezione
  loadAvailableSensorsForEditHome('editHomeSensorSelect', currentSensorName);
  // --------------------

  // TODO: Chiamare funzioni per popolare shutters...
  console.warn("TODO: Call functions to populate Shutters field in showEditHomeForm");
  document.getElementById("editHomeShuttersList").innerHTML = '<p>(Shutters loading function TODO)</p>';
}
// Annulla la modifica della casa e torna alla lista
function cancelEditHome() {
  const editHomeForm = document.getElementById("edit-home-form"); if (editHomeForm) editHomeForm.style.display = "none";
  // Mostra di nuovo la vista principale admin
  loadAdminHomes(); // Ricarica la vista principale
}

// Salva le modifiche della casa (Nome e Owner; TODO: Shutters, Sensor)
async function submitEditHome(event) {
  event.preventDefault();
  const id = document.getElementById("editHomeId").value; // Home ID
  const newNameInput = document.getElementById("editHomeName");
  const saveButton = event.submitter;

  // Leggi valori
  const newName = newNameInput.value.trim();
  const selectedUsername = document.getElementById("editHomeOwnerSelect").value; // Legge USERNAME
  // TODO: Leggere valori Shutters e Sensor qui

  if (!newName) { alert("Please enter the home name."); return; }
  if(saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

  const apiCalls = [];
  let nameChanged = true; // TODO: Aggiungere confronto con valore originale
  let ownerChanged = true; // TODO: Aggiungere confronto con valore originale

  // 1. Prepara PATCH Nome (solo se cambiato?)
  if (nameChanged) {
      apiCalls.push(
          fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName })
              .catch(err => { console.error("Error patching name:", err); throw err; })
      );
  }

  // 2. Prepara PATCH Owner (solo se cambiato?)
  if (ownerChanged) {
      // Costruisci payload: { user: { username: ... } } o { user: null } basato sui test Python
      const ownerPayload = selectedUsername
                           ? { user: { username: selectedUsername } } // USA CHIAVE "user" e USERNAME interno
                           : { user: null }; // USA CHIAVE "user". Assumi null per disassociare (VERIFICARE!)
      console.log(`Attempting PATCH /patch/owner/${id} with payload:`, JSON.stringify(ownerPayload, null, 2));
      apiCalls.push(
          fetchApi(`/api/entities/home/patch/owner/${id}`, 'PATCH', ownerPayload) // Path /owner/, payload {user:{username:...}}
              .catch(err => { console.error("Error patching owner:", err); throw err; })
      );
  }

  // 3. TODO: Prepara PATCH Tapparelle (solo se cambiate)...
  console.warn("TODO: Prepare PATCH call for Shutters in submitEditHome");

  // 4. TODO: Prepara PATCH Sensore (solo se cambiato)...
  console.warn("TODO: Prepare PATCH call for Sensor in submitEditHome");

  // Se non ci sono chiamate da fare (nulla è cambiato)
  if (apiCalls.length === 0) {
       alert("No changes detected.");
       if(saveButton) { saveButton.disabled = false; saveButton.textContent = "Save Changes"; }
       return;
  }

  try {
      // Esegui tutte le chiamate PATCH necessarie in parallelo
      await Promise.all(apiCalls);
      alert("Home details updated successfully!");
      cancelEditHome(); // Torna alla lista
      loadAdminHomes(); // Ricarica lista case
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
  if (!confirm("Are you sure you want to delete this home? This might also delete associated devices and Routines depending on backend logic.")) { return; }
  try {
      await fetchApi(`/api/entities/home/delete/${homeId}`, "DELETE");
      alert("Home deleted successfully!");
      loadAdminHomes();
  } catch (error) { /*...*/ }
}

// ========================================
// GESTIONE ROUTINE (Solo Navigazione da Admin)
// ========================================

function showRoutinesForHome(homeId, homeName) {
  // ... (come prima, nasconde altre sezioni admin) ...
   const adminHomes = document.getElementById("admin-homes"); if (adminHomes) adminHomes.style.display = "none";
   const addHomeForm = document.getElementById("add-home-form"); if (addHomeForm) addHomeForm.style.display = "none";
   const editHomeForm = document.getElementById("edit-home-form"); if(editHomeForm) editHomeForm.style.display = 'none';
   const sensorSection = document.getElementById("admin-sensor-management"); if(sensorSection) sensorSection.style.display = 'none';

  // Mostra la sezione routine
  const routinesSection = document.getElementById("Routines-section"); if(routinesSection) routinesSection.style.display = 'block';

  // Imposta titolo e ID nascosto
  const routineTitle = document.getElementById("Routines-section-title"); if(routineTitle) routineTitle.innerText = `Routines for: ${homeName}`;
  const routineHomeIdHidden = document.getElementById("Routines-home-id-hidden"); if(routineHomeIdHidden) routineHomeIdHidden.value = homeId;

  // Chiama la funzione in routines.js
  if (typeof loadRoutines === "function") { loadRoutines(homeId); }
  else { console.error("loadRoutines function is not defined"); }
}

// ========================================
// GESTIONE SENSORI (Specifica Admin)
// ========================================


// Carica i sensori disponibili e popola la select nel form Edit Home
async function loadAvailableSensorsForEditHome(selectElementId, currentSensorName) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) {
      console.error(`Select element with ID '${selectElementId}' not found.`);
      return;
  }
  selectElement.innerHTML = '<option value="" selected disabled>Loading sensors...</option>'; // Messaggio caricamento iniziale

  try {
      // Chiama l'API per ottenere TUTTI i sensori di luce
      const sensors = await fetchApi('/api/entities/lightSensor/'); // GET

      selectElement.innerHTML = ''; // Pulisci opzioni vecchie/loading

      // Aggiungi l'opzione per NON associare alcun sensore
      const noneOption = document.createElement('option');
      noneOption.value = "NONE"; // Valore speciale per indicare "nessuno"
      noneOption.textContent = "-- None --";
      selectElement.appendChild(noneOption);

      // Popola con i sensori ricevuti
      if (sensors && Array.isArray(sensors) && sensors.length > 0) {
          sensors.forEach(sensor => {
              // ASSUNZIONE: ogni sensore ha 'id' e 'name'
              if (sensor && sensor.id && sensor.name) {
                  const option = document.createElement('option');
                  option.value = sensor.name; // <-- USA NOME COME VALUE
                  option.textContent = sensor.name; // Mostra nome

                  // Se il nome corrisponde a quello attuale, selezionalo
                  if (currentSensorName && sensor.name === currentSensorName) {
                      option.selected = true;
                      console.log(`Pre-selected sensor: ${sensor.name}`);
                      // Se "-- None --" era selezionato, deselezionalo
                      noneOption.selected = false;
                  }
                  selectElement.appendChild(option);
              }
          });
          // Se nessun sensore attuale è stato passato E l'opzione default "None" esiste, selezionala
          if (!currentSensorName && selectElement.querySelector('option[value="NONE"]')) {
               selectElement.value = "NONE";
          }

      } else {
           console.log("No available light sensors found from API.");
           // Se non ci sono sensori, seleziona "-- None --"
           selectElement.value = "NONE";
      }

  } catch (error) {
      console.error(`Error loading available sensors into select #${selectElementId}:`, error);
      selectElement.innerHTML = `<option value="" selected disabled>Error loading sensors!</option>`;
       // Aggiungi comunque l'opzione None per permettere la disassociazione
       const noneOptionErr = document.createElement('option');
       noneOptionErr.value = "NONE";
       noneOptionErr.textContent = "-- None --";
       selectElement.appendChild(noneOptionErr);
  }
}

// Mostra la sezione gestione sensori per una casa specifica
function showSensorsForHome(homeId, homeName) {
  // ... (come prima, nasconde altre sezioni admin) ...
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
   // Mostra di nuovo la vista principale admin (case e aggiungi)
   loadAdminHomes(); // Ricarica la vista principale
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
  console.log(`adminLoadLightSensors: Called for homeId=${homeId}. Fetching from ${apiPath}`);

  try {
      const allSensors = await fetchApi(apiPath);
      let filteredSensors = [];
      // Filtra lato client (VERIFICARE sensor.home.id!)
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
              // Escape single quotes in names for onclick
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
  } catch (error) { /*...*/ }
}

// Mostra il form di modifica specifico per admin
function adminShowEditSensorForm(id, name, currentValue) {
  console.log(`Editing sensor ID: ${id}, Name: ${name}, Value: ${currentValue}`);
  document.getElementById("admin-sensorEditId").value = id;
  document.getElementById("admin-editSensorName").value = name;
  document.getElementById("admin-editSensorValue").value = currentValue !== null ? currentValue : "";

  const adminEditForm = document.getElementById("admin-edit-light-sensor"); if(adminEditForm) adminEditForm.style.display = "block";
}

// Aggiunge un nuovo sensore (SOLO CREAZIONE, associazione via Edit Home)
async function adminCreateLightSensor(event) {
  event.preventDefault();
  const nameInput = document.getElementById("admin-newSensorName");
  const homeId = document.getElementById("admin-sensor-home-id").value; // Prendiamo homeId per refresh
  const addButton = event.submitter;
  const name = nameInput.value.trim();

  if (!name) { alert("Please enter sensor name."); return; }
  if (!homeId) { console.error("Home ID missing in adminCreateLightSensor"); return; } // Non dovrebbe succedere
  if(addButton) { addButton.disabled = true; addButton.textContent = 'Adding...'; }

  try {
      // Chiama solo POST /create inviando SOLO il nome
      console.log(`Creating sensor with name: ${name}`);
      await fetchApi('/api/entities/lightSensor/create', 'POST', { name: name });

      alert("Light sensor created successfully! You may need to associate it via the 'Edit Home' form.");
      nameInput.value = "";
      // Ricarica la lista, ma il nuovo sensore non sarà associato a QUESTA casa
      // quindi non apparirà qui finché non viene fatto Edit Home.
      adminLoadLightSensors(homeId);

  } catch (error) { /*...*/ }
  finally { /*...*/ }
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

  // PATCH Nome
  if (newName) {
      apiPromises.push(
          fetchApi(`/api/entities/lightSensor/patch/name/${id}`, "PATCH", { name: newName })
              .catch(err => { /*...*/ throw err; })
      );
  }
  // PATCH Valore
  if (newValueStr) {
      const newValue = parseInt(newValueStr, 10);
      if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
          apiPromises.push(
              fetchApi(`/api/entities/lightSensor/patch/value/${id}`, "PATCH", { value: newValue }) // Usa /patch/value/ e campo 'value'
                  .catch(err => { /*...*/ throw err; })
          );
      } else { /*...*/ }
  }

  if (apiPromises.length === 0) { /*...*/ return; }
  if(saveButton){ /*...*/ }

  try {
      await Promise.all(apiPromises);
      alert("Sensor updated successfully!");
      cancelAdminEditSensor(); // Nascondi form
      adminLoadLightSensors(homeId); // Ricarica lista
  } catch (error) { /*...*/ }
  finally { /*...*/ }
}

// Elimina un sensore (versione admin)
async function adminDeleteLightSensor(sensorId, homeId) {
  if (!confirm("Are you sure you want to delete this light sensor?")) { return; }
  try {
      await fetchApi(`/api/entities/lightSensor/delete/${sensorId}`, "DELETE");
      alert("Sensor deleted successfully!");
      adminLoadLightSensors(homeId);
  } catch (error) { /*...*/ }
}