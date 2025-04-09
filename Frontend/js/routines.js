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

    // --- QUESTA FUNZIONE VA COMPLETAMENTE RISCRITTA ---
    // --- IN BASE ALLE INFO MANCANTI DAL BACKEND      ---

    alert("Save Routine function needs to be implemented based on backend API details!");

    // 1. Recupera tutti i dati dal form (name, deviceId, triggerType, triggerValue, action, percentage)
    // 2. Determina se il trigger è 'luminosity' o 'time'
    // 3. Determina l'apiPath corretto:
    //    - Se trigger è luminosity -> '/api/entities/routine/create/lightSensor'
    //    - Se trigger è time -> '/api/entities/routine/create/actionTime'
    // 4. Costruisci il JSON 'data' ESATTAMENTE come richiesto da quell'endpoint specifico (CHIEDI AL BACKEND DEV!)
    // 5. Fai la chiamata: await fetchApi(apiPath, 'POST', data);
    // 6. Gestisci successo/errore, ricarica lista, ecc.

    // Esempio MOLTO IPOTETICO (NON USARE):
    /*
    const triggerType = document.getElementById("triggerType").value;
    let apiPath = '';
    let data = {}; // Da costruire correttamente!
    if (triggerType === 'luminosity') {
        apiPath = '/api/entities/routine/create/lightSensor';
        // data = { name: ..., lightSensorId: ..., action: ... }; // COSA VUOLE IL BACKEND?
    } else { // time
        apiPath = '/api/entities/routine/create/actionTime';
        // data = { name: ..., hour: ..., minute: ..., action: ... }; // COSA VUOLE IL BACKEND?
    }
    // ... try/catch con fetchApi(apiPath, 'POST', data) ...
    */
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