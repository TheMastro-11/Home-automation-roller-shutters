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
                let triggerInfo = 'N/A';

                if (routine.actionTime 
                    && typeof routine.actionTime === 'object'
                    && routine.actionTime.hour !== undefined 
                    && routine.actionTime.minute !== undefined) {
                    
                    triggerInfo = `Time: ${String(routine.actionTime.hour).padStart(2,'0')}:${String(routine.actionTime.minute).padStart(2,'0')}`;
                }
                else if (typeof routine.actionTime === 'string') {
                    const hhmm = routine.actionTime.slice(0,5);
                    triggerInfo = `Time: ${hhmm}`;
                }
                else if (routine.lightSensor && routine.lightSensor.name
                         && routine.lightValue && routine.lightValue.value !== undefined) {
                    const sensorName = routine.lightSensor.name;
                    const threshold = routine.lightValue.value;
                    const condition = routine.lightValue.method === true ? 'Above' : 'Below';
                    triggerInfo = `Luminosity: ${sensorName} ${condition} ${threshold}%`;
                }
                const shutterValue = routine.rollerShutterValue;
                const associatedShutters = routine.rollerShutters || [];
                const targetDeviceNames = associatedShutters.length > 0
                    ? associatedShutters.map(rs => rs.name).join(', ')
                    : 'No target shutters';
                const actionInfo = `Set to ${shutterValue}%`;
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
                li.id = `Routines-item-${routine.id}`;
                const safeName = (routine.name || 'Unnamed Routine').replace(/'/g, "\\'");

                li.innerHTML = `
                    <div>
                        <strong class="routine-name me-2">${routine.name || 'Unnamed Routine'}</strong>
                        <small class="text-muted d-block">
                            Trigger: ${triggerInfo} | Action: ${actionInfo} | Targets: ${targetDeviceNames}
                        </small>
                    </div>
                    <div class="btn-group btn-group-sm mt-1 mt-sm-0">
                        <button class="btn btn-warning"
                                onclick="globalShowEditRoutineForm(${routine.id}, '${safeName}')">
                            Edit Name
                        </button>
                        <button class="btn btn-danger"
                                onclick="deleteRoutine(${routine.id})">
                            Delete
                        </button>
                    </div>`;

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


function globalShowEditRoutineForm(id, currentName) {
    const li = document.getElementById(`Routines-item-${id}`);
    if (!li) return; 
    const originalContent = li.innerHTML;
    li.innerHTML = `
      <div class="d-flex align-items-center flex-grow-1 me-2">
          <input
            type="text"
            id="global-edit-input-routine-${id}"
            class="form-control form-control-sm"
            value="${currentName}"
            required
          />
      </div>
      <div class="btn-group btn-group-sm"></div>
    `; 

    const btnGroup = li.querySelector('.btn-group'); 

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save';
    saveBtn.type = 'button';
    saveBtn.onclick = async () => {
        const inputEl = document.getElementById(`global-edit-input-routine-${id}`);
        const newName = inputEl ? inputEl.value.trim() : '';
        if (!newName) {
            alert('Please enter a valid routine name.');
            return;
        }
        try {
            saveBtn.disabled = true; 
            await fetchApi(`/api/entities/routine/patch/name/${id}`, 'PATCH', { name: newName }); 
            alert('Routine name updated successfully!'); 
            loadRoutines();
        } catch (err) {
            console.error('Error patching routine name:', err); 
            alert(`Error updating name: ${err.message}`);
            li.innerHTML = originalContent;
        }
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.onclick = () => loadRoutines(); 
    btnGroup.append(saveBtn, cancelBtn); 
    document.getElementById(`global-edit-input-routine-${id}`).focus();
}


async function loadSensorsForRoutineForm() {
    const selectElement = document.getElementById("triggerSensorId");
    if (!selectElement) {
        console.error("Select element #triggerSensorId not found in routine form."); 
        return;
    }
    selectElement.innerHTML = '<option value="" disabled selected>Loading sensors...</option>'; 

    const apiPath = '/api/entities/lightSensor/';

    try {
        const sensors = await fetchApi(apiPath);
        selectElement.innerHTML = ''; 

        const defaultOpt = document.createElement('option');
        defaultOpt.value = ""; 
        defaultOpt.textContent = "-- Select Trigger Sensor --";
        defaultOpt.disabled = true; 
        defaultOpt.selected = true;
        selectElement.appendChild(defaultOpt);

        if (Array.isArray(sensors) && sensors.length > 0) {
            sensors.forEach(sensor => {
                if (!sensor.id || !sensor.name) return; 
                const opt = document.createElement('option');
                opt.value = sensor.name; 
                opt.textContent = sensor.name;
                selectElement.appendChild(opt);
            });
             defaultOpt.disabled = false; 
        } else {
            console.log("No available light sensors found for routine form.");
            defaultOpt.textContent = "-- No sensors available --";
        }
    } catch (err) {
        console.error("Error loading sensors for routine form:", err); 
        selectElement.innerHTML = `<option value="" selected disabled>Error loading sensors!</option>`; 
    }
}


async function loadShuttersForRoutineForm() {
    const containerElementId = "routineTargetShuttersList"; 
    const container = document.getElementById(containerElementId);
    if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }

    container.innerHTML = `<p id="routineTargetShuttersLoading" style="color: #ccc;">Loading available shutters...</p>`; 

    const apiPath = '/api/entities/rollerShutter/';

    try {
        const allShutters = await fetchApi(apiPath);
        container.innerHTML = ''; 

        if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
            allShutters.forEach(shutter => {
                if (shutter && shutter.id && shutter.name) {
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    const checkId = `routine_shutter_${shutter.id}`;
                    const safeName = shutter.name.replace(/"/g, '&quot;'); 
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
        container.innerHTML = '<p class="text-danger">Error loading shutters.</p>'; 
    }
}


function toggleTriggerOptions() {
    const type = document.getElementById("triggerType").value;
    const luminositySection = document.getElementById("triggerLuminositySection");
    const timeSection = document.getElementById("triggerTimeSection");
    const sensorSelect = document.getElementById("triggerSensorId");
    const luminosityValue = document.getElementById("triggerLuminosityValue");
    const timeInput = document.getElementById("triggerTime");
    const luminosityCondition = document.getElementById("triggerLuminosityCondition");


    if (luminositySection) luminositySection.style.display = type === "luminosity" ? "block" : "none"; 
    if (timeSection) timeSection.style.display = type === "time" ? "block" : "none"; 

    if (type === "luminosity") {
        sensorSelect?.setAttribute("required", "");
        luminosityValue?.setAttribute("required", "");
        timeInput?.removeAttribute("required");
    } else {
         sensorSelect?.removeAttribute("required");
        luminosityValue?.removeAttribute("required");
        timeInput?.setAttribute("required", "");
    }
}

function updateLumDisplay() {
    const lumSlider = document.getElementById('triggerLuminosityValue');
    const lumDisplay = document.getElementById('triggerLuminosityValueDisplay');
    if (lumSlider && lumDisplay) {
        lumDisplay.textContent = `${lumSlider.value}%`;
    }
}

function updateActionDisplay() {
    const actionSlider = document.getElementById('actionPercentage');
    const actionDisplay = document.getElementById('actionPercentageDisplay');
    if (actionSlider && actionDisplay) {
        actionDisplay.textContent = `${actionSlider.value}%`;
    }
}

function setupSliderListeners() {
    const lumSlider = document.getElementById('triggerLuminosityValue');
    if (lumSlider && !lumSlider.dataset.listenerAttached) { 
        lumSlider.addEventListener('input', updateLumDisplay);
        lumSlider.dataset.listenerAttached = 'true';
        updateLumDisplay(); 
    }

    const actionSlider = document.getElementById('actionPercentage');
    if (actionSlider && !actionSlider.dataset.listenerAttached) { 
        actionSlider.addEventListener('input', updateActionDisplay);
        actionSlider.dataset.listenerAttached = 'true';
        updateActionDisplay();
    }
}

function toggleTriggerOptions() {
    const type = document.getElementById("triggerType").value;
    const luminositySection = document.getElementById("triggerLuminositySection");
    const timeSection = document.getElementById("triggerTimeSection");
    const sensorSelect = document.getElementById("triggerSensorId");
    const luminositySlider = document.getElementById("triggerLuminosityValue");
    const timeInput = document.getElementById("triggerTime");

    if (luminositySection) luminositySection.style.display = type === "luminosity" ? "block" : "none";
    if (timeSection) timeSection.style.display = type === "time" ? "block" : "none";

    if (type === "luminosity") {
        sensorSelect?.setAttribute("required", "");
        luminositySlider?.setAttribute("required", ""); 
        timeInput?.removeAttribute("required");
        updateLumDisplay();
    } else {
        sensorSelect?.removeAttribute("required");
        luminositySlider?.removeAttribute("required");
        timeInput?.setAttribute("required", "");
    }
}

function showRoutinesForm() {
    const formContainer = document.getElementById("Routines-form");
    if (!formContainer) {
        console.error("Element #Routines-form not found!");
        return;
    }
    const actualForm = formContainer.querySelector("form");
    if (!actualForm) {
        console.error("No <form> found inside #Routines-form!");
        return;
    }

    document.getElementById("form-title").innerText = "Create Routine";
    actualForm.reset();
    document.getElementById("Routines-id-hidden")?.remove();

    document.getElementById("triggerType").value = "luminosity";
    document.getElementById("triggerLuminosityCondition").value = "below";

    const lumSlider = document.getElementById('triggerLuminosityValue');
    const actionSlider = document.getElementById('actionPercentage');
    if(lumSlider) lumSlider.value = 50;
    if(actionSlider) actionSlider.value = 100;

    toggleTriggerOptions();
    loadSensorsForRoutineForm();
    loadShuttersForRoutineForm();

    setupSliderListeners();

    formContainer.style.display = "block";
}

function cancelRoutines() {
    const formContainer = document.getElementById("Routines-form");
    if (formContainer) {
        const actualForm = formContainer.querySelector("form");
        if (actualForm) actualForm.reset();
        formContainer.style.display = "none";
        document.getElementById("Routines-id-hidden")?.remove();
    }
}


async function saveRoutines(event) {
    event.preventDefault();
    const form = event.target;
    const saveButton = event.submitter;
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
    }

    function resetButton() {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save';
        }
    }

    try {
        const name = document.getElementById("RoutinesName").value.trim();
        const triggerType = document.getElementById("triggerType").value;
        const rollerShutterValue = parseInt(document.getElementById("actionPercentage").value, 10);
        const checkedShutters = document.querySelectorAll('#routineTargetShuttersList input[type="checkbox"]:checked');
        const targetShutters = Array.from(checkedShutters).map(cb => ({ name: cb.value }));
        const timeValue = document.getElementById("triggerTime").value;
        const sensorName = document.getElementById("triggerSensorId").value;
        const thresholdValue = parseInt(document.getElementById("triggerLuminosityValue").value, 10);
        const conditionIsAbove = (document.getElementById("triggerLuminosityCondition").value === 'above');

        if (!name || targetShutters.length === 0) {
            alert("Please enter a routine name and select at least one target shutter.");
            resetButton(); return;
        }

        if (isNaN(rollerShutterValue)) {
             alert("Invalid action percentage value.");
             resetButton(); return;
        }

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

            const [hours, minutes] = timeValue.split(':').map(Number);
            const adjustedHours = (hours - 2) % 24;
            const timeAdd = `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            data.time = `${timeAdd}:00`;
        }
        else {
             if (!sensorName || isNaN(thresholdValue)) {
                 alert("Please select a sensor and ensure a valid threshold is set.");
                 resetButton(); return;
             }
            apiPath = '/api/entities/routine/create/lightSensor';

            data.lightSensor = { name: sensorName };
            data.lightValueRecord = {
                value: thresholdValue,
                method: conditionIsAbove
            };
        }

        console.log(`Saving routine - Endpoint: ${apiPath}, Payload:`, JSON.stringify(data));

        await fetchApi(apiPath, 'POST', data);

        alert(`Routine "${name}" created successfully!`);
        cancelRoutines();
        loadRoutines();

    } catch (err) {
        console.error("Error saving routine:", err);
        alert(`Error saving routine: ${err.message}`);
    } finally {
        resetButton();
    }
}


async function deleteRoutine(routineId) {
    if (!confirm("Are you sure you want to delete this routine?")) {
        return;
    }

    const deleteButton = document.querySelector(`#Routines-item-${routineId} button.btn-danger`); 
    if (deleteButton) deleteButton.disabled = true;

    try {
        await fetchApi(`/api/entities/routine/delete/${routineId}`, 'DELETE');

        alert("Routine deleted successfully!");
        loadRoutines(); 

    } catch (error) {
        console.error(`Error deleting routine (ID: ${routineId}):`, error);
        alert(`Error deleting routine: ${error.message}`);
        if (deleteButton) deleteButton.disabled = false;
    }
}