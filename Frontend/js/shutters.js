let selectedRollerShutterId = null;
let selectedRollerShutterName = null;


function selectRollerShutter(id, name, opening) {
    console.log(`Selected shutter: ID=${id}, Name=${name}, Opening=${opening}%`);
    selectedRollerShutterId = id;
    selectedRollerShutterName = name; 

    const statusControlEl = document.getElementById('rollerShutterStatusControl'); 
    const statusManageEl = document.getElementById('rollerShutterStatusManage');
    const statusText = `Selected: ${name} (Opening: ${opening}%)`;
    if (statusControlEl) statusControlEl.textContent = statusText;
    if (statusManageEl) statusManageEl.textContent = statusText;

    document.querySelectorAll('#rollerShutter-list-items .list-group-item, #manage-shutters-list .list-group-item')
        .forEach(li => li.classList.remove('active'));

     const controlListItem = document.getElementById(`control-shutter-item-${id}`); 
     const manageListItem = document.getElementById(`manage-shutter-item-${id}`); 
     if (controlListItem) controlListItem.classList.add('active');
     if (manageListItem) manageListItem.classList.add('active');
}


async function adjustRollerShutterOpening(increase = true) {
    if (!selectedRollerShutterId) {
        alert("Please select a shutter first."); return;
    }
    let currentOpening = 0;
     const activeManageItem = document.querySelector('#manage-shutters-list .list-group-item.active span.opening');
     const activeControlItem = document.querySelector('#rollerShutter-list-items .list-group-item.active span.opening');
     const openingSpan = activeManageItem || activeControlItem;

    if (openingSpan) {
        const match = openingSpan.textContent.match(/Opening:\s*(\d+)/);
        if (match) {
            currentOpening = parseInt(match[1], 10);
        } else {
            console.warn("Could not parse current opening from selected item:", openingSpan.textContent);
             const statusEl = document.getElementById('rollerShutterStatusManage') || document.getElementById('rollerShutterStatusControl');
             if (statusEl) {
                const statusMatch = statusEl.textContent.match(/Opening:\s*(\d+)/);
                if (statusMatch) currentOpening = parseInt(statusMatch[1], 10);
             }
        }
    } else {
         console.warn("No active shutter item found to read current opening.");
    }

    const delta = increase ? 10 : -10;
    let newOpening = Math.min(Math.max(currentOpening + delta, 0), 100);
    const controlButtons = document.querySelectorAll("#rollerShutter-controls-main button, #rollerShutter-controls-manage button");
    controlButtons.forEach(b => b.disabled = true);

    try {
        console.log(`Patching shutter ${selectedRollerShutterId}: current=${currentOpening}, delta=${delta}, new=${newOpening}`);
        await fetchApi(
            `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
            "PATCH",
            { value: newOpening } 
        );
        const statusText = `Selected: ${selectedRollerShutterName} (Opening: ${newOpening}%)`;
        const statusControlEl = document.getElementById('rollerShutterStatusControl');
        const statusManageEl = document.getElementById('rollerShutterStatusManage');
        if (statusControlEl) statusControlEl.textContent = statusText;
        if (statusManageEl) statusManageEl.textContent = statusText;

        document.querySelectorAll(
            `#control-shutter-item-${selectedRollerShutterId} span.opening, #manage-shutter-item-${selectedRollerShutterId} span.opening`
        ).forEach(span => span.textContent = `Opening: ${newOpening}%`);

    } catch (err) {
        console.error("Error adjusting shutter opening:", err);
        alert("Error adjusting shutter: " + err.message);
    } finally {
        controlButtons.forEach(b => b.disabled = false);
    }
}


async function openAllShutters() {
    console.log("Attempting to open all shutters...");
    const controlButtons = document.querySelectorAll("#rollerShutter-controls-main button, #rollerShutter-controls-manage button");

    try {
        const shutters = await fetchApi("/api/entities/rollerShutter/");
        if (!Array.isArray(shutters) || shutters.length === 0) {
            alert("No shutters found to open."); return;
        }
        controlButtons.forEach(b => b.disabled = true);

        const patchPromises = shutters.map(s => {
            const delta = 100;
                console.log(`Opening shutter ${s.id} (delta: ${delta})`);
                return fetchApi(
                    `/api/entities/rollerShutter/patch/opening/${s.id}`,
                    "PATCH",
                    { value: delta }
                );
        });

        await Promise.all(patchPromises);
        console.log("Open All command sent.");
        document.querySelectorAll(
             `#rollerShutter-list-items span.opening, #manage-shutters-list span.opening`
        ).forEach(span => span.textContent = "Opening: 100%");

         const statusText = "Selected: All shutters (Opening: 100%)"; 
         const statusControlEl = document.getElementById('rollerShutterStatusControl');
         const statusManageEl = document.getElementById('rollerShutterStatusManage');
         if (statusControlEl) statusControlEl.textContent = statusText;
         if (statusManageEl) statusManageEl.textContent = statusText;


    } catch (err) {
        console.error("Error opening all shutters:", err);
        alert("Error opening all shutters: " + err.message);
    } finally {
        controlButtons.forEach(b => b.disabled = false);
    }
}


async function closeAllShutters() {
     console.log("Attempting to close all shutters...");
     const controlButtons = document.querySelectorAll("#rollerShutter-controls-main button, #rollerShutter-controls-manage button");

    try {
        const shutters = await fetchApi("/api/entities/rollerShutter/");
        if (!Array.isArray(shutters) || shutters.length === 0) {
            alert("No shutters found to close."); return;
        }

        controlButtons.forEach(b => b.disabled = true);

        const patchPromises = shutters.map(s => {
            const delta = 0; 
                 console.log(`Closing shutter ${s.id} (delta: ${delta})`);
                return fetchApi(
                    `/api/entities/rollerShutter/patch/opening/${s.id}`,
                    "PATCH",
                    { value: delta }
                );

        });
        await Promise.all(patchPromises);
         console.log("Close All command sent.");


        document.querySelectorAll(
             `#rollerShutter-list-items span.opening, #manage-shutters-list span.opening`
        ).forEach(span => span.textContent = "Opening: 0%");

         const statusText = "Selected: All shutters (Opening: 0%)";
         const statusControlEl = document.getElementById('rollerShutterStatusControl');
         const statusManageEl = document.getElementById('rollerShutterStatusManage');
         if (statusControlEl) statusControlEl.textContent = statusText;
         if (statusManageEl) statusManageEl.textContent = statusText;

    } catch (err) {
        console.error("Error closing all shutters:", err);
        alert("Error closing all shutters: " + err.message);
    } finally {
        controlButtons.forEach(b => b.disabled = false);
    }
}