document.addEventListener('DOMContentLoaded', () => {
  if (typeof checkAuthentication === 'function') {
    if (!checkAuthentication()) return;
  } else {
    console.error("checkAuthentication function is missing");
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn && typeof logout === 'function') {
    logoutBtn.addEventListener('click', logout);
  }
  attachFormListeners();

  loadHomes();
  loadGlobalLightSensors();
  loadGlobalRollerShutters();
  loadRoutines();
});

function attachFormListeners() {
  document.getElementById('add-home-form')?.addEventListener('submit', addHome);
  document.getElementById('edit-home-form')?.querySelector('form') 
    ?.addEventListener('submit', submitEditHome);

  document.getElementById('global-add-sensor-form')
    ?.addEventListener('submit', globalCreateLightSensor);
  document.getElementById('global-add-shutter-form')
    ?.addEventListener('submit', globalCreateRollerShutter);

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

      const safeHomeName = home.name.replace(/'/g, "\\'");
      const homeId = home.id;

      li.innerHTML = `
        <span class="me-auto">${home.name}</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-warning"
                  onclick="console.log('Attempting to call showEditHomeForm for ID: ${homeId}'); showEditHomeForm('${homeId}','${safeHomeName}')">
            Edit Details
          </button>
          <button class="btn btn-danger"  onclick="deleteHome('${homeId}')">Delete Home</button>
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


async function getHomeDetails(homeId) {
  try {
    const allHomes = await fetchApi('/api/entities/home/');
    return allHomes.find(h => String(h.id) === String(homeId)) || null;
  } catch (err) {
    console.error('Cannot load home list:', err);
    return null;
  }
}

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
    loadHomes();
  } catch (error) {
    console.error("Error adding home:", error);
    alert(`Failed to add home: ${error.message}`);
  } finally {
    if (addButton) {
      addButton.disabled = false;
      addButton.textContent = '+ Add';
    }
  }
}

async function loadAvailableSensorsForEditHome(selectElementId, currentSensorName) {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) { console.error(`Select element with ID '${selectElementId}' not found.`); return; }
  selectElement.innerHTML = '<option value="" selected disabled>Loading sensors...</option>';
  try {
    const sensors = await fetchApi('/api/entities/lightSensor/');
    selectElement.innerHTML = '';
    const noneOption = document.createElement('option');
    noneOption.value = "NONE";
    noneOption.textContent = "-- None --";
    selectElement.appendChild(noneOption);

    if (sensors && Array.isArray(sensors) && sensors.length > 0) {
      sensors.forEach(sensor => {
        if (sensor && sensor.id && sensor.name) {
          const option = document.createElement('option');
          option.value = sensor.name;
          option.textContent = sensor.name;
          if (currentSensorName && sensor.name === currentSensorName) {
            option.selected = true;
            noneOption.selected = false;
          }
          selectElement.appendChild(option);
        }
      });
      if (!currentSensorName) {
        selectElement.value = "NONE";
      }
    } else {
      console.log("No available light sensors found.");
      selectElement.value = "NONE";
    }
  } catch (error) {
    console.error(`Error loading sensors into select #${selectElementId}:`, error);
    selectElement.innerHTML = `<option value="" selected disabled>Error!</option>`;
    const noneOptionErr = document.createElement('option');
    noneOptionErr.value = "NONE"; noneOptionErr.textContent = "-- None --";
    selectElement.appendChild(noneOptionErr);
  }
}

async function loadAvailableShuttersForEditHome(containerElementId, originalShutterNames = []) {
  const container = document.getElementById(containerElementId);
  const loadingMsg = document.getElementById("editHomeShuttersLoading");
  if (!container) { console.error(`Container element with ID '${containerElementId}' not found.`); return; }

  if (loadingMsg) loadingMsg.textContent = "Loading...";
  else container.innerHTML = "";

  const apiPath = '/api/entities/rollerShutter/';
  if (!loadingMsg) { container.innerHTML = '<p id="editHomeShuttersLoading" style="color: #ccc;">Loading...</p>'; }

  try {
    const allShutters = await fetchApi(apiPath);
    document.getElementById("editHomeShuttersLoading")?.remove();
    container.innerHTML = '';

    if (allShutters && Array.isArray(allShutters) && allShutters.length > 0) {
      const originalNamesSet = new Set(originalShutterNames);

      allShutters.forEach(shutter => {
        if (shutter && shutter.id && shutter.name) {
          const div = document.createElement('div');
          div.className = 'form-check';
          const isChecked = originalNamesSet.has(shutter.name);
          const checkId = `edit_shutter_check_${shutter.id}`;
          const safeName = shutter.name.replace(/"/g, '&quot;');

          div.innerHTML = `<input class="form-check-input" type="checkbox" value="${safeName}" id="${checkId}" ${isChecked ? 'checked' : ''}><label class="form-check-label" for="${checkId}">${shutter.name}</label>`;
          container.appendChild(div);
        }
      });
    } else {
      container.innerHTML = '<p style="color: #ccc;">No shutters found.</p>';
    }
  } catch (error) {
    console.error("Error loading shutters for Edit Home form:", error);
    document.getElementById("editHomeShuttersLoading")?.remove();
    container.innerHTML = '<p class="text-danger">Error loading shutters.</p>';
  }
}


async function showEditHomeForm(homeId, homeName) {
  document.getElementById("manage-homes-section")?.style.setProperty("display", "none");
  document.getElementById("add-home-form")?.style.setProperty("display", "none");
  document.getElementById("global-devices-section")?.style.setProperty("display", "none");
  document.getElementById("Routines-section")?.style.setProperty("display", "none");
  document.getElementById("manage-sensors-section")?.style.setProperty("display", "none");
  document.getElementById("manage-shutters-section")?.style.setProperty("display", "none");
  document.getElementById("edit-home-sensor-form")?.style.setProperty("display", "none");
  document.getElementById("edit-home-shutter-form")?.style.setProperty("display", "none");

  const editHomeDiv = document.getElementById("edit-home-form");
  if (!editHomeDiv) {
    console.error("#edit-home-form element NOT FOUND!");
  }

  const editHomeInnerForm = editHomeDiv.querySelector("form");
  if (!editHomeInnerForm) {
    console.error("Inner form element NOT FOUND in #edit-home-form!");
    return;
  }

  document.getElementById("editHomeId").value = homeId;
  document.getElementById("editHomeTitle").innerText = `Edit details – ${homeName}`;
  document.getElementById("editHomeName").value = homeName;

  editHomeDiv.style.display = "block";

  const sensorSelect = document.getElementById("editHomeSensorSelect");
  const shuttersList = document.getElementById("editHomeShuttersList");

  sensorSelect && (sensorSelect.innerHTML = '<option>Loading...</option><option value="NONE">-- None --</option>');
  shuttersList && (shuttersList.innerHTML = '<p id="editHomeShuttersLoading">Loading...</p>');

  let currentSensorName = null;
  let originalShutterNames = [];

  try {
    const allHomes = await fetchApi("/api/entities/home/");
    const homeDetails = Array.isArray(allHomes) ? allHomes.find(h => h?.id == homeId) : null;

    if (homeDetails) {
      currentSensorName = homeDetails.lightSensor?.name || null;
      originalShutterNames = (homeDetails.rollerShutters || []).map(rs => rs.name).filter(Boolean);

      editHomeInnerForm.dataset.originalName = homeName;
      editHomeInnerForm.dataset.originalSensor = currentSensorName || "NONE";
      editHomeInnerForm.dataset.originalShutters = JSON.stringify([...originalShutterNames].sort());
    } else {
      console.error(`Home details for ID ${homeId} not found in API response list.`); 
      editHomeInnerForm.dataset.originalSensor = "NONE";
      editHomeInnerForm.dataset.originalShutters = "[]";
    }
  } catch (e) {
    console.error("Error fetching home list for edit form:", e);
    alert("Error fetching home details: " + e.message);
    editHomeDiv.style.display = "none";
    const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
    const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "block";
    const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
    const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
    return;
  }

  sensorSelect && loadAvailableSensorsForEditHome("editHomeSensorSelect", currentSensorName);
  shuttersList && loadAvailableShuttersForEditHome("editHomeShuttersList", originalShutterNames);
}

function cancelEditHome() {
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = "none";
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) {addHomeFormEl.style.removeProperty("display");}
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';

  loadHomes();
}

async function submitEditHome(event) {
  event.preventDefault();
  const form = event.target;
  const id = document.getElementById("editHomeId").value;
  const saveButton = form.querySelector('button.btn-primary'); 
  const originalName = form.dataset.originalName || '';
  const originalSensorName = form.dataset.originalSensor || 'NONE';
  const originalShuttersJson = form.dataset.originalShutters || '[]';

  const newName = document.getElementById("editHomeName").value.trim();
  const sensorSelect = document.getElementById("editHomeSensorSelect");
  const selectedSensorName = sensorSelect ? sensorSelect.value : null;

  const selectedShutterCheckboxes = document.querySelectorAll('#editHomeShuttersList input[type="checkbox"]:checked');
  const selectedShutterNames = Array.from(selectedShutterCheckboxes).map(cb => cb.value).sort();
  const selectedShuttersJson = JSON.stringify(selectedShutterNames);

  if (!newName) { alert("Please enter home name."); return; }
  if (saveButton) { saveButton.disabled = true; saveButton.textContent = "Saving..."; }

  const apiCalls = [];
  const callsInfo = [];

  if (newName !== originalName) {
    callsInfo.push({ path: `/patch/name/${id}`, payload: { name: newName } });
    apiCalls.push(fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name: newName }));
  }

  if (sensorSelect && selectedSensorName !== originalSensorName) {
    if (selectedSensorName && selectedSensorName !== "NONE") {
      callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: { name: selectedSensorName } } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: { name: selectedSensorName } }));
    } else { 
      callsInfo.push({ path: `/patch/lightSensor/${id}`, payload: { lightSensor: null } });
      apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: null }));
    }
  }

  if (selectedShuttersJson !== originalShuttersJson) {
    const payload = { rollerShutters: selectedShutterNames.map(n => ({ name: n })) };
    callsInfo.push({ path: `/patch/rollerShutters/${id}`, payload });
    apiCalls.push(fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, "PATCH", payload));
  }

  if (apiCalls.length === 0) {
    alert("No changes detected.");
    if (saveButton) { saveButton.disabled = false; saveButton.textContent = "Save"; }
    return;
  }

  try {
    console.log(`Executing ${apiCalls.length} PATCH call(s):`, callsInfo);
    await Promise.all(apiCalls);
    alert("Home details updated successfully!");
    cancelEditHome();
  } catch (error) {
    console.error("Error updating home details:", error);
    alert(`Failed to update home details: ${error.message}`); 
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save";
    }
  }
}


async function deleteHome(homeId) {
  if (!confirm("Are you sure you want to delete this home? check about related devices.")) { return; }
  try {
    await fetchApi(`/api/entities/home/delete/${homeId}`, "DELETE");
    alert("Home deleted successfully!");
    loadHomes();
    const editHomeIdInput = document.getElementById("editHomeId");
    if (editHomeIdInput && editHomeIdInput.value === homeId) {
      cancelEditHome();
    }
  } catch (error) {
    console.error("Error deleting home:", error);
    alert(`Failed to delete home: ${error.message} check if the home is not associated with any devices or routines.`);
  }
}

function showShuttersForHome(homeId, homeName) {
  console.log(`Showing shutters for Home ID: ${homeId}, Name: ${homeName}`);
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "none";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "none";
  const editHomeFormEl = document.getElementById("edit-home-form"); if (editHomeFormEl) editHomeFormEl.style.display = 'none';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'none';
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'none';
  const manageSensorsSectionEl = document.getElementById("manage-sensors-section"); if (manageSensorsSectionEl) manageSensorsSectionEl.style.display = 'none';

  const shutterSectionEl = document.getElementById("manage-shutters-section");
  if (!shutterSectionEl) { console.error("#manage-shutters-section not found"); return; }
  shutterSectionEl.style.display = 'block';

  const titleElement = document.getElementById("manage-shutters-title-main");
  if (titleElement) titleElement.textContent = `Shutters for: ${homeName}`;

  const shutterHomeIdHidden = document.getElementById("edit-home-shutter-home-id");
  if (shutterHomeIdHidden) shutterHomeIdHidden.value = homeId;
  else console.warn("Hidden input #edit-home-shutter-home-id not found inside the edit form.");

  const editShutterFormEl = document.getElementById("edit-home-shutter-form"); if (editShutterFormEl) editShutterFormEl.style.display = 'none';

  loadHomeShuttersForManagement(homeId);
}

function hideShuttersForHome() {
  const shutterSectionEl = document.getElementById("manage-shutters-section"); if (shutterSectionEl) shutterSectionEl.style.display = 'none';
  const manageHomesSectionEl = document.getElementById("manage-homes-section"); if (manageHomesSectionEl) manageHomesSectionEl.style.display = "block";
  const addHomeFormEl = document.getElementById("add-home-form"); if (addHomeFormEl) addHomeFormEl.style.display = "flex";
  const routinesSectionEl = document.getElementById("Routines-section"); if (routinesSectionEl) routinesSectionEl.style.display = 'block';
  const globalDevicesSectionEl = document.getElementById("global-devices-section"); if (globalDevicesSectionEl) globalDevicesSectionEl.style.display = 'flex';
  loadHomes(); 
}

async function loadHomeShuttersForManagement(homeId) {
  const ul = document.getElementById("manage-shutters-list");
  if (!ul) { console.error("#manage-shutters-list not found"); return; }
  ul.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

  const statusElManage = document.getElementById("rollerShutterStatusManage");
  if (statusElManage) statusElManage.textContent = "Select a shutter from the list below…";


  try {
    const allShutters = await fetchApi("/api/entities/rollerShutter/");
    let shutters = allShutters.filter(s => s.home && String(s.home.id) === String(homeId));

    if (shutters.length === 0) {
      const home = await getHomeDetails(homeId);
      const namesSet = new Set((home?.rollerShutters || []).map(rs => rs.name));
      if (namesSet.size > 0) {
        shutters = allShutters.filter(s => namesSet.has(s.name));
        console.log(`Found ${shutters.length} associated shutter(s) by name.`);
      } else {
        console.log(`Home ${homeId} has no rollerShutters associated in its details.`);
      }
    }

    ul.innerHTML = "";
    if (shutters.length === 0) {
      ul.innerHTML = "<li class='list-group-item'>No shutters currently associated.</li>";
      return;
    }

    shutters.forEach(shutter => {
      const shutterId = shutter.id;
      const shutterName = shutter.name;
      const opening = shutter.percentageOpening ?? shutter.opening ?? 0;
      const safeName = shutterName.replace(/'/g, "\\'");

      const li = document.createElement("li");
      li.id = `manage-shutter-item-${shutterId}`;
      li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap list-group-item-action"; 
      li.onclick = () => {
        document.querySelectorAll("#manage-shutters-list .list-group-item")
          .forEach(el => el.classList.remove("active"));
        li.classList.add("active");
        selectRollerShutter(String(shutterId), safeName, opening);
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

async function loadGlobalLightSensors() {
  const container = document.getElementById('global-sensors-list');
  if (!container) { console.error("Element '#global-sensors-list' not found."); return; }
  container.innerHTML = '<li class="list-group-item">Loading...</li>';

  try {
    const sensors = await fetchApi('/api/entities/lightSensor/');
    container.innerHTML = '';

    if (!Array.isArray(sensors) || sensors.length === 0) {
      container.innerHTML = '<li class="list-group-item">No global sensors defined.</li>';
      return;
    }

    sensors.forEach(s => {
      if (!s || !s.id) return;
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.id = `global-sensor-${s.id}`;

      const span = document.createElement('span');
      span.textContent = s.name || `Sensor ID: ${s.id}`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => globalShowEditLightSensorForm(s.id, s.name || '');

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => globalDeleteLightSensor(s.id);

      btnGroup.append(editBtn, delBtn);
      li.append(span, btnGroup);
      container.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading global sensors:', err);
    container.innerHTML = `<li class="list-group-item text-danger">Error loading sensors: ${err.message}</li>`;
  }
}


function globalShowEditLightSensorForm(id, currentName) {
  const li = document.getElementById(`global-sensor-${id}`);
  if (!li) return; 
  const originalContent = li.innerHTML;

  li.innerHTML = `
    <input
      type="text"
      id="global-edit-input-sensor-${id}"
      class="form-control form-control-sm d-inline-block w-auto me-2"
      value="${currentName}"
      required
    />
  `;

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm d-inline-block align-middle';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save';
  saveBtn.type = 'button';
  saveBtn.onclick = async () => {
    const inputEl = document.getElementById(`global-edit-input-sensor-${id}`);
    const newName = inputEl ? inputEl.value.trim() : '';
    if (!newName) {
      alert('Sensor name cannot be empty.'); return;
    }
    try {
      saveBtn.disabled = true;
      await fetchApi(`/api/entities/lightSensor/patch/name/${id}`, 'PATCH', { name: newName });
      await loadGlobalLightSensors();
    } catch (err) {
      console.error('Error patching global sensor name:', err);
      alert(`Error updating sensor name: ${err.message}`);
      li.innerHTML = originalContent;
    }
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.type = 'button';
  cancelBtn.onclick = () => { li.innerHTML = originalContent; };

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup); 

  document.getElementById(`global-edit-input-sensor-${id}`).focus();
}


async function globalCreateLightSensor(event) {
  event.preventDefault(); 
  const nameInput = document.getElementById('global-newSensorName');
  const sensorName = nameInput.value.trim();
  if (!sensorName) { alert('Please enter a sensor name.'); return; }

  const submitBtn = event.submitter;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
  }

  try {
    await fetchApi('/api/entities/lightSensor/create', 'POST', { name: sensorName });
    await loadGlobalLightSensors();
    nameInput.value = '';
  } catch (err) {
    console.error('Error creating global light sensor:', err);
    alert(`Error creating sensor: ${err.message} check if the sensor name is already in use.`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Add Sensor';
    }
  }
}

async function globalDeleteLightSensor(id) {
  if (!confirm('Are you sure you want to delete this sensor? ')) return;
  try {
    await fetchApi(`/api/entities/lightSensor/delete/${id}`, 'DELETE');
    await loadGlobalLightSensors();
  } catch (err) {
    console.error('Error deleting global light sensor:', err);
    alert(`Error deleting sensor: ${err.message}. its connected to the home ` );
  }
}


async function loadGlobalRollerShutters() {
  const container = document.getElementById('global-shutters-list');
  if (!container) { console.error("Element '#global-shutters-list' not found."); return; }
  container.innerHTML = '<li class="list-group-item">Loading...</li>';

  try {
    const shutters = await fetchApi('/api/entities/rollerShutter/');
    container.innerHTML = '';

    if (!Array.isArray(shutters) || shutters.length === 0) {
      container.innerHTML = '<li class="list-group-item">No global shutters defined.</li>';
      return;
    }

    shutters.forEach(s => {
      if (!s || !s.id) return;
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.id = `global-shutter-${s.id}`;

      const span = document.createElement('span');
      span.textContent = s.name || `Shutter ID: ${s.id}`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group btn-group-sm';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-warning';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => globalShowEditRollerShutterForm(s.id, s.name || ''); 

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => globalDeleteRollerShutter(s.id);

      btnGroup.append(editBtn, delBtn);
      li.append(span, btnGroup);
      container.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading global shutters:', err);
    container.innerHTML = `<li class="list-group-item text-danger">Error loading shutters: ${err.message}</li>`;
  }
}


function globalShowEditRollerShutterForm(id, currentName) {
  const li = document.getElementById(`global-shutter-${id}`);
  if (!li) return;

  const originalContent = li.innerHTML;

  li.innerHTML = `
    <input
      type="text"
      id="global-edit-input-shutter-${id}"
      class="form-control form-control-sm d-inline-block w-auto me-2"
      value="${currentName}"
      required
    />
  `;

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group btn-group-sm d-inline-block align-middle';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-success';
  saveBtn.textContent = 'Save';
  saveBtn.type = 'button';
  saveBtn.onclick = async () => {
    const inputEl = document.getElementById(`global-edit-input-shutter-${id}`);
    const newName = inputEl ? inputEl.value.trim() : '';
    if (!newName) {
      alert('Shutter name cannot be empty.'); return;
    }
    try {
      saveBtn.disabled = true;
      await fetchApi(`/api/entities/rollerShutter/patch/name/${id}`, 'PATCH', { name: newName });
      await loadGlobalRollerShutters();
    } catch (err) {
      console.error('Error patching global shutter name:', err);
      alert(`Error updating shutter name: ${err.message}`);
      li.innerHTML = originalContent;
    }
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.type = 'button';
  cancelBtn.onclick = () => { li.innerHTML = originalContent; };

  btnGroup.append(saveBtn, cancelBtn);
  li.appendChild(btnGroup);

  document.getElementById(`global-edit-input-shutter-${id}`).focus();
}

async function globalCreateRollerShutter(event) {
  event.preventDefault();
  const nameInput = document.getElementById('global-newShutterName');
  const shutterName = nameInput.value.trim();
  if (!shutterName) { alert('Please enter a shutter name.'); return; }

  const submitBtn = event.submitter;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
  }

  try {
    await fetchApi('/api/entities/rollerShutter/create', 'POST', { name: shutterName });
    await loadGlobalRollerShutters();
    nameInput.value = '';
  } catch (err) {
    console.error('Error creating global roller shutter:', err);
    alert(`Error creating shutter: ${err.message} check if the shutter name is already in use.`
    );
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Add Shutter';
    }
  }
}

async function globalDeleteRollerShutter(id) {
  if (!confirm('Are you sure you want to delete this shutter?')) return;
  try {
    await fetchApi(`/api/entities/rollerShutter/delete/${id}`, 'DELETE');
    await loadGlobalRollerShutters();
  } catch (err) {
    console.error('Error deleting global roller shutter:', err);
    alert(`Error deleting shutter: ${err.message} check if the shutter is not associated with any home or routine.`);
  }
}


function cancelEditHomeShutter() {
  const editForm = document.getElementById("edit-home-shutter-form");
  if (editForm) editForm.style.display = "none";
}

async function submitEditHomeShutter(event) {
  event.preventDefault();
  const shutterId = document.getElementById("edit-home-shutter-id").value;
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
    await fetchApi(`/api/entities/rollerShutter/patch/name/${shutterId}`, "PATCH", { name: newName });
    alert("Shutter name updated successfully!");
    cancelEditHomeShutter();
    loadHomeShuttersForManagement(homeId);
    loadGlobalRollerShutters();

  } catch (error) {
    console.error("Error updating shutter name:", error);
    alert(`Failed to update shutter name: ${error.message}`);
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Save Name";
    }
  }
}