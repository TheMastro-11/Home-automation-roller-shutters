import React, { useState, useEffect } from 'react';

// Componente EditHomeForm
function EditHomeForm({ home, availableSensors, availableShutters, onSave, onCancel, isLoading }) {
    // Stato interno per i dati del form
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        selectedSensorName: 'NONE', // Inizializza a 'NONE'
        selectedShutterNames: [],   // Array di nomi delle tapparelle selezionate
    });

    // Effetto per inizializzare lo stato del form quando la prop 'home' cambia
    useEffect(() => {
        if (home) {
            const initialShutterNames = (home.rollerShutters || []).map(rs => rs.name).filter(Boolean);
            setFormData({
                id: home.id,
                name: home.name || '',
                selectedSensorName: home.lightSensor?.name || 'NONE', // Usa 'NONE' se non c'è sensore
                selectedShutterNames: initialShutterNames,
            });
        }
        // Reset se non c'è una casa da modificare (anche se non dovrebbe succedere con la logica attuale)
        else {
             setFormData({ id: '', name: '', selectedSensorName: 'NONE', selectedShutterNames: [] });
        }
    }, [home]); // Dipende solo da 'home'

    // Gestore per il cambio nome
    const handleNameChange = (e) => {
        setFormData(prevData => ({ ...prevData, name: e.target.value }));
    };

    // Gestore per il cambio sensore selezionato
    const handleSensorChange = (e) => {
        setFormData(prevData => ({ ...prevData, selectedSensorName: e.target.value }));
    };

    // Gestore per il cambio selezione tapparelle (checkbox)
    const handleShutterChange = (e) => {
        const shutterName = e.target.value;
        const isChecked = e.target.checked;

        setFormData(prevData => {
            const currentSelection = prevData.selectedShutterNames;
            let newSelection;
            if (isChecked) {
                // Aggiungi se non già presente
                newSelection = currentSelection.includes(shutterName) ? currentSelection : [...currentSelection, shutterName];
            } else {
                // Rimuovi
                newSelection = currentSelection.filter(name => name !== shutterName);
            }
            return { ...prevData, selectedShutterNames: newSelection };
        });
    };

    // Gestore per l'invio del form
    const handleSubmit = (e) => {
        e.preventDefault(); // Previene il ricaricamento della pagina
        if (!formData.name.trim()) {
            alert("Il nome della casa non può essere vuoto.");
            return;
        }
        // Chiama la funzione onSave passata dal genitore con i dati attuali del form
        onSave(formData);
    };

    return (
        // Aggiungere la classe 'loading-overlay' o simile se isLoading è true per feedback visivo
        <form onSubmit={handleSubmit} className={isLoading ? 'form-loading' : ''}>
            {/* Campo Hidden per ID (anche se già nello stato, può essere utile per debug) */}
            <input type="hidden" value={formData.id} readOnly />

            {/* Campo Nome Casa */}
            <div className="mb-3">
                <label htmlFor={`editHomeName-${formData.id}`} className="form-label">Nome Casa</label> {/* */}
                <input
                    type="text"
                    className="form-control"
                    id={`editHomeName-${formData.id}`}
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    disabled={isLoading} // Disabilita durante il caricamento
                /> {/* */}
            </div>

            {/* Selezione Sensore Associato */}
            <div className="mt-3">
                <label htmlFor={`editHomeSensorSelect-${formData.id}`} className="form-label">Sensore Luce Associato:</label> {/* */}
                <select
                    id={`editHomeSensorSelect-${formData.id}`}
                    className="form-select form-select-sm"
                    value={formData.selectedSensorName}
                    onChange={handleSensorChange}
                    disabled={isLoading}
                > {/* */}
                     {/* Opzione per nessun sensore */}
                     <option value="NONE">-- Nessuno --</option> {/* */}
                     {/* Mappa i sensori disponibili */}
                     {availableSensors && availableSensors.map(sensor => (
                        <option key={sensor.id} value={sensor.name}>
                            {sensor.name}
                        </option>
                    ))}
                 </select>
            </div>

            {/* Selezione Tapparelle Associate */}
            <div className="mt-3">
                <label className="form-label">Tapparelle Associate:</label> {/* */}
                <div id={`editHomeShuttersList-${formData.id}`} className="dynamic-list-container p-2 border rounded"> {/* Usa classe CSS per stile/scroll */}
                     {availableShutters && availableShutters.length > 0 ? (
                         availableShutters.map(shutter => (
                            <div key={shutter.id} className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value={shutter.name} // Il valore è il nome per l'associazione
                                    id={`edit_shutter_check_${shutter.id}_${formData.id}`} // ID univoco
                                    checked={formData.selectedShutterNames.includes(shutter.name)} // Controlla se il nome è nell'array dello stato
                                    onChange={handleShutterChange}
                                    disabled={isLoading}
                                /> {/* */}
                                 <label className="form-check-label" htmlFor={`edit_shutter_check_${shutter.id}_${formData.id}`}> {/* */}
                                     {shutter.name}
                                 </label>
                             </div>
                        ))
                    ) : (
                         <p style={{ color: '#ccc' }}>Nessuna tapparella disponibile.</p> //
                    )}
                 </div>
            </div>

            {/* Bottoni Salva e Annulla */}
            <div className="mt-4 d-flex justify-content-end gap-2">
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onCancel} // Chiama la funzione onCancel passata come prop
                    disabled={isLoading}
                >
                    Annulla
                </button> {/* */}
                <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isLoading} // Disabilita se sta caricando
                >
                    {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button> {/* */}
            </div>
        </form>
    );
}

export default EditHomeForm; // Esporta il componente