//
// GLOBAL STATS FUNCTIONS
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// CALCOLA STATISTICHE GLOBALI
// ==========================================
function calculateStats(charges, settings) {
    if (!charges || charges.length === 0) return null;

    // Totale kWh
    const totalKwh = charges.reduce(
        (sum, c) => sum + parseFloat(c.kwh_added || 0),
        0
    );

    // Totale costi
    const totalCost = charges.reduce(
        (sum, c) => sum + parseFloat(c.cost || 0),
        0
    );

    const avgCostPerKwh = totalCost / totalKwh;

    // Km percorsi totali
    const sortedByKm = [...charges].sort(
        (a, b) => parseFloat(a.total_km) - parseFloat(b.total_km)
    );

    const kmDriven =
        parseFloat(sortedByKm.at(-1).total_km) -
        parseFloat(sortedByKm[0].total_km);

    // Consumo medio globale
    const consumption =
        kmDriven > 0 ? (totalKwh / kmDriven) * 100 : 0;

    // Confronto con benzina e diesel
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
}
