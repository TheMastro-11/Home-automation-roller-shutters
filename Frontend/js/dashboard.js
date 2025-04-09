// Esegui quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    // 1. Controlla se l'utente è autenticato
    if (!checkAuthentication()) {
        // Se non lo è, checkAuthentication ha già rediretto al login
        return;
    }

    // 2. Aggiungi listener al pulsante logout globale
    const logoutButton = document.getElementById("logoutBtn");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // 3. Determina il ruolo e mostra la sezione appropriata
    displayDashboardBasedOnRole();

    // 4. Collega gli event listener ai form (se non usi onsubmit="" in HTML)
    // Esempio:
    // const addHomeForm = document.getElementById('add-home-form')?.querySelector('form');
    // if(addHomeForm) addHomeForm.addEventListener('submit', addHome);

    // const editHomeForm = document.getElementById('edit-home-form')?.querySelector('form');
    // if(editHomeForm) editHomeForm.addEventListener('submit', submitEditHome);

    // ... collega altri listener per submit dei form ...
    // Questo è un approccio più pulito rispetto agli onsubmit="" nell'HTML

    // Collega il submit del form automazioni alla funzione saveAutomation
    const automationForm = document.getElementById('automation-form')?.querySelector('form');
     if(automationForm) automationForm.addEventListener('submit', saveAutomation);

     // Collega il submit del form per creare sensori
     const createSensorForm = document.querySelector('#light-sensors-section form'); // Trova il form di creazione
     if(createSensorForm) createSensorForm.addEventListener('submit', createLightSensor);

     // Collega il submit del form per modificare sensori
     const editSensorForm = document.getElementById('edit-light-sensor')?.querySelector('form');
     if(editSensorForm) editSensorForm.addEventListener('submit', submitEditSensor);

     // Collega submit admin add home form
     const adminAddHomeForm = document.getElementById('add-home-form')?.querySelector('form');
     if(adminAddHomeForm) adminAddHomeForm.addEventListener('submit', addHome);

      // Collega submit admin edit home form
     const adminEditHomeForm = document.getElementById('edit-home-form')?.querySelector('form');
     if(adminEditHomeForm) adminEditHomeForm.addEventListener('submit', submitEditHome);


});

function displayDashboardBasedOnRole() {
    const isAdminUser = isAdmin(); // Usa la funzione da auth.js

    const adminSection = document.getElementById("admin-section");
    const userSection = document.getElementById("user-section");
    const automationsSection = document.getElementById("automations-section"); // Assumiamo sia visibile a entrambi

    if (isAdminUser) {
        console.log("User is Admin");
        if(userSection) userSection.style.display = "none";
        if(adminSection) adminSection.style.display = "block";
        if(automationsSection) automationsSection.style.display = 'block'; // Mostra anche a admin?

        // Carica dati specifici per admin
        loadAdminHomes();
        // Potresti voler caricare le automazioni generali o nessuna inizialmente
        // loadAutomations(); // Carica tutte le automations? O aspetta selezione casa?
        // Nascondi lista automazioni finché non si seleziona una casa?
        document.getElementById("automations-list").innerHTML = "<li class='list-group-item'>Select a home to view its automations.</li>";
        document.getElementById("automations-section-title").innerText = "Automations";


    } else {
        console.log("User is Standard User");
        if(adminSection) adminSection.style.display = "none";
        if(userSection) userSection.style.display = "block";
        if(automationsSection) automationsSection.style.display = 'block'; // Mostra anche a user

        // Carica dati specifici per user
        loadUserHomeDetails(); // Questa funzione ora carica casa, tapparelle, sensori, automazioni

        // Nascondi la sezione aggiungi/modifica sensori se non serve subito
        // document.getElementById("light-sensors-section").style.display = 'none'; // loadUserHomeDetails ora la gestisce
         document.getElementById("edit-light-sensor").style.display = 'none'; // Nascondi form modifica sensore

    }
     // Nascondi form modifica casa admin e form automazione all'inizio
     const editHomeForm = document.getElementById("edit-home-form");
     if (editHomeForm) {
         editHomeForm.style.display = 'none';
     }
     const automationFormElement = document.getElementById("automation-form"); // Uso nome diverso per evitare conflitti
     if (automationFormElement) {
         automationFormElement.style.display = 'none';
     }
}