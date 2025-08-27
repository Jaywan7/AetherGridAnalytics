
import React, { useMemo } from 'react';
import type { AnalysisResult, HistoricalSuccessAnalysis, PatternTimingAnalysis, WinnerProfile } from '../types';
import { InfoIcon } from './icons/InfoIcon';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { RewindIcon } from './icons/RewindIcon';
import { ModelStatus } from './ModelStatus';
import { NextDrawForecast } from './NextDrawForecast';
import { AetherScoreForecast } from './AetherScoreForecast';
import { InsightCard } from './InsightCard';
import { IntelligentCoupons } from './IntelligentCoupons';
import { Recommendations } from './Recommendations';

interface UnifiedAnalysisDashboardProps {
    analysisResult: AnalysisResult;
    historicalSuccessAnalysis: HistoricalSuccessAnalysis | null;
    patternTimingAnalysis: PatternTimingAnalysis | null;
    fileName: string;
    onReset: () => void;
    predictedNextDrawDate: Date | null;
}

// Sub-component for Panel 1
const WhatActuallyWorkedPanel: React.FC<{
    historicalSuccessAnalysis: HistoricalSuccessAnalysis;
    patternTimingAnalysis: PatternTimingAnalysis;
}> = ({ historicalSuccessAnalysis, patternTimingAnalysis }) => {
    const { hitProfile, totalAnalyzedHits, winnerProfiles } = historicalSuccessAnalysis;
    const { dormancyBreakAnalysis } = patternTimingAnalysis;

    const hitProfileData = Object.entries(hitProfile)
        .map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value }))
        .sort((a, b) => b.value - a.value);

    const factorCombinations = useMemo(() => {
        if (!winnerProfiles || winnerProfiles.length === 0) return [];
        const combos: { [key: string]: number } = {
            "Hot + Overdue": 0,
            "Hot + Momentum": 0,
            "Overdue + Seasonal": 0,
            "Hot Zone + Cluster": 0,
        };
        winnerProfiles.forEach(wp => {
            if (wp.profile.isHot && wp.profile.isOverdue) combos["Hot + Overdue"]++;
            if (wp.profile.isHot && wp.profile.hasMomentum) combos["Hot + Momentum"]++;
            if (wp.profile.isOverdue && wp.profile.isSeasonalHot) combos["Overdue + Seasonal"]++;
            if (wp.profile.isInHotZone && wp.profile.hasClusterStrength) combos["Hot Zone + Cluster"]++;
        });

        return Object.entries(combos).map(([name, count]) => ({
            name,
            value: (count / totalAnalyzedHits) * 100
        })).sort((a,b) => b.value - a.value);

    }, [winnerProfiles, totalAnalyzedHits]);

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6 space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                <div>
                    <h3 className="text-xl font-bold text-white">What Actually Worked</h3>
                    <p className="text-sm text-brand-text-secondary">Historical truth: the DNA of winning numbers.</p>
                </div>
            </div>
            
            <div className="flex-grow space-y-6">
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Vindertals-DNA</h4>
                    <p className="text-xs text-brand-text-secondary mb-2">Based on {totalAnalyzedHits.toLocaleString()} hits. Shows what status a number typically had when it was drawn.</p>
                    <SimpleBarChart data={hitProfileData} barColor="#238636" />
                </div>

                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Top Factor Combinations</h4>
                     <p className="text-xs text-brand-text-secondary mb-2">Percentage of winning numbers that satisfied both conditions.</p>
                    <div className="space-y-2">
                        {factorCombinations.map(combo => (
                            <div key={combo.name} className="flex items-center text-xs">
                                <span className="w-32 text-brand-text-secondary">{combo.name}</span>
                                <div className="flex-1 bg-brand-border rounded-full h-2.5 mr-2">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${combo.value}%` }}></div>
                                </div>
                                <span className="w-10 font-mono text-brand-text-primary">{combo.value.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Timing Signal: Optakt til Dvale-Brud</h4>
                    <div className="flex justify-around items-center gap-4 text-center p-2 bg-brand-bg rounded-lg">
                        <div>
                            <p className="text-xs text-brand-text-secondary">Global Avg. Spread</p>
                            <p className="text-2xl font-bold text-brand-text-primary mt-1">{dormancyBreakAnalysis.globalAvgSpread.toFixed(1)}</p>
                        </div>
                        <div className="text-3xl font-thin text-brand-text-secondary">&rarr;</div>
                        <div>
                            <p className="text-xs text-brand-text-secondary">Avg. Spread Before Break</p>
                            <p className="text-2xl font-bold text-green-400 mt-1">{dormancyBreakAnalysis.avgSpreadBeforeBreak.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Panel 2
const LiveSignalStrengthPanel: React.FC<{
    analysisResult: AnalysisResult;
}> = ({ analysisResult }) => {
    
    const confidence = useMemo(() => {
        if (analysisResult.regimeShiftDetected) {
            return { level: 'Low', color: 'text-yellow-400', reason: 'Regime shift detected. Historical patterns may be less reliable.' };
        }
        const stabilityScores = analysisResult.aetherScores?.mainNumberScores.map(s => s.breakdown.stability || 0) || [];
        const avgStability = stabilityScores.length > 0 ? stabilityScores.reduce((a,b) => a+b, 0) / stabilityScores.length : 0;
        
        if (avgStability > 35) {
            return { level: 'High', color: 'text-green-400', reason: 'Patterns are stable and consistent.' };
        }
        return { level: 'Moderate', color: 'text-blue-400', reason: 'Some volatility detected in number patterns.' };
    }, [analysisResult]);

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6 space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-3">
                <TrendingUpIcon className="w-8 h-8 text-blue-400" />
                <div>
                    <h3 className="text-xl font-bold text-white">Live Signal Strength</h3>
                    <p className="text-sm text-brand-text-secondary">Current forecast and top statistical signals.</p>
                </div>
            </div>
            <div className="flex-grow space-y-6">
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Aether Score Forecast</h4>
                    {analysisResult.aetherScores && <AetherScoreForecast aetherScores={analysisResult.aetherScores} />}
                </div>

                <div>
                     <h4 className="font-semibold text-brand-text-primary mb-2">Model Confidence</h4>
                     <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
                        <p className="text-center">
                            <span className={`text-2xl font-bold ${confidence.color}`}>{confidence.level}</span>
                        </p>
                        <p className="text-center text-xs text-brand-text-secondary mt-1">{confidence.reason}</p>
                     </div>
                </div>

                 <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Top Active Patterns</h4>
                    <div className="space-y-2">
                        {analysisResult.topPatterns.slice(0, 3).map((insight, index) => (
                            <InsightCard key={index} insight={insight} rank={index + 1} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Panel 3
const ReversePatternViewPanel: React.FC<{
    historicalSuccessAnalysis: HistoricalSuccessAnalysis;
    patternTimingAnalysis: PatternTimingAnalysis;
}> = ({ historicalSuccessAnalysis, patternTimingAnalysis }) => {
    const { preDrawIndicators, winnerProfiles } = historicalSuccessAnalysis;
    const { hotStreakAnalysis } = patternTimingAnalysis;
    
    const profileTags = (profile: WinnerProfile['profile']) => {
        const tags = [];
        if (profile.isHot) tags.push({label: 'Hot', color: 'bg-red-500/20 text-red-300'});
        if (profile.isCold) tags.push({label: 'Cold', color: 'bg-blue-500/20 text-blue-300'});
        if (profile.isOverdue) tags.push({label: 'Overdue', color: 'bg-orange-500/20 text-orange-300'});
        if (profile.hasMomentum) tags.push({label: 'Momentum', color: 'bg-cyan-500/20 text-cyan-300'});
        if (profile.isSeasonalHot) tags.push({label: 'Seasonal', color: 'bg-teal-500/20 text-teal-300'});
        return tags;
    }

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6 space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-3">
                <RewindIcon className="w-8 h-8 text-orange-400" />
                <div>
                    <h3 className="text-xl font-bold text-white">Reverse Pattern View</h3>
                    <p className="text-sm text-brand-text-secondary">Looking backwards from winning draws to find clues.</p>
                </div>
            </div>
            <div className="flex-grow space-y-6">
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Pre-Draw Indicators</h4>
                    {preDrawIndicators.length > 0 ? (
                        <div className="space-y-2">
                            {preDrawIndicators.slice(0, 2).map((indicator, i) => (
                                <div key={i} className="flex items-start gap-2 p-3 bg-brand-bg rounded-lg">
                                    <InfoIcon className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-brand-text-secondary">{indicator.insight}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-brand-text-secondary text-center p-4 bg-brand-bg rounded-lg">No strong pre-draw indicators found.</p>
                    )}
                </div>

                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Winner Backtrack</h4>
                    <p className="text-xs text-brand-text-secondary mb-2">The profile of the last few winning numbers at the time they were drawn.</p>
                    <div className="space-y-2">
                        {[...winnerProfiles].slice(-5).reverse().map((wp, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-brand-bg rounded-lg">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono font-bold text-sm">{wp.winningNumber}</div>
                                <div className="flex flex-wrap gap-1 flex-1">
                                    {profileTags(wp.profile).map(tag => (
                                        <span key={tag.label} className={`px-1.5 py-0.5 rounded text-xs font-semibold ${tag.color}`}>{tag.label}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-2">Hot Streak Analysis</h4>
                    <div className="flex justify-around items-center gap-4 text-center p-2 bg-brand-bg rounded-lg">
                        <div>
                            <p className="text-xs text-brand-text-secondary">Avg. Streak</p>
                            <p className="text-2xl font-bold text-brand-text-primary mt-1">{hotStreakAnalysis.averageStreakDuration.toFixed(1)}</p>
                        </div>
                        <div className="border-l border-brand-border h-10"></div>
                        <div>
                            <p className="text-xs text-brand-text-secondary">Longest Streak</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono font-bold text-sm">{hotStreakAnalysis.longestStreak.number}</div>
                                <p className="text-2xl font-bold text-brand-text-primary">{hotStreakAnalysis.longestStreak.duration}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const UnifiedAnalysisDashboard: React.FC<UnifiedAnalysisDashboardProps> = ({
    analysisResult,
    historicalSuccessAnalysis,
    patternTimingAnalysis,
    fileName,
    onReset,
    predictedNextDrawDate,
}) => {
    
    return (
        <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Unified Analysis Dashboard</h2>
                    <p className="mt-1 text-md text-brand-text-secondary">
                        A consolidated intelligence view for <span className="font-medium text-brand-primary">{fileName}</span>
                    </p>
                </div>
                 <button 
                    onClick={onReset}
                    className="px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors text-sm font-medium self-start md:self-center">
                    Analyze Another File
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {predictedNextDrawDate && (
                    <NextDrawForecast predictedDate={predictedNextDrawDate} />
                )}
                {analysisResult?.optimalWeights && (
                    <ModelStatus 
                        weights={analysisResult.optimalWeights}
                        regimeShiftDetected={analysisResult.regimeShiftDetected || false}
                    />
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {historicalSuccessAnalysis && patternTimingAnalysis ? (
                    <WhatActuallyWorkedPanel 
                        historicalSuccessAnalysis={historicalSuccessAnalysis} 
                        patternTimingAnalysis={patternTimingAnalysis} 
                    />
                ) : <div className="bg-brand-surface border border-brand-border rounded-lg p-6 text-center text-brand-text-secondary">Loading Historical Data...</div>}
                
                {analysisResult ? (
                    <LiveSignalStrengthPanel analysisResult={analysisResult} />
                ) : <div className="bg-brand-surface border border-brand-border rounded-lg p-6 text-center text-brand-text-secondary">Loading Live Signals...</div>}

                {historicalSuccessAnalysis && patternTimingAnalysis ? (
                    <ReversePatternViewPanel 
                        historicalSuccessAnalysis={historicalSuccessAnalysis}
                        patternTimingAnalysis={patternTimingAnalysis}
                    />
                ) : <div className="bg-brand-surface border border-brand-border rounded-lg p-6 text-center text-brand-text-secondary">Loading Reverse Patterns...</div>}
            </div>
            
            <div className="space-y-12 pt-8">
                {analysisResult.intelligentCoupons && analysisResult.intelligentCoupons.length > 0 && <IntelligentCoupons coupons={analysisResult.intelligentCoupons} />}
                {analysisResult.strategies && analysisResult.strategies.length > 0 && (
                    <Recommendations strategies={analysisResult.strategies} />
                )}
            </div>
        </div>
    );
};
