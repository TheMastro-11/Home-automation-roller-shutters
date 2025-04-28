import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../utils/api'; // Assumendo api utils
import '../styles/styles.css'; // Assumendo stili CSS
import EditHomeForm from '../components/EditHomeForm';

// ----- Placeholder per Componenti Esterni (Idealmente sarebbero file separati) -----
// Esempio: const HomeManager = ({ homes, onAdd, onEdit, onDelete, onManageShutters }) => { ... };
// Esempio: const GlobalDeviceManager = ({ sensors, shutters, onAddSensor, onDeleteSensor, onEditSensor, onAddShutter, onDeleteShutter, onEditShutter }) => { ... };
// Esempio: const RoutineManager = ({ routines, sensors, shutters, onAdd, onEdit, onDelete }) => { ... };
// Esempio: const ShutterControl = ({ shutters, onSelect, onAdjust, onOpenAll, onCloseAll, selectedShutterId, selectedShutterName, selectedShutterOpening }) => { ... };
// Esempio: const EditHomeForm = ({ home, availableSensors, availableShutters, onSave, onCancel }) => { ... };
// -----------------------------------------------------------------------------------

function DashboardPage() {
    const navigate = useNavigate();

    // ----- Stati per Dati -----
    const [homes, setHomes] = useState([]);
    const [globalSensors, setGlobalSensors] = useState([]);
    const [globalShutters, setGlobalShutters] = useState([]);
    const [routines, setRoutines] = useState([]);

    // ----- Stati per UI -----
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('dashboard'); // 'dashboard', 'editHome', 'manageShutters'
    const [editingHome, setEditingHome] = useState(null); // Oggetto home da modificare
    const [managingShuttersHome, setManagingShuttersHome] = useState(null); // Oggetto home per cui gestire le tapparelle
    const [showRoutineForm, setShowRoutineForm] = useState(false);
    // Aggiungere stati per input form se non si usano componenti controllati separati
    const [newHomeName, setNewHomeName] = useState('');
    const [newGlobalSensorName, setNewGlobalSensorName] = useState('');
    const [newGlobalShutterName, setNewGlobalShutterName] = useState('');
    // Stati per controllo tapparelle
    const [selectedShutterId, setSelectedShutterId] = useState(null);
    const [selectedShutterName, setSelectedShutterName] = useState('');
    const [selectedShutterOpening, setSelectedShutterOpening] = useState(0);
    // Stati per modifica inline (esempio)
    const [editingDeviceId, setEditingDeviceId] = useState(null); // ID del sensore/tapparella globale in modifica
    const [editingDeviceName, setEditingDeviceName] = useState(''); // Nome temporaneo durante la modifica

    // ----- Funzioni di Caricamento Dati -----
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [homesData, sensorsData, shuttersData, routinesData] = await Promise.all([
                fetchApi('/api/entities/home/'), //
                fetchApi('/api/entities/lightSensor/'), //
                fetchApi('/api/entities/rollerShutter/'), //
                fetchApi('/api/entities/routine/') //
            ]);
            setHomes(homesData || []);
            setGlobalSensors(sensorsData || []);
            setGlobalShutters(shuttersData || []);
            setRoutines(routinesData || []);
            // Reset selezione tapparelle se la lista cambia
            setSelectedShutterId(null);
            setSelectedShutterName('');
            setSelectedShutterOpening(0);
        } catch (err) {
            console.error("Errore caricamento dati dashboard:", err);
            setError(`Errore caricamento dati: ${err.message}`);
            if (err.status === 401 || err.status === 403) { //
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]); // navigate incluso per handleLogout

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ----- Funzioni Gestione Case -----
    const handleAddHome = async (e) => {
        e.preventDefault();
        if (!newHomeName.trim()) {
            alert("Inserisci un nome per la casa."); return;
        }
        try {
            await fetchApi("/api/entities/home/create", "POST", { name: newHomeName.trim() }); //
            setNewHomeName(''); // Pulisci input
            await loadData(); // Ricarica tutto
            alert("Casa aggiunta!");
        } catch (err) {
            console.error("Errore aggiunta casa:", err);
            alert(`Errore aggiunta casa: ${err.message}`);
        }
    };

    const handleDeleteHome = async (homeId) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa casa? Controlla dispositivi e routine associati.")) return; //
        try {
            await fetchApi(`/api/entities/home/delete/${homeId}`, "DELETE"); //
            await loadData(); // Ricarica tutto
            alert("Casa eliminata!");
            // Se la casa eliminata era in modifica, torna alla dashboard
            if (editingHome?.id === homeId) {
                handleCancelEditHome();
            }
            // Se stavi gestendo le tapparelle di quella casa, torna alla dashboard
             if (managingShuttersHome?.id === homeId) {
                handleHideShuttersForHome();
            }
        } catch (err) {
            console.error("Errore eliminazione casa:", err);
            alert(`Errore eliminazione casa: ${err.message}`);
        }
    };

    const handleShowEditHome = async (homeId) => {
        setLoading(true);
        try {
            // Potrebbe essere necessario caricare di nuovo sensori/tapparelle disponibili qui
            // o passarli se già nello stato globale
            const homeToEdit = homes.find(h => h.id === homeId);
            if (homeToEdit) {
                setEditingHome(homeToEdit);
                setView('editHome');
            } else {
                throw new Error("Casa non trovata");
            }
        } catch (err) {
            setError("Impossibile caricare i dettagli della casa per la modifica.");
            console.error("Errore preparazione modifica casa:", err)
        } finally {
            setLoading(false);
        }
    };

     const handleCancelEditHome = () => {
        setEditingHome(null);
        setView('dashboard');
         // Potrebbe essere necessario ricaricare i dati se le dipendenze (sensori/tapparelle disponibili) non sono globali
         // loadData(); // Opzionale
    };

    // La funzione handleSaveHome richiederebbe la logica di submitEditHome da dashboard.js
    // Gestirebbe le chiamate PATCH per nome, sensore, tapparelle
    const handleSaveHome = async (formData) => { // formData dovrebbe contenere {id, name, selectedSensorName, selectedShutterNames}
        setLoading(true);
        const { id, name, selectedSensorName, selectedShutterNames } = formData;
        const originalHome = homes.find(h => h.id === id);
        if (!originalHome) {
             alert("Errore: Casa originale non trovata.");
             setLoading(false);
             return;
        }

        const originalSensorName = originalHome.lightSensor?.name || 'NONE';
        const originalShutterNames = (originalHome.rollerShutters || []).map(rs => rs.name).sort();

        const apiCalls = [];

         // 1. Patch Nome se cambiato
        if (name !== originalHome.name) {
            apiCalls.push(fetchApi(`/api/entities/home/patch/name/${id}`, "PATCH", { name })); //
        }

         // 2. Patch Sensore se cambiato
        if (selectedSensorName !== originalSensorName) {
            const sensorPayload = selectedSensorName === 'NONE' ? null : { lightSensor: { name: selectedSensorName } };
             apiCalls.push(fetchApi(`/api/entities/home/patch/lightSensor/${id}`, "PATCH", { lightSensor: sensorPayload })); //
        }

         // 3. Patch Tapparelle se cambiate
        const sortedNewShutterNames = [...selectedShutterNames].sort();
        if (JSON.stringify(sortedNewShutterNames) !== JSON.stringify(originalShutterNames)) {
            const shuttersPayload = { rollerShutters: sortedNewShutterNames.map(n => ({ name: n })) };
            apiCalls.push(fetchApi(`/api/entities/home/patch/rollerShutters/${id}`, "PATCH", shuttersPayload)); //
        }


        if (apiCalls.length === 0) {
            alert("Nessuna modifica rilevata.");
            setLoading(false);
            handleCancelEditHome(); // Chiudi comunque il form
            return;
        }

        try {
            await Promise.all(apiCalls);
            alert("Dettagli casa aggiornati!");
            await loadData(); // Ricarica tutto
            handleCancelEditHome(); // Torna alla dashboard
        } catch (error) {
            console.error("Errore aggiornamento casa:", error);
            alert(`Errore aggiornamento casa: ${error.message}`);
            setError(`Errore aggiornamento casa: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    const handleShowManageShutters = (homeId) => {
         const home = homes.find(h => h.id === homeId);
         if (home) {
             setManagingShuttersHome(home);
             setView('manageShutters');
              // Resetta selezione tapparella quando si cambia vista
             setSelectedShutterId(null);
             setSelectedShutterName('');
             setSelectedShutterOpening(0);
         } else {
             setError("Casa non trovata per gestire le tapparelle.");
         }
    };

    const handleHideShuttersForHome = () => {
         setManagingShuttersHome(null);
         setView('dashboard');
         setSelectedShutterId(null); // Resetta selezione
         setSelectedShutterName('');
         setSelectedShutterOpening(0);
    };


    // ----- Funzioni Gestione Dispositivi Globali -----
    const handleAddGlobalSensor = async (e) => {
        e.preventDefault();
        if (!newGlobalSensorName.trim()) { alert("Inserisci nome sensore."); return; }
        try {
            await fetchApi('/api/entities/lightSensor/create', 'POST', { name: newGlobalSensorName.trim() }); //
            setNewGlobalSensorName('');
            await loadData(); // Ricarica
            alert("Sensore globale aggiunto!");
        } catch (err) {
             console.error("Errore aggiunta sensore globale:", err);
            alert(`Errore aggiunta sensore globale: ${err.message}`);
        }
    };

     const handleDeleteGlobalSensor = async (sensorId) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo sensore globale?")) return; //
        try {
            await fetchApi(`/api/entities/lightSensor/delete/${sensorId}`, 'DELETE'); //
            await loadData();
            alert("Sensore globale eliminato!");
        } catch (err) {
             console.error("Errore eliminazione sensore globale:", err);
            alert(`Errore eliminazione sensore globale: ${err.message}`);
        }
    };

    // --- Funzioni per Modifica Inline Dispositivi Globali ---
     const startEditingDevice = (id, name, type) => {
        setEditingDeviceId({ id, type }); // Salva id e tipo (sensor/shutter)
        setEditingDeviceName(name);
    };

    const cancelEditingDevice = () => {
        setEditingDeviceId(null);
        setEditingDeviceName('');
    };

    const saveDeviceName = async () => {
        if (!editingDeviceId || !editingDeviceName.trim()) {
            alert("Nome non valido.");
            return;
        }
        const { id, type } = editingDeviceId;
        const apiPath = type === 'sensor'
            ? `/api/entities/lightSensor/patch/name/${id}`
            : `/api/entities/rollerShutter/patch/name/${id}`; //

        setLoading(true); // Mostra indicatore di caricamento se necessario
        try {
            await fetchApi(apiPath, 'PATCH', { name: editingDeviceName.trim() }); //
            cancelEditingDevice(); // Esci dalla modalità modifica
            await loadData(); // Ricarica i dati aggiornati
            alert("Nome aggiornato con successo!");
        } catch (err) {
             console.error(`Errore aggiornamento nome ${type}:`, err);
            alert(`Errore aggiornamento nome: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    // -----------------------------------------------------

    const handleAddGlobalShutter = async (e) => {
         e.preventDefault();
        if (!newGlobalShutterName.trim()) { alert("Inserisci nome tapparella."); return; }
        try {
            await fetchApi('/api/entities/rollerShutter/create', 'POST', { name: newGlobalShutterName.trim() }); //
            setNewGlobalShutterName('');
            await loadData();
            alert("Tapparella globale aggiunta!");
        } catch (err) {
             console.error("Errore aggiunta tapparella globale:", err);
            alert(`Errore aggiunta tapparella globale: ${err.message}`);
        }
    };

     const handleDeleteGlobalShutter = async (shutterId) => {
         if (!window.confirm("Sei sicuro di voler eliminare questa tapparella globale?")) return; //
        try {
            await fetchApi(`/api/entities/rollerShutter/delete/${shutterId}`, 'DELETE'); //
             // Se la tapparella eliminata era quella selezionata per il controllo, deselezionala
            if (selectedShutterId === shutterId) {
                setSelectedShutterId(null);
                setSelectedShutterName('');
                setSelectedShutterOpening(0);
            }
            await loadData();
            alert("Tapparella globale eliminata!");
        } catch (err) {
             console.error("Errore eliminazione tapparella globale:", err);
            alert(`Errore eliminazione tapparella globale: ${err.message}`);
        }
    };

    // ----- Funzioni Gestione Routine -----
    // Implementare handleAddRoutine, handleEditRoutine (se necessaria), handleDeleteRoutine
    // basate su routines.js
    const handleToggleRoutineForm = () => {
        setShowRoutineForm(!showRoutineForm);
        // Resettare lo stato del form routine se necessario
    };

    // handleSaveRoutine verrebbe chiamata dal componente RoutineForm
    // con i dati del form, simile a saveRoutines in routines.js
    const handleSaveRoutine = async (routineData) => {
         setLoading(true);
         // Logica adattata da saveRoutines per determinare apiPath e payload
         const { name, triggerType, actionType, selectedPercentage, targetShutters, /* altri campi */ } = routineData;
         let apiPath, data = { name, rollerShutters: targetShutters.map(name => ({name})), /*...*/ }; // Payload parziale

         // ... (logica completa per costruire 'data' e determinare 'apiPath') ...

        try {
            // await fetchApi(apiPath, 'POST', data);
            alert(`Routine "${name}" salvata!`); // Simulata
            setShowRoutineForm(false);
            await loadData();
        } catch (err) {
             console.error("Errore salvataggio routine:", err);
             alert(`Errore salvataggio routine: ${err.message}`);
         } finally {
             setLoading(false);
         }
    };


     const handleDeleteRoutine = async (routineId) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa routine?")) return; //
         try {
             await fetchApi(`/api/entities/routine/delete/${routineId}`, 'DELETE'); //
             await loadData();
             alert("Routine eliminata!");
         } catch (err) {
             console.error("Errore eliminazione routine:", err);
             alert(`Errore eliminazione routine: ${err.message}`);
         }
    };

    // ----- Funzioni Controllo Tapparelle -----
    const handleSelectShutter = (id, name, opening) => {
        setSelectedShutterId(id);
        setSelectedShutterName(name);
        setSelectedShutterOpening(opening);
         // Logica aggiuntiva da selectRollerShutter se necessaria
    };

    const handleAdjustShutter = async (increase) => {
        if (!selectedShutterId) { alert("Seleziona una tapparella."); return; }
        const delta = increase ? 10 : -10; //
        const currentOpening = selectedShutterOpening; // Usa lo stato
        let newOpening = Math.min(Math.max(currentOpening + delta, 0), 100); //

        setLoading(true); // Potrebbe essere utile disabilitare i bottoni
        try {
            await fetchApi(`/api/entities/rollerShutter/patch/opening/${selectedShutterId}`, "PATCH", { value: delta }); //
             // Aggiorna stato locale DOPO successo API per riflettere il nuovo stato
             // Potremmo dover ri-ottenere il valore esatto dall'API o fidarci del calcolo
             // Per ora, usiamo il valore calcolato
             setSelectedShutterOpening(newOpening);
             // Aggiorna anche nella lista globale (potrebbe richiedere un refresh o modifica diretta)
             setGlobalShutters(prevShutters => prevShutters.map(s =>
                s.id === selectedShutterId ? { ...s, percentageOpening: newOpening } : s
             ));
             // Aggiorna anche nelle tapparelle della casa gestita (se applicabile)
             // Questo è più complesso senza componenti separati

        } catch (err) {
            console.error("Errore aggiustamento tapparella:", err);
            alert(`Errore aggiustamento tapparella: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

     const handleOpenAllShutters = async () => {
         if (!window.confirm("Aprire tutte le tapparelle?")) return;
         setLoading(true);
         try {
            // L'API potrebbe non avere un endpoint "open all", quindi potremmo dover iterare
            // o usare un endpoint specifico se esiste.
            // Simulazione: assumiamo che l'endpoint gestisca il delta per tutte
             // La logica di shutters.js iterava e calcolava il delta per ognuna
             const patchPromises = globalShutters.map(s => {
                 const delta = 100 - (s.percentageOpening ?? 0);
                 return delta > 0 ? fetchApi(`/api/entities/rollerShutter/patch/opening/${s.id}`, "PATCH", { value: delta }) : Promise.resolve();
             });
             await Promise.all(patchPromises);
             await loadData(); // Ricarica per vedere lo stato aggiornato
             alert("Tutte le tapparelle aperte!");
         } catch (err) {
             console.error("Errore apertura tutte tapparelle:", err);
             alert(`Errore apertura tutte tapparelle: ${err.message}`);
         } finally {
             setLoading(false);
         }
     };

     const handleCloseAllShutters = async () => {
         if (!window.confirm("Chiudere tutte le tapparelle?")) return;
         setLoading(true);
         try {
             // Simile a open all, iteriamo
             const patchPromises = globalShutters.map(s => {
                 const delta = -(s.percentageOpening ?? 0);
                 return delta < 0 ? fetchApi(`/api/entities/rollerShutter/patch/opening/${s.id}`, "PATCH", { value: delta }) : Promise.resolve();
            });
             await Promise.all(patchPromises);
             await loadData();
             alert("Tutte le tapparelle chiuse!");
         } catch (err) {
             console.error("Errore chiusura tutte tapparelle:", err);
             alert(`Errore chiusura tutte tapparelle: ${err.message}`);
         } finally {
            setLoading(false);
         }
     };

    // ----- Funzione di Logout -----
    const handleLogout = () => {
        localStorage.removeItem('jwt'); //
        navigate('/login'); //
    };

    // ----- Rendering Condizionale -----
    if (loading && !editingHome && view === 'dashboard') { // Mostra spinner solo al caricamento iniziale o refresh
        return <div className="spinner">Caricamento...</div>; // for spinner class
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>; // for alert classes
    }

    // ----- Viste Diverse -----

    // --- Vista Modifica Casa ---
    if (view === 'editHome' && editingHome) {
        // Qui andrebbe il componente EditHomeForm
        // Passando editingHome, globalSensors, globalShutters, handleSaveHome, handleCancelEditHome
         // Placeholder:
        return (
          <div className="container py-4">
          <button onClick={handleCancelEditHome} className="btn btn-secondary btn-sm mb-3">Annulla / Torna alla Dashboard</button>
          <h4>Modifica Dettagli Casa – {editingHome.name}</h4>
  
          {/* ---> USA IL COMPONENTE QUI <--- */}
          <EditHomeForm
              home={editingHome}
              availableSensors={globalSensors} // Passa i sensori globali
              availableShutters={globalShutters} // Passa le tapparelle globali
              onSave={handleSaveHome} // Passa la funzione per salvare
              onCancel={handleCancelEditHome} // Passa la funzione per annullare
              isLoading={loading} // Passa lo stato di caricamento
          />
           {/* Rimuovi i placeholder <p> precedenti se non servono più */}
           {/* <p>Sensori disponibili: {globalSensors.length}</p> */}
           {/* <p>Tapparelle disponibili: {globalShutters.length}</p> */}
       </div>
        );
    }

    // --- Vista Gestione Tapparelle per Casa ---
     if (view === 'manageShutters' && managingShuttersHome) {
         const associatedShutters = globalShutters.filter(s =>
             (managingShuttersHome.rollerShutters || []).some(rsHome => rsHome.name === s.name)
         );
         // Placeholder:
        return (
             <div className="container py-4">
                <button onClick={handleHideShuttersForHome} className="btn btn-secondary btn-sm mb-3">Torna alle Case</button>
                <h4>Gestisci Tapparelle per: {managingShuttersHome.name}</h4>

                 {/* Lista Tapparelle Associate */}
                 <ul className="list-group mb-3">
                     {associatedShutters.length > 0 ? associatedShutters.map(shutter => (
                         <li key={shutter.id}
                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedShutterId === shutter.id ? 'active' : ''}`} //
                            onClick={() => handleSelectShutter(shutter.id, shutter.name, shutter.percentageOpening ?? 0)}
                            style={{ cursor: 'pointer' }}
                         >
                            <span>{shutter.name}</span>
                             <span className="opening ms-auto me-2">Apertura: {shutter.percentageOpening ?? 0}%</span> {/* */}
                             {/* Bottone Modifica Nome (Potrebbe essere un'icona) */}
                             <button
                                 className="btn btn-warning btn-sm"
                                 onClick={(e) => {
                                     e.stopPropagation(); // Evita che il click selezioni la riga
                                     startEditingDevice(shutter.id, shutter.name, 'shutter');
                                 }}
                             >
                                 Modifica Nome
                             </button>
                         </li>
                    )) : <li className="list-group-item">Nessuna tapparella associata.</li>}
                 </ul>

                 {/* Controlli Tapparelle */}
                 {selectedShutterId && (
                    <div className='mb-3'>
                        <p><strong>Selezionata: {selectedShutterName} (Apertura: {selectedShutterOpening}%)</strong></p>
                         <div className="btn-group btn-group-sm"> {/* */}
                             <button className="btn btn-success" onClick={() => handleAdjustShutter(true)} disabled={loading}>+10%</button> {/* */}
                             <button className="btn btn-danger" onClick={() => handleAdjustShutter(false)} disabled={loading}>-10%</button> {/* */}
                         </div>
                    </div>
                 )}

                 {/* Controlli Globali (Opzionale in questa vista) */}
                 {/* <div className="btn-group btn-group-sm">
                     <button className="btn btn-success" onClick={handleOpenAllShutters} disabled={loading}>Apri Tutte (Associate)</button>
                     <button className="btn btn-secondary" onClick={handleCloseAllShutters} disabled={loading}>Chiudi Tutte (Associate)</button>
                 </div> */}

                 {/* Form Modifica Nome Inline (mostrato condizionalmente) */}
                 {editingDeviceId?.type === 'shutter' && editingDeviceId.id === selectedShutterId && (
                     <div className="border p-3 rounded mt-3">
                         <h6>Modifica Nome Tapparella</h6>
                         <input
                             type="text"
                             className="form-control form-control-sm mb-2"
                             value={editingDeviceName}
                             onChange={(e) => setEditingDeviceName(e.target.value)}
                         />
                         <button onClick={saveDeviceName} className="btn btn-primary btn-sm me-2" disabled={loading}>Salva</button>
                         <button onClick={cancelEditingDevice} className="btn btn-secondary btn-sm" disabled={loading}>Annulla</button>
                     </div>
                 )}
             </div>
        );
    }


    // --- Vista Dashboard Principale ---
    return (
        <div className="container py-4"> {/* */}
            <div className="text-end mb-3"> {/* */}
                <button id="logoutBtn" className="btn btn-danger" onClick={handleLogout}>Logout</button> {/* */}
            </div>

            <h2 className="mb-4 text-center">Dashboard</h2> {/* */}

            {/* ----- Sezione Gestione Case ----- */}
            <section id="manage-homes-section" className="mb-5"> {/* */}
                <h4>Gestisci Case</h4>
                 {/* Lista Case */}
                 <ul id="manage-homes-list" className="list-group mb-3"> {/* */}
                     {homes.length > 0 ? homes.map(home => (
                         <li key={home.id} id={`home-item-${home.id}`} className="list-group-item d-flex justify-content-between align-items-center flex-wrap"> {/* */}
                             <span className="me-auto">{home.name}</span>
                             <div className="btn-group btn-group-sm"> {/* */}
                                 <button className="btn btn-warning" onClick={() => handleShowEditHome(home.id)} disabled={loading}>
                                     Modifica Dettagli
                                 </button> {/* */}
                                 <button className="btn btn-danger" onClick={() => handleDeleteHome(home.id)} disabled={loading}>
                                     Elimina Casa
                                </button> {/* */}
                                <button className="btn btn-primary" onClick={() => handleShowManageShutters(home.id)} disabled={loading}>
                                     Gestisci Tapparelle
                                 </button> {/* */}
                             </div>
                         </li>
                    )) : <li className="list-group-item">Nessuna casa trovata.</li>}
                 </ul>
                 {/* Form Aggiungi Casa */}
                 <form id="add-home-form" className="input-group input-group-sm mb-3" onSubmit={handleAddHome}> {/* */}
                    <input
                        type="text"
                        id="newHomeName"
                        className="form-control"
                        placeholder="Nuova Casa"
                        value={newHomeName}
                        onChange={(e) => setNewHomeName(e.target.value)}
                        required
                    /> {/* */}
                    <button className="btn btn-outline-success" type="submit" disabled={loading}>+ Aggiungi</button> {/* */}
                </form>
            </section>

            {/* ----- Sezione Dispositivi Globali ----- */}
            <section id="global-devices-section" className="row mb-5"> {/* */}
                {/* Sensori Globali */}
                <div className="col-md-6">
                    <h6>Gestisci Sensori Globali</h6>
                    <ul id="global-sensors-list" className="list-group mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}> {/* */}
                        {globalSensors.length > 0 ? globalSensors.map(sensor => (
                             <li key={sensor.id} className="list-group-item d-flex justify-content-between align-items-center"> {/* */}
                                 {editingDeviceId?.id === sensor.id && editingDeviceId?.type === 'sensor' ? (
                                    // --- Modalità Modifica Inline ---
                                    <>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm me-2"
                                            value={editingDeviceName}
                                            onChange={(e) => setEditingDeviceName(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="btn-group btn-group-sm">
                                            <button onClick={saveDeviceName} className="btn btn-success" disabled={loading}>✓</button>
                                            <button onClick={cancelEditingDevice} className="btn btn-secondary" disabled={loading}>✕</button>
                                        </div>
                                    </>
                                 ) : (
                                    // --- Modalità Visualizzazione ---
                                    <>
                                        <span>{sensor.name || `Sensor ID: ${sensor.id}`}</span>
                                        <div className="btn-group btn-group-sm">
                                             <button className="btn btn-warning" onClick={() => startEditingDevice(sensor.id, sensor.name, 'sensor')} disabled={loading}>✎</button> {/* */}
                                             <button className="btn btn-danger" onClick={() => handleDeleteGlobalSensor(sensor.id)} disabled={loading}>🗑</button> {/* */}
                                        </div>
                                    </>
                                )}
                             </li>
                         )) : <li className="list-group-item">Nessun sensore globale definito.</li>}
                     </ul>
                     {/* Form Aggiungi Sensore Globale */}
                     <form id="global-add-sensor-form" className="input-group input-group-sm" onSubmit={handleAddGlobalSensor}> {/* */}
                        <input
                             type="text"
                             id="global-newSensorName"
                             className="form-control"
                             placeholder="Nuovo Sensore"
                             value={newGlobalSensorName}
                             onChange={(e) => setNewGlobalSensorName(e.target.value)}
                             required
                        /> {/* */}
                        <button className="btn btn-outline-primary" type="submit" disabled={loading}>+ Aggiungi Sensore</button> {/* */}
                    </form>
                </div>
                 {/* Tapparelle Globali */}
                 <div className="col-md-6">
                    <h6>Gestisci Tapparelle Globali</h6>
                    <ul id="global-shutters-list" className="list-group mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}> {/* */}
                         {globalShutters.length > 0 ? globalShutters.map(shutter => (
                            <li key={shutter.id} className="list-group-item d-flex justify-content-between align-items-center"> {/* */}
                                {editingDeviceId?.id === shutter.id && editingDeviceId?.type === 'shutter' ? (
                                    // --- Modalità Modifica Inline ---
                                    <>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm me-2"
                                            value={editingDeviceName}
                                            onChange={(e) => setEditingDeviceName(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="btn-group btn-group-sm">
                                            <button onClick={saveDeviceName} className="btn btn-success" disabled={loading}>✓</button>
                                            <button onClick={cancelEditingDevice} className="btn btn-secondary" disabled={loading}>✕</button>
                                        </div>
                                    </>
                                ) : (
                                     // --- Modalità Visualizzazione ---
                                    <>
                                        <span>{shutter.name || `Shutter ID: ${shutter.id}`} ({shutter.percentageOpening ?? 0}%)</span>
                                        <div className="btn-group btn-group-sm">
                                             <button className="btn btn-warning" onClick={() => startEditingDevice(shutter.id, shutter.name, 'shutter')} disabled={loading}>✎</button> {/* */}
                                             <button className="btn btn-danger" onClick={() => handleDeleteGlobalShutter(shutter.id)} disabled={loading}>🗑</button> {/* */}
                                         </div>
                                    </>
                                )}
                            </li>
                         )) : <li className="list-group-item">Nessuna tapparella globale definita.</li>}
                     </ul>
                    {/* Form Aggiungi Tapparella Globale */}
                    <form id="global-add-shutter-form" className="input-group input-group-sm" onSubmit={handleAddGlobalShutter}> {/* */}
                        <input
                            type="text"
                            id="global-newShutterName"
                            className="form-control"
                            placeholder="Nuova Tapparella"
                            value={newGlobalShutterName}
                            onChange={(e) => setNewGlobalShutterName(e.target.value)}
                            required
                         /> {/* */}
                         <button className="btn btn-outline-primary" type="submit" disabled={loading}>+ Aggiungi Tapparella</button> {/* */}
                     </form>
                </div>
            </section>

            {/* ----- Sezione Controllo Tapparelle (Globale) ----- */}
            {/* Questa sezione potrebbe essere opzionale se il controllo avviene solo in 'Gestisci Tapparelle' */}
            <section id="shutters-status" className="mb-5"> {/* */}
                 <h5>Controllo Tapparelle (Generale)</h5>
                 {/* Lista selezionabile Tapparelle */}
                 <ul id="rollerShutter-list-items" className="list-group mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}> {/* */}
                    {globalShutters.map(shutter => (
                        <li
                            key={shutter.id}
                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedShutterId === shutter.id ? 'active' : ''}`} //
                            onClick={() => handleSelectShutter(shutter.id, shutter.name, shutter.percentageOpening ?? 0)}
                            style={{cursor: 'pointer'}}
                         >
                            <span>{shutter.name}</span>
                             <span className="opening ms-auto me-2">Apertura: {shutter.percentageOpening ?? 0}%</span> {/* */}
                         </li>
                    ))}
                 </ul>
                {/* Stato e Controlli */}
                <p id="rollerShutterStatusControl" className="text-muted"> {/* */}
                    {selectedShutterId
                        ? `Selezionata: ${selectedShutterName} (Apertura: ${selectedShutterOpening}%)`
                        : "Seleziona una tapparella dalla lista..."}
                 </p>
                 <div id="rollerShutter-controls-main" className="btn-group btn-group-sm"> {/* */}
                     <button className="btn btn-success" onClick={() => handleAdjustShutter(true)} disabled={!selectedShutterId || loading}>+10%</button> {/* */}
                     <button className="btn btn-danger" onClick={() => handleAdjustShutter(false)} disabled={!selectedShutterId || loading}>-10%</button> {/* */}
                     <button className="btn btn-success" onClick={handleOpenAllShutters} disabled={loading}>Apri Tutte</button> {/* */}
                     <button className="btn btn-secondary" onClick={handleCloseAllShutters} disabled={loading}>Chiudi Tutte</button> {/* */}
                 </div>
            </section>


            {/* ----- Sezione Routine ----- */}
            <section id="Routines-section" className="mb-5"> {/* */}
                <div className="d-flex justify-content-between align-items-center mb-2"> {/* */}
                    <h5>Routine</h5>
                    <button className="btn btn-sm btn-success" onClick={handleToggleRoutineForm}> {/* */}
                        {showRoutineForm ? 'Annulla' : '+ Aggiungi'}
                    </button>
                </div>

                 {/* Form Aggiungi/Modifica Routine (mostrato condizionalmente) */}
                {showRoutineForm && (
                    // Qui andrebbe il componente RoutineForm
                    // Passando sensori, tapparelle, handleSaveRoutine, handleToggleRoutineForm
                    <div id="Routines-form" className="border p-3 rounded"> {/* */}
                         <h6>Crea/Modifica Routine</h6>
                         {/* <RoutineForm
                            sensors={globalSensors}
                            shutters={globalShutters}
                            onSave={handleSaveRoutine} // Questa funzione riceverà i dati dal form
                            onCancel={handleToggleRoutineForm}
                            isLoading={loading}
                         /> */}
                        <p>(Componente RoutineForm da implementare qui)</p>
                     </div>
                 )}

                {/* Lista Routine */}
                <ul id="Routines-list" className="list-group mb-3"> {/* */}
                    {routines.length > 0 ? routines.map(routine => {
                        // Logica per visualizzare triggerInfo e actionInfo da routines.js
                        let triggerInfo = 'N/A';
                         if (routine.actionTime) { // Gestisce sia oggetto che stringa (semplificato)
                             const timeStr = typeof routine.actionTime === 'string'
                                 ? routine.actionTime.slice(0, 5)
                                : `${String(routine.actionTime.hour).padStart(2, '0')}:${String(routine.actionTime.minute).padStart(2, '0')}`;
                            triggerInfo = `Ora: ${timeStr}`;
                         } else if (routine.lightSensor && routine.lightValue) {
                             const condition = routine.lightValue.method === true ? 'Sopra' : 'Sotto';
                             triggerInfo = `Luminosità: ${routine.lightSensor.name} ${condition} ${routine.lightValue.value}%`;
                         }
                         const actionInfo = `Imposta a ${routine.rollerShutterValue}%`;
                         const targetNames = (routine.rollerShutters || []).map(rs => rs.name).join(', ') || 'Nessuna tapparella target';

                         return (
                             <li key={routine.id} id={`Routines-item-${routine.id}`} className="list-group-item d-flex justify-content-between align-items-center flex-wrap"> {/* */}
                                 <div>
                                     <strong className="routine-name me-2">{routine.name || 'Routine senza nome'}</strong> {/* */}
                                     <small className="text-muted d-block" style={{color: 'white !important'}}> {/* Stile inline per sovrascrivere se necessario */}
                                         Trigger: {triggerInfo} | Azione: {actionInfo} | Target: {targetNames}
                                     </small> {/* */}
                                 </div>
                                 <div className="btn-group btn-group-sm mt-1 mt-sm-0"> {/* */}
                                     {/* Bottone Modifica - Potrebbe aprire il form RoutineForm precompilato */}
                                     {/* <button className="btn btn-warning" onClick={() => handleEditRoutine(routine.id)} disabled={loading}>Modifica</button> */}
                                     <button className="btn btn-danger" onClick={() => handleDeleteRoutine(routine.id)} disabled={loading}>Elimina</button> {/* */}
                                 </div>
                             </li>
                        );
                     }) : <li className="list-group-item list-group-item-placeholder">Nessuna routine trovata.</li>} {/* */}
                 </ul>
            </section>

             {/* Altre sezioni da dashboard.html (es. Sensor Status) potrebbero essere aggiunte qui */}
             {/* Esempio: Stato Sensori (potrebbe mostrare il sensore della casa selezionata o tutti) */}
             {/* <section id="sensor-status" className="mb-5">
                 <h5>Stato Sensori Luce</h5>
                 <ul id="light-sensors-list" className="list-group">
                     {globalSensors.map(sensor => (
                         <li key={sensor.id} className="list-group-item">
                             <strong>{sensor.name}</strong>: {sensor.currentValue ?? 'N/D'}%
                         </li>
                     ))}
                 </ul>
             </section> */}

        </div>
    );
}

export default DashboardPage;