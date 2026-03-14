/**
 * ============================================================
 * CHARTS.JS - Componenti Grafici Avanzati per EV Cost Tracker
 * ============================================================
 * 
 * VERSIONE 3.0 - Grafici interattivi con filtri e selezione
 * 
 * NOVITÀ:
 * --------
 * - Filtro temporale (7/30/90 giorni, anno, tutto)
 * - Toggle per selezionare quali grafici mostrare
 * - Nuovi grafici: costo/km, risparmio vs benzina, AC vs DC
 * - Statistiche riassuntive in alto
 * - Layout responsive ottimizzato
 * 
 * GRAFICI DISPONIBILI:
 * --------------------
 * 1. Panoramica (kWh + €) - Bar + Line combinato
 * 2. Efficienza (kWh/100km) - Line con area
 * 3. Fornitori (distribuzione) - Doughnut
 * 4. Costo al km (€/km) - Line
 * 5. Risparmio vs Benzina - Bar comparativo
 * 6. AC vs DC - Confronto grafico
 * 7. Analisi Batteria - Distribuzione SOC
 * 
 * @author EV Cost Tracker Team
 * @version 3.0 - Grafici interattivi con filtri
 * ============================================================
 */

/* ============================================================
   COSTANTI E CONFIGURAZIONE
   ============================================================ */

// Configurazione grafici disponibili
const CHART_CONFIGS = {
    overview: { 
        id: 'overview', 
        label: '📊 Panoramica kWh/€', 
        icon: '📊',
        defaultEnabled: true,
        fullWidth: true,
        minHeight: 320
    },
    efficiency: { 
        id: 'efficiency', 
        label: '⚡ Efficienza (kWh/100km)', 
        icon: '⚡',
        defaultEnabled: true,
        fullWidth: false,
        minHeight: 280
    },
    suppliers: { 
        id: 'suppliers', 
        label: '🏪 Fornitori', 
        icon: '🏪',
        defaultEnabled: true,
        fullWidth: false,
        minHeight: 320
    },
    costPerKm: { 
        id: 'costPerKm', 
        label: '💰 Costo al km', 
        icon: '💰',
        defaultEnabled: true,
        fullWidth: false,
        minHeight: 280
    },
    savings: { 
        id: 'savings', 
        label: '🌱 Risparmio vs Benzina', 
        icon: '🌱',
        defaultEnabled: true,
        fullWidth: true,
        minHeight: 300
    },
    acVsDc: { 
        id: 'acVsDc', 
        label: '🔌 AC vs DC', 
        icon: '🔌',
        defaultEnabled: false,
        fullWidth: true,
        minHeight: 300
    },
    battery: { 
        id: 'battery', 
        label: '🔋 Analisi Batteria', 
        icon: '🔋',
        defaultEnabled: false,
        fullWidth: false,
        minHeight: 280
    }
};

// Opzioni filtro temporale
const TIME_FILTERS = [
    { id: '7d', label: '7 giorni', days: 7 },
    { id: '30d', label: '30 giorni', days: 30 },
    { id: '90d', label: '90 giorni', days: 90 },
    { id: 'year', label: 'Anno', days: 365 },
    { id: 'all', label: 'Tutto', days: null }
];

// Colori tema
const CHART_COLORS = {
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    gray: '#64748b',
    ac: '#22c55e',    // Verde per AC
    dc: '#f97316'     // Arancione per DC
};

/* ============================================================
   HELPER: FILTRO E AGGREGAZIONE DATI
   ============================================================ */

/**
 * Filtra le ricariche per intervallo temporale
 */
function filterChargesByTime(charges, filterId) {
    if (!charges || charges.length === 0) return [];
    if (filterId === 'all') return charges;
    
    const filter = TIME_FILTERS.find(f => f.id === filterId);
    if (!filter || !filter.days) return charges;
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.days);
    cutoff.setHours(0, 0, 0, 0);
    
    if (filterId === 'year') {
        cutoff.setMonth(0, 1); // 1 gennaio dell'anno corrente
        cutoff.setHours(0, 0, 0, 0);
    }
    
    return charges.filter(c => new Date(c.date) >= cutoff);
}

/**
 * Aggrega i dati per periodo (giorno/mese automatico)
 */
function smartAggregate(charges, forceMode = null) {
    if (!charges || charges.length === 0) {
        return { labels: [], costs: [], kwhs: [], mode: 'month', data: [] };
    }

    const sorted = [...charges].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const mode = forceMode || (diffDays < 35 ? 'day' : 'month');
    const groups = {};

    sorted.forEach(c => {
        const d = new Date(c.date);
        let key, label;

        if (mode === 'day') {
            key = d.toISOString().split('T')[0];
            label = d.toLocaleDateString("it-IT", { day: '2-digit', month: 'short' });
        } else {
            key = `${d.getFullYear()}-${d.getMonth()}`;
            label = d.toLocaleDateString("it-IT", { month: 'short', year: '2-digit' });
        }

        if (!groups[key]) {
            groups[key] = { 
                label: label, 
                cost: 0, 
                kwh: 0, 
                km: 0,
                count: 0,
                consumption: 0,
                consumptionCount: 0
            };
        }

        groups[key].cost += parseFloat(c.cost) || 0;
        groups[key].kwh += parseFloat(c.kwh_added) || 0;
        groups[key].km += parseFloat(c.km_since_last) || 0;
        groups[key].count++;
        
        if (c.consumption && c.consumption > 0 && c.consumption < 50) {
            groups[key].consumption += parseFloat(c.consumption);
            groups[key].consumptionCount++;
        }
    });

    const values = Object.values(groups);
    
    return {
        labels: values.map(v => v.label),
        costs: values.map(v => v.cost),
        kwhs: values.map(v => v.kwh),
        kms: values.map(v => v.km),
        counts: values.map(v => v.count),
        consumptions: values.map(v => v.consumptionCount > 0 ? v.consumption / v.consumptionCount : null),
        mode: mode,
        data: values
    };
}

/**
 * Calcola statistiche aggregate
 */
function calculateChartStats(charges) {
    if (!charges || charges.length === 0) return null;
    
    const stats = {
        totalCharges: charges.length,
        totalKwh: 0,
        totalCost: 0,
        totalKm: 0,
        totalKmValid: 0,
        avgConsumption: 0,
        consumptionCount: 0,
        avgCostPerKwh: 0,
        avgCostPerKm: 0,
        acCharges: 0,
        dcCharges: 0,
        acKwh: 0,
        dcKwh: 0,
        acCost: 0,
        dcCost: 0,
        avgBatteryStart: 0,
        avgBatteryEnd: 0,
        batteryRange: 0,
        savingsVsGasoline: 0,
        savingsVsDiesel: 0
    };
    
    let batteryStartSum = 0, batteryEndSum = 0, batteryCount = 0;
    
    charges.forEach(c => {
        const kwh = parseFloat(c.kwh_added) || 0;
        const cost = parseFloat(c.cost) || 0;
        const km = parseFloat(c.km_since_last) || 0;
        const consumption = parseFloat(c.consumption) || 0;
        
        stats.totalKwh += kwh;
        stats.totalCost += cost;
        
        if (km > 0) {
            stats.totalKm += km;
            stats.totalKmValid++;
        }
        
        if (consumption > 0 && consumption < 50) {
            stats.avgConsumption += consumption;
            stats.consumptionCount++;
        }
        
        // AC vs DC
        if (c.supplier_type === 'AC') {
            stats.acCharges++;
            stats.acKwh += kwh;
            stats.acCost += cost;
        } else if (c.supplier_type === 'DC') {
            stats.dcCharges++;
            stats.dcKwh += kwh;
            stats.dcCost += cost;
        }
        
        // Batteria
        if (c.battery_start !== null && c.battery_end !== null) {
            batteryStartSum += parseFloat(c.battery_start) || 0;
            batteryEndSum += parseFloat(c.battery_end) || 0;
            batteryCount++;
            stats.batteryRange += (parseFloat(c.battery_end) - parseFloat(c.battery_start));
        }
    });
    
    // Calcoli medie
    if (stats.consumptionCount > 0) {
        stats.avgConsumption = stats.avgConsumption / stats.consumptionCount;
    }
    
    if (stats.totalKwh > 0) {
        stats.avgCostPerKwh = stats.totalCost / stats.totalKwh;
    }
    
    if (stats.totalKmValid > 0 && stats.totalKwh > 0) {
        stats.avgCostPerKm = stats.totalCost / stats.totalKm;
    }
    
    if (batteryCount > 0) {
        stats.avgBatteryStart = batteryStartSum / batteryCount;
        stats.avgBatteryEnd = batteryEndSum / batteryCount;
        stats.batteryRange = stats.batteryRange / batteryCount;
    }
    
    // Risparmio vs carburante (stima con 1.9€/L benzina, 15L/100km e 1.8€/L diesel, 18L/100km)
    const gasolinePricePerKm = 1.9 * 15 / 100; // €/km
    const dieselPricePerKm = 1.8 * 18 / 100;   // €/km
    stats.savingsVsGasoline = (gasolinePricePerKm * stats.totalKm) - stats.totalCost;
    stats.savingsVsDiesel = (dieselPricePerKm * stats.totalKm) - stats.totalCost;
    
    return stats;
}

/* ============================================================
   COMPONENTE: PANNELLO FILTRI E SETTINGS
   ============================================================ */

function ChartSettingsPanel({ timeFilter, setTimeFilter, enabledCharts, setEnabledCharts }) {
    
    const toggleChart = (chartId) => {
        setEnabledCharts(prev => ({
            ...prev,
            [chartId]: !prev[chartId]
        }));
    };
    
    const enabledCount = Object.values(enabledCharts).filter(Boolean).length;
    
    return (
        <div className="bg-card-soft rounded-xl p-4 mb-6 space-y-4">
            {/* Filtro Temporale */}
            <div>
                <label className="text-xs text-muted uppercase tracking-wide mb-2 block">📅 Periodo</label>
                <div className="flex flex-wrap gap-2">
                    {TIME_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setTimeFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                timeFilter === f.id 
                                    ? 'bg-accent text-bg' 
                                    : 'bg-card hover:bg-card-border text-muted'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Toggle Grafici */}
            <div>
                <label className="text-xs text-muted uppercase tracking-wide mb-2 block">
                    📊 Grafici visibili ({enabledCount}/{Object.keys(CHART_CONFIGS).length})
                </label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(CHART_CONFIGS).map(config => (
                        <button
                            key={config.id}
                            onClick={() => toggleChart(config.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                enabledCharts[config.id] 
                                    ? 'bg-accent/20 text-accent border border-accent/30' 
                                    : 'bg-card text-muted opacity-60 hover:opacity-100'
                            }`}
                        >
                            <span>{config.icon}</span>
                            <span className="hidden sm:inline">{config.label.replace(config.icon + ' ', '')}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   COMPONENTE: STATISTICHE RIASSUNTIVE
   ============================================================ */

function StatsSummary({ stats, filteredCount }) {
    if (!stats) return null;
    
    const statItems = [
        { 
            label: 'Ricariche', 
            value: filteredCount, 
            icon: '🔌',
            color: 'text-blue-400'
        },
        { 
            label: 'kWh Totali', 
            value: stats.totalKwh.toFixed(1), 
            icon: '⚡',
            color: 'text-yellow-400'
        },
        { 
            label: 'Spesa Totale', 
            value: `€${stats.totalCost.toFixed(2)}`, 
            icon: '💶',
            color: 'text-green-400'
        },
        { 
            label: '€/kWh Medio', 
            value: stats.avgCostPerKwh.toFixed(3), 
            icon: '📊',
            color: 'text-purple-400'
        },
        { 
            label: 'Efficienza', 
            value: stats.consumptionCount > 0 ? `${stats.avgConsumption.toFixed(1)} kWh/100km` : 'N/D', 
            icon: '🚗',
            color: 'text-emerald-400'
        },
        { 
            label: '€/km', 
            value: stats.totalKmValid > 0 ? `€${stats.avgCostPerKm.toFixed(3)}` : 'N/D', 
            icon: '💰',
            color: 'text-pink-400'
        }
    ];
    
    return (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            {statItems.map((item, idx) => (
                <div key={idx} className="bg-card-soft rounded-lg p-3 text-center">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-[10px] text-muted uppercase">{item.label}</div>
                </div>
            ))}
        </div>
    );
}

/* ============================================================
   GRAFICO 1: PANORAMICA kWh/€
   ============================================================ */

function OverviewChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        
        if (chartRef.current) chartRef.current.destroy();

        const { labels, costs, kwhs, mode } = smartAggregate(charges);

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Spesa (€)",
                        data: costs,
                        type: "line",
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: CHART_COLORS.primary,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: styles.getPropertyValue("--bg"),
                        pointBorderWidth: 2,
                        tension: 0.3,
                        yAxisID: 'y1',
                        order: 1
                    },
                    {
                        label: "kWh",
                        data: kwhs,
                        backgroundColor: "rgba(59, 130, 246, 0.5)",
                        borderColor: "rgba(59, 130, 246, 1)",
                        borderWidth: 1,
                        borderRadius: 6,
                        yAxisID: 'y',
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            boxWidth: 12, 
                            padding: 15,
                            usePointStyle: true
                        } 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Spesa: €${context.parsed.y.toFixed(2)}`;
                                } else {
                                    return `Energia: ${context.parsed.y.toFixed(1)} kWh`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            maxTicksLimit: 10,
                            font: { size: 10 }
                        } 
                    },
                    y: { 
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => v + ' kWh'
                        },
                        title: {
                            display: true,
                            text: 'kWh',
                            color: styles.getPropertyValue("--text-muted")
                        }
                    },
                    y1: { 
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => '€' + v
                        },
                        title: {
                            display: true,
                            text: '€',
                            color: styles.getPropertyValue("--text-muted")
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.overview.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-3 shrink-0">
                📊 Panoramica Consumi
            </h3>
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 2: EFFICIENZA (kWh/100km)
   ============================================================ */

function EfficiencyChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        // Filtra ricariche con consumo valido
        const validCharges = charges
            .filter(c => c.consumption && c.consumption > 0 && c.consumption < 50)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-15);  // Ultime 15

        if (validCharges.length === 0) {
            return;
        }

        const labels = validCharges.map(c => 
            new Date(c.date).toLocaleDateString("it-IT", { day: '2-digit', month: 'short' })
        );
        const dataPoints = validCharges.map(c => parseFloat(c.consumption));
        const avgConsumption = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;

        // Gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "kWh/100km",
                        data: dataPoints,
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: CHART_COLORS.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        borderWidth: 2
                    },
                    {
                        label: "Media",
                        data: Array(dataPoints.length).fill(avgConsumption),
                        borderColor: CHART_COLORS.accent,
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            usePointStyle: true
                        } 
                    },
                    tooltip: {
                        intersect: false,
                        callbacks: { 
                            label: (ctx) => ctx.datasetIndex === 0 
                                ? `${ctx.parsed.y.toFixed(1)} kWh/100km`
                                : `Media: ${avgConsumption.toFixed(1)} kWh/100km`
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            font: { size: 10 },
                            maxRotation: 45
                        } 
                    },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => v + ' kWh/100km'
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    // Se non ci sono dati validi
    const hasValidData = charges?.some(c => c.consumption && c.consumption > 0 && c.consumption < 50);
    
    if (!hasValidData) {
        return (
            <div className="chart-card flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: CHART_CONFIGS.efficiency.minHeight + 'px' }}>
                <div className="text-4xl mb-3 opacity-30">⚡</div>
                <div className="text-muted text-sm">Dati insufficienti</div>
                <div className="text-muted text-xs opacity-60 mt-1">Inserisci i km per vedere l'efficienza</div>
            </div>
        );
    }

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.efficiency.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-2 shrink-0">
                ⚡ Efficienza Energetica
            </h3>
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 3: FORNITORI (Doughnut)
   ============================================================ */

function SuppliersChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    const totalCost = React.useMemo(() => {
        return charges?.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0) || 0;
    }, [charges]);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        // Aggrega per fornitore (kWh e cost)
        const supplierData = {};
        
        charges.forEach(c => {
            const name = c.supplier_name || "Sconosciuto";
            if (!supplierData[name]) {
                supplierData[name] = { cost: 0, kwh: 0, count: 0, type: c.supplier_type };
            }
            supplierData[name].cost += parseFloat(c.cost) || 0;
            supplierData[name].kwh += parseFloat(c.kwh_added) || 0;
            supplierData[name].count++;
        });

        const sortedSuppliers = Object.entries(supplierData).sort((a, b) => b[1].cost - a[1].cost);
        
        const labels = [];
        const costs = [];
        const kwhs = [];
        
        sortedSuppliers.forEach(([name, data], index) => {
            if (index < 5) {
                labels.push(name);
                costs.push(data.cost);
                kwhs.push(data.kwh);
            } else if (index === 5) {
                labels.push("Altri");
                costs.push(data.cost);
                kwhs.push(data.kwh);
            } else {
                costs[5] += data.cost;
                kwhs[5] += data.kwh;
            }
        });

        const colors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.pink, CHART_COLORS.purple, CHART_COLORS.gray];

        chartRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: costs.map(d => d.toFixed(2)),
                    backgroundColor: colors,
                    borderColor: styles.getPropertyValue("--card"),
                    borderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            padding: 12,
                            font: { size: 11 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                const cost = costs[idx];
                                const kwh = kwhs[idx];
                                const percent = ((cost / totalCost) * 100).toFixed(1);
                                return [
                                    `€${cost.toFixed(2)} (${percent}%)`,
                                    `${kwh.toFixed(1)} kWh`
                                ];
                            }
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme, totalCost]);

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.suppliers.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-2 shrink-0">
                🏪 Top Fornitori
            </h3>
            <div className="relative flex-1 w-full min-h-0 flex items-center justify-center">
                <canvas ref={canvasRef}></canvas>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <div className="text-xs text-muted">Speso</div>
                    <div className="text-2xl font-bold text-saving">€{totalCost.toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 4: COSTO AL KM
   ============================================================ */

function CostPerKmChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        // Filtra ricariche con km validi
        const validCharges = charges
            .filter(c => c.km_since_last && c.km_since_last > 0 && c.cost > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-15);

        if (validCharges.length === 0) return;

        const labels = validCharges.map(c => 
            new Date(c.date).toLocaleDateString("it-IT", { day: '2-digit', month: 'short' })
        );
        
        const costPerKm = validCharges.map(c => {
            const km = parseFloat(c.km_since_last);
            const cost = parseFloat(c.cost);
            return km > 0 ? cost / km : null;
        });
        
        const avgCostPerKm = costPerKm.filter(v => v !== null).reduce((a, b) => a + b, 0) / costPerKm.filter(v => v !== null).length;

        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.0)');

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "€/km",
                        data: costPerKm,
                        borderColor: CHART_COLORS.pink,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: CHART_COLORS.pink,
                        borderWidth: 2
                    },
                    {
                        label: "Media",
                        data: Array(costPerKm.length).fill(avgCostPerKm),
                        borderColor: CHART_COLORS.accent,
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12
                        } 
                    },
                    tooltip: {
                        intersect: false,
                        callbacks: { 
                            label: (ctx) => ctx.datasetIndex === 0 
                                ? `€${ctx.parsed.y.toFixed(3)}/km`
                                : `Media: €${avgCostPerKm.toFixed(3)}/km`
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            font: { size: 10 }
                        } 
                    },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => '€' + v.toFixed(3)
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    const hasValidData = charges?.some(c => c.km_since_last && c.km_since_last > 0 && c.cost > 0);

    if (!hasValidData) {
        return (
            <div className="chart-card flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: CHART_CONFIGS.costPerKm.minHeight + 'px' }}>
                <div className="text-4xl mb-3 opacity-30">💰</div>
                <div className="text-muted text-sm">Dati insufficienti</div>
                <div className="text-muted text-xs opacity-60 mt-1">Inserisci i km per vedere il costo al km</div>
            </div>
        );
    }

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.costPerKm.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-2 shrink-0">
                💰 Costo al km
            </h3>
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 5: RISPARMIO VS BENZINA
   ============================================================ */

function SavingsChart({ charges, theme, settings }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    // Calcola risparmio aggregato per periodo
    const savingsData = React.useMemo(() => {
        if (!charges || charges.length === 0) return null;

        const groups = {};
        
        charges.forEach(c => {
            const d = new Date(c.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const label = d.toLocaleDateString("it-IT", { month: 'short', year: '2-digit' });
            
            if (!groups[key]) {
                groups[key] = { label, kwh: 0, cost: 0, km: 0 };
            }
            
            groups[key].kwh += parseFloat(c.kwh_added) || 0;
            groups[key].cost += parseFloat(c.cost) || 0;
            groups[key].km += parseFloat(c.km_since_last) || 0;
        });

        const values = Object.values(groups);
        const gasolinePrice = settings?.gasolinePrice || 1.9;
        const gasolineConsumption = settings?.gasolineConsumption || 15;
        const gasolineCostPerKm = gasolinePrice * gasolineConsumption / 100;

        return {
            labels: values.map(v => v.label),
            electric: values.map(v => v.cost),
            gasoline: values.map(v => v.km * gasolineCostPerKm),
            savings: values.map(v => (v.km * gasolineCostPerKm) - v.cost),
            totalKm: values.reduce((sum, v) => sum + v.km, 0)
        };
    }, [charges, settings]);

    React.useEffect(() => {
        if (!savingsData || savingsData.labels.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: savingsData.labels,
                datasets: [
                    {
                        label: "Costo Elettrico",
                        data: savingsData.electric,
                        backgroundColor: CHART_COLORS.primary,
                        borderRadius: 4,
                    },
                    {
                        label: "Costo Benzina (stimato)",
                        data: savingsData.gasoline,
                        backgroundColor: CHART_COLORS.gray,
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            usePointStyle: true
                        } 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        callbacks: {
                            afterBody: function(context) {
                                const idx = context[0].dataIndex;
                                const savings = savingsData.savings[idx];
                                return savings > 0 ? [`\n💚 Risparmi: €${savings.toFixed(2)}`] : [];
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            font: { size: 10 }
                        } 
                    },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => '€' + v
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [savingsData, theme]);

    if (!savingsData || savingsData.totalKm === 0) {
        return (
            <div className="chart-card flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: CHART_CONFIGS.savings.minHeight + 'px' }}>
                <div className="text-4xl mb-3 opacity-30">🌱</div>
                <div className="text-muted text-sm">Dati insufficienti</div>
                <div className="text-muted text-xs opacity-60 mt-1">Inserisci i km per vedere il risparmio</div>
            </div>
        );
    }

    const totalSavings = savingsData.savings.reduce((a, b) => a + b, 0);

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.savings.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-2 shrink-0">
                🌱 Risparmio vs Auto Benzina
            </h3>
            {totalSavings > 0 && (
                <div className="text-center mb-2">
                    <span className="text-xs text-muted">Hai risparmiato </span>
                    <span className="font-bold text-saving text-lg">€{totalSavings.toFixed(0)}</span>
                </div>
            )}
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 6: AC vs DC
   ============================================================ */

function ACvsDCChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    const acVsDcData = React.useMemo(() => {
        if (!charges || charges.length === 0) return null;

        const groups = {};
        
        charges.forEach(c => {
            const d = new Date(c.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const label = d.toLocaleDateString("it-IT", { month: 'short', year: '2-digit' });
            
            if (!groups[key]) {
                groups[key] = { label, ac: { kwh: 0, cost: 0, count: 0 }, dc: { kwh: 0, cost: 0, count: 0 } };
            }
            
            if (c.supplier_type === 'AC') {
                groups[key].ac.kwh += parseFloat(c.kwh_added) || 0;
                groups[key].ac.cost += parseFloat(c.cost) || 0;
                groups[key].ac.count++;
            } else if (c.supplier_type === 'DC') {
                groups[key].dc.kwh += parseFloat(c.kwh_added) || 0;
                groups[key].dc.cost += parseFloat(c.cost) || 0;
                groups[key].dc.count++;
            }
        });

        return Object.values(groups);
    }, [charges]);

    React.useEffect(() => {
        if (!acVsDcData || acVsDcData.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: acVsDcData.map(d => d.label),
                datasets: [
                    {
                        label: "AC (kWh)",
                        data: acVsDcData.map(d => d.ac.kwh),
                        backgroundColor: CHART_COLORS.ac,
                        borderRadius: 4,
                    },
                    {
                        label: "DC (kWh)",
                        data: acVsDcData.map(d => d.dc.kwh),
                        backgroundColor: CHART_COLORS.dc,
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            usePointStyle: true
                        } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                const type = context.datasetIndex === 0 ? 'ac' : 'dc';
                                const data = acVsDcData[idx][type];
                                const avgCost = data.kwh > 0 ? (data.cost / data.kwh).toFixed(3) : 0;
                                return [
                                    `${context.dataset.label}: ${data.kwh.toFixed(1)} kWh`,
                                    `€/kWh: €${avgCost}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: styles.getPropertyValue("--text-muted") } 
                    },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => v + ' kWh'
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [acVsDcData, theme]);

    const hasAC = charges?.some(c => c.supplier_type === 'AC');
    const hasDC = charges?.some(c => c.supplier_type === 'DC');

    if (!hasAC && !hasDC) {
        return (
            <div className="chart-card flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: CHART_CONFIGS.acVsDc.minHeight + 'px' }}>
                <div className="text-4xl mb-3 opacity-30">🔌</div>
                <div className="text-muted text-sm">Nessun dato AC/DC</div>
            </div>
        );
    }

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.acVsDc.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-2 shrink-0">
                🔌 Confronto AC vs DC
            </h3>
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 7: ANALISI BATTERIA
   ============================================================ */

function BatteryChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    const batteryData = React.useMemo(() => {
        if (!charges || charges.length === 0) return null;

        // Raggruppa per range SOC iniziale
        const ranges = {
            '0-20%': { count: 0, avgCharge: 0, totalCharge: 0 },
            '20-40%': { count: 0, avgCharge: 0, totalCharge: 0 },
            '40-60%': { count: 0, avgCharge: 0, totalCharge: 0 },
            '60-80%': { count: 0, avgCharge: 0, totalCharge: 0 },
            '80-100%': { count: 0, avgCharge: 0, totalCharge: 0 }
        };
        
        charges.forEach(c => {
            const start = parseFloat(c.battery_start) || 0;
            const kwh = parseFloat(c.kwh_added) || 0;
            
            let range;
            if (start < 20) range = '0-20%';
            else if (start < 40) range = '20-40%';
            else if (start < 60) range = '40-60%';
            else if (start < 80) range = '60-80%';
            else range = '80-100%';
            
            ranges[range].count++;
            ranges[range].totalCharge += kwh;
        });

        // Calcola medie
        Object.keys(ranges).forEach(key => {
            if (ranges[key].count > 0) {
                ranges[key].avgCharge = ranges[key].totalCharge / ranges[key].count;
            }
        });

        return ranges;
    }, [charges]);

    React.useEffect(() => {
        if (!batteryData) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = Object.keys(batteryData);
        const counts = Object.values(batteryData).map(r => r.count);
        const avgCharges = Object.values(batteryData).map(r => r.avgCharge);

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "N° Ricariche",
                        data: counts,
                        backgroundColor: CHART_COLORS.secondary,
                        borderRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        label: "kWh medi",
                        data: avgCharges,
                        type: "line",
                        borderColor: CHART_COLORS.accent,
                        backgroundColor: CHART_COLORS.accent,
                        pointRadius: 5,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            usePointStyle: true
                        } 
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: styles.getPropertyValue("--text-muted") } 
                    },
                    y: { 
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'N° Ricariche',
                            color: styles.getPropertyValue("--text-muted")
                        }
                    },
                    y1: { 
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            callback: v => v + ' kWh'
                        },
                        title: {
                            display: true,
                            text: 'kWh medi',
                            color: styles.getPropertyValue("--text-muted")
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [batteryData, theme]);

    const hasBatteryData = charges?.some(c => c.battery_start !== null && c.battery_start !== undefined);

    if (!hasBatteryData) {
        return (
            <div className="chart-card flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: CHART_CONFIGS.battery.minHeight + 'px' }}>
                <div className="text-4xl mb-3 opacity-30">🔋</div>
                <div className="text-muted text-sm">Dati insufficienti</div>
                <div className="text-muted text-xs opacity-60 mt-1">Inserisci la % batteria per vedere l'analisi</div>
            </div>
        );
    }

    return (
        <div className="chart-card flex flex-col" style={{ minHeight: CHART_CONFIGS.battery.minHeight + 'px' }}>
            <h3 className="chart-title text-center mb-2 shrink-0">
                🔬 Analisi SOC Iniziale
            </h3>
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   CONTAINER PRINCIPALE: CHART SECTION
   ============================================================ */

function ChartSection({ charges, theme, settings }) {
    // Stato filtri e grafici abilitati
    const [timeFilter, setTimeFilter] = React.useState('all');
    const [enabledCharts, setEnabledCharts] = React.useState(() => {
        const initial = {};
        Object.values(CHART_CONFIGS).forEach(config => {
            initial[config.id] = config.defaultEnabled;
        });
        return initial;
    });

    // Filtra ricariche per periodo
    const filteredCharges = React.useMemo(() => {
        return filterChargesByTime(charges, timeFilter);
    }, [charges, timeFilter]);

    // Calcola statistiche
    const stats = React.useMemo(() => {
        return calculateChartStats(filteredCharges);
    }, [filteredCharges]);

    // Verifica dati minimi
    if (!charges || charges.length < 2) {
        return (
            <div className="text-center p-10 card animate-fade-in">
                <div className="text-5xl mb-4">📊</div>
                <div className="text-lg font-bold mb-2">Dati insufficienti</div>
                <div className="text-muted mb-4">Servono almeno 2 ricariche per generare i grafici.</div>
                <div className="text-xs text-muted opacity-50">
                    Inizia a tracciare le tue ricariche per vedere le statistiche!
                </div>
            </div>
        );
    }

    // Prepara lista grafici da renderizzare
    const chartComponents = [];
    const fullWidthCharts = [];
    const halfWidthCharts = [];

    Object.entries(enabledCharts).forEach(([id, enabled]) => {
        if (!enabled) return;
        
        const config = CHART_CONFIGS[id];
        let component = null;

        switch (id) {
            case 'overview':
                component = <OverviewChart key={id} charges={filteredCharges} theme={theme} />;
                break;
            case 'efficiency':
                component = <EfficiencyChart key={id} charges={filteredCharges} theme={theme} />;
                break;
            case 'suppliers':
                component = <SuppliersChart key={id} charges={filteredCharges} theme={theme} />;
                break;
            case 'costPerKm':
                component = <CostPerKmChart key={id} charges={filteredCharges} theme={theme} />;
                break;
            case 'savings':
                component = <SavingsChart key={id} charges={filteredCharges} theme={theme} settings={settings} />;
                break;
            case 'acVsDc':
                component = <ACvsDCChart key={id} charges={filteredCharges} theme={theme} />;
                break;
            case 'battery':
                component = <BatteryChart key={id} charges={filteredCharges} theme={theme} />;
                break;
        }

        if (component) {
            if (config.fullWidth) {
                fullWidthCharts.push(component);
            } else {
                halfWidthCharts.push(component);
            }
        }
    });

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Pannello Filtri e Settings */}
            <ChartSettingsPanel 
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
                enabledCharts={enabledCharts}
                setEnabledCharts={setEnabledCharts}
            />

            {/* Statistiche Riassuntive */}
            {stats && <StatsSummary stats={stats} filteredCount={filteredCharges.length} />}

            {/* Messaggio se nessun grafico selezionato */}
            {fullWidthCharts.length === 0 && halfWidthCharts.length === 0 && (
                <div className="text-center p-8 card">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-muted">Seleziona almeno un grafico da visualizzare</div>
                </div>
            )}

            {/* Grafici a larghezza intera */}
            {fullWidthCharts.map(chart => (
                <div key={chart.key} className="chart-container">
                    {chart}
                </div>
            ))}

            {/* Grafici a metà larghezza (grid 2 colonne) */}
            {halfWidthCharts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {halfWidthCharts.map(chart => chart)}
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-muted opacity-40 pt-4">
                💡 Suggerimento: clicca sui pulsanti sopra per personalizzare la visualizzazione
            </div>
        </div>
    );
}
