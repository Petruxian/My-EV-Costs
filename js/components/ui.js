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
            {/* Energia Totale */}
            <div className="card">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚡</span>
                    <h3 className="text-sm text-saving font-semibold">Energia Totale</h3>
                </div>
                <p className="text-3xl font-bold text-kwh">{stats.totalKwh} kWh</p>
                <p className="text-xs text-muted mt-1">{stats.chargesCount} ricariche</p>
            </div>

            {/* Costo Totale */}
            <div className="card">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">€</span>
                    <h3 className="text-sm text-kwh font-semibold">Costo Totale</h3>
                </div>
                <p className="text-3xl font-bold text-kwh">€{stats.totalCost}</p>
                <p className="text-xs text-muted mt-1">€{stats.avgCostPerKwh}/kWh medio</p>
            </div>

            {/* Km Percorsi */}
            <div className="card">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🚗</span>
                    <h3 className="text-sm text-km font-semibold">Km Percorsi</h3>
                </div>
                <p className="text-3xl font-bold text-km">{stats.kmDriven} km</p>
                <p className="text-xs text-muted mt-1">{stats.consumption} kWh/100km</p>
            </div>

            {/* Risparmio */}
            <div className="card-soft border border-saving/40">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💰</span>
                    <h3 className="text-sm text-saving font-semibold">Risparmio</h3>
                </div>
                <p className="text-2xl font-bold text-saving">€{stats.gasolineSavings}</p>
                <p className="text-xs text-muted mt-1">vs benzina</p>
            </div>
        </div>
    );
}

// ==========================================
// LISTA RICARICHE
// ==========================================
function ChargeList({ charges, onDelete }) {
    if (!charges || charges.length === 0) {
        return <div className="p-8 text-center text-muted card">Nessuna ricarica registrata per questa auto.</div>;
    }

    return (
        <div className="card overflow-hidden">
            <div className="divide-y divide-card-border">
                {charges.map(charge => (
                    <div key={charge.id} className="p-4 hover:bg-card-soft transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span>📅</span>
                                    <span className="text-sm text-muted">
                                        {new Date(charge.date).toLocaleDateString("it-IT", {
                                            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-saving font-semibold">{charge.supplier_name}</span>
                                    <span className="text-muted">({charge.supplier_type})</span>
                                </div>
                            </div>
                            <button onClick={() => onDelete(charge.id)} className="text-negative hover:text-negative/80 text-xl">
                                🗑️
                            </button>
                        </div>

                        {/* Dettagli */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                                <span className="text-muted">Km:</span>
                                <span className="ml-2 font-semibold text-km">{parseFloat(charge.total_km).toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-muted">kWh:</span>
                                <span className="ml-2 font-semibold text-kwh">{charge.kwh_added || "---"}</span>
                            </div>
                            <div>
                                <span className="text-muted">Costo:</span>
                                <span className="ml-2 font-semibold text-saving">€{parseFloat(charge.cost || 0).toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-muted">Consumo:</span>
                                <span className="ml-2 font-semibold text-kwh">
                                    {charge.consumption ? parseFloat(charge.consumption).toFixed(2) + " kWh%" : "---"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
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