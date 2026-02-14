//
//  CHART COMPONENTS (React UMD + Chart.js)
//  Version 2.2 - Bugfix Variabili & Mobile Optimized
//

// ===============================
// HELPER: Raggruppa dati per Mese
// ===============================
function aggregateByMonth(charges) {
    const groups = {};

    // Ordina
    const sorted = [...charges].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(c => {
        const d = new Date(c.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        // Formato breve per mobile: "Gen 24"
        const label = d.toLocaleDateString("it-IT", { month: 'short', year: '2-digit' });

        if (!groups[key]) {
            groups[key] = {
                label: label,
                cost: 0,
                kwh: 0,
                km: 0,
                count: 0
            };
        }

        groups[key].cost += parseFloat(c.cost) || 0;
        groups[key].kwh += parseFloat(c.kwh_added) || 0;
        groups[key].count++;
    });

    return Object.values(groups);
}

// ===============================
// 1. PANORAMICA MENSILE (Mobile Friendly)
// ===============================
function MonthlyOverviewChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const data = aggregateByMonth(charges);
        const labels = data.map(d => d.label);
        const costs = data.map(d => d.cost);
        const kwhs = data.map(d => d.kwh);

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Spesa (€)",
                        data: costs,
                        type: "line",
                        borderColor: styles.getPropertyValue("--accent"),
                        backgroundColor: styles.getPropertyValue("--accent"),
                        borderWidth: 2,
                        pointRadius: 3,
                        tension: 0.4,
                        yAxisID: 'y1',
                        order: 1
                    },
                    {
                        label: "kWh",
                        data: kwhs,
                        backgroundColor: "rgba(59, 130, 246, 0.4)",
                        borderColor: "rgba(59, 130, 246, 0.8)",
                        borderWidth: 1,
                        borderRadius: 4,
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
                        labels: { color: styles.getPropertyValue("--text-muted"), boxWidth: 10, padding: 10 } 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 10,
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    if (context.datasetIndex === 0) label += "€" + context.parsed.y.toFixed(0);
                                    else label += context.parsed.y.toFixed(0) + ' kWh';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"),
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 6
                        } 
                    },
                    y: { display: false },
                    y1: { display: false }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card h-[320px]">
            <h3 className="chart-title text-center">📅 Andamento Mensile</h3>
            <div className="relative h-[270px] w-full">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

// ===============================
// 2. TREND CONSUMI (Mobile Friendly)
// ===============================
function ConsumptionTrendChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const validCharges = charges
            .filter(c => c.consumption && c.consumption > 0 && c.consumption < 40)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-10);

        const labels = validCharges.map(c => 
            new Date(c.date).toLocaleDateString("it-IT", { day: '2-digit', month: 'short' })
        );
        const dataPoints = validCharges.map(c => parseFloat(c.consumption));

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, styles.getPropertyValue("--accent").replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, styles.getPropertyValue("--accent").replace(')', ', 0.0)').replace('rgb', 'rgba'));

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "kWh/100km",
                    data: dataPoints,
                    borderColor: styles.getPropertyValue("--accent"),
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        intersect: false,
                        callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(1)} kWh/100km` }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: styles.getPropertyValue("--text-muted"), font: {size: 10} } 
                    },
                    y: { display: false }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card h-[250px]">
            <h3 className="chart-title text-center">⚡ Efficienza (Ultime 10 ricariche)</h3>
            <div className="relative h-[200px] w-full">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

// ===============================
// 3. DISTRIBUZIONE FORNITORI (Corretto Bug Variable)
// ===============================
function SuppliersPieChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    // FIX: Calcoliamo il totale QUI, fuori dall'useEffect, così è visibile nel return
    const totalCost = React.useMemo(() => {
        return charges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    }, [charges]);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const supplierData = {};
        
        charges.forEach(c => {
            const name = c.supplier_name || "Sconosciuto";
            if (!supplierData[name]) supplierData[name] = 0;
            const cost = parseFloat(c.cost) || 0;
            supplierData[name] += cost;
        });

        const sortedSuppliers = Object.entries(supplierData).sort((a, b) => b[1] - a[1]);
        
        const labels = [];
        const data = [];
        
        sortedSuppliers.forEach(([name, cost], index) => {
            if (index < 4) {
                labels.push(name);
                data.push(cost);
            } else if (index === 4) {
                labels.push("Altri");
                data.push(cost);
            } else {
                data[4] += cost;
            }
        });

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#64748b'];

        chartRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: data.map(d => d.toFixed(2)),
                    backgroundColor: colors,
                    borderColor: styles.getPropertyValue("--card"),
                    borderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            padding: 15,
                            font: { size: 11 },
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card h-[380px]">
            <h3 className="chart-title text-center">💸 Top Fornitori</h3>
            <div className="relative h-[300px] w-full flex items-center justify-center">
                <canvas ref={canvasRef}></canvas>
                {/* Ora 'totalCost' è visibile perché calcolato con useMemo sopra */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-8">
                    <div className="text-xs text-muted">Totale</div>
                    <div className="text-2xl font-bold text-saving">€{totalCost.toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
}

// ===============================
// MAIN EXPORT
// ===============================
function ChartSection({ charges, theme }) {
    if (!charges || charges.length < 2) return (
        <div className="text-center p-10 card">
            <div className="text-4xl mb-4">📉</div>
            <div className="text-muted">Servono più dati per generare i grafici.</div>
            <div className="text-xs text-muted opacity-50 mt-2">Inserisci almeno 2 ricariche.</div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <MonthlyOverviewChart charges={charges} theme={theme} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConsumptionTrendChart charges={charges} theme={theme} />
                <SuppliersPieChart charges={charges} theme={theme} />
            </div>
            <div className="text-center text-xs text-muted opacity-50">
                Grafici ottimizzati per il tuo schermo
            </div>
        </div>
    );
}