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
            <span>Opening: ${shutter.percentageOpening ?? 0}%</span>
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
  
  
async function adjustRollerShutterOpening(increase) {
    if (!selectedRollerShutterId) {
      alert("Seleziona prima una tapparella.");
      return;
    }
  
    // 1) Leggi apertura corrente dal testo di stato
    const statusEl = document.getElementById("rollerShutterStatus");
    let current = 0;
    if (statusEl) {
      const m = statusEl.textContent.match(/Opening:\s*(\d+)%/);
      if (m) {
        current = parseInt(m[1], 10);
      }
    }
  
    // 2) Calcola il bersaglio e il delta
    const target = increase
      ? Math.min(current + 10, 100)
      : Math.max(current - 10, 0);
    const delta = target - current;
    if (delta === 0) {
      // niente da fare
      return;
    }
  
    // 3) Disabilita tutti i bottoni
    document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = true);
  
    try {
      // 4) Invia il delta al backend
      await fetchApi(
        `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
        'PATCH',
        { value: delta }
      );
  
      // 5) Aggiorna la UI: stato e lista
      if (statusEl) {
        statusEl.textContent = statusEl.textContent.replace(
          /Opening:\s*\d+%/,
          `Opening: ${target}%`
        );
      }
      const listSpan = document.querySelector(`#shutter-item-${selectedRollerShutterId} span:last-child`);
      if (listSpan) {
        listSpan.textContent = `Opening: ${target}%`;
      }
    } catch (err) {
      console.error("Error adjusting shutter opening:", err);
      alert("Errore durante l'aggiornamento: " + err.message);
    } finally {
      // 6) Riabilita i bottoni
      document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = false);
    }
  }
  

// Modifica l'apertura della tapparella selezionata (+/- 10%)
async function adjustRollerShutterOpening(increase) {
    if (!selectedRollerShutterId) {
      alert("Seleziona prima una tapparella.");
      return;
    }
  
    // Leggi valore corrente
    const statusEl = document.getElementById("rollerShutterStatus");
    let current = 0;
    if (statusEl) {
      const m = statusEl.textContent.match(/Opening:\s*(\d+)%/);
      if (m) current = parseInt(m[1], 10);
    }
  
    // Delta fisso
    const delta = increase ? 10 : -10;
    const newOpening = Math.min(Math.max(current + delta, 0), 100);
  
    // Disabilita bottoni
    document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = true);
  
    try {
      // INVIA SOLO IL DELTA
      await fetchApi(
        `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
        'PATCH',
        { value: delta }
      );
  
      // Aggiorna UI
      statusEl.textContent = statusEl.textContent.replace(
        /Opening:\s*\d+%/,
        `Opening: ${newOpening}%`
      );
  
      const span = document.querySelector(`#shutter-item-${selectedRollerShutterId} span:last-child`);
      if (span) span.textContent = `Opening: ${newOpening}%`;
  
    } catch (err) {
      console.error("Error adjusting shutter opening:", err);
      alert("Errore durante l'aggiornamento: " + err.message);
    } finally {
      // Riabilita
      document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = false);
    }
  }
  
// Apre tutte le tapparelle (portandole a 100%)
async function openAllShutters() {
    try {
      const shutters = await fetchApi('/api/entities/rollerShutter/');
      if (!Array.isArray(shutters) || shutters.length === 0) {
        alert("Nessuna tapparella da aprire.");
        return;
      }
      // Disabilita i controlli generali
      document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = true);
  
      // Per ogni tapparella calcola delta = 100 - currentOpening
      const promises = shutters.map(shutter => {
        const current = shutter.percentageOpening ?? 0;
        const delta = 100 - current;
        if (delta === 0) return Promise.resolve();
        return fetchApi(
          `/api/entities/rollerShutter/patch/opening/${shutter.id}`,
          'PATCH',
          { value: delta }
        );
      });
      await Promise.all(promises);
  
      // Aggiorna UI: tutte a 100%
      document.querySelectorAll('#rollerShutter-list-items li').forEach(li => {
        li.querySelector('span:last-child').textContent = 'Opening: 100%';
      });
      const statusEl = document.getElementById("rollerShutterStatus");
      if (statusEl) statusEl.textContent = 'Selected: All shutters (Opening: 100%)';
  
      alert("Tutte le tapparelle sono state aperte.");
    } catch (err) {
      console.error("Error opening all shutters:", err);
      alert("Errore aprendo tutte le tapparelle: " + err.message);
    } finally {
      document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = false);
    }
  }
  
  // Chiude tutte le tapparelle (portandole a 0%)
  async function closeAllShutters() {
    try {
      const shutters = await fetchApi('/api/entities/rollerShutter/');
      if (!Array.isArray(shutters) || shutters.length === 0) {
        alert("Nessuna tapparella da chiudere.");
        return;
      }
      // Disabilita i controlli generali
      document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = true);
  
      // Per ogni tapparella calcola delta = 0 - currentOpening = -currentOpening
      const promises = shutters.map(shutter => {
        const current = shutter.percentageOpening ?? 0;
        const delta = -current;
        if (delta === 0) return Promise.resolve();
        return fetchApi(
          `/api/entities/rollerShutter/patch/opening/${shutter.id}`,
          'PATCH',
          { value: delta }
        );
      });
      await Promise.all(promises);
  
      // Aggiorna UI: tutte a 0%
      document.querySelectorAll('#rollerShutter-list-items li').forEach(li => {
        li.querySelector('span:last-child').textContent = 'Opening: 0%';
      });
      const statusEl = document.getElementById("rollerShutterStatus");
      if (statusEl) statusEl.textContent = 'Selected: All shutters (Opening: 0%)';
  
      alert("Tutte le tapparelle sono state chiuse.");
    } catch (err) {
      console.error("Error closing all shutters:", err);
      alert("Errore chiudendo tutte le tapparelle: " + err.message);
    } finally {
      document.querySelectorAll('#rollerShutter-controls button').forEach(b => b.disabled = false);
    }
  }
  