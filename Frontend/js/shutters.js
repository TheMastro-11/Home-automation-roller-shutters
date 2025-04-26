// ========================================
//        js/shutters.js (COMPLETO v. 14/04/25)
// ========================================

// Nota: Assicurati che questo file sia caricato DOPO api.js e PRIMA di user.js/dashboard.js

let selectedRollerShutterId = null; // Variabile globale per ID tapparella selezionata

// 1) Carica tapparelle per casa
async function loadRollerShutters(homeId) {
    const list = document.getElementById("rollerShutter-list-items");
    if (!list) return;
    list.innerHTML = "<li class='list-group-item'>Loading shutters...</li>";

    try {
        const shutters = await fetchApi('/api/entities/rollerShutter/');
        list.innerHTML = "";

        if (Array.isArray(shutters) && shutters.length > 0) {
            shutters.forEach(shutter => {
                const li = document.createElement("li");
                li.id = `shutter-item-${shutter.id}`;
                li.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
                li.innerHTML = `
            <span>${shutter.name}</span>
            <span class="opening">Opening: ${shutter.percentageOpening ?? 0}%</span>
          `;
                li.onclick = () => selectRollerShutter(shutter.id, shutter.name, shutter.percentageOpening ?? 0);
                list.appendChild(li);
            });
        } else {
            list.innerHTML = "<li class='list-group-item'>No roller shutters found.</li>";
        }
    } catch (e) {
        console.error("Error loading shutters:", e);
        list.innerHTML = `<li class="list-group-item text-danger">Error: ${e.message}</li>`;
    }
}


/* ======================================================
 ±10 % di apertura con aggiornamento in-page immediato
====================================================== */
async function adjustRollerShutterOpening(increase = true) {
    if (!selectedRollerShutterId) {
        alert("Select a shutter first."); return;
    }

    /* 1) valore corrente letto dalla status-bar */
    const statusEl = document.getElementById("rollerShutterStatus");
    let current = 0;
    if (statusEl) {
        const m = statusEl.textContent.match(/Opening:\s*(\d+)%/);
        if (m) current = parseInt(m[1], 10);
    }

    const delta = increase ? 10 : -10;
    const newOpening = Math.min(Math.max(current + delta, 0), 100);

    /* 2) disabilita i pulsanti mentre patchi */
    document.querySelectorAll("#rollerShutter-controls button")
        .forEach(b => b.disabled = true);

    try {
        /* 3) PATCH al backend (manda solo il delta) */
        await fetchApi(
            `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
            "PATCH",
            { value: delta }
        );

        /* 4) aggiorna la status-bar */
        if (statusEl) {
            statusEl.textContent = statusEl.textContent.replace(
                /Opening:\s*\d+%/,
                `Opening: ${newOpening}%`
            );
        }

        /* 5) aggiorna tutte le celle percentuale nelle due liste */
        document.querySelectorAll(
            `#shutter-item-${selectedRollerShutterId} span.opening`
        ).forEach(span => span.textContent = `Opening: ${newOpening}%`);

    } catch (err) {
        console.error("Error adjusting shutter opening:", err);
        alert("Error: " + err.message);
    } finally {
        document.querySelectorAll("#rollerShutter-controls button")
            .forEach(b => b.disabled = false);
    }
}


/* ======================================================
   OPEN ALL  – porta tutto a 100 % e aggiorna il DOM
====================================================== */
async function openAllShutters() {
    try {
        const shutters = await fetchApi("/api/entities/rollerShutter/");
        if (!Array.isArray(shutters) || shutters.length === 0) {
            alert("No shutter to open."); return;
        }

        /* disabilita i controlli */
        document.querySelectorAll("#rollerShutter-controls button")
            .forEach(b => b.disabled = true);

        /* manda solo il delta necessario per ogni tapparella */
        await Promise.all(
            shutters.map(s => {
                const delta = 100 - (s.percentageOpening ?? 0);
                return delta
                    ? fetchApi(
                        `/api/entities/rollerShutter/patch/opening/${s.id}`,
                        "PATCH",
                        { value: delta }
                    )
                    : Promise.resolve();
            })
        );

        /* ——— UPDATE DOM ——— */
        document.querySelectorAll("span.opening")
            .forEach(span => span.textContent = "Opening: 100%");
        const statusEl = document.getElementById("rollerShutterStatus");
        if (statusEl) statusEl.textContent =
            "Selected: All shutters (Opening: 100%)";

    } catch (err) {
        console.error("Error opening all shutters:", err);
        alert("Error: " + err.message);
    } finally {
        document.querySelectorAll("#rollerShutter-controls button")
            .forEach(b => b.disabled = false);
    }
}


/* ======================================================
   CLOSE ALL  – porta tutto a 0 % e aggiorna il DOM
====================================================== */
async function closeAllShutters() {
    try {
        const shutters = await fetchApi("/api/entities/rollerShutter/");
        if (!Array.isArray(shutters) || shutters.length === 0) {
            alert("No shutter to close."); return;
        }

        document.querySelectorAll("#rollerShutter-controls button")
            .forEach(b => b.disabled = true);

        await Promise.all(
            shutters.map(s => {
                const delta = -(s.percentageOpening ?? 0);   // 0 % → delta negativo
                return delta
                    ? fetchApi(
                        `/api/entities/rollerShutter/patch/opening/${s.id}`,
                        "PATCH",
                        { value: delta }
                    )
                    : Promise.resolve();
            })
        );

        /* ——— UPDATE DOM ——— */
        document.querySelectorAll("span.opening")
            .forEach(span => span.textContent = "Opening: 0%");
        const statusEl = document.getElementById("rollerShutterStatus");
        if (statusEl) statusEl.textContent =
            "Selected: All shutters (Opening: 0%)";

    } catch (err) {
        console.error("Error closing all shutters:", err);
        alert("Error: " + err.message);
    } finally {
        document.querySelectorAll("#rollerShutter-controls button")
            .forEach(b => b.disabled = false);
    }
}


function selectRollerShutter(id, name, opening) {
    selectedRollerShutterId = id;

    /* status bar */
    const statusEl = document.getElementById('rollerShutterStatus');
    if (statusEl) {
        statusEl.textContent = `Selected: ${name} (Opening: ${opening}%)`;
    }

    /* evidenza visiva (classe Bootstrap active) */
    // – lista del live-control
    document.querySelectorAll('#rollerShutter-list-items .list-group-item')
        .forEach(li => li.classList.remove('active'));
    // – lista di Manage Shutters
    document.querySelectorAll('#manage-shutters-list .list-group-item')
        .forEach(li => li.classList.remove('active'));

    document.getElementById(`shutter-item-${id}`)?.classList.add('active');
}