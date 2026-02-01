// app.js
// EV Cost Tracker – versione modulare (React UMD + GitHub Pages)

// ==========================================
// SUPABASE INIT (sostituisci con i tuoi valori reali)
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
            if (saved) {
                setSettings(JSON.parse(saved));
            }
        } catch (e) {
            console.warn("Impossibile leggere le impostazioni da localStorage", e);
        }
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem("ev_settings", JSON.stringify(settings));
        } catch (e) {
            console.warn("Impossibile salvare le impostazioni su localStorage", e);
        }
    }, [settings]);

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
        // Attualmente solo localStorage (già gestito da useEffect)
        // Se vuoi, qui puoi aggiungere persistenza su Supabase.
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
            charges // ← serve per calcolare km_since_last
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
        () =>
            charges
                .filter(c => c.consumption)
                .map(c => parseFloat(c.consumption)),
        [charges]
    );

    // ==========================================
    // RENDER PRINCIPALE
    // ==========================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white font-sans">

            {/* HEADER */}
            <header className="bg-black/30 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 p-2 rounded-xl text-2xl">
                            ⚡
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                EV Cost Tracker
                            </h1>
                            {isSyncing && (
                                <p className="text-xs text-emerald-400">
                                    🔄 Sincronizzazione...
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setView("dashboard")}
                            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all text-lg md:text-xl ${view === "dashboard"
                                    ? "bg-emerald-500 text-slate-900"
                                    : "bg-slate-800/50 hover:bg-slate-700/50"
                                }`}
                            title="Dashboard"
                        >
                            📊
                        </button>

                        <button
                            onClick={() => setView("settings")}
                            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all text-lg md:text-xl ${view === "settings"
                                    ? "bg-emerald-500 text-slate-900"
                                    : "bg-slate-800/50 hover:bg-slate-700/50"
                                }`}
                            title="Impostazioni"
                        >
                            ⚙️
                        </button>

                        <button
                            onClick={() => setView("charts")}
                            className={`px-3 py-2 md:px-4 md:py-2 rounded-lg transition-all text-lg md:text-xl ${view === "charts"
                                    ? "bg-emerald-500 text-slate-900"
                                    : "bg-slate-800/50 hover:bg-slate-700/50"
                                }`}
                            title="Grafici"
                        >
                            ⚡📈
                        </button>

                        <button
                            onClick={loadData}
                            disabled={isSyncing}
                            className="px-3 py-2 md:px-4 md:py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all text-lg md:text-xl"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in">

                                {/* Energia Totale */}
                                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-4 md:p-6 rounded-2xl border border-emerald-500/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">⚡</span>
                                        <h3 className="text-sm text-emerald-400/70 font-semibold">Energia Totale</h3>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stats.totalKwh} kWh</p>
                                    <p className="text-xs text-slate-400 mt-1">{stats.chargesCount} ricariche</p>
                                </div>

                                {/* Costo Totale */}
                                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-4 md:p-6 rounded-2xl border border-emerald-500/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">€</span>
                                        <h3 className="text-sm text-cyan-400/70 font-semibold">Costo Totale</h3>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-cyan-400">€{stats.totalCost}</p>
                                    <p className="text-xs text-slate-400 mt-1">€{stats.avgCostPerKwh}/kWh medio</p>
                                </div>

                                {/* Km Percorsi */}
                                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-4 md:p-6 rounded-2xl border border-emerald-500/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">🚗</span>
                                        <h3 className="text-sm text-blue-400/70 font-semibold">Km Percorsi</h3>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-blue-400">{stats.kmDriven} km</p>
                                    <p className="text-xs text-slate-400 mt-1">{stats.consumption} kWh/100km</p>
                                </div>

                                {/* Risparmio */}
                                <div className="bg-gradient-to-br from-emerald-800/30 to-green-900/30 backdrop-blur p-4 md:p-6 rounded-2xl border border-emerald-500/40">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">💰</span>
                                        <h3 className="text-sm text-green-400/70 font-semibold">Risparmio</h3>
                                    </div>
                                    <p className="text-xl md:text-2xl font-bold text-green-400">€{stats.gasolineSavings}</p>
                                    <p className="text-xs text-slate-400 mt-1">vs benzina</p>
                                    <p className="text-sm text-green-300/80 mt-2">€{stats.dieselSavings} vs diesel</p>
                                </div>
                            </div>
                        )}

                        {/* ANALISI AVANZATA */}
                        {analysis && (
                            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur p-6 rounded-2xl border border-emerald-500/20 mb-8 animate-fade-in">

                                <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                    🧠 Analisi Avanzata
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                                    {/* Miglior consumo */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                                        <p className="text-slate-400 text-xs mb-1">Migliore</p>
                                        <p className="text-emerald-400 text-xl font-bold">
                                            {analysis.best.toFixed(2)}
                                        </p>
                                        <p className="text-slate-500 text-xs">kWh/100km</p>
                                    </div>

                                    {/* Peggior consumo */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                                        <p className="text-slate-400 text-xs mb-1">Peggiore</p>
                                        <p className="text-red-400 text-xl font-bold">
                                            {analysis.worst.toFixed(2)}
                                        </p>
                                        <p className="text-slate-500 text-xs">kWh/100km</p>
                                    </div>

                                    {/* Media ultime 5 */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                                        <p className="text-slate-400 text-xs mb-1">Ultime 5</p>
                                        <p className="text-cyan-400 text-xl font-bold">
                                            {analysis.avgLast5.toFixed(2)}
                                        </p>
                                        <p className="text-slate-500 text-xs">kWh/100km</p>
                                    </div>

                                    {/* Trend */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40 flex flex-col">
                                        <p className="text-slate-400 text-xs mb-1">Trend</p>

                                        <p
                                            className={`text-xl font-bold ${analysis.trend < 0
                                                    ? "text-emerald-400"
                                                    : analysis.trend > 0
                                                        ? "text-red-400"
                                                        : "text-yellow-400"
                                                }`}
                                        >
                                            {analysis.trend < 0 ? "↓" : analysis.trend > 0 ? "↑" : "→"}
                                            {Math.abs(analysis.trend).toFixed(2)}
                                        </p>

                                        <p className="text-slate-500 text-xs">vs media</p>
                                    </div>
                                </div>

                                {/* Efficienza + commento */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-slate-300 text-sm">Efficienza personale</span>
                                        <span className="text-emerald-400 font-bold">
                                            {analysis.efficiency.toFixed(0)}%
                                        </span>
                                    </div>

                                    <div className="text-slate-400 text-sm italic">
                                        {analysis.comment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PREVISIONI DI COSTO */}
                        {forecast && (
                            <div className="bg-gradient-to-br from-indigo-800/30 to-purple-900/30 backdrop-blur p-6 rounded-2xl border border-purple-500/20 mb-8 animate-fade-in">

                                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                                    🔮 Previsioni Prossimo Mese
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

                                    {/* Costo previsto */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                                        <p className="text-slate-400 text-xs mb-1">Costo previsto</p>
                                        <p className="text-purple-300 text-xl font-bold">
                                            €{forecast.forecastCost.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* kWh previsti */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                                        <p className="text-slate-400 text-xs mb-1">kWh previsti</p>
                                        <p className="text-indigo-300 text-xl font-bold">
                                            {forecast.forecastKwh.toFixed(1)} kWh
                                        </p>
                                    </div>

                                    {/* Km previsti */}
                                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/40">
                                        <p className="text-slate-400 text-xs mb-1">Km previsti</p>
                                        <p className="text-blue-300 text-xl font-bold">
                                            {forecast.forecastKm.toFixed(0)} km
                                        </p>
                                    </div>
                                </div>

                                {/* Trend + commento */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-slate-300 text-sm">Trend costi</span>
                                        <span
                                            className={`font-bold ${forecast.trend < 0
                                                    ? "text-emerald-400"
                                                    : forecast.trend > 0
                                                        ? "text-red-400"
                                                        : "text-yellow-400"
                                                }`}
                                        >
                                            {forecast.trend < 0 ? "↓" : forecast.trend > 0 ? "↑" : "→"}
                                            {Math.abs(forecast.trend).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="text-slate-400 text-sm italic">
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
                                className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-emerald-500/30"
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
                        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="p-4 bg-slate-900/50 border-b border-slate-700/50">
                                <h2 className="text-xl font-bold text-emerald-400">📋 Storico Ricariche</h2>
                            </div>

                            <div className="divide-y divide-slate-700/50">
                                {charges.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        Nessuna ricarica registrata.
                                    </div>
                                ) : (
                                    charges.map(charge => (
                                        <div key={charge.id} className="p-4 hover:bg-slate-700/30 transition-colors">

                                            {/* Header ricarica */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span>📅</span>
                                                        <span className="text-sm text-slate-300">
                                                            {new Date(charge.date).toLocaleDateString("it-IT", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-emerald-400 font-semibold">
                                                            {charge.supplier_name}
                                                        </span>
                                                        <span className="text-slate-400">
                                                            ({charge.supplier_type})
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => deleteCharge(charge.id)}
                                                    disabled={isSyncing}
                                                    className="text-red-400 hover:text-red-300 text-xl"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* Dettagli principali */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                                <div>
                                                    <span className="text-slate-400">Km totali:</span>
                                                    <span className="ml-2 text-white font-semibold">
                                                        {parseFloat(charge.total_km).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-slate-400">kWh:</span>
                                                    <span className="ml-2 text-cyan-400 font-semibold">
                                                        {charge.kwh_added}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-slate-400">Costo:</span>
                                                    <span className="ml-2 text-emerald-400 font-semibold">
                                                        €{parseFloat(charge.cost).toFixed(2)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-slate-400">€/kWh:</span>
                                                    <span className="ml-2 text-white font-semibold">
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
                                                                <span className="text-slate-400">Km percorsi:</span>
                                                                <span className="ml-2 font-semibold">
                                                                    {parseFloat(
                                                                        charge.km_since_last
                                                                    ).toFixed(0)}{" "}
                                                                    km
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-600">—</span>
                                                        )}
                                                    </div>

                                                    {/* Consumo + badge */}
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        {charge.consumption ? (
                                                            <>
                                                                <div>
                                                                    <span className="text-slate-400">Consumo:</span>
                                                                    <span className="ml-2 font-semibold">
                                                                        {parseFloat(
                                                                            charge.consumption
                                                                        ).toFixed(2)}{" "}
                                                                        kWh/100km
                                                                    </span>
                                                                </div>

                                                                {/* BADGE EFFICIENZA */}
                                                                {(() => {
                                                                    const badge = getEfficiencyBadge(
                                                                        parseFloat(charge.consumption),
                                                                        allConsumptions
                                                                    );

                                                                    return (
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded text-xs font-bold ${badge.bg} ${badge.color}`}
                                                                        >
                                                                            {badge.label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-600">—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Differenza costo standard */}
                                            {charge.cost_difference !== null && (
                                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-slate-400">
                                                            Rispetto al costo standard (€
                                                            {parseFloat(
                                                                charge.standard_cost
                                                            ).toFixed(3)}
                                                            /kWh):
                                                        </span>

                                                        <span
                                                            className={`font-semibold ${parseFloat(charge.cost_difference) > 0
                                                                    ? "text-red-400"
                                                                    : parseFloat(
                                                                        charge.cost_difference
                                                                    ) < 0
                                                                        ? "text-green-400"
                                                                        : "text-slate-400"
                                                                }`}
                                                        >
                                                            {parseFloat(charge.cost_difference) > 0 ? "+" : ""}
                                                            €
                                                            {parseFloat(
                                                                charge.cost_difference
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs text-slate-500 mt-1">
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
                        <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4 md:p-6">
                            <h2 className="text-xl font-bold text-emerald-400 mb-4">
                                ⚙️ Impostazioni Costi & Consumi
                            </h2>

                            <div className="space-y-4 text-sm">
                                {/* Benzina */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 mb-1">
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
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-1">
                                            Consumo Benzina (km/L)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settings.gasolineConsumption}
                                            onChange={e =>
                                                setSettings({
                                                    ...settings,
                                                    gasolineConsumption:
                                                        parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Diesel */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 mb-1">
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
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-1">
                                            Consumo Diesel (km/L)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settings.dieselConsumption}
                                            onChange={e =>
                                                setSettings({
                                                    ...settings,
                                                    dieselConsumption:
                                                        parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Casa */}
                                <div>
                                    <label className="block text-slate-300 mb-1">
                                        Prezzo Energia Casa (€/kWh)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={settings.homeElectricityPrice}
                                        onChange={e =>
                                            setSettings({
                                                ...settings,
                                                homeElectricityPrice:
                                                    parseFloat(e.target.value) || 0
                                            })
                                        }
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveSettings}
                                disabled={isSyncing}
                                className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 px-4 py-2 rounded-xl font-bold"
                            >
                                {isSyncing ? "💾 Salvataggio..." : "💾 Salva Impostazioni"}
                            </button>
                        </div>

                        {/* Fornitori */}
                        <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-emerald-400">
                                    🏪 Fornitori
                                </h2>
                                <button
                                    onClick={() => setShowAddSupplier(true)}
                                    className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm"
                                >
                                    ➕ Aggiungi
                                </button>
                            </div>

                            {suppliers.length === 0 ? (
                                <p className="text-slate-400 text-sm">
                                    Nessun fornitore configurato.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {suppliers.map(s => (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2 text-sm"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-emerald-300">
                                                        {s.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        ({s.type})
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    Standard: €
                                                    {parseFloat(s.standard_cost || 0).toFixed(3)}
                                                    /kWh
                                                </div>
                                            </div>

                                            {s.name !== "Casa" && (
                                                <button
                                                    onClick={() => handleDeleteSupplier(s.id)}
                                                    disabled={isSyncing}
                                                    className="text-red-400 hover:text-red-300 text-lg"
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

                        <div className="flex flex-wrap gap-2 mb-4 text-xs">
                            <button
                                className={`px-3 py-1 rounded-full border ${chartOptions.showCost
                                        ? "bg-emerald-600/30 border-emerald-400"
                                        : "bg-slate-800 border-slate-600"
                                    }`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showCost: !o.showCost }))
                                }
                            >
                                💵 Costo
                            </button>

                            <button
                                className={`px-3 py-1 rounded-full border ${chartOptions.showKwh
                                        ? "bg-cyan-600/30 border-cyan-400"
                                        : "bg-slate-800 border-slate-600"
                                    }`}
                                onClick={() =>
                                    setChartOptions(o => ({ ...o, showKwh: !o.showKwh }))
                                }
                            >
                                ⚡ kWh
                            </button>

                            <button
                                className={`px-3 py-1 rounded-full border ${chartOptions.showConsumption
                                        ? "bg-blue-600/30 border-blue-400"
                                        : "bg-slate-800 border-slate-600"
                                    }`}
                                onClick={() =>
                                    setChartOptions(o => ({
                                        ...o,
                                        showConsumption: !o.showConsumption
                                    }))
                                }
                            >
                                🚗 Consumo
                            </button>

                            <button
                                className={`px-3 py-1 rounded-full border ${chartOptions.showEurKwh
                                        ? "bg-violet-600/30 border-violet-400"
                                        : "bg-slate-800 border-slate-600"
                                    }`}
                                onClick={() =>
                                    setChartOptions(o => ({
                                        ...o,
                                        showEurKwh: !o.showEurKwh
                                    }))
                                }
                            >
                                💰 €/kWh
                            </button>

                            <button
                                className={`px-3 py-1 rounded-full border ${chartOptions.showEur100km
                                        ? "bg-amber-600/30 border-amber-400"
                                        : "bg-slate-800 border-slate-600"
                                    }`}
                                onClick={() =>
                                    setChartOptions(o => ({
                                        ...o,
                                        showEur100km: !o.showEur100km
                                    }))
                                }
                            >
                                🪙 €/100 km
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                            ⚡📈 Grafici delle Ricariche
                        </h2>

                        {/* GRAFICO 1 — COSTO PER RICARICA */}
                        {chartOptions.showCost && <CostChart charges={charges} />}

                        {/* GRAFICO 2 — kWh PER RICARICA */}
                        {chartOptions.showKwh && <KwhChart charges={charges} />}

                        {/* GRAFICO 3 — CONSUMO REALE */}
                        {chartOptions.showConsumption && (
                            <ConsumptionChart charges={charges} />
                        )}

                        {/* GRAFICO 4 — €/kWh */}
                        {chartOptions.showEurKwh && <EurKwhChart charges={charges} />}

                        {/* GRAFICO 5 — €/100 km */}
                        {chartOptions.showEur100km && <Eur100Chart charges={charges} />}
                    </div>
                )}

                {/* FOOTER */}
                <footer className="mt-10 text-center text-xs text-slate-500">
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
