// ========================================
//        js/shutters.js
// Handles loading shutters for display/control,
// selection, and control actions (+10%, -10%, Open All, Close All).
// ========================================

// Global variable to store the ID of the currently selected roller shutter for control actions.
let selectedRollerShutterId = null;
// Global variable to store the *name* of the selected shutter for display purposes.
let selectedRollerShutterName = null;


// Selects a roller shutter, updates the global state, and highlights the item.
function selectRollerShutter(id, name, opening) {
    console.log(`Selected shutter: ID=${id}, Name=${name}, Opening=${opening}%`);
    selectedRollerShutterId = id; // Store ID globally
    selectedRollerShutterName = name; // Store name globally

    // Update status bar(s) - targeting potential status elements in different sections
    const statusControlEl = document.getElementById('rollerShutterStatusControl'); // For live control section
    const statusManageEl = document.getElementById('rollerShutterStatusManage'); // For manage section
    const statusText = `Selected: ${name} (Opening: ${opening}%)`;
    if (statusControlEl) statusControlEl.textContent = statusText;
    if (statusManageEl) statusManageEl.textContent = statusText;


    // Visual highlighting (using Bootstrap 'active' class)
    // Remove 'active' from all potential shutter list items first
    document.querySelectorAll('#rollerShutter-list-items .list-group-item, #manage-shutters-list .list-group-item')
        .forEach(li => li.classList.remove('active'));

    // Add 'active' to the selected item in both lists if they exist
     const controlListItem = document.getElementById(`control-shutter-item-${id}`); // ID from loadRollerShutters
     const manageListItem = document.getElementById(`manage-shutter-item-${id}`); // ID from loadHomeShuttersForManagement
     if (controlListItem) controlListItem.classList.add('active');
     if (manageListItem) manageListItem.classList.add('active');
}


// Adjusts the opening of the currently selected roller shutter by +/- 10%.
async function adjustRollerShutterOpening(increase = true) {
    if (!selectedRollerShutterId) {
        alert("Please select a shutter first."); return;
    }

    // Determine current opening from a reliable source (e.g., the selected list item's text)
    let currentOpening = 0;
     const activeManageItem = document.querySelector('#manage-shutters-list .list-group-item.active span.opening');
     const activeControlItem = document.querySelector('#rollerShutter-list-items .list-group-item.active span.opening');
     const openingSpan = activeManageItem || activeControlItem; // Prioritize manage list if active

    if (openingSpan) {
        const match = openingSpan.textContent.match(/Opening:\s*(\d+)/);
        if (match) {
            currentOpening = parseInt(match[1], 10);
        } else {
            console.warn("Could not parse current opening from selected item:", openingSpan.textContent);
            // Fallback: attempt to read from status bar (less reliable if status bar lags)
             const statusEl = document.getElementById('rollerShutterStatusManage') || document.getElementById('rollerShutterStatusControl');
             if (statusEl) {
                const statusMatch = statusEl.textContent.match(/Opening:\s*(\d+)/);
                if (statusMatch) currentOpening = parseInt(statusMatch[1], 10);
             }
        }
    } else {
         console.warn("No active shutter item found to read current opening.");
         // Could attempt API call to get current state, or rely on potentially stale status bar
    }

    const delta = increase ? 10 : -10; // Amount to change
    let newOpening = Math.min(Math.max(currentOpening + delta, 0), 100); // Calculate new value (0-100)

    // Disable control buttons during the operation
    // Target buttons in both potential control sections
    const controlButtons = document.querySelectorAll("#rollerShutter-controls-main button, #rollerShutter-controls-manage button");
    controlButtons.forEach(b => b.disabled = true);

    try {
        // Send PATCH request to the backend with the calculated DELTA
        console.log(`Patching shutter ${selectedRollerShutterId}: current=${currentOpening}, delta=${delta}, new=${newOpening}`);
        await fetchApi(
            `/api/entities/rollerShutter/patch/opening/${selectedRollerShutterId}`,
            "PATCH",
            { value: delta } // Send only the change amount
        );

        // Update UI immediately (optimistic update)
        // Update status bar(s)
        const statusText = `Selected: ${selectedRollerShutterName} (Opening: ${newOpening}%)`;
        const statusControlEl = document.getElementById('rollerShutterStatusControl');
        const statusManageEl = document.getElementById('rollerShutterStatusManage');
        if (statusControlEl) statusControlEl.textContent = statusText;
        if (statusManageEl) statusManageEl.textContent = statusText;

        // Update the percentage in the list items for the selected shutter
        document.querySelectorAll(
            `#control-shutter-item-${selectedRollerShutterId} span.opening, #manage-shutter-item-${selectedRollerShutterId} span.opening`
        ).forEach(span => span.textContent = `Opening: ${newOpening}%`);

    } catch (err) {
        console.error("Error adjusting shutter opening:", err);
        alert("Error adjusting shutter: " + err.message);
        // Consider reverting UI changes or reloading state on error
    } finally {
        // Re-enable control buttons
        controlButtons.forEach(b => b.disabled = false);
    }
}


// Opens all roller shutters to 100%.
async function openAllShutters() {
    console.log("Attempting to open all shutters...");
    const controlButtons = document.querySelectorAll("#rollerShutter-controls-main button, #rollerShutter-controls-manage button");

    try {
        // Fetch current state of all shutters
        const shutters = await fetchApi("/api/entities/rollerShutter/");
        if (!Array.isArray(shutters) || shutters.length === 0) {
            alert("No shutters found to open."); return;
        }

        // Disable controls
        controlButtons.forEach(b => b.disabled = true);

        // Create PATCH promises for each shutter that needs opening
        const patchPromises = shutters.map(s => {
            const currentOpening = s.percentageOpening ?? s.opening ?? 0;
            const delta = 100 - currentOpening; // Calculate needed change
            if (delta > 0) { // Only patch if not already fully open
                console.log(`Opening shutter ${s.id} (delta: ${delta})`);
                return fetchApi(
                    `/api/entities/rollerShutter/patch/opening/${s.id}`,
                    "PATCH",
                    { value: delta }
                );
            } else {
                return Promise.resolve(); // Already open, do nothing
            }
        });

        // Execute all patches concurrently
        await Promise.all(patchPromises);
        console.log("Open All command sent.");

        // Update UI optimistically
        // Update all opening percentages in lists
        document.querySelectorAll(
             `#rollerShutter-list-items span.opening, #manage-shutters-list span.opening`
        ).forEach(span => span.textContent = "Opening: 100%");

        // Update status bars
         const statusText = "Selected: All shutters (Opening: 100%)"; // Updated status
         const statusControlEl = document.getElementById('rollerShutterStatusControl');
         const statusManageEl = document.getElementById('rollerShutterStatusManage');
         if (statusControlEl) statusControlEl.textContent = statusText;
         if (statusManageEl) statusManageEl.textContent = statusText;


    } catch (err) {
        console.error("Error opening all shutters:", err);
        alert("Error opening all shutters: " + err.message);
    } finally {
        // Re-enable controls
        controlButtons.forEach(b => b.disabled = false);
    }
}


// Closes all roller shutters to 0%.
async function closeAllShutters() {
     console.log("Attempting to close all shutters...");
     const controlButtons = document.querySelectorAll("#rollerShutter-controls-main button, #rollerShutter-controls-manage button");

    try {
        // Fetch current state
        const shutters = await fetchApi("/api/entities/rollerShutter/");
        if (!Array.isArray(shutters) || shutters.length === 0) {
            alert("No shutters found to close."); return;
        }

        // Disable controls
        controlButtons.forEach(b => b.disabled = true);

        // Create PATCH promises for each shutter that needs closing
        const patchPromises = shutters.map(s => {
            const currentOpening = s.percentageOpening ?? s.opening ?? 0;
            const delta = -currentOpening; // Negative delta to reach 0%
            if (delta < 0) { // Only patch if not already fully closed
                 console.log(`Closing shutter ${s.id} (delta: ${delta})`);
                return fetchApi(
                    `/api/entities/rollerShutter/patch/opening/${s.id}`,
                    "PATCH",
                    { value: delta }
                );
            } else {
                return Promise.resolve(); // Already closed
            }
        });

        // Execute all patches
        await Promise.all(patchPromises);
         console.log("Close All command sent.");


        // Update UI optimistically
         // Update all opening percentages in lists
        document.querySelectorAll(
             `#rollerShutter-list-items span.opening, #manage-shutters-list span.opening`
        ).forEach(span => span.textContent = "Opening: 0%");

        // Update status bars
         const statusText = "Selected: All shutters (Opening: 0%)"; // Updated status
         const statusControlEl = document.getElementById('rollerShutterStatusControl');
         const statusManageEl = document.getElementById('rollerShutterStatusManage');
         if (statusControlEl) statusControlEl.textContent = statusText;
         if (statusManageEl) statusManageEl.textContent = statusText;

    } catch (err) {
        console.error("Error closing all shutters:", err);
        alert("Error closing all shutters: " + err.message);
    } finally {
        // Re-enable controls
        controlButtons.forEach(b => b.disabled = false);
    }
}