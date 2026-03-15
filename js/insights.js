/**
 * ============================================================
 * INSIGHTS.JS - Insights Intelligenti per EV Cost Tracker
 * ============================================================
 * 
 * Questo file contiene componenti per insights automatici,
 * proiezioni, consigli e analisi intelligenti.
 * 
 * COMPONENTI:
 * -----------
 * 1. InsightsPanel     - Container principale insights
 * 2. ProjectionCard    - Proiezione spese mensili
 * 3. ComparisonCard    - Confronto mese corrente vs precedente
 * 4. RecommendationCard - Consigli AC/DC e ottimizzazione
 * 5. RangePrediction   - Previsione autonomia
 * 6. BestTimeCard      - Miglior orario per ricaricare
 * 
 * @author EV Cost Tracker Team
 * @version 1.0 - Insights Intelligenti
 * ============================================================
 */

/* ============================================================
   HELPER: CALCOLI INSIGHTS
   ============================================================ */

/**
 * Calcola proiezione spese per il mese corrente
 */
function calculateMonthlyProjection(charges, currentMonth, currentYear) {
    const now = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = now.getDate();
    
    // Ricariche del mese corrente
    const monthCharges = charges.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const spentSoFar = monthCharges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    const kwhSoFar = monthCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0);
    
    // Proiezione lineare
    const dailyAverage = spentSoFar / daysPassed;
    const projectedTotal = dailyAverage * daysInMonth;
    const remainingBudget = projectedTotal - spentSoFar;
    
    return {
        spentSoFar,
        kwhSoFar,
        daysPassed,
        daysInMonth,
        dailyAverage,
        projectedTotal,
        remainingBudget,
        chargesCount: monthCharges.length
    };
}

/**
 * Calcola confronto con mese precedente
 */
function calculateMonthComparison(charges, currentMonth, currentYear) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Mese corrente
    const currentMonthCharges = charges.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    // Mese precedente
    const prevMonthCharges = charges.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
    
    const currentSpent = currentMonthCharges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    const prevSpent = prevMonthCharges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    
    const currentKwh = currentMonthCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0);
    const prevKwh = prevMonthCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0);
    
    const spentDiff = currentSpent - prevSpent;
    const spentPercent = prevSpent > 0 ? ((currentSpent - prevSpent) / prevSpent) * 100 : 0;
    
    const kwhDiff = currentKwh - prevKwh;
    const kwhPercent = prevKwh > 0 ? ((currentKwh - prevKwh) / prevKwh) * 100 : 0;
    
    const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    
    return {
        currentMonth: monthNames[currentMonth],
        prevMonth: monthNames[prevMonth],
        currentSpent,
        prevSpent,
        currentKwh,
        prevKwh,
        spentDiff,
        spentPercent,
        kwhDiff,
        kwhPercent,
        currentCount: currentMonthCharges.length,
        prevCount: prevMonthCharges.length
    };
}

/**
 * Genera consigli AC/DC
 */
function generateChargingRecommendations(charges) {
    const recommendations = [];
    
    // Separa ricariche AC e DC
    const acCharges = charges.filter(c => c.supplier_type === 'AC');
    const dcCharges = charges.filter(c => c.supplier_type === 'DC');
    
    const acKwh = acCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0);
    const dcKwh = dcCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0);
    const totalKwh = acKwh + dcKwh;
    
    const acCost = acCharges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    const dcCost = dcCharges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    
    const acCostPerKwh = acKwh > 0 ? acCost / acKwh : 0;
    const dcCostPerKwh = dcKwh > 0 ? dcCost / dcKwh : 0;
    
    // Raccomandazione 1: Uso DC eccessivo
    if (totalKwh > 0) {
        const dcPercent = (dcKwh / totalKwh) * 100;
        
        if (dcPercent > 70 && acCostPerKwh < dcCostPerKwh) {
            const potentialSavings = (dcKwh * 0.3) * (dcCostPerKwh - acCostPerKwh);
            recommendations.push({
                type: 'warning',
                icon: '⚡',
                title: 'Troppe ricariche rapide',
                message: `Usi il ${dcPercent.toFixed(0)}% di ricariche DC. Spostando il 30% su AC potresti risparmiare ~€${potentialSavings.toFixed(0)}/mese.`,
                action: 'Pianifica più ricariche AC a casa'
            });
        }
        
        // Raccomandazione 2: Costo DC alto
        if (dcCostPerKwh > 0.50 && dcCharges.length > 2) {
            recommendations.push({
                type: 'info',
                icon: '💡',
                title: 'Ottimizza costi DC',
                message: `Le tue ricariche DC costano in media €${dcCostPerKwh.toFixed(2)}/kWh. Cerca colonnine più convenienti.`,
                action: 'Confronta i fornitori nelle impostazioni'
            });
        }
    }
    
    // Raccomandazione 3: Casa sotto-utilizzata
    const homeCharges = charges.filter(c => 
        c.supplier_name && c.supplier_name.toLowerCase().includes('casa')
    );
    const homeKwh = homeCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0);
    
    if (totalKwh > 0 && (homeKwh / totalKwh) < 0.3 && homeCharges.length < acCharges.length) {
        recommendations.push({
            type: 'tip',
            icon: '🏠',
            title: 'Sfrutta la ricarica domestica',
            message: 'La ricarica a casa costa meno. Pianifica più ricariche notturne.',
            action: 'Imposta un promemoria serale'
        });
    }
    
    // Se non ci sono raccomandazioni, messaggio positivo
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            icon: '✅',
            title: 'Ottima strategia!',
            message: 'Il tuo mix di ricariche è ben bilanciato. Continua così!',
            action: null
        });
    }
    
    return {
        recommendations,
        stats: {
            acKwh,
            dcKwh,
            acCostPerKwh,
            dcCostPerKwh,
            acPercent: totalKwh > 0 ? (acKwh / totalKwh) * 100 : 0,
            dcPercent: totalKwh > 0 ? (dcKwh / totalKwh) * 100 : 0
        }
    };
}

/**
 * Calcola previsione autonomia
 */
function calculateRangePrediction(charges, vehicleCapacity) {
    if (!charges || charges.length === 0 || !vehicleCapacity) {
        return null;
    }
    
    // Media efficienza ultime 10 ricariche con consumo valido
    const validCharges = charges
        .filter(c => c.consumption && c.consumption > 0 && c.consumption < 50)
        .slice(0, 10);
    
    if (validCharges.length === 0) {
        return null;
    }
    
    const avgConsumption = validCharges.reduce((sum, c) => sum + parseFloat(c.consumption), 0) / validCharges.length;
    
    // Range stimato con 100% batteria
    const fullRange = (vehicleCapacity / avgConsumption) * 100;
    
    // Range tipico 20-80% (ricarica normale)
    const typicalRange = fullRange * 0.6;
    
    // kWh necessari per 100km
    const kwhPer100km = avgConsumption;
    
    return {
        avgConsumption,
        fullRange,
        typicalRange,
        kwhPer100km,
        batteryCapacity: vehicleCapacity,
        dataPoints: validCharges.length
    };
}

/**
 * Analizza orari migliori per ricaricare
 */
function analyzeBestChargingTimes(charges) {
    if (!charges || charges.length === 0) {
        return null;
    }
    
    // Raggruppa per ora del giorno
    const hourlyData = {};
    
    charges.forEach(c => {
        const date = new Date(c.date);
        const hour = date.getHours();
        const kwh = parseFloat(c.kwh_added) || 0;
        const cost = parseFloat(c.cost) || 0;
        
        if (!hourlyData[hour]) {
            hourlyData[hour] = { count: 0, kwh: 0, cost: 0 };
        }
        
        hourlyData[hour].count++;
        hourlyData[hour].kwh += kwh;
        hourlyData[hour].cost += cost;
    });
    
    // Calcola costo medio per kWh per ogni ora
    const hourlyCosts = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        count: data.count,
        avgCostPerKwh: data.kwh > 0 ? data.cost / data.kwh : 0,
        totalKwh: data.kwh
    }));
    
    // Trova orario più economico (con almeno 2 ricariche)
    const validHours = hourlyCosts.filter(h => h.count >= 2);
    
    if (validHours.length === 0) {
        return null;
    }
    
    const cheapestHour = validHours.reduce((min, h) => 
        h.avgCostPerKwh < min.avgCostPerKwh ? h : min
    );
    
    const mostExpensiveHour = validHours.reduce((max, h) => 
        h.avgCostPerKwh > max.avgCostPerKwh ? h : max
    );
    
    // Orario più usato
    const mostUsedHour = hourlyCosts.reduce((max, h) => 
        h.count > max.count ? h : max
    );
    
    return {
        cheapestHour,
        mostExpensiveHour,
        mostUsedHour,
        hourlyData: hourlyCosts
    };
}

/* ============================================================
   COMPONENTI INSIGHTS
   ============================================================ */

/**
 * Card Proiezione Spese
 */
function ProjectionCard({ projection, budget }) {
    if (!projection) return null;
    
    const progressPercent = budget > 0 ? (projection.spentSoFar / budget) * 100 : 
        (projection.daysPassed / projection.daysInMonth) * 100;
    
    const isOverBudget = budget > 0 && projection.spentSoFar > budget;
    const isOverProjection = projection.projectedTotal > budget && budget > 0;
    
    return (
        <div className={`insight-card ${isOverBudget ? 'border-red-500/50' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📈</span>
                <h4 className="font-bold text-accent">Proiezione Mensile</h4>
            </div>
            
            <div className="space-y-3">
                {/* Speso finora */}
                <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">Speso finora</span>
                    <span className="font-bold text-lg">€{projection.spentSoFar.toFixed(2)}</span>
                </div>
                
                {/* Barra progresso */}
                <div className="relative h-2 bg-card-soft rounded-full overflow-hidden">
                    <div 
                        className={`absolute h-full rounded-full transition-all ${
                            isOverBudget ? 'bg-red-500' : 
                            isOverProjection ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                </div>
                
                {/* Proiezione */}
                <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">Proiezione fine mese</span>
                    <span className={`font-bold ${isOverProjection ? 'text-yellow-400' : 'text-saving'}`}>
                        €{projection.projectedTotal.toFixed(2)}
                    </span>
                </div>
                
                {/* Budget warning */}
                {budget > 0 && (
                    <div className={`text-xs p-2 rounded-lg ${isOverProjection ? 'bg-yellow-500/10 text-yellow-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                        {isOverProjection ? (
                            <>⚠️ Budget: €{budget} - Rischi di superarlo di €{(projection.projectedTotal - budget).toFixed(0)}</>
                        ) : (
                            <>✅ Budget: €{budget} - Rimangono €{(budget - projection.spentSoFar).toFixed(0)}</>
                        )}
                    </div>
                )}
                
                {/* Statistiche aggiuntive */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted pt-2 border-t border-card-border">
                    <div>
                        <span className="block text-muted">Giorni passati</span>
                        <span className="font-bold text-text">{projection.daysPassed}/{projection.daysInMonth}</span>
                    </div>
                    <div>
                        <span className="block text-muted">Media giornaliera</span>
                        <span className="font-bold text-text">€{projection.dailyAverage.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Card Confronto Mensile
 */
function ComparisonCard({ comparison }) {
    if (!comparison) return null;
    
    const spentUp = comparison.spentDiff > 0;
    const kwhUp = comparison.kwhDiff > 0;
    
    return (
        <div className="insight-card">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📊</span>
                <h4 className="font-bold text-accent">vs {comparison.prevMonth}</h4>
            </div>
            
            <div className="space-y-4">
                {/* Spesa */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-muted text-sm">Spesa</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">€{comparison.prevSpent.toFixed(0)}</span>
                            <span className="text-lg font-bold">€{comparison.currentSpent.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${spentUp ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span>{spentUp ? '↑' : '↓'}</span>
                        <span>€{Math.abs(comparison.spentDiff).toFixed(0)} ({Math.abs(comparison.spentPercent).toFixed(0)}%)</span>
                    </div>
                </div>
                
                {/* kWh */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-muted text-sm">Energia</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">{comparison.prevKwh.toFixed(0)} kWh</span>
                            <span className="text-lg font-bold">{comparison.currentKwh.toFixed(0)} kWh</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${kwhUp ? 'text-blue-400' : 'text-orange-400'}`}>
                        <span>{kwhUp ? '↑' : '↓'}</span>
                        <span>{Math.abs(comparison.kwhDiff).toFixed(0)} kWh ({Math.abs(comparison.kwhPercent).toFixed(0)}%)</span>
                    </div>
                </div>
                
                {/* Numero ricariche */}
                <div className="pt-2 border-t border-card-border flex justify-between text-sm">
                    <span className="text-muted">Ricariche</span>
                    <span>{comparison.currentCount} vs {comparison.prevCount}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Card Raccomandazioni
 */
function RecommendationCard({ recommendations }) {
    if (!recommendations || recommendations.length === 0) return null;
    
    const typeStyles = {
        warning: 'bg-yellow-500/10 border-yellow-500/30',
        info: 'bg-blue-500/10 border-blue-500/30',
        tip: 'bg-purple-500/10 border-purple-500/30',
        success: 'bg-emerald-500/10 border-emerald-500/30'
    };
    
    const typeIconColors = {
        warning: 'text-yellow-400',
        info: 'text-blue-400',
        tip: 'text-purple-400',
        success: 'text-emerald-400'
    };
    
    return (
        <div className="insight-card">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h4 className="font-bold text-accent">Consigli</h4>
            </div>
            
            <div className="space-y-3">
                {recommendations.recommendations.map((rec, idx) => (
                    <div 
                        key={idx} 
                        className={`p-3 rounded-lg border ${typeStyles[rec.type] || typeStyles.info}`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-xl">{rec.icon}</span>
                            <div className="flex-1">
                                <div className={`font-bold text-sm ${typeIconColors[rec.type]}`}>
                                    {rec.title}
                                </div>
                                <p className="text-xs text-muted mt-1">{rec.message}</p>
                                {rec.action && (
                                    <div className="text-xs text-accent mt-2 cursor-pointer hover:underline">
                                        → {rec.action}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Stats AC/DC */}
            {recommendations.stats && (
                <div className="mt-4 pt-3 border-t border-card-border">
                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                        <div>
                            <div className="flex items-center justify-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-muted">AC</span>
                            </div>
                            <div className="font-bold">{recommendations.stats.acPercent.toFixed(0)}%</div>
                            <div className="text-muted">€{recommendations.stats.acCostPerKwh.toFixed(2)}/kWh</div>
                        </div>
                        <div>
                            <div className="flex items-center justify-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                <span className="text-muted">DC</span>
                            </div>
                            <div className="font-bold">{recommendations.stats.dcPercent.toFixed(0)}%</div>
                            <div className="text-muted">€{recommendations.stats.dcCostPerKwh.toFixed(2)}/kWh</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Card Previsione Autonomia
 */
function RangePredictionCard({ prediction }) {
    if (!prediction) return null;
    
    return (
        <div className="insight-card">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚗</span>
                <h4 className="font-bold text-accent">Autonomia Stimata</h4>
            </div>
            
            <div className="space-y-4">
                {/* Range principale */}
                <div className="text-center">
                    <div className="text-4xl font-bold text-saving">
                        {prediction.fullRange.toFixed(0)}
                    </div>
                    <div className="text-muted text-sm">km con batteria piena</div>
                </div>
                
                {/* Dettagli */}
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                    <div className="bg-card-soft rounded-lg p-2">
                        <div className="font-bold">{prediction.typicalRange.toFixed(0)} km</div>
                        <div className="text-xs text-muted">Range 20→80%</div>
                    </div>
                    <div className="bg-card-soft rounded-lg p-2">
                        <div className="font-bold">{prediction.avgConsumption.toFixed(1)}</div>
                        <div className="text-xs text-muted">kWh/100km</div>
                    </div>
                </div>
                
                {/* Nota */}
                <div className="text-xs text-muted text-center">
                    Basato su {prediction.dataPoints} ricariche • Batteria {prediction.batteryCapacity} kWh
                </div>
            </div>
        </div>
    );
}

/**
 * Card Miglior Orario
 */
function BestTimeCard({ timeAnalysis }) {
    if (!timeAnalysis) return null;
    
    const formatHour = (hour) => `${hour}:00`;
    
    return (
        <div className="insight-card">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🕐</span>
                <h4 className="font-bold text-accent">Orari Ricariche</h4>
            </div>
            
            <div className="space-y-3">
                {/* Miglior orario */}
                <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg">
                    <div>
                        <div className="text-xs text-muted">Più economico</div>
                        <div className="font-bold text-emerald-400">{formatHour(timeAnalysis.cheapestHour.hour)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted">€{timeAnalysis.cheapestHour.avgCostPerKwh.toFixed(2)}/kWh</div>
                        <div className="text-xs text-muted">{timeAnalysis.cheapestHour.count} ricariche</div>
                    </div>
                </div>
                
                {/* Orario più usato */}
                <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded-lg">
                    <div>
                        <div className="text-xs text-muted">Più frequente</div>
                        <div className="font-bold text-blue-400">{formatHour(timeAnalysis.mostUsedHour.hour)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted">{timeAnalysis.mostUsedHour.count} ricariche</div>
                        <div className="text-xs text-muted">{timeAnalysis.mostUsedHour.totalKwh.toFixed(0)} kWh</div>
                    </div>
                </div>
                
                {/* Risparmio potenziale */}
                {timeAnalysis.mostExpensiveHour.avgCostPerKwh > timeAnalysis.cheapestHour.avgCostPerKwh * 1.2 && (
                    <div className="text-xs p-2 bg-yellow-500/10 text-yellow-300 rounded-lg">
                        💡 Spostando le ricariche alle {formatHour(timeAnalysis.cheapestHour.hour)} potresti risparmiare ~{((timeAnalysis.mostExpensiveHour.avgCostPerKwh - timeAnalysis.cheapestHour.avgCostPerKwh) / timeAnalysis.mostExpensiveHour.avgCostPerKwh * 100).toFixed(0)}%
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   PANEL PRINCIPALE INSIGHTS
   ============================================================ */

/**
 * Panel principale con tutti gli insights
 */
function InsightsPanel({ charges, vehicle, settings }) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calcola tutti gli insights
    const projection = React.useMemo(() => 
        calculateMonthlyProjection(charges, currentMonth, currentYear),
        [charges, currentMonth, currentYear]
    );
    
    const comparison = React.useMemo(() => 
        calculateMonthComparison(charges, currentMonth, currentYear),
        [charges, currentMonth, currentYear]
    );
    
    const recommendations = React.useMemo(() => 
        generateChargingRecommendations(charges),
        [charges]
    );
    
    const rangePrediction = React.useMemo(() => 
        calculateRangePrediction(charges, vehicle?.capacity_kwh),
        [charges, vehicle]
    );
    
    const timeAnalysis = React.useMemo(() => 
        analyzeBestChargingTimes(charges),
        [charges]
    );
    
    // Budget dal veicolo
    const budget = vehicle?.monthly_budget || 0;
    
    if (!charges || charges.length === 0) {
        return (
            <div className="text-center p-6 card">
                <div className="text-4xl mb-3">💡</div>
                <div className="text-muted">Aggiungi ricariche per vedere gli insights</div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>💡</span>
                    Insights Intelligenti
                </h3>
            </div>
            
            {/* Grid Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProjectionCard projection={projection} budget={budget} />
                <ComparisonCard comparison={comparison} />
                <RecommendationCard recommendations={recommendations} />
                <RangePredictionCard prediction={rangePrediction} />
                <BestTimeCard timeAnalysis={timeAnalysis} />
            </div>
        </div>
    );
}

/* ============================================================
   ESPORTAZIONE DATI
   ============================================================ */

/**
 * Esporta le ricariche in formato CSV
 */
function exportToCSV(charges, vehicleName) {
    if (!charges || charges.length === 0) {
        alert('Nessuna ricarica da esportare');
        return;
    }
    
    // Intestazioni CSV
    const headers = [
        'Data',
        'Fornitore',
        'Tipo',
        'kWh',
        'Costo (€)',
        '€/kWh',
        'Km Totali',
        'Km Percorsi',
        'Consumo (kWh/100km)',
        'Batteria Inizio %',
        'Batteria Fine %',
        'Note',
        'Tags'
    ];
    
    // Righe dati
    const rows = charges.map(c => {
        const kwh = parseFloat(c.kwh_added) || 0;
        const cost = parseFloat(c.cost) || 0;
        const costPerKwh = kwh > 0 ? (cost / kwh).toFixed(3) : '';
        
        return [
            new Date(c.date).toLocaleDateString('it-IT'),
            c.supplier_name || '',
            c.supplier_type || '',
            kwh.toFixed(2),
            cost.toFixed(2),
            costPerKwh,
            c.total_km || '',
            c.km_since_last || '',
            c.consumption ? c.consumption.toFixed(2) : '',
            c.battery_start || '',
            c.battery_end || '',
            `"${(c.notes || '').replace(/"/g, '""')}"`,
            `"${(c.tags || '').replace(/"/g, '""')}"`
        ];
    });
    
    // Crea contenuto CSV
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');
    
    // Aggiungi BOM per Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EV_Tracker_${vehicleName || 'Export'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Genera report PDF mensile
 */
function generatePDFReport(charges, vehicle, settings, stats) {
    // Per semplicità, usiamo una finestra di stampa HTML
    // In produzione si potrebbe usare una libreria come jsPDF
    
    const now = new Date();
    const monthName = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    
    // Calcola statistiche mese corrente
    const currentMonthCharges = charges.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    const monthStats = {
        count: currentMonthCharges.length,
        kwh: currentMonthCharges.reduce((sum, c) => sum + (parseFloat(c.kwh_added) || 0), 0),
        cost: currentMonthCharges.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0),
        km: currentMonthCharges.reduce((sum, c) => sum + (parseFloat(c.km_since_last) || 0), 0)
    };
    
    // Crea HTML per stampa
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report EV Tracker - ${monthName}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    color: #1a1a1a;
                }
                h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 30px; }
                .stats-grid { 
                    display: grid; 
                    grid-template-columns: repeat(4, 1fr); 
                    gap: 15px; 
                    margin: 20px 0; 
                }
                .stat-box { 
                    background: #f5f5f5; 
                    padding: 15px; 
                    border-radius: 8px; 
                    text-align: center; 
                }
                .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
                .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                }
                th, td { 
                    padding: 10px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd; 
                }
                th { background: #f5f5f5; font-weight: 600; }
                .footer { 
                    margin-top: 40px; 
                    padding-top: 20px; 
                    border-top: 1px solid #ddd; 
                    font-size: 12px; 
                    color: #666; 
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>⚡ EV Cost Tracker - Report Mensile</h1>
            
            <p><strong>Veicolo:</strong> ${vehicle?.name || 'N/D'} ${vehicle?.brand ? `(${vehicle.brand})` : ''}</p>
            <p><strong>Periodo:</strong> ${monthName}</p>
            <p><strong>Generato il:</strong> ${now.toLocaleDateString('it-IT')} alle ${now.toLocaleTimeString('it-IT')}</p>
            
            <h2>📊 Riepilogo Mensile</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${monthStats.count}</div>
                    <div class="stat-label">Ricariche</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${monthStats.kwh.toFixed(0)}</div>
                    <div class="stat-label">kWh</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">€${monthStats.cost.toFixed(2)}</div>
                    <div class="stat-label">Spesa</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${monthStats.km.toFixed(0)}</div>
                    <div class="stat-label">Km percorsi</div>
                </div>
            </div>
            
            <h2>📋 Dettaglio Ricariche</h2>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Fornitore</th>
                        <th>kWh</th>
                        <th>Costo</th>
                        <th>Consumo</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentMonthCharges.map(c => `
                        <tr>
                            <td>${new Date(c.date).toLocaleDateString('it-IT')}</td>
                            <td>${c.supplier_name || '-'}</td>
                            <td>${(parseFloat(c.kwh_added) || 0).toFixed(1)}</td>
                            <td>€${(parseFloat(c.cost) || 0).toFixed(2)}</td>
                            <td>${c.consumption ? c.consumption.toFixed(1) + ' kWh/100km' : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Generato da EV Cost Tracker - https://evtracker.app</p>
                <p>I dati sono stati esportati dal database locale e rappresentano lo storico delle ricariche.</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;
    
    // Apri in nuova finestra
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
}

/**
 * Componente Export Buttons
 */
function ExportButtons({ charges, vehicle, settings, stats }) {
    return (
        <div className="flex gap-2 flex-wrap">
            <button 
                onClick={() => exportToCSV(charges, vehicle?.name)}
                className="btn btn-secondary flex items-center gap-2"
            >
                <span>📄</span>
                <span>Esporta CSV</span>
            </button>
            <button 
                onClick={() => generatePDFReport(charges, vehicle, settings, stats)}
                className="btn btn-secondary flex items-center gap-2"
            >
                <span>📑</span>
                <span>Report PDF</span>
            </button>
        </div>
    );
}
