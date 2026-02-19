/**
 * ============================================================
 * ANALYSIS.JS - Funzioni di Analisi Avanzata
 * ============================================================
 * 
 * Questo file contiene funzioni per l'analisi avanzata dei dati
 * delle ricariche nell'applicazione EV Cost Tracker.
 * 
 * FUNZIONI INCLUSE:
 * -----------------
 * 1. calculateAdvancedAnalysis() - Analisi efficienza con trend
 * 2. calculateForecast()         - Previsione costi futuro
 * 3. getEfficiencyBadge()        - Badge per singola ricarica
 * 
 * TIPOLOGIE DI ANALISI:
 * ---------------------
 * 
 * 1. EFFICIENZA (calculateAdvancedAnalysis):
 *    - Calcola best/worst consumo
 *    - Confronta trend ultime 5 vs media storica
 *    - Genera punteggio efficienza 0-100
 *    - Produce commento intelligente
 * 
 * 2. PREVISIONE (calculateForecast):
 *    - Analizza ultimi 30 giorni
 *    - Proietta costi mese successivo
 *    - Considera trend recente
 *    - Genera commento previsionale
 * 
 * 3. BADGE (getEfficiencyBadge):
 *    - Classifica singola ricarica per consumo
 *    - Usa quartili per determinare ranking
 *    - Restituisce label + colori CSS
 * 
 * UTILIZZO:
 * ---------
 * @example
 * const analysis = calculateAdvancedAnalysis(charges);
 * // { best: 12.5, worst: 28.3, avg: 18.2, efficiency: 75, ... }
 * 
 * const forecast = calculateForecast(charges);
 * // { forecastCost: 45.50, trend: -2.30, comment: "..." }
 * 
 * const badge = getEfficiencyBadge(15.5, allConsumptions);
 * // { label: "Top", color: "text-emerald-400", bg: "bg-emerald-900/30" }
 * 
 * @author EV Cost Tracker Team
 * @version 1.0
 * ============================================================
 */

/* ============================================================
   FUNZIONE: ANALISI AVANZATA EFFICIENZA
   ============================================================ */
/**
 * Calcola un'analisi approfondita dell'efficienza di guida.
 * 
 * ALGORITMO:
 * ----------
 * 1. Filtra ricariche con consumo valido (km_since_last > 0)
 * 2. Calcola statistiche base: best, worst, avg
 * 3. Confronta media ultime 5 vs media storica
 * 4. Calcola punteggio efficienza normalizzato 0-100
 * 5. Genera commento intelligente basato sul trend
 * 
 * INTERPRETAZIONE TREND:
 * ----------------------
 * - trend < 0: Miglioramento (consumo diminuito)
 * - trend > 0: Peggioramento (consumo aumentato)
 * - Valore assoluto indica entità del cambiamento
 * 
 * FORMULA EFFICIENZA:
 * -------------------
 * efficiency = 100 - ((avgLast5 - best) / (worst - best)) * 100
 * 
 * Il punteggio rappresenta quanto sei vicino al tuo
 * miglior consumo possibile (100 = perfetto).
 * 
 * @param {Array} charges - Array ricariche con campo consumption
 * @returns {Object|null} Oggetto analisi o null se dati insufficienti
 * 
 * @returns {number} returns.best - Miglior consumo (kWh/100km)
 * @returns {number} returns.worst - Peggiore consumo (kWh/100km)
 * @returns {number} returns.avg - Media storica
 * @returns {number} returns.avgLast5 - Media ultime 5 ricariche
 * @returns {number} returns.trend - Differenza avgLast5 - avg
 * @returns {number} returns.efficiency - Score 0-100
 * @returns {string} returns.comment - Commento intelligente
 * 
 * @example
 * const analysis = calculateAdvancedAnalysis(charges);
 * if (analysis) {
 *     console.log(`Efficienza: ${analysis.efficiency}%`);
 *     console.log(analysis.comment);
 * }
 */
function calculateAdvancedAnalysis(charges) {
    // Validazione input
    if (!charges || charges.length === 0) return null;

    // Filtra solo ricariche con consumo valido
    // Richiede: consumption > 0, km_since_last > 0
    const valid = charges.filter(c => {
        const cons = parseFloat(c.consumption);
        return (
            !isNaN(cons) &&
            cons > 0 &&
            c.km_since_last > 0
        );
    });

    // Se non ci sono dati validi, ritorna null
    if (valid.length === 0) return null;

    // Estrai array consumi
    const consumptions = valid.map(c => parseFloat(c.consumption));

    // Calcola statistiche base
    const best = Math.min(...consumptions);   // Consumo minore = migliore
    const worst = Math.max(...consumptions);  // Consumo maggiore = peggiore

    // Media storica
    const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;

    // Media ultime 5 ricariche (più recenti)
    // Nota: le prime 5 dell'array sono le più recenti (ordinamento desc)
    const last5 = consumptions.slice(0, 5);
    const avgLast5 = last5.reduce((a, b) => a + b, 0) / last5.length;

    // Calcola trend (negativo = miglioramento)
    const trend = avgLast5 - avg;

    // Calcola efficienza normalizzata (0-100)
    let efficiency = 100;
    if (worst !== best) {
        // Formula: quanto sono vicino al mio best?
        efficiency = 100 - ((avgLast5 - best) / (worst - best)) * 100;
        efficiency = Math.max(0, Math.min(100, efficiency));
    }

    // Genera commento intelligente
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
        best,        // kWh/100km - miglior consumo
        worst,       // kWh/100km - peggiore consumo
        avg,         // kWh/100km - media storica
        avgLast5,    // kWh/100km - media ultime 5
        trend,       // kWh/100km - differenza (negativo = miglioramento)
        efficiency,  // 0-100 - score efficienza
        comment      // string - commento leggibile
    };
}

/* ============================================================
   FUNZIONE: PREVISIONE COSTI
   ============================================================ */
/**
 * Calcola una previsione dei costi per il mese successivo.
 * 
 * METODOLOGIA:
 * ------------
 * 1. Analizza le ricariche degli ultimi 30 giorni
 * 2. Calcola medie: costo, kWh, km per ricarica
 * 3. Identifica trend confrontando ultime 5 vs media
 * 4. Proietta 8 ricariche tipo per mese prossimo
 * 5. Applica correzione basata sul trend
 * 
 * ASSUNZIONI:
 * -----------
 * - 8 ricariche medie al mese
 * - Trend recente indica direzione futura
 * - Stessi pattern di utilizzo
 * 
 * LIMITAZIONI:
 * ------------
 * - Non considera stagionalità (es. riscaldamento inverno)
 * - Non considera variazioni tariffarie
 * - Basato solo su dati storici recenti
 * 
 * @param {Array} charges - Array ricariche
 * @returns {Object|null} Oggetto previsione o null se dati insufficienti
 * 
 * @returns {number} returns.forecastCost - Previsione spesa mese (€)
 * @returns {number} returns.forecastKwh - Previsione kWh mese
 * @returns {number} returns.forecastKm - Previsione km mese
 * @returns {number} returns.trend - Trend costo (negativo = diminuzione)
 * @returns {string} returns.comment - Commento previsionale
 * 
 * @example
 * const forecast = calculateForecast(charges);
 * if (forecast) {
 *     console.log(`Prossimo mese: €${forecast.forecastCost.toFixed(2)}`);
 * }
 */
function calculateForecast(charges) {
    if (!charges || charges.length === 0) return null;

    const now = new Date();

    // Filtra ricariche ultimi 30 giorni
    const last30 = charges.filter(c => {
        const d = new Date(c.date);
        return (now - d) / (1000 * 60 * 60 * 24) <= 30;
    });

    // Se non ci sono dati recenti, ritorna null
    if (last30.length === 0) return null;

    // Calcola totali ultimi 30 giorni
    const totalCost30 = last30.reduce(
        (sum, c) => sum + (parseFloat(c.cost) || 0),
        0
    );
    const totalKwh30 = last30.reduce(
        (sum, c) => sum + (parseFloat(c.kwh_added) || 0),
        0
    );
    const totalKm30 = last30.reduce(
        (sum, c) => sum + (parseFloat(c.km_since_last) || 0),
        0
    );

    // Calcola medie per ricarica
    const avgCost = totalCost30 / last30.length;
    const avgKwh = totalKwh30 / last30.length;
    const avgKm = totalKm30 / last30.length;

    // Calcola trend basato su ultime 5 ricariche REALI
    const last5 = charges.slice(-5);
    const avgCostLast5 = last5.reduce(
        (s, c) => s + (parseFloat(c.cost) || 0), 0
    ) / last5.length;

    // Trend costo (positivo = aumento)
    const trend = avgCostLast5 - avgCost;

    // Previsione: 8 ricariche medie + correzione trend
    const forecastCost = avgCost * 8 + trend * 2;
    const forecastKwh = avgKwh * 8;
    const forecastKm = avgKm * 8;

    // Genera commento
    let comment = "";
    if (trend < -0.5) {
        comment = "I costi stanno diminuendo rispetto al mese scorso.";
    } else if (trend < 0.2) {
        comment = "Costi stabili rispetto al mese scorso.";
    } else {
        comment = "I costi sono in leggero aumento, controlla le tariffe dei fornitori.";
    }

    return {
        forecastCost,   // € - spesa prevista
        forecastKwh,    // kWh - energia prevista
        forecastKm,     // km - km previsti
        trend,          // € - trend costo
        comment         // string - commento
    };
}

/* ============================================================
   FUNZIONE: BADGE EFFICIENZA PER RICARICA
   ============================================================ */
/**
 * Assegna un badge di efficienza a una singola ricarica.
 * 
 * METODOLOGIA:
 * ------------
 * 1. Calcola i quartili Q1 e Q3 di tutti i consumi
 * 2. Q1 = 25° percentile, Q3 = 75° percentile
 * 3. Se consumo ≤ Q1 → "Top" (eccellente)
 * 4. Se consumo ≥ Q3 → "Alto" (da migliorare)
 * 5. Altrimenti → "Normale"
 * 
 * VISUALIZZAZIONE:
 * ----------------
 * - Top:     Verde (text-emerald-400)
 * - Normale: Giallo (text-yellow-400)
 * - Alto:    Rosso (text-red-400)
 * 
 * REQUISITI:
 * ----------
 * Minimo 4 ricariche per calcolare quartili significativi.
 * Meno dati → "N/D"
 * 
 * @param {number} consumption - Consumo della ricarica (kWh/100km)
 * @param {Array<number>} allConsumptions - Array tutti i consumi
 * @returns {Object} Badge con label e classi CSS
 * 
 * @returns {string} returns.label - Etichetta badge
 * @returns {string} returns.color - Classe colore testo Tailwind
 * @returns {string} returns.bg - Classe colore sfondo Tailwind
 * 
 * @example
 * const badge = getEfficiencyBadge(15.5, [12, 15, 18, 22, 25]);
 * // { label: "Top", color: "text-emerald-400", bg: "bg-emerald-900/30" }
 */
function getEfficiencyBadge(consumption, allConsumptions) {
    const cons = parseFloat(consumption);

    // Verifica dati sufficienti
    if (!cons || allConsumptions.length < 4) {
        return {
            label: "N/D",
            color: "text-slate-400",
            bg: "bg-slate-700/40"
        };
    }

    // Ordina consumi per calcolo quartili
    const sorted = [...allConsumptions]
        .map(n => parseFloat(n))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    // Verifica nuovamente dopo filtro
    if (sorted.length < 4) {
        return {
            label: "N/D",
            color: "text-slate-400",
            bg: "bg-slate-700/40"
        };
    }

    // Calcola quartili
    const q1 = sorted[Math.floor(sorted.length * 0.25)];  // 25° percentile
    const q3 = sorted[Math.floor(sorted.length * 0.75)];  // 75° percentile

    // Assegna badge
    if (cons <= q1) {
        // Consumo nel quartile inferiore = MIGLIORE
        return {
            label: "Top",
            color: "text-emerald-400",
            bg: "bg-emerald-900/30"
        };
    }

    if (cons >= q3) {
        // Consumo nel quartile superiore = PEGGIORE
        return {
            label: "Alto",
            color: "text-red-400",
            bg: "bg-red-900/30"
        };
    }

    // Consumo nella fascia centrale
    return {
        label: "Normale",
        color: "text-yellow-400",
        bg: "bg-yellow-900/30"
    };
}
