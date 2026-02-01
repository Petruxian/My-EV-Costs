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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full border border-emerald-500/20 shadow-2xl max-h-[90vh] overflow-y-auto">

                <h2 className="text-2xl font-bold mb-6 text-emerald-400">
                    ➕ Nuova Ricarica
                </h2>

                <div className="space-y-4">

                    {/* Data */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">📅 Data e Ora</label>
                        <input
                            type="datetime-local"
                            value={newCharge.date}
                            onChange={(e) => setNewCharge({ ...newCharge, date: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>

                    {/* Km */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">🚗 Km Totali *</label>
                        <input
                            type="number"
                            value={newCharge.totalKm}
                            onChange={(e) => setNewCharge({ ...newCharge, totalKm: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>

                    {/* kWh */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">⚡ kWh Inseriti *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newCharge.kWhAdded}
                            onChange={(e) => setNewCharge({ ...newCharge, kWhAdded: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>

                    {/* Fornitore */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">🏪 Fornitore *</label>
                        <select
                            value={newCharge.supplier}
                            onChange={(e) => setNewCharge({ ...newCharge, supplier: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
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
                            <label className="block text-sm text-slate-300 mb-2">€ Costo (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newCharge.cost}
                                onChange={(e) => setNewCharge({ ...newCharge, cost: e.target.value })}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                            />
                        </div>
                    )}

                    {/* Costo automatico Casa */}
                    {selectedSupplier && selectedSupplier.name === "Casa" && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                            <p className="text-sm text-emerald-400">
                                ℹ️ Costo automatico: €
                                {newCharge.kWhAdded
                                    ? (parseFloat(newCharge.kWhAdded) * settings.homeElectricityPrice).toFixed(2)
                                    : "0.00"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pulsanti */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                    >
                        Annulla
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSyncing}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 px-4 py-2 rounded-lg font-bold"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full border border-emerald-500/20 shadow-2xl">

                <h2 className="text-2xl font-bold mb-6 text-emerald-400">
                    ➕ Nuovo Fornitore
                </h2>

                <div className="space-y-4 text-sm">

                    <div>
                        <label className="block text-slate-300 mb-1">Nome Fornitore</label>
                        <input
                            type="text"
                            value={newSupplier.name}
                            onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-300 mb-1">Tipo</label>
                        <select
                            value={newSupplier.type}
                            onChange={e => setNewSupplier({ ...newSupplier, type: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                        >
                            <option value="AC">AC</option>
                            <option value="DC">DC</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-300 mb-1">Costo Standard (€/kWh)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={newSupplier.standardCost}
                            onChange={e => setNewSupplier({ ...newSupplier, standardCost: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                    >
                        Annulla
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSyncing}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 px-4 py-2 rounded-lg font-bold"
                    >
                        {isSyncing ? "💾 Salvataggio..." : "💾 Salva"}
                    </button>
                </div>
            </div>
        </div>
    );
}
