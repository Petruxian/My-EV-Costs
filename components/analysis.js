//
// ANALYSIS FUNCTIONS
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// ANALISI AVANZATA (best, worst, trend, ecc.)
// ==========================================
function calculateAdvancedAnalysis(charges) {
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
}



// ==========================================
// PREVISIONI DI COSTO (forecast)
// ==========================================
function calculateForecast(charges) {
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
}



// ==========================================
// BADGE DI EFFICIENZA PER OGNI RICARICA
// ==========================================
function getEfficiencyBadge(consumption, allConsumptions) {
    if (!consumption || allConsumptions.length < 4) {
        return { label: "N/D", color: "text-slate-400", bg: "bg-slate-700/40" };
    }

    const sorted = [...allConsumptions].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    if (consumption <= q1) {
        return { label: "Top", color: "text-emerald-400", bg: "bg-emerald-900/30" };
    }
    if (consumption >= q3) {
        return { label: "Alto", color: "text-red-400", bg: "bg-red-900/30" };
    }
    return { label: "Normale", color: "text-yellow-400", bg: "bg-yellow-900/30" };
}
