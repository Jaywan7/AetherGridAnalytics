
import React from 'react';
import type { AetherScoreResult, AetherScoreBreakdown } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { DNAIcon } from './icons/DNAIcon';

const factorLabels: Record<keyof AetherScoreBreakdown, string> = {
    frequency: 'Frekvens',
    dormancy: 'Dvale',
    zone: 'Zone',
    companion: 'Følgetal',
    momentum: 'Momentum',
    clusterStrength: 'Klynge-Styrke',
    stability: 'Stabilitet',
    seasonal: 'Sæson',
    postDormancy: 'Post-Dvale Bonus',
    contextual: 'Kontekst Bonus',
    popularity: 'Popularitets Straf',
};

const factorColors: Record<keyof AetherScoreBreakdown, string> = {
    frequency: 'bg-blue-500',
    dormancy: 'bg-orange-500',
    zone: 'bg-green-500',
    companion: 'bg-purple-500',
    momentum: 'bg-cyan-500',
    clusterStrength: 'bg-pink-500',
    stability: 'bg-indigo-500',
    seasonal: 'bg-teal-500',
    postDormancy: 'bg-yellow-400',
    contextual: 'bg-yellow-400',
    popularity: 'bg-red-500',
};

const ScoreFactor: React.FC<{ label: string, value: number, color: string, maxAbsValue: number }> = ({ label, value, color, maxAbsValue }) => {
    const isNegative = value < 0;
    const width = (Math.abs(value) / maxAbsValue) * 100;

    return (
        <div className="flex items-center text-xs space-x-2">
            <span className="w-28 text-brand-text-secondary text-right">{label}</span>
            <div className={`flex-1 h-4 rounded-r ${isNegative ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                 <div 
                    className={`h-4 rounded-r ${color}`} 
                    style={{ width: `${width}%` }}
                    title={value.toFixed(1)}
                ></div>
            </div>
            <span className={`w-12 font-mono text-left ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
                {value.toFixed(1)}
            </span>
        </div>
    );
};

export const AetherScoreDNAPanel: React.FC<{ topScore: AetherScoreResult }> = ({ topScore }) => {
    const breakdown = topScore.breakdown;
    const allValues = Object.values(breakdown).filter(v => v !== undefined && v !== 0) as number[];
    const maxAbsValue = Math.max(...allValues.map(Math.abs), 1);

    const factors = (Object.keys(breakdown) as Array<keyof AetherScoreBreakdown>)
        .filter(key => breakdown[key] !== undefined && Math.abs(breakdown[key]!) > 0.01)
        .sort((a, b) => Math.abs(breakdown[b]!) - Math.abs(breakdown[a]!));

    return (
        <PatternCard
            title={`Aether Score DNA: Hvorfor er ${topScore.number} Toprangeret?`}
            description="En detaljeret dekonstruktion af de faktorer, der bidrager til tallets samlede Aether Score. Dette giver indsigt i, *hvorfor* modellen favoriserer dette tal."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col items-center justify-center bg-brand-bg p-6 rounded-lg border border-brand-border">
                    <div className="relative">
                        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-brand-primary text-brand-bg font-mono font-bold text-5xl">
                            {topScore.number}
                        </div>
                        <DNAIcon className="w-10 h-10 text-brand-primary absolute -bottom-3 -right-3" />
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-sm text-brand-text-secondary">Samlet Aether Score</p>
                        <p className="text-4xl font-bold text-brand-text-primary mt-1">{topScore.score.toFixed(0)}</p>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                    {factors.map(key => (
                         <ScoreFactor
                            key={key}
                            label={factorLabels[key]}
                            value={breakdown[key]!}
                            color={factorColors[key]}
                            maxAbsValue={maxAbsValue}
                        />
                    ))}
                </div>
            </div>
        </PatternCard>
    );
};
