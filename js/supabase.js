/**
 * ============================================================
 * SUPABASE.JS - Servizio Database per EV Cost Tracker
 * ============================================================
 * 
 * Questo file contiene TUTTA la logica di accesso al database Supabase.
 * Fornisce un'astrazione completa per le operazioni CRUD su:
 * 
 * ENTITÀ GESTITE:
 * --------------
 * - vehicles    : Veicoli elettrici dell'utente
 * - suppliers   : Fornitori di ricarica (colonnine, casa, fotovoltaico)
 * - charges     : Sessioni di ricarica (in progress o completed)
 * 
 * OPERAZIONI DISPONIBILI:
 * -----------------------
 * LOAD:   loadVehicles, loadCharges, loadSuppliers
 * SAVE:   saveVehicleToDB, saveSupplier
 * UPDATE: updateSupplier, updateVehicleInDB, updateChargeInDB
 * DELETE: deleteChargeFromDB, deleteVehicleFromDB, deleteSupplierFromDB
 * CHARGE: startChargeDB, stopChargeDB, saveManualChargeDB
 * 
 * DIPENDENZE:
 * -----------
 * - @supabase/supabase-js (CDN)
 * - Client Supabase inizializzato esternamente
 * 
 * ARCHITETTURA:
 * -------------
 * Ogni funzione riceve il client Supabase come primo parametro (sb).
 * Questo permette flessibilità e testabilità.
 * 
 * GESTIONE ERRORI:
 * ----------------
 * Tutte le funzioni restituiscono:
 * - Array vuoto [] in caso di errore (per le funzioni di load)
 * - false in caso di errore (per le funzioni di scrittura)
 * - true/data in caso di successo
 * 
 * @author EV Cost Tracker Team
 * @version 2.3 - Aggiunta updateChargeInDB con ricalcoli
 * ============================================================
 */

/* ============================================================
   SEZIONE 1: FETCH DATI BASE (Read Operations)
   ============================================================ */

/**
 * Carica tutti i veicoli dal database.
 * 
 * @param {Object} sb - Client Supabase inizializzato
 * @returns {Array} Array di oggetti veicolo, vuoto in caso di errore
 * 
 * @example
 * const vehicles = await loadVehicles(supabaseClient);
 * // [{id: 1, name: "Tesla Model 3", brand: "Tesla", capacity_kwh: 75}, ...]
 */
async function loadVehicles(sb) {
    const { data, error } = await sb.from("vehicles").select("*");
    return error ? [] : data;
}

/**
 * Carica tutte le ricariche ordinate per data decrescente.
 * 
 * L'ordinamento DESC mostra prima le ricariche più recenti.
 * Include sia ricariche "completed" che "in_progress".
 * 
 * @param {Object} sb - Client Supabase inizializzato
 * @returns {Array} Array di oggetti ricarica, vuoto in caso di errore
 * 
 * @example
 * const charges = await loadCharges(supabaseClient);
 * // [{id: 1, date: "2024-01-15", kwh_added: 45, ...}, ...]
 */
async function loadCharges(sb) {
    const { data, error } = await sb
        .from("charges")
        .select("*")
        .order("date", { ascending: false });

    return error ? [] : data;
}

/* ============================================================
   SEZIONE 2: OPERAZIONI VEICOLI
   ============================================================ */

/**
 * Salva un nuovo veicolo nel database.
 * 
 * @param {Object} sb - Client Supabase
 * @param {Object} vehicle - Dati veicolo da salvare
 * @param {string} vehicle.name - Nome del veicolo
 * @param {string} vehicle.brand - Marca del veicolo
 * @param {number|string} vehicle.capacity - Capacità batteria in kWh
 * @param {string} [vehicle.image] - URL immagine (opzionale)
 * @returns {boolean} true se salvato con successo
 */
async function saveVehicleToDB(sb, vehicle) {
    const { error } = await sb.from("vehicles").insert({
        name: vehicle.name,
        brand: vehicle.brand,
        capacity_kwh: parseFloat(vehicle.capacity),
        image_url: vehicle.image
    });

    if (error) console.error(error);
    return !error;
}

/**
 * Aggiorna un veicolo esistente nel database.
 * 
 * Include debug logging e validazione risposta per
 * identificare problemi di permessi RLS o ID errati.
 * 
 * @param {Object} sb - Client Supabase
 * @param {Object} vehicle - Dati veicolo da aggiornare
 * @param {number} vehicle.id - ID del veicolo (obbligatorio)
 * @param {string} vehicle.name - Nuovo nome
 * @param {string} vehicle.brand - Nuovo brand
 * @param {number|string} vehicle.capacity - Nuova capacità
 * @returns {boolean} true se aggiornato con successo
 */
async function updateVehicleInDB(sb, vehicle) {
    console.log("Tentativo aggiornamento veicolo:", vehicle);

    if (!vehicle.id) {
        alert("Errore Interno: Manca l'ID del veicolo.");
        return false;
    }

    // .select() alla fine per verificare cosa è stato aggiornato
    const { data, error } = await sb
        .from("vehicles")
        .update({
            name: vehicle.name,
            brand: vehicle.brand,
            capacity_kwh: parseFloat(vehicle.capacity)
        })
        .eq("id", vehicle.id)
        .select();

    if (error) {
        console.error("Errore Supabase:", error);
        alert("Errore DB: " + error.message);
        return false;
    }

    // Verifica: se data è vuoto, non ha aggiornato nulla
    if (!data || data.length === 0) {
        console.error("Nessuna riga aggiornata! Probabile problema di permessi RLS o ID errato.");
        alert("⚠️ ATTENZIONE: Il database non ha salvato la modifica!\n\nPossibili cause:\n1. Permessi 'UPDATE' non attivi su Supabase (RLS).\n2. L'ID dell'auto non corrisponde.");
        return false;
    }

    console.log("Aggiornamento riuscito:", data);
    return true;
}

/**
 * Elimina un veicolo e tutte le ricariche associate.
 * 
 * ATTENZIONE: Operazione distruttiva!
 * Elimina prima tutte le ricariche associate per evitare
 * violazioni di foreign key.
 * 
 * @param {Object} sb - Client Supabase
 * @param {number} vehicleId - ID del veicolo da eliminare
 * @returns {boolean} true se eliminato con successo
 */
async function deleteVehicleFromDB(sb, vehicleId) {
    // 1. Cancella tutte le ricariche associate (per sicurezza FK)
    const { error: errCharges } = await sb
        .from("charges")
        .delete()
        .eq("vehicle_id", vehicleId);

    if (errCharges) {
        console.error("Errore cancellazione ricariche veicolo:", errCharges);
        return false;
    }

    // 2. Cancella il veicolo
    const { error } = await sb
        .from("vehicles")
        .delete()
        .eq("id", vehicleId);

    if (error) {
        console.error("Errore cancellazione veicolo:", error);
        return false;
    }

    return true;
}

/* ============================================================
   SEZIONE 3: OPERAZIONI FORNITORI
   ============================================================ */

/**
 * Carica tutti i fornitori ordinati per:
 * 1. Preferiti (is_favorite = true) prima
 * 2. Ordine personalizzato (sort_order ascending)
 * 3. Nome alfabetico
 * 
 * @param {Object} sb - Client Supabase
 * @returns {Array} Array di fornitori ordinati
 */
async function loadSuppliers(sb) {
    const { data, error } = await sb
        .from("suppliers")
        .select("*")
        .order("is_favorite", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    return error ? [] : data;
}

/**
 * Salva un nuovo fornitore nel database.
 * 
 * @param {Object} sb - Client Supabase
 * @param {Object} s - Dati fornitore
 * @param {string} s.name - Nome fornitore
 * @param {string} s.type - "AC" o "DC"
 * @param {number|string} s.standardCost - Costo €/kWh
 * @param {boolean} [s.isFavorite=false] - Se è preferito
 * @param {number} [s.sortOrder=9] - Ordine (0=primo)
 * @returns {boolean} true se salvato con successo
 */
async function saveSupplier(sb, s) {
    const { error } = await sb.from("suppliers").insert({
        name: s.name,
        type: s.type,
        standard_cost: parseFloat(s.standardCost) || 0,
        is_favorite: s.isFavorite || false,
        sort_order: parseInt(s.sortOrder) || 9
    });

    return !error;
}

/**
 * Aggiorna un fornitore esistente.
 * 
 * @param {Object} sb - Client Supabase
 * @param {number} supplierId - ID del fornitore
 * @param {Object} updates - Dati da aggiornare
 * @returns {boolean} true se aggiornato con successo
 */
async function updateSupplier(sb, supplierId, updates) {
    const { error } = await sb
        .from("suppliers")
        .update({
            name: updates.name,
            type: updates.type,
            standard_cost: parseFloat(updates.standardCost) || 0,
            is_favorite: updates.isFavorite,
            sort_order: parseInt(updates.sortOrder)
        })
        .eq("id", supplierId);

    return !error;
}

/**
 * Elimina un fornitore dal database.
 * 
 * IMPORTANTE - Comportamento con ricariche associate:
 * ----------------------------------------------------
 * Le ricariche associate NON vengono eliminate automaticamente.
 * Questo perché ogni ricarica salva uno snapshot del fornitore:
 * - supplier_name (nome al momento della ricarica)
 * - supplier_type (AC/DC)
 * - standard_cost_snapshot (costo al momento della ricarica)
 * 
 * La foreign key supplier_id può:
 * - Essere NULL se il DB ha ON DELETE SET NULL
 * - Rimanere con l'ID vecchio (orphan) se non c'è CASCADE
 * 
 * In ogni caso, i dati storici delle ricariche sono preservati.
 * 
 * @param {Object} sb - Client Supabase
 * @param {number|string} supplierId - ID del fornitore da eliminare
 * @returns {boolean} true se eliminato con successo
 */
async function deleteSupplierFromDB(sb, supplierId) {
    const { error } = await sb
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

    if (error) {
        console.error("Errore eliminazione fornitore:", error);
        return false;
    }

    return true;
}

/* ============================================================
   SEZIONE 4: LOGICA RICARICA (Start/Stop/Manual/Edit)
   ============================================================ */

/**
 * Avvia una nuova sessione di ricarica.
 * 
 * Crea un record con status "in_progress" contenente:
 * - Dati veicolo e fornitore
 * - Km attuali e % batteria iniziale
 * - Snapshot del costo standard del fornitore
 * 
 * @param {Object} sb - Client Supabase
 * @param {Object} data - Dati della sessione
 * @param {string} data.date - ISO timestamp inizio
 * @param {number} data.totalKm - Km odometro attuali
 * @param {number} data.startPct - % batteria iniziale
 * @param {string} data.supplierId - ID fornitore
 * @param {string} [data.notes] - Note opzionali
 * @param {number} vehicleId - ID del veicolo
 * @param {Array} suppliers - Array fornitori (per lookup)
 * @returns {boolean} true se avviato con successo
 */
async function startChargeDB(sb, data, vehicleId, suppliers) {
    // Trova il fornitore selezionato nell'array
    const supplier = suppliers.find(s => s.id == data.supplierId);

    if (!supplier) {
        console.error("Supplier non trovato in startChargeDB");
        return false;
    }

    const payload = {
        vehicle_id: vehicleId,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_type: supplier.type,
        date: data.date,
        total_km: parseFloat(data.totalKm),
        battery_start: parseFloat(data.startPct),
        standard_cost_snapshot: parseFloat(supplier.standard_cost) || 0,
        status: "in_progress",
        notes: data.notes || ""
    };

    const { error } = await sb.from("charges").insert(payload);
    if (error) {
        console.error(error);
        return false;
    }

    return true;
}

/**
 * Termina una sessione di ricarica in corso.
 * 
 * Calcoli automatici:
 * - kmSinceLast: differenza odometro dalla ricarica precedente
 * - consumption: kWh/100km basato su km percorsi
 * - Costo automatico per "Casa" e "Fotovoltaico"
 * 
 * Snapshot salvati:
 * - Prezzi benzina/diesel al momento della ricarica
 * 
 * @param {Object} sb - Client Supabase
 * @param {number} chargeId - ID della ricarica in corso
 * @param {Object} endData - Dati finali
 * @param {string} endData.endDate - ISO timestamp fine
 * @param {number} endData.endPct - % batteria finale
 * @param {number} endData.kwhAdded - kWh erogati
 * @param {number} endData.cost - Costo (può essere calcolato)
 * @param {string} [endData.notes] - Note aggiornate
 * @param {number} finalCost - Costo calcolato/forzato
 * @param {Object} vehicle - Veicolo associato
 * @param {Object} settings - Impostazioni (prezzi casa, etc.)
 * @param {Array} allCharges - Tutte le ricariche (per calcolo km)
 * @param {Object|Array} suppliers - Fornitore o array fornitori
 * @returns {boolean} true se terminato con successo
 */
async function stopChargeDB(
    sb,
    chargeId,
    endData,
    finalCost,
    vehicle,
    settings,
    allCharges,
    suppliers
) {
    const kwhAdded = parseFloat(endData.kwhAdded);
    const endPct = parseFloat(endData.endPct);

    // Recupera la ricarica corrente
    const currentCharge = allCharges.find(c => c.id === chargeId);
    if (!currentCharge) {
        console.error("Ricarica corrente non trovata", chargeId);
        return false;
    }

    const currentTotalKm = parseFloat(currentCharge.total_km);

    // Trova l'ultima ricarica COMPLETATA dello stesso veicolo
    const previousCharge = allCharges
        .filter(c =>
            c.vehicle_id === vehicle.id &&
            c.status === "completed" &&
            c.id !== chargeId
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    // Calcola km percorsi e consumo
    let kmSinceLast = null;
    let consumption = null;

    if (previousCharge) {
        const prevKm = parseFloat(previousCharge.total_km);
        if (currentTotalKm > prevKm) {
            kmSinceLast = currentTotalKm - prevKm;
            // Consumo: kWh / km * 100
            if (kmSinceLast > 0) {
                consumption = (kwhAdded / kmSinceLast) * 100;
            }
        }
    }

    // Gestisce suppliers come array o oggetto singolo
    const currentSupplier = Array.isArray(suppliers)
        ? suppliers.find(s => s.id === currentCharge.supplier_id)
        : suppliers;

    if (!currentSupplier) {
        console.error("Supplier non trovato in stopChargeDB");
        return false;
    }

    // Calcolo costo automatico per Casa e Fotovoltaico
    let calculatedCost = finalCost;
    const name = currentSupplier.name.toLowerCase();

    // Fotovoltaico: usa prezzo fotovoltaico (spesso 0)
    if (name.includes("fotovoltaico") || name.includes("solar")) {
        calculatedCost = kwhAdded * (settings.solarElectricityPrice || 0);
    }
    // Casa: usa prezzo elettricità domestica
    else if (currentSupplier.name === "Casa") {
        calculatedCost = kwhAdded * settings.homeElectricityPrice;
    }

    // Aggiorna il record
    const payload = {
        end_date: endData.endDate,
        battery_end: endPct,
        kwh_added: kwhAdded,
        cost: calculatedCost,
        status: "completed",
        km_since_last: kmSinceLast,
        consumption: consumption,
        // Snapshot prezzi carburante
        saved_gasoline_price: settings.gasolinePrice,
        saved_diesel_price: settings.dieselPrice,
        notes: endData.notes || currentCharge.notes || ""
    };

    const { error } = await sb
        .from("charges")
        .update(payload)
        .eq("id", chargeId);

    return !error;
}

/**
 * Inserisce una ricarica manuale già completata.
 * 
 * Usato per:
 * - Ricariche passate da registrare
 * - Importazione dati storici
 * - Ricariche fatte altrove
 * 
 * Calcola automaticamente km e consumo come stopChargeDB.
 * 
 * @param {Object} sb - Client Supabase
 * @param {Object} data - Dati ricarica completa
 * @param {string} data.date - ISO timestamp
 * @param {number} data.totalKm - Km odometro
 * @param {number} data.startPct - % iniziale
 * @param {number} data.endPct - % finale
 * @param {number} data.kwhAdded - kWh caricati
 * @param {number} data.cost - Costo
 * @param {string} data.supplierId - ID fornitore
 * @param {string} [data.notes] - Note
 * @param {number} vehicleId - ID veicolo
 * @param {Array} suppliers - Array fornitori
 * @param {Object} vehicle - Veicolo
 * @param {Object} settings - Impostazioni
 * @param {Array} allCharges - Ricariche esistenti
 * @returns {boolean} true se salvato con successo
 */
async function saveManualChargeDB(
    sb,
    data,
    vehicleId,
    suppliers,
    vehicle,
    settings,
    allCharges
) {
    const supplier = suppliers.find(s => s.id == data.supplierId);
    if (!supplier) {
        console.error("Supplier non trovato in saveManualChargeDB");
        return false;
    }

    const kwh = parseFloat(data.kwhAdded);
    const cost = parseFloat(data.cost);
    const totalKm = parseFloat(data.totalKm);

    // Trova ultima ricarica completata per calcolare km
    const previousCharge = allCharges
        .filter(c => c.vehicle_id === vehicle.id && c.status === "completed")
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let kmSinceLast = null;
    let consumption = null;

    if (previousCharge) {
        const prevKm = parseFloat(previousCharge.total_km);
        if (totalKm > prevKm) {
            kmSinceLast = totalKm - prevKm;
            consumption = (kwh / kmSinceLast) * 100;
        }
    }

    // Calcolo costo automatico
    let calculatedCost = cost;
    const name = supplier.name.toLowerCase();

    if (name.includes("fotovoltaico") || name.includes("solar")) {
        calculatedCost = kwh * (settings.solarElectricityPrice || 0);
    } else if (supplier.name === "Casa") {
        calculatedCost = kwh * settings.homeElectricityPrice;
    }

    const payload = {
        vehicle_id: vehicleId,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_type: supplier.type,
        date: data.date,
        total_km: totalKm,
        battery_start: parseFloat(data.startPct),
        battery_end: parseFloat(data.endPct),
        kwh_added: kwh,
        cost: calculatedCost,
        standard_cost_snapshot: parseFloat(supplier.standard_cost) || 0,
        status: "completed",
        km_since_last: kmSinceLast,
        consumption: consumption,
        saved_gasoline_price: settings.gasolinePrice,
        saved_diesel_price: settings.dieselPrice,
        notes: data.notes || ""
    };

    const { error } = await sb.from("charges").insert(payload);
    return !error;
}

/* ============================================================
   SEZIONE 5: MODIFICA RICARICA CON RICALCOLI
   ============================================================ */

/**
 * Modifica una ricarica esistente con ricalcoli automatici.
 * 
 * RICALCOLI AUTOMATICI:
 * --------------------
 * Quando si modificano km o kWh, vengono ricalcolati:
 * 
 * 1. km_since_last (per la ricarica modificata):
 *    Differenza tra total_km corrente e total_km della ricarica precedente.
 * 
 * 2. consumption (per la ricarica modificata):
 *    (kwh_added / km_since_last) * 100 = kWh/100km
 * 
 * 3. costo (se vuoto e fornitore è Casa/Fotovoltaico):
 *    kwh_added * prezzo_casa_o_fotovoltaico
 * 
 * 4. km_since_last (per la ricarica SUCCESSIVA):
 *    Se total_km cambia, anche la ricarica successiva deve essere aggiornata.
 * 
 * FLUSSO:
 * -------
 * 1. Recupera ricarica precedente (per calcolo km_since_last)
 * 2. Calcola nuovi km_since_last e consumption
 * 3. Aggiorna la ricarica modificata
 * 4. Trova e aggiorna la ricarica successiva (cascade update)
 * 
 * @param {Object} sb - Client Supabase
 * @param {Object} chargeData - Dati ricarica modificati
 * @param {number} chargeData.id - ID della ricarica
 * @param {string} chargeData.date - Data/ora
 * @param {number} chargeData.totalKm - Km totali
 * @param {number} chargeData.kwhAdded - kWh caricati
 * @param {number} chargeData.batteryStart - % iniziale
 * @param {number} chargeData.batteryEnd - % finale
 * @param {number} chargeData.cost - Costo
 * @param {string} chargeData.supplierId - ID fornitore
 * @param {string} chargeData.notes - Note
 * @param {Object} originalCharge - Ricarica originale (prima della modifica)
 * @param {Array} allCharges - Tutte le ricariche
 * @param {Array} suppliers - Lista fornitori
 * @param {Object} settings - Impostazioni
 * @returns {Object} Risultato con success e messaggi
 */
async function updateChargeInDB(sb, chargeData, originalCharge, allCharges, suppliers, settings) {
    const chargeId = chargeData.id;
    const newTotalKm = parseFloat(chargeData.totalKm);
    const newKwhAdded = parseFloat(chargeData.kwhAdded);
    const newCost = parseFloat(chargeData.cost);
    
    // Trova il fornitore (nuovo o originale)
    const supplier = suppliers.find(s => s.id == chargeData.supplierId) || 
                     suppliers.find(s => s.id == originalCharge.supplier_id);
    
    if (!supplier) {
        return { success: false, message: "Fornitore non trovato" };
    }

    // ========================================
    // 1. CALCOLA KM_SINCE_LAST E CONSUMPTION
    // ========================================
    
    // Trova la ricarica precedente (completata, stesso veicolo, più recente prima di questa)
    const chargeDate = new Date(originalCharge.date);
    const previousCharge = allCharges
        .filter(c => 
            c.vehicle_id === originalCharge.vehicle_id && 
            c.status === "completed" && 
            c.id !== chargeId &&
            new Date(c.date) < chargeDate
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let kmSinceLast = null;
    let consumption = null;

    if (previousCharge) {
        const prevKm = parseFloat(previousCharge.total_km);
        if (newTotalKm > prevKm) {
            kmSinceLast = newTotalKm - prevKm;
            if (kmSinceLast > 0 && newKwhAdded > 0) {
                consumption = (newKwhAdded / kmSinceLast) * 100;
            }
        }
    }

    // ========================================
    // 2. CALCOLA COSTO (SE NON FORNITO)
    // ========================================
    
    let calculatedCost = newCost;
    const supplierName = supplier.name.toLowerCase();

    // Se costo non specificato, calcola automaticamente per Casa/Fotovoltaico
    if (!newCost || isNaN(newCost)) {
        if (supplierName.includes("fotovoltaico") || supplierName.includes("solar")) {
            calculatedCost = newKwhAdded * (settings.solarElectricityPrice || 0);
        } else if (supplier.name === "Casa") {
            calculatedCost = newKwhAdded * settings.homeElectricityPrice;
        } else {
            calculatedCost = 0; // Per ricariche pubbliche, l'utente deve inserire il costo
        }
    }

    // ========================================
    // 3. AGGIORNA LA RICARICA
    // ========================================
    
    // Converti la data
    let dateISO = originalCharge.date;
    if (chargeData.date) {
        const dateObj = new Date(chargeData.date);
        if (!isNaN(dateObj.getTime())) {
            dateISO = dateObj.toISOString();
        }
    }

    const updatePayload = {
        date: dateISO,
        total_km: newTotalKm,
        battery_start: parseFloat(chargeData.batteryStart) || originalCharge.battery_start,
        battery_end: parseFloat(chargeData.batteryEnd) || originalCharge.battery_end,
        kwh_added: newKwhAdded,
        cost: calculatedCost,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_type: supplier.type,
        standard_cost_snapshot: parseFloat(supplier.standard_cost) || 0,
        km_since_last: kmSinceLast,
        consumption: consumption,
        notes: chargeData.notes || originalCharge.notes || ""
    };

    const { error: updateError } = await sb
        .from("charges")
        .update(updatePayload)
        .eq("id", chargeId);

    if (updateError) {
        console.error("Errore aggiornamento ricarica:", updateError);
        return { success: false, message: "Errore database: " + updateError.message };
    }

    // ========================================
    // 4. AGGIORNA RICARICA SUCCESSIVA (CASCADE)
    // ========================================
    
    // Se total_km è cambiato, dobbiamo aggiornare anche la ricarica successiva
    const oldTotalKm = parseFloat(originalCharge.total_km);
    const kmChanged = Math.abs(newTotalKm - oldTotalKm) > 0.1;

    let cascadeMessage = "";
    
    if (kmChanged) {
        // Trova la ricarica successiva
        const nextCharge = allCharges
            .filter(c => 
                c.vehicle_id === originalCharge.vehicle_id && 
                c.status === "completed" && 
                c.id !== chargeId &&
                new Date(c.date) > chargeDate
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        if (nextCharge) {
            const nextTotalKm = parseFloat(nextCharge.total_km);
            const newNextKmSinceLast = nextTotalKm - newTotalKm;
            let newNextConsumption = null;

            if (newNextKmSinceLast > 0 && nextCharge.kwh_added) {
                newNextConsumption = (parseFloat(nextCharge.kwh_added) / newNextKmSinceLast) * 100;
            }

            const { error: cascadeError } = await sb
                .from("charges")
                .update({
                    km_since_last: newNextKmSinceLast > 0 ? newNextKmSinceLast : null,
                    consumption: newNextConsumption
                })
                .eq("id", nextCharge.id);

            if (cascadeError) {
                console.error("Errore aggiornamento cascade:", cascadeError);
                cascadeMessage = " (attenzione: errore aggiornamento ricarica successiva)";
            } else {
                cascadeMessage = ` (+ aggiornata ricarica successiva del ${new Date(nextCharge.date).toLocaleDateString('it-IT')})`;
            }
        }
    }

    return { 
        success: true, 
        message: "Ricarica aggiornata con successo!" + cascadeMessage,
        kmSinceLast,
        consumption,
        calculatedCost
    };
}

/* ============================================================
   SEZIONE 6: OPERAZIONI ELIMINAZIONE
   ============================================================ */

/**
 * Elimina una singola ricarica dal database.
 * 
 * @param {Object} sb - Client Supabase
 * @param {number} id - ID della ricarica
 * @returns {boolean} true se eliminata con successo
 */
async function deleteChargeFromDB(sb, id) {
    const { error } = await sb
        .from("charges")
        .delete()
        .eq("id", id);

    return !error;
}
