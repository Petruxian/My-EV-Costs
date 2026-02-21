/**
 * ============================================================
 * CONFIG.JS - Configurazione EV Cost Tracker
 * ============================================================
 * 
 * File di configurazione separato per le credenziali e
 * impostazioni sensibili dell'applicazione.
 * 
 * SICUREZZA:
 * ---------
 * In produzione, questo file dovrebbe essere:
 * - Escluso dal version control (.gitignore)
 * - Gestito tramite variabili d'ambiente
 * - Oppure caricato da un server di configurazione
 * 
 * @author EV Cost Tracker Team
 * @version 2.6
 * ============================================================
 */

// ============================================================
// CREDENZIALI SUPABASE
// ============================================================
// Sostituisci con le tue credenziali dal dashboard Supabase
// Project Settings > API > Project URL e anon public key

const SUPABASE_CONFIG = {
    url: "https://hcmyzwkgzyqxogzakpxc.supabase.co",      // TUA URL Supabase
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXl6d2tnenlxeG9nemFrcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM2NTEsImV4cCI6MjA4NTM3OTY1MX0.2kK1ocMpoEJgOn31sDYQeYcwpcxmkZuHzq39ZQAMkGw"  // TUA anon key
};

// Esporta globalmente per compatibilità con app.js
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

//const SUPABASE_URL = "https://hcmyzwkgzyqxogzakpxc.supabase.co"; // TUA URL
//const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXl6d2tnenlxeG9nemFrcHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDM2NTEsImV4cCI6MjA4NTM3OTY1MX0.2kK1ocMpoEJgOn31sDYQeYcwpcxmkZuHzq39ZQAMkGw"; // TUA KEY
//const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);