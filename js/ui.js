// js/components/ui.js
// Componenti Grafici per EV Tracker — FIX DEFINITIVO UI & LOGICA

// ==========================================
// SKELETON LOADER
// ==========================================
function SkeletonLoader() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton skeleton-card"></div>
                ))}
            </div>
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
// LISTA RICARICHE (CORRETTA)
// ==========================================
function ChargeList({ charges, onDelete }) {
    // 1. HOOKS PRIMA DI TUTTO (Fix crash React "Rendered fewer hooks")
    const [expandedMonths, setExpandedMonths] = React.useState({});

    // Raggruppa ricariche per Anno/Mese
    const groupedCharges = React.useMemo(() => {
        if (!charges || charges.length === 0) return []; 

        const groups = {};

        charges.forEach(charge => {
            const date = new Date(charge.date);
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-11
            const key = `${year}-${month}`;

            if (!groups[key]) {
                groups[key] = {
                    year,
                    month,
                    monthName: date.toLocaleDateString('it-IT', { month: 'long' }),
                    charges: [],
                    totalCost: 0,
                    totalKwh: 0,
                    count: 0
                };
            }

            groups[key].charges.push(charge);
            groups[key].totalCost += parseFloat(charge.cost) || 0;
            groups[key].totalKwh += parseFloat(charge.kwh_added) || 0;
            groups[key].count++;
        });

        return Object.entries(groups)
            .sort((a, b) => {
                const [yearA, monthA] = a[0].split('-').map(Number);
                const [yearB, monthB] = b[0].split('-').map(Number);
                if (yearA !== yearB) return yearB - yearA;
                return monthB - monthA;
            })
            .map(([key, data]) => ({ key, ...data }));
    }, [charges]);

    // Auto-espandi il mese più recente
    React.useEffect(() => {
        if (groupedCharges.length > 0 && Object.keys(expandedMonths).length === 0) {
            setExpandedMonths({ [groupedCharges[0].key]: true });
        }
    }, [groupedCharges]);

    // 2. RETURN ANTICIPATO (Conditional Rendering)
    if (!charges || charges.length === 0) {
        return (
            <div className="p-8 text-center card">
                <div className="text-5xl mb-4 opacity-30">⚡</div>
                <p className="text-muted">Nessuna ricarica registrata.</p>
            </div>
        );
    }

    const toggleMonth = (key) => {
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        const allExpanded = {};
        groupedCharges.forEach(g => allExpanded[g.key] = true);
        setExpandedMonths(allExpanded);
    };

    const collapseAll = () => {
        setExpandedMonths({});
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button onClick={expandAll} className="text-xs px-3 py-1.5 rounded-lg bg-card-soft hover:bg-card border border-card-border text-muted hover:text-accent transition-all">📂 Espandi tutto</button>
                <button onClick={collapseAll} className="text-xs px-3 py-1.5 rounded-lg bg-card-soft hover:bg-card border border-card-border text-muted hover:text-accent transition-all">📁 Comprimi tutto</button>
            </div>

            {groupedCharges.map(group => {
                const isExpanded = expandedMonths[group.key];

                return (
                    <div key={group.key} className="card overflow-hidden">
                        <button
                            onClick={() => toggleMonth(group.key)}
                            className="w-full p-4 flex items-center justify-between hover:bg-card-soft transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`text-2xl transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white capitalize">{group.monthName} {group.year}</h3>
                                    <p className="text-xs text-muted">{group.count} ricarich{group.count === 1 ? 'a' : 'e'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mr-2">
                                <div className="text-right">
                                    <div className="text-xs text-muted">Totale kWh</div>
                                    <div className="font-bold text-kwh">{group.totalKwh.toFixed(1)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted">Totale Speso</div>
                                    <div className="font-bold text-saving text-lg">€{group.totalCost.toFixed(2)}</div>
                                </div>
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="divide-y divide-card-border animate-fade-in">
                                {group.charges.map(charge => {
                                    // LOGICA ESTRATTA: Calcoli fatti PRIMA del render per sicurezza
                                    const power = calculateAveragePower(charge.kwh_added, charge.date, charge.end_date);
                                    
                                    const supplierName = charge.supplier_name || "";
                                    const lowerName = supplierName.toLowerCase();
                                    
                                    // 1. Determina se è Casa o Fotovoltaico
                                    const isHomeOrSolar = lowerName.includes('casa') || 
                                                          lowerName.includes('solar') || 
                                                          lowerName.includes('fotovoltaico');

                                    // 2. Calcola la differenza (solo se non è casa e c'è uno standard cost)
                                    let diffBlock = null;
                                    const standardCost = parseFloat(charge.standard_cost_snapshot || 0);

                                    if (!isHomeOrSolar && standardCost > 0) {
                                        const actualCost = parseFloat(charge.cost || 0);
                                        const kwhAdded = parseFloat(charge.kwh_added || 0);
                                        const wouldBeCost = kwhAdded * standardCost;
                                        const difference = actualCost - wouldBeCost;

                                        // MOSTRA SOLO SE la differenza è maggiore di 5 centesimi (evita lo 0.00)
                                        if (Math.abs(difference) > 0.05) {
                                            const isSaving = difference < 0;
                                            const diffAbs = Math.abs(difference).toFixed(2);
                                            const percent = ((difference / wouldBeCost) * 100).toFixed(1);
                                            
                                            // Crea il blocco HTML qui
                                            diffBlock = (
                                                <div className={`mt-3 p-3 rounded-lg border-2 transition-all ${isSaving ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">{isSaving ? '💰' : '⚠️'}</span>
                                                            <div>
                                                                <div className="text-xs text-muted font-medium">vs Costo Standard (€{standardCost.toFixed(3)}/kWh)</div>
                                                                <div className={`text-sm font-bold ${isSaving ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {isSaving ? 'Risparmiato' : 'Pagato in più'}: <span className="text-lg ml-1">{isSaving ? '-' : '+'}€{diffAbs}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-muted">Sarebbe stato</div>
                                                            <div className="text-sm font-mono font-semibold text-slate-300">€{wouldBeCost.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${isSaving ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`} style={{ width: `${Math.min(Math.abs((difference / wouldBeCost) * 100), 100)}%` }} />
                                                    </div>
                                                    <div className="text-xs text-muted mt-1 text-center">{percent}% {isSaving ? ' di sconto' : ' in più'}</div>
                                                </div>
                                            );
                                        }
                                    }
                                    
                                    return (
                                        <div key={charge.id} className="p-4 hover:bg-card-soft transition-all duration-200 group relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 group-hover:scale-110
                                                        ${charge.supplier_type === 'DC' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'}`}>
                                                        {charge.supplier_type}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-base text-white mb-0.5">{charge.supplier_name}</div>
                                                        <div className="text-xs text-muted flex items-center gap-1">
                                                            📅 {new Date(charge.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => onDelete(charge.id)} className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-125 text-negative p-2 rounded-lg hover:bg-red-500/10">🗑️</button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-kwh transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">⚡ kWh</div>
                                                    <div className="font-bold text-lg text-kwh">{parseFloat(charge.kwh_added).toFixed(1)}</div>
                                                </div>
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-saving transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">💰 Costo</div>
                                                    <div className="font-bold text-lg text-saving">€{parseFloat(charge.cost).toFixed(2)}</div>
                                                </div>
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-km transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">🛣️ Km</div>
                                                    <div className="font-bold text-lg text-km">{charge.km_since_last ? parseFloat(charge.km_since_last).toFixed(0) : "-"}</div>
                                                </div>
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-orange-400 transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">⚙️ Velocità</div>
                                                    <div className="font-bold text-lg text-orange-300">{power ? power + " kW" : "-"}</div>
                                                </div>
                                            </div>

                                            {/* RENDERIZZA IL BLOCCO DIFFERENZA SOLO SE CALCOLATO SOPRA */}
                                            {diffBlock}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ==========================================
// VIEW IMPOSTAZIONI COMPLETA (Con Toggle FunStats)
// ==========================================
function SettingsView({ settings, setSettings, saveSettings, vehicles, onAddVehicle, onEditVehicle, onDeleteVehicle, suppliers, onAddSupplier, onEditSupplier }) {
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

                {/* VISUALIZZAZIONE (NUOVA SEZIONE) */}
                <div className="mb-6 p-4 bg-card-soft rounded-xl border border-card-border">
                    <h3 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider">👁️ Visualizzazione</h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-text">Badge & Fun Stats</div>
                            <div className="text-xs text-muted">Mostra trofei e indice pizza/caffè</div>
                        </div>
                        {/* TOGGLE SWITCH */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.showFunStats !== false} // Default true se undefined
                                onChange={(e) => setSettings({ ...settings, showFunStats: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
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
                    <div>
                        <label className="label">☀️ Fotovoltaico (€/kWh)</label>
                        <input
                            type="number"
                            step="0.001"
                            className="input"
                            value={settings.solarElectricityPrice || 0}
                            onChange={e => setSettings({
                                ...settings,
                                solarElectricityPrice: parseFloat(e.target.value) || 0
                            })}
                        />
                        <p className="text-xs text-muted mt-1">
                            Costo simbolico pannelli solari (€0.00 se totalmente gratuito)
                        </p>
                    </div>
                </div>

                <button onClick={saveSettings} className="btn btn-primary mt-6 w-full">💾 Salva Impostazioni</button>
            </div>

            {/* COLONNA DX: Auto e Fornitori (INVARIATA) */}
            <div className="space-y-6">
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-km">🚘 Le tue Auto</h2>
                        <button onClick={onAddVehicle} className="btn btn-secondary px-2 py-1 text-sm">➕ Aggiungi</button>
                    </div>
                    <div className="space-y-2">
                        {vehicles.map(v => (
                            <div key={v.id} className="card-soft flex items-center justify-between p-3 group">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">🚗</div>
                                    <div>
                                        <div className="font-bold">{v.name}</div>
                                        <div className="text-xs text-muted">{v.brand} · {v.capacity_kwh} kWh</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => onEditVehicle(v)}
                                        className="p-2 text-muted hover:text-accent hover:bg-emerald-500/10 rounded-lg transition-all"
                                        title="Modifica Auto"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => onDeleteVehicle(v)}
                                        className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Elimina Auto"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-saving">🏪 Fornitori</h2>
                        <button onClick={onAddSupplier} className="btn btn-secondary px-2 py-1 text-sm">➕ Aggiungi</button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {suppliers.map(s => (
                            <div key={s.id} className="card-soft p-3 hover:bg-card transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{s.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'DC' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {s.type}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onEditSupplier(s)}
                                        className="text-xs text-accent hover:text-accent-2 font-medium"
                                    >
                                        ✏️ Modifica
                                    </button>
                                </div>
                                <div className="text-xs text-muted">
                                    Costo standard: <span className="text-saving font-bold">€{parseFloat(s.standard_cost).toFixed(3)}/kWh</span>
                                </div>
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
    if (!charges || charges.length < 2) return <div className="text-center p-10 text-muted">Servono almeno 2 ricariche per i grafici.</div>;

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap gap-2 mb-6 text-xs justify-center">
                <button className={`toggle-btn ${options.showCost ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showCost: !o.showCost }))}>💵 Costo</button>
                <button className={`toggle-btn ${options.showKwh ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showKwh: !o.showKwh }))}>⚡ kWh</button>
                <button className={`toggle-btn ${options.showConsumption ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showConsumption: !o.showConsumption }))}>🚗 Consumo</button>
                <button className={`toggle-btn ${options.showTrend ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showTrend: !o.showTrend }))}>📈 Trend</button>
                <button className={`toggle-btn ${options.showACDC ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showACDC: !o.showACDC }))}>⚡ AC/DC</button>
                <button className={`toggle-btn ${options.showSuppliers ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showSuppliers: !o.showSuppliers }))}>🏪 Fornitori</button>
            </div>

            {options.showCost && <CostChart charges={charges} theme={theme} />}
            {options.showKwh && <KwhChart charges={charges} theme={theme} />}
            {options.showConsumption && <ConsumptionChart charges={charges} theme={theme} />}
            {options.showTrend && <CostTrendChart charges={charges} theme={theme} />}
            {options.showACDC && <ACvsDCChart charges={charges} theme={theme} />}
            {options.showSuppliers && <SuppliersPieChart charges={charges} theme={theme} />}
        </div>
    );
}

// ==========================================
// ACTIVE CHARGING SESSION BOX
// ==========================================
function ActiveChargingBox({ activeSession, onStopClick, onCancelClick }) {
    const [elapsedTime, setElapsedTime] = React.useState('');

    React.useEffect(() => {
        const updateTimer = () => {
            let start = new Date(activeSession.date);
            if (isNaN(start.getTime())) start = new Date(activeSession.date.replace(' ', 'T'));
            const now = new Date();
            const diff = Math.floor((now - start) / 1000);
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
            <div className="relative z-10">
                <div className="inline-block mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-4xl shadow-2xl animate-pulse">⚡</div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Ricarica in Corso</h2>
                <div className="inline-block bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4">
                    <div className="text-emerald-300 text-sm font-medium mb-1">Tempo trascorso</div>
                    <div className="text-4xl font-mono font-bold text-white tabular-nums tracking-wider">{elapsedTime}</div>
                </div>
                <div className="flex justify-center gap-6 mb-6 flex-wrap">
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-xs text-emerald-300/80 mb-1">Inizio</div>
                        <div className="text-sm font-bold text-white">{new Date(activeSession.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-xs text-emerald-300/80 mb-1">Batteria iniziale</div>
                        <div className="text-sm font-bold text-white">{activeSession.battery_start}%</div>
                    </div>
                </div>
                <div className="mb-6 max-w-md mx-auto">
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 rounded-full animate-pulse" style={{ width: `${Math.min(activeSession.battery_start + 10, 100)}%` }}></div>
                    </div>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                    <button onClick={onStopClick} className="btn bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg px-8 py-3 shadow-2xl border-2 border-red-400/30">
                        <span className="flex items-center gap-2"><span>⏹</span><span>Termina Ricarica</span></span>
                    </button>
                    <button onClick={onCancelClick} className="btn bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm px-6 py-3 shadow-lg border border-gray-500/50">
                        <span className="flex items-center gap-2"><span>❌</span><span>Annulla</span></span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// FUN STATS & BADGES (Fixed & Tamed)
// ==========================================
function FunStats({ stats, charges }) {
    if (!stats || !charges) return null;

    // 1. Calcolo Badge
    const badges = [];
    const totalKm = parseFloat(stats.kmDriven);
    const solarCharges = charges.filter(c => c.supplier_name && (c.supplier_name.toLowerCase().includes('fotovoltaico') || c.supplier_name.toLowerCase().includes('solar'))).length;
    const avgCost = parseFloat(stats.avgCostPerKwh);

    // BADGE DI BASE (Appare sempre, così vedi la striscia)
    badges.push({ icon: "👋", title: "Benvenuto", desc: "Inizia il viaggio!" });

    // SOGLIE ABBASSATE PER VEDERE I RISULTATI
    if (totalKm > 100) badges.push({ icon: "🥉", title: "Viaggiatore", desc: "Primi 100 km andati!" });
    if (totalKm > 1000) badges.push({ icon: "🥈", title: "Esploratore", desc: "Oltre 1.000 km!" });
    if (totalKm > 10000) badges.push({ icon: "🏎️", title: "Maratoneta", desc: "Giro del mondo?" });
    
    if (solarCharges > 0) badges.push({ icon: "☀️", title: "Green", desc: "Prima ricarica solare" });
    if (solarCharges > 10) badges.push({ icon: "😎", title: "Re del Sole", desc: "Sfrutti l'energia pulita" });
    
    if (avgCost < 0.20 && totalKm > 50) badges.push({ icon: "🦊", title: "Volpe", desc: "Spendaccione? No!" });
    if (charges.length >= 1) badges.push({ icon: "🔋", title: "Start", desc: "Prima ricarica fatta" });
    if (charges.length > 20) badges.push({ icon: "🔌", title: "Veterano", desc: "Più di 20 ricariche" });

    // 2. Calcolo "Pizza Index"
    const savings = parseFloat(stats.gasolineSavings);
    const pizzaPrice = 8.50; 
    const coffeePrice = 1.20; 
    const netflixPrice = 13.00; 

    const pizzas = Math.floor(savings / pizzaPrice);
    const coffees = Math.floor(savings / coffeePrice);
    const monthsNetflix = (savings / netflixPrice).toFixed(1);

    // Se non c'è risparmio (o è negativo), non mostrare la card Pizza ma mostra i badge se ci sono
    const showPizza = savings > 0;

    return (
        <div className="space-y-6 animate-fade-in mb-8">
            
            {/* BADGES ROW - Scroll orizzontale */}
            {badges.length > 0 && (
                <div className="overflow-x-auto pb-2"> {/* Padding bottom per l'ombra */}
                    <h3 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider sticky left-0">🏆 I tuoi Traguardi</h3>
                    <div className="flex gap-4">
                        {badges.map((b, idx) => (
                            <div 
                                key={idx} 
                                className="min-w-[130px] card-soft p-3 rounded-xl border border-card-border text-center flex flex-col items-center justify-center shadow-lg transform transition active:scale-95"
                                style={{ backgroundColor: 'var(--card)' }} // Forza background card per coprire lo scroll
                            >
                                <div className="text-3xl mb-2">{b.icon}</div>
                                <div className="font-bold text-xs mb-1 truncate w-full" style={{ color: 'var(--accent)' }}>
                                    {b.title}
                                </div>
                                <div className="text-[10px] text-muted leading-tight">{b.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PIZZA / SAVINGS CARD (TEMATIZZATA) */}
            {showPizza && (
                <div 
                    className="card relative overflow-hidden border-2"
                    style={{
                        borderColor: 'var(--card-border)',
                        borderTopColor: 'var(--accent)' // Solo bordo sopra colorato
                    }}
                >
                    {/* Sfondo sfumato leggero */}
                    <div 
                        className="absolute inset-0 opacity-5"
                        style={{
                            background: `linear-gradient(to right, var(--accent), transparent)`
                        }}
                    ></div>

                    <div className="relative z-10">
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 rotate-12 grayscale">🍕</div>
                        
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--accent-2)' }}>
                            <span className="text-2xl">😎</span> 
                            Risparmio reale: {parseFloat(stats.gasolineSavings).toFixed(0)}€
                        </h3>
                        <p className="text-xs text-muted mb-4">
                            Equivalgono a circa:
                        </p>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-card-soft p-2 rounded-xl text-center backdrop-blur-sm border border-card-border">
                                <div className="text-xl mb-1">🍕</div>
                                <div className="text-lg font-bold text-primary">{pizzas}</div>
                                <div className="text-[10px] text-muted uppercase">Pizze</div>
                            </div>
                            <div className="bg-card-soft p-2 rounded-xl text-center backdrop-blur-sm border border-card-border">
                                <div className="text-xl mb-1">☕</div>
                                <div className="text-lg font-bold text-primary">{coffees}</div>
                                <div className="text-[10px] text-muted uppercase">Caffè</div>
                            </div>
                            <div className="bg-card-soft p-2 rounded-xl text-center backdrop-blur-sm border border-card-border">
                                <div className="text-xl mb-1">📺</div>
                                <div className="text-lg font-bold text-primary">{monthsNetflix}</div>
                                <div className="text-[10px] text-muted uppercase">Mesi TV</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}