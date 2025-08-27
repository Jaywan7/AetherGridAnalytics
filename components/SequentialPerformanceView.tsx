import React, { useMemo } from 'react';
import type { PerformancePoint, PerformanceLogItem, ForecastPerformanceInsight, PerformanceBreakdown, WeightConfiguration, BacktestEvent } from '../types';
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceDot, Label } from 'recharts';
import { PatternCard } from './patterns/PatternCard';
import { InfoIcon } from './icons/InfoIcon';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { StatCard } from './StatCard';
import { FeatureImportancePanel } from './FeatureImportancePanel';
import { PredictabilityIndexPanel } from './PredictabilityIndexPanel';

interface SequentialPerformanceViewProps {
    performanceTimeline: PerformancePoint[];
    performanceLog: PerformanceLogItem[];
    forecastPerformanceInsight: ForecastPerformanceInsight;
    performanceBreakdown: PerformanceBreakdown;
    optimalWeights?: WeightConfiguration;
    events: BacktestEvent[];
}

const DownArrow: React.FC<any> = ({ cx, cy }) => (
    <svg x={cx - 8} y={cy + 8} width="16" height="16" fill="#ef4444" viewBox="0 0 20 20">
      <path d="M10 14.25l-6-6h12z" />
    </svg>
);

const UpArrow: React.FC<any> = ({ cx, cy }) => (
    <svg x={cx - 8} y={cy - 16} width="16" height="16" fill="#22c55e" viewBox="0 0 20 20">
      <path d="M10 5.75l6 6H4z" />
    </svg>
);

export const SequentialPerformanceView: React.FC<SequentialPerformanceViewProps> = ({ performanceTimeline, performanceLog, forecastPerformanceInsight, performanceBreakdown, optimalWeights, events }) => {
    
    const { rollingPrecision, avgBaselinePrecision } = useMemo(() => {
        if (!performanceLog || performanceLog.length === 0) {
            return { rollingPrecision: 0, avgBaselinePrecision: 0 };
        }
        const totalDraws = performanceLog.length;
        const baselinePrecision = (performanceBreakdown.abTest.baselineTotalHits || 0) / totalDraws;
        
        const rollingWindow = 15;
        const lastLogs = performanceLog.slice(-rollingWindow);
        const rolling = lastLogs.length > 0 ? lastLogs.reduce((sum, item) => sum + item.mainHits, 0) / lastLogs.length : 0;
        
        return { rollingPrecision: rolling, avgBaselinePrecision: baselinePrecision };
    }, [performanceLog, performanceBreakdown]);

    const chartData = useMemo(() => performanceTimeline.map(p => ({
        name: p.trainingSize,
        'Aether Score': p.avgMainHits,
        'Baseline': p.avgBaselineHits,
    })), [performanceTimeline]);
    
    const { dipPoint, risePoint } = useMemo(() => {
        if (chartData.length < 20) return { dipPoint: null, risePoint: null };
        const dataSlice = chartData.slice(1, -1); // Exclude endpoints
        let dip = dataSlice.reduce((min, p) => p['Aether Score'] < min['Aether Score'] ? p : min, dataSlice[0]);
        
        // Find the last calibration event to mark the rise
        const lastCalibrationEvent = events.filter(e => e.type === 'Weight Calibration').pop();
        let rise = null;
        if(lastCalibrationEvent) {
             rise = chartData.find(p => p.name >= lastCalibrationEvent.drawNumber);
        }

        return { dipPoint: dip, risePoint: rise };
    }, [chartData, events]);


    const exportPerformanceData = () => {
        if (!performanceLog) return;

        const convertToCSV = (data: PerformanceLogItem[]): string => {
            const header = "DrawNumber,DrawDate,ForecastMain,ActualMain,MainHits,ForecastStar,ActualStar,StarHits,BaselineForecast,BaselineHits,AverageWinnerRank\n";
            const rows = data.map(item => {
                const row = [
                    item.drawNumber,
                    item.drawDate,
                    `"${item.forecast_top10_main.join(' ')}"`,
                    `"${item.actual_main.join(' ')}"`,
                    item.mainHits,
                    `"${item.forecast_top5_star.join(' ')}"`,
                    `"${item.actual_star.join(' ')}"`,
                    item.starHits,
                    `"${(item.forecast_baseline_main || []).join(' ')}"`,
                    item.baselineMainHits || 0,
                    item.averageWinnerRank?.toFixed(2) || 'N/A'
                ].join(',');
                return row;
            });
            return header + rows.join('\n');
        };

        const downloadCSV = (csvContent: string, filename: string) => {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        const csv = convertToCSV(performanceLog);
        downloadCSV(csv, "AetherGrid_Performance_Log.csv");
    };

    const hitProfileData = [
        { name: 'Varme', value: forecastPerformanceInsight.hitProfile.hot },
        { name: 'Kolde', value: forecastPerformanceInsight.hitProfile.cold },
        { name: 'Overdue', value: forecastPerformanceInsight.hitProfile.overdue },
        { name: 'Hot Zone', value: forecastPerformanceInsight.hitProfile.hotZone },
    ];
    
    const monthlyPerfData = performanceBreakdown.seasonal.monthly.map(m => ({ name: m.period, value: m.avgHits }));
    const quarterlyPerfData = performanceBreakdown.seasonal.quarterly.map(q => ({ name: q.period, value: q.avgHits }));
    
    const cardTitle = `Aether Score Præcision over Tid (Rullende Precision: ${rollingPrecision.toFixed(2)} | Baseline Precision: ${avgBaselinePrecision.toFixed(2)})`;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Model Præcisionsudvikling (Rullende Analyse)</h2>
                <p className="mt-1 text-md text-brand-text-secondary max-w-4xl">
                    Denne analyse gen-træner og tester modellen for hver eneste trækning efter en startperiode på 100 trækninger. Dette simulerer, hvordan modellens viden og præcision udvikler sig over tid i den virkelige verden.
                </p>
            </div>

            <PatternCard 
                title={cardTitle}
                description="Grafen viser det gennemsnitlige antal korrekte hovedtals-forudsigelser (ud af 10) for hvert trin i testen."
            >
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#58A6FF" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#58A6FF" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} domain={[0.5, 'dataMax + 0.2']} tickFormatter={(v) => v.toFixed(2)} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0D1117', borderColor: '#30363D', color: '#C9D1D9' }}
                            labelStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => value.toFixed(2)}
                        />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>

                        {events.map(event => {
                             const isRegimeShift = event.type === 'Regime Shift Detected';
                             return (
                                <ReferenceLine key={event.drawNumber} x={event.drawNumber} stroke={isRegimeShift ? '#ef4444' : '#22c55e'} strokeDasharray="3 3">
                                    <Label value={event.label} position="top" fill={isRegimeShift ? '#f87171' : '#4ade80'} fontSize={10} dy={-5} />
                                </ReferenceLine>
                            )
                        })}

                        {dipPoint && <ReferenceDot r={0} x={dipPoint.name} y={dipPoint['Aether Score'] + 0.05} shape={<DownArrow />} />}
                        {risePoint && <ReferenceDot r={0} x={risePoint.name} y={risePoint['Aether Score'] - 0.05} shape={<UpArrow />} />}

                        <Area type="monotone" dataKey="Aether Score" stroke="none" fill="url(#colorUv)" />
                        <Line type="monotone" dataKey="Aether Score" stroke="#58A6FF" strokeWidth={2} dot={{r: 2}} activeDot={{r: 5}}/>
                        <Line type="monotone" dataKey="Baseline" stroke="#8B949E" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </PatternCard>

            <PredictabilityIndexPanel performanceLog={performanceLog} />
            
            <PatternCard title="A/B Test: Aether Score vs. Baseline (Frekvens)" description="Sammenligning af Aether Score modellens præcision mod en simpel model, der kun anbefaler de 10 historisk hyppigste tal.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <StatCard title="Aether Score Træf" value={performanceBreakdown.abTest.aetherTotalHits.toLocaleString()} />
                    <StatCard title="Baseline Træf" value={performanceBreakdown.abTest.baselineTotalHits.toLocaleString()} />
                    <div>
                        <div className="bg-brand-bg p-6 rounded-lg border border-brand-border h-full flex flex-col justify-center">
                             <h4 className="text-sm font-medium text-brand-text-secondary">Forbedring</h4>
                             <p className={`mt-1 text-3xl font-semibold ${performanceBreakdown.abTest.improvementPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {performanceBreakdown.abTest.improvementPercentage >= 0 ? '+' : ''}{performanceBreakdown.abTest.improvementPercentage.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </PatternCard>

            {optimalWeights && <FeatureImportancePanel weights={optimalWeights} />}

            <PatternCard title="Prognose-Profil: Hvad er modellen god til?" description={`Baseret på ${forecastPerformanceInsight.totalHits} korrekte forudsigelser, analyserer vi hvilke slags tal modellen er bedst til at ramme.`}>
                <SimpleBarChart data={hitProfileData} barColor="#DB6D28" />
                <div className="text-xs text-brand-text-secondary mt-2 text-center">
                    <p>Grafen viser procentdelen af træf, der faldt inden for hver kategori.</p>
                </div>
                <div className="mt-4 flex items-start gap-3 text-brand-text-secondary bg-brand-bg p-4 rounded-lg">
                    <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                    <p><span className="font-semibold text-brand-text-primary">Konklusion:</span> {forecastPerformanceInsight.conclusion}</p>
                </div>
            </PatternCard>
            
            <PatternCard title="Sæsonbestemt Præcision" description="Analyserer om modellens præcision varierer baseret på måned eller kvartal.">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-center font-semibold text-brand-text-primary mb-2">Gns. Træf pr. Måned</h4>
                        <SimpleBarChart data={monthlyPerfData} barColor="#9E4AD3" />
                    </div>
                    <div>
                        <h4 className="text-center font-semibold text-brand-text-primary mb-2">Gns. Træf pr. Kvartal</h4>
                        <SimpleBarChart data={quarterlyPerfData} barColor="#A27031" />
                    </div>
                </div>
            </PatternCard>

            <div className="text-center pt-4">
                <button 
                    onClick={exportPerformanceData}
                    disabled={!performanceLog || performanceLog.length === 0}
                    className="px-6 py-3 bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    Eksporter Rådata til Analyse
                </button>
            </div>
        </div>
    );
};