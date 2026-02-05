// js/components/ui.js
// Componenti Grafici per EV Tracker

// ==========================================
// CARD GENERICA
// ==========================================
function UICard({ children, className = "" }) {
    return (
        <div className={"card " + className}>
            {children}
        </div>
    );
}

// ==========================================
// STATS CARDS (Le 4 card in alto)
// ==========================================
function StatsCards({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
            {/* Energia & Costo */}
            <div className="card">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm text-muted mb-1">Totale Speso</div>
                        <div className="text-2xl font-bold text-saving">€{stats.totalCost}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted mb-1">Energia</div>
                        <div className="text-xl font-bold text-kwh">{parseFloat(stats.totalKwh).toFixed(0)} <span className="text-sm">kWh</span></div>
                    </div>
                </div>
            </div>

            {/* Km & Consumo */}
            <div className="card">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm text-muted mb-1">Strada fatta</div>
                        <div className="text-2xl font-bold text-km">{stats.kmDriven} <span className="text-sm">km</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted mb-1">Consumo</div>
                        <div className="text-xl font-bold text-kwh">{stats.consumption}</div>
                    </div>
                </div>
            </div>

            {/* Risparmio vs Benzina */}
            <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30">
                <div className="text-sm text-emerald-400 mb-1 font-bold">💰 Risparmio Reale</div>
                <div className="text-3xl font-bold text-white">€{stats.gasolineSavings}</div>
                <div className="text-xs text-muted mt-1">rispetto alla benzina</div>
            </div>

            {/* ECO IMPACT (Alberi) */}
            <div className="card bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🌳</div>
                
                <div className="text-sm text-green-300 mb-1 font-bold">🌍 Impatto Green</div>
                <div className="flex items-end gap-2">
                    <div className="text-3xl font-bold text-white">{stats.treesSaved}</div>
                    <div className="text-sm text-green-200 mb-1">Alberi 🌲</div>
                </div>
                <div className="text-xs text-green-400/70 mt-1">
                    -{stats.co2SavedKg} kg di CO₂
                </div>
            </div>
        </div>
    );
}


// ==========================================
// LISTA RICARICHE
// ==========================================
function ChargeList({ charges, onDelete }) {
    if (!charges || charges.length === 0) {
        return <div className="p-8 text-center text-muted card">Nessuna ricarica registrata.</div>;
    }

    return (
        <div className="card overflow-hidden">
            <div className="divide-y divide-card-border">
                {charges.map(charge => {
                    // Calcolo potenza se abbiamo data fine
                    const power = calculateAveragePower(charge.kwh_added, charge.date, charge.end_date);
                    
                    return (
                        <div key={charge.id} className="p-4 hover:bg-card-soft transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    {/* Icona Tipo */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold 
                                        ${charge.supplier_type === 'DC' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {charge.supplier_type}
                                    </div>
                                    
                                    <div>
                                        <div className="font-bold text-sm text-white">{charge.supplier_name}</div>
                                        <div className="text-xs text-muted">
                                            {new Date(charge.date).toLocaleDateString("it-IT", {
                                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={() => onDelete(charge.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-negative p-2">
                                    🗑️
                                </button>
                            </div>

                            {/* Griglia Dati */}
                            <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                                <div className="bg-card-soft p-2 rounded text-center">
                                    <div className="text-xs text-muted">kWh</div>
                                    <div className="font-bold text-kwh">{parseFloat(charge.kwh_added).toFixed(1)}</div>
                                </div>
                                <div className="bg-card-soft p-2 rounded text-center">
                                    <div className="text-xs text-muted">Costo</div>
                                    <div className="font-bold text-saving">€{parseFloat(charge.cost).toFixed(2)}</div>
                                </div>
                                <div className="bg-card-soft p-2 rounded text-center">
                                    <div className="text-xs text-muted">Km agg.</div>
                                    <div className="font-bold text-km">
                                        {charge.km_since_last ? parseFloat(charge.km_since_last).toFixed(0) : "-"}
                                    </div>
                                </div>
                                {/* BOX POTENZA kW */}
                                <div className="bg-card-soft p-2 rounded text-center border border-card-border">
                                    <div className="text-xs text-muted">Velocità</div>
                                    <div className="font-bold text-orange-300">
                                        {power ? power + " kW" : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// VIEW IMPOSTAZIONI COMPLETA
// ==========================================
function SettingsView({ settings, setSettings, saveSettings, vehicles, onAddVehicle, suppliers, onAddSupplier }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* COLONNA SX: Parametri */}
            <div className="card">
                <h2 className="text-xl font-bold text-saving mb-4">⚙️ Impostazioni</h2>

                {/* Tema */}
                <div className="mb-6">
                    <label className="block text-muted mb-1">Tema Grafico</label>
                    <select
                        className="input-field"
                        value={settings.theme || "theme-default"}
                        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    >
                        <option value="theme-default">Default</option>
                        <option value="theme-dark">Dark</option>
                        <option value="theme-light">Light</option>
                        <option value="theme-emerald">Emerald</option>
                        <option value="theme-neon">Neon</option>
                        <option value="theme-cyber">Cyber</option>
                    </select>
                </div>

                {/* Prezzi Carburanti */}
                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Benzina (€/L)</label>
                            <input type="number" step="0.01" className="input" value={settings.gasolinePrice} onChange={e => setSettings({ ...settings, gasolinePrice: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Consumo (km/L)</label>
                            <input type="number" step="0.1" className="input" value={settings.gasolineConsumption} onChange={e => setSettings({ ...settings, gasolineConsumption: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Costo Energia Casa (€/kWh)</label>
                        <input type="number" step="0.001" className="input" value={settings.homeElectricityPrice} onChange={e => setSettings({ ...settings, homeElectricityPrice: e.target.value })} />
                    </div>
                </div>

                <button onClick={saveSettings} className="btn btn-primary mt-6 w-full">💾 Salva Impostazioni</button>
            </div>

            {/* COLONNA DX: Auto e Fornitori */}
            <div className="space-y-6">
                {/* AUTO */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-km">🚘 Le tue Auto</h2>
                        <button onClick={onAddVehicle} className="btn btn-secondary px-2 py-1 text-sm">➕ Aggiungi</button>
                    </div>
                    <div className="space-y-2">
                        {vehicles.map(v => (
                            <div key={v.id} className="card-soft flex items-center gap-3 p-3">
                                <div className="text-2xl">🚗</div>
                                <div>
                                    <div className="font-bold">{v.name}</div>
                                    <div className="text-xs text-muted">{v.brand} · {v.capacity_kwh} kWh</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FORNITORI */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-saving">🏪 Fornitori</h2>
                        <button onClick={onAddSupplier} className="btn btn-secondary px-2 py-1 text-sm">➕ Aggiungi</button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {suppliers.map(s => (
                            <div key={s.id} className="card-soft p-2 flex justify-between items-center text-sm">
                                <span>{s.name} ({s.type})</span>
                                <span className="text-muted">€{parseFloat(s.standard_cost).toFixed(3)}/kWh</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// SEZIONE GRAFICI
// ==========================================
function ChartSection({ charges, options, setOptions, theme }) {
    if(!charges || charges.length < 2) return <div className="text-center p-10 text-muted">Servono almeno 2 ricariche per i grafici.</div>;

    return (
        <div className="space-y-10">
            {/* Toggle bottoni */}
            <div className="flex flex-wrap gap-2 mb-4 text-xs justify-center">
                <button className={`toggle-btn ${options.showCost ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showCost: !o.showCost }))}>💵 Costo</button>
                <button className={`toggle-btn ${options.showKwh ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showKwh: !o.showKwh }))}>⚡ kWh</button>
                <button className={`toggle-btn ${options.showConsumption ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showConsumption: !o.showConsumption }))}>🚗 Consumo</button>
            </div>

            {options.showCost && <CostChart charges={charges} theme={theme} />}
            {options.showKwh && <KwhChart charges={charges} theme={theme} />}
            {options.showConsumption && <ConsumptionChart charges={charges} theme={theme} />}
        </div>
    );
}