//
//  CHART COMPONENTS (React UMD + Chart.js)
//  Compatibile con GitHub Pages e iPhone
//

// ===============================
// COSTO PER RICARICA
// ===============================
function CostChart({ charges, theme }) {  // AGGIUNTO theme
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);

        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = charges.map(c =>
            new Date(c.date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit"
            })
        ).reverse();

        const costs = charges.map(c => parseFloat(c.cost)).reverse();

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Costo (€)",
                    data: costs,
                    backgroundColor: styles.getPropertyValue("--accent-soft"),
                    borderColor: styles.getPropertyValue("--accent"),
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: styles.getPropertyValue("--text-muted") } },
                    y: { ticks: { color: styles.getPropertyValue("--text-muted") } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);  // CORRETTO: aggiunto theme nel deps

    return (
        <div className="chart-card">
            <h3 className="chart-title">💶 Costo per ricarica</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}



// ===============================
// kWh PER RICARICA
// ===============================
function KwhChart({ charges, theme }) {  // AGGIUNTO theme
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);

        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = charges.map(c =>
            new Date(c.date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit"
            })
        ).reverse();

        const kwh = charges.map(c => parseFloat(c.kwh_added)).reverse();

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "kWh",
                    data: kwh,
                    backgroundColor: styles.getPropertyValue("--info-soft"),
                    borderColor: styles.getPropertyValue("--info"),
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: styles.getPropertyValue("--text-muted") } },
                    y: { ticks: { color: styles.getPropertyValue("--text-muted") } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);  // CORRETTO

    return (
        <div className="chart-card">
            <h3 className="chart-title">⚡ kWh per ricarica</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}



// ===============================
// CONSUMO REALE (kWh/100km)
// ===============================
function ConsumptionChart({ charges, theme }) {  // AGGIUNTO theme
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);

        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = charges.map(c =>
            new Date(c.date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit"
            })
        ).reverse();

        const consumption = charges.map(c =>
            c.consumption ? parseFloat(c.consumption) : null
        ).reverse();

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "kWh/100km",
                    data: consumption,
                    borderColor: styles.getPropertyValue("--info"),
                    backgroundColor: styles.getPropertyValue("--info-soft"),
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: styles.getPropertyValue("--text-muted") } },
                    y: { ticks: { color: styles.getPropertyValue("--text-muted") } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);  // CORRETTO

    return (
        <div className="chart-card">
            <h3 className="chart-title">🚗 Consumo reale</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}



// ===============================
// €/kWh
// ===============================
function EurKwhChart({ charges, theme }) {  // AGGIUNTO theme
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);

        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = charges.map(c =>
            new Date(c.date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit"
            })
        ).reverse();

        const eurKwh = charges.map(c =>
            (c.cost / c.kwh_added).toFixed(3)
        ).reverse();

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "€/kWh",
                    data: eurKwh,
                    borderColor: styles.getPropertyValue("--accent"),
                    backgroundColor: styles.getPropertyValue("--accent-soft"),
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: styles.getPropertyValue("--text-muted") } },
                    y: { ticks: { color: styles.getPropertyValue("--text-muted") } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);  // CORRETTO

    return (
        <div className="chart-card">
            <h3 className="chart-title">💰 €/kWh</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}



// ===============================
// €/100 km
// ===============================
function Eur100Chart({ charges, theme }) {  // AGGIUNTO theme
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);

        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = charges.map(c =>
            new Date(c.date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit"
            })
        ).reverse();

        const eur100 = charges.map(c => {
            if (!c.km_since_last || c.km_since_last <= 0) return null;
            return ((c.cost / c.km_since_last) * 100).toFixed(2);
        }).reverse();

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "€/100 km",
                    data: eur100,
                    borderColor: styles.getPropertyValue("--warning"),
                    backgroundColor: styles.getPropertyValue("--warning-soft"),
                    tension: 0.3,
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: styles.getPropertyValue("--text-muted") } },
                    y: { ticks: { color: styles.getPropertyValue("--text-muted") } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);  // CORRETTO

    return (
        <div className="chart-card">
            <h3 className="chart-title">🪙 €/100 km</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}
//
//  NUOVI GRAFICI AVANZATI
//  Trend, AC vs DC, Fornitori, Efficienza
//

// ===============================
// TREND COSTI (Area Chart con doppio asse)
// ===============================
function CostTrendChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const labels = charges.map(c =>
            new Date(c.date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short"
            })
        ).reverse();

        const costs = charges.map(c => parseFloat(c.cost)).reverse();
        
        const cumulativeCosts = costs.reduce((acc, cost, idx) => {
            acc.push((acc[idx - 1] || 0) + cost);
            return acc;
        }, []);

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Costo Singolo (€)",
                        data: costs,
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    },
                    {
                        label: "Costo Cumulativo (€)",
                        data: cumulativeCosts,
                        borderColor: "#06b6d4",
                        backgroundColor: "rgba(6, 182, 212, 0.1)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: { 
                        ticks: { color: styles.getPropertyValue("--text-muted") }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: styles.getPropertyValue("--text-muted") }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: styles.getPropertyValue("--text-muted") },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card">
            <h3 className="chart-title">📈 Trend Costi</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

// ===============================
// AC vs DC (Comparazione)
// ===============================
function ACvsDCChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const acCharges = charges.filter(c => c.supplier_type === 'AC');
        const dcCharges = charges.filter(c => c.supplier_type === 'DC');

        const acAvgCost = acCharges.length > 0 
            ? (acCharges.reduce((sum, c) => sum + parseFloat(c.cost), 0) / acCharges.length).toFixed(2)
            : 0;
        
        const dcAvgCost = dcCharges.length > 0
            ? (dcCharges.reduce((sum, c) => sum + parseFloat(c.cost), 0) / dcCharges.length).toFixed(2)
            : 0;

        const acAvgKwh = acCharges.length > 0
            ? (acCharges.reduce((sum, c) => sum + parseFloat(c.kwh_added), 0) / acCharges.length).toFixed(1)
            : 0;

        const dcAvgKwh = dcCharges.length > 0
            ? (dcCharges.reduce((sum, c) => sum + parseFloat(c.kwh_added), 0) / dcCharges.length).toFixed(1)
            : 0;

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ['Costo Medio (€)', 'kWh Medi', 'Numero Ricariche'],
                datasets: [
                    {
                        label: "AC (Lento)",
                        data: [acAvgCost, acAvgKwh, acCharges.length],
                        backgroundColor: "rgba(59, 130, 246, 0.6)",
                        borderColor: "#3b82f6",
                        borderWidth: 2
                    },
                    {
                        label: "DC (Rapido)",
                        data: [dcAvgCost, dcAvgKwh, dcCharges.length],
                        backgroundColor: "rgba(249, 115, 22, 0.6)",
                        borderColor: "#f97316",
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { ticks: { color: styles.getPropertyValue("--text-muted") } },
                    y: { 
                        ticks: { color: styles.getPropertyValue("--text-muted") },
                        beginAtZero: true
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card">
            <h3 className="chart-title">⚡ AC vs DC</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

// ===============================
// FORNITORI (Doughnut Chart)
// ===============================
function SuppliersPieChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        const supplierData = {};
        charges.forEach(c => {
            if (!supplierData[c.supplier_name]) {
                supplierData[c.supplier_name] = { count: 0, totalCost: 0 };
            }
            supplierData[c.supplier_name].count++;
            supplierData[c.supplier_name].totalCost += parseFloat(c.cost);
        });

        const labels = Object.keys(supplierData);
        const data = labels.map(s => supplierData[s].totalCost.toFixed(2));
        
        const colors = [
            'rgba(16, 185, 129, 0.7)',
            'rgba(6, 182, 212, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(168, 85, 247, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(251, 191, 36, 0.7)'
        ];

        chartRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    label: "Spesa Totale (€)",
                    data,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: styles.getPropertyValue("--text-muted"),
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const supplierName = context.label;
                                const cost = context.parsed;
                                const count = supplierData[supplierName].count;
                                return `${supplierName}: €${cost} (${count} ricariche)`;
                            }
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card">
            <h3 className="chart-title">🏪 Distribuzione Fornitori</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}
