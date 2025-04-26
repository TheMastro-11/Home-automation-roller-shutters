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
    const selectElement = document.getElementById("triggerSensorId");
    if (!selectElement) {
        console.error("Select element #triggerSensorId non trovato");
        return;
    }
    selectElement.innerHTML = '<option value="" disabled selected>Loading sensors...</option>';

    const apiPath = '/api/entities/lightSensor/'; // Ipotesi API
    console.warn("API path for loading available sensors needs confirmation. Using:", apiPath);

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

async function saveRoutine(event) {
    event.preventDefault();
    const btn = event.submitter;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  
    const name = document.getElementById('RoutinesName').value.trim();
    const triggerType = document.getElementById('triggerType').value;
    const targetShutters = Array.from(
      document.querySelectorAll('#routineTargetShuttersList input:checked')
    ).map(cb => cb.value);
  
    if (!name || targetShutters.length === 0) {
      alert('Inserisci un nome e seleziona almeno una tapparella.');
      if (btn) { btn.disabled = false; btn.textContent = 'Save Routine'; }
      return;
    }
  
    let apiPath = '';
    const payload = {
      name,
      rollerShutters: targetShutters.map(n => ({ name: n }))
    };
  
    if (triggerType === 'time') {
      apiPath = '/api/entities/routine/create/actionTime';
      const timeValue = document.getElementById('triggerTime').value;
      if (!timeValue) {
        alert('Seleziona un orario per il trigger.');
        if (btn) { btn.disabled = false; btn.textContent = 'Save Routine'; }
        return;
      }
      payload.time = `${timeValue}:00`;
  
    } else if (triggerType === 'luminosity') {
      apiPath = '/api/entities/routine/create/lightSensor';
      const sensorName = document.getElementById('triggerSensorId').value;
      if (!sensorName) {
        alert('Seleziona un sensore per il trigger.');
        if (btn) { btn.disabled = false; btn.textContent = 'Save Routine'; }
        return;
      }
      payload.lightSensor = { name: sensorName };
  
    } else {
      alert('Tipo di trigger non valido.');
      if (btn) { btn.disabled = false; btn.textContent = 'Save Routine'; }
      return;
    }
  
    try {
      await fetchApi(apiPath, 'POST', payload);
      alert(`Routine "${name}" creata con successo!`);
      cancelRoutines();
      loadRoutines();
    } catch (error) {
      console.error('Errore creazione routine:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save Routine'; }
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