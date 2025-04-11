let selectedRollerShutterId = null; // Variabile globale per ID tapparella selezionata

// Carica le tapparelle (per utente loggato o filtrate per homeId?)
async function loadRollerShutters(homeId = null) { // Accetta homeId opzionale
    const rollerShutterList = document.getElementById("rollerShutter-list-items");
    if (!rollerShutterList) {
        console.error("Element '#rollerShutter-list-items' not found.");
        return;
    }
    rollerShutterList.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

    // Nascondi i controlli individuali all'inizio
    const controls = document.getElementById("rollerShutter-controls");
    if(controls) controls.style.display = 'none';
    selectedRollerShutterId = null; // Resetta selezione

    // Usa SEMPRE il path base corretto (fidati del backend per filtrare per utente via token)
    const apiPath = '/api/entities/rollerShutter/';

    // !!! NOTA: Filtro per homeId NON implementato !!!
    // Se servisse per admin (ma questa funzione è chiamata da user.js), chiedere al backend come fare.
     if (homeId) {
         console.warn(`Filtering shutters by homeId (${homeId}) is NOT YET IMPLEMENTED pending backend API details. Loading all accessible shutters from ${apiPath}`);
         // Eventuale logica filtro: apiPath = `/api/entities/rollerShutter/?homeId=${homeId}`;
    }
     console.log("Loading roller shutters from:", apiPath);

    try {
        const rollerShutters = await fetchApi(apiPath);
        rollerShutterList.innerHTML = ""; // Pulisci

        if (rollerShutters && Array.isArray(rollerShutters) && rollerShutters.length > 0) {
            rollerShutters.forEach((shutter) => {
                if (!shutter || !shutter.id) return; // Salta dati invalidi

                const li = document.createElement("li");
                li.className = "list-group-item list-group-item-action"; // Action per stile hover/focus
                li.style.cursor = "pointer";
                // Visualizza nome e percentuale (usa 'percentageOpening' come ritorna l'API GET, presumibilmente)
                li.innerHTML = `${shutter.name || 'Unnamed Shutter'} - <span>Opening: ${shutter.percentageOpening ?? 'N/A'}%</span>`;
                li.onclick = () => selectRollerShutter(shutter.id, shutter.name, shutter.percentageOpening);
                li.id = `shutter-item-${shutter.id}`; // ID univoco
                rollerShutterList.appendChild(li);
            });
        } else {
            rollerShutterList.innerHTML = "<li class='list-group-item'>No roller shutters found.</li>";
        }
    } catch (error) {
        console.error("Error loading roller shutters:", error);
        rollerShutterList.innerHTML = `<li class='list-group-item text-danger'>Error loading shutters: ${error.message}</li>`;
    }
}

// Seleziona una tapparella dalla lista
function selectRollerShutter(id, name, opening) {
    if (id === null || id === undefined) return;

    selectedRollerShutterId = id;
    const statusElement = document.getElementById("rollerShutterStatus");
    if (statusElement) {
        statusElement.textContent = `Selected: ${name || 'Unnamed'} (Opening: ${opening ?? 'N/A'}%)`;
    }

    const controls = document.getElementById("rollerShutter-controls");
    if (controls) controls.style.display = "block"; // Mostra controlli +/-

    // Evidenzia l'elemento selezionato nella lista
    document.querySelectorAll('#rollerShutter-list-items li').forEach(item => {
        item.classList.remove('active');
    });
    const listItem = document.getElementById(`shutter-item-${id}`);
    if(listItem) listItem.classList.add('active');
}

// Modifica l'apertura della tapparella selezionata (+/- 10%)
async function adjustRollerShutterOpening(increase) {
    if (!selectedRollerShutterId) {
        alert("Please select a roller shutter first.");
        return;
    }

    const statusElement = document.getElementById("rollerShutterStatus");
    const currentOpeningText = statusElement ? statusElement.textContent : '';
    let currentOpening = 0;

    const match = currentOpeningText.match(/Opening: (\d+)%/);
    if (match && match[1]) {
        currentOpening = parseInt(match[1], 10);
    } else {
        // Prova a leggere dalla lista se lo status non è affidabile
        const listItem = document.getElementById(`shutter-item-${selectedRollerShutterId}`);
        const span = listItem ? listItem.querySelector('span') : null;
        const listMatch = span ? span.textContent.match(/Opening: (\d+)%/) : null;
        if (listMatch && listMatch[1]) {
            currentOpening = parseInt(listMatch[1], 10);
            console.log("Read opening from list item:", currentOpening);
        } else {
            console.error("Could not parse current opening from status text or list:", currentOpeningText);
            alert("Error reading current shutter status.");
            return;
        }
    }

    let newOpening = increase ? currentOpening + 10 : currentOpening - 10;
    newOpening = Math.min(Math.max(newOpening, 0), 100); // Clamp 0-100

    // --- USA "value" NEL PAYLOAD ---
    const data = { value: newOpening };
    // -------------------------------

    const buttonIncrease = document.querySelector('#rollerShutter-controls button.btn-primary');
    const buttonDecrease = document.querySelector('#rollerShutter-controls button.btn-danger');
    if(buttonIncrease) buttonIncrease.disabled = true;
    if(buttonDecrease) buttonDecrease.disabled = true;

    try {
        // Chiama l'endpoint /patch/opening/ ma invia { "value": ... }
        await fetchApi(
            `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
            'PATCH',
            data
        );

        // Aggiorna UI (Stato e Lista)
        const shutterNameMatch = currentOpeningText.match(/Selected: (.*?)\s+\(/);
        const shutterName = shutterNameMatch ? shutterNameMatch[1] : 'Shutter'; // Prova a mantenere il nome
        if (statusElement) statusElement.textContent = `Selected: ${shutterName} (Opening: ${newOpening}%)`;
        const listItem = document.getElementById(`shutter-item-${selectedRollerShutterId}`);
        if (listItem) {
             const openingSpan = listItem.querySelector('span');
             if(openingSpan) openingSpan.textContent = `Opening: ${newOpening}%`;
        }
    } catch (error) {
        console.error("Error adjusting shutter opening:", error);
        alert(`Failed to update Roller Shutter opening: ${error.message}`);
    } finally {
        if(buttonIncrease) buttonIncrease.disabled = false;
        if(buttonDecrease) buttonDecrease.disabled = false;
    }
}

// Apre tutte le tapparelle (le imposta a 100)
async function openAllShutters() {
    console.log("Attempting to open all shutters...");
    // Disabilita temporaneamente i bottoni mentre lavora
    const openBtn = document.querySelector('#shutter-general-controls button.btn-primary');
    const closeBtn = document.querySelector('#shutter-general-controls button.btn-danger');
    if(openBtn) openBtn.disabled = true;
    if(closeBtn) closeBtn.disabled = true;

    try {
        const rollerShutters = await fetchApi('/api/entities/rollerShutter/');
        if (!rollerShutters || rollerShutters.length === 0) {
            alert("No shutters found to open."); return;
        }

        const updatePromises = rollerShutters.map(shutter => {
            if (!shutter || !shutter.id) return Promise.resolve();
            // --- USA "value" NEL PAYLOAD ---
            const payload = { value: 100 };
            // -------------------------------
            console.log(`Sending PATCH to open shutter ${shutter.id}`);
            return fetchApi( `/api/entities/rollerShutter/patch/opening/${shutter.id}`, 'PATCH', payload )
                .catch(err => { console.error(`Failed to open shutter ${shutter.id}: ${err.message}`); /* Continua */ });
        });

        await Promise.all(updatePromises);
        alert("Request to open all shutters sent!");
        loadRollerShutters(); // Ricarica lista per vedere stato aggiornato

        // Aggiorna stato selezionato se una tapparella era selezionata
        if(selectedRollerShutterId) {
            const selectedShutter = rollerShutters.find(rs => rs?.id === selectedRollerShutterId);
            if(selectedShutter) { selectRollerShutter(selectedRollerShutterId, selectedShutter.name, 100); }
        }
    } catch (error) {
        console.error("Error opening all shutters:", error);
        alert(`Error opening shutters: ${error.message}`);
    } finally {
         if(openBtn) openBtn.disabled = false;
         if(closeBtn) closeBtn.disabled = false;
    }
}

// Chiude tutte le tapparelle (le imposta a 0)
async function closeAllShutters() {
    console.log("Attempting to close all shutters...");
     // Disabilita temporaneamente i bottoni
    const openBtn = document.querySelector('#shutter-general-controls button.btn-primary');
    const closeBtn = document.querySelector('#shutter-general-controls button.btn-danger');
    if(openBtn) openBtn.disabled = true;
    if(closeBtn) closeBtn.disabled = true;

    try {
        const rollerShutters = await fetchApi('/api/entities/rollerShutter/');
        if (!rollerShutters || rollerShutters.length === 0) {
            alert("No shutters found to close."); return;
        }

        const updatePromises = rollerShutters.map(shutter => {
             if (!shutter || !shutter.id) return Promise.resolve();
             // --- USA "value" NEL PAYLOAD ---
             const payload = { value: 0 };
             // -------------------------------
             console.log(`Sending PATCH to close shutter ${shutter.id}`);
             return fetchApi( `/api/entities/rollerShutter/patch/opening/${shutter.id}`, 'PATCH', payload)
                 .catch(err => { console.error(`Failed to close shutter ${shutter.id}: ${err.message}`); /* Continua */});
        });

        await Promise.all(updatePromises);
        alert("Request to close all shutters sent!");
        loadRollerShutters(); // Ricarica lista

        // Aggiorna stato selezionato se necessario
        if(selectedRollerShutterId) {
            const selectedShutter = rollerShutters.find(rs => rs?.id === selectedRollerShutterId);
            if(selectedShutter) { selectRollerShutter(selectedRollerShutterId, selectedShutter.name, 0); }
        }
    } catch (error) {
        console.error("Error closing all shutters:", error);
        alert(`Error closing shutters: ${error.message}`);
    } finally {
        if(openBtn) openBtn.disabled = false;
        if(closeBtn) closeBtn.disabled = false;
    }
}