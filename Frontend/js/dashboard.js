// ========================================
//        js/dashboard.js
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  if (typeof checkAuthentication === "function") {
    if (!checkAuthentication()) { return; }
  } else { console.error("checkAuthentication function is missing!"); }

  // 2. Listener Logout
  const logoutButton = document.getElementById("logoutBtn");
  if (logoutButton) {
    if (typeof logout === "function") { logoutButton.addEventListener("click", logout); }
    else { console.error("logout function is missing!"); }
  } else { console.error("Logout button not found!"); }

  // 3. Imposta UI iniziale
  displayDashboardBasedOnRole();

  // 4. Collega listener form
  attachFormListeners();

});

// Aggiunge listener ai form attivi
function attachFormListeners() {
  console.log("Attaching form listeners...");

  // Aggiungi Casa
  document.getElementById('add-home-form')?.querySelector('form')?.addEventListener('submit', addHome);

  // Modifica Casa
  document.getElementById('edit-home-form')?.querySelector('form')?.addEventListener('submit', submitEditHome);

  // Aggiungi Sensore Globale
  document.getElementById('global-add-sensor-form')?.addEventListener('submit', globalCreateLightSensor);

  // Aggiungi Tapparella Globale
  document.getElementById('global-add-shutter-form')?.addEventListener('submit', globalCreateRollerShutter);

  // Modifica Sensore (nella vista specifica per casa)
  const adminEditSensorForm = document.getElementById('admin-edit-sensor-form');
  if (adminEditSensorForm) {
    adminEditSensorForm.addEventListener('submit', adminSubmitEditSensor);
  } else { console.warn("#admin-edit-sensor-form not found"); }


  // --- Bottone Generale Routine --- 
  const showAllRoutinesBtn = document.getElementById('show-all-routines-btn');
  if (showAllRoutinesBtn) {
    showAllRoutinesBtn.addEventListener('click', showAllRoutinesView); // Chiama la funzione da admin.js
  } else { console.warn("#show-all-routines-btn not found"); }



  // Listener per Form Modifica Nome Tapparella (Admin)
  const adminEditShutterForm = document.getElementById('admin-edit-shutter-form')?.querySelector('form');
  if (adminEditShutterForm) {
    adminEditShutterForm.addEventListener('submit', adminSubmitEditShutter);
  } else { console.warn("#admin-edit-shutter-form not found"); }

  // --- Form Routine ---
  document.getElementById('Routines-form')?.querySelector('form')?.addEventListener('submit', saveRoutines);

  // --- Form Utente ---
  document.querySelector('#light-sensors-section form')?.addEventListener('submit', createLightSensor);
  document.getElementById('edit-light-sensor')?.querySelector('form')?.addEventListener('submit', submitEditSensor);

  console.log("Form listeners attachment process complete.");
}


// Imposta UI iniziale in base al ruolo
function displayDashboardBasedOnRole() {
  let isAdminUser = false;
  if (typeof isAdmin === "function") { isAdminUser = isAdmin(); }
  else { console.error("isAdmin function is missing!"); }

  const adminSection = document.getElementById("admin-section");
  const userSection = document.getElementById("user-section");
  if (!adminSection || !userSection) { console.error("Cannot find sections!"); return; }

  // Lasciato if(true) come richiesto per test
  if (true) {
    // if (isAdminUser) { // <-- Ripristinare questo dopo i test
    console.log("Displaying Admin View (Forced)");
    userSection.style.display = "none";
    adminSection.style.display = "block";
    if (typeof loadAdminHomes === "function") { loadAdminHomes(); } else { console.error("loadAdminHomes function is missing!"); }
    if (typeof loadGlobalRollerShutters === 'function') {
      loadGlobalRollerShutters();
    }

  } else {
    console.log("Displaying User View");
    adminSection.style.display = "none";
    userSection.style.display = "block";
    if (typeof loadUserHomeDetails === "function") { loadUserHomeDetails(); } else { console.error("loadUserHomeDetails function is missing!"); }
  }
}