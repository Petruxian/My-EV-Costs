//
// SUPABASE FUNCTIONS
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// CARICA FORNITORI
// ==========================================
async function loadSuppliers(supabase) {
    const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Errore caricamento fornitori:", error);
        return [];
    }

    return data || [];
}



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
// SALVA NUOVO FORNITORE
// ==========================================
async function saveSupplier(supabase, supplier) {
    const payload = {
        name: supplier.name,
        type: supplier.type,
        standard_cost: parseFloat(supplier.standardCost) || 0
    };

    const { error } = await supabase.from("suppliers").insert(payload);

    if (error) {
        console.error("Errore salvataggio fornitore:", error);
        return false;
    }

    return true;
}



// ==========================================
// ELIMINA FORNITORE
// ==========================================
async function deleteSupplier(supabase, id) {
    const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Errore eliminazione fornitore:", error);
        return false;
    }

    return true;
}



// ==========================================
// SALVA NUOVA RICARICA
// ==========================================
async function saveChargeToDB(supabase, newCharge, suppliers, settings, charges) {
    try {
        const supplier = suppliers.find(s => s.id === parseInt(newCharge.supplier));
        if (!supplier) {
            console.error("Fornitore non trovato");
            return false;
        }

        const kwh = parseFloat(newCharge.kWhAdded) || 0;
        const totalKm = parseFloat(newCharge.totalKm) || 0;

        // ============================
        // CALCOLO km_since_last
        // ============================
        let kmSinceLast = null;
        let consumption = null;

        if (charges.length > 0) {
            const sorted = [...charges].sort(
                (a, b) => parseFloat(b.total_km) - parseFloat(a.total_km)
            );

            const lastKm = parseFloat(sorted[0].total_km) || 0;

            if (totalKm > lastKm) {
                kmSinceLast = totalKm - lastKm;

                if (kmSinceLast > 0 && kwh > 0) {
                    consumption = (kwh / kmSinceLast) * 100;
                }
            }
        }

        // ============================
        // COSTO
        // ============================
        let cost = parseFloat(newCharge.cost) || 0;

        if (supplier.name === "Casa") {
            cost = kwh * settings.homeElectricityPrice;
        }

        // ============================
        // COSTO STANDARD FORNITORE
        // ============================
        const standardCost = parseFloat(supplier.standard_cost) || 0;

        let costDifference = null;
        if (standardCost > 0) {
            const expected = kwh * standardCost;
            costDifference = cost - expected;
        }

        // ============================
        // SNAPSHOT PREZZI BENZINA/DIESEL
        // ============================
        const gasolinePrice = settings.gasolinePrice;
        const dieselPrice = settings.dieselPrice;
        const gasolineConsumption = settings.gasolineConsumption;
        const dieselConsumption = settings.dieselConsumption;

        // ============================
        // PAYLOAD
        // ============================
        const payload = {
            date: newCharge.date,
            total_km: totalKm,
            kwh_added: kwh,
            supplier_id: supplier.id,  // CORRETTO: era "supplier"
            supplier_name: supplier.name,
            supplier_type: supplier.type,
            cost: cost,
            standard_cost: standardCost,
            cost_difference: costDifference,
            km_since_last: kmSinceLast,
            consumption: consumption,

            // snapshot
            saved_gasoline_price: gasolinePrice,
            saved_diesel_price: dieselPrice,
            saved_gasoline_consumption: gasolineConsumption,
            saved_diesel_consumption: dieselConsumption
        };

        const { error } = await supabase.from("charges").insert(payload);

        if (error) {
            console.error("Errore salvataggio ricarica:", error);
            return false;
        }

        return true;

    } catch (err) {
        console.error("Errore inatteso salvataggio ricarica:", err);
        return false;
    }
}



// ==========================================
// ELIMINA RICARICA
// ==========================================
async function deleteChargeFromDB(supabase, id) {
    const { error } = await supabase
        .from("charges")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Errore eliminazione ricarica:", error);
        return false;
    }

    return true;
}
