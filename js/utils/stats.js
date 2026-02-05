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

    // ============================
    // TOTALE kWh
    // ============================
    const totalKwh = charges.reduce(
        (sum, c) => sum + (parseFloat(c.kwh_added) || 0),
        0
    );

    // ============================
    // TOTALE COSTI
    // ============================
    const totalCost = charges.reduce(
        (sum, c) => sum + (parseFloat(c.cost) || 0),
        0
    );

    const avgCostPerKwh = totalKwh > 0 ? totalCost / totalKwh : 0;

    // ============================
    // KM TOTALI PERCORSI
    // ============================
    const sortedByKm = [...charges].sort(
        (a, b) =>
            (parseFloat(a.total_km) || 0) -
            (parseFloat(b.total_km) || 0)
    );

    const firstKm = parseFloat(sortedByKm[0].total_km) || 0;
    const lastKm = parseFloat(sortedByKm.at(-1).total_km) || 0;

    const kmDriven = Math.max(0, lastKm - firstKm);

    // ============================
    // CONSUMO MEDIO GLOBALE
    // ============================
    const consumption =
        kmDriven > 0 ? (totalKwh / kmDriven) * 100 : 0;

    // ============================
    // CONFRONTO CON BENZINA E DIESEL
    // ============================
    let gasolineCost = 0;
    let dieselCost = 0;

    charges.forEach(charge => {
        const gasPrice =
            parseFloat(charge.saved_gasoline_price) ||
            parseFloat(settings.gasolinePrice);

        const diesPrice =
            parseFloat(charge.saved_diesel_price) ||
            parseFloat(settings.dieselPrice);

        const gasCons =
            parseFloat(charge.saved_gasoline_consumption) ||
            parseFloat(settings.gasolineConsumption);

        const diesCons =
            parseFloat(charge.saved_diesel_consumption) ||
            parseFloat(settings.dieselConsumption);

        const kwh = parseFloat(charge.kwh_added) || 0;

        // km stimati da questa ricarica
        const estimatedKm =
            consumption > 0 ? (kwh / (consumption / 100)) : 0;

        // costo equivalente benzina/diesel
        if (gasCons > 0) {
            gasolineCost += (estimatedKm / gasCons) * gasPrice;
        }
        if (diesCons > 0) {
            dieselCost += (estimatedKm / diesCons) * diesPrice;
        }
    });

    // ============================
    // IMPATTO ECOLOGICO (CO2 & ALBERI) ---
    // ============================
    // Stima: Auto Termica media ~120g/km. Auto Elettrica (Mix EU) ~0g allo scarico (o ~30g produzione energia).
    // Semplifichiamo: Risparmio netto ~100g (0.1kg) di CO2 al km.
    const co2SavedKg = kmDriven * 0.10; 
    
    // Un albero maturo assorbe circa 20-25kg di CO2 l'anno.
    // Diciamo che 20kg risparmiati = 1 Albero equivalente "felice"
    const treesSaved = co2SavedKg / 20;

    // ============================
    // RISULTATO
    // ============================
    return {
        totalKwh: totalKwh.toFixed(2),
        totalCost: totalCost.toFixed(2),
        avgCostPerKwh: avgCostPerKwh.toFixed(3),
        kmDriven: kmDriven.toFixed(0),
        consumption: consumption.toFixed(2),
        gasolineSavings: (gasolineCost - totalCost).toFixed(2),
        dieselSavings: (dieselCost - totalCost).toFixed(2),
        chargesCount: charges.length,
        co2SavedKg: co2SavedKg.toFixed(1),
        treesSaved: treesSaved.toFixed(1)
    };
}
