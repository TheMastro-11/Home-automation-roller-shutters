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

    try {
        const allRoutines = await fetchApi(apiPath);
        RoutinesList.innerHTML = "";

        if (Array.isArray(allRoutines) && allRoutines.length > 0) {
            allRoutines.forEach((routine) => {
                if (!routine || !routine.id) return;

                // Estrazione dati
                const actionTime = routine.actionTime;               // { hour, minute }
                const lightSensor = routine.lightSensor;             // { name }
                const shutterValue = routine.rollerShutterValue;     // int %
                const lightThreshold = routine.lightSensorValue;     // int %

                // Trigger Info
                let triggerType, triggerValue;
                if (actionTime) {
                    triggerType = 'time';
                    triggerValue = `${String(actionTime.hour).padStart(2, '0')}:${String(actionTime.minute).padStart(2, '0')}`;
                } else if (lightSensor) {
                    triggerType = 'luminosity';
                    triggerValue = `Sensor: ${lightSensor.name}`;
                } else {
                    triggerType = 'N/A';
                    triggerValue = 'N/A';
                }

                // Device Info
                const associatedShutters = routine.rollerShutters || [];
                const deviceName = associatedShutters.length > 0
                    ? associatedShutters.map(rs => rs.name).join(', ')
                    : 'No target device';

                // ** Action Info **
                let actionInfo = '';
                if (triggerType === 'time') {
                    // ad es. "Set to 50% at 07:30"
                    actionInfo = `Set to ${shutterValue}% at ${triggerValue}`;
                } else if (triggerType === 'luminosity') {
                    // ad es. "Set to 75% when Sensor1 ≥ 40%"
                    actionInfo = `Set to ${shutterValue}% when ${lightSensor.name} hits ${lightThreshold}%`;
                } else {
                    actionInfo = 'N/A';
                }

                // Costruzione elemento LI
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `Routines-item-${routine.id}`;
                li.innerHTML = `
                <span class="routine-name">${routine.name || 'Unnamed Routine'}</span>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-warning" onclick="globalShowEditRoutineForm(${routine.id}, '${routine.name.replace(/'/g, "\\'")}')">
                    Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteRoutines(${routine.id})">
                    Delete
                    </button>
                </div>
                `;

                RoutinesList.appendChild(li);
            });
        } else {
            RoutinesList.innerHTML = "<li class='list-group-item list-group-item-placeholder'>No Routines found in the system.</li>";
        }
    } catch (error) {
        console.error("Error loading routines:", error);
        RoutinesList.innerHTML = `<li class='list-group-item text-danger'>Error loading Routines: ${error.message}</li>`;
    }
}

// Mostra inline l’input per editare il nome
function globalShowEditRoutineForm(id, currentName) {
    const li = document.getElementById(`Routines-item-${id}`);
    if (!li) return;

    li.innerHTML = `
      <input
        type="text"
        id="global-edit-input-routine-${id}"
        class="form-control form-control-sm"
        value="${currentName}"
        style="width: auto; display: inline-block; vertical-align: middle;"
      />
    `;

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group btn-group-sm ms-2';
    btnGroup.style.verticalAlign = 'middle';

    // Save
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = async () => {
        const newName = document.getElementById(`global-edit-input-routine-${id}`).value.trim();
        if (!newName) {
            alert('Inserisci un nome valido');
            return;
        }
        try {
            await fetchApi(`/api/entities/routine/patch/name/${id}`, 'PATCH', { name: newName });
            alert('Nome routine aggiornato!');
            loadRoutines(); // ricarica la lista
        } catch (err) {
            console.error('Errore nel patch routine:', err);
            alert(`Errore: ${err.message}`);
        }
    };

    // Cancel
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => loadRoutines();

    btnGroup.append(saveBtn, cancelBtn);
    li.appendChild(btnGroup);
}


// Carica SENSORI disponibili per il form routine
async function loadSensorsForRoutineForm() {
    const selectElement = document.getElementById("triggerSensorId");
    if (!selectElement) {
        console.error("Select element #triggerSensorId non trovato");
        return;
    }
    selectElement.innerHTML = '<option value="" disabled selected>Loading sensors...</option>';

    const apiPath = '/api/entities/lightSensor/';

    try {
        const sensors = await fetchApi(apiPath);
        selectElement.innerHTML = ''; // pulisci

        const defaultOpt = document.createElement('option');
        defaultOpt.value = ""; // Valore vuoto per opzione default
        defaultOpt.textContent = "-- Select Trigger Sensor --";
        selectElement.appendChild(defaultOpt);

        if (Array.isArray(sensors) && sensors.length > 0) {
            sensors.forEach(sensor => {
                if (!sensor.id || !sensor.name) return; // Salta se manca ID o Nome
                const opt = document.createElement('option');
                opt.value = sensor.name; // <-- USA NOME COME VALUE
                opt.textContent = sensor.name;
                selectElement.appendChild(opt);
            });
        } else {
            console.log("No available light sensors found.");
            defaultOpt.textContent = "-- No sensors available --";
        }
    } catch (err) {
        console.error("Error loading sensors for routine form:", err);
        selectElement.innerHTML = `<option value="" selected disabled>Error loading sensors!</option>`; // Mostra errore nella select
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

    const apiPath = '/api/entities/rollerShutter/';

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
    const formContainer = document.getElementById("Routines-form");
    if (!formContainer) {
        console.error("Elemento #Routines-form non trovato!");
        return;
    }
    const actualForm = formContainer.querySelector("form");
    if (!actualForm) {
        console.error("Nessun <form> dentro #Routines-form!");
        return;
    }

    // Reset e setup iniziale
    document.getElementById("form-title").innerText = "Create Routine";
    actualForm.reset();
    document.getElementById("Routines-id-hidden")?.remove();

    // Valori di default
    document.getElementById("triggerType").value = "luminosity";
    document.getElementById("action").value = "open";
    document.getElementById("actionPercentage").value = "100";
    toggleTriggerOptions();

    // Popola campi dinamici
    loadSensorsForRoutineForm();
    loadShuttersForRoutineForm();

    // Mostra form
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


// Funzione saveRoutines aggiornata (routines.js)

async function saveRoutines(event) {
    event.preventDefault(); // Previene il submit standard del form
    const saveButton = event.submitter;
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
    }

    // --- Helper interno per resettare il bottone ---
    function resetButton() {
        if (saveButton) {
            saveButton.disabled = false;
            // Potresti voler cambiare questo testo se modifichi una routine esistente
            saveButton.textContent = 'Save';
        }
    }

    try {
        // 1) Recupera Valori dal Form
        const name = document.getElementById("RoutinesName").value.trim();
        const triggerType = document.getElementById("triggerType").value; // "luminosity" | "time"

        // Azione tapparelle
        const actionType = document.getElementById("action").value; // "open" | "close"
        const selectedPercentage = parseInt(document.getElementById("actionPercentage").value, 10);

        // Tapparelle target (NOTA: ancora solo per nome, manca ID!)
        const checkedShutters = document.querySelectorAll('#routineTargetShuttersList input[type="checkbox"]:checked');
        const targetShutters = Array.from(checkedShutters).map(cb => ({ name: cb.value })); // <-- DA MODIFICARE POI per includere ID

        // Valori specifici per trigger
        const timeValue = document.getElementById("triggerTime").value; // "HH:MM"
        const sensorName = document.getElementById("triggerSensorId").value; // NOTA: ancora solo nome, manca ID!
        const thresholdValue = parseInt(document.getElementById("triggerLuminosityValue").value, 10);
        const condition = document.getElementById("triggerLuminosityCondition").value; // 'below' o 'above'

        // 2) Validazioni Preliminari
        if (!name || targetShutters.length === 0) {
            alert("Please enter a routine name and select at least one target shutter.");
            resetButton(); return;
        }
        // Calcola il valore effettivo da inviare per rollerShutterValue
        let rollerShutterValue = selectedPercentage;
        if (actionType === 'close') {
             rollerShutterValue = 100 - selectedPercentage;
        }
        if (isNaN(rollerShutterValue) || rollerShutterValue < 0 || rollerShutterValue > 100) {
            alert("Invalid action percentage."); resetButton(); return;
        }

        // 3) Costruisci Payload specifico per l'endpoint
        let apiPath, data = {
            name,
            rollerShutters: targetShutters, 
            rollerShutterValue 
        };

        if (triggerType === 'time') {
            if (!timeValue) {
                alert("Please select a trigger time."); resetButton(); return;
            }
            apiPath = '/api/entities/routine/create/actionTime';
            data.time = `${timeValue}:00`; // Aggiunge secondi, verifica se necessario
        } else { // triggerType === 'luminosity'
            if (!sensorName || isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
                alert("Please select a sensor and enter a valid threshold (0–100)."); resetButton(); return;
            }
            apiPath = '/api/entities/routine/create/lightSensor';

            // Oggetto lightSensor (NOTA: ancora solo per nome, manca ID!)
            data.lightSensor = { name: sensorName }; // <-- DA MODIFICARE POI per includere ID

            // *** CORREZIONE PRINCIPALE: Usa lightValueRecord ***
            data.lightValueRecord = {
                value: thresholdValue,
                // Verifica se 'above' deve mappare a true e 'below' a false
                method: (actionType === 'open')
            };

        }

        console.log('Saving routine - Payload aggiornato:', apiPath, data);

        // 4) Invio chiamata API
        await fetchApi(apiPath, 'POST', data);

        // 5) Successo
        alert(`Routine "${name}" created successfully!`); // Messaggio in inglese
        cancelRoutines(); // Chiude e resetta il form
        loadRoutines();   // Ricarica la lista delle routine

    } catch (err) {
        // 6) Errore
        console.error("Errore durante il salvataggio della routine:", err);
        // Mostra l'errore specifico restituito da fetchApi (che potrebbe venire dal backend)
        alert(`Error saving routine: ${err.message}`); // Messaggio in inglese
    } finally {
        // 7) Ripristina Bottone (sia in caso di successo che errore)
        resetButton();
    }
}


// Elimina una routine
async function deleteRoutines(routineId) {
    // Chiedi conferma
    if (!confirm("Are you sure you want to delete this routine?")) {
        return; // Interrompi se l'utente annulla
    }

    // Mostra un feedback visivo (opzionale, es. disabilitare bottone)
    const deleteButton = document.querySelector(`#Routines-item-${routineId} button.btn-danger`);
    if (deleteButton) deleteButton.disabled = true;

    try {
        // Chiama l'API DELETE
        await fetchApi(`/api/entities/routine/delete/${routineId}`, 'DELETE');

        // Successo
        alert("Routine deleted successfully!");
        loadRoutines(); // Ricarica la lista completa delle routine

    } catch (error) {
        // Gestione Errore
        console.error(`Error deleting routine (ID: ${routineId}):`, error);
        // Mostra un messaggio di errore specifico all'utente
        alert(`Error deleting routine: ${error.message}`);
        // Riabilita il bottone se l'eliminazione è fallita
        if (deleteButton) deleteButton.disabled = false;
    }
}