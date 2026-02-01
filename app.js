// app.js
// EV Cost Tracker – versione modulare (React UMD + GitHub Pages)

// ==========================================
// SUPABASE INIT
// ==========================================
const SUPABASE_URL = "https://hcmyzwkgzyqxogzakpxc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXl6d2tnenlxeG9nemFrcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM2NTEsImV4cCI6MjA4NTM3OTY1MX0.2kK1ocMpoEJgOn31sDYQeYcwpcxmkZuHzq39ZQAMkGw";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// COMPONENTE PRINCIPALE
// ==========================================
function EVCostTracker() {
    const [view, setView] = React.useState("dashboard");
    const [isSyncing, setIsSyncing] = React.useState(false);

    const [charges, setCharges] = React.useState([]);
    const [suppliers, setSuppliers] = React.useState([]);

    const [settings, setSettings] = React.useState({
        gasolinePrice: 1.9,
        gasolineConsumption: 15,
        dieselPrice: 1.8,
        dieselConsumption: 18,
        homeElectricityPrice: 0.25
    });

    const [newCharge, setNewCharge] = React.useState({
        date: "",
        totalKm: "",
        kWhAdded: "",
        supplier: "",
        cost: ""
    });

    const [newSupplier, setNewSupplier] = React.useState({
        name: "",
        type: "AC",
        standardCost: ""
    });

    const [showAddCharge, setShowAddCharge] = React.useState(false);
    const [showAddSupplier, setShowAddSupplier] = React.useState(false);

    const [chartOptions, setChartOptions] = React.useState({
        showCost: true,
        showKwh: true,
        showConsumption: true,
        showEurKwh: true,
        showEur100km: true
    });

    // ==========================================
    // LOAD SETTINGS (localStorage)
    // ==========================================
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem("ev_settings");
            if (saved) setSettings(JSON.parse(saved));
        } catch (e) {
            console.warn("Impossibile leggere le impostazioni", e);
        }
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem("ev_settings", JSON.stringify(settings));
        } catch (e) {
            console.warn("Impossibile salvare le impostazioni", e);
        }
    }, [settings]);

    React.useEffect(() => {
    const saved = localStorage.getItem("ev_settings");
    if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);

        // Applica il tema salvato al body
        if (parsed.theme) {
            document.body.className = parsed.theme;
        } else {
            document.body.className = "theme-default";
        }
    } else {
        document.body.className = "theme-default";
    }
}, []);




    // ==========================================
    // LOAD DATA (Supabase)
    // ==========================================
    async function loadData() {
        setIsSyncing(true);

        const [suppliersList, chargesList] = await Promise.all([
            loadSuppliers(supabaseClient),
            loadCharges(supabaseClient)
        ]);

        setSuppliers(suppliersList);
        setCharges(chargesList);

        setIsSyncing(false);
    }

    React.useEffect(() => {
        loadData();
    }, []);

    // ==========================================
    // HANDLER: SALVA IMPOSTAZIONI
    // ==========================================
    function saveSettings() {
        // già gestito da useEffect
    }

    // ==========================================
    // HANDLER: SALVA RICARICA
    // ==========================================
    async function handleSaveCharge() {
        setIsSyncing(true);

        const ok = await saveChargeToDB(
            supabaseClient,
            newCharge,
            suppliers,
            settings,
            charges
        );

        if (ok) {
            setShowAddCharge(false);
            setNewCharge({
                date: "",
                totalKm: "",
                kWhAdded: "",
                supplier: "",
                cost: ""
            });
            await loadData();
        }

        setIsSyncing(false);
    }

    // ==========================================
    // HANDLER: ELIMINA RICARICA
    // ==========================================
    async function deleteCharge(id) {
        setIsSyncing(true);
        const ok = await deleteChargeFromDB(supabaseClient, id);
        if (ok) await loadData();
        setIsSyncing(false);
    }

    // ==========================================
    // HANDLER: SALVA FORNITORE
    // ==========================================
    async function handleSaveSupplier() {
        setIsSyncing(true);

        const ok = await saveSupplier(supabaseClient, newSupplier);
        if (ok) {
            setShowAddSupplier(false);
            setNewSupplier({ name: "", type: "AC", standardCost: "" });
            await loadData();
        }

        setIsSyncing(false);
    }

    // ==========================================
    // HANDLER: ELIMINA FORNITORE
    // ==========================================
    async function handleDeleteSupplier(id) {
        setIsSyncing(true);
        const ok = await deleteSupplier(supabaseClient, id);
        if (ok) await loadData();
        setIsSyncing(false);
    }

    // ==========================================
    // DERIVATI: STATS, ANALYSIS, FORECAST
    // ==========================================
    const stats = React.useMemo(
        () => calculateStats(charges, settings),
        [charges, settings]
    );

    const analysis = React.useMemo(
        () => calculateAdvancedAnalysis(charges),
        [charges]
    );

    const forecast = React.useMemo(
        () => calculateForecast(charges),
        [charges]
    );

    const allConsumptions = React.useMemo(
        () => charges.filter(c => c.consumption).map(c => parseFloat(c.consumption)),
        [charges]
    );

    // ==========================================
    // RENDER PRINCIPALE — HEADER
    // ==========================================
    return (
        <div className="min-h-screen font-sans">
            <header className="bg-card-soft border-b border-card backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="card-soft p-2 rounded-xl text-2xl">
                            ⚡
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold">EV Cost Tracker</h1>

                            {isSyncing && (
                                <p className="text-xs text-saving">
                                    🔄 Sincronizzazione…
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setView("dashboard")}
                            className={`btn text-lg md:text-xl ${view === "dashboard" ? "btn-primary" : "btn-secondary"}`}
                            title="Dashboard"
                        >
                            📊
                        </button>

                        <button
                            onClick={() => setView("settings")}
                            className={`btn text-lg md:text-xl ${view === "settings" ? "btn-primary" : "btn-secondary"}`}
                            title="Impostazioni"
                        >
                            ⚙️
                        </button>

                        <button
                            onClick={() => setView("charts")}
                            className={`btn text-lg md:text-xl ${view === "charts" ? "btn-primary" : "btn-secondary"}`}
                            title="Grafici"
                        >
                            ⚡📈
                        </button>

                        <button
                            onClick={loadData}
                            disabled={isSyncing}
                            className="btn btn-secondary text-lg md:text-xl"
                            title="Ricarica dati"
                        >
                            🔄
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="max-w-7xl mx-auto px-4 py-8">

                {/* ====================================== */}
                {/* DASHBOARD */}
                {/* ====================================== */}
                {view === "dashboard" && (
                    <>
                        {/* STATISTICHE */}
                        {stats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">

                                {/* Energia Totale */}
                                <div className="card">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">⚡</span>
                                        <h3 className="text-sm text-saving font-semibold">
                                            Energia Totale
                                        </h3>
                                    </div>

                                    <p className="text-3xl font-bold text-kwh">
                                        {stats.totalKwh} kWh
                                    </p>

                                    <p className="text-xs text-muted mt-1">
                                        {stats.chargesCount} ricariche
                                    </p>
                                </div>

                                {/* Costo Totale */}
                                <div className="card">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">€</span>
                                        <h3 className="text-sm text-kwh font-semibold">
                                            Costo Totale
                                        </h3>
                                    </div>

                                    <p className="text-3xl font-bold text-kwh">
                                        €{stats.totalCost}
                                    </p>

                                    <p className="text-xs text-muted mt-1">
                                        €{stats.avgCostPerKwh}/kWh medio
                                    </p>
                                </div>

                                {/* Km Percorsi */}
                                <div className="card">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">🚗</span>
                                        <h3 className="text-sm text-km font-semibold">
                                            Km Percorsi
                                        </h3>
                                    </div>

                                    <p className="text-3xl font-bold text-km">
                                        {stats.kmDriven} km
                                    </p>

                                    <p className="text-xs text-muted mt-1">
                                        {stats.consumption} kWh/100km
                                    </p>
                                </div>

                                {/* Risparmio */}
                                <div className="card-soft border border-saving/40">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">💰</span>
                                        <h3 className="text-sm text-saving font-semibold">
                                            Risparmio
                                        </h3>
                                    </div>

                                    <p className="text-2xl font-bold text-saving">
                                        €{stats.gasolineSavings}
                                    </p>

                                    <p className="text-xs text-muted mt-1">
                                        vs benzina
                                    </p>

                                    <p className="text-sm text-saving mt-2">
                                        €{stats.dieselSavings} vs diesel
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ANALISI AVANZATA */}
                        {analysis && (
                            <div className="card mb-8 animate-fade-in">
                                <h3 className="text-xl font-bold text-saving mb-4 flex items-center gap-2">
                                    🧠 Analisi Avanzata
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                                    {/* Miglior consumo */}
                                    <div className="card-soft border border-card">
                                        <p className="text-muted text-xs mb-1">Migliore</p>
                                        <p className="text-saving text-xl font-bold">
                                            {analysis.best.toFixed(2)}
                                        </p>
                                        <p className="text-muted text-xs">kWh/100km</p>
                                    </div>

                                    {/* Peggior consumo */}
                                    <div className="card-soft border border-card">
                                        <p className="text-muted text-xs mb-1">Peggiore</p>
                                        <p className="text-negative text-xl font-bold">
                                            {analysis.worst.toFixed(2)}
                                        </p>
                                        <p className="text-muted text-xs">kWh/100km</p>
                                    </div>

                                    {/* Media ultime 5 */}
                                    <div className="card-soft border border-card">
                                        <p className="text-muted text-xs mb-1">Ultime 5</p>
                                        <p className="text-kwh text-xl font-bold">
                                            {analysis.avgLast5.toFixed(2)}
                                        </p>
                                        <p className="text-muted text-xs">kWh/100km</p>
                                    </div>

                                    {/* Trend */}
                                    <div className="card-soft border border-card flex flex-col">
                                        <p className="text-muted text-xs mb-1">Trend</p>

                                        <p
                                            className={`text-xl font-bold ${analysis.trend < 0
                                                ? "text-saving"
                                                : analysis.trend > 0
                                                    ? "text-negative"
                                                    : "text-forecast"
                                                }`}
                                        >
                                            {analysis.trend < 0 ? "↓" : analysis.trend > 0 ? "↑" : "→"}
                                            {Math.abs(analysis.trend).toFixed(2)}
                                        </p>

                                        <p className="text-muted text-xs">vs media</p>
                                    </div>
                                </div>

                                {/* Efficienza + commento */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-muted text-sm">Efficienza personale</span>
                                        <span className="text-saving font-bold">
                                            {analysis.efficiency.toFixed(0)}%
                                        </span>
                                    </div>

                                    <div className="text-muted text-sm italic">
                                        {analysis.comment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PREVISIONI */}
                        {forecast && (
                            <div className="card mb-8 animate-fade-in">
                                <h3 className="text-xl font-bold text-forecast mb-4 flex items-center gap-2">
                                    🔮 Previsioni Prossimo Mese
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

                                    {/* Costo previsto */}
                                    <div className="card-soft border border-card">
                                        <p className="text-muted text-xs mb-1">Costo previsto</p>
                                        <p className="text-forecast text-xl font-bold">
                                            €{forecast.forecastCost.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* kWh previsti */}
                                    <div className="card-soft border border-card">
                                        <p className="text-muted text-xs mb-1">kWh previsti</p>
                                        <p className="text-kwh text-xl font-bold">
                                            {forecast.forecastKwh.toFixed(1)} kWh
                                        </p>
                                    </div>

                                    {/* Km previsti */}
                                    <div className="card-soft border border-card">
                                        <p className="text-muted text-xs mb-1">Km previsti</p>
                                        <p className="text-km text-xl font-bold">
                                            {forecast.forecastKm.toFixed(0)} km
                                        </p>
                                    </div>
                                </div>

                                {/* Trend + commento */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-muted text-sm">Trend costi</span>

                                        <span
                                            className={`font-bold ${forecast.trend < 0
                                                ? "text-saving"
                                                : forecast.trend > 0
                                                    ? "text-negative"
                                                    : "text-forecast"
                                                }`}
                                        >
                                            {forecast.trend < 0 ? "↓" : forecast.trend > 0 ? "↑" : "→"}
                                            {Math.abs(forecast.trend).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="text-muted text-sm italic">
                                        {forecast.comment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PULSANTE AGGIUNGI RICARICA */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowAddCharge(true)}
                                disabled={isSyncing}
                                className="btn btn-primary w-full md:w-auto flex items-center justify-center gap-2 shadow-lg"
                            >
                                <span className="text-xl">➕</span>
                                Aggiungi Ricarica
                            </button>
                        </div>

                        {/* MODALE AGGIUNGI RICARICA */}
                        {showAddCharge && (
                            <AddChargeModal
                                newCharge={newCharge}
                                setNewCharge={setNewCharge}
                                suppliers={suppliers}
                                settings={settings}
                                isSyncing={isSyncing}
                                onClose={() => setShowAddCharge(false)}
                                onSave={handleSaveCharge}
                            />
                        )}

                        {/* LISTA RICARICHE */}
                        <div className="card overflow-hidden">
                            <div className="card-soft border-b border-card">
                                <h2 className="text-xl font-bold text-saving">
                                    📋 Storico Ricariche
                                </h2>
                            </div>

                            <div className="divide-y divide-card">
                                {charges.length === 0 ? (
                                    <div className="p-8 text-center text-muted">
                                        Nessuna ricarica registrata.
                                    </div>
                                ) : (
                                    charges.map(charge => (
                                        <div
                                            key={charge.id}
                                            className="p-4 hover:bg-card-soft transition-colors"
                                        >
                                            {/* Header ricarica */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span>📅</span>
                                                        <span className="text-sm text-muted">
                                                            {new Date(charge.date).toLocaleDateString(
                                                                "it-IT",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                }
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-saving font-semibold">
                                                            {charge.supplier_name}
                                                        </span>
                                                        <span className="text-muted">
                                                            ({charge.supplier_type})
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => deleteCharge(charge.id)}
                                                    disabled={isSyncing}
                                                    className="text-negative hover:text-negative/80 text-xl"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* Dettagli principali */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                                <div>
                                                    <span className="text-muted">Km totali:</span>
                                                    <span className="ml-2 font-semibold text-km">
                                                        {parseFloat(charge.total_km).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-muted">kWh:</span>
                                                    <span className="ml-2 font-semibold text-kwh">
                                                        {charge.kwh_added}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-muted">Costo:</span>
                                                    <span className="ml-2 font-semibold text-saving">
                                                        €{parseFloat(charge.cost).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-muted">€/kWh:</span>
                                                    <span className="ml-2 font-semibold">
                                                        {(
                                                            parseFloat(charge.cost) /
                                                            parseFloat(charge.kwh_added)
                                                        ).toFixed(3)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Km percorsi + Consumo con badge */}
                                            {(charge.km_since_last || charge.consumption) && (
                                                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">

                                                    {/* Km percorsi */}
                                                    <div>
                                                        {charge.km_since_last ? (
                                                            <>
                                                                <span className="text-muted">Km percorsi:</span>
                                                                <span className="ml-2 font-semibold text-km">
                                                                    {parseFloat(charge.km_since_last).toFixed(0)} km
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </div>

                                                    {/* Consumo + badge */}
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        {charge.consumption ? (
                                                            <>
                                                                <div>
                                                                    <span className="text-muted">Consumo:</span>
                                                                    <span className="ml-2 font-semibold text-kwh">
                                                                        {parseFloat(charge.consumption).toFixed(2)} kWh/100km
                                                                    </span>
                                                                </div>

                                                                {/* BADGE EFFICIENZA */}
                                                                {(() => {
                                                                    const badge = getEfficiencyBadge(
                                                                        parseFloat(charge.consumption),
                                                                        allConsumptions
                                                                    );

                                                                    return (
                                                                        <span className={`badge ${badge.bg} ${badge.color}`}>
                                                                            {badge.label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Differenza costo standard */}
                                            {charge.cost_difference !== null && (
                                                <div className="mt-3 pt-3 border-t border-card">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-muted">
                                                            Rispetto al costo standard (€
                                                            {parseFloat(charge.standard_cost).toFixed(3)}/kWh):
                                                        </span>

                                                        <span
                                                            className={`font-semibold ${parseFloat(charge.cost_difference) > 0
                                                                ? "text-negative"
                                                                : parseFloat(charge.cost_difference) < 0
                                                                    ? "text-saving"
                                                                    : "text-muted"
                                                                }`}
                                                        >
                                                            {parseFloat(charge.cost_difference) > 0 ? "+" : ""}
                                                            €{parseFloat(charge.cost_difference).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs text-muted mt-1">
                                                        Costo standard totale: €
                                                        {(
                                                            parseFloat(charge.kwh_added) *
                                                            parseFloat(charge.standard_cost)
                                                        ).toFixed(2)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ====================================== */}
                {/* IMPOSTAZIONI */}
                {/* ====================================== */}
                {view === "settings" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">

                        {/* Impostazioni costi e consumi */}
                        <div className="card">
                            <h2 className="text-xl font-bold text-saving mb-4">
                                ⚙️ Impostazioni Costi & Consumi
                            </h2>

                            {/* Selettore Tema */}
                            <div className="mb-4">
                                <label className="block text-muted mb-1">Tema</label>
                                <select
                                    className="input-field"
                                    value={settings.theme || "theme-default"}
                                    onChange={e => {
                                        const theme = e.target.value;
                                        document.body.className = theme;
                                        setSettings({ ...settings, theme });
                                    }}
                                >
                                    <option value="theme-default">Default</option>
                                    <option value="theme-dark">Dark</option>
                                    <option value="theme-light">Light</option>
                                    <option value="theme-emerald">Emerald</option>
                                    <option value="theme-neon">Neon</option>
                                    <option value="theme-nord">Nord</option>
                                    <option value="theme-solarized">Solarized</option>
                                    <option value="theme-material">Material</option>
                                    <option value="theme-cyber">Cyber</option>
                                    <option value="theme-sunset">Sunset</option>
                                </select>
                            </div>

                            <div className="space-y-4 text-sm">

                                {/* Benzina */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-muted mb-1">
                                            Prezzo Benzina (€/L)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.gasolinePrice}
                                            onChange={e =>
                                                setSettings({
                                                    ...settings,
                                                    gasolinePrice: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-muted mb-1">
                                            Consumo Benzina (km/L)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settings.gasolineConsumption}
                                            onChange={e =>
                                                setSettings({
                                                    ...settings,
                                                    gasolineConsumption: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                {/* Diesel */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-muted mb-1">
                                            Prezzo Diesel (€/L)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.dieselPrice}
                                            onChange={e =>
                                                setSettings({
                                                    ...settings,
                                                    dieselPrice: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-muted mb-1">
                                            Consumo Diesel (km/L)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settings.dieselConsumption}
                                            onChange={e =>
                                                setSettings({
                                                    ...settings,
                                                    dieselConsumption: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                {/* Casa */}
                                <div>
                                    <label className="block text-muted mb-1">
                                        Prezzo Energia Casa (€/kWh)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.homeElectricityPrice}
                                        onChange={e =>
                                            setSettings({
                                                ...settings,
                                                homeElectricityPrice: parseFloat(e.target.value) || 0
                                            })
                                        }
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveSettings}
                                disabled={isSyncing}
                                className="btn btn-primary mt-6 w-full"
                            >
                                {isSyncing ? "💾 Salvataggio..." : "💾 Salva Impostazioni"}
                            </button>
                        </div>

                        {/* Fornitori */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-saving">
                                    🏪 Fornitori
                                </h2>

                                <button
                                    onClick={() => setShowAddSupplier(true)}
                                    className="btn btn-secondary px-3 py-1.5 text-sm"
                                >
                                    ➕ Aggiungi
                                </button>
                            </div>

                            {suppliers.length === 0 ? (
                                <p className="text-muted text-sm">
                                    Nessun fornitore configurato.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {suppliers.map(s => (
                                        <div
                                            key={s.id}
                                            className="card-soft border border-card flex items-center justify-between px-3 py-2 text-sm"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-saving">
                                                        {s.name}
                                                    </span>
                                                    <span className="text-xs text-muted">
                                                        ({s.type})
                                                    </span>
                                                </div>

                                                <div className="text-xs text-muted mt-1">
                                                    Standard: €
                                                    {parseFloat(s.standard_cost || 0).toFixed(3)}
                                                    /kWh
                                                </div>
                                            </div>

                                            {s.name !== "Casa" && (
                                                <button
                                                    onClick={() => handleDeleteSupplier(s.id)}
                                                    disabled={isSyncing}
                                                    className="text-negative hover:text-negative/80 text-lg"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODALE NUOVO FORNITORE */}
                {showAddSupplier && (
                    <AddSupplierModal
                        newSupplier={newSupplier}
                        setNewSupplier={setNewSupplier}
                        isSyncing={isSyncing}
                        onClose={() => setShowAddSupplier(false)}
                        onSave={handleSaveSupplier}
                    />
                )}

                {/* ====================================== */}
                {/* GRAFICI */}
                {/* ====================================== */}
                {view === "charts" && (
                    <div className="animate-fade-in space-y-10">

                        {/* Toggle grafici */}
                        <div className="flex flex-wrap gap-2 mb-4 text-xs">
                            <button
                                className={`toggle-btn ${chartOptions.showCost ? "active" : ""}`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showCost: !o.showCost }))
                                }
                            >
                                💵 Costo
                            </button>

                            <button
                                className={`toggle-btn ${chartOptions.showKwh ? "active" : ""}`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showKwh: !o.showKwh }))
                                }
                            >
                                ⚡ kWh
                            </button>

                            <button
                                className={`toggle-btn ${chartOptions.showConsumption ? "active" : ""}`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showConsumption: !o.showConsumption }))
                                }
                            >
                                🚗 Consumo
                            </button>

                            <button
                                className={`toggle-btn ${chartOptions.showEurKwh ? "active" : ""}`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showEurKwh: !o.showEurKwh }))
                                }
                            >
                                💰 €/kWh
                            </button>

                            <button
                                className={`toggle-btn ${chartOptions.showEur100km ? "active" : ""}`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showEur100km: !o.showEur100km }))
                                }
                            >
                                🪙 €/100 km
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-saving mb-6 flex items-center gap-2">
                            ⚡📈 Grafici delle Ricariche
                        </h2>

                        {/* GRAFICO 1 — COSTO PER RICARICA */}
                        {chartOptions.showCost && (
                            <div className="chart-card">
                                <div className="chart-title">Costo per ricarica</div>
                                <CostChart charges={charges} />
                            </div>
                        )}

                        {/* GRAFICO 2 — kWh PER RICARICA */}
                        {chartOptions.showKwh && (
                            <div className="chart-card">
                                <div className="chart-title">kWh per ricarica</div>
                                <KwhChart charges={charges} />
                            </div>
                        )}

                        {/* GRAFICO 3 — CONSUMO REALE */}
                        {chartOptions.showConsumption && (
                            <div className="chart-card">
                                <div className="chart-title">Consumo reale</div>
                                <ConsumptionChart charges={charges} />
                            </div>
                        )}

                        {/* GRAFICO 4 — €/kWh */}
                        {chartOptions.showEurKwh && (
                            <div className="chart-card">
                                <div className="chart-title">€/kWh</div>
                                <EurKwhChart charges={charges} />
                            </div>
                        )}

                        {/* GRAFICO 5 — €/100 km */}
                        {chartOptions.showEur100km && (
                            <div className="chart-card">
                                <div className="chart-title">€/100 km</div>
                                <Eur100Chart charges={charges} />
                            </div>
                        )}
                    </div>
                )}

                {/* FOOTER */}
                <footer className="mt-10 text-center text-xs text-muted">
                    EV Cost Tracker · progettato con cura
                </footer>
            </main>
        </div>
    );
}

// ==========================================
// MOUNT REACT APP
// ==========================================
const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<EVCostTracker />);
