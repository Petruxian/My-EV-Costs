//
// UI COMPONENTS
// Compatibile con React UMD + GitHub Pages
// Nessun import/export, tutto in globale
//


// ==========================================
// CARD GENERICA
// ==========================================
function UICard({ children, className = "" }) {
    return (
        <div
            className={
                "bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 p-4 " +
                className
            }
        >
            {children}
        </div>
    );
}



// ==========================================
// TITOLO DI SEZIONE
// ==========================================
function UISectionTitle({ icon, children }) {
    return (
        <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <span>{icon}</span>
            {children}
        </h2>
    );
}



// ==========================================
// PULSANTE TOGGLE (per i grafici)
// ==========================================
function UIToggleButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={
                "px-3 py-1 rounded-full border text-xs transition-all " +
                (active
                    ? "bg-emerald-600/30 border-emerald-400"
                    : "bg-slate-800 border-slate-600 hover:bg-slate-700")
            }
        >
            {children}
        </button>
    );
}



// ==========================================
// DIVIDER
// ==========================================
function UIDivider() {
    return <div className="border-t border-slate-700/50 my-4"></div>;
}



// ==========================================
// BADGE GENERICO
// ==========================================
function UIBadge({ label, color = "text-white", bg = "bg-slate-700/40" }) {
    return (
        <span
            className={
                "px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap " +
                color +
                " " +
                bg
            }
        >
            {label}
        </span>
    );
}
