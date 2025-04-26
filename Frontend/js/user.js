// Carica tutte le case dell’utente e imposta il listener sulla select
async function loadUserHomeDetails() {
  const homeSelect = document.getElementById("userHomeSelect");
  if (!homeSelect) return;
  homeSelect.innerHTML = '<option value="" disabled selected>Caricamento…</option>';

  try {
    const homes = await fetchApi("/api/entities/home/");
    homeSelect.innerHTML = '<option value="" disabled selected>Seleziona una casa…</option>';
    homes.forEach(home => {
      const opt = document.createElement("option");
      opt.value = home.id;
      opt.textContent = home.name;
      homeSelect.appendChild(opt);
    });
    homeSelect.onchange = () => {
      const id = homeSelect.value;
      if (id) {
        document.getElementById("shutters-status").style.display = "block";
        document.getElementById("sensor-status").style.display  = "block";
        loadRollerShutters(id);
        loadLightSensors(id);
      }
    };
  } catch (e) {
    console.error("Errore caricando case:", e);
    homeSelect.innerHTML = '<option disabled>Errore caricamento</option>';
  }
}
