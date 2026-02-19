/**
 * ============================================================
 * FORMS.JS - Componenti Modali per EV Cost Tracker
 * ============================================================
 * 
 * Questo file contiene tutti i componenti modali per l'inserimento
 * e modifica dei dati dell'applicazione EV Cost Tracker.
 * 
 * COMPONENTI INCLUSI:
 * -------------------
 * 1. AddVehicleModal      - Modale aggiunta nuovo veicolo
 * 2. StartChargeModal     - Modale avvio sessione ricarica live
 * 3. StopChargeModal      - Modale terminazione ricarica
 * 4. ManualChargeModal    - Modale inserimento manuale completo
 * 5. EditChargeModal      - Modale modifica ricarica esistente
 * 6. AddSupplierModal     - Modale aggiunta fornitore
 * 7. EditSupplierModal    - Modale modifica fornitore esistente
 * 8. EditVehicleModal     - Modale modifica veicolo esistente
 * 
 * DIPENDENZE:
 * -----------
 * - React 18 (UMD - globale)
 * - Tailwind CSS (classi utility)
 * - Funzioni utility da utils.js (opzionali)
 * 
 * NOTE IMPORTANTI SULLE DATE:
 * ---------------------------
 * I browser utilizzano datetime-local che richiede formato locale.
 * toISOString() restituisce UTC (indietro di 1-2 ore in Italia).
 * Usare getLocalDateTimeString() per ottenere l'ora locale corretta.
 * 
 * @author EV Cost Tracker Team
 * @version 2.4 - Fix Timezone + Edit Charge con data inizio/fine per velocità
 * ============================================================
 */

// ============================================================
// UTILITY: Conversione Data/Ora Locale
// ============================================================
/**
 * Converte un oggetto Date in stringa formato datetime-local
 * rispettando il fuso orario locale dell'utente.
 * 
 * PROBLEMA RISOLTO:
 * new Date().toISOString() restituisce UTC (es. 10:00 locale → 09:00 UTC)
 * Questo causa che l'input datetime-local mostra un'ora sbagliata.
 * 
 * SOLUZIONE:
 * Estrarre manualmente i componenti della data locale invece di usare toISOString().
 * 
 * @param {Date|string} dateInput - Oggetto Date o stringa ISO (default: now)
 * @returns {string} Stringa formato "YYYY-MM-DDTHH:MM" per datetime-local
 * 
 * @example
 * getLocalDateTimeString()           // "2024-01-15T14:30" (ora corrente locale)
 * getLocalDateTimeString(new Date()) // "2024-01-15T14:30" (stesso risultato)
 * getLocalDateTimeString("2024-01-15T12:00:00Z") // Converte UTC in locale
 */
function getLocalDateTimeString(dateInput = new Date()) {
    let date;
    
    // Gestisci diversi tipi di input
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        // Se è una stringa ISO, parsala
        date = new Date(dateInput);
    } else {
        date = new Date();
    }
    
    // Verifica data valida
    if (isNaN(date.getTime())) {
        date = new Date();
    }
    
    // Estrai componenti della data LOCALE (non UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // 0-11 → 01-12
    const day = String(date.getDate()).padStart(2, '0');         // 1-31 → 01-31
    const hours = String(date.getHours()).padStart(2, '0');      // 0-23 → 00-23
    const minutes = String(date.getMinutes()).padStart(2, '0');  // 0-59 → 00-59
    
    // Formato richiesto da datetime-local: YYYY-MM-DDTHH:MM
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converte una stringa datetime-local in ISO string per il database.
 * 
 * @param {string} dateTimeLocal - Stringa formato "YYYY-MM-DDTHH:MM"
 * @returns {string} ISO string
 */
function dateTimeLocalToISO(dateTimeLocal) {
    if (!dateTimeLocal) return new Date().toISOString();
    const date = new Date(dateTimeLocal);
    return date.toISOString();
}

// ============================================================
// MODALE: Aggiunta Nuovo Veicolo
// ============================================================
/**
 * Modale per l'aggiunta di un nuovo veicolo elettrico al database.
 * 
 * CAMPI RICHIESTI:
 * - name: Nome personalizzato del veicolo (es. "La mia Tesla")
 * - brand: Marca del veicolo (es. Tesla, Fiat, VW)
 * - capacity: Capacità batteria in kWh (fondamentale per calcoli efficienza)
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.newVehicle - Stato del nuovo veicolo
 * @param {Function} props.setNewVehicle - Setter stato veicolo
 * @param {Function} props.onClose - Callback chiusura modale
 * @param {Function} props.onSave - Callback salvataggio
 * @param {boolean} props.isSyncing - Stato sincronizzazione in corso
 */
function AddVehicleModal({ newVehicle, setNewVehicle, onClose, onSave, isSyncing }) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                {/* Header Modale */}
                <h2 className="text-xl font-bold mb-4 text-accent">🚘 Nuova Auto</h2>
                
                {/* Form Campi */}
                <div className="space-y-3">
                    {/* Nome Veicolo */}
                    <div>
                        <label className="label">Nome (es. La mia Tesla)</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={newVehicle.name} 
                            onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} 
                        />
                    </div>
                    
                    {/* Brand */}
                    <div>
                        <label className="label">Brand (es. Tesla, Fiat)</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={newVehicle.brand} 
                            onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} 
                        />
                    </div>
                    
                    {/* Capacità Batteria */}
                    <div>
                        <label className="label">Capacità Batteria (kWh) *</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.1" 
                            placeholder="es. 55" 
                            value={newVehicle.capacity} 
                            onChange={e => setNewVehicle({ ...newVehicle, capacity: e.target.value })} 
                        />
                        <p className="text-xs text-muted mt-1">
                            Fondamentale per i calcoli di efficienza.
                        </p>
                    </div>
                </div>
                
                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={onSave} disabled={isSyncing} className="btn btn-primary flex-1">
                        {isSyncing ? "..." : "Salva"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Avvio Sessione Ricarica (Start Charge)
// ============================================================
/**
 * Modale per avviare una nuova sessione di ricarica in tempo reale.
 * 
 * FLUSSO:
 * 1. Utente seleziona fornitore e inserisce dati iniziali
 * 2. Viene creato un record con status "in_progress"
 * 3. Il timer live mostra il tempo trascorso
 * 4. Al termine viene chiamato StopChargeModal
 * 
 * CAMPI:
 * - date: Data/ora inizio (default: ora corrente locale)
 * - totalKm: Chilometri attuali odometro
 * - startPct: Percentuale batteria iniziale
 * - supplierId: ID del fornitore selezionato
 * - notes: Note opzionali
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.activeVehicle - Veicolo attualmente selezionato
 * @param {Array} props.suppliers - Lista fornitori disponibili
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onStart - Callback avvio ricarica
 */
function StartChargeModal({ activeVehicle, suppliers, onClose, onStart }) {
    /**
     * STATO LOCALE DEL FORM
     * Nota: getLocalDateTimeString() restituisce l'ora locale corretta,
     * non UTC come toISOString().slice(0,16)
     */
    const [data, setData] = React.useState({
        date: getLocalDateTimeString(),  // FIX: Ora locale invece di UTC
        totalKm: "",
        startPct: "",
        supplierId: "",
        notes: ""
    });

    /**
     * Gestisce il submit del form.
     * Valida i campi obbligatori e invia i dati al parent.
     * Converte la data in ISO per il database.
     */
    const handleSubmit = () => {
        // Validazione campi obbligatori
        if (!data.totalKm || !data.startPct || !data.supplierId) {
            return alert("Compila tutti i campi!");
        }

        // Converti la data locale in ISO completo per il database
        const dateObj = new Date(data.date);
        
        onStart({
            ...data,
            date: dateObj.toISOString()  // Salvataggio in ISO (standard DB)
        });
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full border-2 border-emerald-500/30">
                {/* Header */}
                <h2 className="text-2xl font-bold mb-4 text-accent flex items-center gap-2">
                    🔌 Inizia Ricarica
                </h2>

                <div className="space-y-4">
                    {/* Info Auto Attiva */}
                    <div className="bg-card-soft p-2 rounded text-center text-sm text-muted">
                        Auto: <span className="text-accent font-bold">{activeVehicle?.name}</span>
                    </div>

                    {/* Data/Ora Inizio */}
                    <div>
                        <label className="label">📅 Data/Ora Inizio</label>
                        <input 
                            className="input" 
                            type="datetime-local" 
                            value={data.date} 
                            onChange={e => setData({ ...data, date: e.target.value })} 
                        />
                    </div>

                    {/* Km Odometro */}
                    <div>
                        <label className="label">🚗 Km Attuali (Odometer)</label>
                        <input 
                            className="input text-lg font-mono" 
                            type="number" 
                            placeholder="es. 12500" 
                            value={data.totalKm} 
                            onChange={e => setData({ ...data, totalKm: e.target.value })} 
                        />
                    </div>

                    {/* % Batteria Iniziale */}
                    <div>
                        <label className="label">🔋 % Batteria Iniziale</label>
                        <div className="flex items-center gap-2">
                            <input 
                                className="input text-lg font-bold text-center" 
                                type="number" 
                                min="0" 
                                max="100" 
                                placeholder="%" 
                                value={data.startPct} 
                                onChange={e => setData({ ...data, startPct: e.target.value })} 
                            />
                            <span className="text-xl">%</span>
                        </div>
                    </div>

                    {/* Selezione Fornitore */}
                    <div>
                        <label className="label">🏪 Fornitore</label>
                        <select 
                            className="input" 
                            value={data.supplierId} 
                            onChange={e => setData({ ...data, supplierId: e.target.value })}
                        >
                            <option value="">Seleziona...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Note Opzionali */}
                    <div>
                        <label className="label">📝 Note (Opzionale)</label>
                        <textarea 
                            className="input min-h-[60px] text-sm" 
                            placeholder="Es. Colonnina lenta, pioveva..." 
                            value={data.notes} 
                            onChange={e => setData({ ...data, notes: e.target.value })} 
                        />
                    </div>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={handleSubmit} className="btn btn-primary flex-1 font-bold">
                        🚀 AVVIA
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Termina Sessione Ricarica (Stop Charge)
// ============================================================
/**
 * Modale per terminare una sessione di ricarica in corso.
 * 
 * FLUSSO:
 * 1. Mostra dati sessione in corso (batteria iniziale, ora inizio)
 * 2. Utente inserisce dati finali (batteria, kWh, costo)
 * 3. Il record viene aggiornato con status "completed"
 * 4. Vengono calcolati km percorsi e consumo
 * 
 * CAMPI:
 * - endDate: Data/ora fine (default: ora corrente locale)
 * - endPct: Percentuale batteria finale
 * - kwhAdded: kWh erogati dalla colonnina
 * - cost: Costo totale (opzionale per ricariche casa)
 * - notes: Note aggiornabili
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.activeSession - Sessione di ricarica in corso
 * @param {Object} props.activeVehicle - Veicolo associato
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onStop - Callback terminazione
 */
function StopChargeModal({ activeSession, activeVehicle, onClose, onStop }) {
    /**
     * STATO LOCALE DEL FORM
     * Inizializzato con ora locale corrente e note della sessione
     */
    const [data, setData] = React.useState({
        endDate: getLocalDateTimeString(),  // FIX: Ora locale invece di UTC
        endPct: "",
        kwhAdded: "",
        cost: "",
        notes: activeSession.notes || ""
    });

    /**
     * Gestisce il submit del form.
     * Valida i campi essenziali e invia i dati.
     */
    const handleSubmit = () => {
        // Validazione: kWh e % finale sono obbligatori
        if (!data.endPct || !data.kwhAdded) {
            return alert("Inserisci % finale e kWh erogati!");
        }
        onStop(data);
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full border-2 border-red-500/30">
                {/* Header */}
                <h2 className="text-2xl font-bold mb-4 text-red-400 flex items-center gap-2">
                    ⏹ Termina Ricarica
                </h2>

                <div className="space-y-4">
                    {/* Info Sessione In Corso */}
                    <div className="flex justify-between text-sm text-muted mb-2">
                        <span>Inizio: {activeSession.battery_start}%</span>
                        <span>Ora: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* % Batteria Finale */}
                    <div>
                        <label className="label">🔋 % Batteria Finale</label>
                        <input 
                            className="input text-lg font-bold text-center" 
                            type="number" 
                            min="0" 
                            max="100" 
                            placeholder="%" 
                            value={data.endPct} 
                            onChange={e => setData({ ...data, endPct: e.target.value })} 
                        />
                    </div>

                    {/* kWh Erogati */}
                    <div>
                        <label className="label">⚡ kWh Erogati (da colonnina)</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.01" 
                            value={data.kwhAdded} 
                            onChange={e => setData({ ...data, kwhAdded: e.target.value })} 
                        />
                    </div>

                    {/* Costo Totale */}
                    <div>
                        <label className="label">💵 Costo Totale (€)</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.01" 
                            placeholder="Opzionale per Casa" 
                            value={data.cost} 
                            onChange={e => setData({ ...data, cost: e.target.value })} 
                        />
                    </div>

                    {/* Data/Ora Fine */}
                    <div>
                        <label className="label">📅 Data/Ora Fine</label>
                        <input 
                            className="input" 
                            type="datetime-local" 
                            value={data.endDate} 
                            onChange={e => setData({ ...data, endDate: e.target.value })} 
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="label">📝 Aggiorna Note</label>
                        <textarea 
                            className="input min-h-[60px] text-sm" 
                            placeholder="Aggiungi dettagli..." 
                            value={data.notes} 
                            onChange={e => setData({ ...data, notes: e.target.value })} 
                        />
                    </div>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={handleSubmit} className="btn btn-danger flex-1 font-bold">
                        TERMINA
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Inserimento Manuale Completo (Manual Charge)
// ============================================================
/**
 * Modale per l'inserimento manuale di una ricarica già completata.
 * Utile per registrare ricariche passate o fatte altrove.
 * 
 * CAMPI:
 * - date: Data/ora ricarica
 * - totalKm: Km totali odometro
 * - startPct/endPct: Percentuali batteria iniziale/finale
 * - kwhAdded: kWh totali caricati
 * - cost: Costo totale
 * - supplierId: ID fornitore
 * - notes: Note opzionali
 * 
 * DIFFERENZE DA START/STOP:
 * - Inserisce direttamente con status "completed"
 * - Non calcola durata ricarica
 * - Utile per dati storici o importazione
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.activeVehicle - Veicolo selezionato
 * @param {Array} props.suppliers - Lista fornitori
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onSave - Callback salvataggio
 */
function ManualChargeModal({ activeVehicle, suppliers, onClose, onSave }) {
    /**
     * STATO LOCALE DEL FORM
     * Tutti i campi necessari per una ricarica completa
     */
    const [data, setData] = React.useState({
        date: getLocalDateTimeString(),  // FIX: Ora locale invece di UTC
        totalKm: "",
        startPct: "",
        endPct: "",
        kwhAdded: "",
        cost: "",
        supplierId: "",
        notes: ""
    });

    /**
     * Gestisce il submit del form.
     * Valida i campi obbligatori e converte la data.
     */
    const handleSubmit = () => {
        // Validazione campi essenziali
        if (!data.totalKm || !data.kwhAdded || !data.supplierId) {
            return alert("Dati mancanti!");
        }

        // Converti la data in ISO completo per evitare problemi di timezone
        const dateObj = new Date(data.date);

        onSave({
            ...data,
            date: dateObj.toISOString()  // Salvataggio in ISO (standard DB)
        });
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-md w-full">
                {/* Header */}
                <h2 className="text-xl font-bold mb-4 text-accent">📝 Inserimento Manuale</h2>

                <div className="grid grid-cols-2 gap-4">
                    {/* Data/Ora */}
                    <div className="col-span-2">
                        <label className="label">📅 Data</label>
                        <input 
                            className="input" 
                            type="datetime-local" 
                            value={data.date} 
                            onChange={e => setData({ ...data, date: e.target.value })} 
                        />
                    </div>

                    {/* Fornitore */}
                    <div className="col-span-2">
                        <label className="label">🏪 Fornitore</label>
                        <select 
                            className="input" 
                            value={data.supplierId} 
                            onChange={e => setData({ ...data, supplierId: e.target.value })}
                        >
                            <option value="">Seleziona...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Km Totali */}
                    <div>
                        <label className="label">🚗 Km Totali</label>
                        <input 
                            className="input" 
                            type="number" 
                            value={data.totalKm} 
                            onChange={e => setData({ ...data, totalKm: e.target.value })} 
                        />
                    </div>

                    {/* kWh Totali */}
                    <div>
                        <label className="label">⚡ kWh Totali</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.1" 
                            value={data.kwhAdded} 
                            onChange={e => setData({ ...data, kwhAdded: e.target.value })} 
                        />
                    </div>

                    {/* % Start */}
                    <div>
                        <label className="label">🔋 % Start</label>
                        <input 
                            className="input" 
                            type="number" 
                            placeholder="0-100" 
                            value={data.startPct} 
                            onChange={e => setData({ ...data, startPct: e.target.value })} 
                        />
                    </div>

                    {/* % End */}
                    <div>
                        <label className="label">🔋 % End</label>
                        <input 
                            className="input" 
                            type="number" 
                            placeholder="0-100" 
                            value={data.endPct} 
                            onChange={e => setData({ ...data, endPct: e.target.value })} 
                        />
                    </div>

                    {/* Costo */}
                    <div className="col-span-2">
                        <label className="label">💵 Costo (€)</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.01" 
                            value={data.cost} 
                            onChange={e => setData({ ...data, cost: e.target.value })} 
                        />
                    </div>

                    {/* Note */}
                    <div className="col-span-2">
                        <label className="label">📝 Note</label>
                        <textarea 
                            className="input min-h-[60px] text-sm" 
                            placeholder="Dettagli ricarica..." 
                            value={data.notes} 
                            onChange={e => setData({ ...data, notes: e.target.value })} 
                        />
                    </div>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={handleSubmit} className="btn btn-primary flex-1">Salva</button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Modifica Ricarica Esistente (Edit Charge)
// ============================================================
/**
 * Modale per modificare una ricarica esistente.
 * 
 * CAMPI MODIFICABILI:
 * - date: Data/ora INIZIO della ricarica
 * - endDate: Data/ora FINE della ricarica
 * - total_km: Km totali odometro
 * - battery_start/end: Percentuali batteria
 * - kwh_added: kWh caricati
 * - cost: Costo
 * - supplier: Fornitore
 * - notes: Note
 * 
 * CALCOLI IN TEMPO REALE:
 * - Durata ricarica (differenza tra inizio e fine)
 * - Velocità media (kWh / durata in ore = kW)
 * 
 * RICALCOLI AUTOMATICI:
 * Quando si modificano km o kWh, vengono ricalcolati:
 * - km_since_last: Differenza con ricarica precedente
 * - consumption: kWh/100km
 * - Costo (se casa/fotovoltaico)
 * 
 * EFFETTI A CASCATA:
 * La modifica di total_km influenza anche la ricarica SUCCESSIVA
 * (il suo km_since_last viene ricalcolato).
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.charge - Dati ricarica da modificare
 * @param {Function} props.setCharge - Setter stato
 * @param {Array} props.suppliers - Lista fornitori
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onSave - Callback salvataggio
 * @param {boolean} props.isSyncing - Stato sincronizzazione
 */
function EditChargeModal({ charge, setCharge, suppliers, onClose, onSave, isSyncing }) {
    /**
     * Calcola la durata della ricarica in formato leggibile.
     * @returns {string} Durata formattata (es. "1h 30min")
     */
    const calculateDuration = () => {
        if (!charge.date || !charge.endDate) return "-";
        
        const start = new Date(charge.date);
        const end = new Date(charge.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
        if (end <= start) return "⚠️ Fine prima di inizio";
        
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}min`;
        }
        return `${mins} min`;
    };
    
    /**
     * Calcola la potenza media di ricarica in kW.
     * @returns {string|null} Potenza formattata o null se non calcolabile
     */
    const calculatePower = () => {
        if (!charge.date || !charge.endDate || !charge.kwhAdded) return null;
        
        const start = new Date(charge.date);
        const end = new Date(charge.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
        if (end <= start) return null;
        
        const diffMs = end - start;
        const diffHours = diffMs / 3600000; // ms to hours
        
        if (diffHours <= 0) return null;
        
        const kwh = parseFloat(charge.kwhAdded);
        if (isNaN(kwh) || kwh <= 0) return null;
        
        const power = kwh / diffHours;
        return power.toFixed(1);
    };
    
    const duration = calculateDuration();
    const power = calculatePower();
    
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-md w-full border-2 border-blue-500/30 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                    ✏️ Modifica Ricarica
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    {/* Data/Ora INIZIO */}
                    <div className="col-span-2 sm:col-span-1">
                        <label className="label">📅 Inizio Ricarica</label>
                        <input 
                            className="input" 
                            type="datetime-local" 
                            value={charge.date || ""} 
                            onChange={e => setCharge({ ...charge, date: e.target.value })} 
                        />
                    </div>
                    
                    {/* Data/Ora FINE */}
                    <div className="col-span-2 sm:col-span-1">
                        <label className="label">🏁 Fine Ricarica</label>
                        <input 
                            className="input" 
                            type="datetime-local" 
                            value={charge.endDate || ""} 
                            onChange={e => setCharge({ ...charge, endDate: e.target.value })} 
                        />
                    </div>
                    
                    {/* Info Durata e Velocità */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex-1">
                                <div className="text-xs text-muted">⏱️ Durata</div>
                                <div className="font-bold text-blue-300">{duration}</div>
                            </div>
                            {power && (
                                <div className="flex-1">
                                    <div className="text-xs text-muted">⚡ Potenza Media</div>
                                    <div className="font-bold text-orange-400">{power} kW</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fornitore */}
                    <div className="col-span-2">
                        <label className="label">🏪 Fornitore</label>
                        <select 
                            className="input" 
                            value={charge.supplierId || ""} 
                            onChange={e => setCharge({ ...charge, supplierId: e.target.value })}
                        >
                            <option value="">Seleziona...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                            ))}
                        </select>
                    </div>

                    {/* Km Totali */}
                    <div>
                        <label className="label">🚗 Km Totali</label>
                        <input 
                            className="input" 
                            type="number" 
                            value={charge.totalKm || ""} 
                            onChange={e => setCharge({ ...charge, totalKm: e.target.value })} 
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Influenza km_since_last
                        </p>
                    </div>

                    {/* kWh */}
                    <div>
                        <label className="label">⚡ kWh</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.1" 
                            value={charge.kwhAdded || ""} 
                            onChange={e => setCharge({ ...charge, kwhAdded: e.target.value })} 
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Influenza consumo
                        </p>
                    </div>

                    {/* % Start */}
                    <div>
                        <label className="label">🔋 % Start</label>
                        <input 
                            className="input" 
                            type="number" 
                            min="0" 
                            max="100" 
                            placeholder="0-100" 
                            value={charge.batteryStart || ""} 
                            onChange={e => setCharge({ ...charge, batteryStart: e.target.value })} 
                        />
                    </div>

                    {/* % End */}
                    <div>
                        <label className="label">🔋 % End</label>
                        <input 
                            className="input" 
                            type="number" 
                            min="0" 
                            max="100" 
                            placeholder="0-100" 
                            value={charge.batteryEnd || ""} 
                            onChange={e => setCharge({ ...charge, batteryEnd: e.target.value })} 
                        />
                    </div>

                    {/* Costo */}
                    <div className="col-span-2">
                        <label className="label">💵 Costo (€)</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.01" 
                            value={charge.cost || ""} 
                            onChange={e => setCharge({ ...charge, cost: e.target.value })} 
                        />
                        <p className="text-[10px] text-muted mt-1">
                            Lascia vuoto per calcolo automatico (Casa/Fotovoltaico)
                        </p>
                    </div>

                    {/* Note */}
                    <div className="col-span-2">
                        <label className="label">📝 Note</label>
                        <textarea 
                            className="input min-h-[60px] text-sm" 
                            placeholder="Dettagli ricarica..." 
                            value={charge.notes || ""} 
                            onChange={e => setCharge({ ...charge, notes: e.target.value })} 
                        />
                    </div>
                </div>

                {/* Info ricalcoli */}
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-xs text-blue-300 font-medium mb-1">
                        ℹ️ Ricalcoli automatici
                    </div>
                    <ul className="text-[10px] text-muted space-y-1">
                        <li>• <strong>velocità</strong>: calcolata da inizio/fine e kWh</li>
                        <li>• <strong>km_since_last</strong>: differenza con ricarica precedente</li>
                        <li>• <strong>consumo</strong>: kWh/100km</li>
                        <li>• <strong>costo</strong>: ricalcolato se Casa/Fotovoltaico</li>
                        <li>• <strong>ricarica successiva</strong>: km_since_last aggiornato</li>
                    </ul>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button 
                        onClick={onSave} 
                        disabled={isSyncing} 
                        className="btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white flex-1"
                    >
                        {isSyncing ? "..." : "💾 Salva Modifiche"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Aggiunta Nuovo Fornitore
// ============================================================
/**
 * Modale per l'aggiunta di un nuovo fornitore di ricarica.
 * 
 * CAMPI:
 * - name: Nome del fornitore (es. Enel X, Tesla Supercharger)
 * - type: Tipo di ricarica - AC (lento) o DC (fast)
 * - standardCost: Costo standard in €/kWh
 * - isFavorite: Se è un fornitore preferito (in cima alla lista)
 * - sortOrder: Ordine di visualizzazione (0-9, 0 = primo)
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.newSupplier - Stato nuovo fornitore
 * @param {Function} props.setNewSupplier - Setter stato
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onSave - Callback salvataggio
 */
function AddSupplierModal({ newSupplier, setNewSupplier, onClose, onSave }) {
    /**
     * Inizializza i valori di default al mount del componente.
     * sortOrder 9 = ultima posizione, isFavorite false = normale.
     */
    React.useEffect(() => {
        setNewSupplier(prev => ({ 
            ...prev, 
            isFavorite: prev.isFavorite ?? false, 
            sortOrder: prev.sortOrder ?? 9 
        }));
    }, []);

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                {/* Header */}
                <h2 className="text-xl font-bold mb-4">Aggiungi Fornitore</h2>
                
                <div className="space-y-3">
                    {/* Nome Fornitore */}
                    <input 
                        className="input" 
                        placeholder="Nome (es. Enel X)" 
                        value={newSupplier.name || ""} 
                        onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} 
                    />
                    
                    {/* Tipo e Costo */}
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="input" 
                            value={newSupplier.type || "AC"} 
                            onChange={e => setNewSupplier({ ...newSupplier, type: e.target.value })}
                        >
                            <option value="AC">AC (Lento)</option>
                            <option value="DC">DC (Fast)</option>
                        </select>
                        <input 
                            className="input" 
                            type="number" 
                            placeholder="€/kWh" 
                            value={newSupplier.standardCost || ""} 
                            onChange={e => setNewSupplier({ ...newSupplier, standardCost: e.target.value })} 
                        />
                    </div>

                    {/* Sezione Preferiti & Ordine */}
                    <div className="flex items-center gap-3 bg-card-soft p-2 rounded-lg border border-card-border">
                        {/* Toggle Preferito */}
                        <button 
                            className={`text-2xl transition-transform active:scale-125 ${
                                newSupplier.isFavorite ? 'grayscale-0 scale-110' : 'grayscale opacity-50'
                            }`}
                            onClick={() => setNewSupplier({ ...newSupplier, isFavorite: !newSupplier.isFavorite })}
                            title="Segna come preferito"
                        >
                            ⭐
                        </button>
                        
                        {/* Label Stato */}
                        <div className="flex-1 text-xs text-muted">
                            {newSupplier.isFavorite ? "Preferito (In cima alla lista)" : "Normale"}
                        </div>
                        
                        {/* Ordine Priorità */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-muted">Priorità:</label>
                            <select 
                                className="input py-1 px-2 w-16 text-center" 
                                value={newSupplier.sortOrder || 9} 
                                onChange={e => setNewSupplier({ ...newSupplier, sortOrder: parseInt(e.target.value) })}
                            >
                                {[0,1,2,3,4,5,6,7,8,9].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Esci</button>
                    <button onClick={onSave} className="btn btn-primary flex-1">Salva</button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Modifica Fornitore Esistente
// ============================================================
/**
 * Modale per modificare un fornitore esistente.
 * 
 * NOTA IMPORTANTE:
 * Le modifiche al costo standard NON influenzano le ricariche passate.
 * Ogni ricarica salva uno snapshot del costo al momento dell'inserimento.
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.supplier - Dati fornitore da modificare
 * @param {Function} props.setSupplier - Setter stato
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onSave - Callback salvataggio
 * @param {boolean} props.isSyncing - Stato sincronizzazione
 */
function EditSupplierModal({ supplier, setSupplier, onClose, onSave, isSyncing }) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                {/* Header */}
                <h2 className="text-xl font-bold mb-4 text-accent">✏️ Modifica Fornitore</h2>

                <div className="space-y-3">
                    {/* Nome */}
                    <div>
                        <label className="label">Nome</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={supplier.name} 
                            onChange={e => setSupplier({ ...supplier, name: e.target.value })} 
                        />
                    </div>

                    {/* Tipo e Costo */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Tipo</label>
                            <select 
                                className="input" 
                                value={supplier.type} 
                                onChange={e => setSupplier({ ...supplier, type: e.target.value })}
                            >
                                <option value="AC">AC</option>
                                <option value="DC">DC</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Costo (€/kWh)</label>
                            <input 
                                className="input" 
                                type="number" 
                                step="0.001" 
                                value={supplier.standardCost} 
                                onChange={e => setSupplier({ ...supplier, standardCost: e.target.value })} 
                            />
                        </div>
                    </div>

                    {/* Sezione Preferiti & Ordine */}
                    <div className="flex items-center gap-3 bg-card-soft p-3 rounded-lg border border-card-border mt-2">
                        {/* Toggle Preferito */}
                        <button 
                            className={`text-3xl transition-transform active:scale-125 ${
                                supplier.isFavorite ? 'grayscale-0 scale-110' : 'grayscale opacity-40'
                            }`}
                            onClick={() => setSupplier({ ...supplier, isFavorite: !supplier.isFavorite })}
                        >
                            ⭐
                        </button>
                        
                        {/* Label Stato */}
                        <div className="flex-1">
                            <div className="text-sm font-bold">
                                {supplier.isFavorite ? "Preferito" : "Standard"}
                            </div>
                            <div className="text-xs text-muted">Apparirà per primo</div>
                        </div>
                        
                        {/* Ordine Priorità */}
                        <div className="text-right">
                            <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                                Ordine (0-9)
                            </label>
                            <select 
                                className="input py-1 px-2 w-16 text-center font-bold" 
                                value={supplier.sortOrder !== undefined ? supplier.sortOrder : 9} 
                                onChange={e => setSupplier({ ...supplier, sortOrder: parseInt(e.target.value) })}
                            >
                                {[0,1,2,3,4,5,6,7,8,9].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Nota Informativa */}
                    <div className="text-xs text-muted mt-2 bg-blue-500/10 p-2 rounded">
                        ℹ️ Nota: Le modifiche al costo non influenzano lo storico passato.
                    </div>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={onSave} disabled={isSyncing} className="btn btn-primary flex-1">
                        {isSyncing ? "..." : "Salva"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MODALE: Modifica Veicolo Esistente
// ============================================================
/**
 * Modale per modificare un veicolo esistente.
 * 
 * NOTA IMPORTANTE:
 * La modifica della capacità batteria NON ricalcola lo storico delle ricariche.
 * I valori storici rimangono invariati.
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.vehicle - Dati veicolo da modificare
 * @param {Function} props.setVehicle - Setter stato
 * @param {Function} props.onClose - Callback chiusura
 * @param {Function} props.onSave - Callback salvataggio
 * @param {boolean} props.isSyncing - Stato sincronizzazione
 */
function EditVehicleModal({ vehicle, setVehicle, onClose, onSave, isSyncing }) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                {/* Header */}
                <h2 className="text-xl font-bold mb-4 text-accent">✏️ Modifica Auto</h2>
                
                <div className="space-y-3">
                    {/* Nome */}
                    <div>
                        <label className="label">Nome (es. La mia Tesla)</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={vehicle.name} 
                            onChange={e => setVehicle({ ...vehicle, name: e.target.value })} 
                        />
                    </div>
                    
                    {/* Brand */}
                    <div>
                        <label className="label">Brand (es. Tesla, Fiat)</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={vehicle.brand} 
                            onChange={e => setVehicle({ ...vehicle, brand: e.target.value })} 
                        />
                    </div>
                    
                    {/* Capacità Batteria */}
                    <div>
                        <label className="label">Capacità Batteria (kWh)</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.1" 
                            value={vehicle.capacity} 
                            onChange={e => setVehicle({ ...vehicle, capacity: e.target.value })} 
                        />
                        <p className="text-xs text-muted mt-1">
                            Modificare la capacità non ricalcolerà lo storico.
                        </p>
                    </div>
                </div>
                
                {/* Pulsanti Azione */}
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={onSave} disabled={isSyncing} className="btn btn-primary flex-1">
                        {isSyncing ? "..." : "Salva Modifiche"}
                    </button>
                </div>
            </div>
        </div>
    );
}
