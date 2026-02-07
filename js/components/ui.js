// js/components/ui.js
// Componenti Grafici per EV Tracker

// ==========================================
// SKELETON LOADER
// ==========================================
function SkeletonLoader() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Skeleton Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton skeleton-card"></div>
                ))}
            </div>
            
            {/* Skeleton List */}
            <div className="card">
                <div className="skeleton skeleton-title"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton skeleton-text"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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
// STATS CARDS (Le card in alto)
// ==========================================
function StatsCards({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
            {/* 1. Energia & Costo */}
            <div className="card hover-card">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Totale Speso</div>
                        <div className="text-3xl sm:text-2xl font-bold text-saving">€{stats.totalCost}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Energia</div>
                        <div className="text-xl sm:text-xl font-bold text-kwh">{parseFloat(stats.totalKwh).toFixed(0)} <span className="text-xs sm:text-sm">kWh</span></div>
                    </div>
                </div>
            </div>

            {/* 2. Km & Consumo */}
            <div className="card hover-card">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Strada fatta</div>
                        <div className="text-3xl sm:text-2xl font-bold text-km">{stats.kmDriven} <span className="text-sm">km</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Consumo</div>
                        <div className="text-xl sm:text-xl font-bold text-kwh">{stats.consumption}</div>
                    </div>
                </div>
            </div>

            {/* 3. Risparmio vs Benzina & Diesel */}
            <div className="card hover-card bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30">
                <div className="text-xs sm:text-sm text-emerald-400 mb-3 font-bold flex items-center gap-2">
                    <span className="text-lg">💰</span> Risparmio Reale
                </div>
                
                <div className="grid grid-cols-2 gap-0 relative">
                    <div className="absolute left-1/2 top-1 bottom-1 w-px bg-slate-700/50 -translate-x-1/2"></div>

                    {/* Colonna Benzina */}
                    <div className="text-center pr-1">
                        <div className="text-2xl sm:text-xl font-bold text-white truncate">€{stats.gasolineSavings}</div>
                        <div className="text-[10px] sm:text-[9px] uppercase tracking-wider text-emerald-200/70 mt-1.5">Benzina</div>
                    </div>

                    {/* Colonna Diesel */}
                    <div className="text-center pl-1">
                        <div className="text-2xl sm:text-xl font-bold text-white truncate">€{stats.dieselSavings}</div>
                        <div className="text-[10px] sm:text-[9px] uppercase tracking-wider text-cyan-200/70 mt-1.5">Diesel</div>
                    </div>
                </div>
            </div>

            {/* 4. ECO IMPACT (Alberi) */}
            <div className="card hover-card bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🌳</div>
                
                <div className="text-xs sm:text-sm text-green-300 mb-2 font-bold flex items-center gap-1">
                    <span className="text-lg">🌍</span> Impatto Green
                </div>
                <div className="flex items-end gap-2">
                    <div className="text-4xl sm:text-3xl font-bold text-white">{stats.treesSaved}</div>
                    <div className="text-sm text-green-200 mb-1.5">Alberi 🌲</div>
                </div>
                <div className="text-xs text-green-400/70 mt-2">
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
        return (
            <div className="p-8 text-center card">
                <div className="text-5xl mb-4 opacity-30">⚡</div>
                <p className="text-muted">Nessuna ricarica registrata.</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <div className="divide-y divide-card-border">
                {charges.map(charge => {
                    const power = calculateAveragePower(charge.kwh_added, charge.date, charge.end_date);
                    
                    return (
                        <div key={charge.id} className="p-4 hover:bg-card-soft transition-all duration-200 group relative">
                            {/* Hover indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Badge Tipo con animazione */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 group-hover:scale-110
                                        ${charge.supplier_type === 'DC' 
                                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' 
                                            : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                                        }`}>
                                        {charge.supplier_type}
                                    </div>
                                    
                                    <div>
                                        <div className="font-bold text-base text-white mb-0.5">{charge.supplier_name}</div>
                                        <div className="text-xs text-muted flex items-center gap-1">
                                            📅 {new Date(charge.date).toLocaleDateString("it-IT", {
                                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => onDelete(charge.id)} 
                                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-125 text-negative p-2 rounded-lg hover:bg-red-500/10"
                                    aria-label="Elimina ricarica"
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* Griglia Dati con icone */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-kwh transition-colors">
                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">
                                        ⚡ kWh
                                    </div>
                                    <div className="font-bold text-lg text-kwh">{parseFloat(charge.kwh_added).toFixed(1)}</div>
                                </div>
                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-saving transition-colors">
                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">
                                        💰 Costo
                                    </div>
                                    <div className="font-bold text-lg text-saving">€{parseFloat(charge.cost).toFixed(2)}</div>
                                </div>
                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-km transition-colors">
                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">
                                        🛣️ Km
                                    </div>
                                    <div className="font-bold text-lg text-km">
                                        {charge.km_since_last ? parseFloat(charge.km_since_last).toFixed(0) : "-"}
                                    </div>
                                </div>
                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-orange-400 transition-colors">
                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">
                                        ⚙️ Velocità
                                    </div>
                                    <div className="font-bold text-lg text-orange-300">
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
                    <label className="block text-muted mb-2 font-semibold">🎨 Tema Grafico</label>
                    <select
                        className="input-field"
                        value={settings.theme || "theme-default"}
                        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    >
                        <option value="theme-auto">🌓 Auto (Segui Sistema)</option>
                        <option value="theme-default">✨ Default</option>
                        <option value="theme-dark">🌙 Dark</option>
                        <option value="theme-light">☀️ Light</option>
                        <option value="theme-emerald">💎 Emerald</option>
                        <option value="theme-neon">🔮 Neon</option>
                        <option value="theme-nord">❄️ Nord</option>
                        <option value="theme-cyber">🤖 Cyber</option>
                        <option value="theme-sunset">🌅 Sunset</option>
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

// ==========================================
// ACTIVE CHARGING SESSION BOX (Migliorato)
// ==========================================
function ActiveChargingBox({ activeSession, onStopClick }) {
    const [elapsedTime, setElapsedTime] = React.useState('');

    React.useEffect(() => {
        const updateTimer = () => {
            // Parsing più robusto della data
            let start = new Date(activeSession.date);
            
            // Verifica se la data è valida
            if (isNaN(start.getTime())) {
                // Tentativo di parsing alternativo
                start = new Date(activeSession.date.replace(' ', 'T'));
            }
            
            const now = new Date();
            const diff = Math.floor((now - start) / 1000);
            
            // Assicurati che diff sia positivo
            const safeDiff = Math.max(0, diff);
            
            const hours = Math.floor(safeDiff / 3600);
            const minutes = Math.floor((safeDiff % 3600) / 60);
            const seconds = safeDiff % 60;
            
            setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    return (
        <div className="relative bg-gradient-to-br from-emerald-900/50 via-green-900/40 to-cyan-900/50 border-2 border-emerald-400/60 rounded-3xl p-8 mb-8 text-center overflow-hidden animate-pulse-glow animate-scale-in">
            {/* Sfondo animato */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
            
            <div className="relative z-10">
                {/* Icona pulsante */}
                <div className="inline-block mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-4xl shadow-2xl animate-pulse">
                        ⚡
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    Ricarica in Corso
                </h2>
                
                {/* Timer live */}
                <div className="inline-block bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4">
                    <div className="text-emerald-300 text-sm font-medium mb-1">Tempo trascorso</div>
                    <div className="text-4xl font-mono font-bold text-white tabular-nums tracking-wider">
                        {elapsedTime}
                    </div>
                </div>

                {/* Info sessione */}
                <div className="flex justify-center gap-6 mb-6 flex-wrap">
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-xs text-emerald-300/80 mb-1">Inizio</div>
                        <div className="text-sm font-bold text-white">
                            {new Date(activeSession.date).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-xs text-emerald-300/80 mb-1">Batteria iniziale</div>
                        <div className="text-sm font-bold text-white">
                            {activeSession.battery_start}%
                        </div>
                    </div>
                </div>

                {/* Progress bar simulata */}
                <div className="mb-6 max-w-md mx-auto">
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 rounded-full animate-pulse" 
                             style={{width: `${Math.min(activeSession.battery_start + 10, 100)}%`}}>
                        </div>
                    </div>
                </div>

                {/* Pulsante stop */}
                <button 
                    onClick={onStopClick}
                    className="btn bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-xl px-10 py-4 shadow-2xl border-2 border-red-400/30"
                >
                    <span className="flex items-center gap-2">
                        <span>⏹</span>
                        <span>Termina Ricarica</span>
                    </span>
                </button>
            </div>
        </div>
    );
}