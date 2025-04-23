// ========================================
//        js/shutters.js (COMPLETO v. 14/04/25)
// ========================================

// Nota: Assicurati che questo file sia caricato DOPO api.js e PRIMA di user.js/dashboard.js

let selectedRollerShutterId = null; // Variabile globale per ID tapparella selezionata

// Carica le tapparelle (per utente loggato)
async function loadRollerShutters(homeId = null) { // homeId qui probabilmente non serve per la vista utente
    const rollerShutterList = document.getElementById("rollerShutter-list-items");
    if (!rollerShutterList) { console.error("Element '#rollerShutter-list-items' not found."); return; }
    rollerShutterList.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

    const controls = document.getElementById("rollerShutter-controls"); if(controls) controls.style.display = 'none';
    selectedRollerShutterId = null;

    // Usa l'API base, il backend dovrebbe filtrare per l'utente autenticato
    const apiPath = '/api/entities/rollerShutter/';
    console.log("Loading user's roller shutters from:", apiPath);

    try {
        const rollerShutters = await fetchApi(apiPath); // GET shutters for user
        rollerShutterList.innerHTML = "";

        if (rollerShutters && Array.isArray(rollerShutters) && rollerShutters.length > 0) {
            rollerShutters.forEach((shutter) => {
                if (!shutter || !shutter.id) return;
                const li = document.createElement("li");
                li.className = "list-group-item list-group-item-action"; // Action per stile hover/focus
                li.style.cursor = "pointer";
                // Assumiamo che l'API GET ritorni 'percentageOpening'
                const opening = shutter.percentageOpening ?? 'N/A';
                li.innerHTML = `${shutter.name || 'Unnamed Shutter'} - <span>Opening: ${opening}%</span>`;
                // Passa l'opening attuale alla funzione select
                li.onclick = () => selectRollerShutter(shutter.id, shutter.name, opening);
                li.id = `shutter-item-${shutter.id}`; // ID univoco
                rollerShutterList.appendChild(li);
            });
        } else {
            rollerShutterList.innerHTML = "<li class='list-group-item'>No roller shutters found in your home.</li>";
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
    if (statusElement) { statusElement.textContent = `Selected: ${name || 'Unnamed'} (Opening: ${opening ?? 'N/A'}%)`; }
    const controls = document.getElementById("rollerShutter-controls"); if (controls) controls.style.display = "block"; // Mostra controlli +/-

    // Evidenzia l'elemento selezionato nella lista
    document.querySelectorAll('#rollerShutter-list-items li').forEach(item => item.classList.remove('active'));
    const listItem = document.getElementById(`shutter-item-${id}`); if(listItem) listItem.classList.add('active');
}

// Modifica l'apertura della tapparella selezionata (+/- 10%)
async function adjustRollerShutterOpening(increase) {
    if (!selectedRollerShutterId) { alert("Please select a roller shutter first."); return; }

    const statusElement = document.getElementById("rollerShutterStatus");
    const currentOpeningText = statusElement ? statusElement.textContent : '';
    let currentOpening = 0;

    const match = currentOpeningText.match(/Opening: (\d+)%/);
    if (match && match[1]) { currentOpening = parseInt(match[1], 10); }
    else {
        const listItem = document.getElementById(`shutter-item-${selectedRollerShutterId}`);
        const span = listItem ? listItem.querySelector('span') : null;
        const listMatch = span ? span.textContent.match(/Opening: (\d+)%/) : null;
        if (listMatch && listMatch[1]) { currentOpening = parseInt(listMatch[1], 10); }
        else { console.error("Could not parse current opening."); alert("Error reading current status."); return; }
    }

    let newOpening = increase ? currentOpening + 10 : currentOpening - 10;
    newOpening = Math.min(Math.max(newOpening, 0), 100); // Clamp 0-100

    // --- USA "value" NEL PAYLOAD ---
    const data = { value: newOpening };
    // -------------------------------

    const btnIncrease = document.querySelector('#rollerShutter-controls button.btn-primary');
    const btnDecrease = document.querySelector('#rollerShutter-controls button.btn-danger');
    if(btnIncrease) btnIncrease.disabled = true; if(btnDecrease) btnDecrease.disabled = true;

    try {
        // Chiama l'endpoint /patch/opening/ ma invia { "value": ... }
        // !!! ATTENZIONE: BACKEND BUG NOTO !!!
        // Il servizio backend patchOpeningRollerShutter(id, value) attualmente
        // SOMMA il 'value' inviato al valore esistente, invece di IMPOSTARLO.
        // Questo causerà un comportamento errato finché il backend non viene corretto.
        console.warn("Calling PATCH opening - Backend service might ADD the value instead of SETTING it!");
        await fetchApi( `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`, 'PATCH', data );

        // Aggiorna UI (ipotizzando che la PATCH abbia funzionato come previsto SETTANDO il valore)
        const shutterNameMatch = currentOpeningText.match(/Selected: (.*?)\s+\(/);
        const shutterName = shutterNameMatch ? shutterNameMatch[1] : 'Shutter';
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
        if(btnIncrease) btnIncrease.disabled = false;
        if(btnDecrease) btnDecrease.disabled = false;
    }
}

// Apre tutte le tapparelle (le imposta a 100)
async function openAllShutters() {
    console.log("Attempting to open all shutters...");
    const openBtn = document.querySelector('#shutter-general-controls button.btn-primary');
    const closeBtn = document.querySelector('#shutter-general-controls button.btn-danger');
    if(openBtn) openBtn.disabled = true; if(closeBtn) closeBtn.disabled = true;

    try {
        const rollerShutters = await fetchApi('/api/entities/rollerShutter/');
        if (!rollerShutters || !Array.isArray(rollerShutters) || rollerShutters.length === 0) {
            alert("No shutters found to open."); return;
        }

        const updatePromises = rollerShutters.map(shutter => {
            if (!shutter || !shutter.id) return Promise.resolve();
            // --- USA "value" NEL PAYLOAD ---
            const payload = { value: 100 };
            // -------------------------------
            console.log(`Sending PATCH to open shutter ${shutter.id}`);
            // !!! ATTENZIONE: BACKEND BUG NOTO !!! (Come sopra)
            console.warn(`Shutter ${shutter.id}: Backend might ADD 100 instead of setting to 100!`);
            return fetchApi( `/api/entities/rollerShutter/patch/opening/${shutter.id}`, 'PATCH', payload )
                .catch(err => { console.error(`Failed to open shutter ${shutter.id}: ${err.message}`); }); // Non bloccare Promise.all
        });

        await Promise.all(updatePromises);
        alert("Request to open all shutters sent!");
        loadRollerShutters(); // Ricarica lista

        if(selectedRollerShutterId) {
            const selectedShutter = rollerShutters.find(rs => rs?.id === selectedRollerShutterId);
            if(selectedShutter) { selectRollerShutter(selectedRollerShutterId, selectedShutter.name, 100); }
        }
    } catch (error) {
        console.error("Error opening all shutters:", error);
        alert(`Error opening shutters: ${error.message}`);
     }
    finally { if(openBtn) openBtn.disabled = false; if(closeBtn) closeBtn.disabled = false; }
}

// Chiude tutte le tapparelle (le imposta a 0)
async function closeAllShutters() {
    console.log("Attempting to close all shutters...");
    const openBtn = document.querySelector('#shutter-general-controls button.btn-primary');
    const closeBtn = document.querySelector('#shutter-general-controls button.btn-danger');
    if(openBtn) openBtn.disabled = true; if(closeBtn) closeBtn.disabled = true;

    try {
        const rollerShutters = await fetchApi('/api/entities/rollerShutter/');
        if (!rollerShutters || !Array.isArray(rollerShutters) || rollerShutters.length === 0) {
            alert("No shutters found to close."); return;
        }

        const updatePromises = rollerShutters.map(shutter => {
             if (!shutter || !shutter.id) return Promise.resolve();
             // --- USA "value" NEL PAYLOAD ---
             const payload = { value: 0 };
             // -------------------------------
             console.log(`Sending PATCH to close shutter ${shutter.id}`);
             // !!! ATTENZIONE: BACKEND BUG NOTO !!! (Come sopra)
             console.warn(`Shutter ${shutter.id}: Backend might ADD 0 instead of setting to 0!`);
             return fetchApi( `/api/entities/rollerShutter/patch/opening/${shutter.id}`, 'PATCH', payload)
                 .catch(err => { console.error(`Failed to close shutter ${shutter.id}: ${err.message}`); });
        });

        await Promise.all(updatePromises);
        alert("Request to close all shutters sent!");
        loadRollerShutters(); // Ricarica lista

        if(selectedRollerShutterId) {
            const selectedShutter = rollerShutters.find(rs => rs?.id === selectedRollerShutterId);
            if(selectedShutter) { selectRollerShutter(selectedRollerShutterId, selectedShutter.name, 0); }
        }
    } catch (error) {
        console.error("Error closing all shutters:", error);
        alert(`Error closing shutters: ${error.message}`);
     }
    finally { if(openBtn) openBtn.disabled = false; if(closeBtn) closeBtn.disabled = false; }
}

// ========================================
//      FINE js/shutters.js
// ========================================