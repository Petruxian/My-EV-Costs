/**
 * ============================================================
 * CHARTS.JS - Componenti Grafici per EV Cost Tracker
 * ============================================================
 * 
 * Questo file contiene tutti i componenti per la visualizzazione
 * dei grafici nell'applicazione EV Cost Tracker. Utilizza Chart.js
 * per renderizzare grafici interattivi e responsive.
 * 
 * COMPONENTI INCLUSI:
 * -------------------
 * 1. smartAggregate()        - Helper aggregazione intelligente dati
 * 2. MonthlyOverviewChart    - Grafico panoramica mensile/giornaliera
 * 3. ConsumptionTrendChart   - Grafico trend efficienza
 * 4. SuppliersPieChart       - Grafico distribuzione fornitori
 * 5. ChartSection            - Container principale grafici
 * 
 * TIPI DI GRAFICI:
 * ----------------
 * - Bar + Line combinati per panoramica
 * - Line con area fill per trend consumi
 * - Doughnut per distribuzione fornitori
 * 
 * RESPONSIVE DESIGN:
 * ------------------
 * - Layout flexbox per adattamento mobile
 * - Altezze minime garantite per titoli
 * - Limitazione tick asse X per evitare sovrapposizioni
 * 
 * TEMI DINAMICI:
 * --------------
 * I colori vengono letti dalle variabili CSS del tema corrente:
 * - --accent: Colore principale
 * - --text-muted: Colore testo secondario
 * - --card: Colore sfondo card
 * 
 * DIPENDENZE:
 * -----------
 * - Chart.js 4.x (CDN)
 * - React 18 (UMD)
 * - CSS variables dal tema attivo
 * 
 * @author EV Cost Tracker Team
 * @version 2.3 - Flexbox Layout Fix
 * ============================================================
 */

/* ============================================================
   HELPER: AGGREGAZIONE INTELLIGENTE DATI
   ============================================================ */
/**
 * Aggrega i dati delle ricariche in gruppi temporali intelligenti.
 * 
 * LOGICA:
 * - Se l'intervallo è < 35 giorni → raggruppa per GIORNO
 * - Se l'intervallo è >= 35 giorni → raggruppa per MESE
 * 
 * Questo evita grafici troppo fitti con troppi punti dati
 * e garantisce una visualizzazione ottimale.
 * 
 * @param {Array} charges - Array ricariche da aggregare
 * @returns {Object} Oggetto con labels, costs, kwhs, mode
 * 
 * @example
 * const { labels, costs, kwhs, mode } = smartAggregate(charges);
 * // mode: 'day' | 'month'
 * // labels: ['15 Gen', '16 Gen', ...] o ['Gen 24', 'Feb 24', ...]
 * // costs: [12.50, 8.30, ...]
 * // kwhs: [45, 30, ...]
 */
function smartAggregate(charges) {
    // Validazione input
    if (!charges || charges.length === 0) {
        return { labels: [], costs: [], kwhs: [], mode: 'month' };
    }

    // Ordina per data crescente
    const sorted = [...charges].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calcola intervallo temporale
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determina modalità aggregazione
    const mode = diffDays < 35 ? 'day' : 'month';
    const groups = {};

    // Raggruppa dati
    sorted.forEach(c => {
        const d = new Date(c.date);
        let key, label;

        if (mode === 'day') {
            // Raggruppamento giornaliero
            key = d.toISOString().split('T')[0];
            label = d.toLocaleDateString("it-IT", { day: '2-digit', month: 'short' });
        } else {
            // Raggruppamento mensile
            key = `${d.getFullYear()}-${d.getMonth()}`;
            label = d.toLocaleDateString("it-IT", { month: 'short', year: '2-digit' });
        }

        // Inizializza gruppo se non esiste
        if (!groups[key]) {
            groups[key] = { label: label, cost: 0, kwh: 0 };
        }

        // Accumula valori
        groups[key].cost += parseFloat(c.cost) || 0;
        groups[key].kwh += parseFloat(c.kwh_added) || 0;
    });

    // Converti in array ordinato
    const values = Object.values(groups);
    
    return {
        labels: values.map(v => v.label),
        costs: values.map(v => v.cost),
        kwhs: values.map(v => v.kwh),
        mode: mode
    };
}

/* ============================================================
   GRAFICO 1: PANORAMICA SMART (Bar + Line)
   ============================================================ */
/**
 * Grafico combinato barre + linea per panoramica consumi.
 * 
 * VISUALIZZAZIONE:
 * - Barre: kWh per periodo (asse Y sinistro)
 * - Linea: Spesa € per periodo (asse Y destro)
 * 
 * Adatta automaticamente la visualizzazione giorno/mese
 * in base all'intervallo temporale dei dati.
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.charges - Array ricariche
 * @param {string} props.theme - Tema corrente (per refresh colori)
 * @returns {JSX.Element} Card con grafico
 */
function MonthlyOverviewChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);
    const [viewMode, setViewMode] = React.useState('month');

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        // Ottieni colori dal tema CSS corrente
        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        
        // Distruggi grafico precedente se esiste
        if (chartRef.current) chartRef.current.destroy();

        // Aggrega dati
        const { labels, costs, kwhs, mode } = smartAggregate(charges);
        setViewMode(mode);

        // Crea grafico
        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        // Dataset 1: Spesa (linea)
                        label: "Spesa (€)",
                        data: costs,
                        type: "line",
                        borderColor: styles.getPropertyValue("--accent"),
                        backgroundColor: styles.getPropertyValue("--accent"),
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: styles.getPropertyValue("--bg"),
                        pointBorderWidth: 2,
                        tension: 0.3,
                        yAxisID: 'y1',
                        order: 1
                    },
                    {
                        // Dataset 2: kWh (barre)
                        label: "kWh",
                        data: kwhs,
                        backgroundColor: "rgba(59, 130, 246, 0.4)",
                        borderColor: "rgba(59, 130, 246, 0.8)",
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y',
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            boxWidth: 10, 
                            padding: 10 
                        } 
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    if (context.datasetIndex === 0) {
                                        label += "€" + context.parsed.y.toFixed(2);
                                    } else {
                                        label += context.parsed.y.toFixed(1) + ' kWh';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            maxTicksLimit: 8 
                        } 
                    },
                    y: { display: false },      // Asse kWh (nascosto)
                    y1: { display: false }      // Asse € (nascosto)
                }
            }
        });

        // Cleanup
        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card flex flex-col h-[350px]">
            {/* Titolo */}
            <h3 className="chart-title text-center mb-2 shrink-0">
                {viewMode === 'day' ? '📅 Andamento Giornaliero' : '📅 Andamento Mensile'}
            </h3>
            {/* Container Canvas */}
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 2: TREND CONSUMI (Line con Area)
   ============================================================ */
/**
 * Grafico linea con area per trend efficienza.
 * 
 * VISUALIZZAZIONE:
 * - Linea con gradiente sotto
 * - Mostra ultime 10 ricariche con consumo valido
 * - kWh/100km per visualizzare efficienza
 * 
 * FILTRO DATI:
 * - Solo ricariche con consumo > 0 e < 40 kWh/100km
 * - Limitato a 10 punti per leggibilità
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.charges - Array ricariche
 * @param {string} props.theme - Tema corrente
 * @returns {JSX.Element} Card con grafico
 */
function ConsumptionTrendChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        // Filtra ricariche con consumo valido
        const validCharges = charges
            .filter(c => c.consumption && c.consumption > 0 && c.consumption < 40)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-10);  // Ultime 10

        // Prepara dati
        const labels = validCharges.map(c => 
            new Date(c.date).toLocaleDateString("it-IT", { day: '2-digit', month: 'short' })
        );
        const dataPoints = validCharges.map(c => parseFloat(c.consumption));

        // Crea gradiente verticale
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, styles.getPropertyValue("--accent").replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, styles.getPropertyValue("--accent").replace(')', ', 0.0)').replace('rgb', 'rgba'));

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "kWh/100km",
                    data: dataPoints,
                    borderColor: styles.getPropertyValue("--accent"),
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        intersect: false,
                        callbacks: { 
                            label: (ctx) => `${ctx.parsed.y.toFixed(1)} kWh/100km` 
                        }
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { 
                            color: styles.getPropertyValue("--text-muted"), 
                            font: { size: 10 } 
                        } 
                    },
                    y: { display: false }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card flex flex-col h-[320px]">
            <h3 className="chart-title text-center mb-2 shrink-0 px-2">
                ⚡ Efficienza (Ultime 10 ricariche)
            </h3>
            <div className="relative flex-1 w-full min-h-0">
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
}

/* ============================================================
   GRAFICO 3: DISTRIBUZIONE FORNITORI (Doughnut)
   ============================================================ */
/**
 * Grafico a ciambella per distribuzione costi per fornitore.
 * 
 * VISUALIZZAZIONE:
 * - Doughnut con buco centrale
 * - Mostra totale speso al centro
 * - Top 4 fornitori + "Altri" aggregati
 * - Legenda in basso
 * 
 * AGGREGAZIONE:
 * - Raggruppa per fornitore
 * - Ordina per spesa decrescente
 * - Limita a top 4 + altri
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.charges - Array ricariche
 * @param {string} props.theme - Tema corrente
 * @returns {JSX.Element} Card con grafico
 */
function SuppliersPieChart({ charges, theme }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    // Calcola totale speso
    const totalCost = React.useMemo(() => {
        return charges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    }, [charges]);

    React.useEffect(() => {
        if (!charges || charges.length === 0) return;

        const styles = getComputedStyle(document.body);
        const ctx = canvasRef.current.getContext("2d");
        if (chartRef.current) chartRef.current.destroy();

        // Aggrega per fornitore
        const supplierData = {};
        
        charges.forEach(c => {
            const name = c.supplier_name || "Sconosciuto";
            if (!supplierData[name]) supplierData[name] = 0;
            supplierData[name] += parseFloat(c.cost) || 0;
        });

        // Ordina per spesa decrescente
        const sortedSuppliers = Object.entries(supplierData).sort((a, b) => b[1] - a[1]);
        
        const labels = [];
        const data = [];
        
        // Prendi top 4 + aggrega altri
        sortedSuppliers.forEach(([name, cost], index) => {
            if (index < 4) {
                labels.push(name);
                data.push(cost);
            } else if (index === 4) {
                labels.push("Altri");
                data.push(cost);
            } else {
                data[4] += cost;
            }
        });

        // Colori per fette
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#64748b'];

        chartRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: data.map(d => d.toFixed(2)),
                    backgroundColor: colors,
                    borderColor: styles.getPropertyValue("--card"),
                    borderWidth: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',  // Dimensione buco centrale
                layout: {
                    padding: { bottom: 10 }  // Spazio per legenda
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: styles.getPropertyValue("--text-muted"),
                            boxWidth: 12,
                            padding: 15,
                            font: { size: 11 },
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [charges, theme]);

    return (
        <div className="chart-card flex flex-col h-[420px]">
            <h3 className="chart-title text-center mb-2 shrink-0">
                💸 Top Fornitori
            </h3>
            <div className="relative flex-1 w-full min-h-0 flex items-center justify-center">
                <canvas ref={canvasRef}></canvas>
                {/* Totale al centro */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <div className="text-xs text-muted">Totale</div>
                    <div className="text-2xl font-bold text-saving">€{totalCost.toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   CONTAINER PRINCIPALE: SEZIONE GRAFICI
   ============================================================ */
/**
 * Container principale per la sezione grafici.
 * 
 * LAYOUT:
 * - Grafico panoramica (full width)
 * - Grid 2 colonne: Trend + Fornitori
 * 
 * REQUISITI:
 * - Minimo 2 ricariche per mostrare grafici
 * - Altrimenti mostra messaggio informativo
 * 
 * @param {Object} props - Props del componente
 * @param {Array} props.charges - Array ricariche
 * @param {string} props.theme - Tema corrente
 * @returns {JSX.Element} Sezione grafici completa
 */
function ChartSection({ charges, theme }) {
    // Verifica dati minimi
    if (!charges || charges.length < 2) {
        return (
            <div className="text-center p-10 card">
                <div className="text-4xl mb-4">📉</div>
                <div className="text-muted">Servono più dati per generare i grafici.</div>
                <div className="text-xs text-muted opacity-50 mt-2">
                    Inserisci almeno 2 ricariche.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Grafico panoramica */}
            <MonthlyOverviewChart charges={charges} theme={theme} />
            
            {/* Grid 2 colonne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ConsumptionTrendChart charges={charges} theme={theme} />
                <SuppliersPieChart charges={charges} theme={theme} />
            </div>
            
            {/* Footer informativo */}
            <div className="text-center text-xs text-muted opacity-50">
                Grafici ottimizzati per il tuo schermo
            </div>
        </div>
    );
}
