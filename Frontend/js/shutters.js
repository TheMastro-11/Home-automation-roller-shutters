let selectedRollerShutterId = null; // Variabile per tenere traccia della tapparella selezionata

// Carica le tapparelle (possibilmente filtrate per homeId)
async function loadRollerShutters(homeId = null) {
    const rollerShutterList = document.getElementById("rollerShutter-list-items");
    if (!rollerShutterList) return;
    rollerShutterList.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";
    document.getElementById("rollerShutter-controls").style.display = 'none';

    // Usa SEMPRE il path base corretto
    const apiPath = '/api/entities/rollerShutter/';

    // !!! NOTA: Filtro per homeId NON implementato !!!
    // Verranno caricate le tapparelle accessibili dall'utente/token.
    // Se serve filtro specifico per homeId, chiedere al backend come fare.
     if (homeId) {
         console.warn(`Filtering shutters by homeId (${homeId}) is NOT YET IMPLEMENTED pending backend API details. Loading all accessible shutters from ${apiPath}`);
         // Eventuale logica filtro: apiPath = `/api/entities/rollerShutter/?homeId=${homeId}`;
    }

    try {
        const rollerShutters = await fetchApi(apiPath);
        rollerShutterList.innerHTML = "";

        if (rollerShutters && rollerShutters.length > 0) {
            rollerShutters.forEach((shutter) => {
                const li = document.createElement("li");
                li.className = "list-group-item list-group-item-action"; // Action per stile hover/focus
                li.style.cursor = "pointer";
                li.innerHTML = `${shutter.name} - <span>Opening: ${shutter.percentageOpening}%</span>`;
                li.onclick = () => selectRollerShutter(shutter.id, shutter.name, shutter.percentageOpening);
                li.id = `shutter-item-${shutter.id}`;
                rollerShutterList.appendChild(li);
            });
        } else {
            rollerShutterList.innerHTML = "<li class='list-group-item'>No roller shutters found.</li>";
        }
    } catch (error) {
        rollerShutterList.innerHTML = `<li class='list-group-item text-danger'>Error loading shutters: ${error.message}</li>`;
    }
}

function selectRollerShutter(id, name, opening) {
    selectedRollerShutterId = id;
    document.getElementById("rollerShutterStatus").textContent = `Selected: ${name} (Opening: ${opening}%)`;
    document.getElementById("rollerShutter-controls").style.display = "block";

    // Deseleziona visivamente gli altri elementi e seleziona questo
    document.querySelectorAll('#rollerShutter-list-items li').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`shutter-item-${id}`)?.classList.add('active');
}

async function adjustRollerShutterOpening(increase) {
    if (!selectedRollerShutterId) {
        alert("Please select a roller shutter first.");
        return;
    }

    const statusElement = document.getElementById("rollerShutterStatus");
    const currentOpeningText = statusElement.textContent;
    let currentOpening = 0;

    // Estrai l'apertura corrente dal testo (più robusto)
    const match = currentOpeningText.match(/Opening: (\d+)%/);
    if (match && match[1]) {
        currentOpening = parseInt(match[1], 10);
    } else {
        console.error("Could not parse current opening from text:", currentOpeningText);
        alert("Error reading current shutter status.");
        return;
    }

    let newOpening = increase ? currentOpening + 10 : currentOpening - 10;
    newOpening = Math.min(Math.max(newOpening, 0), 100); // Clamp 0-100

    const data = { percentageOpening: newOpening };
    const button = increase ? document.querySelector('#rollerShutter-controls button.btn-primary') : document.querySelector('#rollerShutter-controls button.btn-danger');
    if(button) button.disabled = true;

    try {
        // Assicurati che l'endpoint PATCH esista e accetti questo formato
        const updatedShutter = await fetchApi(
            `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
            'PATCH',
            data
        );

        // Aggiorna lo stato visualizzato
        const shutterNameMatch = currentOpeningText.match(/Selected: (.*?)\s+\(/);
        const shutterName = shutterNameMatch ? shutterNameMatch[1] : 'Shutter';
        statusElement.textContent = `Selected: ${shutterName} (Opening: ${newOpening}%)`;

        // Aggiorna anche la lista
        const listItem = document.getElementById(`shutter-item-${selectedRollerShutterId}`);
        if (listItem) {
             const openingSpan = listItem.querySelector('span');
             if(openingSpan) openingSpan.textContent = `Opening: ${newOpening}%`;
        }

        // alert("Roller Shutter opening updated successfully!"); // Forse non serve alert qui
    } catch (error) {
        alert(`Failed to update Roller Shutter opening: ${error.message}`);
    } finally {
        if(button) button.disabled = false;
    }
}

// Funzioni Open/Close All - Verifica endpoint!
async function openAllShutters() {
    // Verifica qual è l'endpoint corretto:
    // 1. Uno specifico per la casa? Es. /api/entities/home/{homeId}/shutters/openAll
    // 2. Quello generico /device/updateOpening/ per ogni tapparella? (come nel codice originale)

    // Assumiamo l'approccio originale per ora, ma è da verificare col backend
    alert("Opening all shutters... (Check API endpoint implementation)");
    const token = localStorage.getItem("jwt"); // fetchApi lo aggiunge, ma qui serve per la logica originale

    try {
        // Dovremmo ottenere solo le tapparelle dell'utente, non tutti i device
        const rollerShutters = await fetchApi('/api/entities/rollerShutter/'); // O l'endpoint filtrato per casa

        if (!rollerShutters || rollerShutters.length === 0) {
            alert("No shutters found to open.");
            return;
        }

        // Crea un array di promesse per le chiamate PATCH
        const updatePromises = rollerShutters.map(shutter =>
            fetchApi(
                `/api/entities/rollerShutter/patch/opening/${shutter.id}`, // Usa l'endpoint specifico per tapparelle se esiste
                'PATCH',
                { percentageOpening: 100 }
            ).catch(err => { // Gestisci errori per singola tapparella se vuoi
                console.error(`Failed to open shutter ${shutter.id}: ${err.message}`);
                // Potresti voler continuare anche se una fallisce
                return null; // O lanciare errore per Promise.all
            })
        );

        // Aspetta che tutte le chiamate siano completate
        await Promise.all(updatePromises);

        alert("All shutters opened (or request sent)!");
        loadRollerShutters(); // Ricarica la lista per vedere lo stato aggiornato
        // Aggiorna anche lo stato del controllo selezionato se una tapparella era selezionata
        if(selectedRollerShutterId) {
            const selectedShutter = rollerShutters.find(rs => rs.id === selectedRollerShutterId);
            if(selectedShutter) {
                 selectRollerShutter(selectedShutterId, selectedShutter.name, 100);
            }
        }


    } catch (error) {
        console.error("Error opening all shutters:", error);
        alert(`Error opening shutters: ${error.message}`);
    }
}

async function closeAllShutters() {
    // Simile a openAllShutters, ma imposta percentageOpening a 0
    alert("Closing all shutters... (Check API endpoint implementation)");
     const token = localStorage.getItem("jwt");

    try {
        const rollerShutters = await fetchApi('/api/entities/rollerShutter/'); // O l'endpoint filtrato per casa

         if (!rollerShutters || rollerShutters.length === 0) {
            alert("No shutters found to close.");
            return;
        }

        const updatePromises = rollerShutters.map(shutter =>
            fetchApi(
                `/api/entities/rollerShutter/patch/opening/${shutter.id}`,
                'PATCH',
                { percentageOpening: 0 }
            ).catch(err => {
                console.error(`Failed to close shutter ${shutter.id}: ${err.message}`);
                return null;
            })
        );

        await Promise.all(updatePromises);

        alert("All shutters closed (or request sent)!");
        loadRollerShutters();
         if(selectedRollerShutterId) {
            const selectedShutter = rollerShutters.find(rs => rs.id === selectedRollerShutterId);
            if(selectedShutter) {
                 selectRollerShutter(selectedRollerShutterId, selectedShutter.name, 0);
            }
        }
    } catch (error) {
        console.error("Error closing all shutters:", error);
        alert(`Error closing shutters: ${error.message}`);
    }
}