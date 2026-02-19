/**
 * ============================================================
 * STATS.JS - Funzioni Statistiche Globali
 * ============================================================
 * 
 * Questo file contiene le funzioni per il calcolo delle statistiche
 * aggregate dell'applicazione EV Cost Tracker.
 * 
 * STATISTICHE CALCOLATE:
 * ----------------------
 * - totalKwh        : Totale kWh caricati
 * - totalCost       : Totale € spesi
 * - avgCostPerKwh   : Costo medio per kWh
 * - kmDriven        : Km totali percorsi
 * - consumption     : Consumo medio (kWh/100km)
 * - gasolineSavings : Risparmio vs auto benzina
 * - dieselSavings   : Risparmio vs auto diesel
 * - co2SavedKg      : CO2 risparmiata in kg
 * - treesSaved      : Alberi equivalenti salvati
 * 
 * DIPENDENZE:
 * -----------
 * - Nessuna (funzioni pure)
 * 
 * UTILIZZO:
 * ---------
 * @example
 * const stats = calculateStats(charges, settings);
 * console.log(stats.totalCost);  // "123.45"
 * 
 * @author EV Cost Tracker Team
 * @version 1.0
 * ============================================================
 */

/**
 * Calcola tutte le statistiche aggregate per un set di ricariche.
 * 
 * FLUSSO DI CALCOLO:
 * ------------------
 * 1. Somma tutti i kWh e costi
 * 2. Calcola km percorsi (max odometro - min odometro)
 * 3. Calcola consumo medio globale
 * 4. Stima risparmio vs benzina/diesel
 * 5. Calcola impatto ecologico (CO2, alberi)
 * 
 * @param {Array} charges - Array di ricariche completate
 * @param {Object} settings - Impostazioni (prezzi carburanti)
 * @returns {Object|null} Oggetto statistiche o null se no data
 * 
 * @example
 * const stats = calculateStats(charges, {
 *     gasolinePrice: 1.9,
 *     gasolineConsumption: 15,
 *     dieselPrice: 1.8,
 *     dieselConsumption: 18
 * });
 * 
 * // Ritorna:
 * // {
 * //   totalKwh: "1500.00",
 * //   totalCost: "375.00",
 * //   avgCostPerKwh: "0.250",
 * //   kmDriven: "5000",
 * //   consumption: "30.00",
 * //   gasolineSavings: "850.00",
 * //   dieselSavings: "625.00",
 * //   chargesCount: 25,
 * //   co2SavedKg: "500.0",
 * //   treesSaved: "25.0"
 * // }
 */
function calculateStats(charges, settings) {
    // Validazione input
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

    // Costo medio per kWh
    const avgCostPerKwh = totalKwh > 0 ? totalCost / totalKwh : 0;

    // ============================
    // KM TOTALI PERCORSI
    // ============================
    // Ordina per km totali per trovare min e max odometro
    const sortedByKm = [...charges].sort(
        (a, b) =>
            (parseFloat(a.total_km) || 0) -
            (parseFloat(b.total_km) || 0)
    );

    // Primo odometro (minimo)
    const firstKm = parseFloat(sortedByKm[0].total_km) || 0;
    
    // Ultimo odometro (massimo)
    // FIX: uso length-1 invece di .at(-1) per compatibilità browser vecchi
    const lastItem = sortedByKm[sortedByKm.length - 1];
    const lastKm = parseFloat(lastItem.total_km) || 0;

    // Km percorsi = differenza odometro
    const kmDriven = Math.max(0, lastKm - firstKm);

    // ============================
    // CONSUMO MEDIO GLOBALE
    // ============================
    // Formula: (kWh totali / km totali) * 100 = kWh/100km
    const consumption =
        kmDriven > 0 ? (totalKwh / kmDriven) * 100 : 0;

    // ============================
    // CONFRONTO CON BENZINA E DIESEL
    // ============================
    /**
     * Per ogni ricarica, stima quanti km ha permesso di percorrere
     * e calcola quanto sarebbe costato con auto termica.
     * 
     * Nota: usa gli snapshot salvati nella ricarica se disponibili,
     * altrimenti usa i valori attuali dalle impostazioni.
     */
    let gasolineCost = 0;
    let dieselCost = 0;

    charges.forEach(charge => {
        // Prezzi carburante (snapshot o attuali)
        const gasPrice =
            parseFloat(charge.saved_gasoline_price) ||
            parseFloat(settings.gasolinePrice);

        const diesPrice =
            parseFloat(charge.saved_diesel_price) ||
            parseFloat(settings.dieselPrice);

        // Consumi auto termiche (km/L)
        const gasCons =
            parseFloat(charge.saved_gasoline_consumption) ||
            parseFloat(settings.gasolineConsumption);

        const diesCons =
            parseFloat(charge.saved_diesel_consumption) ||
            parseFloat(settings.dieselConsumption);

        const kwh = parseFloat(charge.kwh_added) || 0;

        // Km stimati percorsi con questa ricarica
        const estimatedKm =
            consumption > 0 ? (kwh / (consumption / 100)) : 0;

        // Costo equivalente benzina
        // Formula: (km / km_per_litro) * prezzo_al_litro
        if (gasCons > 0) {
            gasolineCost += (estimatedKm / gasCons) * gasPrice;
        }
        
        // Costo equivalente diesel
        if (diesCons > 0) {
            dieselCost += (estimatedKm / diesCons) * diesPrice;
        }
    });

    // ============================
    // IMPATTO ECOLOGICO (CO2 & ALBERI)
    // ============================
    /**
     * Stima della CO2 risparmiata:
     * - Auto media: ~120g CO2/km
     * - EV: ~0g CO2/km (se ricaricata da rinnovabile)
     * 
     * Usiamo un valore conservativo di 100g/km
     * per tenere conto del mix elettrico italiano.
     */
    const co2SavedKg = kmDriven * 0.10; // 100g/km = 0.1 kg/km
    
    /**
     * Un albero medio assorbe circa 20kg CO2/anno.
     * Questo valore rappresenta gli "alberi equivalenti"
     * che avrebbero assorbito la stessa CO2.
     */
    const treesSaved = co2SavedKg / 20;

    // ============================
    // RISULTATO FORMATTATO
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
