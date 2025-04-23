async function loadUserHomeDetails() {
  const nameDisplay = document.getElementById("selected-home-name");
  const userHomeTitle = document.getElementById("user-home-title");

  if (nameDisplay) nameDisplay.textContent = "Loading...";
  if (userHomeTitle) userHomeTitle.textContent = ""; // Pulisci titolo

  try {
    // Assumiamo che /api/entities/home/ restituisca la casa dell'utente
    // basandosi sul token inviato da fetchApi
    const homes = await fetchApi("/api/entities/home/");

    if (homes && homes.length > 0) {
      // Se ci sono più case, prendiamo la prima (o implementa logica di selezione)
      const userHome = homes[0];
      if (nameDisplay) nameDisplay.textContent = userHome.name;
      if (userHomeTitle) userHomeTitle.textContent = `Home: ${userHome.name}`;

      // Una volta caricata la casa, carica i suoi dispositivi specifici
      // Passiamo l'ID della casa se necessario alle funzioni di caricamento
      loadRollerShutters(userHome.id); // Passa homeId se l'API lo richiede per filtrare
      loadLightSensors(userHome.id); // Passa homeId se l'API lo richiede per filtrare
      loadRoutines();
    } else {
      // Se non ci sono case (homes.length === 0)
      if (nameDisplay) nameDisplay.textContent = "No home assigned.";
      if (userHomeTitle) userHomeTitle.textContent = "No Home"; // Nascondi sezioni dispositivi/sensori/automazioni (MODO CORRETTO)

      const devicesSection = document.getElementById("devices-section");
      if (devicesSection) {
        devicesSection.style.display = "none";
      }

      const lightSensorsSection = document.getElementById(
        "light-sensors-section"
      );
      if (lightSensorsSection) {
        lightSensorsSection.style.display = "none";
      }

      // Nota: Potrebbe non essere necessario nascondere #Routines-section qui
      // se vuoi che sia sempre visibile magari con un messaggio "Nessuna automazione".
      // Ma se vuoi nasconderla quando non c'è casa, fai così:
      const RoutinesSection = document.getElementById("Routines-section");
      if (RoutinesSection) {
        RoutinesSection.style.display = "none";
      }
    } // Fine del blocco else
  } catch (error) {
    if (nameDisplay) nameDisplay.textContent = "Error loading home";
    if (userHomeTitle) userHomeTitle.textContent = "Error";
    alert(`Error loading user home details: ${error.message}`);
    // Considera di nascondere le sezioni dipendenti qui
  }
}
