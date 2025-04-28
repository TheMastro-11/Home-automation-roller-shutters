// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Auth check & logout
  if (typeof checkAuthentication === 'function') {
    if (!checkAuthentication()) return;
  } else {
    console.error("checkAuthentication function is missing");
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn && typeof logout === 'function') {
    logoutBtn.addEventListener('click', logout);
  }

  // 2) Wire up all forms/buttons
  attachFormListeners();

  // 3) Initial data load
  loadHomes();
  loadGlobalLightSensors();
  loadGlobalRollerShutters();
  loadRoutines(); // Function from routines.js
});

// Attaches event listeners to various forms and buttons on the dashboard.
function attachFormListeners() {
  // Manage Homes
  document.getElementById('add-home-form')?.addEventListener('submit', addHome);
  document.getElementById('edit-home-form')?.querySelector('form') // Listener for the home details edit form
    ?.addEventListener('submit', submitEditHome); // Function that handles saving

  // Global Sensors & Shutters
  document.getElementById('global-add-sensor-form')
    ?.addEventListener('submit', globalCreateLightSensor);
  document.getElementById('global-add-shutter-form')
    ?.addEventListener('submit', globalCreateRollerShutter);

  // Listeners for specific sensor/shutter edit forms (inline within Home Edit or Manage Sections)
  document.getElementById('edit-home-sensor-form')?.querySelector('form')
    ?.addEventListener('submit', submitEditHomeSensor);
  document.getElementById('edit-home-shutter-form')?.querySelector('form')
    ?.addEventListener('submit', submitEditHomeShutter);


  const routineForm = document.querySelector('#Routines-form form');
  if (routineForm) {
    if (typeof saveRoutines === 'function') {
      routineForm.addEventListener('submit', saveRoutines);
      console.log("Event listener for routine submit added from dashboard.js.");
    } else {
      console.error("ERROR: saveRoutines function not found/accessible from dashboard.js.");
    }
  } else {
    console.error("ERROR: Could not find #Routines-form form from dashboard.js.");
  }
}

// Loads the list of homes and displays them.
async function loadHomes() {
  const homeList = document.getElementById('manage-homes-list');
  if (!homeList) { console.error('#manage-homes-list not found'); return; }

  homeList.innerHTML = '<li class="list-group-item">Loading…</li>';

  try {
    const homes = await fetchApi('/api/entities/home/');
    homeList.innerHTML = '';

    homes.forEach(home => {
      const li = document.createElement('li');
      li.id = `home-item-${home.id}`;
      li.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap';

      // Escape single quotes in home name for the onclick attribute
      const safeHomeName = home.name.replace(/'/g, "\\'");
      const homeId = home.id;

      // *** MODIFICATION HERE: Added console.log inside onclick ***
      li.innerHTML = `
        <span class="me-auto">${home.name}</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-warning"
                  onclick="console.log('Attempting to call showEditHomeForm for ID: ${homeId}'); showEditHomeForm('${homeId}','${safeHomeName}')">
            Edit Details
          </button>
          <button class="btn btn-danger"  onclick="deleteHome('${homeId}')">Delete Home</button>
          <button class="btn btn-info"    onclick="showSensorsForHome('${homeId}','${safeHomeName}')">
            Manage Sensors
          </button>
          <button class="btn btn-primary" onclick="showShuttersForHome('${homeId}','${safeHomeName}')">
            Manage Shutters
          </button>
        </div>`;
      homeList.appendChild(li);
    });

  } catch (err) {
    console.error('Error loading homes:', err);
    homeList.innerHTML = `<li class="list-group-item text-danger">${err.message}</li>`;
  }
}


// Retrieves details for a specific home (workaround for potential 403 on direct GET /home/{id}).
async function getHomeDetails(homeId) {
  try {
    const allHomes = await fetchApi('/api/entities/home/'); // Always allowed
    return allHomes.find(h => String(h.id) === String(homeId)) || null;
  } catch (err) {
    console.error('Cannot load home list:', err);
    return null; // Continue without blocking UI
  }
}

// Adds a new home.
async function addHome(event) {
  event.preventDefault();
  const homeNameInput = document.getElementById("newHomeName");
  const homeName = homeNameInput.value.trim();
  const addButton = event.submitter;

  if (!homeName) { alert("Please enter a home name."); return; }
  if (addButton) addButton.disabled = true;

  try {
    await fetchApi("/api/entities/home/create", "POST", { name: homeName });
    alert("Home added successfully!");
    homeNameInput.value = "";
    loadHomes(); // Reload the list
  } catch (error) {
    console.error("Error adding home:", error);
    alert(`Failed to add home: ${error.message}`);
  } finally {
    if (addButton) {
      addButton.disabled = false;
      addButton.textContent = '+ Add'; // Ensure original button text
    }
  }
}

// ========================================
// FUNCTIONS FOR "EDIT HOME DETAILS" FORM
// ========================================

// Loads users into a select dropdown for assigning a home owner.
async function loadUsersForOwnerSelect(selectElementId, currentOwnerId) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
  selectElement.innerHTML = '<option value="" selected disabled>Loading users...</option>';
  try {
    const users = await fetchApi('/api/users/');
    selectElement.innerHTML = ''; // Clear
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select Owner --";
    selectElement.appendChild(defaultOption);
    if (users && Array.isArray(users) && users.length > 0) {
      users.forEach(user => {
        if (user && user.id && user.username) {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.username;
          if (currentOwnerId && String(user.id) === String(currentOwnerId)) {
            option.selected = true;
          }
          selectElement.appendChild(option);
        }
      });
    } else { console.log("No users found from API."); }
  } catch (error) {
    console.error(`Error loading users into select #${selectElementId}:`, error);
    selectElement.innerHTML = `<option value="" selected disabled>Error loading users!</option>`;
  }
}

// Loads available light sensors into a select dropdown for association with a home.
async function loadAvailableSensorsForEditHome(selectElementId, currentSensorName) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
  selectElement.innerHTML = '<option value="" selected disabled>Loading sensors...</option>';
  try {
    const sensors = await fetchApi('/api/entities/lightSensor/');
    selectElement.innerHTML = ''; // Clear
    const noneOption = document.createElement('option');
    noneOption.value = "NONE"; // Special value for no sensor
    noneOption.textContent = "-- None --";
    selectElement.appendChild(noneOption);

    if (sensors && Array.isArray(sensors) && sensors.length > 0) {
      sensors.forEach(sensor => {
        if (sensor && sensor.id && sensor.name) {
          const option = document.createElement('option');
          option.value = sensor.name; // Use name as value for association via PATCH
          option.textContent = sensor.name;
          if (currentSensorName && sensor.name === currentSensorName) {
            option.selected = true; // Select the current sensor
            noneOption.selected = false; // Deselect "None" if a sensor is associated
          }
          selectElement.appendChild(option);
        }
      });
      // If no sensor was previously associated, ensure "None" is selected
      if (!currentSensorName) {
        selectElement.value = "NONE";
      }
    } else {
      console.log("No available light sensors found.");
      selectElement.value = "NONE"; // Default to "None" if no sensors exist
    }
  } catch (error) {
    console.error(`Error loading sensors into select #${selectElementId}:`, error);
    selectElement.innerHTML = `<option value="" selected disabled>Error!</option>`;
    // Add back the "None" option even on error
    const noneOptionErr = document.createElement('option');
    noneOptionErr.value = "NONE"; noneOptionErr.textContent = "-- None --";
    selectElement.appendChild(noneOptionErr);
  }
}

// Loads available roller shutters as checkboxes for association with a home.
async function loadAvailableShuttersForEditHome(containerElementId, originalShutterNames = []) {
  const container = document.getElementById(containerElementId);
  const loadingMsg = document.getElementById("editHomeShuttersLoading"); // Reference the loading paragraph
  if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }

  // Show loading message or clear container
  if (loadingMsg) loadingMsg.textContent = "Loading...";
  else container.innerHTML = ""; // Clear previous checkboxes if no loading msg exists

  const apiPath = '/api/entities/rollerShutter/';
  // If loading message wasn't there initially, add it
  if (!loadingMsg) { container.innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading...</p>'; }

  try {
    const allShutters = await fetchApi(apiPath);
    // Remove loading message and clear container before adding checkboxes
    document.getElementById("editHomeShuttersLoading")?.remove();
    container.innerHTML = ''; // Clear again just in case

    if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
      const originalNamesSet = new Set(originalShutterNames); // Use a Set for efficient lookup

      allShutters.forEach(shutter => {
        if (shutter && shutter.id && shutter.name) {
          const div = document.createElement('div');
          div.className = 'form-check';
          const isChecked = originalNamesSet.has(shutter.name); // Check if currently associated
          const checkId = `edit_shutter_check_${shutter.id}`;
          const safeName = shutter.name.replace(/"/g, '&quot;'); // Escape quotes for value attribute

          // Use shutter name as the value for PATCHing by name
          div.innerHTML = `<input class="form-check-input" type="checkbox" value="${safeName}" id="${checkId}" ${isChecked ? 'checked' : ''}><label class="form-check-label" for="${checkId}">${shutter.name}</label>`;
          container.appendChild(div);
        }
      });
    } else {
      // Display a message if no shutters are found
      container.innerHTML = '<p style="color: #ccc;">No shutters found.</p>';
    }
  } catch (error) {
    console.error("Error loading shutters for Edit Home form:", error);
    // Ensure loading message is removed on error and show an error message
    document.getElementById("editHomeShuttersLoading")?.remove();
    container.innerHTML = '<p class="text-danger">Error loading shutters.</p>';
  }
}


// Displays the form to edit the details of a specific home.
async function showEditHomeForm(homeId, homeName) {
  // Hide sections not needed during editing
  document.getElementById("manage-homes-section")?.style.setProperty("display", "none");
  document.getElementById("add-home-form")?.style.setProperty("display", "none");
  document.getElementById("global-devices-section")?.style.setProperty("display", "none");
  document.getElementById("Routines-section")?.style.setProperty("display", "none");
  document.getElementById("manage-sensors-section")?.style.setProperty("display", "none");
  document.getElementById("manage-shutters-section")?.style.setProperty("display", "none");
  // Also hide specific edit forms if they were somehow left open
  document.getElementById("edit-home-sensor-form")?.style.setProperty("display", "none");
  document.getElementById("edit-home-shutter-form")?.style.setProperty("display", "none");

  // Get the edit form element
  const editHomeDiv = document.getElementById("edit-home-form");
  if (!editHomeDiv) {
    console.error("#edit-home-form element NOT FOUND!"); // Keep essential error logs
    return;
  }

  const editHomeInnerForm = editHomeDiv.querySelector("form");
  if (!editHomeInnerForm) {
    console.error("Inner form element NOT FOUND in #edit-home-form!"); // Keep essential error logs
    return;
  }

  // Populate basic fields BEFORE showing the div
  document.getElementById("editHomeId").value = homeId;
  document.getElementById("editHomeTitle").innerText = `Edit details – ${homeName}`;
  document.getElementById("editHomeName").value = homeName;

  // Show the edit form container FIRST
  editHomeDiv.style.display = "block";

  /* ---------- Load dynamic data ---------- */
  // Set loading states for dynamic fields
  const ownerSelect = document.getElementById("editHomeOwnerSelect");
  const sensorSelect = document.getElementById("editHomeSensorSelect");
  const shuttersList = document.getElementById("editHomeShuttersList");

  ownerSelect && (ownerSelect.innerHTML = '<option>Loading...</option>');
  sensorSelect && (sensorSelect.innerHTML = '<option>Loading...</option><option value="NONE">-- None --</option>');
  shuttersList && (shuttersList.innerHTML = '<p id="editHomeShuttersLoading">Loading...</p>');

  // Fetch current home details
  let currentOwnerId = null;
  let currentSensorName = null;
  let originalShutterNames = [];

  try {
    const allHomes = await fetchApi("/api/entities/home/");
    const homeDetails = Array.isArray(allHomes) ? allHomes.find(h => h?.id == homeId) : null;

    if (homeDetails) {
      currentOwnerId = homeDetails.owner?.id || null;
      currentSensorName = homeDetails.lightSensor?.name || null;
      originalShutterNames = (homeDetails.rollerShutters || []).map(rs => rs.name).filter(Boolean);

      // Store original values in form's dataset for comparison on submit
      editHomeInnerForm.dataset.originalName = homeName;
      editHomeInnerForm.dataset.originalOwnerId = currentOwnerId || "";
      editHomeInnerForm.dataset.originalSensor = currentSensorName || "NONE";
      editHomeInnerForm.dataset.originalShutters = JSON.stringify([...originalShutterNames].sort());
    } else {
      console.error(`Home details for ID ${homeId} not found in API response list.`); // Keep essential error logs
      // Set defaults if home details couldn't be fetched
      editHomeInnerForm.dataset.originalOwnerId = "";
      editHomeInnerForm.dataset.originalSensor = "NONE";
      editHomeInnerForm.dataset.originalShutters = "[]";
      // Optionally hide form or show specific error to user here
      // For now, it will proceed but might show empty selects/lists
    }
  } catch (e) {
    console.error("Error fetching home list for edit form:", e); // Keep essential error logs
    alert("Error fetching home details: " + e.message);
    editHomeDiv.style.display = "none"; // Hide form on error
    // Show the main sections again on error
    const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "block";
    const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
    return;
  }

  // Populate selects/checkboxes by calling helper functions
  // These functions have their own error handling/logging
  ownerSelect && loadUsersForOwnerSelect("editHomeOwnerSelect", currentOwnerId);
  sensorSelect && loadAvailableSensorsForEditHome("editHomeSensorSelect", currentSensorName);
  shuttersList && loadAvailableShuttersForEditHome("editHomeShuttersList", originalShutterNames);
}
// ===== END OF TEMPORARY DEBUGGING VERSION =====


// Cancels the home edit and returns to the main dashboard view.
function cancelEditHome() {
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = "none";
  // Show the main sections again
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) {addHomeFormEl.style.removeProperty("display");}
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex'; // Use flex for row layout
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';

  loadHomes(); // Reload the main home list
}

// Saves the changes made to the home details.
async function submitEditHome(event) {
  event.preventDefault();
  const form = event.target; // The form element itself
  const id = document.getElementById("editHomeId").value;
  const saveButton = form.querySelector('button.btn-primary'); // The Save button within the form

  // Retrieve original values stored in the dataset
  const originalName = form.dataset.originalName || '';
  const originalOwnerId = form.dataset.originalOwnerId || '';
  const originalSensorName = form.dataset.originalSensor || 'NONE'; // Original associated sensor name
  const originalShuttersJson = form.dataset.originalShutters || '[]'; // Original associated shutter names (sorted JSON)

  // Get new values from the form
  const newName = document.getElementById("editHomeName").value.trim();
  const ownerSelect = document.getElementById("editHomeOwnerSelect");
  const sensorSelect = document.getElementById("editHomeSensorSelect");
  const selectedOwnerId = ownerSelect ? ownerSelect.value : null; // Get selected owner ID
  const selectedSensorName = sensorSelect ? sensorSelect.value : null; // Get selected sensor name or "NONE"

  // Get selected shutter names from checkboxes
  const selectedShutterCheckboxes = document.querySelectorAll('#editHomeShuttersList input[type="checkbox"]:checked');
  // Sort the names for consistent comparison
  const selectedShutterNames = Array.from(selectedShutterCheckboxes).map(cb => cb.value).sort();
  const selectedShuttersJson = JSON.stringify(selectedShutterNames); // Sorted JSON string of new names

  if (!newName) { alert("Please enter home name."); return; }
  if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

  const apiCalls = []; // Array to hold promises for API calls
  const callsInfo = []; // Optional: Array to log call details

  // 1. Patch Name if changed
  if (newName !== originalName) {
    callsInfo.push({ path: `/patch/name/${id}`, payload: { name: newName } });
    apiCalls.push(fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName }));
  }

  // 2. Patch Owner if changed (and select exists)
  if (ownerSelect && selectedOwnerId !== originalOwnerId) {
    if (selectedOwnerId) { // Associate new owner 
      const selectedUsername = ownerSelect.selectedOptions[0].text;
      callsInfo.push({ path: `/patch/owner/${id}`, payload: { user: { username: selectedUsername } } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/owner/${id}`, "PATCH", { user: { username: selectedUsername } }));
    } else { // Dissociate owner
      callsInfo.push({ path: `/patch/owner/${id}`, payload: { user: null } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/owner/${id}`, "PATCH", { user: null }));
    }
  }

  // 3. Patch Sensor if changed (and select exists)
  if (sensorSelect && selectedSensorName !== originalSensorName) {
    if (selectedSensorName && selectedSensorName !== "NONE") { // Associate/change sensor (using name)
      callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: { name: selectedSensorName } } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: { name: selectedSensorName } }));
    } else { // Dissociate sensor (selectedSensorName is null or "NONE")
      callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: null } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: null }));
    }
  }

  // 4. Patch Shutters if changed (compare sorted JSON strings)
  if (selectedShuttersJson !== originalShuttersJson) {
    // Assume backend expects an array of objects like {name: ...} for association by name
    const payload = { rollerShutters: selectedShutterNames.map(n => ({ name: n })) };
    callsInfo.push({ path: `/patch/rollerShutters/${id}`, payload });
    apiCalls.push(fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, "PATCH", payload));
  }

  // Check if any changes were actually detected
  if (apiCalls.length === 0) {
    alert("No changes detected.");
    if (saveButton) { saveButton.disabled = false; saveButton.textContent = "Save"; }
    return;
  }

  try {
    console.log(`Executing ${apiCalls.length} PATCH call(s):`, callsInfo); // Log the calls being made
    await Promise.all(apiCalls); // Execute all necessary API calls concurrently
    alert("Home details updated successfully!");
    cancelEditHome(); // Return to the main view after successful update
  } catch (error) {
    console.error("Error updating home details:", error); // Log the detailed error
    alert(`Failed to update home details: ${error.message}`); // Show user-friendly error
  } finally {
    // Re-enable the save button regardless of success or failure
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save";
    }
  }
}


// Deletes a home.
async function deleteHome(homeId) {
  if (!confirm("Are you sure you want to delete this home? check about related devices.")) { return; }
  try {
    await fetchApi(`/api/entities/home/delete/${homeId}`, "DELETE");
    alert("Home deleted successfully!");
    loadHomes(); // Reload the list
    // Also hide edit form if it was open for the deleted home
    const editHomeIdInput = document.getElementById("editHomeId");
    if (editHomeIdInput && editHomeIdInput.value === homeId) {
      cancelEditHome(); // Use cancel function to hide form and show main sections
    }
  } catch (error) {
    console.error("Error deleting home:", error);
    alert(`Failed to delete home: ${error.message} check if the home is not associated with any devices or routines.`);
  }
}

// ========================================
// ROUTINE MANAGEMENT (Navigation)
// ========================================

// Shows the main view for managing all routines.
function showAllRoutinesView() {
  console.log("Showing All Routines view");
  // Hide other main sections
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const manageSensorsSectionEl = document.getElementById("manage-sensors-section"); if (manageSensorsSectionEl) manageSensorsSectionEl.style.display = 'none';
  const manageShuttersSectionEl = document.getElementById("manage-shutters-section"); if (manageShuttersSectionEl) manageShuttersSectionEl.style.display = 'none';

  // Show routines section
  const routinesSectionEl = document.getElementById("Routines-section");
  if (!routinesSectionEl) { console.error("#Routines-section not found!"); return; }
  routinesSectionEl.style.display = 'block';

  // Load routines (function expected from routines.js)
  if (typeof loadRoutines === 'function') {
    loadRoutines();
  } else { console.error("loadRoutines function not found (expected in routines.js)"); }
}

// ========================================
// MANAGING SENSORS ASSOCIATED WITH A HOME
// ========================================

// Shows the section for managing sensors associated with a specific home.
function showSensorsForHome(homeId, homeName) {
  console.log(`Showing sensors for Home ID: ${homeId}, Name: ${homeName}`);
  // Hide other main sections
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const manageShuttersSectionEl = document.getElementById("manage-shutters-section"); if (manageShuttersSectionEl) manageShuttersSectionEl.style.display = 'none';

  // Show the manage sensors section
  const sensorSectionEl = document.getElementById("manage-sensors-section");
  if (!sensorSectionEl) { console.error("#manage-sensors-section not found"); return; }
  sensorSectionEl.style.display = 'block';

  // Set title and store homeId (could use dataset or a hidden input if needed by children)
  // Using the title element ID suggested in the HTML: 'manage-sensors-title-main'
  const titleElement = document.getElementById("manage-sensors-title-main");
  if (titleElement) titleElement.textContent = `Sensors for: ${homeName}`;

  // Store homeId for use by child forms/buttons if necessary (e.g., edit/delete actions)
  // Using the hidden input within the inline edit form: 'manage-sensors-home-id'
  const sensorHomeIdHidden = document.getElementById("manage-sensors-home-id");
  if (sensorHomeIdHidden) sensorHomeIdHidden.value = homeId;
  else console.warn("Hidden input #manage-sensors-home-id not found inside the edit form.");


  // Hide the inline sensor edit form if it was open
  const editSensorFormEl = document.getElementById("edit-home-sensor-form"); if (editSensorFormEl) editSensorFormEl.style.display = 'none';

  loadHomeSensors(homeId); // Load the sensors for this specific home
}

// Hides the manage sensors section and returns to the main home list view.
function hideSensorsForHome() {
  const sensorSectionEl = document.getElementById("manage-sensors-section"); if (sensorSectionEl) sensorSectionEl.style.display = 'none';
  // Show main sections again
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.removeProperty("display");
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
  loadHomes(); // Reload main view
}

// Loads and displays sensors ASSOCIATED with a specific home in the 'Manage Sensors' section.
async function loadHomeSensors(homeId) {
  const ul = document.getElementById('manage-sensors-list');
  if (!ul) { console.error('#manage-sensors-list not found'); return; }
  ul.innerHTML = "<li class='list-group-item'>Loading sensors...</li>";

  try {
    // Strategy 1: Fetch all sensors and filter client-side based on home.id
    const allSensors = await fetchApi('/api/entities/lightSensor/');
    let sensors = allSensors.filter(s => s.home && String(s.home.id) === String(homeId));

    // Strategy 2: Fallback if home.id is not available in the sensor list API response
    if (sensors.length === 0) {
      console.warn(`No sensors found with home.id === ${homeId}. Falling back to fetching home details.`);
      const home = await getHomeDetails(homeId); // Use the existing function
      const sensorName = home?.lightSensor?.name; // Get the name of the associated sensor
      if (sensorName) {
        // Filter all sensors by the name found in the home details
        sensors = allSensors.filter(s => s.name === sensorName);
        console.log(`Found associated sensor by name: ${sensorName}`);
      } else {
        console.log(`Home ${homeId} has no lightSensor associated in its details.`);
      }
    }

    // Render the list
    ul.innerHTML = '';
    if (sensors.length === 0) {
      ul.innerHTML = "<li class='list-group-item'>No light sensor associated with this home.</li>";
      return;
    }

    sensors.forEach(sensor => {
      const value = sensor.lightValue ?? sensor.value ?? 'N/A'; // Get current value
      const safeName = sensor.name.replace(/'/g, "\\'"); // Escape single quotes for onclick
      ul.insertAdjacentHTML('beforeend', `
        <li id="sensor-item-${sensor.id}"
            class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
          <div><strong>${sensor.name}</strong> — Value: ${value}%</div>
          <!-- rimane solo il pulsante di delete -->
          <button class="btn btn-danger btn-sm"
                  onclick="deleteHomeSensor('${sensor.id}','${homeId}')">
            Delete
          </button>
        </li>`);
    });
  } catch (err) {
    console.error(`Error loading sensors for home ${homeId}:`, err);
    ul.innerHTML = `<li class='list-group-item text-danger'>Error loading sensors: ${err.message}</li>`;
  }
}


// Deletes a sensor globally it from the current home.
async function deleteHomeSensor(sensorId, homeId) {
  if (!confirm("Are you sure you want to permanently delete this sensor?")) return;

  const deleteBtn = document.querySelector(`#sensor-item-${sensorId} button.btn-danger`);
  if (deleteBtn) deleteBtn.disabled = true;

  try {
    // Delete the sensor globally
    console.log(`Attempting to delete sensor ${sensorId} globally...`);
    await fetchApi(
      `/api/entities/lightSensor/delete/${sensorId}`,
      "DELETE"
    );
    console.log(`Sensor ${sensorId} deleted globally.`);
    alert("Sensor Deleted successfully!");
    loadHomeSensors(homeId); // Reload the sensor list for the current home
    loadGlobalLightSensors(); // Reload the global sensor list as well
  } catch (err) {
    console.error("Error deleting sensor:", err);
    alert("Failed to delete sensor: " + err.message);
    if (deleteBtn) deleteBtn.removeAttribute("disabled"); // Re-enable button on error
  }
}


// ========================================
// MANAGING SHUTTERS ASSOCIATED WITH A HOME
// ========================================

// Shows the section for managing shutters associated with a specific home.
function showShuttersForHome(homeId, homeName) {
  console.log(`Showing shutters for Home ID: ${homeId}, Name: ${homeName}`);
  // Hide other main sections
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
  const manageSensorsSectionEl = document.getElementById("manage-sensors-section"); if (manageSensorsSectionEl) manageSensorsSectionEl.style.display = 'none';

  // Show the manage shutters section
  const shutterSectionEl = document.getElementById("manage-shutters-section");
  if (!shutterSectionEl) { console.error("#manage-shutters-section not found"); return; }
  shutterSectionEl.style.display = 'block';

  // Set title (Using ID 'manage-shutters-title-main' from updated HTML)
  const titleElement = document.getElementById("manage-shutters-title-main");
  if (titleElement) titleElement.textContent = `Shutters for: ${homeName}`;

  // Store homeId for use by child forms/buttons
  // Using the hidden input within the inline edit form: 'edit-home-shutter-home-id'
  const shutterHomeIdHidden = document.getElementById("edit-home-shutter-home-id");
  if (shutterHomeIdHidden) shutterHomeIdHidden.value = homeId;
  else console.warn("Hidden input #edit-home-shutter-home-id not found inside the edit form.");

  // Hide the inline shutter edit form if it was open
  const editShutterFormEl = document.getElementById("edit-home-shutter-form"); if (editShutterFormEl) editShutterFormEl.style.display = 'none';

  loadHomeShuttersForManagement(homeId); // Load shutters for this specific home
}

// Hides the manage shutters section and returns to the main home list view.
function hideShuttersForHome() {
  const shutterSectionEl = document.getElementById("manage-shutters-section"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
  // Show main sections again
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "flex";
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
  loadHomes(); // Reload main view
}

// Loads and displays shutters ASSOCIATED with a specific home in the 'Manage Shutters' section.
// Includes Edit Name.
async function loadHomeShuttersForManagement(homeId) {
  const ul = document.getElementById("manage-shutters-list");
  if (!ul) { console.error("#manage-shutters-list not found"); return; }
  ul.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

  // Reset the status text for the manage section
  const statusElManage = document.getElementById("rollerShutterStatusManage"); // Use updated ID
  if (statusElManage) statusElManage.textContent = "Select a shutter from the list below…";


  try {
    // Strategy 1: Fetch all shutters and filter client-side based on home.id
    const allShutters = await fetchApi("/api/entities/rollerShutter/");
    let shutters = allShutters.filter(s => s.home && String(s.home.id) === String(homeId));

    // Strategy 2: Fallback if home.id is not in the shutter list API response
    if (shutters.length === 0) {
      const home = await getHomeDetails(homeId); // Fetch home details
      // Get names of shutters associated with the home
      const namesSet = new Set((home?.rollerShutters || []).map(rs => rs.name));
      if (namesSet.size > 0) {
        // Filter all shutters by the names found in the home details
        shutters = allShutters.filter(s => namesSet.has(s.name));
        console.log(`Found ${shutters.length} associated shutter(s) by name.`);
      } else {
        console.log(`Home ${homeId} has no rollerShutters associated in its details.`);
      }
    }

    // Render the list
    ul.innerHTML = ""; // Clear loading message
    if (shutters.length === 0) {
      ul.innerHTML = "<li class='list-group-item'>No shutters currently associated.</li>";
      return;
    }

    shutters.forEach(shutter => {
      const shutterId = shutter.id;
      const shutterName = shutter.name;
      const opening = shutter.percentageOpening ?? shutter.opening ?? 0; // Use percentageOpening or opening
      const safeName = shutterName.replace(/'/g, "\\'"); // Escape single quotes for JS within HTML

      const li = document.createElement("li");
      li.id = `manage-shutter-item-${shutterId}`; // Unique ID for this list item
      li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap list-group-item-action"; // Added action class for cursor

      // --- Click handler to select shutter for controls ---
      li.onclick = () => {
        // Remove 'active' class from all items in *this* list
        document.querySelectorAll("#manage-shutters-list .list-group-item")
          .forEach(el => el.classList.remove("active"));
        // Add 'active' class to the clicked item
        li.classList.add("active");
        // Pass the ID, name, and current opening percentage
        selectRollerShutter(String(shutterId), safeName, opening); // Ensure ID is string if needed
      };
      li.innerHTML = `
        <span>${shutterName}</span>
        <span class="opening ms-auto me-2">Opening: ${opening}%</span> <div class="btn-group btn-group-sm">
          <button class="btn btn-danger"
                  onclick="globalDeleteRollerShutter('${shutterId}');"> Delete
          </button>
        </div>`;
      ul.appendChild(li);
    });

  } catch (err) {
    console.error(`Error loading shutters for home ${homeId} management:`, err);
    ul.innerHTML = `<li class='list-group-item text-danger'>Error loading shutters: ${err.message}</li>`;
  }
}


// ========================================
// GLOBAL DEVICE FUNCTIONS (Add / Inline Edit / Delete)
// ========================================

// --- GLOBAL LIGHT SENSOR ---

// Loads and displays the list of all globally defined light sensors.
async function loadGlobalLightSensors() {
  const container = document.getElementById('global-sensors-list');
  if (!container) { console.error("Element '#global-sensors-list' not found."); return; }
  container.innerHTML = '<li class="list-group-item">Loading...</li>';

  try {
    const sensors = await fetchApi('/api/entities/lightSensor/');
    container.innerHTML = ''; // Clear loading message

    if (!Array.isArray(sensors) || sensors.length === 0) {
      container.innerHTML = '<li class="list-group-item">No global sensors defined.</li>';
      return;
    }

    sensors.forEach(s => {
      if (!s || !s.id) return; // Skip if sensor object or ID is missing
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.id = `global-sensor-${s.id}`; // Unique ID for the list item

      const span = document.createElement('span');
      span.textContent = s.name || `Sensor ID: ${s.id}`; // Display name or ID

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning';
      editBtn.textContent = 'Edit';
      // Pass ID and current name to the inline edit function
      editBtn.onclick = () => globalShowEditLightSensorForm(s.id, s.name || '');

      // Delete Button
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => globalDeleteLightSensor(s.id); // Pass ID to delete function

      btnGroup.append(editBtn, delBtn);
      li.append(span, btnGroup);
      container.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading global sensors:', err);
    container.innerHTML = `<li class="list-group-item text-danger">Error loading sensors: ${err.message}</li>`;
  }
}


// Displays an inline form to edit the name of a global light sensor.
function globalShowEditLightSensorForm(id, currentName) {
  const li = document.getElementById(`global-sensor-${id}`);
  if (!li) return; // Exit if the list item is not found

  // Store the original content to restore on cancel
  const originalContent = li.innerHTML;

  // Replace the list item content with an input field and buttons
  li.innerHTML = `
    <input
      type="text"
      id="global-edit-input-sensor-${id}"
      class="form-control form-control-sm d-inline-block w-auto me-2"
      value="${currentName}"
      required
    />
  `; // Added 'required'

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm d-inline-block align-middle'; // Use align-middle

  // Save Button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save';
  saveBtn.type = 'button'; // Prevent form submission if accidentally nested
  saveBtn.onclick = async () => {
    const inputEl = document.getElementById(`global-edit-input-sensor-${id}`);
    const newName = inputEl ? inputEl.value.trim() : '';
    if (!newName) { // Check if name is empty after trimming
      alert('Sensor name cannot be empty.'); return;
    }
    try {
      saveBtn.disabled = true; // Disable button during API call
      // PATCH the name using the API
      await fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName });
      await loadGlobalLightSensors(); // Reload the list to show the updated name
    } catch (err) {
      console.error('Error patching global sensor name:', err);
      alert(`Error updating sensor name: ${err.message}`);
      li.innerHTML = originalContent; // Restore original content on error
      // No need to re-enable button here as list reloads
    }
    // Button will be removed on successful reload
  };

  // Cancel Button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.type = 'button';
  cancelBtn.onclick = () => { li.innerHTML = originalContent; }; // Restore original content

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup); // Append buttons next to the input

  // Focus the input field
  document.getElementById(`global-edit-input-sensor-${id}`).focus();
}


// Creates a new global light sensor via the API.
async function globalCreateLightSensor(event) {
  event.preventDefault(); // Prevent default form submission
  const nameInput = document.getElementById('global-newSensorName');
  const sensorName = nameInput.value.trim();
  if (!sensorName) { alert('Please enter a sensor name.'); return; }

  const submitBtn = event.submitter; // Get the button that triggered the submit
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...'; // Provide visual feedback
  }

  try {
    // Call the API to create the sensor
    await fetchApi('/api/entities/lightSensor/create', 'POST', { name: sensorName });
    await loadGlobalLightSensors(); // Reload the list to show the new sensor
    nameInput.value = ''; // Clear the input field
  } catch (err) {
    console.error('Error creating global light sensor:', err);
    alert(`Error creating sensor: ${err.message}`);
  } finally {
    // Re-enable the button regardless of success or failure
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Add Sensor'; // Restore original text
    }
  }
}

// Deletes a global light sensor via the API.
async function globalDeleteLightSensor(id) {
  // Confirmation dialog
  if (!confirm('Are you sure you want to delete this sensor? ')) return;
  try {
    // Call the API to delete the sensor
    await fetchApi(`/api/entities/lightSensor/delete/${id}`, 'DELETE');
    await loadGlobalLightSensors(); // Reload the list to remove the deleted sensor
    // Optionally, check if this sensor was associated with the currently viewed home (if in 'Manage Sensors' view) and reload that too.
  } catch (err) {
    console.error('Error deleting global light sensor:', err);
    alert(`Error deleting sensor: ${err.message}. its connected to the home ` );
  }
}


// --- GLOBAL ROLLER SHUTTER ---

// Loads and displays the list of all globally defined roller shutters.
async function loadGlobalRollerShutters() {
  const container = document.getElementById('global-shutters-list');
  if (!container) { console.error("Element '#global-shutters-list' not found."); return; }
  container.innerHTML = '<li class="list-group-item">Loading...</li>';

  try {
    const shutters = await fetchApi('/api/entities/rollerShutter/');
    container.innerHTML = ''; // Clear loading message

    if (!Array.isArray(shutters) || shutters.length === 0) {
      container.innerHTML = '<li class="list-group-item">No global shutters defined.</li>';
      return;
    }

    shutters.forEach(s => {
      if (!s || !s.id) return; // Skip if shutter object or ID is missing
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.id = `global-shutter-${s.id}`; // Unique ID

      const span = document.createElement('span');
      span.textContent = s.name || `Shutter ID: ${s.id}`; // Display name or ID

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => globalShowEditRollerShutterForm(s.id, s.name || ''); // Pass ID and name

      // Delete Button
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => globalDeleteRollerShutter(s.id); // Pass ID

      btnGroup.append(editBtn, delBtn);
      li.append(span, btnGroup);
      container.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading global shutters:', err);
    container.innerHTML = `<li class="list-group-item text-danger">Error loading shutters: ${err.message}</li>`;
  }
}


// Displays an inline form to edit the name of a global roller shutter.
function globalShowEditRollerShutterForm(id, currentName) {
  const li = document.getElementById(`global-shutter-${id}`);
  if (!li) return; // Exit if list item not found

  const originalContent = li.innerHTML; // Store original content

  // Replace content with input and buttons
  li.innerHTML = `
    <input
      type="text"
      id="global-edit-input-shutter-${id}"
      class="form-control form-control-sm d-inline-block w-auto me-2"
      value="${currentName}"
      required
    />
  `; // Added required

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm d-inline-block align-middle'; // Use align-middle

  // Save Button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save';
  saveBtn.type = 'button';
  saveBtn.onclick = async () => {
    const inputEl = document.getElementById(`global-edit-input-shutter-${id}`);
    const newName = inputEl ? inputEl.value.trim() : '';
    if (!newName) { // Check if name is empty
      alert('Shutter name cannot be empty.'); return;
    }
    try {
      saveBtn.disabled = true; // Disable during API call
      // PATCH the name via API
      await fetchApi(`/api/entities/rollerShutter/patch/name/${id}`, 'PATCH', { name: newName });
      await loadGlobalRollerShutters(); // Reload list to show updated name
    } catch (err) {
      console.error('Error patching global shutter name:', err);
      alert(`Error updating shutter name: ${err.message}`);
      li.innerHTML = originalContent; // Restore original content on error
    }
  };

  // Cancel Button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.type = 'button';
  cancelBtn.onclick = () => { li.innerHTML = originalContent; }; // Restore original content

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup); // Append buttons

  // Focus the input field
  document.getElementById(`global-edit-input-shutter-${id}`).focus();
}

// Creates a new global roller shutter via the API.
async function globalCreateRollerShutter(event) {
  event.preventDefault(); // Prevent default form submission
  const nameInput = document.getElementById('global-newShutterName');
  const shutterName = nameInput.value.trim();
  if (!shutterName) { alert('Please enter a shutter name.'); return; }

  const submitBtn = event.submitter; // Get the submit button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...'; // Provide feedback
  }

  try {
    // Call API to create the shutter
    await fetchApi('/api/entities/rollerShutter/create', 'POST', { name: shutterName });
    await loadGlobalRollerShutters(); // Reload the list
    nameInput.value = ''; // Clear the input field
  } catch (err) {
    console.error('Error creating global roller shutter:', err);
    alert(`Error creating shutter: ${err.message}`);
  } finally {
    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Add Shutter'; // Restore original text
    }
  }
}

// Deletes a global roller shutter via the API.
async function globalDeleteRollerShutter(id) {
  // Confirmation dialog
  if (!confirm('Are you sure you want to delete this shutter?')) return;
  try {
    // Call API to delete the shutter
    await fetchApi(`/api/entities/rollerShutter/delete/${id}`, 'DELETE');
    await loadGlobalRollerShutters(); // Reload the list
    // Optionally, reload associated home shutters list if currently viewing one
  } catch (err) {
    console.error('Error deleting global roller shutter:', err);
    alert(`Error deleting shutter: ${err.message} check if the shutter is not associated with any home or routine.`);
  }
}


// --- INLINE EDIT/DELETE FOR HOME-ASSOCIATED DEVICES ---
// These functions handle actions within the "Manage Sensors/Shutters" sections for a specific home.
function showEditHomeShutterForm(shutterId, currentName, homeId) {
  // Populate the form fields
  document.getElementById("edit-home-shutter-id").value = shutterId;
  document.getElementById("edit-home-shutter-name").value = currentName;
  // Ensure the home ID is set in the hidden field for submission context
  document.getElementById("edit-home-shutter-home-id").value = homeId;

  // Show the form
  const editForm = document.getElementById("edit-home-shutter-form");
  if (editForm) editForm.style.display = "block";
  else console.error("#edit-home-shutter-form not found");
}

// Hides the inline form for editing a home-associated shutter's name.
function cancelEditHomeShutter() {
  const editForm = document.getElementById("edit-home-shutter-form");
  if (editForm) editForm.style.display = "none";
}

// Submits the name change for a home-associated shutter.
async function submitEditHomeShutter(event) {
  event.preventDefault();
  const shutterId = document.getElementById("edit-home-shutter-id").value;
  // Retrieve homeId from the hidden input to know which home's list to reload
  const homeId = document.getElementById("edit-home-shutter-home-id").value;
  const newNameInput = document.getElementById("edit-home-shutter-name");
  const newName = newNameInput.value.trim();
  const saveButton = event.submitter;

  if (!newName) { alert("Please enter a new name for the shutter."); return; }
  if (!shutterId || !homeId) {
    console.error("Missing shutter ID or home ID for edit submission.");
    alert("An error occurred. Cannot save changes."); return;
  }

  if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

  try {
    // PATCH the shutter's name globally
    await fetchApi(`/api/entities/rollerShutter/patch/name/${shutterId}`, "PATCH", { name: newName });
    alert("Shutter name updated successfully!");
    cancelEditHomeShutter(); // Hide the form
    // Reload the list of shutters for the specific home being managed
    loadHomeShuttersForManagement(homeId);
    // Also reload the global list if it's visible
    loadGlobalRollerShutters();

  } catch (error) {
    console.error("Error updating shutter name:", error);
    alert(`Failed to update shutter name: ${error.message}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save Name"; // Reset button text
    }
  }
}