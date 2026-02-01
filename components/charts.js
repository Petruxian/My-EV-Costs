//
//  CHART COMPONENTS (React UMD + Chart.js)
//  Compatibile con GitHub Pages e iPhone
//

// ===============================
// COSTO PER RICARICA
// ===============================
function CostChart({ charges }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

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
                    backgroundColor: "rgba(16,185,129,0.5)"
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { ticks: { color: "#cbd5e1" } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges]);

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
function KwhChart({ charges }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

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
                    backgroundColor: "rgba(6,182,212,0.5)"
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { ticks: { color: "#cbd5e1" } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges]);

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
function ConsumptionChart({ charges }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

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
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.2)",
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { ticks: { color: "#cbd5e1" } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges]);

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
function EurKwhChart({ charges }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

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
                    borderColor: "#a855f7",
                    backgroundColor: "rgba(168,85,247,0.2)",
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { ticks: { color: "#cbd5e1" } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges]);

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
function Eur100Chart({ charges }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

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
                    borderColor: "#fbbf24",
                    backgroundColor: "rgba(251,191,36,0.2)",
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    x: { ticks: { color: "#cbd5e1" } },
                    y: { ticks: { color: "#cbd5e1" } }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges]);

    return (
        <div className="chart-card">
            <h3 className="chart-title">🪙 €/100 km</h3>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}



// ===============================
// STILI MINIMI PER I CHART CARD
// (opzionali, ma utili)
// ===============================
const style = document.createElement("style");
style.innerHTML = `
.chart-card {
    background: rgba(30,41,59,0.6);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(148,163,184,0.3);
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
}
.chart-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #a7f3d0;
    margin-bottom: 0.75rem;
}
`;
document.head.appendChild(style);
