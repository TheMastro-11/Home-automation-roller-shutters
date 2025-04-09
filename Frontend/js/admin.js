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
                      <button type="button" class="btn btn-success" onclick="showSensorsForHome('${home.id}', '${home.name}')">Sensors</button>
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
// TODO: Espandere per caricare e pre-popolare dati Utente, Tapparelle, Sensore
function showEditHomeForm(homeId, homeName) {
  console.log(`Showing edit form for Home ID: ${homeId}`);
  // Nascondi lista e form aggiunta
  const adminHomes = document.getElementById("admin-homes");
  if (adminHomes) adminHomes.style.display = "none";
  const addHomeForm = document.getElementById("add-home-form");
  if (addHomeForm) addHomeForm.style.display = "none";
  // Nascondi anche gestione sensori se per caso è aperta
  const sensorSection = document.getElementById("admin-sensor-management");
  if (sensorSection) sensorSection.style.display = "none";

  // Mostra il form di modifica
  const editHomeForm = document.getElementById("edit-home-form");
  if (editHomeForm) editHomeForm.style.display = "block";

  // Popola i campi esistenti
  document.getElementById("editHomeId").value = homeId;
  document.getElementById("editHomeName").value = homeName;

  // --- QUI VA AGGIUNTA LA LOGICA PER CARICARE E POPOLARE ---
  // --- LE LISTE/SELECT DI UTENTI, TAPPARELLE, SENSORI  ---
  // --- (Richiede API specifiche dal backend)           ---
  console.warn(
    "TODO: Implement fetching and populating Users, Shutters, Sensor lists in showEditHomeForm"
  );
  // Esempio placeholder:
  document.getElementById("editHomeOwnerSelect").innerHTML =
    "<option>Users loading...</option>";
  document.getElementById("editHomeShuttersList").innerHTML =
    "<p>Shutters loading...</p>";
  document.getElementById("editHomeSensorSelect").innerHTML =
    "<option>Sensors loading...</option>";
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
                      <strong>${
                        sensor.name || "Unnamed Sensor"
                      }</strong> - Value: ${displayValue}%
                  </div>
                  <div class="mt-1 mt-sm-0">
                      <button class="btn btn-sm btn-warning me-2" onclick="adminShowEditSensorForm('${
                        sensor.id
                      }', '${
          sensor.name || ""
        }', ${numericValue})">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="adminDeleteLightSensor('${
                        sensor.id
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

// Aggiunge un nuovo sensore per la casa specificata (chiamata dal form admin)
async function adminCreateLightSensor(event) {
  event.preventDefault();
  const nameInput = document.getElementById("admin-newSensorName");
  const homeIdInput = document.getElementById("admin-sensor-home-id");
  const addButton = event.submitter;

  const name = nameInput.value.trim();
  const homeId = homeIdInput ? homeIdInput.value : null;

  if (!name || !homeId) {
    alert("Please enter sensor name. Home ID seems missing.");
    console.error("Missing data for adminCreateLightSensor:", { name, homeId });
    return;
  }

  if (addButton) {
    addButton.disabled = true;
    addButton.textContent = "Adding...";
  }

  try {
    // Invia solo name e home ID (come da tua indicazione)
    await fetchApi("/api/entities/lightSensor/create", "POST", {
      name: name,
      home: homeId,
    });

    alert("Light sensor created successfully for this home!");
    nameInput.value = ""; // Pulisci
    adminLoadLightSensors(homeId); // Ricarica lista
  } catch (error) {
    console.error("Error creating sensor via admin:", error);
    alert(`Error creating sensor: ${error.message}`);
  } finally {
    if (addButton) {
      addButton.disabled = false;
      addButton.textContent = "+ Add Sensor";
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
