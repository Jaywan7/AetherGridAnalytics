
import React from 'react';
import type { AntiPopularityAnalysis, BiasAnalysis } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { UsersIcon } from './icons/UsersIcon';

const BiasCard: React.FC<{ bias: BiasAnalysis }> = ({ bias }) => {
    const diff = bias.observed - bias.expected;
    const diffColor = diff > 0.1 ? 'text-green-400' : diff < -0.1 ? 'text-red-400' : 'text-brand-text-secondary';
    const indicator = diff > 0.1 ? 'Over-rep.' : diff < -0.1 ? 'Under-rep.' : 'Neutral';

    return (
        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
            <div className="flex justify-between items-start">
                <div>
                    <h5 className="font-semibold text-brand-text-primary">{bias.name}</h5>
                    <div className="text-xs text-brand-text-secondary mt-1">
                        Observeret: <span className="font-mono">{bias.observed.toFixed(1)}{bias.unit}</span> / 
                        Forventet: <span className="font-mono">{bias.expected.toFixed(1)}{bias.unit}</span>
                    </div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${diff > 0.1 ? 'bg-green-500/20' : diff < -0.1 ? 'bg-red-500/20' : 'bg-gray-500/20'} ${diffColor}`}>
                    {indicator}
                </div>
            </div>
            <p className="text-xs text-brand-text-secondary mt-2 italic">ⓘ {bias.conclusion}</p>
        </div>
    );
};

export const AntiPopularityPanel: React.FC<{ analysis: AntiPopularityAnalysis }> = ({ analysis }) => {
    return (
        <PatternCard title="Anti-Popularity Profiling" description="Analyse af vindertal for at afdække og udnytte almindelige menneskelige valg-bias.">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-3 text-center">Reverse-Engineering Human Bias</h4>
                    <div className="space-y-3">
                        {analysis.humanBiasAnalysis.map(bias => <BiasCard key={bias.name} bias={bias} />)}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-3 text-center">Combination Popularity Bias</h4>
                     <div className="space-y-3">
                        {analysis.combinationBiasAnalysis.map(bias => <BiasCard key={bias.name} bias={bias} />)}
                    </div>
                </div>
            </div>
        </PatternCard>
    );
};
