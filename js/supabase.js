/**
 * ============================================================
 * UTILS.JS - Funzioni di Utilità Globali
 * ============================================================
 * 
 * Questo file contiene funzioni helper riutilizzabili in tutta
 * l'applicazione EV Cost Tracker. Tutte le funzioni sono globali
 * e non utilizzano import/export per compatibilità con React UMD.
 * 
 * CATEGORIE:
 * ---------
 * 1. Parse Numerico   - toNumber, formatNumber, formatCurrency
 * 2. Formattazione    - formatDateShort, formatDateTime
 * 3. Array Helpers    - last, first, average
 * 4. UI Helpers       - classNames
 * 5. Chart Helpers    - getThemeColor, getChartColors
 * 6. Calcoli          - percentDiff, calculateAveragePower
 * 7. Export           - exportToCSV
 * 8. Debug            - debugLog
 * 
 * UTILIZZO:
 * ---------
 * Queste funzioni sono disponibili globalmente dopo il caricamento
 * del file. Possono essere chiamate da qualsiasi altro file JS.
 * 
 * @example
 * const num = toNumber("123.45", 0);  // 123.45
 * const date = formatDateShort("2024-01-15");  // "15/01/2024"
 * 
 * @author EV Cost Tracker Team
 * @version 1.0
 * ============================================================
 */

/* ============================================================
   PARSE NUMERICO ROBUSTO
   ============================================================ */

/**
 * Converte un valore in numero con fallback sicuro.
 * 
 * Gestisce casi edge come:
 * - null, undefined → fallback
 * - stringhe vuote → fallback
 * - "123.45" → 123.45
 * - "abc" → fallback
 * 
 * @param {*} value - Valore da convertire
 * @param {number} fallback - Valore di default se conversione fallisce
 * @returns {number} Numero convertito o fallback
 * 
 * @example
 * toNumber("123.45")      // 123.45
 * toNumber(null, 0)       // 0
 * toNumber("abc", 100)    // 100
 */
function toNumber(value, fallback = 0) {
    const n = parseFloat(value);
    return isNaN(n) ? fallback : n;
}

/* ============================================================
   FORMATTAZIONE NUMERI
   ============================================================ */

/**
 * Formatta un numero con decimali specificati.
 * 
 * @param {*} n - Numero da formattare
 * @param {number} decimals - Numero di decimali (default: 2)
 * @returns {string} Numero formattato
 * 
 * @example
 * formatNumber(123.456, 2)  // "123.46"
 * formatNumber("100", 0)    // "100"
 */
function formatNumber(n, decimals = 2) {
    const num = toNumber(n, 0);
    return num.toFixed(decimals);
}

/**
 * Formatta un numero come valuta (2 decimali).
 * 
 * @param {*} n - Importo da formattare
 * @returns {string} Importo formattato
 * 
 * @example
 * formatCurrency(123.4)  // "123.40"
 */
function formatCurrency(n) {
    const num = toNumber(n, 0);
    return num.toFixed(2);
}

/**
 * Formatta un valore kWh (2 decimali).
 * 
 * @param {*} n - kWh da formattare
 * @returns {string} kWh formattato
 */
function formatKwh(n) {
    const num = toNumber(n, 0);
    return num.toFixed(2);
}

/**
 * Formatta un consumo (kWh/100km).
 * 
 * @param {*} n - Consumo da formattare
 * @returns {string} Consumo formattato
 */
function formatConsumption(n) {
    const num = toNumber(n, 0);
    return num.toFixed(2);
}

/* ============================================================
   FORMATTAZIONE DATE
   ============================================================ */

/**
 * Formatta una data in formato breve italiano (DD/MM/YYYY).
 * 
 * Gestisce stringhe ISO, oggetti Date e valori nulli.
 * 
 * @param {string|Date} dateString - Data da formattare
 * @returns {string} Data formattata o stringa vuota
 * 
 * @example
 * formatDateShort("2024-01-15")       // "15/01/2024"
 * formatDateShort(new Date())         // "15/01/2024"
 * formatDateShort(null)               // ""
 */
function formatDateShort(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

/**
 * Formatta una data con ora (DD/MM/YYYY HH:MM).
 * 
 * @param {string|Date} dateString - Data da formattare
 * @returns {string} Data/ora formattata o stringa vuota
 * 
 * @example
 * formatDateTime("2024-01-15T14:30")  // "15/01/2024 14:30"
 */
function formatDateTime(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* ============================================================
   ARRAY HELPERS
   ============================================================ */

/**
 * Restituisce l'ultimo elemento di un array.
 * 
 * @param {Array} arr - Array di input
 * @returns {*} Ultimo elemento o null se vuoto
 * 
 * @example
 * last([1, 2, 3])  // 3
 * last([])         // null
 */
function last(arr) {
    return arr && arr.length > 0 ? arr[arr.length - 1] : null;
}

/**
 * Restituisce il primo elemento di un array.
 * 
 * @param {Array} arr - Array di input
 * @returns {*} Primo elemento o null se vuoto
 */
function first(arr) {
    return arr && arr.length > 0 ? arr[0] : null;
}

/**
 * Calcola la media di un array di numeri.
 * 
 * @param {Array} arr - Array di numeri
 * @returns {number} Media o 0 se vuoto
 * 
 * @example
 * average([10, 20, 30])  // 20
 * average([])            // 0
 */
function average(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + toNumber(b), 0);
    return sum / arr.length;
}

/* ============================================================
   UI HELPERS
   ============================================================ */

/**
 * Concatena classi CSS condizionalmente.
 * 
 * @param {...*} classes - Classi da concatenare (falsy values ignorati)
 * @returns {string} Stringa di classi
 * 
 * @example
 * classNames("btn", true && "active", false && "hidden")  // "btn active"
 */
function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

/* ============================================================
   CHART HELPERS
   ============================================================ */

/**
 * Ottiene un colore dal tema CSS corrente.
 * 
 * Legge le variabili CSS dal body per adattarsi al tema attivo.
 * 
 * @param {string} variableName - Nome variabile CSS (es. "--accent")
 * @returns {string} Valore della variabile
 * 
 * @example
 * getThemeColor("--accent")  // "#10b981"
 */
function getThemeColor(variableName) {
    return getComputedStyle(document.body).getPropertyValue(variableName).trim();
}

/**
 * Ottiene i colori per i grafici in base al tipo.
 * 
 * @param {string} type - Tipo di colore ("accent", "kwh", "cost", etc.)
 * @returns {Object} Oggetto con border e background
 */
function getChartColors(type = "accent") {
    return {
        border: getThemeColor(`--${type}`),
        background: getThemeColor(`--${type}-soft`)
    };
}

/* ============================================================
   CALCOLI MATEMATICI
   ============================================================ */

/**
 * Calcola la differenza percentuale tra due valori.
 * 
 * @param {*} a - Primo valore
 * @param {*} b - Secondo valore (base)
 * @returns {number} Differenza percentuale
 * 
 * @example
 * percentDiff(120, 100)  // 20 (20% in più)
 * percentDiff(80, 100)   // -20 (20% in meno)
 */
function percentDiff(a, b) {
    const x = toNumber(a);
    const y = toNumber(b);
    if (y === 0) return 0;
    return ((x - y) / y) * 100;
}

/**
 * Calcola la potenza media di una ricarica.
 * 
 * Formula: kWh / ore = kW (potenza media)
 * 
 * @param {number} kwh - kWh erogati
 * @param {string|Date} startDate - Data/ora inizio
 * @param {string|Date} endDate - Data/ora fine
 * @returns {string|null} Potenza in kW (1 decimale) o null
 * 
 * @example
 * calculateAveragePower(50, "2024-01-15T10:00", "2024-01-15T12:00")
 * // "25.0" (50 kWh in 2 ore = 25 kW)
 */
function calculateAveragePower(kwh, startDate, endDate) {
    if (!kwh || !startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60); // Ore decimali
    
    if (diffHours <= 0) return null;
    
    return (kwh / diffHours).toFixed(1); // kW
}

/* ============================================================
   DEBUG
   ============================================================ */

/**
 * Log condizionale per debug.
 * 
 * Attivare impostando window.DEBUG_MODE = true nella console.
 * 
 * @param {...*} args - Argomenti da loggare
 * 
 * @example
 * // In console:
 * window.DEBUG_MODE = true;
 * // Ora i debugLog mostreranno output
 */
function debugLog(...args) {
    if (window.DEBUG_MODE) {
        console.log("[DEBUG]", ...args);
    }
}

/* ============================================================
   EXPORT CSV
   ============================================================ */

/**
 * Esporta un array di oggetti in formato CSV.
 * 
 * Crea un download automatico del file CSV generato.
 * Gestisce correttamente:
 * - Virgolette nei valori
 * - Valori nulli/undefined
 * - Date
 * 
 * @param {string} filename - Nome del file (es. "export.csv")
 * @param {Array} rows - Array di oggetti da esportare
 * 
 * @example
 * exportToCSV("ricariche.csv", [
 *   { date: "2024-01-15", kwh: 45, cost: 12.50 },
 *   { date: "2024-01-20", kwh: 30, cost: 8.00 }
 * ]);
 */
function exportToCSV(filename, rows) {
    if (!rows || !rows.length) return;

    const separator = ",";
    const keys = Object.keys(rows[0]);
    
    // Costruisce il contenuto CSV
    const csvContent =
        keys.join(separator) +
        "\n" +
        rows.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? "" : row[k];
                // Converte Date in stringa locale
                cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
                // Racchiude in virgolette se contiene separatori
                if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                return cell;
            }).join(separator);
        }).join("\n");

    // Crea blob e download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
