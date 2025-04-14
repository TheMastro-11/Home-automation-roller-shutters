// ========================================
//        js/routines.js (COMPLETO)
// ========================================

// Nota: Assicurati che questo file sia caricato DOPO api.js e auth.js
// e PRIMA di dashboard.js

// Carica le routine (filtrate per homeId se fornito - LOGICA FILTRO DA VERIFICARE!)
async function loadRoutines(homeId = null) {
    const RoutinesList = document.getElementById("Routines-list");
    if (!RoutinesList) { console.error("Element with ID 'Routines-list' not found."); return; }
    RoutinesList.innerHTML = "<li class='list-group-item'>Loading Routines...</li>";

    const apiPath = '/api/entities/routine/'; // Path base corretto
    console.log("Loading all routines from:", apiPath);

    try {
        let allRoutines = await fetchApi(apiPath);
        let filteredRoutines = [];

        // Filtra lato client se homeId è fornito (VERIFICARE routine.home.id!)
        if (homeId && allRoutines && Array.isArray(allRoutines) && allRoutines.length > 0) {
            console.log(`Filtering routines for homeId: ${homeId}`);
            filteredRoutines = allRoutines.filter(routine => routine?.home?.id && String(routine.home.id) === String(homeId));
            if (filteredRoutines.length === 0) { console.log(`No routines found specifically for homeId: ${homeId}.`); }
        } else if (allRoutines && Array.isArray(allRoutines)) {
            filteredRoutines = allRoutines; // Usa tutte se non c'è homeId o l'array è vuoto
        } else {
            filteredRoutines = []; // Assicura sia un array vuoto se l'API non restituisce nulla
        }

        RoutinesList.innerHTML = ""; // Pulisci

        if (filteredRoutines.length > 0) {
            filteredRoutines.forEach((routine) => {
                if (!routine || !routine.id) return; // Salta routine invalide
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `Routines-item-${routine.id}`;

                // --- Visualizzazione Dati (VERIFICARE STRUTTURA RISPOSTA API!) ---
                const lightSensor = routine.lightSensor; // Oggetto sensore?
                const actionTime = routine.actionTime;   // Oggetto tempo?
                const associatedShutters = routine.rollerShutters || []; // Lista tapparelle?
                const action = routine.action || {}; // Oggetto azione?

                // Trigger Info
                const triggerType = actionTime ? 'time' : (lightSensor ? 'luminosity' : 'N/A');
                let triggerValue = 'N/A';
                 if (triggerType === 'time' && actionTime) {
                    triggerValue = `${String(actionTime.hour).padStart(2, '0')}:${String(actionTime.minute).padStart(2, '0')}`;
                } else if (triggerType === 'luminosity' && lightSensor) {
                    // Come definire il trigger? Soglia? Condizione? Mancano in API create...
                    triggerValue = `Sensor: ${lightSensor.name || 'Unknown Sensor'}`; // Mostra nome sensore
                }

                // Action Info (Mancano dettagli nell'API create!)
                const actionPercent = action.percentageOpening ?? 'N/A'; // Esiste questo campo nella risposta?
                const actionInfo = `Set opening to ${actionPercent}%`; // Visualizzazione ipotetica

                // Device Info
                const deviceName = associatedShutters.length > 0
                     ? associatedShutters.map(rs => rs.name || 'Unknown Shutter').join(', ') // Mostra NOMI
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
            const message = homeId ? "No Routines found for this specific home." : "No Routines found.";
            RoutinesList.innerHTML = `<li class='list-group-item list-group-item-placeholder'>${message}</li>`;
        }
    } catch (error) {
        console.error("Error loading routines:", error);
        RoutinesList.innerHTML = `<li class='list-group-item text-danger'>Error loading Routines: ${error.message}</li>`;
    }
}


// Carica SENSORI disponibili per il form routine
async function loadSensorsForRoutineForm() {
    const selectElementId = "triggerSensorId"; // ID della select nel form Routine
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
    selectElement.innerHTML = '<option value="" selected disabled>Loading sensors...</option>';

    // === API DA CONFERMARE (usiamo /lightSensor/ come ipotesi) ===
    const apiPath = '/api/entities/lightSensor/';
    console.warn("API path for loading available sensors needs confirmation. Using:", apiPath);

    try {
        const sensors = await fetchApi(apiPath); // GET
        selectElement.innerHTML = ''; // Pulisci

        const defaultOption = document.createElement('option');
        defaultOption.value = ""; // Valore vuoto per permettere la non selezione
        defaultOption.textContent = "-- Select Trigger Sensor --";
        selectElement.appendChild(defaultOption);

        if (sensors && Array.isArray(sensors) && sensors.length > 0) {
            sensors.forEach(sensor => {
                if (sensor && sensor.id && sensor.name) {
                    const option = document.createElement('option');
                    // Usiamo NOME come value perchè l'API create/lightSensor sembra richiederlo
                    option.value = sensor.name;
                    option.textContent = sensor.name;
                    selectElement.appendChild(option);
                }
            });
        } else {
            console.log("No available light sensors found.");
            defaultOption.textContent = "-- No sensors available --";
        }

    } catch (error) {
        console.error(`Error loading available sensors into select #${selectElementId}:`, error);
        selectElement.innerHTML = `<option value="" selected disabled>Error loading sensors!</option>`;
    }
}

// Carica TAPPARELLE disponibili per il form routine
async function loadShuttersForRoutineForm() {
    const containerElementId = "routineTargetShuttersList"; // ID del div nel form Routine
    const loadingElementId = "routineTargetShuttersLoading";

    const container = document.getElementById(containerElementId);
    let loadingMsg = document.getElementById(loadingElementId); // Cerca p esistente
    if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }

    // Mostra/Imposta messaggio loading
    if (loadingMsg) { loadingMsg.style.display = 'block'; loadingMsg.textContent = "Loading available shutters..."; }
    else { container.innerHTML = `<p id="${loadingElementId}" style="color: #ccc;">Loading available shutters...</p>`; loadingMsg = document.getElementById(loadingElementId); }
    // Rimuovi vecchie checkbox
     Array.from(container.querySelectorAll('.form-check')).forEach(el => el.remove());

    // === API DA CONFERMARE (usiamo /rollerShutter/ come ipotesi) ===
    const apiPath = '/api/entities/rollerShutter/';
    console.warn("API path for loading available shutters needs confirmation. Using:", apiPath);

    try {
        const allShutters = await fetchApi(apiPath);
        document.getElementById(loadingElementId)?.remove(); // Rimuovi p loading
        container.innerHTML = ''; // Pulisci

        if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
            allShutters.forEach(shutter => {
                if (shutter && shutter.id && shutter.name) {
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    const checkId = `routine_shutter_${shutter.id}`;
                    const safeName = shutter.name.replace(/"/g, '&quot;'); // Escape double quotes
                    div.innerHTML = `
                        <input class="form-check-input" type="checkbox" value="${safeName}" id="${checkId}">
                        <label class="form-check-label" for="${checkId}">${shutter.name}</label>
                    `;
                    container.appendChild(div);
                }
            });
            console.log("Rendered shutter checkboxes for routine form.");
        } else {
            container.innerHTML = '<p style="color: #ccc;">No available shutters found.</p>';
        }
    } catch(error) {
        console.error("Error loading shutters for Routine form:", error);
        document.getElementById(loadingElementId)?.remove();
        container.innerHTML = '<p class="text-danger">Error loading shutters.</p>';
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
    const formContainer = document.getElementById("Routines-form"); if (!formContainer) return;
    const actualForm = formContainer.querySelector("form"); if (!actualForm) return;

    document.getElementById("form-title").innerText = "Create Routine";
    actualForm.reset();
    document.getElementById("Routines-id-hidden")?.remove(); // Rimuovi ID se presente

    // Imposta valori default
    document.getElementById("triggerType").value = "luminosity";
    toggleTriggerOptions();
    document.getElementById("action").value = "open";
    document.getElementById("actionPercentage").value = "100";

    // Chiama le funzioni per popolare i campi dinamici
    loadSensorsForRoutineForm();
    loadShuttersForRoutineForm();

    formContainer.style.display = "block";
}

// Nasconde e resetta il form routine
function cancelRoutines() {
    const formContainer = document.getElementById("Routines-form");
     if(formContainer) {
        const actualForm = formContainer.querySelector("form");
        if(actualForm) actualForm.reset();
        formContainer.style.display = "none";
        document.getElementById("Routines-id-hidden")?.remove();
     }
}

// In js/routines.js (Versione Semplificata basata sul Controller Java)
async function saveRoutines(event) {
    event.preventDefault();
    const form = event.target;
    const saveButton = event.submitter;
    if(saveButton) { saveButton.disabled = true; saveButton.textContent = 'Saving...'; }

    // --- Leggi i valori necessari dal form ---
    const name = document.getElementById("RoutinesName").value.trim();
    const triggerType = document.getElementById("triggerType").value;
    const targetShuttersCheckboxes = document.querySelectorAll('#routineTargetShuttersList input[type="checkbox"]:checked');
    const targetShutterNames = Array.from(targetShuttersCheckboxes).map(cb => cb.value); // NOMI tapparelle

    // Prepara payload base e path API
    let apiPath = '';
    let data = {
        name: name,
        // Invia lista di oggetti con NOMI (come da test/controller)
        rollerShutters: targetShutterNames.map(shutterName => ({ name: shutterName }))
    };

    // --- Validazione Base ---
    if (!name || targetShutterNames.length === 0 ) {
        alert("Please provide a routine name and select at least one target shutter.");
        if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; } return;
    }

    // --- Aggiungi dati specifici del trigger ---
    if (triggerType === 'time') {
        apiPath = '/api/entities/routine/create/actionTime';
        const timeValue = document.getElementById("triggerTime").value; // "HH:MM"
        if (!timeValue) { alert("Please select a trigger time."); if(saveButton){/*...*/ } return; }
        // Invia come stringa HH:MM:SS come richiesto dai test
        data.time = `${timeValue}:00`; // Aggiunge ":00"

    } else if (triggerType === 'luminosity') {
        apiPath = '/api/entities/routine/create/lightSensor';
        const sensorName = document.getElementById("triggerSensorId").value; // Legge NOME sensore
        if (!sensorName) { alert("Please select a trigger sensor."); if(saveButton){/*...*/} return; }

        // Aggiungi sensore con NOME come da test/controller
        data.lightSensor = { name: sensorName };

        // I campi condition/threshold NON vengono inviati perché l'API non li supporta
        console.warn("Luminosity condition and threshold fields ignored (API does not support them yet).");

    } else { alert("Invalid trigger type."); if(saveButton){/*...*/} return; }

    // L'oggetto 'data' NON contiene l'azione (percentage) perché l'API non la supporta

    console.log("Attempting to save routine (Data supported by current API). Path:", apiPath, "Data:", JSON.stringify(data, null, 2));

    // --- Chiamata API ---
    try {
        await fetchApi(apiPath, 'POST', data);

        alert(`Routine '${name}' created successfully! (Action/Trigger details not saved yet)`);
        cancelRoutines(); // Nascondi e resetta form

        const homeIdForReload = document.getElementById("Routines-home-id-hidden")?.value || null;
        loadRoutines(homeIdForReload); // Ricarica lista

    } catch (error) {
        console.error("Error saving routine:", error);
        const errorDetails = error.details ? `\nDetails: ${JSON.stringify(error.details)}` : '';
        alert(`Error saving routine: <span class="math-inline">\{error\.message\}</span>{errorDetails}`);
    } finally {
        if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; }
    }
}


// Elimina una routine
async function deleteRoutines(routineId, homeId = null) {
    if (!confirm("Are you sure?")) { return; }
    try {
        await fetchApi(`/api/entities/routine/delete/${routineId}`, 'DELETE');
        alert("Routine deleted successfully!");
        loadRoutines(homeId);
    } catch (error) { /*...*/ }
}
