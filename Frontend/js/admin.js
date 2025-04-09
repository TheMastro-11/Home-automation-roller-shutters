// Nota: Assicurati che admin.js sia caricato *dopo* api.js
// Le funzioni chiamate da onclick nell'HTML devono essere globali
// (lo sono di default se non usi type="module")

async function loadAdminHomes() {
    const homeList = document.getElementById("admin-homes-list");
    if (!homeList) return;
    homeList.innerHTML = "<li>Loading homes...</li>"; // Feedback caricamento

    try {
        const homes = await fetchApi('/api/entities/home/');
        homeList.innerHTML = ""; // Pulisci prima di aggiungere
        if (homes && homes.length > 0) {
            homes.forEach((home) => {
                const li = document.createElement("li");
                // Usiamo classi Bootstrap per stile e layout migliore
                li.className = "list-group-item d-flex justify-content-between align-items-center";
                li.innerHTML = `
                    <span>${home.name}</span>
                    <div>
                        <button class="btn btn-sm btn-warning me-2" onclick="showEditHomeForm('${home.id}', '${home.name}')">Edit</button>
                        <button class="btn btn-sm btn-danger me-2" onclick="deleteHome('${home.id}')">Delete</button>
                        <button class="btn btn-sm btn-info" onclick="showAutomationsForHome('${home.id}', '${home.name}')">Automations</button>
                    </div>
                `;
                homeList.appendChild(li);
            });
        } else {
            homeList.innerHTML = "<li class='list-group-item'>No homes found.</li>";
        }
    } catch (error) {
        homeList.innerHTML = `<li class='list-group-item text-danger'>Error loading homes: ${error.message}</li>`;
        // Potresti voler mostrare un alert o un messaggio più visibile
        // alert("Error loading admin homes.");
    }
}

async function addHome(event) {
    event.preventDefault();
    const homeNameInput = document.getElementById("newHomeName");
    const homeName = homeNameInput.value.trim();
    const spinner = document.getElementById("loadingSpinner"); // Assicurati esista
    const addButton = event.submitter; // Il bottone che ha sottomesso il form

    if (!homeName) {
        alert("Please enter a home name.");
        return;
    }

    if(spinner) spinner.style.display = "block";
    addButton.disabled = true; // Disabilita bottone durante chiamata

    try {
        await fetchApi('/api/entities/home/create', 'POST', { name: homeName });
        alert("Home added successfully!");
        homeNameInput.value = ""; // Pulisci campo
        loadAdminHomes(); // Ricarica lista
    } catch (error) {
        alert(`Failed to add home: ${error.message}`);
    } finally {
         if(spinner) spinner.style.display = "none";
         addButton.disabled = false; // Riabilita bottone
    }
}

function showEditHomeForm(homeId, homeName) {
    document.getElementById("add-home-form").style.display = "none";
    document.getElementById("edit-home-form").style.display = "block";
    document.getElementById("editHomeId").value = homeId;
    document.getElementById("editHomeName").value = homeName;
}

function cancelEditHome() {
    document.getElementById("edit-home-form").style.display = "none";
    document.getElementById("add-home-form").style.display = "block";
}

async function submitEditHome(event) { // Cambiato nome da editHome per chiarezza
    event.preventDefault();
    const id = document.getElementById("editHomeId").value;
    const newNameInput = document.getElementById("editHomeName");
    const newName = newNameInput.value.trim();
    const saveButton = event.submitter;

    if (!newName) {
        alert("Please enter the new home name.");
        return;
    }

    saveButton.disabled = true;

    try {
        // Usiamo PATCH per modificare solo il nome (più sicuro)
        // Assicurati che il backend supporti PATCH per /api/entities/home/{id}
        // e che accetti un body come { "name": "nuovoNome" }
        await fetchApi(`/api/entities/home/${id}`, 'PATCH', { name: newName });

        // Se PATCH non è supportato e devi usare PUT:
        // ATTENZIONE: Verifica che il backend gestisca correttamente
        // un PUT solo con 'id' e 'name', senza resettare le altre proprietà.
        // Altrimenti, dovresti prima fare una GET della casa, modificare il nome
        // e poi fare PUT dell'oggetto completo.
        // await fetchApi(`/api/entities/home/put/${id}`, 'PUT', { id: id, name: newName /*, ...altre proprietà se richieste dal PUT */ });

        alert("Home name updated successfully!");
        cancelEditHome(); // Nascondi form modifica, mostra aggiunta
        loadAdminHomes(); // Ricarica lista
    } catch (error) {
        alert(`Failed to update home: ${error.message}`);
    } finally {
        saveButton.disabled = false;
    }
}


async function deleteHome(homeId) {
    // Usa un feedback migliore di confirm() se possibile
    if (!confirm("Are you sure you want to delete this home? This might also delete associated devices and automations depending on backend logic.")) {
        return;
    }

    try {
        await fetchApi(`/api/entities/home/delete/${homeId}`, 'DELETE');
        alert("Home deleted successfully!");
        loadAdminHomes(); // Ricarica lista
    } catch (error) {
        alert(`Failed to delete home: ${error.message}`);
    }
}

// --- Funzioni Automazioni Admin ---
// Potrebbero stare anche in automations.js, ma le lascio qui
// perché sono chiamate dai pulsanti nella lista case admin

// Mostra la sezione principale delle automazioni,
// filtrata (visivamente o tramite chiamata API) per la casa selezionata
function showAutomationsForHome(homeId, homeName) {
    // Qui devi decidere come visualizzare/filtrare le automazioni
    // Opzione 1: Caricare *solo* le automazioni di questa casa nella lista principale
    console.log(`Loading automations for Home ID: ${homeId}, Name: ${homeName}`);
    document.getElementById("automations-section-title").innerText = `Automations for: ${homeName}`; // Aggiorna titolo sezione automazioni
    document.getElementById("automation-home-id-hidden").value = homeId; // Salva ID per il form di aggiunta
    loadAutomations(homeId); // Chiama la funzione (che sarà in automations.js) per caricare/filtrare

    // Rendi visibile la sezione automazioni se era nascosta
    document.getElementById("automations-section").style.display = 'block';

    // Nascondi la sezione admin se vuoi che l'admin si concentri solo sulle automazioni ora
    // document.getElementById("admin-section").style.display = 'none';
}

// Nota: le funzioni effettive loadAutomations, addAutomation, deleteAutomation
// andranno nel file automations.js ma potrebbero accettare homeId come parametro.