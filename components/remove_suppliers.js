//
// SUPPLIERS MANAGEMENT
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// CARICA FORNITORI DA SUPABASE
// ==========================================
async function loadSuppliers(supabase) {
    const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Errore caricamento fornitori:", error);
        return [];
    }

    return data || [];
}



// ==========================================
// SALVA NUOVO FORNITORE
// ==========================================
async function saveSupplier(supabase, newSupplier) {
    const payload = {
        name: newSupplier.name,
        type: newSupplier.type,
        standard_cost: parseFloat(newSupplier.standardCost) || 0
    };

    const { error } = await supabase.from("suppliers").insert([payload]);

    if (error) {
        console.error("Errore salvataggio fornitore:", error);
        return false;
    }

    return true;
}



// ==========================================
// ELIMINA FORNITORE
// (solo se non è 'Casa')
// ==========================================
async function deleteSupplier(supabase, supplierId) {
    const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

    if (error) {
        console.error("Errore eliminazione fornitore:", error);
        return false;
    }

    return true;
}
