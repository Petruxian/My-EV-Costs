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
