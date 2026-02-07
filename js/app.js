// app.js
// EV Cost Tracker — Gestione Multi-Auto e Sessioni Live

const SUPABASE_URL = "https://hcmyzwkgzyqxogzakpxc.supabase.co"; // TUA URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXl6d2tnenlxeG9nemFrcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM2NTEsImV4cCI6MjA4NTM3OTY1MX0.2kK1ocMpoEJgOn31sDYQeYcwpcxmkZuHzq39ZQAMkGw"; // TUA KEY
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function EVCostTracker() {
    // Navigazione
    const [view, setView] = React.useState("dashboard");
    const [isSyncing, setIsSyncing] = React.useState(false);

    // Dati
    const [vehicles, setVehicles] = React.useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = React.useState(null); // ID auto attiva
    const [charges, setCharges] = React.useState([]);
    const [suppliers, setSuppliers] = React.useState([]);
    
    // Stato Sessione Attiva (se c'è una ricarica in corso)
    const [activeSession, setActiveSession] = React.useState(null);

    // Impostazioni globali
    const [settings, setSettings] = React.useState({
        gasolinePrice: 1.9,
        gasolineConsumption: 15,
        dieselPrice: 1.8,
        dieselConsumption: 18,
        homeElectricityPrice: 0.25,
        theme: "theme-default"
    });

    // Modali
    const [showStartModal, setShowStartModal] = React.useState(false);
    const [showStopModal, setShowStopModal] = React.useState(false);
    const [showManualModal, setShowManualModal] = React.useState(false);
    const [showVehicleModal, setShowVehicleModal] = React.useState(false);
    const [showSupplierModal, setShowSupplierModal] = React.useState(false);

    // Dati per i form
    const [tempChargeData, setTempChargeData] = React.useState({}); // Dati temporanei form
    const [newVehicle, setNewVehicle] = React.useState({ name: "", capacity: "", brand: "", image: "" });
    const [newSupplier, setNewSupplier] = React.useState({ name: "", type: "AC", standardCost: "" });

    // Chart Options
    const [chartOptions, setChartOptions] = React.useState({
        showCost: true, showKwh: true, showConsumption: true, showEurKwh: true, showEur100km: true
    });

    // --------------------------------------------------------
    // INIT & SETTINGS
    // --------------------------------------------------------
    React.useEffect(() => {
        const saved = localStorage.getItem("ev_settings_v2");
        if (saved) {
            const parsed = JSON.parse(saved);
            setSettings(parsed);
            document.body.className = parsed.theme || "theme-default";
        }
        
        // Carica ID auto selezionata
        const lastVehicle = localStorage.getItem("ev_last_vehicle");
        if (lastVehicle) setSelectedVehicleId(parseInt(lastVehicle));
        
        loadData();
    }, []);

    React.useEffect(() => {
        localStorage.setItem("ev_settings_v2", JSON.stringify(settings));
    }, [settings]);
    
    React.useEffect(() => {
        // Gestione tema auto (segue sistema)
        if(settings.theme === 'theme-auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.className = isDark ? 'theme-dark' : 'theme-light';
            
            // Listener per cambio tema sistema
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                document.body.className = e.matches ? 'theme-dark' : 'theme-light';
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if(settings.theme) {
            document.body.className = settings.theme;
        }
    }, [settings.theme]);

    React.useEffect(() => {
        if(selectedVehicleId) localStorage.setItem("ev_last_vehicle", selectedVehicleId);
    }, [selectedVehicleId]);

    // --------------------------------------------------------
    // DATA LOADING
    // --------------------------------------------------------
    async function loadData() {
        setIsSyncing(true);
        const [vList, sList, cList] = await Promise.all([
            loadVehicles(supabaseClient),
            loadSuppliers(supabaseClient),
            loadCharges(supabaseClient)
        ]);

        setVehicles(vList);
        setSuppliers(sList);
        setCharges(cList);

        // Se non ho un'auto selezionata ma ne ho scaricate, seleziono la prima
        if (!selectedVehicleId && vList.length > 0) {
            setSelectedVehicleId(vList[0].id);
        }

        // Cerca se c'è una sessione attiva per l'auto selezionata (o in generale)
        const running = cList.find(c => c.status === 'in_progress');
        setActiveSession(running || null);

        setIsSyncing(false);
    }

    // Filtra le ricariche per l'auto selezionata (per dashboard e grafici)
    const currentVehicleCharges = React.useMemo(() => {
        if(!selectedVehicleId) return [];
        return charges.filter(c => c.vehicle_id === selectedVehicleId && c.status === 'completed');
    }, [charges, selectedVehicleId]);

    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);

    // --------------------------------------------------------
    // ACTIONS: VEHICLES
    // --------------------------------------------------------
    async function handleSaveVehicle() {
        if(!newVehicle.name || !newVehicle.capacity) {
            alert("Nome e Capacità Batteria sono obbligatori!");
            return;
        }
        setIsSyncing(true);
        const ok = await saveVehicleToDB(supabaseClient, newVehicle);
        if(ok) {
            setShowVehicleModal(false);
            setNewVehicle({ name: "", capacity: "", brand: "", image: "" });
            await loadData();
        }
        setIsSyncing(false);
    }

    // --------------------------------------------------------
    // ACTIONS: CHARGING FLOW
    // --------------------------------------------------------
    
    // 1. START CHARGE
    async function handleStartCharge(data) {
        if(!selectedVehicleId) return alert("Seleziona prima un'auto!");
        
        setIsSyncing(true);
        // Salva nel DB con status 'in_progress'
        const ok = await startChargeDB(supabaseClient, data, selectedVehicleId, suppliers);
        if(ok) {
            setShowStartModal(false);
            await loadData();
        }
        setIsSyncing(false);
    }

    // 2. STOP CHARGE
    async function handleStopCharge(endData) {
        if(!activeSession) return;
        
        setIsSyncing(true);
        // Calcola costo se "Casa"
        let finalCost = parseFloat(endData.cost);
        const supplier = suppliers.find(s => s.id === activeSession.supplier_id);
        
        if (supplier && supplier.name === "Casa" && !finalCost) {
            finalCost = parseFloat(endData.kwhAdded) * settings.homeElectricityPrice;
        }

        const ok = await stopChargeDB(supabaseClient, activeSession.id, endData, finalCost, activeVehicle, settings, charges);
        
        if(ok) {
            setShowStopModal(false);
            await loadData();
        }
        setIsSyncing(false);
    }

    // 3. MANUAL FULL CHARGE (Retroactive)
    async function handleManualCharge(data) {
        if(!selectedVehicleId) return alert("Seleziona prima un'auto!");
        
        setIsSyncing(true);
        const ok = await saveManualChargeDB(supabaseClient, data, selectedVehicleId, suppliers, activeVehicle, settings, charges);
        
        if(ok) {
            setShowManualModal(false);
            await loadData();
        }
        setIsSyncing(false);
    }

    // 4. DELETE
    async function handleDeleteCharge(id) {
        if(!confirm("Eliminare questa ricarica?")) return;
        setIsSyncing(true);
        await deleteChargeFromDB(supabaseClient, id);
        await loadData();
        setIsSyncing(false);
    }
    
    // --------------------------------------------------------
    // STATS CALCULATIONS
    // --------------------------------------------------------
    const stats = React.useMemo(() => 
        calculateStats(currentVehicleCharges, settings), 
    [currentVehicleCharges, settings]);

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------
    return (
        <div className="min-h-screen font-sans pb-10">
            {/* HEADER */}
            <header className="bg-card-soft border-b border-card backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <h1 className="font-bold text-lg hidden md:block">EV Tracker</h1>
                    
                    {/* Selettore Auto Rapido */}
                    {vehicles.length > 0 && (
                        <select 
                            className="bg-card border border-card-border rounded-lg px-2 py-1 text-sm text-saving font-bold ml-2 outline-none"
                            value={selectedVehicleId || ""}
                            onChange={(e) => setSelectedVehicleId(parseInt(e.target.value))}
                        >
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex gap-2">
                     <button onClick={() => setView("dashboard")} className={`btn ${view==="dashboard"?"btn-primary":"btn-secondary"} p-2`}>📊</button>
                     <button onClick={() => setView("charts")} className={`btn ${view==="charts"?"btn-primary":"btn-secondary"} p-2`}>📈</button>
                     <button onClick={() => setView("settings")} className={`btn ${view==="settings"?"btn-primary":"btn-secondary"} p-2`}>⚙️</button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">

                {/* LOADING STATE */}
                {isSyncing && view === "dashboard" && (
                    <SkeletonLoader />
                )}

                {/* 1. SE NON CI SONO AUTO */}
                {vehicles.length === 0 && !isSyncing && view !== "settings" && (
                    <div className="text-center py-10 animate-scale-in">
                        <div className="text-6xl mb-4">🚗</div>
                        <h2 className="text-2xl font-bold mb-4">Benvenuto! 👋</h2>
                        <p className="text-muted mb-6">Per iniziare, aggiungi la tua prima auto elettrica.</p>
                        <button onClick={() => setShowVehicleModal(true)} className="btn btn-primary text-lg px-8">
                            🚘 Aggiungi Auto
                        </button>
                    </div>
                )}

                {/* 2. DASHBOARD VIEW */}
                {view === "dashboard" && vehicles.length > 0 && !isSyncing && (
                    <div className="animate-fade-in">
                        
                        {/* BOX RICARICA ATTIVA */}
                        {activeSession ? (
                            <ActiveChargingBox 
                                activeSession={activeSession}
                                onStopClick={() => setShowStopModal(true)}
                            />
                        ) : (
                            /* PULSANTI AZIONE PRINCIPALE */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <button 
                                    onClick={() => setShowStartModal(true)}
                                    className="btn btn-primary flex flex-col items-center justify-center py-8 gap-3 min-h-[140px] animate-scale-in"
                                >
                                    <span className="text-5xl">🔌</span>
                                    <span className="font-bold text-lg">INIZIA ORA</span>
                                    <span className="text-xs opacity-70 font-normal">Start ricarica live</span>
                                </button>

                                <button 
                                    onClick={() => setShowManualModal(true)}
                                    className="btn btn-secondary flex flex-col items-center justify-center py-8 gap-3 min-h-[140px] border-dashed border-2 border-card-border animate-scale-in"
                                    style={{animationDelay: '0.1s'}}
                                >
                                    <span className="text-5xl">📝</span>
                                    <span className="font-bold text-lg">MANUALE</span>
                                    <span className="text-xs opacity-70 font-normal">Aggiungi passata</span>
                                </button>
                            </div>
                        )}

                        {/* STATISTICHE (Solo per auto attiva) */}
                        {stats && <StatsCards stats={stats} />}

                        {/* LISTA ULTIME RICARICHE */}
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-muted mb-4">Storico {activeVehicle?.name}</h3>
                            <ChargeList charges={currentVehicleCharges} onDelete={handleDeleteCharge} />
                        </div>
                    </div>
                )}
                
                {/* 3. SETTINGS VIEW */}
                {view === "settings" && (
                     <SettingsView 
                        settings={settings} setSettings={setSettings} 
                        saveSettings={() => alert("Salvato!")}
                        vehicles={vehicles}
                        onAddVehicle={() => setShowVehicleModal(true)}
                        suppliers={suppliers}
                        onAddSupplier={() => setShowSupplierModal(true)}
                        onDeleteSupplier={(id) => {/* to implement */}}
                     />
                )}
                
                {/* 4. CHARTS VIEW */}
                {view === "charts" && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-center">Analisi {activeVehicle?.name}</h2>
                        <ChartSection charges={currentVehicleCharges} options={chartOptions} setOptions={setChartOptions} theme={settings.theme} />
                    </div>
                )}
                
            </main>

            {/* MODALI */}
            {showVehicleModal && (
                <AddVehicleModal 
                    newVehicle={newVehicle} setNewVehicle={setNewVehicle} 
                    onClose={() => setShowVehicleModal(false)} onSave={handleSaveVehicle} isSyncing={isSyncing} 
                />
            )}

            {showStartModal && (
                <StartChargeModal
                    activeVehicle={activeVehicle}
                    suppliers={suppliers}
                    onClose={() => setShowStartModal(false)}
                    onStart={handleStartCharge}
                />
            )}

            {showStopModal && activeSession && (
                <StopChargeModal
                    activeSession={activeSession}
                    activeVehicle={activeVehicle}
                    onClose={() => setShowStopModal(false)}
                    onStop={handleStopCharge}
                />
            )}
            
            {showManualModal && (
                <ManualChargeModal
                    activeVehicle={activeVehicle}
                    suppliers={suppliers}
                    onClose={() => setShowManualModal(false)}
                    onSave={handleManualCharge}
                />
            )}
            
            {showSupplierModal && (
                <AddSupplierModal 
                     newSupplier={newSupplier} setNewSupplier={setNewSupplier}
                     onClose={() => setShowSupplierModal(false)} onSave={async () => {
                         await saveSupplier(supabaseClient, newSupplier);
                         setNewSupplier({name:"", type:"AC", standardCost:""});
                         setShowSupplierModal(false);
                         loadData();
                     }}
                />
            )}

        </div>
    );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<EVCostTracker />);