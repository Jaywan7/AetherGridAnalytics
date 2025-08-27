
import React from 'react';
import type { WeightConfiguration } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { InfoIcon } from './icons/InfoIcon';

const factorLabels: Record<keyof WeightConfiguration, string> = {
    frequency: 'Frekvens',
    dormancy: 'Dvale',
    zone: 'Zone',
    companion: 'Følgetal',
    momentum: 'Momentum',
    clusterStrength: 'Klynge-Styrke',
    stability: 'Stabilitet',
    seasonal: 'Sæson',
};

const factorColors: Record<keyof WeightConfiguration, string> = {
    frequency: 'bg-blue-500',
    dormancy: 'bg-orange-500',
    zone: 'bg-green-500',
    companion: 'bg-purple-500',
    momentum: 'bg-cyan-500',
    clusterStrength: 'bg-pink-500',
    stability: 'bg-indigo-500',
    seasonal: 'bg-teal-500',
};

const ImportanceBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div className="flex items-center text-xs">
        <span className="w-28 text-brand-text-secondary">{label}</span>
        <div className="flex-1 bg-brand-border rounded-full h-4 mr-2">
            <div className={`${color} h-4 rounded-full flex items-center justify-end pr-2`} style={{ width: `${value * 100}%` }}>
                <span className="text-white font-bold text-[10px]">{(value * 100).toFixed(1)}%</span>
            </div>
        </div>
    </div>
);

export const FeatureImportancePanel: React.FC<{ weights: WeightConfiguration }> = ({ weights }) => {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;
    
    const sortedWeights = (Object.entries(weights) as [keyof WeightConfiguration, number][])
        .sort(([, a], [, b]) => b - a);

    return (
        <PatternCard
            title="Kalibreret Faktor-Vigtighed"
            description="Efter backtesting-processen har modellen automatisk tildelt vægt til hver faktor baseret på dens historiske succes med at forudsige vindertal. Dette er modellens 'konklusion' om, hvad der er vigtigst."
        >
            <div className="space-y-2">
                 {sortedWeights.map(([key, value]) => (
                    <ImportanceBar
                        key={key}
                        label={factorLabels[key]}
                        value={value / totalWeight}
                        color={factorColors[key]}
                    />
                ))}
            </div>
             <div className="mt-4 flex items-start gap-3 text-brand-text-secondary bg-brand-bg p-4 rounded-lg">
                <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                <p>En høj vægt betyder, at modellen har 'lært', at denne faktor er en stærk indikator for et fremtidigt vindertal. En lav vægt indikerer, at faktoren har været mindre pålidelig eller støjende.</p>
            </div>
        </PatternCard>
    );
};
