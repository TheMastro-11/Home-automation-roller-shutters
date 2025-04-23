// ========================================
//        js/routines.js
// ========================================

// Carica le routine
async function loadRoutines() { 
    const RoutinesList = document.getElementById("Routines-list");
    if (!RoutinesList) {
        console.error("Element with ID 'Routines-list' not found.");
        return;
    }
    RoutinesList.innerHTML = "<li class='list-group-item'>Loading Routines...</li>";

    const apiPath = '/api/entities/routine/';
    console.log("Loading ALL routines from:", apiPath);

    // Non c'è più il blocco if(homeId){...} qui

    try {
        // 1. Ottieni TUTTE le routine accessibili
        const allRoutines = await fetchApi(apiPath);

        RoutinesList.innerHTML = ""; // Pulisci

        // 2. Visualizza TUTTE le routine ricevute (nessun filtro)
        if (allRoutines && Array.isArray(allRoutines) && allRoutines.length > 0) {
            console.log(`Displaying ${allRoutines.length} total routine(s) received.`);
            allRoutines.forEach((routine) => { // Itera direttamente su allRoutines
                if (!routine || !routine.id) return; // Salta routine invalide
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `Routines-item-${routine.id}`;

                // --- Visualizzazione Dati (VERIFICARE STRUTTURA RISPOSTA API!) ---
                const lightSensor = routine.lightSensor;
                const actionTime = routine.actionTime; // API lo ritorna?
                const associatedShutters = routine.rollerShutters || [];
                // const action = routine.action || {}; // Non supportato

                // Trigger Info
                const triggerType = actionTime ? 'time' : (lightSensor ? 'luminosity' : 'N/A');
                let triggerValue = 'N/A';
                 if (triggerType === 'time') {
                     // ATTENZIONE: API GET /routine/ potrebbe non includere actionTime!
                     triggerValue = actionTime ? `${String(actionTime.hour).padStart(2, '0')}:${String(actionTime.minute).padStart(2, '0')}` : 'Time (Data Missing?)';
                } else if (triggerType === 'luminosity') {
                    triggerValue = `Sensor: ${lightSensor?.name || 'Unknown Sensor'}`;
                }

                // Action Info (Non disponibile)
                const actionInfo = 'Action: TBD (Not Saved)';

                // Device Info
                const deviceName = associatedShutters.length > 0
                     ? associatedShutters.map(rs => rs.name || 'Unknown Shutter').join(', ') // Mostra NOMI
                     : 'No target device';

                li.innerHTML = `
                    <div>
                        <strong>${routine.name || 'Unnamed Routine'}</strong><br>
                        <small>Device(s): ${deviceName} | Trigger: ${triggerValue} | Action: ${actionInfo}</small>
                    </div>
                    <div>
                       <button class="btn btn-sm btn-danger" onclick="deleteRoutines('${routine.id}')">Delete</button>
                    </div>
                `;
                RoutinesList.appendChild(li);
            }); // Fine forEach
        } else {
            // Messaggio generico
            RoutinesList.innerHTML = "<li class='list-group-item list-group-item-placeholder'>No Routines found in the system.</li>";
        } // Fine if/else allRoutines
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
    } catch (error) {
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

    if (luminositySection) luminositySection.style.display = type === "luminosity" ? "block" : "none";
    if (timeSection) timeSection.style.display = type === "time" ? "block" : "none";
}

// Mostra il form per creare/modificare una routine
function showRoutinesForm() {
    const formContainer = document.getElementById("Routines-form"); // Cerca il DIV del form
    if (!formContainer) {
        console.error("ERRORE: Elemento #Routines-form non trovato in HTML!");
        alert("Errore: Impossibile trovare il form delle routine.");
        return;
    }
    const actualForm = formContainer.querySelector("form"); // Trova il form DENTRO al div
    if (!actualForm) {
        console.error("ERRORE: Elemento <form> non trovato dentro #Routines-form!");
        alert("Errore: Struttura interna del form routine non trovata.");
        return;
    }

    console.log("showRoutinesForm: Trovato form, reset in corso...");
    document.getElementById("form-title").innerText = "Create Routine";
    actualForm.reset(); // Resetta il form interno
    document.getElementById("Routines-id-hidden")?.remove(); // Rimuovi ID se presente

    // Imposta valori default
    document.getElementById("triggerType").value = "luminosity";
    toggleTriggerOptions(); // Aggiorna visibilità sezioni trigger
    document.getElementById("action").value = "open";
    document.getElementById("actionPercentage").value = "100";

    // Chiama le funzioni per popolare i campi dinamici
    console.log("showRoutinesForm: Chiamata a loadSensorsForRoutineForm...");
    loadSensorsForRoutineForm();
    console.log("showRoutinesForm: Chiamata a loadShuttersForRoutineForm...");
    loadShuttersForRoutineForm();

    // Mostra il contenitore del form
    console.log("showRoutinesForm: Mostro il form.");
    formContainer.style.display = "block";
}

// Nasconde e resetta il form routine
function cancelRoutines() {
    const formContainer = document.getElementById("Routines-form");
    if (formContainer) {
        const actualForm = formContainer.querySelector("form");
        if (actualForm) actualForm.reset();
        formContainer.style.display = "none";
        document.getElementById("Routines-id-hidden")?.remove();
    }
}

// In js/routines.js
async function saveRoutines(event) {
    event.preventDefault();
    const form = event.target;
    const saveButton = event.submitter;
    if(saveButton) { saveButton.disabled = true; saveButton.textContent = 'Saving...'; }

    // --- Leggi valori dal form ---
    const name = document.getElementById("RoutinesName").value.trim();
    const triggerType = document.getElementById("triggerType").value;
    const targetShuttersCheckboxes = document.querySelectorAll('#routineTargetShuttersList input[type="checkbox"]:checked');
    const targetShutterNames = Array.from(targetShuttersCheckboxes).map(cb => cb.value);

    // Dati Azione/Trigger Luminosità (Letti ma NON inviati correttamente finché API non aggiornata)
    const actionType = document.getElementById("action").value;
    const selectedPercentage = parseInt(document.getElementById("actionPercentage").value, 10);
    const condition = document.getElementById("triggerLuminosityCondition").value;
    const thresholdStr = document.getElementById("triggerLuminosityValue").value;
    const thresholdValue = parseInt(thresholdStr, 10);
    let valueToSend = (actionType === 'close') ? (100 - selectedPercentage) : selectedPercentage;

    // Prepara payload base e path API
    let apiPath = '';
    let data = {
        name: name,
        rollerShutters: targetShutterNames.map(shutterName => ({ name: shutterName }))
        // === I CAMPI SEGUENTI MANCANO O SONO IPOTETICI ===
        // action: { percentageOpening: valueToSend }, // <-- DOVE VA?
        // triggerCondition: condition,               // <-- DOVE VA?
        // triggerValue: thresholdValue                 // <-- DOVE VA?
        // =============================================
    };

    // --- Validazione Base ---
    if (!name || targetShutterNames.length === 0 ) {
        alert("Please provide name and select target shutter(s).");
        if(saveButton) { saveButton.disabled = false; saveButton.textContent = 'Save Routine'; } return;
    }

    // --- Aggiungi dati specifici del trigger (Solo quelli supportati) ---
    if (triggerType === 'time') {
        apiPath = '/api/entities/routine/create/actionTime';
        const timeValue = document.getElementById("triggerTime").value;
        if (!timeValue) { alert("Please select trigger time."); if(saveButton){/*...*/ } return; }
        data.time = `${timeValue}:00`; // Formato HH:MM:SS

        // Log dati mancanti
        console.warn("Routine Save: Action details (percentage) are not included in payload (backend support missing).");

    } else if (triggerType === 'luminosity') {
        apiPath = '/api/entities/routine/create/lightSensor';
        const sensorName = document.getElementById("triggerSensorId").value;
        if (!sensorName) { alert("Please select trigger sensor."); if(saveButton){/*...*/} return; }
        // Validazione soglia (anche se non la inviamo ancora correttamente)
        if (!thresholdStr || isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) { alert("Invalid threshold (0-100)."); if(saveButton){/*...*/} return; }

        data.lightSensor = { name: sensorName }; // NOME sensore

        // Log dati mancanti
        console.warn("Routine Save: Action details (percentage) and Luminosity Trigger details (condition/threshold) are not included in payload (backend support missing).");

    } else { /* Invalid trigger */ return; }

    console.log("Attempting to save routine with current supported data...");
    console.log("Path:", apiPath);
    console.log("Payload:", JSON.stringify(data, null, 2));

    // --- Chiamata API (ORA VIENE ESEGUITA!) ---
    try {
        await fetchApi(apiPath, 'POST', data); // Invia i dati parziali

        // Messaggio di successo modificato per riflettere lo stato parziale
        alert(`Routine '${name}' created! NOTE: Action/Trigger details may not be saved until backend is updated.`);
        cancelRoutines(); // Chiudi e resetta form

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
        loadRoutines();
    } catch (error) { /*...*/ }
}
