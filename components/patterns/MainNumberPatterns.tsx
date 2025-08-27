
import React from 'react';
import type { PatternAnalysis } from '../../types';
import { PatternCard } from './PatternCard';
import { SimpleBarChart } from '../charts/SimpleBarChart';
import { CompanionFinder } from './CompanionFinder';

interface MainNumberPatternsProps {
    patterns: PatternAnalysis;
    validDraws: number;
}

export const MainNumberPatterns: React.FC<MainNumberPatternsProps> = ({ patterns }) => {
    const { zoneAnalysis, spreadAnalysis, companionAnalysis, deltaAnalysis } = patterns;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatternCard title="Zone Analysis" description="How numbers distribute across 5 zones (1-10, 11-20, etc.).">
                {/* FIX: Pass zoneAnalysis.zoneDistribution directly as it's already in the correct format for SimpleBarChart */}
                <SimpleBarChart data={zoneAnalysis.zoneDistribution} barColor="#58A6FF" />
                <div className="text-xs text-brand-text-secondary mt-2 text-center">
                    <p>Hot Zone: <span className="font-semibold text-brand-text-primary">{zoneAnalysis.hotZone}</span> Cold Zone: <span className="font-semibold text-brand-text-primary">{zoneAnalysis.coldZone}</span></p>
                    <p className="mt-1">Draws with 3+ numbers in one zone: <span className="font-semibold text-brand-text-primary">{zoneAnalysis.concentrationStats.threeOrMoreInZone.percentage.toFixed(1)}%</span></p>
                </div>
            </PatternCard>

            <PatternCard title="Spread Analysis (Range)" description="The difference between the highest and lowest number per draw.">
                 <SimpleBarChart data={spreadAnalysis.spreadDistribution} barColor="#238636" />
                 <div className="text-xs text-brand-text-secondary mt-2 text-center">
                    <p>Average Spread: <span className="font-semibold text-brand-text-primary">{spreadAnalysis.averageSpread.toFixed(1)}</span></p>
                    <p className="mt-1">Most Common Range: <span className="font-semibold text-brand-text-primary">{spreadAnalysis.mostCommonSpread}</span></p>
                </div>
            </PatternCard>

            <div className="lg:col-span-2">
                <PatternCard title="Companion Numbers Finder" description="Find which numbers are most frequently drawn together in the same draw.">
                    <CompanionFinder companionData={companionAnalysis.companionData} />
                </PatternCard>
            </div>
            
            <hr className="lg:col-span-2 my-2 border-brand-border" />
            
            <div className="lg:col-span-2">
                <PatternCard title="Delta Analyse: Rytmen Mellem Tallene" description="Analyserer afstanden (delta) mellem sorterede tal for at finde typiske rytmer.">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-1 text-center p-4 bg-brand-bg rounded-lg">
                            <p className="text-sm text-brand-text-secondary">Gennemsnitligt Delta</p>
                            <p className="text-4xl font-bold text-brand-primary mt-2">{deltaAnalysis.averageDelta.toFixed(2)}</p>
                            <p className="text-xs text-brand-text-secondary mt-1">gennemsnitlig afstand mellem tal</p>
                        </div>
                        <div className="md:col-span-2">
                             <SimpleBarChart data={deltaAnalysis.deltaDistribution} barColor="#DB6D28" />
                        </div>
                    </div>
                </PatternCard>
            </div>
        </div>
    );
};
