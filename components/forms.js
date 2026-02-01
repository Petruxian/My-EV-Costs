//
// FORMS & MODALS
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// MODALE — NUOVA RICARICA
// ==========================================
function AddChargeModal({
    newCharge,
    setNewCharge,
    suppliers,
    settings,
    isSyncing,
    onClose,
    onSave
}) {
    const selectedSupplier = suppliers.find(
        s => s.id === parseInt(newCharge.supplier)
    );

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-md w-full">

                <h2 className="text-2xl font-bold mb-6 text-accent">
                    ➕ Nuova Ricarica
                </h2>

                <div className="space-y-4">

                    {/* Data */}
                    <div>
                        <label className="label">📅 Data e Ora</label>
                        <input
                            type="datetime-local"
                            value={newCharge.date}
                            onChange={(e) =>
                                setNewCharge({ ...newCharge, date: e.target.value })
                            }
                            className="input"
                        />
                    </div>

                    {/* Km */}
                    <div>
                        <label className="label">🚗 Km Totali *</label>
                        <input
                            type="number"
                            value={newCharge.totalKm}
                            onChange={(e) =>
                                setNewCharge({ ...newCharge, totalKm: e.target.value })
                            }
                            className="input"
                        />
                    </div>

                    {/* kWh */}
                    <div>
                        <label className="label">⚡ kWh Inseriti *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newCharge.kWhAdded}
                            onChange={(e) =>
                                setNewCharge({ ...newCharge, kWhAdded: e.target.value })
                            }
                            className="input"
                        />
                    </div>

                    {/* Fornitore */}
                    <div>
                        <label className="label">🏪 Fornitore *</label>
                        <select
                            value={newCharge.supplier}
                            onChange={(e) =>
                                setNewCharge({ ...newCharge, supplier: e.target.value })
                            }
                            className="input"
                        >
                            <option value="">Seleziona fornitore</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Costo manuale */}
                    {selectedSupplier && selectedSupplier.name !== "Casa" && (
                        <div>
                            <label className="label">€ Costo (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newCharge.cost}
                                onChange={(e) =>
                                    setNewCharge({ ...newCharge, cost: e.target.value })
                                }
                                className="input"
                            />
                        </div>
                    )}

                    {/* Costo automatico Casa */}
                    {selectedSupplier && selectedSupplier.name === "Casa" && (
                        <div className="card-soft p-3">
                            <p className="text-accent">
                                ℹ️ Costo automatico: €
                                {newCharge.kWhAdded
                                    ? (
                                          parseFloat(newCharge.kWhAdded) *
                                          settings.homeElectricityPrice
                                      ).toFixed(2)
                                    : "0.00"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pulsanti */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary flex-1"
                    >
                        Annulla
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSyncing}
                        className="btn btn-primary flex-1 font-bold"
                    >
                        {isSyncing ? "💾 Salvataggio..." : "💾 Salva"}
                    </button>
                </div>
            </div>
        </div>
    );
}



// ==========================================
// MODALE — NUOVO FORNITORE
// ==========================================
function AddSupplierModal({
    newSupplier,
    setNewSupplier,
    isSyncing,
    onClose,
    onSave
}) {
    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="modal-panel max-w-md w-full">

                <h2 className="text-2xl font-bold mb-6 text-accent">
                    ➕ Nuovo Fornitore
                </h2>

                <div className="space-y-4 text-sm">

                    <div>
                        <label className="label">Nome Fornitore</label>
                        <input
                            type="text"
                            value={newSupplier.name}
                            onChange={e =>
                                setNewSupplier({ ...newSupplier, name: e.target.value })
                            }
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Tipo</label>
                        <select
                            value={newSupplier.type}
                            onChange={e =>
                                setNewSupplier({ ...newSupplier, type: e.target.value })
                            }
                            className="input"
                        >
                            <option value="AC">AC</option>
                            <option value="DC">DC</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">Costo Standard (€/kWh)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={newSupplier.standardCost}
                            onChange={e =>
                                setNewSupplier({
                                    ...newSupplier,
                                    standardCost: e.target.value
                                })
                            }
                            className="input"
                        />
                    </div>
                </div>

                {/* Pulsanti */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary flex-1"
                    >
                        Annulla
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSyncing}
                        className="btn btn-primary flex-1 font-bold"
                    >
                        {isSyncing ? "💾 Salvataggio..." : "💾 Salva"}
                    </button>
                </div>
            </div>
        </div>
    );
}
