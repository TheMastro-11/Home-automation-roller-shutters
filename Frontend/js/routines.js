async function loadRoutines(homeId = null) {
    const RoutinesList = document.getElementById("Routines-list");
    if (!RoutinesList) {
        console.error("Element with ID 'Routines-list' not found.");
        return;
    }
    RoutinesList.innerHTML = "<li class='list-group-item'>Loading Routines...</li>";

    // Usiamo sempre il path base corretto
    const apiPath = '/api/entities/routine/';
    console.log("Loading all routines from:", apiPath);

    try {
        // 1. Ottieni TUTTE le routine accessibili
        let allRoutines = await fetchApi(apiPath);
        let filteredRoutines = [];

        // 2. FILTRA lato client se è stato fornito un homeId (per vista admin)
        if (homeId && allRoutines && allRoutines.length > 0) {
            console.log(`Filtering routines for homeId: ${homeId}`);
            // !!! ASSUNZIONE: che ogni 'routine' abbia routine.home.id !!!
            // !!! VERIFICA LA STRUTTURA DATI REALE RESTITUITA DALL'API !!!
            filteredRoutines = allRoutines.filter(routine => routine.home && String(routine.home.id) === String(homeId));
            // Ho usato String() per confronto sicuro, nel caso gli ID siano numeri o stringhe
             if (filteredRoutines.length === 0) {
                 console.log(`No routines found specifically for homeId: ${homeId} after filtering.`);
             }
        } else if (allRoutines) {
            // Se non c'è homeId (vista utente?) o non ci sono routine, usa la lista completa
            filteredRoutines = allRoutines;
        }

        RoutinesList.innerHTML = ""; // Pulisci

        // 3. Visualizza le routine filtrate
        if (filteredRoutines && filteredRoutines.length > 0) {
            filteredRoutines.forEach((routine) => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `Routines-item-${routine.id}`;

                // --- Visualizzazione Dati (Nascondendo ID, VERIFICARE STRUTTURA!) ---
                const trigger = routine.trigger || {};
                const action = routine.action || {};
                const associatedShutters = routine.rollerShutters || []; // C'è questo campo?

                // Trigger Info (Mostra nome sensore invece di ID)
                const triggerType = routine.actionTime ? 'time' : (routine.lightSensor ? 'luminosity' : 'N/A');
                let triggerValue = 'N/A';
                 if (triggerType === 'time' && routine.actionTime) {
                    triggerValue = `${String(routine.actionTime.hour).padStart(2, '0')}:${String(routine.actionTime.minute).padStart(2, '0')}`;
                } else if (triggerType === 'luminosity' && routine.lightSensor) {
                    // Mostra NOME sensore invece di ID
                    triggerValue = `Sensor: ${routine.lightSensor.name || 'Unknown Sensor'}`; // Usa .name
                }

                // Action Info (Ancora da definire bene)
                const actionInfo = 'Action details TBD'; // Da definire come leggere/mostrare l'azione

                // Device Info (Mostra NOMI tapparelle invece di ID)
                const deviceName = associatedShutters.length > 0
                     ? associatedShutters.map(rs => rs.name || 'Unknown Shutter').join(', ') // Usa .name
                     : 'No specific device';

                li.innerHTML = `
                    <div>
                        <strong>${routine.name || 'Unnamed Routine'}</strong> <br>
                        <small>Device(s): ${deviceName} | Trigger: ${triggerValue} | Action: ${actionInfo}</small>
                    </div>
                    <div>
                       <button class="btn btn-sm btn-danger" onclick="deleteRoutines('${routine.id}', '${homeId || ''}')">Delete</button>
                    </div>
                `;
                RoutinesList.appendChild(li);
            });
        } else {
            // Mostra messaggio diverso se abbiamo filtrato ma non trovato nulla per quella casa specifica
            if (homeId) {
                 RoutinesList.innerHTML = "<li class='list-group-item list-group-item-placeholder'>No Routines found for this specific home.</li>";
            } else {
                 RoutinesList.innerHTML = "<li class='list-group-item list-group-item-placeholder'>No Routines found.</li>";
            }
        }
    } catch (error) {
        RoutinesList.innerHTML = `<li class='list-group-item text-danger'>Error loading Routines: ${error.message}</li>`;
    }
}

// Carica i dispositivi nel dropdown del form routine (API DA CONFERMARE!)
async function loadDevicesForRoutinesForm() {
    // Assicurati che l'ID HTML sia "RoutinesDeviceId"
    const select = document.getElementById("RoutinesDeviceId");
    if (!select) return;
    select.innerHTML = '<option value="">Loading devices...</option>';

    // --- API DA CONFERMARE CON BACKEND ---
    // Usiamo /api/entities/rollerShutter/ come ipotesi, ma potrebbe essere diverso
    const deviceApiPath = '/api/entities/rollerShutter/';
    console.warn("API path for loading devices into routine form needs confirmation. Using:", deviceApiPath);

    try {
        const devices = await fetchApi(deviceApiPath); // Usa l'API confermata
        select.innerHTML = '<option value="" disabled selected>Select a device</option>';

        if (devices && devices.length > 0) {
            devices.forEach((device) => {
                const option = document.createElement("option");
                option.value = device.id;
                option.textContent = device.name;
                select.appendChild(option);
            });
        } else {
             select.innerHTML = '<option value="" disabled>No devices available</option>';
        }
    } catch (error) {
        console.error("Error loading devices for Routines form:", error);
        select.innerHTML = '<option value="" disabled>Error loading devices</option>';
    }
}

// Mostra/Nasconde opzioni trigger (luminosità/tempo)
function toggleTriggerOptions() {
    const type = document.getElementById("triggerType").value;
    const luminositySection = document.getElementById("triggerLuminositySection");
    const timeSection = document.getElementById("triggerTimeSection");

    if(luminositySection) luminositySection.style.display = type === "luminosity" ? "block" : "none";
    if(timeSection) timeSection.style.display = type === "time" ? "block" : "none";
}

// Mostra il form per creare/modificare una routine
function showRoutinesForm() {
    // Assicurati che l'ID HTML sia "Routines-form"
    const formContainer = document.getElementById("Routines-form");
    if (!formContainer) {
        console.error("Routines form container (#Routines-form) not found!");
        return;
    }
    const actualForm = formContainer.querySelector("form");
    if (!actualForm) {
        console.error("Actual <form> element not found inside #Routines-form!");
        return;
    }

    document.getElementById("form-title").innerText = "Create Routine";
    actualForm.reset();

    // Assicurati che l'ID HTML sia "Routines-id-hidden" se lo usi per modifica
    document.getElementById("Routines-id-hidden")?.remove();

    // Imposta valori default
    document.getElementById("triggerType").value = "luminosity";
    toggleTriggerOptions();
    document.getElementById("action").value = "open";
    document.getElementById("actionPercentage").value = "100";

    // Carica dispositivi
    loadDevicesForRoutinesForm();

    formContainer.style.display = "block";
}

// Nasconde e resetta il form routine
function cancelRoutines() {
    // Assicurati che l'ID HTML sia "Routines-form"
    const formContainer = document.getElementById("Routines-form");
     if(formContainer) {
        const actualForm = formContainer.querySelector("form");
        if(actualForm) actualForm.reset();
        formContainer.style.display = "none";
        // Assicurati che l'ID HTML sia "Routines-id-hidden"
        document.getElementById("Routines-id-hidden")?.remove();
     }
}

// Salva una routine (CREAZIONE DA RIFARE!)


async function saveRoutines(event) {
    event.preventDefault();
    const form = event.target;
    const saveButton = event.submitter;
    if(saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
    }

    // --- 1. Leggi i valori comuni dal form ---
    const name = document.getElementById("RoutinesName").value.trim();
    const triggerType = document.getElementById("triggerType").value;
    // Azione
    const actionType = document.getElementById("action").value; // 'open' or 'close'
    const selectedPercentage = parseInt(document.getElementById("actionPercentage").value, 10); // 0, 25, 50, 75, 100
    // Tapparelle Target
    const targetShuttersCheckboxes = document.querySelectorAll('#routineTargetShuttersList input[type="checkbox"]:checked');
    const targetShutterIds = Array.from(targetShuttersCheckboxes).map(cb => cb.value);

    // --- NUOVO: Calcola il valore 'percentageOpening' da inviare ---
    let valueToSend;
    if (actionType === 'close') {
        valueToSend = 100 - selectedPercentage;
        console.log(`Action: Close, Target: ${selectedPercentage}%, Sending: ${valueToSend}`); // Debug
    } else { // actionType === 'open'
        valueToSend = selectedPercentage;
        console.log(`Action: Open, Target: ${selectedPercentage}%, Sending: ${valueToSend}`); // Debug
    }
    // --------------------------------------------------------------

    // Formatta le tapparelle come lista di oggetti {id} (OK da tua conferma)
    const rollerShuttersData = targetShutterIds.map(id => ({ id: parseInt(id, 10) }));

    // Variabili per path API e body base
    let apiPath = '';
    let data = {
        name: name,
        // --- IPOTESI STRUTTURA AZIONE (DA VERIFICARE!) ---
        // Dove va inserito 'valueToSend'? Ipotizzo ancora in 'action.percentageOpening'
        action: {
            percentageOpening: valueToSend // Usa il valore calcolato
        },
        // --- FINE IPOTESI AZIONE ---
        rollerShutters: rollerShuttersData
    };

    // --- Validazione Base ---
    if (!name || targetShutterIds.length === 0 || isNaN(selectedPercentage)) { // Controllo validità percentuale
        alert("Please provide a routine name, select target shutter(s), and set an action percentage.");
         if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; }
        return;
    }

    // --- 2. Leggi i dettagli specifici del trigger e imposta path/body ---
    if (triggerType === 'time') {
        apiPath = '/api/entities/routine/create/actionTime';
        const timeValue = document.getElementById("triggerTime").value; // "HH:MM"
        if (!timeValue) {
            alert("Please select a trigger time.");
             if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; }
            return;
        }
        const [hourStr, minuteStr] = timeValue.split(':');
        data.time = { // Usa 'time' come nel body API
            hour: parseInt(hourStr, 10),
            minute: parseInt(minuteStr, 10),
            second: 0,
            nano: 0
        };
        // L'oggetto 'data' ora contiene: name, time, action (ipotetico), rollerShutters

    } else if (triggerType === 'luminosity') {
        apiPath = '/api/entities/routine/create/lightSensor';
        const sensorId = document.getElementById("triggerSensorId").value;
        const condition = document.getElementById("triggerLuminosityCondition").value; // 'above' or 'below'
        const thresholdStr = document.getElementById("triggerLuminosityValue").value;

        if (!sensorId || !thresholdStr) {
            alert("Please select a trigger sensor and enter a luminosity threshold.");
             if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; }
            return;
        }
        const thresholdValue = parseInt(thresholdStr, 10);
        if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
             alert("Please enter a valid luminosity threshold (0-100).");
             if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; }
             return;
        }

        // Costruisci body - FORMATO DA CONFERMARE CON BACKEND!
        data.lightSensor = { id: parseInt(sensorId, 10) }; // Invia solo ID

        // --- IPOTESI CAMPI TRIGGER LUMINOSITÀ (DA VERIFICARE!) ---
        data.triggerCondition = condition; // Campo ipotetico
        data.triggerValue = thresholdValue; // Campo ipotetico
        // --- FINE IPOTESI TRIGGER ---

        // L'oggetto 'data' ora contiene: name, lightSensor, triggerCondition(ipotetico), triggerValue(ipotetico), action(ipotetico), rollerShutters

    } else {
        alert("Invalid trigger type selected.");
         if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; }
        return;
    }

    console.log("Attempting to save routine. Path:", apiPath, "Data:", JSON.stringify(data, null, 2));

    // --- 3. Esegui chiamata API ---
    try {
        console.warn("Executing save routine API call - Final body format (action, luminosity trigger details) needs confirmation from backend!");
        await fetchApi(apiPath, 'POST', data);

        alert(`Routine created successfully!`);
        cancelRoutines();

        const homeIdForReload = document.getElementById("Routines-home-id-hidden")?.value || null;
        loadRoutines(homeIdForReload);

    } catch (error) {
        console.error("Error saving routine:", error);
        const errorDetails = error.details ? `\nDetails: ${JSON.stringify(error.details)}` : '';
        alert(`Error saving routine: ${error.message}${errorDetails}`);
    } finally {
        if(saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Routine';
        }
    }
}


// Elimina una routine (Aggiornato con path corretto)
async function deleteRoutines(routineId, homeId = null) {
    if (!confirm("Are you sure you want to delete this routine?")) {
       return;
   }

   try {
       // Usa il NUOVO path per l'eliminazione (singolare 'routine')
       await fetchApi(`/api/entities/routine/delete/${routineId}`, 'DELETE');

       alert("Routine deleted successfully!");
       loadRoutines(homeId); // Ricarica lista

   } catch (error) {
        console.error(`Error deleting routine (ID: ${routineId}):`, error);
        alert(`Error deleting routine: ${error.message}`);
   }
}

// --- Funzione Modifica Routine (Commentata, richiede info API GET by ID e PATCH) ---
/*
async function showEditRoutinesForm(RoutinesId) {
    // ... (Logica simile a prima, ma usa path singolare 'routine' e verifica API)
    // const RoutinesData = await fetchApi(`/api/entities/routine/${RoutinesId}`); // API GET by ID esiste?
    // ... pre-compila form ...
    // ... mostra form ...
}
*/