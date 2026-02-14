// services/supabase.js
// =====================================================
// Questo file contiene TUTTA la logica di accesso a Supabase
// (fetch, insert, update, delete) + la logica di ricarica EV.
// =====================================================


/* =====================================================
   FETCH DATI BASE
   ===================================================== */

/**
 * Carica tutti i veicoli dal database
 * @param {object} sb - client Supabase
 * @returns {Array} elenco veicoli (array vuoto in caso di errore)
 */
async function loadVehicles(sb) {
    const { data, error } = await sb.from("vehicles").select("*");
    return error ? [] : data;
}
/**
 * Carica tutte le ricariche ordinate per data (desc)
 */
async function loadCharges(sb) {
    const { data, error } = await sb
        .from("charges")
        .select("*")
        .order("date", { ascending: false });

    return error ? [] : data;
}


/* =====================================================
   VEICOLI
   ===================================================== */

/**
 * Salva un nuovo veicolo
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


/* =====================================================
   SUPPLIERS (Ordinati per Preferiti + Ordine)
   ===================================================== */

async function loadSuppliers(sb) {
    const { data, error } = await sb
        .from("suppliers")
        .select("*")
        // Ordina: Prima i Preferiti (true viene dopo false, quindi desc), poi Ordine (asc), poi Nome
        .order("is_favorite", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    return error ? [] : data;
}

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

/* =====================================================
   LOGICA RICARICA
   ===================================================== */

/**
 * 1️⃣ AVVIO RICARICA
 *
 * Qui `suppliers` è un ARRAY → usare .find() è corretto
 */
async function startChargeDB(sb, data, vehicleId, suppliers) {
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

        // Snapshot del costo (importante se cambia in futuro)
        standard_cost_snapshot: parseFloat(supplier.standard_cost) || 0,

        status: "in_progress"
    };

    const { error } = await sb.from("charges").insert(payload);
    if (error) {
        console.error(error);
        return false;
    }

    return true;
}


/**
 * 2️⃣ TERMINA RICARICA
 *
 * ⚠️ QUI NASCEVA IL BUG:
 * `suppliers` NON è un array, ma UN SOLO OGGETTO supplier.
 *
 * Questa versione gestisce ENTRAMBI i casi:
 * - suppliers = array
 * - suppliers = oggetto singolo
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

    // -----------------------------
    // Recupero ricarica corrente
    // -----------------------------
    const currentCharge = allCharges.find(c => c.id === chargeId);
    if (!currentCharge) {
        console.error("Ricarica corrente non trovata", chargeId);
        return false;
    }

    const currentTotalKm = parseFloat(currentCharge.total_km);

    // -----------------------------
    // Ultima ricarica COMPLETATA
    // -----------------------------
    const previousCharge = allCharges
        .filter(c =>
            c.vehicle_id === vehicle.id &&
            c.status === "completed" &&
            c.id !== chargeId
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let kmSinceLast = null;
    let consumption = null;

    if (previousCharge) {
        const prevKm = parseFloat(previousCharge.total_km);
        if (currentTotalKm > prevKm) {
            kmSinceLast = currentTotalKm - prevKm;

            // Consumo reale: kWh / km * 100
            if (kmSinceLast > 0) {
                consumption = (kwhAdded / kmSinceLast) * 100;
            }
        }
    }

    // -----------------------------
    // 🔐 FIX SICURO DEL BUG
    // -----------------------------
    const currentSupplier = Array.isArray(suppliers)
        ? suppliers.find(s => s.id === currentCharge.supplier_id)
        : suppliers;

    if (!currentSupplier) {
        console.error("Supplier non trovato in stopChargeDB");
        return false;
    }

    // -----------------------------
    // Calcolo costo finale
    // -----------------------------
    let calculatedCost = finalCost;

    const name = currentSupplier.name.toLowerCase();

    // Fotovoltaico
    if (name.includes("fotovoltaico") || name.includes("solar")) {
        calculatedCost = kwhAdded * (settings.solarElectricityPrice || 0);
    }
    // Casa
    else if (currentSupplier.name === "Casa") {
        calculatedCost = kwhAdded * settings.homeElectricityPrice;
    }

    // -----------------------------
    // Update DB
    // -----------------------------
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
        saved_diesel_price: settings.dieselPrice
    };

    const { error } = await sb
        .from("charges")
        .update(payload)
        .eq("id", chargeId);

    return !error;
}


/**
 * 3️⃣ RICARICA MANUALE
 *
 * Qui `suppliers` è un ARRAY → .find() corretto
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

    // Ultima ricarica completata
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

    // Calcolo costo
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
        saved_diesel_price: settings.dieselPrice
    };

    const { error } = await sb.from("charges").insert(payload);
    return !error;
}


/* =====================================================
   DELETE
   ===================================================== */

async function deleteChargeFromDB(sb, id) {
    const { error } = await sb
        .from("charges")
        .delete()
        .eq("id", id);

    return !error;
}

/* =====================================================
   DELETE VEHICLE
   ===================================================== */
async function deleteVehicleFromDB(sb, vehicleId) {
    // 1. Cancella tutte le ricariche associate (per sicurezza)
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

/* =====================================================
UPDATE VEHICLE (DEBUGGATA)
===================================================== */
async function updateVehicleInDB(sb, vehicle) {
    console.log("Tentativo aggiornamento veicolo:", vehicle);

    if (!vehicle.id) {
        alert("Errore Interno: Manca l'ID del veicolo.");
        return false;
    }

    // Aggiungiamo .select() alla fine per vedere cosa torna indietro
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

    // VERIFICA CRUCIALE: Se data è vuoto, non ha aggiornato nulla!
    if (!data || data.length === 0) {
        console.error("Nessuna riga aggiornata! Probabile problema di permessi RLS o ID errato.");
        alert("⚠️ ATTENZIONE: Il database non ha salvato la modifica!\n\nPossibili cause:\n1. Permessi 'UPDATE' non attivi su Supabase (RLS).\n2. L'ID dell'auto non corrisponde.");
        return false;
    }

    console.log("Aggiornamento riuscito:", data);
    return true;
}