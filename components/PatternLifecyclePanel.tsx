import React, { useMemo } from 'react';
import type { HistoricalSuccessAnalysis, HistoricalSuccessProfile } from '../types';
import { calculateHitProfile } from '../services/historicalSuccessService';
import { PatternCard } from './patterns/PatternCard';
import { ArrowTrendingUpIcon } from './icons/ArrowTrendingUpIcon';
import { ArrowTrendingDownIcon } from './icons/ArrowTrendingDownIcon';

interface PatternLifecyclePanelProps {
    historicalSuccessAnalysis: HistoricalSuccessAnalysis;
}

// FIX: Add companion and stability to the labels
const factorLabels: Record<keyof HistoricalSuccessProfile, string> = {
    hot: 'Hot Numbers',
    cold: 'Cold Numbers',
    overdue: 'Overdue',
    hotZone: 'Hot Zone',
    momentum: 'Momentum',
    cluster: 'Cluster',
    seasonal: 'Seasonal',
    companion: 'Companion',
    stability: 'Stability',
};

const FactorTrend: React.FC<{
    name: string;
    overall: number;
    recent: number;
}> = ({ name, overall, recent }) => {
    const diff = recent - overall;
    const TrendIcon = diff >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
    const diffColor = diff > 0.5 ? 'text-green-400' : diff < -0.5 ? 'text-red-400' : 'text-brand-text-secondary';
    const maxVal = Math.max(overall, recent, 1);

    return (
        <div className="flex items-center gap-4 py-2">
            <div className="w-1/4 text-sm text-brand-text-primary font-medium">{name}</div>
            <div className="w-1/2">
                <div className="w-full bg-brand-surface rounded-full h-2 mb-1">
                    <div className="bg-brand-text-secondary h-2 rounded-full" style={{ width: `${(overall / maxVal) * 100}%` }}></div>
                </div>
                <div className="w-full bg-brand-surface rounded-full h-2">
                    <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${(recent / maxVal) * 100}%` }}></div>
                </div>
            </div>
            <div className={`w-1/4 flex items-center gap-2 font-semibold ${diffColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{diff > 0 ? '+' : ''}{diff.toFixed(1)}%</span>
            </div>
        </div>
    )
}


export const PatternLifecyclePanel: React.FC<PatternLifecyclePanelProps> = ({ historicalSuccessAnalysis }) => {
    const { overallProfile, recentProfile } = useMemo(() => {
        const RECENT_WINDOW_SIZE = 50;
        const winnerProfiles = historicalSuccessAnalysis.winnerProfiles;

        if (winnerProfiles.length < RECENT_WINDOW_SIZE) {
            return { overallProfile: null, recentProfile: null };
        }
        
        const overall = historicalSuccessAnalysis.hitProfile;
        const recentProfiles = winnerProfiles.slice(-RECENT_WINDOW_SIZE);
        const recent = calculateHitProfile(recentProfiles);
        
        return { overallProfile: overall, recentProfile: recent };

    }, [historicalSuccessAnalysis]);

    if (!overallProfile || !recentProfile) {
        return null;
    }

    const factors = Object.keys(factorLabels) as Array<keyof HistoricalSuccessProfile>;

    return (
        <PatternCard 
            title="Pattern Lifecycle: What's Trending?"
            description="Compares the success rate of different number profiles between the full history and the most recent 50 winning draws."
        >
            <div className="flex text-xs text-brand-text-secondary mb-2">
                <div className="w-1/4">Factor</div>
                <div className="w-1/2">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-brand-text-secondary"></span> Overall
                        <span className="w-3 h-3 rounded-full bg-brand-primary ml-2"></span> Recent
                    </div>
                </div>
                <div className="w-1/4">Change</div>
            </div>
            <div className="divide-y divide-brand-border">
                {factors.filter(f => f !== 'cold').map(factor => (
                     <FactorTrend
                        key={factor}
                        name={factorLabels[factor]}
                        overall={overallProfile[factor]}
                        recent={recentProfile[factor]}
                    />
                ))}
            </div>
        </PatternCard>
    );
};