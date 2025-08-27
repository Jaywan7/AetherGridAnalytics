
import React from 'react';
import type { PerformancePoint, PerformanceLogItem, ForecastPerformanceInsight, PerformanceBreakdown } from '../types';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { PatternCard } from './patterns/PatternCard';
import { InfoIcon } from './icons/InfoIcon';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { StatCard } from './StatCard';

interface SequentialPerformanceViewProps {
    performanceTimeline: PerformancePoint[];
    performanceLog: PerformanceLogItem[];
    forecastPerformanceInsight: ForecastPerformanceInsight;
    performanceBreakdown: PerformanceBreakdown;
}

const analyzeTrend = (timeline: PerformancePoint[]): { insight: string; title: string } => {
    if (timeline.length < 2) {
        return {
            title: "Indsigt: Utilstrækkelige Data",
            insight: "Der er ikke nok datapunkter til at foretage en meningsfuld analyse af modellens præstationsudvikling."
        };
    }

    const firstPoint = timeline[0];
    const lastPoint = timeline[timeline.length - 1];
    const peakPerformance = timeline.reduce((max, p) => (p.avgMainHits > max.avgMainHits ? p : max), firstPoint);

    // Using a 5% threshold to define a significant increase
    if (lastPoint.avgMainHits > firstPoint.avgMainHits * 1.05) {
        return {
            title: "Indsigt: Stigende Præcision",
            insight: "Modellens præcision stiger i takt med, at den modtager mere data. Dette indikerer, at de statistiske mønstre er stabile og bliver klarere over tid. Modellen ser ud til at blive 'klogere'."
        };
    } else {
        return {
            title: "Indsigt: Stabiliseret Præcision",
            insight: `Modellens præcision stabiliserer sig (eller falder let) efter ca. ${peakPerformance.trainingSize} trækninger. Dette kan tyde på, at ældre data er mindre relevante, eller at modellen har nået sin maksimale forudsigelseskraft med det nuværende regelsæt.`
        };
    }
};

export const SequentialPerformanceView: React.FC<SequentialPerformanceViewProps> = ({ performanceTimeline, performanceLog, forecastPerformanceInsight, performanceBreakdown }) => {
    const { title, insight } = analyzeTrend(performanceTimeline);
    
    const exportPerformanceData = () => {
        if (!performanceLog) return;

        const convertToCSV = (data: PerformanceLogItem[]): string => {
            const header = "DrawNumber,DrawDate,ForecastMain,ActualMain,MainHits,ForecastStar,ActualStar,StarHits,BaselineForecast,BaselineHits\n";
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
                    item.baselineMainHits || 0
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

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Model Præcisionsudvikling (Rullende Analyse)</h2>
                <p className="mt-1 text-md text-brand-text-secondary max-w-4xl">
                    Denne analyse gen-træner og tester modellen for hver eneste trækning efter en startperiode på 100 trækninger. Dette simulerer, hvordan modellens viden og præcision udvikler sig over tid i den virkelige verden.
                </p>
            </div>

            <PatternCard 
                title="Aether Score Præcision over Tid" 
                description="Grafen viser det gennemsnitlige antal korrekte hovedtals-forudsigelser (ud af 10) for hvert trin i testen."
            >
                <SimpleLineChart
                    data={performanceTimeline}
                    xAxisKey="trainingSize"
                    lineKey="avgMainHits"
                    lineName="Gns. Hovedtals-Træf"
                />
            </PatternCard>

            <PatternCard title={title} description="En automatisk analyse af tendensen i grafen ovenfor.">
                 <div className="flex items-start gap-3 text-brand-text-secondary bg-brand-bg p-4 rounded-lg h-full">
                    <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                    <p>{insight}</p>
                </div>
            </PatternCard>
            
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