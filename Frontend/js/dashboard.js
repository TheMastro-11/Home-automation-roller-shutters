// ========================================
//        js/dashboard.js (COMPLETO v. 12/04/25)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Controlla Autenticazione
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

}); // Fine DOMContentLoaded

// Aggiunge listener ai form attivi
function attachFormListeners() {
  console.log("Attaching form listeners...");

  // --- Form Admin ---
  document.getElementById('add-home-form')?.querySelector('form')?.addEventListener('submit', addHome);
  document.getElementById('edit-home-form')?.querySelector('form')?.addEventListener('submit', submitEditHome);
  document.getElementById('global-add-sensor-form')?.addEventListener('submit', globalCreateLightSensor); // Listener per add globale sensore
  document.getElementById('global-add-shutter-form')?.addEventListener('submit', globalCreateRollerShutter); // Listener per add globale tapparella

  // --- Form Routine ---
  document.getElementById('Routines-form')?.querySelector('form')?.addEventListener('submit', saveRoutines);

  // --- Form Utente ---
  document.querySelector('#light-sensors-section form')?.addEventListener('submit', createLightSensor); // Da sensors.js
  document.getElementById('edit-light-sensor')?.querySelector('form')?.addEventListener('submit', submitEditSensor); // Da sensors.js

  console.log("Form listeners attached.");
}


// Imposta UI iniziale in base al ruolo
function displayDashboardBasedOnRole() {
  let isAdminUser = false;
  if (typeof isAdmin === "function") { isAdminUser = isAdmin(); }
  else { console.error("isAdmin function is missing!"); }

  const adminSection = document.getElementById("admin-section");
  const userSection = document.getElementById("user-section");
  if(!adminSection || !userSection) { console.error("Cannot find sections!"); return; }

  // Lasciato if(true) come richiesto per test
  if (true) {
  // if (isAdminUser) { // <-- Ripristinare questo dopo i test
      console.log("Displaying Admin View (Forced)");
      userSection.style.display = "none";
      adminSection.style.display = "block";
      if(typeof loadAdminHomes === "function") { loadAdminHomes(); } else { console.error("loadAdminHomes function is missing!"); }
  } else {
      console.log("Displaying User View");
      adminSection.style.display = "none";
      userSection.style.display = "block";
      if (typeof loadUserHomeDetails === "function") { loadUserHomeDetails(); } else { console.error("loadUserHomeDetails function is missing!"); }
  }
}

// ========================================
//      FINE js/dashboard.js
// ========================================