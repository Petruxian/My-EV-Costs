//
// CHARGES MANAGEMENT
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// CARICA RICARICHE
// ==========================================
async function loadCharges(supabase) {
    const { data, error } = await supabase
        .from("charges")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        console.error("Errore caricamento ricariche:", error);
        return [];
    }

    return data || [];
}



// ==========================================
// SALVA NUOVA RICARICA
// ==========================================
async function saveChargeToDB(supabase, newCharge, suppliers, settings, previousCharges = []) {
    const supplier = suppliers.find(s => s.id === parseInt(newCharge.supplier));

    if (!supplier) {
        console.error("Fornitore non trovato");
        return false;
    }

    // Costo automatico se "Casa"
    let cost = newCharge.cost;
    if (supplier.name === "Casa") {
        cost = parseFloat(newCharge.kWhAdded) * settings.homeElectricityPrice;
    }

    // Calcolo km percorsi
    let kmSinceLast = null;
    if (previousCharges.length > 0) {
        const last = previousCharges[0]; // la più recente
        kmSinceLast = parseFloat(newCharge.totalKm) - parseFloat(last.total_km);
        if (kmSinceLast < 0) kmSinceLast = null; // sicurezza
    }

    // Calcolo consumo (kWh/100km)
    let consumption = null;
    if (kmSinceLast && kmSinceLast > 0) {
        consumption = (parseFloat(newCharge.kWhAdded) / kmSinceLast) * 100;
    }

    // Differenza rispetto al costo standard
    const standardCost = parseFloat(supplier.standard_cost || 0);
    const costDifference = standardCost
        ? cost - parseFloat(newCharge.kWhAdded) * standardCost
        : null;

    const payload = {
        date: newCharge.date,
        total_km: parseFloat(newCharge.totalKm),
        kwh_added: parseFloat(newCharge.kWhAdded),
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_type: supplier.type,
        cost: parseFloat(cost),

        // Snapshot del costo standard del fornitore
        standard_cost: standardCost,

        // Snapshot benzina/diesel
        saved_gasoline_price: settings.gasolinePrice,
        saved_gasoline_consumption: settings.gasolineConsumption,
        saved_diesel_price: settings.dieselPrice,
        saved_diesel_consumption: settings.dieselConsumption,

        // Nuovi campi
        km_since_last: kmSinceLast,
        consumption: consumption,
        cost_difference: costDifference
    };

    const { error } = await supabase.from("charges").insert([payload]);

    if (error) {
        console.error("Errore salvataggio ricarica:", error);
        return false;
    }

    return true;
}




// ==========================================
// ELIMINA RICARICA
// ==========================================
async function deleteChargeFromDB(supabase, chargeId) {
    const { error } = await supabase
        .from("charges")
        .delete()
        .eq("id", chargeId);

    if (error) {
        console.error("Errore eliminazione ricarica:", error);
        return false;
    }

    return true;
}
