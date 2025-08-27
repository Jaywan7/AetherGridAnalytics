
import React from 'react';
import type { PatternAnalysis } from '../../types';
import { PatternCard } from './PatternCard';
import { DormancyTable } from './DormancyTable';

interface TimeBasedPatternsProps {
    patterns: PatternAnalysis;
}

const StatDisplay: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-brand-text-secondary">{label}</dt>
        <dd className="mt-1 text-2xl font-semibold text-brand-primary">{value}</dd>
    </div>
);

export const TimeBasedPatterns: React.FC<TimeBasedPatternsProps> = ({ patterns }) => {
    const { repetitionAnalysis, dormancyAnalysis } = patterns;

    return (
        <div className="space-y-6">
            <PatternCard title="Repetition Analysis" description="How often numbers from the previous draw repeat in the current one.">
                <dl className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
                    <StatDisplay label="Main Number Repeat Rate" value={`${repetitionAnalysis.mainRepeatRate.toFixed(1)}%`} />
                    <StatDisplay label="Double Main Repeat Rate" value={`${repetitionAnalysis.doubleMainRepeatRate.toFixed(1)}%`} />
                    <StatDisplay label="Star Number Repeat Rate" value={`${repetitionAnalysis.starRepeatRate.toFixed(1)}%`} />
                </dl>
            </PatternCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <PatternCard title="Main Number Dormancy" description="How many draws a number has been absent ('sleeping').">
                    <DormancyTable data={dormancyAnalysis.mainNumberDormancy} />
                </PatternCard>
                <PatternCard title="Star Number Dormancy" description="How many draws a star number has been absent.">
                    <DormancyTable data={dormancyAnalysis.starNumberDormancy} />
                </PatternCard>
            </div>
        </div>
    );
};
