// Carica le automazioni (filtrate per homeId se fornito)
async function loadAutomations(homeId = null) {
    const automationList = document.getElementById("automations-list");
    if (!automationList) return;
    automationList.innerHTML = "<li class='list-group-item'>Loading automations...</li>";

    // Adatta il path API in base a se filtri per casa o carichi tutto (filtrato da token)
    const apiPath = homeId ? `/api/entities/home/${homeId}/automations` : '/api/entities/automation/'; // Verifica endpoint corretto

    try {
        const automations = await fetchApi(apiPath);
        automationList.innerHTML = ""; // Pulisci

        if (automations && automations.length > 0) {
            automations.forEach((auto) => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.id = `automation-item-${auto.id}`;
                // Mostra dettagli utili (Trigger, Action, Device?)
                const triggerInfo = `${auto.trigger.type === 'time' ? auto.trigger.value : auto.trigger.value + '%'}`;
                const actionInfo = `${auto.action.type} to ${auto.action.percentage}%`;
                const deviceName = auto.device?.name || 'Unknown Device'; // Assumi che l'API restituisca info sul device

                 li.innerHTML = `
                    <div>
                        <strong>${auto.name}</strong> <br>
                        <small>Device: ${deviceName} | Trigger: ${triggerInfo} | Action: ${actionInfo}</small>
                    </div>
                    <div>
                       <button class="btn btn-sm btn-danger" onclick="deleteAutomation('${auto.id}', '${homeId || ''}')">Delete</button>
                    </div>
                `;
                automationList.appendChild(li);
            });
        } else {
            automationList.innerHTML = "<li class='list-group-item'>No automations found.</li>";
        }
    } catch (error) {
        automationList.innerHTML = `<li class='list-group-item text-danger'>Error loading automations: ${error.message}</li>`;
    }
}


// Carica i dispositivi nel dropdown del form automazioni
async function loadDevicesForAutomationForm() {
    const select = document.getElementById("automationDeviceId");
    if (!select) return;
    select.innerHTML = '<option value="">Loading devices...</option>';

    try {
        // Assumi che /device/ restituisca i device dell'utente/casa corrente
        const devices = await fetchApi('/api/entities/device/');
        select.innerHTML = '<option value="" disabled selected>Select a device</option>'; // Placeholder

        if (devices && devices.length > 0) {
            devices.forEach((device) => {
                const option = document.createElement("option");
                option.value = device.id; // Assumi che il backend si aspetti l'ID
                option.textContent = device.name;
                select.appendChild(option);
            });
        } else {
             select.innerHTML = '<option value="" disabled>No devices available</option>';
        }
    } catch (error) {
        console.error("Error loading devices for automation form:", error);
        select.innerHTML = '<option value="" disabled>Error loading devices</option>';
    }
}

function toggleTriggerOptions() {
    const type = document.getElementById("triggerType").value;
    const luminositySection = document.getElementById("triggerLuminositySection");
    const timeSection = document.getElementById("triggerTimeSection");

    if(luminositySection) luminositySection.style.display = type === "luminosity" ? "block" : "none";
    if(timeSection) timeSection.style.display = type === "time" ? "block" : "none";
}

function showAutomationForm() {
    const form = document.getElementById("automation-form");
    if(!form) return;

    // Resetta il form
    document.getElementById("form-title").innerText = "Create Automation";
    form.reset(); // Metodo standard per resettare i form
    document.getElementById("automation-id-hidden")?.remove(); // Rimuovi ID nascosto se presente (per edit)

    // Imposta valori di default se necessario (dopo reset)
    document.getElementById("triggerType").value = "luminosity";
    toggleTriggerOptions(); // Aggiorna visibilità campi trigger
    document.getElementById("action").value = "open";
     // Carica i dispositivi nel dropdown ogni volta che si apre il form
    loadDevicesForAutomationForm();

    form.style.display = "block";
}

function cancelAutomation() {
    const form = document.getElementById("automation-form");
     if(form) {
        form.style.display = "none";
        form.reset();
        document.getElementById("automation-id-hidden")?.remove();
     }
}

// Funzione unica per creare o aggiornare (se implementi modifica)
async function saveAutomation(event) {
    event.preventDefault();
    const form = event.target;
    const saveButton = event.submitter;

    // Recupera dati dal form
    const name = document.getElementById("automationName").value;
    const deviceId = document.getElementById("automationDeviceId").value; // Questo è l'ID del device
    const triggerType = document.getElementById("triggerType").value;
    const triggerValue = triggerType === "luminosity"
        ? document.getElementById("triggerLuminosity").value
        : document.getElementById("triggerTime").value;
    const actionType = document.getElementById("action").value; // 'open' or 'close'
    const actionPercentage = document.getElementById("actionPercentage").value;
    const homeIdForReload = document.getElementById("automation-home-id-hidden")?.value || null; // ID casa per ricaricare lista

    // Validazione base
    if (!name || !deviceId || !triggerValue) {
        alert("Please fill in all automation details.");
        return;
    }

    // Costruisci il payload per l'API
    // Assicurati che la struttura corrisponda a quella attesa dal backend!
    const data = {
        name: name,
        // Invia l'ID del device. Il backend dovrebbe associarlo.
        // Se il backend si aspetta l'oggetto device completo, dovrai fare una GET prima.
        deviceId: deviceId,
        trigger: {
            type: triggerType,
            value: triggerValue,
        },
        action: {
            type: actionType,
            percentage: parseInt(actionPercentage, 10),
        },
        // Aggiungi homeId se l'endpoint /create lo richiede
        // homeId: homeIdForReload
    };

    saveButton.disabled = true;
    const automationId = document.getElementById("automation-id-hidden")?.value; // Controlla se stiamo modificando
    const method = automationId ? 'PUT' : 'POST'; // O PATCH per modifica
    const apiPath = automationId
        ? `/api/entities/automation/put/${automationId}` // Verifica endpoint PUT/PATCH
        : '/api/entities/automation/create';         // Verifica endpoint POST

     if(method === 'PUT') data.id = automationId; // Aggiungi ID per PUT se necessario

    try {
        await fetchApi(apiPath, method, data);
        alert(`Automation ${automationId ? 'updated' : 'created'} successfully!`);
        cancelAutomation(); // Nascondi e resetta form
        loadAutomations(homeIdForReload); // Ricarica lista
    } catch (error) {
        alert(`Error saving automation: ${error.message}`);
    } finally {
        saveButton.disabled = false;
    }
}

async function deleteAutomation(automationId, homeId = null) {
     if (!confirm("Are you sure you want to delete this automation?")) {
        return;
    }
    try {
        await fetchApi(`/api/entities/automation/${automationId}`, 'DELETE'); // Verifica endpoint DELETE
        alert("Automation deleted successfully!");
        loadAutomations(homeId); // Ricarica lista per la casa corrente
    } catch (error) {
         alert(`Error deleting automation: ${error.message}`);
    }
}

// --- Gestione Modifica Automazione (DA IMPLEMENTARE SE NECESSARIO) ---
/*
async function showEditAutomationForm(automationId) {
    const form = document.getElementById("automation-form");
    if (!form) return;
    form.reset(); // Pulisci prima
    document.getElementById("form-title").innerText = "Edit Automation";

    // 1. Aggiungi input hidden per ID
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.id = 'automation-id-hidden';
    idInput.value = automationId;
    form.appendChild(idInput);

    try {
        // 2. Carica i dati dell'automazione specifica
        const automationData = await fetchApi(`/api/entities/automation/${automationId}`); // Verifica endpoint GET

        // 3. Pre-compila il form
        document.getElementById("automationName").value = automationData.name;

        // 4. Carica i device e seleziona quello corretto
        await loadDevicesForAutomationForm(); // Assicurati che sia asincrono e atteso
        document.getElementById("automationDeviceId").value = automationData.deviceId; // O automationData.device.id

        // 5. Imposta trigger
        document.getElementById("triggerType").value = automationData.trigger.type;
        toggleTriggerOptions(); // Mostra campi giusti
        if (automationData.trigger.type === 'luminosity') {
            document.getElementById("triggerLuminosity").value = automationData.trigger.value;
        } else {
            document.getElementById("triggerTime").value = automationData.trigger.value;
        }

        // 6. Imposta azione
        document.getElementById("action").value = automationData.action.type;
        document.getElementById("actionPercentage").value = automationData.action.percentage;

        // 7. Mostra il form
        form.style.display = 'block';

    } catch (error) {
        alert(`Error loading automation data for editing: ${error.message}`);
        cancelAutomation(); // Nascondi form se c'è errore
    }
}
*/