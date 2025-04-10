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

  try {
    const homes = await fetchApi("/api/entities/home/"); // GET all homes (admin)
    homeList.innerHTML = ""; // Pulisci

    if (homes && homes.length > 0) {
      homes.forEach((home) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
                  <span>${home.name}</span>
                  <div class="btn-group btn-group-sm admin-home-actions" role="group" aria-label="Azioni Casa">
                      <button type="button" class="btn btn-warning" onclick="showEditHomeForm('${home.id}', '${home.name}')">Edit</button>
                      <button type="button" class="btn btn-danger" onclick="deleteHome('${home.id}')">Delete</button>
                      <button type="button" class="btn btn-info" onclick="showRoutinesForHome('${home.id}', '${home.name}')">Routines</button>
                      <button type="button" class="btn btn-success" onclick="showSensorsForHome('${home.id}', '${home.name}')">Sensors and Users</button>
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

  if (!homeName) {
    alert("Please enter a home name.");
    return;
  }

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

// Mostra il form per modificare i dettagli di una casa (ATTUALMENTE SOLO NOME)
async function showEditHomeForm(homeId, homeName) { // Rendi la funzione async
  console.log(`Showing edit form for Home ID: ${homeId}`);
  // Nascondi altre sezioni
  const adminHomes = document.getElementById("admin-homes");
  if (adminHomes) adminHomes.style.display = "none";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "none";
  const sensorSection = document.getElementById("admin-sensor-management");
  if(sensorSection) sensorSection.style.display = 'none';

  // Popola campi base
  document.getElementById("editHomeId").value = homeId;
  document.getElementById("editHomeName").value = homeName;

  // Mostra il form di modifica PRIMA di caricare i dati asincroni
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "block";

  // Resetta/Mostra loading state per i campi dinamici
  document.getElementById("editHomeOwnerSelect").innerHTML = '<option value="" selected disabled>Loading users...</option>';
  document.getElementById("editHomeShuttersList").innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading shutters...</p>';
  document.getElementById("editHomeSensorSelect").innerHTML = '<option value="" selected disabled>Loading sensors...</option><option value="NONE">-- None --</option>';

  // --- CARICAMENTO DATI DINAMICI ---
  let currentOwnerId = null;
  try {
      // ASSUNZIONE: Esiste API GET /home/{id} che ritorna { ..., owner: { id: ... }, ... }
      console.log(`Workspaceing current details for home ${homeId}...`);
      const homeDetails = await fetchApi(`/api/entities/home/${homeId}`); // GET per dettagli casa
      currentOwnerId = homeDetails?.owner?.id || null; // Estrai ID owner attuale
      console.log("Current owner ID:", currentOwnerId);

      // TODO: Qui dovresti anche estrarre la lista attuale di shutters e l'ID del sensore
      // const currentShutterIds = homeDetails?.rollerShutters?.map(rs => rs.id) || [];
      // const currentSensorId = homeDetails?.lightSensor?.id || null;
      console.warn("TODO: Extract current shutters and sensor from homeDetails response in showEditHomeForm");

  } catch (error) {
      console.error(`Failed to fetch current home details for ID ${homeId}:`, error);
      // Non bloccare la visualizzazione del form, ma mostra un errore o stato default
      // alert(`Could not load current details for home: ${error.message}`);
  }

  // Popola la select degli utenti, passando l'ID dell'owner attuale per pre-selezione
  loadUsersForOwnerSelect('editHomeOwnerSelect', currentOwnerId);

  // TODO: Chiamare funzioni simili per popolare shutters e sensor
  // loadShuttersForEditHome('editHomeShuttersList', currentShutterIds); // Funzione da creare
  // loadSensorsForEditHome('editHomeSensorSelect', currentSensorId); // Funzione da creare
  console.warn("TODO: Call functions to populate Shutters and Sensor fields in showEditHomeForm");
}


async function submitEditHome(event) {
  event.preventDefault();
  const id = document.getElementById("editHomeId").value; // ID della Casa
  const newNameInput = document.getElementById("editHomeName");
  const saveButton = event.submitter;

  // Leggi i valori dai campi del form
  const newName = newNameInput.value.trim();
  const selectedOwnerId = document.getElementById("editHomeOwnerSelect").value;
  // TODO: Leggere valori selezionati per Shutters e Sensor qui
  console.warn("TODO: Read selected Shutters and Sensor values in submitEditHome");

  if (!newName) { // Potresti voler aggiungere validazione per altri campi
      alert("Please enter the home name.");
      return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  // Prepara le chiamate API necessarie
  const apiCalls = [];

  // 1. Prepara PATCH per il nome (lo facciamo sempre per ora)
  apiCalls.push(
      fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName })
  );

  // 2. Prepara PATCH per l'owner
  //    Costruisci il payload basato sull'ipotesi: { owner: { id: ... } }
  //    Se l'utente ha selezionato "-- Select Owner --" (value=""), inviamo null per disassociare? Chiedi al backend!
  //    Assumiamo che un valore vuoto significhi disassociare (owner: null).
  const ownerPayload = selectedOwnerId
                       ? { owner: { id: parseInt(selectedOwnerId, 10) } } // Invia oggetto con ID
                       : { owner: null }; // Invia null se nessun owner selezionato (VERIFICARE!)
  apiCalls.push(
      fetchApi(`/api/entities/home/patch/user/${id}`, "PATCH", ownerPayload) // FORMATO BODY DA CONFERMARE!
  );

  // 3. TODO: Prepara PATCH per le tapparelle
  //    Leggi le checkbox selezionate da #editHomeShuttersList
  //    Costruisci il payload (es. { rollerShutters: [ { id: ... } ] } ?) - FORMATO BODY DA CONFERMARE!
  //    Aggiungi la chiamata fetchApi a apiCalls
  console.warn("TODO: Prepare PATCH call for Shutters in submitEditHome");

  // 4. TODO: Prepara PATCH per il sensore
  //    Leggi il valore da #editHomeSensorSelect
  //    Costruisci il payload (es. { lightSensor: { id: ... } } o null se "None") - FORMATO BODY DA CONFERMARE!
  //    Aggiungi la chiamata fetchApi a apiCalls
  console.warn("TODO: Prepare PATCH call for Sensor in submitEditHome");

  try {
      // Esegui tutte le chiamate PATCH in parallelo
      await Promise.all(apiCalls);

      alert("Home details updated successfully!");
      cancelEditHome(); // Torna alla lista
      loadAdminHomes(); // Ricarica lista case

  } catch (error) {
      console.error("Error updating home details:", error);
      // Mostra errore più dettagliato se possibile
      const errorDetails = error.details ? `\nDetails: ${JSON.stringify(error.details)}` : '';
      alert(`Failed to update home details: ${error.message}${errorDetails}`);
  } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save Changes";
  }
}

// Annulla la modifica della casa e torna alla lista
function cancelEditHome() {
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "none";

  // Mostra di nuovo lista e form aggiunta
  const adminHomes = document.getElementById("admin-homes");
  if (adminHomes) adminHomes.style.display = "block";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "block";
}

// In js/admin.js (Aggiungi questa nuova funzione)

// Carica la lista di utenti e popola un elemento <select>
async function loadUsersForOwnerSelect(selectElementId, currentOwnerId) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) {
      console.error(`Select element with ID '${selectElementId}' not found.`);
      return;
  }
  // Salva temporaneamente il valore selezionato (se c'è)
  // const previouslySelected = selectElement.value; // Non serve se popoliamo da zero

  selectElement.innerHTML = '<option value="" selected disabled>Loading users...</option>'; // Messaggio caricamento

  try {
      // Chiama l'API per ottenere la lista utenti
      const users = await fetchApi('/api/auth/users'); // Assumiamo GET

      selectElement.innerHTML = ''; // Pulisci opzioni vecchie/loading

      // Aggiungi un'opzione per "Nessun Proprietario" o selezione default
      const defaultOption = document.createElement('option');
      defaultOption.value = ""; // Valore vuoto per "nessuno"
      defaultOption.textContent = "-- Select Owner --";
      selectElement.appendChild(defaultOption);

      // Popola con gli utenti ricevuti
      if (users && Array.isArray(users) && users.length > 0) {
          users.forEach(user => {
              const option = document.createElement('option');
              option.value = user.id; // Usa l'ID utente come valore
              option.textContent = user.username || `User ID: ${user.id}`; // Mostra username (o ID se manca)

              // Se l'ID utente corrisponde a currentOwnerId, selezionalo
              if (currentOwnerId && String(user.id) === String(currentOwnerId)) {
                  option.selected = true;
                  console.log(`Pre-selected owner: ${user.username || user.id}`);
              }
              selectElement.appendChild(option);
          });
      } else {
           // Se non ci sono utenti, lascia solo l'opzione default
           console.log("No users found from API.");
      }

  } catch (error) {
      console.error(`Error loading users into select #${selectElementId}:`, error);
      selectElement.innerHTML = `<option value="" selected disabled>Error loading users!</option>`;
  }
}

// Salva le modifiche della casa (ATTUALMENTE SOLO NOME)
// TODO: Espandere per leggere e inviare PATCH per Utente, Tapparelle, Sensore
async function submitEditHome(event) {
  event.preventDefault();
  const id = document.getElementById("editHomeId").value;
  const newNameInput = document.getElementById("editHomeName");
  const newName = newNameInput.value.trim();
  const saveButton = event.submitter;

  // --- QUI VA AGGIUNTA LA LOGICA PER LEGGERE I VALORI ---
  // --- DAI NUOVI CAMPI (Owner, Shutters, Sensor)      ---
  // const selectedOwnerId = document.getElementById("editHomeOwnerSelect").value;
  // const selectedShutterIds = /* ... logica per leggere le checkbox ... */;
  // const selectedSensorId = document.getElementById("editHomeSensorSelect").value;
  console.warn(
    "TODO: Implement reading selected Owner, Shutters, Sensor in submitEditHome"
  );

  if (!newName) {
    // Aggiungere controlli per gli altri campi se necessario
    alert("Please enter the home name.");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    // --- QUI VA AGGIUNTA LA LOGICA PER FARE LE CHIAMATE PATCH NECESSARIE ---
    // --- PER NOME, USER, SHUTTERS, SENSOR, SOLO SE SONO CAMBIATI       ---
    // --- (Richiede formato body API corretto dal backend)             ---

    // 1. PATCH per il nome (già implementata)
    await fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", {
      name: newName,
    });

    // 2. PATCH per l'owner (ESEMPIO - DA ADATTARE!)
    // if (ownerÈCambiato) { // Bisogna confrontare col valore originale
    //    await fetchApi(`/api/entities/home/patch/user/${id}`, "PATCH", { owner: { id: selectedOwnerId } }); // FORMATO BODY DA CONFERMARE!
    // }

    // 3. PATCH per le tapparelle (ESEMPIO - DA ADATTARE!)
    // if (shuttersSonoCambiate) { // Bisogna confrontare con la lista originale
    //    const shutterData = selectedShutterIds.map(shId => ({ id: shId })); // FORMATO BODY DA CONFERMARE!
    //    await fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, "PATCH", { rollerShutters: shutterData }); // FORMATO BODY E COMPORTAMENTO DA CONFERMARE!
    // }

    // 4. PATCH per il sensore (ESEMPIO - DA ADATTARE!)
    // if (sensorÈCambiato) { // Bisogna confrontare col valore originale
    //    const sensorData = selectedSensorId === 'NONE' ? null : { id: selectedSensorId }; // FORMATO BODY DA CONFERMARE! (null per disassociare?)
    //    await fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: sensorData }); // FORMATO BODY DA CONFERMARE!
    // }

    console.warn(
      "TODO: Implement actual PATCH calls for Owner, Shutters, Sensor in submitEditHome"
    );

    alert("Home details updated successfully!"); // Messaggio generico per ora
    cancelEditHome(); // Torna alla lista
    loadAdminHomes(); // Ricarica lista case
  } catch (error) {
    console.error("Error updating home details:", error);
    alert(`Failed to update home details: ${error.message}`);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";
  }
}

// Elimina una casa
async function deleteHome(homeId) {
  if (
    !confirm(
      "Are you sure you want to delete this home? This might also delete associated devices and Routines depending on backend logic."
    )
  ) {
    return;
  }
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
// GESTIONE ROUTINE (Solo Navigazione)
// ========================================

// Mostra la sezione routine per una casa specifica
function showRoutinesForHome(homeId, homeName) {
  console.log(`Showing Routines for Home ID: ${homeId}, Name: ${homeName}`);

  // Nascondi la vista principale admin
  const adminHomes = document.getElementById("admin-homes");
  if (adminHomes) adminHomes.style.display = "none";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "none";
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "none";
  const sensorSection = document.getElementById("admin-sensor-management");
  if (sensorSection) sensorSection.style.display = "none";

  // Mostra la sezione routine
  const routinesSection = document.getElementById("Routines-section"); // Assicurati ID HTML sia corretto
  if (routinesSection) routinesSection.style.display = "block";

  // Imposta titolo e ID nascosto
  const routineTitle = document.getElementById("Routines-section-title"); // Assicurati ID HTML sia corretto
  if (routineTitle) routineTitle.innerText = `Routines for: ${homeName}`;
  const routineHomeIdHidden = document.getElementById(
    "Routines-home-id-hidden"
  ); // Assicurati ID HTML sia corretto
  if (routineHomeIdHidden) routineHomeIdHidden.value = homeId;

  // Chiama la funzione in routines.js per caricare/filtrare
  if (typeof loadRoutines === "function") {
    loadRoutines(homeId);
  } else {
    console.error(
      "loadRoutines function is not defined (ensure routines.js is loaded)"
    );
  }
}

// ========================================
// GESTIONE SENSORI (Admin)
// ========================================

// Mostra la sezione gestione sensori per una casa specifica
function showSensorsForHome(homeId, homeName) {
  console.log(`Showing sensors for Home ID: ${homeId}, Name: ${homeName}`);

  // Nascondi la vista principale admin
  const adminHomes = document.getElementById("admin-homes");
  if (adminHomes) adminHomes.style.display = "none";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "none";
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "none";
  // Nascondi anche routine se aperte
  const routinesSection = document.getElementById("Routines-section");
  if (routinesSection) routinesSection.style.display = "none";

  // Mostra la sezione gestione sensori
  const sensorSection = document.getElementById("admin-sensor-management");
  if (sensorSection) {
    sensorSection.style.display = "block";
  } else {
    console.error(
      "Admin sensor management section (#admin-sensor-management) not found!"
    );
    return;
  }

  // Imposta il titolo e l'ID nascosto
  const titleElement = document.getElementById("admin-sensor-home-title");
  if (titleElement) {
    titleElement.textContent = `Sensors for: ${homeName}`;
  }
  const sensorHomeIdHidden = document.getElementById("admin-sensor-home-id");
  if (sensorHomeIdHidden) sensorHomeIdHidden.value = homeId;

  // Nascondi il form di modifica sensore admin (se era aperto)
  const adminEditSensorForm = document.getElementById(
    "admin-edit-light-sensor"
  );
  if (adminEditSensorForm) adminEditSensorForm.style.display = "none";

  // Chiama la funzione per caricare i sensori specifici per homeId
  adminLoadLightSensors(homeId);
}

// Nasconde la sezione sensori e torna alla lista case admin
function hideSensorsForHome() {
  const sensorSection = document.getElementById("admin-sensor-management");
  if (sensorSection) sensorSection.style.display = "none";

  // Mostra di nuovo la vista principale admin
  const adminHomes = document.getElementById("admin-homes");
  if (adminHomes) adminHomes.style.display = "block";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "block";
  // editHomeForm resta nascosto
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "none";

  // Potresti voler ricaricare la lista case qui
  // loadAdminHomes();
}

// Nasconde il form di modifica sensore admin
function cancelAdminEditSensor() {
  const adminEditSensorForm = document.getElementById(
    "admin-edit-light-sensor"
  );
  if (adminEditSensorForm) adminEditSensorForm.style.display = "none";
}

// Carica e visualizza i sensori per una specifica casa nella vista admin
async function adminLoadLightSensors(homeId) {
  const sensorList = document.getElementById("admin-sensor-list");
  if (!sensorList) {
    console.error("Element '#admin-sensor-list' not found.");
    return;
  }
  sensorList.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";
  const apiPath = "/api/entities/lightSensor/";
  console.log(
    `adminLoadLightSensors: Called for homeId=${homeId}. Fetching from ${apiPath}`
  );

  try {
    const allSensors = await fetchApi(apiPath);
    console.log(
      "adminLoadLightSensors: API fetch successful. Received:",
      allSensors
    );

    let filteredSensors = [];

    // Filtra lato client (VERIFICARE STRUTTURA sensor.home.id!)
    if (
      homeId &&
      allSensors &&
      Array.isArray(allSensors) &&
      allSensors.length > 0
    ) {
      console.log("adminLoadLightSensors: Filtering client-side...");
      filteredSensors = allSensors.filter(
        (sensor) =>
          sensor && sensor.home && String(sensor.home.id) === String(homeId)
      );
      console.log(
        `adminLoadLightSensors: Filtering complete. Found ${filteredSensors.length} sensors for homeId ${homeId}.`,
        filteredSensors
      );
    } else {
      console.log(
        "adminLoadLightSensors: No homeId for filtering or no sensors array received."
      );
      filteredSensors = [];
    }

    sensorList.innerHTML = ""; // Pulisci lista

    if (filteredSensors && filteredSensors.length > 0) {
      console.log("adminLoadLightSensors: Rendering filtered sensors...");
      filteredSensors.forEach((sensor) => {
        if (!sensor || !sensor.id) return;

        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-center flex-wrap";
        li.id = `admin-sensor-item-${sensor.id}`;

        // Determina valore numerico (o null) - VERIFICARE NOMI CAMPI value/opening!
        const numericValue = sensor.value ?? sensor.opening ?? null;
        const displayValue = numericValue !== null ? numericValue : "N/A";

        li.innerHTML = `
                  <div style="margin-right: 10px;">
                      <strong>${sensor.name || "Unnamed Sensor"
          }</strong> - Value: ${displayValue}%
                  </div>
                  <div class="mt-1 mt-sm-0">
                      <button class="btn btn-sm btn-warning me-2" onclick="adminShowEditSensorForm('${sensor.id
          }', '${sensor.name || ""
          }', ${numericValue})">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="adminDeleteLightSensor('${sensor.id
          }', '${homeId}')">Delete</button>
                  </div>
              `;
        sensorList.appendChild(li);
      });
    } else {
      console.log(
        "adminLoadLightSensors: No sensors to display after filtering."
      );
      sensorList.innerHTML =
        "<li class='list-group-item'>No sensors assigned to this home.</li>";
    }
  } catch (error) {
    console.error(
      "adminLoadLightSensors: Error during fetch or processing:",
      error
    );
    sensorList.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${error.message}</li>`;
  }
}

// Mostra il form di modifica specifico per admin
function adminShowEditSensorForm(id, name, currentValue) {
  console.log(
    `Editing sensor ID: ${id}, Name: ${name}, Value: ${currentValue}`
  );

  document.getElementById("admin-sensorEditId").value = id;
  document.getElementById("admin-editSensorName").value = name;
  // Gestisci il caso in cui currentValue sia null (se displayValue era 'N/A')
  document.getElementById("admin-editSensorValue").value =
    currentValue !== null ? currentValue : "";

  const adminEditForm = document.getElementById("admin-edit-light-sensor");
  if (adminEditForm) adminEditForm.style.display = "block";
}

// Aggiunge un nuovo sensore E LO ASSOCIA ALLA CASA specificata (Admin)
async function adminCreateLightSensor(event) {
  event.preventDefault();
  const nameInput = document.getElementById("admin-newSensorName");
  const homeIdInput = document.getElementById("admin-sensor-home-id");
  const addButton = event.submitter;

  const name = nameInput.value.trim(); // Nome del nuovo sensore
  const homeId = homeIdInput ? homeIdInput.value : null;

  if (!name || !homeId) {
    alert("Please enter sensor name. Home ID seems missing.");
    console.error("Missing data for adminCreateLightSensor:", { name, homeId });
    return;
  }

  if (addButton) {
    addButton.disabled = true;
    addButton.textContent = 'Adding...'
  }

  try {
    // --- Chiamata 1: Crea il sensore ---
    console.log(`Step 1: Creating sensor with name: ${name}, associated with homeId: ${homeId}`);
    const createSensorPayload = {
      name: name,
      home: homeId
    };
    // Chiamiamo l'API per creare. Non ci serve necessariamente l'ID restituito ora.
    // Potremmo voler verificare se la creazione ha successo prima di procedere.
    const creationResponse = await fetchApi('/api/entities/lightSensor/create', 'POST', createSensorPayload);

    // Se l'API create restituisce un errore specifico (es. 4xx), fetchApi lo lancerà e andremo al catch.
    // Se restituisce 2xx (OK, Created), procediamo.
    console.log("Step 1 Success: Sensor creation request successful.", creationResponse);


    // --- Chiamata 2: Associa il sensore alla casa usando il NOME ---
    console.log(`Step 2: Associating sensor named "${name}" with home (ID: ${homeId})`);
    // Costruisci il payload usando il NOME del sensore appena creato
    const associateSensorPayload = {
      lightSensor: {
        name: name // Usa il nome invece dell'ID
      }
    };
    await fetchApi(`/api/entities/home/patch/lightSensor/${homeId}`, 'PATCH', associateSensorPayload);

    console.log(`Step 2 Success: Home ${homeId} updated to associate sensor named "${name}"`);

    // Se entrambe le chiamate hanno successo:
    alert("Light sensor created and associated successfully!");
    nameInput.value = ""; // Pulisci campo nome
    adminLoadLightSensors(homeId); // Ricarica la lista dei sensori admin per questa casa

  } catch (error) {
    console.error("Error during sensor creation/association process:", error);
    // Se la seconda chiamata fallisce dopo che la prima ha avuto successo,
    // il sensore è creato ma non associato alla casa dal punto di vista della casa.
    // Potrebbe servire logica aggiuntiva qui? Per ora mostriamo l'errore.
    alert(`Error creating/associating sensor: ${error.message}`);
  } finally {
    if (addButton) {
      addButton.disabled = false;
      addButton.textContent = '+ Add Sensor';
    }
  }
}

// Salva le modifiche al sensore fatte nel form admin
async function adminSubmitEditSensor(event) {
  event.preventDefault();
  const id = document.getElementById("admin-sensorEditId").value;
  const nameInput = document.getElementById("admin-editSensorName");
  const valueInput = document.getElementById("admin-editSensorValue"); // Usa ID corretto
  const homeId = document.getElementById("admin-sensor-home-id").value; // ID casa per ricaricare
  const saveButton = event.submitter;

  const newName = nameInput.value.trim();
  const newValueStr = valueInput.value.trim();

  const apiPromises = [];

  // 1. PATCH Nome (se compilato)
  if (newName) {
    apiPromises.push(
      fetchApi(`/api/entities/lightSensor/patch/name/${id}`, "PATCH", {
        name: newName,
      }).catch((err) => {
        console.error(`Failed to update sensor name (ID: ${id}):`, err);
        throw new Error(`Failed to update name: ${err.message}`);
      })
    );
  }

  // 2. PATCH Valore (se compilato e valido) - Usa l'endpoint /patch/value/
  if (newValueStr) {
    const newValue = parseInt(newValueStr, 10);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
      // Usa il campo 'value' come richiesto da API /patch/value/
      apiPromises.push(
        fetchApi(`/api/entities/lightSensor/patch/value/${id}`, "PATCH", {
          value: newValue,
        }).catch((err) => {
          console.error(`Failed to update sensor value (ID: ${id}):`, err);
          throw new Error(`Failed to update value: ${err.message}`);
        })
      );
    } else {
      alert(
        "Invalid value percentage entered (must be 0-100). Value not updated."
      );
    }
  }

  if (apiPromises.length === 0) {
    alert("No valid changes detected or fields were empty.");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    await Promise.all(apiPromises);
    alert("Sensor updated successfully!");
    cancelAdminEditSensor(); // Nascondi form
    adminLoadLightSensors(homeId); // Ricarica lista
  } catch (error) {
    console.error("Error updating sensor (admin):", error);
    alert(`Error updating sensor: ${error.message}`);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";
  }
}

// Elimina un sensore (versione admin)
async function adminDeleteLightSensor(sensorId, homeId) {
  if (!confirm("Are you sure you want to delete this light sensor?")) {
    return;
  }
  try {
    await fetchApi(`/api/entities/lightSensor/delete/${sensorId}`, "DELETE");
    alert("Sensor deleted successfully!");
    adminLoadLightSensors(homeId); // Ricarica lista admin per questa casa
  } catch (error) {
    console.error(`Error deleting sensor (ID: ${sensorId}):`, error);
    alert(`Error deleting sensor: ${error.message}`);
  }
}
