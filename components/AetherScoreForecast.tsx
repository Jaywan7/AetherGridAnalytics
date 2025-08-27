
import React from 'react';
import type { AetherScoreData, AetherScoreResult, AetherStarScoreResult, AetherScoreBreakdown } from '../types';
import { TargetIcon } from './icons/TargetIcon';
import { InfoIcon } from './icons/InfoIcon';

interface AetherScoreTableProps {
    title: string;
    data: (AetherScoreResult | AetherStarScoreResult)[];
    numberBgClass: string;
}

const AetherScoreTable: React.FC<AetherScoreTableProps> = ({ title, data, numberBgClass }) => {
    const maxScore = data.length > 0 ? Math.max(1, ...data.map(d => d.score)) : 1;

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-4">
             <h4 className="font-semibold text-brand-text-primary mb-3">{title}</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th scope="col" className="p-2 w-12">Rank</th>
                            <th scope="col" className="p-2 w-16">Tal</th>
                            <th scope="col" className="p-2">Aether Score</th>
                            <th scope="col" className="p-2">Begrundelse</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 10).map((item) => (
                            <tr key={item.number} className="border-t border-brand-border">
                                <td className="p-2 font-bold text-brand-text-primary text-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-bg border border-brand-border">
                                        {item.rank}
                                    </div>
                                </td>
                                <td className="p-2">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-sm ${numberBgClass}`}>
                                        {item.number}
                                    </div>
                                </td>
                                <td className="p-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-brand-text-primary w-12">{item.score.toFixed(0)}</span>
                                        <div className="w-full bg-brand-border rounded-full h-2.5">
                                            <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${Math.max(0, (item.score / maxScore)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-2 text-brand-text-secondary text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span>{item.justification}</span>
                                        {'companion' in item.breakdown && (
                                            <div className="relative group flex-shrink-0">
                                                <InfoIcon className="w-4 h-4 text-brand-text-secondary cursor-pointer" />
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64
                                                                bg-brand-bg border border-brand-border rounded-lg p-3 text-xs text-left
                                                                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10
                                                                shadow-lg">
                                                    <p className="font-bold text-brand-text-primary mb-2">Aether Score Breakdown</p>
                                                    <ul className="space-y-1 text-brand-text-secondary">
                                                        {(item.breakdown as AetherScoreBreakdown).frequency !== undefined && <li>Frekvens: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).frequency.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).dormancy !== undefined && <li>Dvale: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).dormancy.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).zone !== undefined && <li>Zone: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).zone.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).companion !== undefined && <li>Følgetal: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).companion.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).momentum !== undefined && <li>Momentum: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).momentum!.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).clusterStrength !== undefined && <li>Klynge-Styrke: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).clusterStrength!.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).stability !== undefined && <li>Stabilitet: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).stability!.toFixed(0)}</span></li>}
                                                        {(item.breakdown as AetherScoreBreakdown).seasonal && (item.breakdown as AetherScoreBreakdown).seasonal! > 0 && 
                                                            <li>Sæson: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).seasonal!.toFixed(0)}</span></li>
                                                        }
                                                        {(item.breakdown as AetherScoreBreakdown).postDormancy && (item.breakdown as AetherScoreBreakdown).postDormancy! > 0 && 
                                                            <li>Post-Dvale Bonus: <span className="font-mono float-right text-brand-text-primary">{(item.breakdown as AetherScoreBreakdown).postDormancy!.toFixed(0)}</span></li>
                                                        }
                                                    </ul>
                                                    <hr className="my-2 border-brand-border" />
                                                    <p className="font-bold text-brand-text-primary">Samlet Score: <span className="font-mono float-right">{item.score.toFixed(0)}</span></p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const AetherScoreForecast: React.FC<{ aetherScores: AetherScoreData }> = ({ aetherScores }) => {
    if (!aetherScores) return null;

    return (
        <div className="space-y-6">
             <div>
                <div className="flex items-center gap-3">
                    <TargetIcon className="w-8 h-8 text-brand-primary" />
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Aether Score: Prognose</h2>
                        <p className="mt-1 text-md text-brand-text-secondary">
                            A data-driven ranking of the most probable numbers for the upcoming draw.
                        </p>
                    </div>
                </div>
            </div>
            {aetherScores.insight && (
                 <div className="bg-brand-surface border border-brand-border rounded-lg p-4 flex items-start gap-3">
                    <InfoIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-text-secondary">
                        <span className="font-semibold text-brand-text-primary">Model-status:</span> {aetherScores.insight}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AetherScoreTable title="Top 10 Main Numbers" data={aetherScores.mainNumberScores} numberBgClass="bg-brand-primary text-brand-bg" />
                <AetherScoreTable title="Top 5 Star Numbers" data={aetherScores.starNumberScores.slice(0,5)} numberBgClass="bg-yellow-400 text-brand-bg" />
            </div>
        </div>
    );
};
