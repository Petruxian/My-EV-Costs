const { useState, useEffect } = React;

const EVCostTracker = () => {
    // ==========================================
    // STATE PRINCIPALE
    // ==========================================
    const [supabase, setSupabase] = useState(null);
    const [charges, setCharges] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [settings, setSettings] = useState({
        gasolinePrice: 1.90,
        dieselPrice: 1.85,
        homeElectricityPrice: 0.25,
        gasolineConsumption: 15,
        dieselConsumption: 18
    });

    const [view, setView] = useState("dashboard");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);

    // ==========================================
    // CONFIGURAZIONE SUPABASE
    // ==========================================
    const [showConfig, setShowConfig] = useState(false);
    // CONFIGURAZIONE FISSA SUPABASE (senza pannello)
    const FIXED_SUPABASE_URL = "https://hcmyzwkgzyqxogzakpxc.supabase.co";
    const FIXED_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXl6d2tnenlxeG9nemFrcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM2NTEsImV4cCI6MjA4NTM3OTY1MX0.2kK1ocMpoEJgOn31sDYQeYcwpcxmkZuHzq39ZQAMkGw";

    const [configUrl, setConfigUrl] = useState(FIXED_SUPABASE_URL);
    const [configKey, setConfigKey] = useState(FIXED_SUPABASE_KEY);


    // ==========================================
    // NUOVA RICARICA
    // ==========================================
    const [showAddCharge, setShowAddCharge] = useState(false);
    const [newCharge, setNewCharge] = useState({
        date: new Date().toISOString().slice(0, 16),
        totalKm: "",
        kWhAdded: "",
        supplier: "",
        cost: ""
    });

    // ==========================================
    // NUOVO FORNITORE
    // ==========================================
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        type: "AC",
        standardCost: ""
    });

    // ==========================================
    // INIZIALIZZA SUPABASE
    // ==========================================
    const initSupabase = (url, key) => {
        try {
            const { createClient } = window.supabase;
            const client = createClient(url, key);

            setSupabase(client);

            localStorage.setItem("supabase_url", url);
            localStorage.setItem("supabase_key", key);

            setShowConfig(false);
        } catch (error) {
            setError("Errore nella configurazione. Controlla URL e Key.");
            alert("Errore nella configurazione. Verifica URL e Anon Key.");
        }
    };
    // Configurazione automatica, senza pannello
    const saveConfig = () => {
        initSupabase(FIXED_SUPABASE_URL, FIXED_SUPABASE_KEY);
    };


    // ==========================================
    // CARICA DATI QUANDO SUPABASE È PRONTO
    // ==========================================
    // Inizializza Supabase automaticamente all'avvio
    useEffect(() => {
        initSupabase(FIXED_SUPABASE_URL, FIXED_SUPABASE_KEY);
    }, []);

    useEffect(() => {
        if (supabase) loadData();
    }, [supabase]);

    useEffect(() => {
        if (view !== "charts" || charges.length === 0) return;

        const labels = charges
            .map(c => new Date(c.date).toLocaleDateString("it-IT"))
            .reverse();

        const costs = charges.map(c => c.cost).reverse();
        const kwh = charges.map(c => c.kwh_added).reverse();
        const consumption = charges.map(c => c.consumption || null).reverse();
        const eurKwh = charges.map(c => (c.cost / c.kwh_added).toFixed(3)).reverse();

        const darkGrid = "rgba(255,255,255,0.08)";
        const darkText = "rgba(255,255,255,0.8)";

        // Distruggi grafici precedenti se esistono
        if (window._chartCost) window._chartCost.destroy();
        if (window._chartKwh) window._chartKwh.destroy();
        if (window._chartConsumption) window._chartConsumption.destroy();
        if (window._chartEurKwh) window._chartEurKwh.destroy();

        // COSTO
        window._chartCost = new Chart(document.getElementById("chartCost"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Costo (€)",
                    data: costs,
                    borderColor: "#34d399",
                    backgroundColor: "rgba(52,211,153,0.2)",
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: darkText }, grid: { color: darkGrid } },
                    y: { ticks: { color: darkText }, grid: { color: darkGrid } }
                }
            }
        });

        // KWH
        window._chartKwh = new Chart(document.getElementById("chartKwh"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "kWh",
                    data: kwh,
                    borderColor: "#22d3ee",
                    backgroundColor: "rgba(34,211,238,0.2)",
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: darkText }, grid: { color: darkGrid } },
                    y: { ticks: { color: darkText }, grid: { color: darkGrid } }
                }
            }
        });

        // CONSUMO
        window._chartConsumption = new Chart(document.getElementById("chartConsumption"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "kWh/100km",
                    data: consumption,
                    backgroundColor: "#60a5fa"
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: darkText }, grid: { color: darkGrid } },
                    y: { ticks: { color: darkText }, grid: { color: darkGrid } }
                }
            }
        });

        // €/kWh
        window._chartEurKwh = new Chart(document.getElementById("chartEurKwh"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "€/kWh",
                    data: eurKwh,
                    backgroundColor: "#c084fc"
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: darkText }, grid: { color: darkGrid } },
                    y: { ticks: { color: darkText }, grid: { color: darkGrid } }
                }
            }
        });

    }, [view, charges]);


    // ==========================================
    // ANALISI AVANZATA (NUOVA FUNZIONE)
    // ==========================================
    const calculateAdvancedAnalysis = () => {
        if (!charges || charges.length === 0) return null;

        const valid = charges.filter(c => c.consumption && c.km_since_last > 0);
        if (valid.length === 0) return null;

        const consumptions = valid.map(c => parseFloat(c.consumption));
        const kmTotals = valid.map(c => parseFloat(c.km_since_last));

        const best = Math.min(...consumptions);
        const worst = Math.max(...consumptions);

        const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;

        const last5 = consumptions.slice(-5);
        const avgLast5 = last5.reduce((a, b) => a + b, 0) / last5.length;

        const trend = avgLast5 - avg; // negativo = miglioramento

        const efficiency = Math.max(
            0,
            Math.min(
                100,
                100 - ((avgLast5 - best) / (worst - best)) * 100
            )
        );

        let comment = "";
        if (trend < -0.5) {
            comment = "Stai migliorando in modo significativo nelle ultime ricariche.";
        } else if (trend < 0) {
            comment = "Piccolo miglioramento rispetto alla tua media storica.";
        } else if (trend < 0.5) {
            comment = "Consumo stabile rispetto alla tua media.";
        } else {
            comment = "Consumo in leggero peggioramento, controlla stile di guida o temperatura.";
        }

        return {
            best,
            worst,
            avg,
            avgLast5,
            trend,
            efficiency,
            comment
        };
    };

    const analysis = calculateAdvancedAnalysis();

    // ==========================================
    // PREVISIONI DI COSTO (NUOVA FUNZIONE)
    // ==========================================
    const calculateForecast = () => {
        if (!charges || charges.length === 0) return null;

        const now = new Date();
        const last30 = charges.filter(c => {
            const d = new Date(c.date);
            return (now - d) / (1000 * 60 * 60 * 24) <= 30;
        });

        if (last30.length === 0) return null;

        const totalCost30 = last30.reduce((sum, c) => sum + parseFloat(c.cost), 0);
        const totalKwh30 = last30.reduce((sum, c) => sum + parseFloat(c.kwh_added), 0);
        const totalKm30 = last30.reduce((sum, c) => sum + (c.km_since_last || 0), 0);

        const avgCost = totalCost30 / last30.length;
        const avgKwh = totalKwh30 / last30.length;
        const avgKm = totalKm30 / last30.length;

        // Trend basato sulle ultime 5 ricariche
        const last5 = charges.slice(0, 5);
        const avgCostLast5 = last5.reduce((s, c) => s + parseFloat(c.cost), 0) / last5.length;

        const trend = avgCostLast5 - avgCost; // positivo = aumento

        // Previsione mese prossimo
        const forecastCost = avgCost * 8 + trend * 2; // 8 ricariche medie/mese
        const forecastKwh = avgKwh * 8;
        const forecastKm = avgKm * 8;

        let comment = "";
        if (trend < -0.5) comment = "I costi stanno diminuendo rispetto al mese scorso.";
        else if (trend < 0.2) comment = "Costi stabili rispetto al mese scorso.";
        else comment = "I costi sono in leggero aumento, controlla le tariffe dei fornitori.";

        return {
            forecastCost,
            forecastKwh,
            forecastKm,
            trend,
            comment
        };
    };

    const forecast = calculateForecast();


    // ==========================================
    // CARICA TUTTI I DATI
    // ==========================================
    const loadData = async () => {

        if (!supabase) return;

        setIsLoading(true);
        setIsSyncing(true);
        setError(null);

        try {
            // 1. Charges
            const { data: chargesData, error: chargesError } = await supabase
                .from("charges")
                .select("*")
                .order("date", { ascending: false });

            if (chargesError) {
                if (chargesError.code === "42P01") {
                    setError("Tabelle non trovate! Esegui lo script SQL in Supabase.");
                    alert("❌ Tabelle non trovate! Devi eseguire lo script SQL.");
                } else {
                    setError("Errore caricamento ricariche: " + chargesError.message);
                }
            } else {
                setCharges(chargesData || []);
            }

            // 2. Suppliers
            const { data: suppliersData, error: suppliersError } = await supabase
                .from("suppliers")
                .select("*");

            if (suppliersError) {
                setError("Errore caricamento fornitori: " + suppliersError.message);
            } else if (suppliersData?.length > 0) {
                setSuppliers(suppliersData);
            } else {
                // crea "Casa"
                const { data: homeSupplier } = await supabase
                    .from("suppliers")
                    .insert([{ name: "Casa", type: "AC", standard_cost: 0 }])
                    .select()
                    .single();

                if (homeSupplier) setSuppliers([homeSupplier]);
            }

            // 3. Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from("settings")
                .select("*")
                .single();

            if (!settingsError && settingsData) {
                setSettings({
                    gasolinePrice: settingsData.gasoline_price,
                    dieselPrice: settingsData.diesel_price,
                    homeElectricityPrice: settingsData.home_electricity_price,
                    gasolineConsumption: settingsData.gasoline_consumption,
                    dieselConsumption: settingsData.diesel_consumption
                });
            }
        } catch (error) {
            setError("Errore caricamento dati: " + error.message);
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    // ==========================================
    // SALVA NUOVA RICARICA
    // ==========================================
    const saveCharge = async () => {
        if (!newCharge.totalKm || !newCharge.kWhAdded || !newCharge.supplier) {
            alert("Compila tutti i campi obbligatori");
            return;
        }

        setIsSyncing(true);

        const supplier = suppliers.find(s => s.id === parseInt(newCharge.supplier));
        if (!supplier) {
            alert("Fornitore non trovato");
            setIsSyncing(false);
            return;
        }

        // ==========================================
        // CALCOLO KM DALLA RICARICA PRECEDENTE
        // ==========================================
        let kmSinceLast = null;
        let consumption = null;

        if (charges.length > 0) {
            const previous = charges[0];
            const prevKm = parseFloat(previous.total_km);
            const currentKm = parseFloat(newCharge.totalKm);

            if (!isNaN(prevKm) && currentKm > prevKm) {
                kmSinceLast = currentKm - prevKm;

                if (kmSinceLast > 0) {
                    consumption =
                        (parseFloat(newCharge.kWhAdded) / kmSinceLast) * 100;
                }
            }
        }

        // ==========================================
        // CALCOLO COSTO
        // ==========================================
        let finalCost = parseFloat(newCharge.cost) || 0;
        let costDifference = null;

        if (supplier.name === "Casa") {
            finalCost =
                parseFloat(newCharge.kWhAdded) *
                settings.homeElectricityPrice;
        } else {
            const standardCost =
                parseFloat(newCharge.kWhAdded) *
                parseFloat(supplier.standard_cost);
            costDifference = finalCost - standardCost;
        }

        try {
            const { data, error } = await supabase
                .from("charges")
                .insert([
                    {
                        date: newCharge.date,
                        total_km: parseFloat(newCharge.totalKm),
                        kwh_added: parseFloat(newCharge.kWhAdded),
                        supplier_id: supplier.id,
                        supplier_name: supplier.name,
                        supplier_type: supplier.type,
                        cost: finalCost,
                        standard_cost: supplier.standard_cost,
                        cost_difference: costDifference,

                        // NUOVE COLONNE
                        km_since_last: kmSinceLast,
                        consumption: consumption,

                        // snapshot impostazioni
                        saved_gasoline_price: settings.gasolinePrice,
                        saved_diesel_price: settings.dieselPrice,
                        saved_gasoline_consumption: settings.gasolineConsumption,
                        saved_diesel_consumption: settings.dieselConsumption
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setCharges(prev => [data, ...prev]);

            setNewCharge({
                date: new Date().toISOString().slice(0, 16),
                totalKm: "",
                kWhAdded: "",
                supplier: "",
                cost: ""
            });

            setShowAddCharge(false);
            alert("Ricarica salvata!");
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // ==========================================
    // SALVA NUOVO FORNITORE
    // ==========================================
    const saveSupplier = async () => {
        if (!newSupplier.name || !newSupplier.standardCost) {
            alert("Compila tutti i campi");
            return;
        }

        setIsSyncing(true);

        try {
            const { data, error } = await supabase
                .from("suppliers")
                .insert([
                    {
                        name: newSupplier.name,
                        type: newSupplier.type,
                        standard_cost: parseFloat(newSupplier.standardCost)
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setSuppliers(prev => [...prev, data]);

            setNewSupplier({ name: "", type: "AC", standardCost: "" });
            setShowAddSupplier(false);

            alert("Fornitore salvato!");
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // ==========================================
    // SALVA IMPOSTAZIONI
    // ==========================================
    const saveSettings = async () => {
        setIsSyncing(true);

        try {
            const { error } = await supabase
                .from("settings")
                .update({
                    gasoline_price: settings.gasolinePrice,
                    diesel_price: settings.dieselPrice,
                    home_electricity_price: settings.homeElectricityPrice,
                    gasoline_consumption: settings.gasolineConsumption,
                    diesel_consumption: settings.dieselConsumption
                })
                .eq("id", 1);

            if (error) throw error;

            alert("Impostazioni salvate!");
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // ==========================================
    // ELIMINA RICARICA
    // ==========================================
    const deleteCharge = async id => {
        if (!confirm("Eliminare questa ricarica?")) return;

        setIsSyncing(true);

        try {
            const { error } = await supabase
                .from("charges")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setCharges(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // ==========================================
    // ELIMINA FORNITORE
    // ==========================================
    const deleteSupplier = async id => {
        const supplier = suppliers.find(s => s.id === id);

        if (supplier?.name === "Casa") {
            alert('Non puoi eliminare il fornitore "Casa"');
            return;
        }

        if (!confirm("Eliminare questo fornitore?")) return;

        setIsSyncing(true);

        try {
            const { error } = await supabase
                .from("suppliers")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setSuppliers(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // ==========================================
    // CALCOLA STATISTICHE GLOBALI
    // ==========================================
    const calculateStats = () => {
        if (charges.length === 0) return null;

        const totalKwh = charges.reduce(
            (sum, c) => sum + parseFloat(c.kwh_added || 0),
            0
        );

        const totalCost = charges.reduce(
            (sum, c) => sum + parseFloat(c.cost || 0),
            0
        );

        const avgCostPerKwh = totalCost / totalKwh;

        const sortedByKm = [...charges].sort(
            (a, b) => parseFloat(a.total_km) - parseFloat(b.total_km)
        );

        const kmDriven =
            parseFloat(sortedByKm.at(-1).total_km) -
            parseFloat(sortedByKm[0].total_km);

        const consumption =
            kmDriven > 0 ? (totalKwh / kmDriven) * 100 : 0;

        let gasolineCost = 0;
        let dieselCost = 0;

        charges.forEach(charge => {
            const gasPrice =
                charge.saved_gasoline_price || settings.gasolinePrice;
            const diesPrice =
                charge.saved_diesel_price || settings.dieselPrice;
            const gasCons =
                charge.saved_gasoline_consumption ||
                settings.gasolineConsumption;
            const diesCons =
                charge.saved_diesel_consumption ||
                settings.dieselConsumption;

            const estimatedKm =
                parseFloat(charge.kwh_added) / (consumption / 100);

            gasolineCost += (estimatedKm / gasCons) * gasPrice;
            dieselCost += (estimatedKm / diesCons) * diesPrice;
        });

        return {
            totalKwh: totalKwh.toFixed(2),
            totalCost: totalCost.toFixed(2),
            avgCostPerKwh: avgCostPerKwh.toFixed(3),
            kmDriven: kmDriven.toFixed(0),
            consumption: consumption.toFixed(2),
            gasolineSavings: (gasolineCost - totalCost).toFixed(2),
            dieselSavings: (dieselCost - totalCost).toFixed(2),
            chargesCount: charges.length
        };
    };

    const stats = calculateStats();

    // ==========================================
    // RENDER: CARICAMENTO
    // ==========================================
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <div className="text-emerald-400 text-2xl font-bold">
                        Caricamento dati...
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER: ERRORE
    // ==========================================
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 max-w-lg">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-400 mb-4">
                        Errore
                    </h2>
                    <p className="text-white mb-6">{error}</p>
                    <button
                        onClick={loadData}
                        className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold"
                    >
                        🔄 Riprova
                    </button>
                </div>
            </div>
        );
    }

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

                        {stats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in">
                                ...tutte le statistiche...
                            </div>
                        )}

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

                                        <p className={`text-xl font-bold ${analysis.trend < 0
                                            ? "text-emerald-400"
                                            : analysis.trend > 0
                                                ? "text-red-400"
                                                : "text-yellow-400"
                                            }`}>
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
                                        <span className="text-emerald-400 font-bold">{analysis.efficiency.toFixed(0)}%</span>
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
                                        <span className={`font-bold ${forecast.trend < 0
                                            ? "text-emerald-400"
                                            : forecast.trend > 0
                                                ? "text-red-400"
                                                : "text-yellow-400"
                                            }`}>
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
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full border border-emerald-500/20 sm:border-emerald-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
                                    <h2 className="text-2xl font-bold mb-6 text-emerald-400">➕ Nuova Ricarica</h2>

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
                                        {newCharge.supplier &&
                                            suppliers.find(s => s.id === parseInt(newCharge.supplier))?.name !== "Casa" && (
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
                                        {newCharge.supplier &&
                                            suppliers.find(s => s.id === parseInt(newCharge.supplier))?.name === "Casa" && (
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
                                            onClick={() => setShowAddCharge(false)}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                                        >
                                            Annulla
                                        </button>

                                        <button
                                            onClick={saveCharge}
                                            disabled={isSyncing}
                                            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 px-4 py-2 rounded-lg font-bold"
                                        >
                                            {isSyncing ? "💾 Salvataggio..." : "💾 Salva"}
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                                        <span className="text-emerald-400 font-semibold">{charge.supplier_name}</span>
                                                        <span className="text-slate-400">({charge.supplier_type})</span>
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
                                                    <span className="ml-2 text-cyan-400 font-semibold">{charge.kwh_added}</span>
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
                                                        {(parseFloat(charge.cost) / parseFloat(charge.kwh_added)).toFixed(3)}
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
                                                                    {parseFloat(charge.km_since_last).toFixed(0)} km
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
                                                            Rispetto al costo standard (€{parseFloat(charge.standard_cost).toFixed(3)}/kWh):
                                                        </span>

                                                        <span
                                                            className={`font-semibold ${parseFloat(charge.cost_difference) > 0
                                                                ? "text-red-400"
                                                                : parseFloat(charge.cost_difference) < 0
                                                                    ? "text-green-400"
                                                                    : "text-slate-400"
                                                                }`}
                                                        >
                                                            {parseFloat(charge.cost_difference) > 0 ? "+" : ""}
                                                            €{parseFloat(charge.cost_difference).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs text-slate-500 mt-1">
                                                        Costo standard totale: €
                                                        {(parseFloat(charge.kwh_added) * parseFloat(charge.standard_cost)).toFixed(2)}
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
                                                    gasolineConsumption: parseFloat(e.target.value) || 0
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
                                                    dieselConsumption: parseFloat(e.target.value) || 0
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
                                                homeElectricityPrice: parseFloat(e.target.value) || 0
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
                                                    onClick={() => deleteSupplier(s.id)}
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

                {view === "charts" && (
                    <div className="animate-fade-in space-y-10">

                        <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                            ⚡📈 Grafici delle Ricariche
                        </h2>

                        {/* ================================
                            GRAFICO 1 — COSTO PER RICARICA
                            ================================= */}
                        <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4">
                            <h3 className="text-lg font-semibold text-emerald-300 mb-3">
                                💶 Costo per ricarica
                            </h3>
                            <canvas id="chartCost"></canvas>
                        </div>

                        {/* ================================
                            GRAFICO 2 — kWh PER RICARICA
                            ================================= */}
                        <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4">
                            <h3 className="text-lg font-semibold text-cyan-300 mb-3">
                                ⚡ kWh per ricarica
                            </h3>
                            <canvas id="chartKwh"></canvas>
                        </div>

                        {/* ================================
                            GRAFICO 3 — CONSUMO REALE
                            ================================= */}
                        <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4">
                            <h3 className="text-lg font-semibold text-blue-300 mb-3">
                                🚗 Consumo reale (kWh/100km)
                            </h3>
                            <canvas id="chartConsumption"></canvas>
                        </div>

                        {/* ================================
                            GRAFICO 4 — €/kWh
                            ================================= */}
                        <div className="bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4">
                            <h3 className="text-lg font-semibold text-purple-300 mb-3">
                                💰 €/kWh per ricarica
                            </h3>
                            <canvas id="chartEurKwh"></canvas>
                        </div>

                    </div>
                )}


                {/* MODALE NUOVO FORNITORE */}
                {showAddSupplier && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full border border-emerald-500/20 sm:border-emerald-500/30 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-emerald-400">
                                ➕ Nuovo Fornitore
                            </h2>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="block text-slate-300 mb-1">
                                        Nome Fornitore
                                    </label>
                                    <input
                                        type="text"
                                        value={newSupplier.name}
                                        onChange={e =>
                                            setNewSupplier({
                                                ...newSupplier,
                                                name: e.target.value
                                            })
                                        }
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        value={newSupplier.type}
                                        onChange={e =>
                                            setNewSupplier({
                                                ...newSupplier,
                                                type: e.target.value
                                            })
                                        }
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value="AC">AC</option>
                                        <option value="DC">DC</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-1">
                                        Costo Standard (€/kWh)
                                    </label>
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
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddSupplier(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                                >
                                    Annulla
                                </button>

                                <button
                                    onClick={saveSupplier}
                                    disabled={isSyncing}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 px-4 py-2 rounded-lg font-bold"
                                >
                                    {isSyncing ? "💾 Salvataggio..." : "💾 Salva"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <footer className="mt-10 text-center text-xs text-slate-500">
                    EV Cost Tracker · progettato con cura
                </footer>
            </main>
        </div>
    );
};

// ==========================================
// MOUNT REACT APP
// ==========================================
const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<EVCostTracker />);

