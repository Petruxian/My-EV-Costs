/**
 * ============================================================
 * UI.JS - Componenti Grafici per EV Cost Tracker
 * ============================================================
 * 
 * Questo file contiene tutti i componenti UI (User Interface)
 * dell'applicazione EV Cost Tracker. I componenti sono scritti
 * in JSX e compatibili con React 18 in modalità UMD.
 * 
 * COMPONENTI INCLUSI:
 * -------------------
 * 1. SkeletonLoader     - Placeholder animato durante caricamento
 * 2. UICard             - Card generica riutilizzabile
 * 3. StatsCards         - 4 card dashboard (speso, km, risparmio, eco)
 * 4. FilterBar          - Barra filtri e ricerca ricariche
 * 5. BudgetIndicator    - Indicatore budget mensile con progress bar
 * 6. QuickActions       - Pulsanti rapidi per ricariche frequenti
 * 7. ChargeList         - Lista ricariche raggruppate per mese
 * 8. SettingsView       - Vista impostazioni completa
 * 9. ChartSection       - Container sezione grafici
 * 10. ActiveChargingBox - Box ricarica in corso con timer live
 * 11. FunStats          - Badge traguardi + equivalenza pizza/caffè
 * 
 * DIPENDENZE:
 * -----------
 * - React 18 (UMD - globale)
 * - ReactDOM 18 (UMD - globale)
 * - Tailwind CSS (CDN)
 * - Funzioni da utils.js: calculateAveragePower
 * - Funzioni da stats.js: calculateStats
 * 
 * ARCHITETTURA:
 * -------------
 * - Tutti i componenti sono funzioni pure React
 * - Lo stato è gestito nel componente padre (app.js)
 * - La comunicazione avviene via props (down) e callback (up)
 * 
 * STILI:
 * ------
 * - Utilizza classi Tailwind CSS
 * - Variabili CSS definite in styles.css per temi
 * - Classi custom: .card, .btn, .input, .modal-backdrop, etc.
 * 
 * @author EV Cost Tracker Team
 * @version 2.6 - Settings globali separate da per-veicolo, fornitori esclusivi
 * ============================================================
 */

// ============================================================
// SKELETON LOADER
// ============================================================
/**
 * Placeholder animato mostrato durante il caricamento dati.
 * 
 * Mostra 4 card skeleton + una card lista con testo placeholder.
 * Utilizza l'animazione shimmer definita in styles.css.
 * 
 * @returns {JSX.Element} Skeleton UI
 */
function SkeletonLoader() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* 4 Card skeleton per le stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton skeleton-card"></div>
                ))}
            </div>
            {/* Card lista skeleton */}
            <div className="card">
                <div className="skeleton skeleton-title"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton skeleton-text"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// CARD GENERICA
// ============================================================
/**
 * Componente card generico e riutilizzabile.
 * 
 * @param {Object} props - Props del componente
 * @param {JSX.Element} props.children - Contenuto della card
 * @param {string} [props.className=""] - Classi CSS aggiuntive
 * @returns {JSX.Element} Card con contenuto
 */
function UICard({ children, className = "" }) {
    return (
        <div className={"card " + className}>
            {children}
        </div>
    );
}

// ============================================================
// STATS CARDS - Le 4 Card Dashboard
// ============================================================
/**
 * Le 4 card statistiche mostrate in cima alla dashboard.
 * 
 * CARD:
 * 1. Totale Speso + Energia (kWh)
 * 2. Km Percorsi + Consumo (kWh/100km)
 * 3. Risparmio vs Benzina e Diesel
 * 4. Impatto Ecologico (CO2, Alberi)
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.stats - Oggetto statistiche da calculateStats()
 * @returns {JSX.Element|null} 4 card statistiche o null se no data
 */
function StatsCards({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
            {/* CARD 1: Energia & Costo */}
            <div className="card hover-card">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Totale Speso</div>
                        <div className="text-3xl sm:text-2xl font-bold text-saving">€{stats.totalCost}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Energia</div>
                        <div className="text-xl sm:text-xl font-bold text-kwh">{parseFloat(stats.totalKwh).toFixed(0)} <span className="text-xs sm:text-sm">kWh</span></div>
                    </div>
                </div>
            </div>

            {/* CARD 2: Km & Consumo */}
            <div className="card hover-card">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Strada fatta</div>
                        <div className="text-3xl sm:text-2xl font-bold text-km">{stats.kmDriven} <span className="text-sm">km</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs sm:text-sm text-muted mb-1 font-medium">Consumo</div>
                        <div className="text-xl sm:text-xl font-bold text-kwh">{stats.consumption}</div>
                    </div>
                </div>
            </div>

            {/* CARD 3: Risparmio vs Carburanti */}
            <div className="card hover-card bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30">
                <div className="text-xs sm:text-sm text-emerald-400 mb-3 font-bold flex items-center gap-2">
                    <span className="text-lg">💰</span> Risparmio Reale
                </div>
                <div className="grid grid-cols-2 gap-0 relative">
                    <div className="absolute left-1/2 top-1 bottom-1 w-px bg-slate-700/50 -translate-x-1/2"></div>
                    <div className="text-center pr-1">
                        <div className="text-2xl sm:text-xl font-bold text-white truncate">€{stats.gasolineSavings}</div>
                        <div className="text-[10px] sm:text-[9px] uppercase tracking-wider text-emerald-200/70 mt-1.5">Benzina</div>
                    </div>
                    <div className="text-center pl-1">
                        <div className="text-2xl sm:text-xl font-bold text-white truncate">€{stats.dieselSavings}</div>
                        <div className="text-[10px] sm:text-[9px] uppercase tracking-wider text-cyan-200/70 mt-1.5">Diesel</div>
                    </div>
                </div>
            </div>

            {/* CARD 4: Impatto Ecologico */}
            <div className="card hover-card bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🌳</div>
                <div className="text-xs sm:text-sm text-green-300 mb-2 font-bold flex items-center gap-1">
                    <span className="text-lg">🌍</span> Impatto Green
                </div>
                <div className="flex items-end gap-2">
                    <div className="text-4xl sm:text-3xl font-bold text-white">{stats.treesSaved}</div>
                    <div className="text-sm text-green-200 mb-1.5">Alberi 🌲</div>
                </div>
                <div className="text-xs text-green-400/70 mt-2">-{stats.co2SavedKg} kg di CO₂</div>
            </div>
        </div>
    );
}

// ============================================================
// BUDGET INDICATOR - Indicatore Budget Mensile
// ============================================================
/**
 * Indicatore visuale del budget mensile con barra di progresso.
 * Mostra quanto del budget è stato speso e alert visivi.
 * 
 * @param {Object} props - Props del componente
 * @param {number} props.spent - Importo speso questo mese
 * @param {number} props.budget - Budget mensile totale
 * @param {number} [props.threshold=80] - Soglia percentuale per warning
 * @returns {JSX.Element} Indicatore budget
 */
function BudgetIndicator({ spent, budget, threshold = 80 }) {
    if (!budget || budget <= 0) return null;
    
    const percentage = Math.min((spent / budget) * 100, 100);
    const isWarning = percentage >= threshold && percentage < 100;
    const isOver = percentage >= 100;
    const remaining = budget - spent;
    
    // Colori dinamici
    const barColor = isOver 
        ? 'bg-gradient-to-r from-red-500 to-red-400' 
        : isWarning 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-400' 
            : 'bg-gradient-to-r from-emerald-500 to-cyan-400';
    
    const borderColor = isOver 
        ? 'border-red-500/50' 
        : isWarning 
            ? 'border-yellow-500/50' 
            : 'border-emerald-500/30';
    
    return (
        <div className={`card p-4 mb-6 ${borderColor} border-2 animate-fade-in`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{isOver ? '🚨' : isWarning ? '⚠️' : '💰'}</span>
                    <span className="font-bold text-sm">Budget Mensile</span>
                </div>
                <div className="text-right">
                    <span className={`font-bold text-lg ${isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        €{spent.toFixed(2)}
                    </span>
                    <span className="text-muted text-sm"> / €{budget}</span>
                </div>
            </div>
            
            <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            
            <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted">
                    {isOver 
                        ? `Superato di €${Math.abs(remaining).toFixed(2)}` 
                        : `Rimangono €${remaining.toFixed(2)}`
                    }
                </span>
                <span className={`text-xs font-bold ${
                    isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
        </div>
    );
}

// ============================================================
// QUICK ACTIONS - Pulsanti Rapidi Ricarica
// ============================================================
/**
 * Pulsanti rapidi per avviare ricariche con fornitori usati di recente.
 * Permette di saltare la selezione del fornitore.
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.recentSuppliers - IDs fornitori recenti
 * @param {Array} props.suppliers - Lista completa fornitori
 * @param {Function} props.onQuickStart - Callback (supplierId) => void
 * @returns {JSX.Element|null} Pulsanti rapidi o null se no recenti
 */
function QuickActions({ recentSuppliers, suppliers, onQuickStart }) {
    if (!recentSuppliers || recentSuppliers.length === 0) return null;
    
    // Filtra fornitori validi
    const validSuppliers = recentSuppliers
        .map(id => suppliers.find(s => s.id === id))
        .filter(Boolean);
    
    if (validSuppliers.length === 0) return null;
    
    return (
        <div className="mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-accent">⚡ Ricarica Rapida</span>
                <span className="text-xs text-muted">Ultimi fornitori usati</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {validSuppliers.map(supplier => (
                    <button
                        key={supplier.id}
                        onClick={() => onQuickStart(supplier.id)}
                        className={`btn font-semibold text-sm px-4 py-2 flex items-center gap-2 transition-all hover:scale-105 ${
                            supplier.type === 'DC' 
                                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500' 
                                : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500'
                        } text-white`}
                    >
                        <span>{supplier.type === 'DC' ? '⚡' : '🔌'}</span>
                        <span>{supplier.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// FILTER BAR - Barra Filtri e Ricerca
// ============================================================
/**
 * Barra filtri completa per la lista ricariche.
 * Include ricerca testuale, filtri per fornitore, tipo, date e ordinamento.
 * 
 * @param {Object} props - Props del componente
 * @param {Object} props.filters - Stato filtri corrente
 * @param {Function} props.setFilters - Setter filtri
 * @param {Array} props.suppliers - Lista fornitori per dropdown
 * @param {Function} props.onClearFilters - Callback reset filtri
 * @returns {JSX.Element} Barra filtri
 */
function FilterBar({ filters, setFilters, suppliers, onClearFilters }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    // Conta filtri attivi
    const activeFiltersCount = [
        filters.supplier !== 'all',
        filters.type !== 'all',
        filters.dateFrom,
        filters.dateTo,
        filters.search,
        filters.tags && filters.tags.length > 0
    ].filter(Boolean).length;
    
    // Tag predefiniti comuni
    const commonTags = ['#lavoro', '#viaggio', '#notturna', '#urgente', '#economica', '#lunga'];
    
    return (
        <div className="card p-4 mb-4 animate-fade-in">
            {/* Barra principale con ricerca */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Campo ricerca */}
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
                    <input
                        type="text"
                        placeholder="Cerca per note, fornitore..."
                        className="input pl-10 w-full"
                        value={filters.search || ''}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                
                {/* Toggle filtri avanzati */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`btn ${isExpanded ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                >
                    <span>🎛️</span>
                    <span>Filtri</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>
            
            {/* Filtri avanzati espandibili */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-card-border animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtro fornitore */}
                        <div>
                            <label className="text-xs text-muted block mb-1">🏪 Fornitore</label>
                            <select
                                className="input w-full"
                                value={filters.supplier || 'all'}
                                onChange={e => setFilters({ ...filters, supplier: e.target.value })}
                            >
                                <option value="all">Tutti i fornitori</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Filtro tipo AC/DC */}
                        <div>
                            <label className="text-xs text-muted block mb-1">⚡ Tipo</label>
                            <select
                                className="input w-full"
                                value={filters.type || 'all'}
                                onChange={e => setFilters({ ...filters, type: e.target.value })}
                            >
                                <option value="all">AC e DC</option>
                                <option value="AC">Solo AC (Lento)</option>
                                <option value="DC">Solo DC (Fast)</option>
                            </select>
                        </div>
                        
                        {/* Data da */}
                        <div>
                            <label className="text-xs text-muted block mb-1">📅 Dal</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={filters.dateFrom || ''}
                                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                            />
                        </div>
                        
                        {/* Data a */}
                        <div>
                            <label className="text-xs text-muted block mb-1">📅 Al</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={filters.dateTo || ''}
                                onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                            />
                        </div>
                    </div>
                    
                    {/* Filtro Tag */}
                    <div className="mt-4">
                        <label className="text-xs text-muted block mb-2">🏷️ Filtra per Tag</label>
                        <div className="flex flex-wrap gap-2">
                            {commonTags.map(tag => {
                                const isActive = filters.tags?.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            const currentTags = filters.tags || [];
                                            const newTags = isActive
                                                ? currentTags.filter(t => t !== tag)
                                                : [...currentTags, tag];
                                            setFilters({ ...filters, tags: newTags });
                                        }}
                                        className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                                            isActive 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Ordinamento e Reset */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted">Ordina per:</label>
                            <select
                                className="input py-1 px-2 text-sm"
                                value={filters.sortBy || 'date'}
                                onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
                            >
                                <option value="date">Data</option>
                                <option value="cost">Costo</option>
                                <option value="kwh">kWh</option>
                                <option value="efficiency">Efficienza</option>
                            </select>
                            <button
                                onClick={() => setFilters({ 
                                    ...filters, 
                                    sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' 
                                })}
                                className="btn btn-secondary py-1 px-3 text-sm"
                                title={filters.sortOrder === 'desc' ? 'Decrescente' : 'Crescente'}
                            >
                                {filters.sortOrder === 'desc' ? '⬇️ Desc' : '⬆️ Asc'}
                            </button>
                        </div>
                        
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={onClearFilters}
                                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <span>🗑️</span>
                                <span>Cancella filtri ({activeFiltersCount})</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// TAG BADGE - Badge per mostrare tag nelle ricariche
// ============================================================
/**
 * Mostra i tag di una ricarica come badge colorati.
 * 
 * @param {Object} props - Props del componente
 * @param {string} props.tags - Stringa tag separati da virgola
 * @returns {JSX.Element|null} Badge tag o null
 */
function TagBadges({ tags }) {
    if (!tags || tags.trim() === '') return null;
    
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagList.length === 0) return null;
    
    // Colori per tag diversi
    const getTagColor = (tag) => {
        const colors = {
            '#lavoro': 'bg-purple-500/30 text-purple-300',
            '#viaggio': 'bg-blue-500/30 text-blue-300',
            '#notturna': 'bg-indigo-500/30 text-indigo-300',
            '#urgente': 'bg-red-500/30 text-red-300',
            '#economica': 'bg-green-500/30 text-green-300',
            '#lunga': 'bg-orange-500/30 text-orange-300'
        };
        return colors[tag.toLowerCase()] || 'bg-slate-500/30 text-slate-300';
    };
    
    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {tagList.map((tag, idx) => (
                <span
                    key={idx}
                    className={`text-[10px] px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
                >
                    {tag}
                </span>
            ))}
        </div>
    );
}

// ============================================================
// LISTA RICARICHE - Raggruppate per Mese
// ============================================================
/**
 * Lista delle ricariche raggruppate per anno/mese con espansione.
 * 
 * FUNZIONALITÀ:
 * - Raggruppamento automatico per mese
 * - Espandi/comprimi singolo mese
 * - Pulsanti "Espandi tutto" / "Comprimi tutto"
 * - Calcolo differenza vs costo standard
 * - Badge potenza media ricarica
 * - Note opzionali
 * - Pulsanti modifica ed elimina (hover)
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.charges - Array ricariche completate
 * @param {Function} props.onEdit - Callback modifica (charge) => void
 * @param {Function} props.onDelete - Callback eliminazione (id) => void
 * @returns {JSX.Element} Lista raggruppata o messaggio vuoto
 */
function ChargeList({ charges, onEdit, onDelete }) {
    // HOOKS (DEVONO ESSERE PRIMA DI TUTTO)
    const [expandedMonths, setExpandedMonths] = React.useState({});

    // Raggruppamento per mese
    const groupedCharges = React.useMemo(() => {
        if (!charges || charges.length === 0) return [];

        const groups = {};

        charges.forEach(charge => {
            const date = new Date(charge.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = `${year}-${month}`;

            if (!groups[key]) {
                groups[key] = {
                    year,
                    month,
                    monthName: date.toLocaleDateString('it-IT', { month: 'long' }),
                    charges: [],
                    totalCost: 0,
                    totalKwh: 0,
                    count: 0
                };
            }

            groups[key].charges.push(charge);
            groups[key].totalCost += parseFloat(charge.cost) || 0;
            groups[key].totalKwh += parseFloat(charge.kwh_added) || 0;
            groups[key].count++;
        });

        return Object.entries(groups)
            .sort((a, b) => {
                const [yearA, monthA] = a[0].split('-').map(Number);
                const [yearB, monthB] = b[0].split('-').map(Number);
                if (yearA !== yearB) return yearB - yearA;
                return monthB - monthA;
            })
            .map(([key, data]) => ({ key, ...data }));
    }, [charges]);

    // Auto-espansione mese più recente
    React.useEffect(() => {
        if (groupedCharges.length > 0 && Object.keys(expandedMonths).length === 0) {
            setExpandedMonths({ [groupedCharges[0].key]: true });
        }
    }, [groupedCharges]);

    // Guard clause
    if (!charges || charges.length === 0) {
        return (
            <div className="p-8 text-center card">
                <div className="text-5xl mb-4 opacity-30">⚡</div>
                <p className="text-muted">Nessuna ricarica registrata.</p>
            </div>
        );
    }

    const toggleMonth = (key) => {
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        const allExpanded = {};
        groupedCharges.forEach(g => allExpanded[g.key] = true);
        setExpandedMonths(allExpanded);
    };

    const collapseAll = () => {
        setExpandedMonths({});
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <button onClick={expandAll} className="text-xs px-3 py-1.5 rounded-lg bg-card-soft hover:bg-card border border-card-border text-muted hover:text-accent transition-all">📂 Espandi tutto</button>
                <button onClick={collapseAll} className="text-xs px-3 py-1.5 rounded-lg bg-card-soft hover:bg-card border border-card-border text-muted hover:text-accent transition-all">📁 Comprimi tutto</button>
            </div>

            {groupedCharges.map(group => {
                const isExpanded = expandedMonths[group.key];

                return (
                    <div key={group.key} className="card overflow-hidden">
                        <button onClick={() => toggleMonth(group.key)} className="w-full p-4 flex items-center justify-between hover:bg-card-soft transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`text-2xl transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white capitalize">{group.monthName} {group.year}</h3>
                                    <p className="text-xs text-muted">{group.count} ricarich{group.count === 1 ? 'a' : 'e'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mr-2">
                                <div className="text-right">
                                    <div className="text-xs text-muted">Totale kWh</div>
                                    <div className="font-bold text-kwh">{group.totalKwh.toFixed(1)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted">Totale Speso</div>
                                    <div className="font-bold text-saving text-lg">€{group.totalCost.toFixed(2)}</div>
                                </div>
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="divide-y divide-card-border animate-fade-in">
                                {group.charges.map(charge => {
                                    const power = calculateAveragePower(charge.kwh_added, charge.date, charge.end_date);
                                    const supplierName = charge.supplier_name || "";
                                    const lowerName = supplierName.toLowerCase();
                                    const isHomeOrSolar = lowerName.includes('casa') || lowerName.includes('solar') || lowerName.includes('fotovoltaico');

                                    // Calcolo differenza vs standard
                                    let diffBlock = null;
                                    const standardCost = parseFloat(charge.standard_cost_snapshot || 0);

                                    if (!isHomeOrSolar && standardCost > 0) {
                                        const actualCost = parseFloat(charge.cost || 0);
                                        const kwhAdded = parseFloat(charge.kwh_added || 0);
                                        const wouldBeCost = kwhAdded * standardCost;
                                        const difference = actualCost - wouldBeCost;

                                        if (Math.abs(difference) > 0.05) {
                                            const isSaving = difference < 0;
                                            const diffAbs = Math.abs(difference).toFixed(2);
                                            const percent = ((difference / wouldBeCost) * 100).toFixed(1);
                                            
                                            diffBlock = (
                                                <div className={`mt-3 p-3 rounded-lg border-2 transition-all ${isSaving ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">{isSaving ? '💰' : '⚠️'}</span>
                                                            <div>
                                                                <div className="text-xs text-muted font-medium">vs Costo Standard (€{standardCost.toFixed(3)}/kWh)</div>
                                                                <div className={`text-sm font-bold ${isSaving ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {isSaving ? 'Risparmiato' : 'Pagato in più'}: <span className="text-lg ml-1">{isSaving ? '-' : '+'}€{diffAbs}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-muted">Sarebbe stato</div>
                                                            <div className="text-sm font-mono font-semibold text-slate-300">€{wouldBeCost.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${isSaving ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`} style={{ width: `${Math.min(Math.abs((difference / wouldBeCost) * 100), 100)}%` }} />
                                                    </div>
                                                    <div className="text-xs text-muted mt-1 text-center">{percent}% {isSaving ? ' di sconto' : ' in più'}</div>
                                                </div>
                                            );
                                        }
                                    }
                                    
                                    return (
                                        <div key={charge.id} className="p-4 hover:bg-card-soft transition-all duration-200 group relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 group-hover:scale-110
                                                        ${charge.supplier_type === 'DC' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'}`}>
                                                        {charge.supplier_type}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-base text-white mb-0.5">{charge.supplier_name}</div>
                                                        <div className="text-xs text-muted flex items-center gap-1">
                                                            📅 {new Date(charge.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* PULSANTI AZIONE */}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <button 
                                                        onClick={() => onEdit(charge)} 
                                                        className="p-2 text-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title="Modifica ricarica"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => onDelete(charge.id)} 
                                                        className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Elimina ricarica"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-kwh transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">⚡ kWh</div>
                                                    <div className="font-bold text-lg text-kwh">{parseFloat(charge.kwh_added).toFixed(1)}</div>
                                                </div>
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-saving transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">💰 Costo</div>
                                                    <div className="font-bold text-lg text-saving">€{parseFloat(charge.cost).toFixed(2)}</div>
                                                </div>
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-km transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">🛣️ Km</div>
                                                    <div className="font-bold text-lg text-km">{charge.km_since_last ? parseFloat(charge.km_since_last).toFixed(0) : "-"}</div>
                                                </div>
                                                <div className="bg-card-soft p-3 rounded-lg text-center border border-card-border hover:border-orange-400 transition-colors">
                                                    <div className="text-xs text-muted mb-1 flex items-center justify-center gap-1">⚙️ Velocità</div>
                                                    <div className="font-bold text-lg text-orange-300">{power ? power + " kW" : "-"}</div>
                                                </div>
                                            </div>

                                            {diffBlock}

                                            {/* TAG */}
                                            <TagBadges tags={charge.tags} />

                                            {charge.notes && charge.notes.trim() !== "" && (
                                                <div className="mt-3 text-xs text-muted/80 italic bg-black/10 p-2 rounded border border-white/5 flex gap-2 items-start">
                                                    <span>📝</span>
                                                    <span>{charge.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================
// VISTA IMPOSTAZIONI
// ============================================================
/**
 * Vista completa delle impostazioni dell'applicazione.
 * 
 * IMPOSTAZIONI GLOBALI:
 * - Prezzi carburanti (benzina, diesel)
 * - Consumi medi auto combustione
 * - Costi energia (casa, fotovoltaico)
 * 
 * IMPOSTAZIONI PER VEICOLO (in EditVehicleModal):
 * - Tema grafico
 * - Badge & Fun Stats
 * - Budget mensile
 * 
 * @param {Object} props - Props del componente
 * @param {Function} props.onDeleteSupplier - Callback elimina fornitore
 * @param {number} [props.activeVehicleId] - ID veicolo attivo per filtro fornitori
 * @returns {JSX.Element} Vista impostazioni
 */
function SettingsView({ settings, setSettings, saveSettings, vehicles, onAddVehicle, onEditVehicle, onDeleteVehicle, suppliers, onAddSupplier, onEditSupplier, onDeleteSupplier, activeVehicleId }) {
    // Filtra fornitori: comuni + esclusivi per il veicolo attivo
    const filteredSuppliers = suppliers.filter(s => 
        !s.vehicle_id || s.vehicle_id === activeVehicleId
    );
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <div className="card">
                <h2 className="text-xl font-bold text-saving mb-4">⚙️ Impostazioni Globali</h2>
                
                <p className="text-xs text-muted mb-4">
                    I prezzi carburanti e i consumi sono usati per calcolare il risparmio rispetto alle auto a combustione.
                    Le impostazioni personali (tema, budget) si trovano in ogni singola auto.
                </p>

                <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">⛽ Benzina (€/L)</label>
                            <input type="number" step="0.01" className="input" value={settings.gasolinePrice} onChange={e => setSettings({ ...settings, gasolinePrice: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">🚗 Consumo (km/L)</label>
                            <input type="number" step="0.1" className="input" value={settings.gasolineConsumption} onChange={e => setSettings({ ...settings, gasolineConsumption: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">⛽ Diesel (€/L)</label>
                            <input type="number" step="0.01" className="input" value={settings.dieselPrice} onChange={e => setSettings({ ...settings, dieselPrice: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">🚗 Consumo (km/L)</label>
                            <input type="number" step="0.1" className="input" value={settings.dieselConsumption} onChange={e => setSettings({ ...settings, dieselConsumption: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">⚡ Costo Energia Casa (€/kWh)</label>
                        <input type="number" step="0.001" className="input" value={settings.homeElectricityPrice} onChange={e => setSettings({ ...settings, homeElectricityPrice: e.target.value })} />
                    </div>
                    <div>
                        <label className="label">☀️ Fotovoltaico (€/kWh)</label>
                        <input type="number" step="0.001" className="input" value={settings.solarElectricityPrice || 0} onChange={e => setSettings({ ...settings, solarElectricityPrice: parseFloat(e.target.value) || 0 })} />
                        <p className="text-xs text-muted mt-1">Costo simbolico pannelli solari (€0.00 se totalmente gratuito)</p>
                    </div>
                </div>

                <button onClick={saveSettings} className="btn btn-primary mt-6 w-full">💾 Salva Impostazioni</button>
            </div>

            <div className="space-y-6">
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-km">🚘 Le tue Auto</h2>
                        <button onClick={onAddVehicle} className="btn btn-secondary px-2 py-1 text-sm">➕ Aggiungi</button>
                    </div>
                    <div className="space-y-2">
                        {vehicles.map(v => {
                            // Theme label mapping
                            const themeLabels = {
                                'theme-auto': '🌓 Auto',
                                'theme-default': '✨ Default',
                                'theme-dark': '🌙 Dark',
                                'theme-light': '☀️ Light',
                                'theme-emerald': '💎 Emerald',
                                'theme-neon': '🔮 Neon',
                                'theme-nord': '❄️ Nord',
                                'theme-cyber': '🤖 Cyber',
                                'theme-sunset': '🌅 Sunset'
                            };
                            const themeLabel = themeLabels[v.theme] || '✨ Default';
                            const hasBudget = v.monthly_budget && parseFloat(v.monthly_budget) > 0;
                            const showFunStats = v.show_fun_stats !== false;
                            
                            return (
                                <div key={v.id} className="card-soft p-3 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">🚗</div>
                                            <div>
                                                <div className="font-bold">{v.name}</div>
                                                <div className="text-xs text-muted">{v.brand} · {v.capacity_kwh} kWh</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => onEditVehicle(v)} className="p-2 text-muted hover:text-accent hover:bg-emerald-500/10 rounded-lg transition-all" title="Modifica Auto">✏️</button>
                                            <button onClick={() => onDeleteVehicle(v)} className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Elimina Auto">🗑️</button>
                                        </div>
                                    </div>
                                    {/* Impostazioni per-veicolo */}
                                    <div className="mt-3 pt-3 border-t border-card-border flex flex-wrap gap-2">
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-300" title="Tema grafico">
                                            🎨 {themeLabel}
                                        </span>
                                        <span className={`text-[10px] px-2 py-1 rounded-full ${showFunStats ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-400'}`} title="Badge e Fun Stats">
                                            {showFunStats ? '🏆 Badge ON' : '🏆 Badge OFF'}
                                        </span>
                                        {hasBudget && (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300" title="Budget mensile">
                                                💰 €{parseFloat(v.monthly_budget).toFixed(0)}/mese
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-saving">🏪 Fornitori</h2>
                        <button onClick={onAddSupplier} className="btn btn-secondary px-2 py-1 text-sm">➕ Aggiungi</button>
                    </div>
                    <p className="text-xs text-muted mb-3">
                        {activeVehicleId ? "Mostrati: comuni + esclusivi per l'auto selezionata" : "Tutti i fornitori"}
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {filteredSuppliers.map(s => {
                            const exclusiveVehicle = s.vehicle_id ? vehicles.find(v => v.id === s.vehicle_id) : null;
                            return (
                                <div key={s.id} className={`card-soft p-3 hover:bg-card transition-colors flex justify-between items-center ${s.is_favorite ? 'border border-yellow-500/30 bg-yellow-500/5' : ''}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {s.is_favorite && <span className="text-lg" title="Preferito">⭐</span>}
                                            <span className="font-semibold">{s.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'DC' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{s.type}</span>
                                            {exclusiveVehicle && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300" title={`Esclusivo per ${exclusiveVehicle.name}`}>
                                                    🔒 {exclusiveVehicle.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted flex gap-2">
                                            <span>€{parseFloat(s.standard_cost).toFixed(3)}/kWh</span>
                                            {s.sort_order !== 9 && <span className="text-text opacity-50">• Ordine: {s.sort_order}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onEditSupplier(s)} className="p-2 text-muted hover:text-accent hover:bg-emerald-500/10 rounded-lg transition-all" title="Modifica Fornitore">✏️</button>
                                        <button onClick={() => onDeleteSupplier(s)} className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Elimina Fornitore">🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// SEZIONE GRAFICI
// ============================================================
function ChartSection({ charges, options, setOptions, theme }) {
    if (!charges || charges.length < 2) return <div className="text-center p-10 text-muted">Servono almeno 2 ricariche per i grafici.</div>;

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap gap-2 mb-6 text-xs justify-center">
                <button className={`toggle-btn ${options.showCost ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showCost: !o.showCost }))}>💵 Costo</button>
                <button className={`toggle-btn ${options.showKwh ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showKwh: !o.showKwh }))}>⚡ kWh</button>
                <button className={`toggle-btn ${options.showConsumption ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showConsumption: !o.showConsumption }))}>🚗 Consumo</button>
                <button className={`toggle-btn ${options.showTrend ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showTrend: !o.showTrend }))}>📈 Trend</button>
                <button className={`toggle-btn ${options.showACDC ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showACDC: !o.showACDC }))}>⚡ AC/DC</button>
                <button className={`toggle-btn ${options.showSuppliers ? "active" : ""}`} onClick={() => setOptions(o => ({ ...o, showSuppliers: !o.showSuppliers }))}>🏪 Fornitori</button>
            </div>
            {options.showCost && <CostChart charges={charges} theme={theme} />}
            {options.showKwh && <KwhChart charges={charges} theme={theme} />}
            {options.showConsumption && <ConsumptionChart charges={charges} theme={theme} />}
            {options.showTrend && <CostTrendChart charges={charges} theme={theme} />}
            {options.showACDC && <ACvsDCChart charges={charges} theme={theme} />}
            {options.showSuppliers && <SuppliersPieChart charges={charges} theme={theme} />}
        </div>
    );
}

// ============================================================
// BOX RICARICA ATTIVA
// ============================================================
function ActiveChargingBox({ activeSession, onStopClick, onCancelClick }) {
    const [elapsedTime, setElapsedTime] = React.useState('');

    React.useEffect(() => {
        const updateTimer = () => {
            let start = new Date(activeSession.date);
            if (isNaN(start.getTime())) start = new Date(activeSession.date.replace(' ', 'T'));
            const now = new Date();
            const diff = Math.floor((now - start) / 1000);
            const safeDiff = Math.max(0, diff);
            const hours = Math.floor(safeDiff / 3600);
            const minutes = Math.floor((safeDiff % 3600) / 60);
            const seconds = safeDiff % 60;
            setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    return (
        <div className="relative bg-gradient-to-br from-emerald-900/50 via-green-900/40 to-cyan-900/50 border-2 border-emerald-400/60 rounded-3xl p-8 mb-8 text-center overflow-hidden animate-pulse-glow animate-scale-in">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)] animate-pulse"></div>
            <div className="relative z-10">
                <div className="inline-block mb-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-4xl shadow-2xl animate-pulse">⚡</div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Ricarica in Corso</h2>
                <div className="inline-block bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4">
                    <div className="text-emerald-300 text-sm font-medium mb-1">Tempo trascorso</div>
                    <div className="text-4xl font-mono font-bold text-white tabular-nums tracking-wider">{elapsedTime}</div>
                </div>
                <div className="flex justify-center gap-6 mb-6 flex-wrap">
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-xs text-emerald-300/80 mb-1">Inizio</div>
                        <div className="text-sm font-bold text-white">{new Date(activeSession.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-xs text-emerald-300/80 mb-1">Batteria iniziale</div>
                        <div className="text-sm font-bold text-white">{activeSession.battery_start}%</div>
                    </div>
                </div>
                <div className="mb-6 max-w-md mx-auto">
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 rounded-full animate-pulse" style={{ width: `${Math.min(activeSession.battery_start + 10, 100)}%` }}></div>
                    </div>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                    <button onClick={onStopClick} className="btn bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg px-8 py-3 shadow-2xl border-2 border-red-400/30">
                        <span className="flex items-center gap-2"><span>⏹</span><span>Termina Ricarica</span></span>
                    </button>
                    <button onClick={onCancelClick} className="btn bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm px-6 py-3 shadow-lg border border-gray-500/50">
                        <span className="flex items-center gap-2"><span>❌</span><span>Annulla</span></span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// FUN STATS & BADGES
// ============================================================
function FunStats({ stats, charges }) {
    if (!stats || !charges) return null;

    const badges = [];
    const totalKm = parseFloat(stats.kmDriven);
    const solarCharges = charges.filter(c => c.supplier_name && (c.supplier_name.toLowerCase().includes('fotovoltaico') || c.supplier_name.toLowerCase().includes('solar'))).length;
    const avgCost = parseFloat(stats.avgCostPerKwh);

    badges.push({ icon: "👋", title: "Benvenuto", desc: "Inizia il viaggio!" });
    if (totalKm > 100) badges.push({ icon: "🥉", title: "Viaggiatore", desc: "Primi 100 km andati!" });
    if (totalKm > 1000) badges.push({ icon: "🥈", title: "Esploratore", desc: "Oltre 1.000 km!" });
    if (totalKm > 10000) badges.push({ icon: "🏎️", title: "Maratoneta", desc: "Giro del mondo?" });
    if (solarCharges > 0) badges.push({ icon: "☀️", title: "Green", desc: "Prima ricarica solare" });
    if (solarCharges > 10) badges.push({ icon: "😎", title: "Re del Sole", desc: "Sfrutti l'energia pulita" });
    if (avgCost < 0.20 && totalKm > 50) badges.push({ icon: "🦊", title: "Volpe", desc: "Spendaccione? No!" });
    if (charges.length >= 1) badges.push({ icon: "🔋", title: "Start", desc: "Prima ricarica fatta" });
    if (charges.length > 20) badges.push({ icon: "🔌", title: "Veterano", desc: "Più di 20 ricariche" });

    const savings = parseFloat(stats.gasolineSavings);
    const pizzaPrice = 8.50;
    const coffeePrice = 1.20;
    const netflixPrice = 13.00;
    const pizzas = Math.floor(savings / pizzaPrice);
    const coffees = Math.floor(savings / coffeePrice);
    const monthsNetflix = (savings / netflixPrice).toFixed(1);
    const showPizza = savings > 0;

    return (
        <div className="space-y-6 animate-fade-in mb-8">
            {badges.length > 0 && (
                <div className="overflow-x-auto pb-2">
                    <h3 className="text-sm font-bold text-muted mb-3 uppercase tracking-wider sticky left-0">🏆 I tuoi Traguardi</h3>
                    <div className="flex gap-4">
                        {badges.map((b, idx) => (
                            <div key={idx} className="min-w-[130px] card-soft p-3 rounded-xl border border-card-border text-center flex flex-col items-center justify-center shadow-lg transform transition active:scale-95" style={{ backgroundColor: 'var(--card)' }}>
                                <div className="text-3xl mb-2">{b.icon}</div>
                                <div className="font-bold text-xs mb-1 truncate w-full" style={{ color: 'var(--accent)' }}>{b.title}</div>
                                <div className="text-[10px] text-muted leading-tight">{b.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showPizza && (
                <div className="card relative overflow-hidden border-2" style={{ borderColor: 'var(--card-border)', borderTopColor: 'var(--accent)' }}>
                    <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(to right, var(--accent), transparent)` }}></div>
                    <div className="relative z-10">
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 rotate-12 grayscale">🍕</div>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--accent-2)' }}>
                            <span className="text-2xl">😎</span> Risparmio reale: {parseFloat(stats.gasolineSavings).toFixed(0)}€
                        </h3>
                        <p className="text-xs text-muted mb-4">Equivalgono a circa:</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-card-soft p-2 rounded-xl text-center backdrop-blur-sm border border-card-border">
                                <div className="text-xl mb-1">🍕</div>
                                <div className="text-lg font-bold text-primary">{pizzas}</div>
                                <div className="text-[10px] text-muted uppercase">Pizze</div>
                            </div>
                            <div className="bg-card-soft p-2 rounded-xl text-center backdrop-blur-sm border border-card-border">
                                <div className="text-xl mb-1">☕</div>
                                <div className="text-lg font-bold text-primary">{coffees}</div>
                                <div className="text-[10px] text-muted uppercase">Caffè</div>
                            </div>
                            <div className="bg-card-soft p-2 rounded-xl text-center backdrop-blur-sm border border-card-border">
                                <div className="text-xl mb-1">📺</div>
                                <div className="text-lg font-bold text-primary">{monthsNetflix}</div>
                                <div className="text-[10px] text-muted uppercase">Mesi TV</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
