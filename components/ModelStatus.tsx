


import React from 'react';
import type { WeightConfiguration } from '../types';
import { InfoIcon } from './icons/InfoIcon';
import { AlertIcon } from './icons/AlertIcon';

interface ModelStatusProps {
    weights: WeightConfiguration;
    regimeShiftDetected: boolean;
}

const WeightBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center text-xs">
        <span className="w-24 text-brand-text-secondary">{label}</span>
        <div className="flex-1 bg-brand-border rounded-full h-2.5 mr-2">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${value * 100}%` }}></div>
        </div>
        <span className="w-8 font-mono text-brand-text-primary">{(value * 100).toFixed(0)}%</span>
    </div>
);

export const ModelStatus: React.FC<ModelStatusProps> = ({ weights, regimeShiftDetected }) => {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-surface border border-brand-border rounded-lg p-4 flex items-start gap-3">
                <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                <div>
                    <h4 className="font-semibold text-brand-text-primary">AetherGrid v9.5 - Evidens-baseret Prognose</h4>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        Modellen har justeret vægtningen af prognosefaktorerne baseret på de historiske vindertals 'DNA' for at afspejle, hvad der reelt har virket over tid.
                    </p>
                    <div className="mt-3 space-y-2">
                        <WeightBar label="Frekvens" value={weights.frequency / totalWeight} color="bg-blue-500" />
                        <WeightBar label="Dvale" value={weights.dormancy / totalWeight} color="bg-orange-500" />
                        <WeightBar label="Momentum" value={weights.momentum / totalWeight} color="bg-cyan-500" />
                        <WeightBar label="Zone" value={weights.zone / totalWeight} color="bg-green-500" />
                        <WeightBar label="Følgetal" value={weights.companion / totalWeight} color="bg-purple-500" />
                        <WeightBar label="Klynge" value={weights.clusterStrength / totalWeight} color="bg-pink-500" />
                        <WeightBar label="Sæson" value={weights.seasonal / totalWeight} color="bg-teal-500" />
                        <WeightBar label="Stabilitet" value={weights.stability / totalWeight} color="bg-indigo-500" />
                    </div>
                </div>
            </div>
            <div className={`bg-brand-surface border rounded-lg p-4 flex items-start gap-3 ${regimeShiftDetected ? 'border-yellow-500/50' : 'border-brand-border'}`}>
                <AlertIcon className={`w-6 h-6 flex-shrink-0 ${regimeShiftDetected ? 'text-yellow-400' : 'text-green-400'}`} />
                <div>
                    <h4 className={`font-semibold ${regimeShiftDetected ? 'text-yellow-300' : 'text-green-300'}`}>
                        {regimeShiftDetected ? 'Regime-Skift Opdaget' : 'Stabilt Data-Regime'}
                    </h4>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        {regimeShiftDetected 
                            ? "Der er opdaget et signifikant skift i de statistiske mønstre inden for de seneste 50 trækninger. Modellens prognoser kan være mindre pålidelige, da ældre data måske ikke længere er repræsentative."
                            : "De underliggende statistiske egenskaber i datasættet (som spredning og gentagelsesrate) har været stabile. Historiske data er en pålidelig base for fremtidige prognoser."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};