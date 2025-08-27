
import React from 'react';
import type { PatternAnalysis, StarEvenOddData } from '../../types';
import { PatternCard } from './PatternCard';
import { SimpleBarChart } from '../charts/SimpleBarChart';

interface StarNumberPatternsProps {
    patterns: PatternAnalysis;
    validDraws: number;
}

const StarEvenOddTable: React.FC<{ data: StarEvenOddData[] }> = ({ data }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-brand-text-secondary">
            <thead className="text-xs text-brand-text-secondary uppercase bg-brand-bg">
                <tr>
                    <th scope="col" className="px-4 py-2">Combination</th>
                    <th scope="col" className="px-4 py-2 text-right">Observed</th>
                    <th scope="col" className="px-4 py-2 text-right">Expected</th>
                </tr>
            </thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.combination} className="border-b border-brand-border last:border-b-0">
                        <th scope="row" className="px-4 py-2 font-medium text-brand-text-primary whitespace-nowrap">{item.combination}</th>
                        <td className="px-4 py-2 text-right">{item.percentage.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right">{(item.theoretical * 100).toFixed(2)}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const StarNumberPatterns: React.FC<StarNumberPatternsProps> = ({ patterns }) => {
    const { starSumAnalysis, starEvenOddAnalysis } = patterns;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatternCard title="Star Number Sum" description="Distribution of the sum of the two Star Numbers in each draw. The sum can range from 3 (1+2) to 23 (11+12).">
                <SimpleBarChart data={starSumAnalysis.sumDistribution} barColor="#9E4AD3" />
                 <div className="text-xs text-brand-text-secondary mt-2 text-center">
                    <p>Most Common Sum: <span className="font-semibold text-brand-text-primary">{starSumAnalysis.mostCommonSum}</span></p>
                </div>
            </PatternCard>
            <PatternCard title="Even/Odd Combinations" description="Frequency of Even/Even, Odd/Odd, and mixed pairs.">
                <div className="flex items-center justify-center h-full">
                    <StarEvenOddTable data={starEvenOddAnalysis.evenOddDistribution} />
                </div>
            </PatternCard>
        </div>
    );
};
