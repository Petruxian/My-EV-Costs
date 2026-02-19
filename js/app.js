/**
 * ============================================================
 * APP.JS - Applicazione Principale EV Cost Tracker
 * ============================================================
 * 
 * Questo file contiene il componente principale dell'applicazione
 * EV Cost Tracker. Gestisce lo stato globale, la navigazione,
 * e coordina tutti i sotto-componenti.
 * 
 * ARCHITETTURA STATO:
 * -------------------
 * - view: Navigazione (dashboard/charts/settings)
 * - vehicles: Lista auto dal database
 * - selectedVehicleId: Auto attualmente selezionata
 * - charges: Tutte le ricariche (tutti i veicoli)
 * - suppliers: Lista fornitori di ricarica
 * - settings: Impostazioni globali (tema, prezzi)
 * 
 * FLUSSO DATI:
 * ------------
 * 1. Al mount: carica dati da Supabase + settings da localStorage
 * 2. Utente interagisce → callback handler → update stato → re-render
 * 3. Modifiche a settings salvate in localStorage
 * 
 * VISTE:
 * ------
 * - dashboard: Cards statistiche + azioni ricarica + lista ricariche
 * - charts: Grafici e analisi consumi
 * - settings: Gestione auto, fornitori, parametri
 * 
 * GESTIONE RICARICHE:
 * -------------------
 * - START: Crea record con status "in_progress"
 * - STOP: Aggiorna record con dati finali, calcola km e consumo
 * - MANUAL: Inserisce direttamente record completato
 * - EDIT: Modifica record esistente con ricalcoli automatici
 * - DELETE: Elimina singola ricarica
 * 
 * MULTI-AUTO:
 * -----------
 * L'app supporta più veicoli. Ogni ricarica è associata a un veicolo
 * tramite vehicle_id. Il selettore in header permette di cambiare
 * il veicolo attivo.
 * 
 * PWA:
 * ----
 * L'app è una Progressive Web App con service worker.
 * Supporta installazione su dispositivo e funzionamento offline.
 * 
 * @author EV Cost Tracker Team
 * @version 2.3 - Fix Timezone + Eliminazione Fornitori + Edit Charge
 * ============================================================
 */

// ============================================================
// CONFIGURAZIONE SUPABASE
// ============================================================
const SUPABASE_URL = "https://hcmyzwkgzyqxogzakpxc.supabase.co"; // TUA URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXl6d2tnenlxeG9nemFrcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM2NTEsImV4cCI6MjA4NTM3OTY1MX0.2kK1ocMpoEJgOn31sDYQeYcwpcxmkZuHzq39ZQAMkGw"; // TUA KEY
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================
function EVCostTracker() {
    // ========================================================
    // STATO NAVIGAZIONE
    // ========================================================
    const [view, setView] = React.useState("dashboard");
    const [isSyncing, setIsSyncing] = React.useState(false);

    // ========================================================
    // STATO DATI
    // ========================================================
    const [vehicles, setVehicles] = React.useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = React.useState(null);
    const [charges, setCharges] = React.useState([]);
    const [suppliers, setSuppliers] = React.useState([]);

    // ========================================================
    // STATO IMPOSTAZIONI
    // ========================================================
    const [settings, setSettings] = React.useState({
        gasolinePrice: 1.9,
        gasolineConsumption: 15,
        dieselPrice: 1.8,
        dieselConsumption: 18,
        homeElectricityPrice: 0.25,
        solarElectricityPrice: 0.00,
        theme: "theme-default",
        showFunStats: true
    });

    // ========================================================
    // STATO MODALI
    // ========================================================
    const [showStartModal, setShowStartModal] = React.useState(false);
    const [showStopModal, setShowStopModal] = React.useState(false);
    const [showManualModal, setShowManualModal] = React.useState(false);
    const [showVehicleModal, setShowVehicleModal] = React.useState(false);
    const [showSupplierModal, setShowSupplierModal] = React.useState(false);
    const [showEditSupplierModal, setShowEditSupplierModal] = React.useState(false);
    const [editingSupplier, setEditingSupplier] = React.useState(null);
    const [showEditVehicleModal, setShowEditVehicleModal] = React.useState(false);
    const [editingVehicle, setEditingVehicle] = React.useState(null);
    
    // NUOVO: Modale modifica ricarica
    const [showEditChargeModal, setShowEditChargeModal] = React.useState(false);
    const [editingCharge, setEditingCharge] = React.useState(null);

    // ========================================================
    // STATO FORM
    // ========================================================
    const [tempChargeData, setTempChargeData] = React.useState({});
    const [newVehicle, setNewVehicle] = React.useState({ name: "", capacity: "", brand: "", image: "" });
    const [newSupplier, setNewSupplier] = React.useState({ name: "", type: "AC", standardCost: "" });

    // ========================================================
    // EFFETTI: INIZIALIZZAZIONE E PERSISTENZA
    // ========================================================
    React.useEffect(() => {
        const saved = localStorage.getItem("ev_settings_v2");
        if (saved) {
            const parsed = JSON.parse(saved);
            setSettings(parsed);
            document.body.className = parsed.theme || "theme-default";
        }
        const lastVehicle = localStorage.getItem("ev_last_vehicle");
        if (lastVehicle) setSelectedVehicleId(parseInt(lastVehicle));
        loadData();
    }, []);

    React.useEffect(() => {
        localStorage.setItem("ev_settings_v2", JSON.stringify(settings));
    }, [settings]);

    React.useEffect(() => {
        if (settings.theme === 'theme-auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.className = isDark ? 'theme-dark' : 'theme-light';
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                document.body.className = e.matches ? 'theme-dark' : 'theme-light';
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if (settings.theme) {
            document.body.className = settings.theme;
        }
    }, [settings.theme]);

    React.useEffect(() => {
        if (selectedVehicleId) localStorage.setItem("ev_last_vehicle", selectedVehicleId);
    }, [selectedVehicleId]);

    // ========================================================
    // FUNZIONE: CARICAMENTO DATI
    // ========================================================
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
        if (!selectedVehicleId && vList.length > 0) {
            setSelectedVehicleId(vList[0].id);
        }
        setIsSyncing(false);
    }

    // ========================================================
    // MEMO: DATI DERIVATI
    // ========================================================
    const currentVehicleCharges = React.useMemo(() => {
        if (!selectedVehicleId) return [];
        return charges.filter(c => c.vehicle_id === selectedVehicleId && c.status === 'completed');
    }, [charges, selectedVehicleId]);

    const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);

    const currentActiveSession = React.useMemo(() => {
        if (!selectedVehicleId) return null;
        return charges.find(c => c.vehicle_id === selectedVehicleId && c.status === 'in_progress') || null;
    }, [charges, selectedVehicleId]);

    const otherActiveCharges = React.useMemo(() => {
        return charges.filter(c => c.status === 'in_progress' && c.vehicle_id !== selectedVehicleId);
    }, [charges, selectedVehicleId]);

    const stats = React.useMemo(() => {
        if (!currentVehicleCharges || currentVehicleCharges.length === 0) return null;
        return calculateStats(currentVehicleCharges, settings);
    }, [currentVehicleCharges, settings]);

    // ========================================================
    // HANDLER: VEICOLI
    // ========================================================
    async function handleSaveVehicle() {
        if (!newVehicle.name || !newVehicle.capacity) {
            alert("Nome e Capacità Batteria sono obbligatori!");
            return;
        }
        setIsSyncing(true);
        const ok = await saveVehicleToDB(supabaseClient, newVehicle);
        if (ok) {
            setShowVehicleModal(false);
            setNewVehicle({ name: "", capacity: "", brand: "", image: "" });
            await loadData();
        }
        setIsSyncing(false);
    }

    function handleEditVehicleClick(vehicle) {
        if (!vehicle || !vehicle.id) {
            alert("Errore: Impossibile modificare, ID veicolo mancante.");
            return;
        }
        setEditingVehicle({
            id: vehicle.id,
            name: vehicle.name,
            brand: vehicle.brand,
            capacity: vehicle.capacity_kwh
        });
        setShowEditVehicleModal(true);
    }

    async function handleSaveEditedVehicle() {
        if (!editingVehicle.name || !editingVehicle.capacity) {
            alert("⚠️ Nome e Capacità sono obbligatori!");
            return;
        }
        if (typeof updateVehicleInDB !== 'function') {
            alert("⛔ ERRORE CRITICO: La funzione 'updateVehicleInDB' non è stata trovata.");
            return;
        }
        setIsSyncing(true);
        try {
            const ok = await updateVehicleInDB(supabaseClient, editingVehicle);
            if (ok) {
                setShowEditVehicleModal(false);
                setEditingVehicle(null);
                await loadData();
                alert("✅ Auto aggiornata con successo!");
            } else {
                alert("❌ Errore ricevuto dal Database.");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Errore JavaScript Imprevisto:\n" + err.message);
        }
        setIsSyncing(false);
    }

    async function handleDeleteVehicle(vehicle) {
        if (!confirm(`⚠️ ATTENZIONE ⚠️\n\nStai per eliminare "${vehicle.name}".\nQuesta azione eliminerà anche TUTTE le ricariche associate.\n\nVuoi procedere?`)) return;
        const vehicleCharges = charges.filter(c => c.vehicle_id === vehicle.id);
        if (vehicleCharges.length > 0) {
            if (confirm(`Vuoi scaricare un backup (CSV) delle ${vehicleCharges.length} ricariche prima di eliminare tutto?`)) {
                const filename = `Backup_${vehicle.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
                exportToCSV(filename, vehicleCharges);
            }
        }
        if (!confirm(`SEI SICURO?\n\nL'auto "${vehicle.name}" verrà eliminata definitivamente dal database.\nNon potrai tornare indietro.`)) return;
        setIsSyncing(true);
        const success = await deleteVehicleFromDB(supabaseClient, vehicle.id);
        if (success) {
            const updatedVehicles = vehicles.filter(v => v.id !== vehicle.id);
            setVehicles(updatedVehicles);
            setCharges(charges.filter(c => c.vehicle_id !== vehicle.id));
            if (selectedVehicleId === vehicle.id) {
                if (updatedVehicles.length > 0) {
                    setSelectedVehicleId(updatedVehicles[0].id);
                } else {
                    setSelectedVehicleId(null);
                    setView("dashboard");
                }
            }
            alert("Auto eliminata correttamente.");
        } else {
            alert("Errore durante l'eliminazione.");
        }
        setIsSyncing(false);
    }

    // ========================================================
    // HANDLER: FORNITORI
    // ========================================================
    async function handleEditSupplier(supplier) {
        setEditingSupplier({
            id: supplier.id,
            name: supplier.name,
            type: supplier.type,
            standardCost: supplier.standard_cost,
            isFavorite: supplier.is_favorite,
            sortOrder: supplier.sort_order
        });
        setShowEditSupplierModal(true);
    }

    async function handleSaveEditSupplier() {
        if (!editingSupplier.name || !editingSupplier.standardCost) {
            alert("⚠️ Compila tutti i campi!");
            return;
        }
        setIsSyncing(true);
        const ok = await updateSupplier(supabaseClient, editingSupplier.id, editingSupplier);
        if (ok) {
            setShowEditSupplierModal(false);
            setEditingSupplier(null);
            await loadData();
            alert("✅ Fornitore aggiornato!");
        } else {
            alert("❌ Errore nell'aggiornamento");
        }
        setIsSyncing(false);
    }

    async function handleDeleteSupplier(supplier) {
        const associatedCharges = charges.filter(c => c.supplier_id === supplier.id);
        const chargesCount = associatedCharges.length;
        let confirmMessage;
        if (chargesCount > 0) {
            confirmMessage = `⚠️ ATTENZIONE ⚠️\n\nIl fornitore "${supplier.name}" ha ${chargesCount} ricarich${chargesCount === 1 ? 'a' : 'e'} associat${chargesCount === 1 ? 'a' : 'e'}.\n\nLe ricariche NON verranno eliminate (rimarranno nello storico con i dati salvati).\n\nVuoi procedere con l'eliminazione del fornitore?`;
        } else {
            confirmMessage = `Sei sicuro di voler eliminare il fornitore "${supplier.name}"?`;
        }
        if (!confirm(confirmMessage)) return;
        if (chargesCount > 0) {
            const finalConfirm = confirm(`🔴 ULTERIORE CONFERMA 🔴\n\nStai per eliminare "${supplier.name}".\n\nLe ${chargesCount} ricariche rimarranno visibili ma il fornitore non sarà più selezionabile.\n\nProcedere comunque?`);
            if (!finalConfirm) return;
        }
        setIsSyncing(true);
        const success = await deleteSupplierFromDB(supabaseClient, supplier.id);
        if (success) {
            setSuppliers(suppliers.filter(s => s.id !== supplier.id));
            alert(`✅ Fornitore "${supplier.name}" eliminato correttamente.`);
        } else {
            alert("❌ Errore durante l'eliminazione del fornitore.");
        }
        setIsSyncing(false);
    }

    // ========================================================
    // HANDLER: FLUSSO RICARICA
    // ========================================================
    async function handleStartCharge(data) {
        if (!selectedVehicleId) return alert("Seleziona prima un'auto!");
        setIsSyncing(true);
        const ok = await startChargeDB(supabaseClient, data, selectedVehicleId, suppliers);
        if (ok) {
            setShowStartModal(false);
            await loadData();
        }
        setIsSyncing(false);
    }

    async function handleStopCharge(endData) {
        if (!currentActiveSession) return;
        setIsSyncing(true);
        let finalCost = parseFloat(endData.cost);
        const supplier = suppliers.find(s => s.id === currentActiveSession.supplier_id);
        if (supplier && supplier.name === "Casa" && !finalCost) {
            finalCost = parseFloat(endData.kwhAdded) * settings.homeElectricityPrice;
        }
        const ok = await stopChargeDB(supabaseClient, currentActiveSession.id, endData, finalCost, activeVehicle, settings, charges, supplier);
        if (ok) {
            setShowStopModal(false);
            await loadData();
        }
        setIsSyncing(false);
    }

    async function handleManualCharge(data) {
        if (!selectedVehicleId) return alert("Seleziona prima un'auto!");
        setIsSyncing(true);
        const ok = await saveManualChargeDB(supabaseClient, data, selectedVehicleId, suppliers, activeVehicle, settings, charges);
        if (ok) {
            setShowManualModal(false);
            await loadData();
        }
        setIsSyncing(false);
    }

    async function handleDeleteCharge(id) {
        if (!confirm("Eliminare questa ricarica?")) return;
        setIsSyncing(true);
        await deleteChargeFromDB(supabaseClient, id);
        await loadData();
        setIsSyncing(false);
    }

    async function handleCancelCharge() {
        if (!currentActiveSession) return;
        if (!confirm("Annullare questa ricarica in corso? L'operazione non può essere annullata.")) return;
        setIsSyncing(true);
        await deleteChargeFromDB(supabaseClient, currentActiveSession.id);
        await loadData();
        setIsSyncing(false);
    }

    // ========================================================
    // HANDLER: MODIFICA RICARICA (NUOVO)
    // ========================================================
    
    /**
     * Apre il modale di modifica ricarica con i dati precompilati.
     * Converte i dati dal formato DB al formato form.
     */
    function handleEditChargeClick(charge) {
        // Prepara i dati per il form di modifica
        setEditingCharge({
            id: charge.id,
            // Data in formato datetime-local
            date: getLocalDateTimeString(charge.date),
            totalKm: charge.total_km || "",
            kwhAdded: charge.kwh_added || "",
            batteryStart: charge.battery_start || "",
            batteryEnd: charge.battery_end || "",
            cost: charge.cost || "",
            supplierId: charge.supplier_id || "",
            notes: charge.notes || ""
        });
        // Salva anche la ricarica originale per i ricalcoli
        setTempChargeData(charge);
        setShowEditChargeModal(true);
    }

    /**
     * Salva le modifiche alla ricarica con ricalcoli automatici.
     * Include aggiornamento cascade alla ricarica successiva.
     */
    async function handleSaveEditedCharge() {
        if (!editingCharge.kwhAdded || !editingCharge.totalKm) {
            alert("⚠️ kWh e Km sono obbligatori!");
            return;
        }

        setIsSyncing(true);

        try {
            const result = await updateChargeInDB(
                supabaseClient,
                editingCharge,
                tempChargeData,  // Ricarica originale
                charges,
                suppliers,
                settings
            );

            if (result.success) {
                setShowEditChargeModal(false);
                setEditingCharge(null);
                setTempChargeData({});
                await loadData();
                alert("✅ " + result.message);
            } else {
                alert("❌ " + result.message);
            }
        } catch (err) {
            console.error(err);
            alert("❌ Errore imprevisto: " + err.message);
        }

        setIsSyncing(false);
    }

    // ========================================================
    // RENDER
    // ========================================================
    return (
        <div className="min-h-screen font-sans pb-10">
            
            {/* HEADER */}
            <header className="bg-card-soft border-b border-card backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <h1 className="font-bold text-lg hidden md:block">EV Tracker</h1>
                    {vehicles.length > 0 && (
                        <div className="relative ml-2">
                            <select
                                className="bg-card border border-card-border rounded-lg px-2 py-1 text-sm text-saving font-bold outline-none"
                                value={selectedVehicleId || ""}
                                onChange={(e) => setSelectedVehicleId(parseInt(e.target.value))}
                            >
                                {vehicles.map(v => {
                                    const hasActiveCharge = charges.some(c => c.vehicle_id === v.id && c.status === 'in_progress');
                                    return (
                                        <option key={v.id} value={v.id}>
                                            {hasActiveCharge ? '⚡ ' : ''}{v.name}
                                        </option>
                                    );
                                })}
                            </select>
                            {otherActiveCharges.length > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse border-2 border-card-soft"
                                    title={`${otherActiveCharges.length} altra/e auto in ricarica`}></div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setView("dashboard")} className={`btn ${view === "dashboard" ? "btn-primary" : "btn-secondary"} p-2`}>🔌</button>
                    <button onClick={() => setView("charts")} className={`btn ${view === "charts" ? "btn-primary" : "btn-secondary"} p-2`}>📈</button>
                    <button onClick={() => setView("settings")} className={`btn ${view === "settings" ? "btn-primary" : "btn-secondary"} p-2`}>⚙️</button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">

                {isSyncing && view === "dashboard" && <SkeletonLoader />}

                {/* Benvenuto */}
                {vehicles.length === 0 && !isSyncing && view !== "settings" && (
                    <div className="text-center py-10 animate-scale-in">
                        <div className="text-6xl mb-4">🚗</div>
                        <h2 className="text-2xl font-bold mb-4">Benvenuto! 👋</h2>
                        <p className="text-muted mb-6">Per iniziare, aggiungi la tua prima auto elettrica.</p>
                        <button onClick={() => setShowVehicleModal(true)} className="btn btn-primary text-lg px-8">🚘 Aggiungi Auto</button>
                    </div>
                )}

                {/* Dashboard */}
                {view === "dashboard" && vehicles.length > 0 && !isSyncing && (
                    <div className="animate-fade-in">
                        {currentActiveSession ? (
                            <ActiveChargingBox
                                activeSession={currentActiveSession}
                                onStopClick={() => setShowStopModal(true)}
                                onCancelClick={handleCancelCharge}
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <button onClick={() => setShowStartModal(true)} className="btn btn-primary flex flex-col items-center justify-center py-8 gap-3 min-h-[140px] animate-scale-in">
                                    <span className="text-5xl">🔌</span>
                                    <span className="font-bold text-lg">INIZIA ORA</span>
                                    <span className="text-xs opacity-70 font-normal">Start ricarica live</span>
                                </button>
                                <button onClick={() => setShowManualModal(true)} className="btn btn-secondary flex flex-col items-center justify-center py-8 gap-3 min-h-[140px] border-dashed border-2 border-card-border animate-scale-in" style={{ animationDelay: '0.1s' }}>
                                    <span className="text-5xl">📝</span>
                                    <span className="font-bold text-lg">MANUALE</span>
                                    <span className="text-xs opacity-70 font-normal">Aggiungi passata</span>
                                </button>
                            </div>
                        )}

                        {settings.showFunStats !== false && activeVehicle && stats && (
                            <FunStats stats={stats} charges={currentVehicleCharges} />
                        )}

                        {activeVehicle && (
                            stats ? (
                                <StatsCards stats={stats} />
                            ) : (
                                <div className="card p-8 text-center mb-8">
                                    <div className="text-5xl mb-4">📊</div>
                                    <h3 className="text-xl font-bold mb-2">Nessuna ricarica per {activeVehicle.name}</h3>
                                    <p className="text-muted">Inizia una nuova ricarica o inseriscine una manualmente!</p>
                                    <div className="flex gap-3 justify-center mt-6">
                                        <button onClick={() => setShowStartModal(true)} className="btn btn-primary">🔌 Inizia Ricarica</button>
                                        <button onClick={() => setShowManualModal(true)} className="btn btn-secondary">✍️ Inserimento Manuale</button>
                                    </div>
                                </div>
                            )
                        )}

                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-muted mb-4">Storico {activeVehicle?.name}</h3>
                            <ChargeList 
                                charges={currentVehicleCharges} 
                                onEdit={handleEditChargeClick}
                                onDelete={handleDeleteCharge} 
                            />
                        </div>
                    </div>
                )}

                {/* Settings */}
                {view === "settings" && (
                    <SettingsView
                        settings={settings} setSettings={setSettings}
                        saveSettings={() => alert("Salvato!")}
                        vehicles={vehicles}
                        onAddVehicle={() => setShowVehicleModal(true)}
                        onEditVehicle={handleEditVehicleClick}
                        onDeleteVehicle={handleDeleteVehicle}
                        suppliers={suppliers}
                        onAddSupplier={() => setShowSupplierModal(true)}
                        onEditSupplier={handleEditSupplier}
                        onDeleteSupplier={handleDeleteSupplier}
                    />
                )}

                {/* Charts */}
                {view === "charts" && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-center">Analisi {activeVehicle?.name}</h2>
                        <ChartSection charges={currentVehicleCharges} theme={settings.theme} />
                    </div>
                )}

            </main>

            {/* MODALI */}
            {showVehicleModal && (
                <AddVehicleModal newVehicle={newVehicle} setNewVehicle={setNewVehicle} onClose={() => setShowVehicleModal(false)} onSave={handleSaveVehicle} isSyncing={isSyncing} />
            )}

            {showStartModal && (
                <StartChargeModal activeVehicle={activeVehicle} suppliers={suppliers} onClose={() => setShowStartModal(false)} onStart={handleStartCharge} />
            )}

            {showStopModal && currentActiveSession && (
                <StopChargeModal activeSession={currentActiveSession} activeVehicle={activeVehicle} onClose={() => setShowStopModal(false)} onStop={handleStopCharge} />
            )}

            {showManualModal && (
                <ManualChargeModal activeVehicle={activeVehicle} suppliers={suppliers} onClose={() => setShowManualModal(false)} onSave={handleManualCharge} />
            )}

            {/* NUOVO: Modale Modifica Ricarica */}
            {showEditChargeModal && editingCharge && (
                <EditChargeModal
                    charge={editingCharge}
                    setCharge={setEditingCharge}
                    suppliers={suppliers}
                    onClose={() => {
                        setShowEditChargeModal(false);
                        setEditingCharge(null);
                        setTempChargeData({});
                    }}
                    onSave={handleSaveEditedCharge}
                    isSyncing={isSyncing}
                />
            )}

            {showSupplierModal && (
                <AddSupplierModal newSupplier={newSupplier} setNewSupplier={setNewSupplier} onClose={() => setShowSupplierModal(false)} onSave={async () => {
                    await saveSupplier(supabaseClient, newSupplier);
                    setNewSupplier({ name: "", type: "AC", standardCost: "" });
                    setShowSupplierModal(false);
                    loadData();
                }} />
            )}

            {showEditSupplierModal && editingSupplier && (
                <EditSupplierModal supplier={editingSupplier} setSupplier={setEditingSupplier} onClose={() => { setShowEditSupplierModal(false); setEditingSupplier(null); }} onSave={handleSaveEditSupplier} isSyncing={isSyncing} />
            )}

            {showEditVehicleModal && editingVehicle && (
                <EditVehicleModal vehicle={editingVehicle} setVehicle={setEditingVehicle} onClose={() => { setShowEditVehicleModal(false); setEditingVehicle(null); }} onSave={handleSaveEditedVehicle} isSyncing={isSyncing} />
            )}

        </div>
    );
}

// Render
const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<EVCostTracker />);
