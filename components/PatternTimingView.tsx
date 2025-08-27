

import React from 'react';
import type { PatternTimingAnalysis } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { InfoIcon } from './icons/InfoIcon';
import { ClockIcon } from './icons/ClockIcon';
import { StatCard } from './StatCard';

interface PatternTimingViewProps {
    analysis: PatternTimingAnalysis;
}

export const PatternTimingView: React.FC<PatternTimingViewProps> = ({ analysis }) => {
    const { hotStreakAnalysis, dormancyBreakAnalysis, seasonalTransitionAnalysis } = analysis;

    const seasonalTransitionData = seasonalTransitionAnalysis.monthlyTransitions.map(t => ({
        name: t.toPeriod,
        value: t.dissimilarityScore * 100
    }));

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <ClockIcon className="w-8 h-8 text-brand-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Tidsmæssig Analyse: Spillets Rytme</h2>
                        <p className="mt-1 text-md text-brand-text-secondary max-w-4xl">
                            Denne analyse fokuserer på, *hvornår* og *hvor længe* mønstre varer. Ved at forstå spillets rytme kan vi få indsigt i dets volatilitet og forudsigelighed.
                        </p>
                    </div>
                </div>
            </div>

            <PatternCard
                title="Hot Streak Analyse"
                description="Undersøger hvor længe et 'varmt' tal typisk forbliver varmt. En 'hot streak' defineres som antallet af på hinanden følgende trækninger, hvor et tal forbliver i den øverste tredjedel baseret på frekvens."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="space-y-4">
                             <StatCard title="Gns. Hot Streak Varighed" value={`${hotStreakAnalysis.averageStreakDuration.toFixed(1)} trækninger`} />
                             <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                                <h4 className="text-sm font-medium text-brand-text-secondary">Længste Streak</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary text-brand-bg font-mono font-bold text-lg">
                                        {hotStreakAnalysis.longestStreak.number}
                                    </div>
                                    <p className="text-2xl font-semibold text-brand-text-primary">{hotStreakAnalysis.longestStreak.duration} <span className="text-base font-normal">trækninger</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="md:col-span-2">
                         <div className="overflow-y-auto h-64 border border-brand-border rounded-lg p-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-brand-text-secondary uppercase">
                                    <tr>
                                        <th className="p-2">Tal</th>
                                        <th className="p-2">Længste Streak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hotStreakAnalysis.streaksByNumber.slice(0, 10).map(item => (
                                        <tr key={item.number} className="border-t border-brand-border">
                                            <td className="p-2">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono font-bold text-sm">
                                                    {item.number}
                                                </div>
                                            </td>
                                            <td className="p-2 text-brand-text-primary">{item.duration} trækninger</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </PatternCard>

             <PatternCard 
                title="Optakt til Dvale-Brud"
                description="Analyserer trækningen *lige før* et 'overdue' tal bliver trukket for at finde eventuelle forvarsler."
             >
                <div className="flex flex-col md:flex-row justify-around items-center gap-6 text-center">
                    <div>
                        <p className="text-sm text-brand-text-secondary">Global Gns. Spredning</p>
                        <p className="text-4xl font-bold text-brand-text-primary mt-1">{dormancyBreakAnalysis.globalAvgSpread.toFixed(1)}</p>
                    </div>
                    <div className="text-5xl font-thin text-brand-text-secondary">&rarr;</div>
                     <div>
                        <p className="text-sm text-brand-text-secondary">Gns. Spredning Før et Dvale-Brud</p>
                        <p className="text-4xl font-bold text-green-400 mt-1">{dormancyBreakAnalysis.avgSpreadBeforeBreak.toFixed(1)}</p>
                    </div>
                </div>
                 <div className="mt-6 flex items-start gap-3 text-brand-text-secondary bg-brand-bg p-4 rounded-lg">
                    <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                    <p><span className="font-semibold text-brand-text-primary">Konklusion:</span> Trækninger med en markant højere spredning (mere 'kaotiske') ser ud til at 'rydde vejen' for, at et tal, der længe har været fraværende, kan blive trukket. En spredning over {Math.floor(dormancyBreakAnalysis.avgSpreadBeforeBreak)} kan være et tegn.</p>
                </div>
            </PatternCard>

             <PatternCard 
                title="Sæsonbestemt Volatilitet"
                description="Måler hvor meget de top-10 stærkeste tal ændrer sig fra måned til måned. En høj søjle indikerer et stort skift og dermed en mere uforudsigelig periode."
            >
                <SimpleBarChart data={seasonalTransitionData} barColor="#DB6D28" />
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                     <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                        <p className="text-sm text-brand-text-secondary">Mest Volatile Overgang</p>
                        <p className="text-lg font-semibold text-red-400 mt-1">{seasonalTransitionAnalysis.mostVolatileMonth}</p>
                    </div>
                    <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                        <p className="text-sm text-brand-text-secondary">Mest Stabile Overgang</p>
                        <p className="text-lg font-semibold text-green-400 mt-1">{seasonalTransitionAnalysis.leastVolatileMonth}</p>
                    </div>
                </div>
            </PatternCard>

        </div>
    );
};
