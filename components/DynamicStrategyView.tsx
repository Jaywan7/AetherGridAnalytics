import React from 'react';
import type { HistoricalSuccessAnalysis, HistoricalSuccessProfile } from '../types';
import { InfoIcon } from './icons/InfoIcon';

interface DynamicStrategyViewProps {
    historicalSuccessAnalysis: HistoricalSuccessAnalysis;
}

// FIX: Add missing companion and stability properties to the mapping
const factorMapping: { key: keyof HistoricalSuccessProfile; label: string; color: string }[] = [
    { key: 'hot', label: 'Frekvens', color: 'bg-blue-500' },
    { key: 'overdue', label: 'Dvale', color: 'bg-orange-500' },
    { key: 'momentum', label: 'Momentum', color: 'bg-cyan-500' },
    { key: 'hotZone', label: 'Zone', color: 'bg-green-500' },
    { key: 'companion', label: 'Følgetal', color: 'bg-purple-500' },
    { key: 'cluster', label: 'Klynge', color: 'bg-pink-500' },
    { key: 'seasonal', label: 'Sæson', color: 'bg-teal-500' },
    { key: 'stability', label: 'Stabilitet', color: 'bg-indigo-500' },
];

const StrategyBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center gap-4 text-sm">
        <span className="w-20 text-brand-text-secondary">{label}</span>
        <div className="flex-1 bg-brand-border rounded-full h-3">
            <div className={`${color} h-3 rounded-full`} style={{ width: `${value}%` }} />
        </div>
        <span className="w-10 text-right font-mono text-brand-text-primary">{value.toFixed(0)}%</span>
    </div>
);

export const DynamicStrategyView: React.FC<DynamicStrategyViewProps> = ({ historicalSuccessAnalysis }) => {
    const { hitProfile } = historicalSuccessAnalysis;

    const totalSuccess = Object.values(hitProfile).reduce((sum, val) => sum + val, 0);

    // FIX: Correct the type casting to satisfy TypeScript by casting through 'unknown' first.
    const normalizedProfile = totalSuccess > 0 
        ? (Object.fromEntries(
            Object.entries(hitProfile).map(([key, value]) => [key, (value / totalSuccess) * 100])
          ) as unknown as HistoricalSuccessProfile)
        : hitProfile;

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6 h-full">
            <div className="flex items-center gap-3">
                <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-semibold text-brand-text-primary">AetherGrid v10.0 - Dynamisk Strategi</h3>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        Modellen justerer automatisk sin strategi baseret på det nuværende "spil-regime". Vægtningen afspejler den valgte strategi.
                    </p>
                </div>
            </div>
            <div className="mt-6 space-y-4">
                {factorMapping
                    .filter(factor => factor.key !== 'cold') // 'cold' is inverse of 'hot', so we don't display it
                    .map(factor => (
                        <StrategyBar
                            key={factor.key}
                            label={factor.label}
                            value={normalizedProfile[factor.key] || 0}
                            color={factor.color}
                        />
                ))}
            </div>
        </div>
    );
};