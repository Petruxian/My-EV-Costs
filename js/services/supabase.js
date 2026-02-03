// services/supabase.js

// --- FETCH ---
async function loadVehicles(sb) {
    const { data, error } = await sb.from("vehicles").select("*");
    return error ? [] : data;
}

async function loadSuppliers(sb) {
    const { data, error } = await sb.from("suppliers").select("*");
    return error ? [] : data;
}

async function loadCharges(sb) {
    const { data, error } = await sb.from("charges").select("*").order("date", { ascending: false });
    return error ? [] : data;
}

// --- SAVE VEHICLE ---
async function saveVehicleToDB(sb, vehicle) {
    const { error } = await sb.from("vehicles").insert({
        name: vehicle.name,
        brand: vehicle.brand,
        capacity_kwh: parseFloat(vehicle.capacity),
        image_url: vehicle.image
    });
    if(error) console.error(error);
    return !error;
}

// --- SAVE SUPPLIER ---
async function saveSupplier(sb, s) {
    const { error } = await sb.from("suppliers").insert({
        name: s.name, type: s.type, standard_cost: parseFloat(s.standardCost)||0
    });
    return !error;
}

// --- LOGICA RICARICA ---

// 1. INIZIA SESSIONE
async function startChargeDB(sb, data, vehicleId, suppliers) {
    const supplier = suppliers.find(s => s.id == data.supplierId);
    
    // Cerco la ricarica precedente SOLO di questo veicolo per coerenza km? 
    // Per ora salviamo solo il dato grezzo, i calcoli li facciamo alla fine o in visualizzazione.
    
    const payload = {
        vehicle_id: vehicleId,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_type: supplier.type,
        date: data.date,
        total_km: parseFloat(data.totalKm),
        battery_start: parseFloat(data.startPct),
        status: 'in_progress'
    };
    
    const { error } = await sb.from("charges").insert(payload);
    if(error) { console.error(error); return false; }
    return true;
}

// 2. TERMINA SESSIONE
async function stopChargeDB(sb, chargeId, endData, finalCost, vehicle, settings, allCharges) {
    const kwhAdded = parseFloat(endData.kwhAdded);
    const endPct = parseFloat(endData.endPct);
    
    // Recupera la ricarica iniziale dal DB o dalla lista locale per calcolare i delta
    // Per semplicità usiamo l'update diretto assumendo che i dati 'start' siano già nel DB.
    // Ma ci serve sapere i km precedenti per calcolare consumo.
    
    // Trova l'ultima ricarica COMPLETATA di questo veicolo prima di questa sessione
    const previousCharge = allCharges
        .filter(c => c.vehicle_id === vehicle.id && c.status === 'completed' && c.id !== chargeId)
        .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
        
    // Recupera la ricarica attuale (per sapere i km iniziali)
    const currentCharge = allCharges.find(c => c.id === chargeId);
    const currentTotalKm = parseFloat(currentCharge.total_km);
    
    let kmSinceLast = null;
    let consumption = null;
    
    if(previousCharge) {
        const prevKm = parseFloat(previousCharge.total_km);
        if(currentTotalKm > prevKm) {
            kmSinceLast = currentTotalKm - prevKm;
            // Consumo reale: kwh erogati / km percorsi * 100
            if(kmSinceLast > 0) consumption = (kwhAdded / kmSinceLast) * 100;
        }
    }

    const payload = {
        end_date: endData.endDate,
        battery_end: endPct,
        kwh_added: kwhAdded,
        cost: finalCost,
        status: 'completed',
        km_since_last: kmSinceLast,
        consumption: consumption,
        
        // Snapshot prezzi
        saved_gasoline_price: settings.gasolinePrice,
        saved_diesel_price: settings.dieselPrice
    };
    
    const { error } = await sb.from("charges").update(payload).eq("id", chargeId);
    return !error;
}

// 3. SALVA RICARICA MANUALE
async function saveManualChargeDB(sb, data, vehicleId, suppliers, vehicle, settings, allCharges) {
    const supplier = suppliers.find(s => s.id == data.supplierId);
    const kwh = parseFloat(data.kwhAdded);
    const cost = parseFloat(data.cost);
    const totalKm = parseFloat(data.totalKm);
    
    // Calcolo consumo vs precedente
    const previousCharge = allCharges
        .filter(c => c.vehicle_id === vehicle.id && c.status === 'completed')
        .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
        
    let kmSinceLast = null;
    let consumption = null;

    if(previousCharge) {
        const prevKm = parseFloat(previousCharge.total_km);
        if(totalKm > prevKm) {
            kmSinceLast = totalKm - prevKm;
            consumption = (kwh / kmSinceLast) * 100;
        }
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
        cost: cost,
        status: 'completed',
        km_since_last: kmSinceLast,
        consumption: consumption,
        saved_gasoline_price: settings.gasolinePrice
    };

    const { error } = await sb.from("charges").insert(payload);
    return !error;
}

async function deleteChargeFromDB(sb, id) {
    const { error } = await sb.from("charges").delete().eq("id", id);
    return !error;
}