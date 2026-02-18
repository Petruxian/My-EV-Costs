// forms.js - Gestione Modali Start/Stop/Manual/Vehicle

// --- MODALE AGGIUNTA VEICOLO ---
function AddVehicleModal({ newVehicle, setNewVehicle, onClose, onSave, isSyncing }) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-accent">🚘 Nuova Auto</h2>
                <div className="space-y-3">
                    <div>
                        <label className="label">Nome (es. La mia Tesla)</label>
                        <input className="input" type="text" value={newVehicle.name} onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Brand (es. Tesla, Fiat)</label>
                        <input className="input" type="text" value={newVehicle.brand} onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">Capacità Batteria (kWh) *</label>
                        <input className="input" type="number" step="0.1" placeholder="es. 55" value={newVehicle.capacity} onChange={e => setNewVehicle({ ...newVehicle, capacity: e.target.value })} />
                        <p className="text-xs text-muted mt-1">Fondamentale per i calcoli di efficienza.</p>
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={onSave} disabled={isSyncing} className="btn btn-primary flex-1">{isSyncing ? "..." : "Salva"}</button>
                </div>
            </div>
        </div>
    );
}

// --- MODALE START SESSION ---
function StartChargeModal({ activeVehicle, suppliers, onClose, onStart }) {
    const [data, setData] = React.useState({
        date: new Date().toISOString().slice(0, 16),
        totalKm: "",
        startPct: "",
        supplierId: "",
        notes: ""
    });

    const handleSubmit = () => {
        if (!data.totalKm || !data.startPct || !data.supplierId) return alert("Compila tutti i campi!");

        // Usa la data locale attuale per evitare problemi di timezone
        const now = new Date();

        onStart({
            ...data,
            date: now.toISOString()
        });
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full border-2 border-emerald-500/30">
                <h2 className="text-2xl font-bold mb-4 text-accent flex items-center gap-2">🔌 Inizia Ricarica</h2>

                <div className="space-y-4">
                    <div className="bg-card-soft p-2 rounded text-center text-sm text-muted">
                        Auto: <span className="text-accent font-bold">{activeVehicle?.name}</span>
                    </div>

                    <div>
                        <label className="label">📅 Data/Ora Inizio</label>
                        <input className="input" type="datetime-local" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">🚗 Km Attuali (Odometer)</label>
                        <input className="input text-lg font-mono" type="number" placeholder="es. 12500" value={data.totalKm} onChange={e => setData({ ...data, totalKm: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">🔋 % Batteria Iniziale</label>
                        <div className="flex items-center gap-2">
                            <input className="input text-lg font-bold text-center" type="number" min="0" max="100" placeholder="%" value={data.startPct} onChange={e => setData({ ...data, startPct: e.target.value })} />
                            <span className="text-xl">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="label">🏪 Fornitore</label>
                        <select className="input" value={data.supplierId} onChange={e => setData({ ...data, supplierId: e.target.value })}>
                            <option value="">Seleziona...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                        </select>
                    </div>

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

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={handleSubmit} className="btn btn-primary flex-1 font-bold">🚀 AVVIA</button>
                </div>
            </div>
        </div>
    );
}

// --- MODALE STOP SESSION ---
function StopChargeModal({ activeSession, activeVehicle, onClose, onStop }) {
    const [data, setData] = React.useState({
        endDate: new Date().toISOString().slice(0, 16),
        endPct: "",
        kwhAdded: "",
        cost: "",
        notes: activeSession.notes || ""
    });

    const handleSubmit = () => {
        if (!data.endPct || !data.kwhAdded) return alert("Inserisci % finale e kWh erogati!");
        onStop(data);
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full border-2 border-red-500/30">
                <h2 className="text-2xl font-bold mb-4 text-red-400 flex items-center gap-2">⏹ Termina Ricarica</h2>

                <div className="space-y-4">
                    <div className="flex justify-between text-sm text-muted mb-2">
                        <span>Inizio: {activeSession.battery_start}%</span>
                        <span>Ora: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div>
                        <label className="label">🔋 % Batteria Finale</label>
                        <input className="input text-lg font-bold text-center" type="number" min="0" max="100" placeholder="%" value={data.endPct} onChange={e => setData({ ...data, endPct: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">⚡ kWh Erogati (da colonnina)</label>
                        <input className="input" type="number" step="0.01" value={data.kwhAdded} onChange={e => setData({ ...data, kwhAdded: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">💵 Costo Totale (€)</label>
                        <input className="input" type="number" step="0.01" placeholder="Opzionale per Casa" value={data.cost} onChange={e => setData({ ...data, cost: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">📅 Data/Ora Fine</label>
                        <input className="input" type="datetime-local" value={data.endDate} onChange={e => setData({ ...data, endDate: e.target.value })} />
                    </div>

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

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={handleSubmit} className="btn btn-danger flex-1 font-bold">TERMINA</button>
                </div>
            </div>
        </div>
    );
}

// --- MODALE MANUAL CHARGE (ALL IN ONE) ---
function ManualChargeModal({ activeVehicle, suppliers, onClose, onSave }) {
    const [data, setData] = React.useState({
        date: new Date().toISOString().slice(0, 16),
        totalKm: "",
        startPct: "",
        endPct: "",
        kwhAdded: "",
        cost: "",
        supplierId: "",
        notes: ""
    });

    const handleSubmit = () => {
        if (!data.totalKm || !data.kwhAdded || !data.supplierId) return alert("Dati mancanti!");

        // Converti la data in ISO completo per evitare problemi di timezone
        const dateObj = new Date(data.date);
        const fullISODate = dateObj.toISOString();

        onSave({
            ...data,
            date: fullISODate
        });
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-accent">📝 Inserimento Manuale</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="label">📅 Data</label>
                        <input className="input" type="datetime-local" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
                    </div>

                    <div className="col-span-2">
                        <label className="label">🏪 Fornitore</label>
                        <select className="input" value={data.supplierId} onChange={e => setData({ ...data, supplierId: e.target.value })}>
                            <option value="">Seleziona...</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="label">🚗 Km Totali</label>
                        <input className="input" type="number" value={data.totalKm} onChange={e => setData({ ...data, totalKm: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">⚡ kWh Totali</label>
                        <input className="input" type="number" step="0.1" value={data.kwhAdded} onChange={e => setData({ ...data, kwhAdded: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">🔋 % Start</label>
                        <input className="input" type="number" placeholder="0-100" value={data.startPct} onChange={e => setData({ ...data, startPct: e.target.value })} />
                    </div>

                    <div>
                        <label className="label">🔋 % End</label>
                        <input className="input" type="number" placeholder="0-100" value={data.endPct} onChange={e => setData({ ...data, endPct: e.target.value })} />
                    </div>

                    <div className="col-span-2">
                        <label className="label">💵 Costo (€)</label>
                        <input className="input" type="number" step="0.01" value={data.cost} onChange={e => setData({ ...data, cost: e.target.value })} />
                    </div>

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


                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={handleSubmit} className="btn btn-primary flex-1">Salva</button>
                </div>
            </div>
        </div>
    );
}

// Helper per modale fornitori e settings (riutilizziamo codice esistente o placeholder semplice)
function AddSupplierModal({ newSupplier, setNewSupplier, onClose, onSave }) {
    // Inizializza default se mancano
    React.useEffect(() => {
        setNewSupplier(prev => ({ ...prev, isFavorite: false, sortOrder: 9 }));
    }, []);

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Aggiungi Fornitore</h2>
                <div className="space-y-3">
                    <input className="input" placeholder="Nome (es. Enel X)" value={newSupplier.name || ""} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <select className="input" value={newSupplier.type || "AC"} onChange={e => setNewSupplier({ ...newSupplier, type: e.target.value })}>
                            <option value="AC">AC (Lento)</option><option value="DC">DC (Fast)</option>
                        </select>
                        <input className="input" type="number" placeholder="€/kWh" value={newSupplier.standardCost || ""} onChange={e => setNewSupplier({ ...newSupplier, standardCost: e.target.value })} />
                    </div>

                    {/* SEZIONE PREFERITI & ORDINE */}
                    <div className="flex items-center gap-3 bg-card-soft p-2 rounded-lg border border-card-border">
                        <button 
                            className={`text-2xl transition-transform active:scale-125 ${newSupplier.isFavorite ? 'grayscale-0 scale-110' : 'grayscale opacity-50'}`}
                            onClick={() => setNewSupplier({ ...newSupplier, isFavorite: !newSupplier.isFavorite })}
                            title="Segna come preferito"
                        >
                            ⭐
                        </button>
                        <div className="flex-1 text-xs text-muted">
                            {newSupplier.isFavorite ? "Preferito (In cima alla lista)" : "Normale"}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-muted">Priorità:</label>
                            <select 
                                className="input py-1 px-2 w-16 text-center" 
                                value={newSupplier.sortOrder || 9} 
                                onChange={e => setNewSupplier({ ...newSupplier, sortOrder: parseInt(e.target.value) })}
                            >
                                {[0,1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Esci</button>
                    <button onClick={onSave} className="btn btn-primary flex-1">Salva</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// MODALE MODIFICA FORNITORE
// ==========================================
function EditSupplierModal({ supplier, setSupplier, onClose, onSave, isSyncing }) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-accent">✏️ Modifica Fornitore</h2>

                <div className="space-y-3">
                    <div>
                        <label className="label">Nome</label>
                        <input className="input" type="text" value={supplier.name} onChange={e => setSupplier({ ...supplier, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Tipo</label>
                            <select className="input" value={supplier.type} onChange={e => setSupplier({ ...supplier, type: e.target.value })}>
                                <option value="AC">AC</option><option value="DC">DC</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Costo (€/kWh)</label>
                            <input className="input" type="number" step="0.001" value={supplier.standardCost} onChange={e => setSupplier({ ...supplier, standardCost: e.target.value })} />
                        </div>
                    </div>

                    {/* SEZIONE PREFERITI & ORDINE */}
                    <div className="flex items-center gap-3 bg-card-soft p-3 rounded-lg border border-card-border mt-2">
                        <button 
                            className={`text-3xl transition-transform active:scale-125 ${supplier.isFavorite ? 'grayscale-0 scale-110' : 'grayscale opacity-40'}`}
                            onClick={() => setSupplier({ ...supplier, isFavorite: !supplier.isFavorite })}
                        >
                            ⭐
                        </button>
                        <div className="flex-1">
                            <div className="text-sm font-bold">{supplier.isFavorite ? "Preferito" : "Standard"}</div>
                            <div className="text-xs text-muted">Apparirà per primo</div>
                        </div>
                        <div className="text-right">
                            <label className="text-[10px] font-bold text-muted uppercase block mb-1">Ordine (0-9)</label>
                            <select 
                                className="input py-1 px-2 w-16 text-center font-bold" 
                                value={supplier.sortOrder !== undefined ? supplier.sortOrder : 9} 
                                onChange={e => setSupplier({ ...supplier, sortOrder: parseInt(e.target.value) })}
                            >
                                {[0,1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="text-xs text-muted mt-2 bg-blue-500/10 p-2 rounded">
                        ℹ️ Nota: Le modifiche al costo non influenzano lo storico passato.
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn btn-secondary flex-1">Annulla</button>
                    <button onClick={onSave} disabled={isSyncing} className="btn btn-primary flex-1">{isSyncing ? "..." : "Salva"}</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// --- MODALE MODIFICA VEICOLO ---
// ==========================================
function EditVehicleModal({ vehicle, setVehicle, onClose, onSave, isSyncing }) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4 text-accent">✏️ Modifica Auto</h2>
                <div className="space-y-3">
                    <div>
                        <label className="label">Nome (es. La mia Tesla)</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={vehicle.name} 
                            onChange={e => setVehicle({ ...vehicle, name: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="label">Brand (es. Tesla, Fiat)</label>
                        <input 
                            className="input" 
                            type="text" 
                            value={vehicle.brand} 
                            onChange={e => setVehicle({ ...vehicle, brand: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="label">Capacità Batteria (kWh)</label>
                        <input 
                            className="input" 
                            type="number" 
                            step="0.1" 
                            value={vehicle.capacity} 
                            onChange={e => setVehicle({ ...vehicle, capacity: e.target.value })} 
                        />
                        <p className="text-xs text-muted mt-1">Modificare la capacità non ricalcolerà lo storico.</p>
                    </div>
                </div>
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