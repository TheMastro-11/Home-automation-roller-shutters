async function loadUserHomeDetails() {
    const nameDisplay = document.getElementById("selected-home-name");
    const userHomeTitle = document.getElementById("user-home-title");

    if (nameDisplay) nameDisplay.textContent = "Loading...";
    if (userHomeTitle) userHomeTitle.textContent = ""; // Pulisci titolo

    try {
        // Assumiamo che /api/entities/home/ restituisca la casa dell'utente
        // basandosi sul token inviato da fetchApi
        const homes = await fetchApi('/api/entities/home/');

        if (homes && homes.length > 0) {
            // Se ci sono più case, prendiamo la prima (o implementa logica di selezione)
            const userHome = homes[0];
            if (nameDisplay) nameDisplay.textContent = userHome.name;
            if (userHomeTitle) userHomeTitle.textContent = `Home: ${userHome.name}`;

            // Una volta caricata la casa, carica i suoi dispositivi specifici
            // Passiamo l'ID della casa se necessario alle funzioni di caricamento
            loadRollerShutters(userHome.id); // Passa homeId se l'API lo richiede per filtrare
            loadLightSensors(userHome.id);   // Passa homeId se l'API lo richiede per filtrare
            loadAutomations(userHome.id);    // Carica/filtra automazioni per questa casa
        } else {
            if (nameDisplay) nameDisplay.textContent = "No home assigned.";
            if (userHomeTitle) userHomeTitle.textContent = "No Home";
            // Nascondi sezioni dispositivi/sensori/automazioni se non c'è casa?
            document.getElementById("devices-section")?.style.display = 'none';
            document.getElementById("light-sensors-section")?.style.display = 'none';
            document.getElementById("automations-section")?.style.display = 'none';

        }
    } catch (error) {
        if (nameDisplay) nameDisplay.textContent = "Error loading home";
        if (userHomeTitle) userHomeTitle.textContent = "Error";
        alert(`Error loading user home details: ${error.message}`);
        // Considera di nascondere le sezioni dipendenti qui
    }
}