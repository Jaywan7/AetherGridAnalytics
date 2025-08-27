import React from 'react';
import type { RhythmAnalysisResult } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { PulseIcon } from './icons/PulseIcon';

export const NumberRhythmPanel: React.FC<{ rhythmAnalysis: RhythmAnalysisResult[] }> = ({ rhythmAnalysis }) => {
    const topRhythmicNumbers = rhythmAnalysis.slice(0, 10);

    return (
        <PatternCard
            title="Tal-Rytme: Stabil Puls"
            description="Denne analyse identificerer tal, der optræder med en forudsigelig, metronom-lignende regelmæssighed. En høj 'Puls Styrke' indikerer, at afstanden mellem hver trækning for dette tal er meget konsistent."
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center bg-brand-bg p-6 rounded-lg border border-brand-border">
                    <PulseIcon className="w-16 h-16 text-cyan-400" />
                    <h4 className="text-lg font-semibold text-brand-text-primary mt-4">Metronom-Tal</h4>
                    <p className="text-sm text-brand-text-secondary mt-1 text-center">Tal med den mest stabile og forudsigelige rytme i spillet.</p>
                </div>
                <div className="overflow-y-auto h-80">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-secondary uppercase sticky top-0 bg-brand-surface">
                            <tr>
                                <th className="p-2 w-16">Tal</th>
                                <th className="p-2">Gns. Cyklus</th>
                                <th className="p-2">Puls Styrke</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {topRhythmicNumbers.map(item => (
                                <tr key={item.number}>
                                    <td className="p-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono font-bold">
                                            {item.number}
                                        </div>
                                    </td>
                                    <td className="p-2 font-mono text-brand-text-primary">
                                        {item.averageDormancy.toFixed(1)} trækninger
                                    </td>
                                    <td className="p-2">
                                         <div className="flex items-center gap-2">
                                            <div className="w-full bg-brand-border rounded-full h-2.5">
                                                <div 
                                                    className="bg-cyan-400 h-2.5 rounded-full" 
                                                    style={{ width: `${item.pulseStrength}%` }}
                                                    title={`Standardafvigelse: ${item.dormancyStdDev.toFixed(2)}`}
                                                ></div>
                                            </div>
                                            <span className="font-mono text-xs text-brand-text-secondary w-10">
                                                {item.pulseStrength.toFixed(0)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PatternCard>
    );
};
