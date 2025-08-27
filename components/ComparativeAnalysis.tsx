
import React from 'react';
import type { AnalysisResult } from '../types';
import { PatternCard } from './patterns/PatternCard';

interface ComparativeAnalysisProps {
    tuesdayAnalysis: AnalysisResult;
    fridayAnalysis: AnalysisResult;
}

const StatRow: React.FC<{ label: string, tueValue: string | number, friValue: string | number }> = ({ label, tueValue, friValue }) => (
    <tr className="border-b border-brand-border last:border-b-0">
        <th scope="row" className="p-3 font-medium text-brand-text-secondary">{label}</th>
        <td className="p-3 text-center font-mono text-brand-text-primary">{tueValue}</td>
        <td className="p-3 text-center font-mono text-brand-text-primary">{friValue}</td>
    </tr>
);

const getHottestNumber = (analysis: AnalysisResult): number => {
    if (!analysis.mainNumberFrequencies || analysis.mainNumberFrequencies.length === 0) return 0;
    return [...analysis.mainNumberFrequencies].sort((a, b) => b.count - a.count)[0].number as number;
};

const getColdestNumber = (analysis: AnalysisResult): number => {
    if (!analysis.mainNumberFrequencies || analysis.mainNumberFrequencies.length === 0) return 0;
    return [...analysis.mainNumberFrequencies].sort((a, b) => a.count - b.count)[0].number as number;
};

export const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ tuesdayAnalysis, fridayAnalysis }) => {
    return (
        <PatternCard 
            title="Comparative Analysis: Tuesday vs. Friday"
            description="A direct comparison of key statistical metrics between the two draw days to highlight significant deviations."
        >
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-brand-bg">
                        <tr>
                            <th scope="col" className="p-3">Metric</th>
                            <th scope="col" className="p-3 text-center">Tuesday Draws</th>
                            <th scope="col" className="p-3 text-center">Friday Draws</th>
                        </tr>
                    </thead>
                    <tbody>
                        <StatRow label="Total Draws Analyzed" tueValue={tuesdayAnalysis.validDraws.toLocaleString()} friValue={fridayAnalysis.validDraws.toLocaleString()} />
                        <StatRow label="Average Spread (Range)" tueValue={tuesdayAnalysis.patternAnalysis.spreadAnalysis.averageSpread.toFixed(1)} friValue={fridayAnalysis.patternAnalysis.spreadAnalysis.averageSpread.toFixed(1)} />
                        <StatRow label="Most Common Zone" tueValue={tuesdayAnalysis.patternAnalysis.zoneAnalysis.hotZone} friValue={fridayAnalysis.patternAnalysis.zoneAnalysis.hotZone} />
                        <StatRow label="Hottest Main Number" tueValue={getHottestNumber(tuesdayAnalysis)} friValue={getHottestNumber(fridayAnalysis)} />
                        <StatRow label="Coldest Main Number" tueValue={getColdestNumber(tuesdayAnalysis)} friValue={getColdestNumber(fridayAnalysis)} />
                        <StatRow label="Main Repeat Rate" tueValue={`${tuesdayAnalysis.patternAnalysis.repetitionAnalysis.mainRepeatRate.toFixed(1)}%`} friValue={`${fridayAnalysis.patternAnalysis.repetitionAnalysis.mainRepeatRate.toFixed(1)}%`} />
                        <StatRow label="Star Repeat Rate" tueValue={`${tuesdayAnalysis.patternAnalysis.repetitionAnalysis.starRepeatRate.toFixed(1)}%`} friValue={`${fridayAnalysis.patternAnalysis.repetitionAnalysis.starRepeatRate.toFixed(1)}%`} />
                        <StatRow label="Most Common Star Sum" tueValue={tuesdayAnalysis.patternAnalysis.starSumAnalysis.mostCommonSum} friValue={fridayAnalysis.patternAnalysis.starSumAnalysis.mostCommonSum} />
                    </tbody>
                </table>
            </div>
        </PatternCard>
    );
};