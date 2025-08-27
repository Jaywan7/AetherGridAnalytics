
import React from 'react';
import type { PatternInsight } from '../types';
import { InfoIcon } from './icons/InfoIcon';

interface InsightCardProps {
    insight: PatternInsight;
    rank: number;
}

const formatDeviation = (deviation: number): { text: string; colorClass: string } => {
    if (Math.abs(deviation) < 0.1) {
        return { text: "As expected", colorClass: 'text-brand-text-secondary' };
    }
    
    const percentage = Math.abs(deviation).toFixed(0);
    if (deviation > 0) {
        return { text: `${percentage}% over expectation`, colorClass: 'text-blue-400' };
    } else {
        return { text: `${percentage}% under expectation`, colorClass: 'text-orange-400' };
    }
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, rank }) => {
    const { text, colorClass } = formatDeviation(insight.deviation);

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-5 flex items-start gap-4">
            <div className="flex-shrink-0 bg-brand-bg border border-brand-border rounded-full h-8 w-8 flex items-center justify-center font-bold text-brand-text-primary text-sm">
                {rank}
            </div>
            <div className="flex-grow">
                <h4 className="font-semibold text-brand-text-primary">{insight.title}</h4>
                <p className="text-sm text-brand-text-secondary mt-1">{insight.detail}</p>
                <div className={`mt-2 text-sm font-medium flex items-center gap-1.5 ${colorClass}`}>
                    <InfoIcon className="w-4 h-4" />
                    <span>Deviation: {text}</span>
                </div>
            </div>
        </div>
    );
};
