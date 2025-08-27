
import React from 'react';
import type { MetaPatternAnalysis, HotColdTransition } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { InfoIcon } from './icons/InfoIcon';

const HotColdTable: React.FC<{ data: HotColdTransition[] }> = ({ data }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-brand-text-secondary uppercase">
                    <tr>
                        <th scope="col" className="p-2">Tal</th>
                        <th scope="col" className="p-2">Status-Skift</th>
                        <th scope="col" className="p-2">Nuværende Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                    {data.map(item => (
                        <tr key={item.number}>
                            <td className="p-2 font-bold text-brand-text-primary">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono">
                                    {item.number}
                                </div>
                            </td>
                            <td className="p-2 text-brand-text-primary">{item.transitions} skift</td>
                            <td className="p-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    item.currentState === 'Hot' ? 'bg-red-500/20 text-red-300' :
                                    item.currentState === 'Cold' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-gray-500/20 text-gray-300'
                                }`}>
                                    {item.currentState}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export const MetaPatternInsights: React.FC<{ metaAnalysis: MetaPatternAnalysis }> = ({ metaAnalysis }) => {
    const { hotColdTransitions, dormancyBreakSignals, correlationInsights } = metaAnalysis;

    const hasData = hotColdTransitions.length > 0 || dormancyBreakSignals.length > 0 || correlationInsights.length > 0;
    if (!hasData) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Meta-Pattern Detector</h2>
                <p className="mt-1 text-md text-brand-text-secondary">
                    Analyse af 'mønstre i mønstrene' for at afdække dybere, underliggende dynamikker.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hotColdTransitions.length > 0 && (
                    <PatternCard title="Volatile Numbers (Hot/Cold Dynamics)" description="Disse tal skifter oftest status mellem 'varm', 'kold' og 'neutral', hvilket indikerer en ustabil performance.">
                        <HotColdTable data={hotColdTransitions} />
                    </PatternCard>
                )}
                
                {dormancyBreakSignals.length > 0 && (
                    <PatternCard title="Predictive Signals for Dormancy Breaks" description="Mønstre der statistisk set optræder oftere *inden* et 'sovende' tal bliver trukket.">
                        <ul className="space-y-4">
                            {dormancyBreakSignals.map(signal => (
                                <li key={signal.signal} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-1">
                                        <InfoIcon className="w-5 h-5 text-brand-primary" />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-brand-text-primary">{signal.signal}</h5>
                                        <p className="text-sm text-brand-text-secondary">
                                            Forekomst: <span className="font-bold text-brand-text-primary">{signal.occurrenceRate.toFixed(0)}%</span>. {signal.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </PatternCard>
                )}
            </div>

            {correlationInsights.length > 0 && (
                <div className="lg:col-span-2">
                    <PatternCard title="Cross-Correlation Insights" description="Finder sammenhænge mellem forskellige statistiske målinger.">
                         <ul className="space-y-4">
                            {correlationInsights.map(insight => (
                                <li key={insight.title} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-1">
                                        <InfoIcon className="w-5 h-5 text-brand-primary" />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-brand-text-primary">{insight.title}</h5>
                                        <p className="text-sm text-brand-text-secondary">{insight.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </PatternCard>
                </div>
            )}
        </div>
    );
};
