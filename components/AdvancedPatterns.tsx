
import React from 'react';
import type { PatternAnalysis, MomentumData, ClusterStrengthData } from '../types';
import { Tabs, Tab } from './Tabs';
import { MainNumberPatterns } from './patterns/MainNumberPatterns';
import { StarNumberPatterns } from './patterns/StarNumberPatterns';
import { TimeBasedPatterns } from './patterns/TimeBasedPatterns';
import { PatternCard } from './patterns/PatternCard';

interface AdvancedPatternsProps {
    patterns: PatternAnalysis;
    validDraws: number;
}

const IndicatorTable: React.FC<{ data: (MomentumData | ClusterStrengthData)[], valueKey: 'momentumScore' | 'clusterScore', title: string }> = ({ data, valueKey, title }) => (
     <div className="overflow-y-auto h-80">
        <table className="w-full text-sm text-left table-fixed">
            <thead className="text-xs text-brand-text-secondary uppercase sticky top-0 bg-brand-surface">
                <tr>
                    <th className="p-2 w-20">Tal</th>
                    <th className="p-2">{title}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
                {data.map((item) => (
                    <tr key={item.number}>
                        <td className="p-2 font-bold text-brand-text-primary text-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono">
                                {item.number}
                            </div>
                        </td>
                        <td className="p-2 text-brand-text-primary font-mono">
                           {(item as any)[valueKey].toFixed(2)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const PredictiveIndicators: React.FC<{ patterns: PatternAnalysis }> = ({ patterns }) => {
    const sortedMomentum = [...patterns.momentumAnalysis]
        .filter(m => m.momentumScore > 0)
        .sort((a, b) => b.momentumScore - a.momentumScore)
        .slice(0, 20);
        
    const sortedClusters = [...patterns.clusterStrengthAnalysis]
        .filter(c => c.clusterScore > 0)
        .sort((a, b) => b.clusterScore - a.clusterScore)
        .slice(0, 20);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatternCard title="Momentum Analyse (Stigende Stjerner)" description="Tal, der er trukket markant oftere i de seneste 25 trækninger end i deres langsigtede historik.">
                <IndicatorTable data={sortedMomentum} valueKey="momentumScore" title="Momentum Score" />
            </PatternCard>
            <PatternCard title="Klynge-Styrke (Stærke Netværk)" description="Tal, hvis tætteste følgetal har været aktive for nylig, hvilket indikerer at deres 'netværk' er varmt.">
                 <IndicatorTable data={sortedClusters} valueKey="clusterScore" title="Klynge Score" />
            </PatternCard>
        </div>
    );
};

export const AdvancedPatterns: React.FC<AdvancedPatternsProps> = ({ patterns, validDraws }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Advanced Pattern Recognition</h2>
                <p className="mt-1 text-md text-brand-text-secondary">
                    Deeper insights into number behavior and relationships across all draws.
                </p>
            </div>
            <Tabs>
                <Tab label="Main Number Patterns">
                    <MainNumberPatterns patterns={patterns} validDraws={validDraws} />
                </Tab>
                <Tab label="Star Number Patterns">
                    <StarNumberPatterns patterns={patterns} validDraws={validDraws} />
                </Tab>
                <Tab label="Time-based Patterns">
                    <TimeBasedPatterns patterns={patterns} />
                </Tab>
                <Tab label="Prædiktive Indikatorer">
                    <PredictiveIndicators patterns={patterns} />
                </Tab>
            </Tabs>
        </div>
    );
};
