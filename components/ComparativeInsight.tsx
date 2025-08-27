
import React, { useMemo, useState } from 'react';
import type { AnalysisResult } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { MAIN_NUMBER_MAX } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InfoIcon } from './icons/InfoIcon';

interface ComparativeInsightProps {
    totalAnalysis: AnalysisResult;
    tuesdayAnalysis: AnalysisResult;
    fridayAnalysis: AnalysisResult;
}

interface ComparedNumber {
    number: number;
    totalScore: number;
    tuesdayScore: number;
    fridayScore: number;
    tueVsTotal: number;
    friVsTotal: number;
    tueVsFri: number; // positive = stronger on Tue, negative = stronger on Fri
}

const ScoreChange: React.FC<{ change: number }> = ({ change }) => {
    if (Math.abs(change) < 1) {
        return <span className="text-brand-text-secondary">-</span>;
    }
    const color = change > 0 ? 'text-green-400' : 'text-red-400';
    const sign = change > 0 ? '+' : '';
    return <span className={`text-xs ${color}`}>({sign}{change.toFixed(0)})</span>;
};

const BiggestIncrease: React.FC<{ change: number }> = ({ change }) => {
    if (Math.abs(change) < 5) {
        return <span className="text-brand-text-secondary text-center">-</span>;
    }
    const winner = change > 0 ? 'Tirsdag' : 'Fredag';
    const loser = change > 0 ? 'Fredag' : 'Tirsdag';
    const color = change > 0 ? 'text-blue-400' : 'text-yellow-400';
    return (
        <span className={`font-semibold ${color}`}>
            {winner} (+{Math.abs(change).toFixed(0)} vs {loser})
        </span>
    );
};

const ComparisonRow: React.FC<{ metric: string; total: string; tue: string; fri: string; }> = ({ metric, total, tue, fri }) => (
    <tr className="border-t border-brand-border">
        <th scope="row" className="p-3 font-medium text-brand-text-primary whitespace-nowrap">{metric}</th>
        <td className="p-3 text-brand-text-secondary">{total}</td>
        <td className="p-3 text-blue-400 font-medium">{tue}</td>
        <td className="p-3 text-yellow-400 font-medium">{fri}</td>
    </tr>
);

export const ComparativeInsight: React.FC<ComparativeInsightProps> = ({ totalAnalysis, tuesdayAnalysis, fridayAnalysis }) => {
    const [sortConfig, setSortConfig] = useState<{ key: keyof ComparedNumber; direction: 'asc' | 'desc' }>({ key: 'tueVsFri', direction: 'desc' });
    
    const comparedData = useMemo((): ComparedNumber[] => {
        const totalScores = new Map(totalAnalysis.aetherScores?.mainNumberScores.map(s => [s.number, s.score]));
        const tueScores = new Map(tuesdayAnalysis.aetherScores?.mainNumberScores.map(s => [s.number, s.score]));
        const friScores = new Map(fridayAnalysis.aetherScores?.mainNumberScores.map(s => [s.number, s.score]));

        const data: ComparedNumber[] = [];
        for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
            const totalScore = totalScores.get(i) || 0;
            const tuesdayScore = tueScores.get(i) || 0;
            const fridayScore = friScores.get(i) || 0;
            data.push({
                number: i,
                totalScore,
                tuesdayScore,
                fridayScore,
                tueVsTotal: tuesdayScore - totalScore,
                friVsTotal: fridayScore - totalScore,
                tueVsFri: tuesdayScore - fridayScore,
            });
        }
        return data;
    }, [totalAnalysis, tuesdayAnalysis, fridayAnalysis]);

    const sortedData = useMemo(() => {
        const sortableData = [...comparedData];
        sortableData.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            // Special case for tueVsFri to sort by absolute value
            if (sortConfig.key === 'tueVsFri') {
                aVal = Math.abs(aVal);
                bVal = Math.abs(bVal);
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableData;
    }, [comparedData, sortConfig]);

    const divergenceSummary = useMemo((): string => {
        const insights: string[] = [];
        const tuePatterns = tuesdayAnalysis.patternAnalysis;
        const friPatterns = fridayAnalysis.patternAnalysis;

        if (friPatterns.deltaAnalysis.averageDelta > tuePatterns.deltaAnalysis.averageDelta * 1.1) {
            insights.push("Fredags-trækninger har en tendens til at have en mere 'kaotisk' og spredt rytme med større afstand mellem tallene.");
        }
        if (tuePatterns.spreadAnalysis.averageSpread > friPatterns.spreadAnalysis.averageSpread * 1.1) {
            insights.push("Tirsdags-trækninger har tendens til at være mere 'ekstreme', med en større afstand mellem det laveste og højeste tal.");
        }
        if (friPatterns.repetitionAnalysis.starRepeatRate > tuePatterns.repetitionAnalysis.starRepeatRate + 10) {
            insights.push("Stjernetallene er mere 'stabile' om fredagen, med en markant større tendens til at blive gentaget.");
        }
        
        if (insights.length === 0) {
            return "De overordnede mønstre for spredning og gentagelse er bemærkelsesværdigt ens på tværs af begge dage, hvilket tyder på en konsistent trækning-dynamik.";
        }
        return insights.join(' ');
    }, [tuesdayAnalysis, fridayAnalysis]);

    const requestSort = (key: keyof ComparedNumber) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: keyof ComparedNumber, label: string, className?: string }> = ({ sortKey, label, className = '' }) => {
        const isActive = sortConfig.key === sortKey;
        const isDesc = sortConfig.direction === 'desc';
        return (
            <th scope="col" className={`p-2 cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-1">
                    {label}
                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${isActive ? 'opacity-100' : 'opacity-30'} ${isDesc ? '' : 'rotate-180'}`} />
                </div>
            </th>
        );
    }
    
    return (
        <div className="space-y-6">
            <PatternCard title="Comparative Insight: Aether Score Performance" description="Analyse af hvordan hvert tals Aether Score ændrer sig baseret på trækningsdagen. Identificerer tal der er markant stærkere på en bestemt dag.">
                <div className="overflow-y-auto max-h-96">
                     <table className="w-full text-sm text-left table-fixed">
                        <thead className="text-xs text-brand-text-secondary uppercase sticky top-0 bg-brand-surface">
                            <tr>
                                <SortableHeader sortKey="number" label="Tal" className="w-16" />
                                <SortableHeader sortKey="totalScore" label="Samlet Score" />
                                <SortableHeader sortKey="tuesdayScore" label="Tirsdags-Score" />
                                <SortableHeader sortKey="fridayScore" label="Fredags-Score" />
                                <SortableHeader sortKey="tueVsFri" label="Største Stigning" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {sortedData.map(item => (
                                <tr key={item.number}>
                                    <td className="p-2 font-bold text-brand-text-primary text-center">
                                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono">
                                            {item.number}
                                        </div>
                                    </td>
                                    <td className="p-2 text-brand-text-secondary">{item.totalScore.toFixed(0)}</td>
                                    <td className="p-2 text-brand-text-primary font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span>{item.tuesdayScore.toFixed(0)}</span>
                                            <ScoreChange change={item.tueVsTotal} />
                                        </div>
                                    </td>
                                    <td className="p-2 text-brand-text-primary font-semibold">
                                        <div className="flex items-center gap-2">
                                            <span>{item.fridayScore.toFixed(0)}</span>
                                            <ScoreChange change={item.friVsTotal} />
                                        </div>
                                    </td>
                                    <td className="p-2 text-brand-text-secondary">
                                        <BiggestIncrease change={item.tueVsFri} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            </PatternCard>
             <PatternCard title="Pattern Divergence: Day-Specific Dynamics" description="A side-by-side look at key statistical indicators for each day to find unique 'personalities'.">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th scope="col" className="p-3">Metric</th>
                                <th scope="col" className="p-3">Samlet</th>
                                <th scope="col" className="p-3">Tirsdag</th>
                                <th scope="col" className="p-3">Fredag</th>
                            </tr>
                        </thead>
                        <tbody>
                            <ComparisonRow 
                                metric="Average Delta"
                                total={totalAnalysis.patternAnalysis.deltaAnalysis.averageDelta.toFixed(2)}
                                tue={tuesdayAnalysis.patternAnalysis.deltaAnalysis.averageDelta.toFixed(2)}
                                fri={fridayAnalysis.patternAnalysis.deltaAnalysis.averageDelta.toFixed(2)}
                            />
                             <ComparisonRow 
                                metric="Average Spread"
                                total={totalAnalysis.patternAnalysis.spreadAnalysis.averageSpread.toFixed(1)}
                                tue={tuesdayAnalysis.patternAnalysis.spreadAnalysis.averageSpread.toFixed(1)}
                                fri={fridayAnalysis.patternAnalysis.spreadAnalysis.averageSpread.toFixed(1)}
                            />
                             <ComparisonRow 
                                metric="Main Repeat Rate"
                                total={`${totalAnalysis.patternAnalysis.repetitionAnalysis.mainRepeatRate.toFixed(1)}%`}
                                tue={`${tuesdayAnalysis.patternAnalysis.repetitionAnalysis.mainRepeatRate.toFixed(1)}%`}
                                fri={`${fridayAnalysis.patternAnalysis.repetitionAnalysis.mainRepeatRate.toFixed(1)}%`}
                            />
                             <ComparisonRow 
                                metric="Star Repeat Rate"
                                total={`${totalAnalysis.patternAnalysis.repetitionAnalysis.starRepeatRate.toFixed(1)}%`}
                                tue={`${tuesdayAnalysis.patternAnalysis.repetitionAnalysis.starRepeatRate.toFixed(1)}%`}
                                fri={`${fridayAnalysis.patternAnalysis.repetitionAnalysis.starRepeatRate.toFixed(1)}%`}
                            />
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 pt-4 border-t border-brand-border">
                    <h4 className="text-md font-semibold text-brand-text-primary mb-2">Konklusion</h4>
                     <div className="flex items-start gap-3 text-sm text-brand-text-secondary bg-brand-bg p-4 rounded-lg">
                        <InfoIcon className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <p>{divergenceSummary}</p>
                    </div>
                </div>
            </PatternCard>
        </div>
    );
};
