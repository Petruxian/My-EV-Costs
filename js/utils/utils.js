//
// UTILS.JS
// Funzioni di utilità globali
// Compatibile con React UMD + GitHub Pages
// Nessun import/export
//


// ==========================================
// PARSE NUMERICO ROBUSTO
// ==========================================
function toNumber(value, fallback = 0) {
    const n = parseFloat(value);
    return isNaN(n) ? fallback : n;
}



// ==========================================
// FORMATTAZIONE NUMERI
// ==========================================
function formatNumber(n, decimals = 2) {
    const num = toNumber(n, 0);
    return num.toFixed(decimals);
}

function formatCurrency(n) {
    const num = toNumber(n, 0);
    return num.toFixed(2);
}

function formatKwh(n) {
    const num = toNumber(n, 0);
    return num.toFixed(2);
}

function formatConsumption(n) {
    const num = toNumber(n, 0);
    return num.toFixed(2);
}



// ==========================================
// FORMATTAZIONE DATE
// ==========================================
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



// ==========================================
// ARRAY HELPERS
// ==========================================
function last(arr) {
    return arr && arr.length > 0 ? arr[arr.length - 1] : null;
}

function first(arr) {
    return arr && arr.length > 0 ? arr[0] : null;
}



// ==========================================
// UI HELPERS
// ==========================================
function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}



// ==========================================
// CHART HELPERS
// ==========================================
function getThemeColor(variableName) {
    return getComputedStyle(document.body).getPropertyValue(variableName).trim();
}

function getChartColors(type = "accent") {
    return {
        border: getThemeColor(`--${type}`),
        background: getThemeColor(`--${type}-soft`)
    };
}



// ==========================================
// CALCOLO MEDIA
// ==========================================
function average(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + toNumber(b), 0);
    return sum / arr.length;
}



// ==========================================
// CALCOLO DIFFERENZA PERCENTUALE
// ==========================================
function percentDiff(a, b) {
    const x = toNumber(a);
    const y = toNumber(b);
    if (y === 0) return 0;
    return ((x - y) / y) * 100;
}



// ==========================================
// DEBUG SAFE LOG
// ==========================================
function debugLog(...args) {
    if (window.DEBUG_MODE) {
        console.log("[DEBUG]", ...args);
    }
}

// ==========================================
// Calcola potenza media (kW)
// ==========================================

function calculateAveragePower(kwh, startDate, endDate) {
    if (!kwh || !startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60); // Ore decimali
    
    if (diffHours <= 0) return null;
    
    return (kwh / diffHours).toFixed(1); // kW
}
