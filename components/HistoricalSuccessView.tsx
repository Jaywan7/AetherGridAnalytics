

import React from 'react';
import type { HistoricalSuccessAnalysis } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { InfoIcon } from './icons/InfoIcon';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { PatternLifecyclePanel } from './PatternLifecyclePanel';

interface HistoricalSuccessViewProps {
    analysis: HistoricalSuccessAnalysis;
}

export const HistoricalSuccessView: React.FC<HistoricalSuccessViewProps> = ({ analysis }) => {
    const { hitProfile, preDrawIndicators, totalAnalyzedHits } = analysis;

    const hitProfileData = [
        { name: 'Varme', value: hitProfile.hot },
        { name: 'Kolde', value: hitProfile.cold },
        { name: 'Overdue', value: hitProfile.overdue },
        { name: 'Hot Zone', value: hitProfile.hotZone },
        { name: 'Momentum', value: hitProfile.momentum },
        { name: 'Klynge', value: hitProfile.cluster },
        { name: 'Sæson', value: hitProfile.seasonal },
    ].sort((a,b) => b.value - a.value);
    
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Vindertals-DNA</h2>
                <p className="mt-1 text-md text-brand-text-secondary max-w-4xl">
                    Denne analyse ser bagud for at forstå, hvilke betingelser der historisk har været til stede, når et tal er blevet trukket. Den afdækker den typiske "DNA" for et vindertal.
                </p>
            </div>

            <PatternCard 
                title="Vindertals-DNA: Hvilken Type Tal Bliver Trukket?"
                description={`Baseret på en analyse af ${totalAnalyzedHits.toLocaleString()} individuelle taltrækninger, viser denne graf den procentvise fordeling af, hvilken 'status' et tal havde, da det blev trukket.`}
            >
                <SimpleBarChart data={hitProfileData} barColor="#58A6FF" />
                 <div className="mt-4 flex items-start gap-3 text-brand-text-secondary bg-brand-bg p-4 rounded-lg">
                    <InfoIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                    <p><span className="font-semibold text-brand-text-primary">Fortolkning:</span> En høj score i 'Varme' betyder, at tal, der er trukket ofte, har en tendens til at blive trukket igen. En høj score i 'Overdue' tyder på, at spillet favoriserer tal, der vender tilbage til deres gennemsnitlige frekvens.</p>
                </div>
            </PatternCard>

            <PatternLifecyclePanel historicalSuccessAnalysis={analysis} />

            <PatternCard 
                title="Pre-Draw Indicators: Optakt til Succes" 
                description="Finder mønstre i trækningen *lige før* en bestemt type tal (f.eks. et 'varmt' tal) bliver trukket."
            >
                 {preDrawIndicators.length > 0 ? (
                    <ul className="space-y-4">
                        {preDrawIndicators.map(indicator => (
                            <li key={indicator.title} className="flex items-start gap-4 p-4 bg-brand-bg rounded-lg">
                                <div className="flex-shrink-0 pt-1">
                                    <InfoIcon className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-brand-text-primary">{indicator.title}</h5>
                                    <p className="text-sm text-brand-text-secondary mt-1">{indicator.insight}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-brand-text-secondary">Ingen stærke pre-draw indikatorer fundet i dette datasæt.</p>
                    </div>
                )}
            </PatternCard>
        </div>
    );
};
