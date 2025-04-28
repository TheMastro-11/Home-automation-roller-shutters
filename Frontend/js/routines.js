// ========================================
//        js/routines.js
// Handles loading, creating, editing, and deleting routines.
// ========================================

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
        RoutinesList.innerHTML = ""; // Clear loading message

        if (Array.isArray(allRoutines) && allRoutines.length > 0) {
            allRoutines.forEach((routine) => {
                if (!routine || !routine.id) return; // Skip if routine or ID is missing

                // --- Trigger Info Logic: gestione Time object, Time string o Luminosity ---
                let triggerInfo = 'N/A';

                // 1) Se actionTime è un oggetto {hour, minute}
                if (routine.actionTime 
                    && typeof routine.actionTime === 'object'
                    && routine.actionTime.hour !== undefined 
                    && routine.actionTime.minute !== undefined) {
                    
                    triggerInfo = `Time: ${String(routine.actionTime.hour).padStart(2,'0')}:${String(routine.actionTime.minute).padStart(2,'0')}`;
                }
                // 2) Se actionTime è una stringa "HH:MM:SS"
                else if (typeof routine.actionTime === 'string') {
                    const hhmm = routine.actionTime.slice(0,5);
                    triggerInfo = `Time: ${hhmm}`;
                }
                // 3) Trigger Luminosity
                else if (routine.lightSensor && routine.lightSensor.name
                         && routine.lightValue && routine.lightValue.value !== undefined) {
                    const sensorName = routine.lightSensor.name;
                    const threshold = routine.lightValue.value;
                    const condition = routine.lightValue.method === true ? 'Above' : 'Below';
                    triggerInfo = `Luminosity: ${sensorName} ${condition} ${threshold}%`;
                }
                // --- Fine Trigger Info Logic ---

                // Extract other data for display
                const shutterValue = routine.rollerShutterValue;
                const associatedShutters = routine.rollerShutters || [];
                const targetDeviceNames = associatedShutters.length > 0
                    ? associatedShutters.map(rs => rs.name).join(', ')
                    : 'No target shutters';
                const actionInfo = `Set to ${shutterValue}%`;

                // Build List Item
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


// Shows an inline input field to edit the name of a routine.
function globalShowEditRoutineForm(id, currentName) {
    const li = document.getElementById(`Routines-item-${id}`);
    if (!li) return; // Exit if list item not found

    // Store original content for cancellation
    const originalContent = li.innerHTML;

    // Replace content with input and buttons
    // Using flex for better alignment
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
    `; // Placeholder for buttons

    const btnGroup = li.querySelector('.btn-group'); // Get the button group element

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.textContent = 'Save';
    saveBtn.type = 'button';
    saveBtn.onclick = async () => {
        const inputEl = document.getElementById(`global-edit-input-routine-${id}`);
        const newName = inputEl ? inputEl.value.trim() : '';
        if (!newName) {
            alert('Please enter a valid routine name.'); // This alert message was translated from Italian.
            return;
        }
        try {
            saveBtn.disabled = true; // Disable during API call
            // PATCH the name via API
            await fetchApi(`/api/entities/routine/patch/name/${id}`, 'PATCH', { name: newName }); //
            alert('Routine name updated successfully!'); // This alert message was translated from Italian.
            loadRoutines(); // Reload the entire list
        } catch (err) {
            console.error('Error patching routine name:', err); // This error message was translated from Italian.
            alert(`Error updating name: ${err.message}`); // This alert message was translated from Italian.
            li.innerHTML = originalContent; // Restore on error
        }
    };

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.onclick = () => loadRoutines(); // Reload list to cancel editing

    btnGroup.append(saveBtn, cancelBtn); // Add buttons to the group

    // Focus the input field
    document.getElementById(`global-edit-input-routine-${id}`).focus();
}


// Loads available light sensors into the routine form's trigger select dropdown.
async function loadSensorsForRoutineForm() {
    const selectElement = document.getElementById("triggerSensorId");
    if (!selectElement) {
        console.error("Select element #triggerSensorId not found in routine form."); // This error message was translated from Italian.
        return;
    }
    selectElement.innerHTML = '<option value="" disabled selected>Loading sensors...</option>'; // Loading state

    const apiPath = '/api/entities/lightSensor/';

    try {
        const sensors = await fetchApi(apiPath); //
        selectElement.innerHTML = ''; // Clear loading message

        // Add a default, non-selectable option
        const defaultOpt = document.createElement('option');
        defaultOpt.value = ""; // Empty value, required won't pass
        defaultOpt.textContent = "-- Select Trigger Sensor --";
        defaultOpt.disabled = true; // Make it non-selectable initially
        defaultOpt.selected = true;
        selectElement.appendChild(defaultOpt);

        if (Array.isArray(sensors) && sensors.length > 0) {
            sensors.forEach(sensor => {
                if (!sensor.id || !sensor.name) return; // Skip if ID or Name is missing
                const opt = document.createElement('option');
                // Use NAME as the value for simplicity in form submission,
                // assuming the backend can look up the sensor by name for routine creation.
                // If backend requires ID, this needs adjustment & lookup before submit.
                opt.value = sensor.name; // Use name as value
                opt.textContent = sensor.name;
                selectElement.appendChild(opt);
            });
             defaultOpt.disabled = false; // Enable default option selection if sensors loaded
        } else {
            console.log("No available light sensors found for routine form."); //
            defaultOpt.textContent = "-- No sensors available --";
            // Keep defaultOpt disabled and selected
        }
    } catch (err) {
        console.error("Error loading sensors for routine form:", err); //
        selectElement.innerHTML = `<option value="" selected disabled>Error loading sensors!</option>`; // Show error in the select
    }
}


// Loads available roller shutters as checkboxes into the routine form's target list.
async function loadShuttersForRoutineForm() {
    const containerElementId = "routineTargetShuttersList"; // ID of the div in the Routine form
    const container = document.getElementById(containerElementId);
    if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }

    // Display loading message
    container.innerHTML = `<p id="routineTargetShuttersLoading" style="color: #ccc;">Loading available shutters...</p>`; // Loading message translated.

    const apiPath = '/api/entities/rollerShutter/';

    try {
        const allShutters = await fetchApi(apiPath); //
        container.innerHTML = ''; // Clear loading message

        if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
            allShutters.forEach(shutter => {
                if (shutter && shutter.id && shutter.name) {
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    const checkId = `routine_shutter_${shutter.id}`;
                    const safeName = shutter.name.replace(/"/g, '&quot;'); // Escape double quotes for value attribute

                    // Use NAME as the value. The backend needs to handle lookup by name on routine creation.
                    // If backend requires IDs, store the ID in a data attribute or adjust the value.
                    div.innerHTML = `
                        <input class="form-check-input" type="checkbox" value="${safeName}" id="${checkId}">
                        <label class="form-check-label" for="${checkId}">${shutter.name}</label>
                    `; //
                    container.appendChild(div);
                }
            });
            console.log("Rendered shutter checkboxes for routine form."); //
        } else {
            container.innerHTML = '<p style="color: #ccc;">No available shutters found.</p>'; // Message if no shutters
        }
    } catch (error) {
        console.error("Error loading shutters for Routine form:", error); //
        container.innerHTML = '<p class="text-danger">Error loading shutters.</p>'; // Error message
    }
}


// Toggles the visibility of trigger options (Luminosity vs. Time) in the routine form.
function toggleTriggerOptions() {
    const type = document.getElementById("triggerType").value;
    const luminositySection = document.getElementById("triggerLuminositySection");
    const timeSection = document.getElementById("triggerTimeSection");
    const sensorSelect = document.getElementById("triggerSensorId");
    const luminosityValue = document.getElementById("triggerLuminosityValue");
    const timeInput = document.getElementById("triggerTime");
    const luminosityCondition = document.getElementById("triggerLuminosityCondition");


    if (luminositySection) luminositySection.style.display = type === "luminosity" ? "block" : "none"; //
    if (timeSection) timeSection.style.display = type === "time" ? "block" : "none"; //

    // Set required attribute based on visibility
    if (type === "luminosity") {
        sensorSelect?.setAttribute("required", "");
        luminosityValue?.setAttribute("required", "");
        timeInput?.removeAttribute("required");
    } else { // type === "time"
         sensorSelect?.removeAttribute("required");
        luminosityValue?.removeAttribute("required");
        timeInput?.setAttribute("required", "");
    }
}

// Shows the form for creating or editing a routine.
function showRoutinesForm() {
    const formContainer = document.getElementById("Routines-form");
    if (!formContainer) {
        console.error("Element #Routines-form not found!"); // Error message translated.
        return;
    }
    const actualForm = formContainer.querySelector("form");
    if (!actualForm) {
        console.error("No <form> found inside #Routines-form!"); // Error message translated.
        return;
    }

    // Reset and initial setup for CREATING a new routine
    document.getElementById("form-title").innerText = "Create Routine"; //
    actualForm.reset(); // Reset all form fields to default values
    // Remove hidden ID if it exists from a previous edit attempt
    document.getElementById("Routines-id-hidden")?.remove(); //

    // Set default values explicitly after reset
    document.getElementById("triggerType").value = "luminosity"; //
    document.getElementById("action").value = "open"; //
    document.getElementById("actionPercentage").value = "100"; // Default to 100%
    document.getElementById("triggerLuminosityCondition").value = "below"; // Default condition

    toggleTriggerOptions(); // Ensure correct fields are shown and required attributes set

    // Populate dynamic fields (sensors and shutters)
    loadSensorsForRoutineForm(); //
    loadShuttersForRoutineForm(); //

    // Show the form container
    formContainer.style.display = "block"; //
}

// Hides and resets the routine form.
function cancelRoutines() {
    const formContainer = document.getElementById("Routines-form");
    if (formContainer) {
        const actualForm = formContainer.querySelector("form");
        if (actualForm) actualForm.reset(); // Reset fields
        formContainer.style.display = "none"; // Hide the form
        // Remove hidden ID if present
        document.getElementById("Routines-id-hidden")?.remove(); //
    }
}


// Saves a new routine based on the form data.
async function saveRoutines(event) {
    event.preventDefault(); // Prevent default form submission
    const form = event.target;
    const saveButton = event.submitter;
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
    }

    // --- Helper function to reset the button ---
    function resetButton() {
        if (saveButton) {
            saveButton.disabled = false;
            // Reset text (might need adjustment if editing is implemented)
            saveButton.textContent = 'Save'; //
        }
    }

    try {
        // 1) Get Values from Form
        const name = document.getElementById("RoutinesName").value.trim(); //
        const triggerType = document.getElementById("triggerType").value; // "luminosity" | "time"

        // Shutter action
        const actionType = document.getElementById("action").value; // "open" | "close"
        const selectedPercentage = parseInt(document.getElementById("actionPercentage").value, 10); //

        // Target shutters (by name - requires backend lookup)
        const checkedShutters = document.querySelectorAll('#routineTargetShuttersList input[type="checkbox"]:checked'); //
        // Map to the format expected by the backend (e.g., array of {name: "shutterName"})
        const targetShutters = Array.from(checkedShutters).map(cb => ({ name: cb.value })); // Expects {name: ...}

        // Trigger-specific values
        const timeValue = (document.getElementById("triggerTime").value); // "HH:MM"
        const sensorName = document.getElementById("triggerSensorId").value; // Name of the sensor
        const thresholdValue = parseInt(document.getElementById("triggerLuminosityValue").value, 10); //
        const condition = document.getElementById("triggerLuminosityCondition").value; // "above" | "below"

        // 2) Preliminary Validations
        if (!name || targetShutters.length === 0) {
            alert("Please enter a routine name and select at least one target shutter."); //
            resetButton(); return;
        }

        // Calculate the actual rollerShutterValue based on actionType and percentage
        // If action is 'open', value is the percentage. If 'close', value is 100 - percentage.
        let rollerShutterValue = actionType === 'close' ? (100 - selectedPercentage) : selectedPercentage; //

        // Ensure calculated value is valid
        if (isNaN(rollerShutterValue) || rollerShutterValue < 0 || rollerShutterValue > 100) {
            alert("Invalid action percentage resulting in invalid target opening (0-100)."); // Alert text updated.
            resetButton(); return;
        }


        // 3) Build Payload specific to the endpoint
        let apiPath, data = {
            name,
            rollerShutters: targetShutters, // Array of {name: ...}
            rollerShutterValue // The calculated target opening percentage (0-100)
        }; //

        if (triggerType === 'time') {
            if (!timeValue) { // timeValue should be "HH:MM"
                alert("Please select a trigger time."); resetButton(); return; //
            }
            apiPath = '/api/entities/routine/create/actionTime'; 

            const [hours, minutes] = timeValue.split(':').map(Number);
            const adjustedHours = (hours + 2) % 24; // Ensure it wraps around 24 hours
            const timeAdd = `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            data.time = `${timeAdd}:00`; 
        }
        else { // triggerType === 'luminosity'
            if (!sensorName || isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
                alert("Please select a sensor and enter a valid threshold (0–100)."); resetButton(); return; //
            }
            apiPath = '/api/entities/routine/create/lightSensor'; //

            // Sensor object (by name - requires backend lookup)
            data.lightSensor = { name: sensorName }; // Expects {name: ...}

            data.lightValueRecord = {
                value: thresholdValue, //
                method: (document.getElementById("triggerLuminosityCondition").value === 'above') // Tentative mapping
            };
        }

        console.log(`Saving routine - Endpoint: ${apiPath}, Payload:`, JSON.stringify(data));

        // 4) Send API Call
        await fetchApi(apiPath, 'POST', data); //

        // 5) Success
        alert(`Routine "${name}" created successfully!`); //
        cancelRoutines(); // Close and reset the form
        loadRoutines();   // Reload the list of routines

    } catch (err) {
        // 6) Error Handling
        console.error("Error saving routine:", err); // Error message translated.
        // Show the specific error message returned by fetchApi (could be from backend)
        alert(`Error saving routine: ${err.message}`); //
    } finally {
        // 7) Reset Button (on success or error)
        resetButton(); //
    }
}


// Deletes a routine by its ID.
async function deleteRoutine(routineId) { // Renamed function
    // Ask for confirmation
    if (!confirm("Are you sure you want to delete this routine?")) { //
        return; // Stop if user cancels
    }

    // Provide visual feedback (optional, e.g., disable button)
    const deleteButton = document.querySelector(`#Routines-item-${routineId} button.btn-danger`); //
    if (deleteButton) deleteButton.disabled = true;

    try {
        // Call the DELETE API endpoint
        await fetchApi(`/api/entities/routine/delete/${routineId}`, 'DELETE'); //

        // Success
        alert("Routine deleted successfully!"); //
        loadRoutines(); // Reload the complete list of routines

    } catch (error) {
        // Error Handling
        console.error(`Error deleting routine (ID: ${routineId}):`, error); //
        // Show a specific error message to the user
        alert(`Error deleting routine: ${error.message}`); //
        // Re-enable the button if deletion failed
        if (deleteButton) deleteButton.disabled = false; //
    }
}