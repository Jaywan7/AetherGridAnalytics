

import React, { useState } from 'react';
// FIX: Add PatternTimingAnalysis to the type import
import type { AnalysisResult, PerformancePoint, PerformanceLogItem, ForecastPerformanceInsight, PerformanceBreakdown, HistoricalSuccessAnalysis, PatternTimingAnalysis } from '../types';
import type { ActiveDataset } from '../App';
import { StatCard } from './StatCard';
import { InsightCard } from './InsightCard';
import { InfoIcon } from './icons/InfoIcon';
import { AdvancedPatterns } from './AdvancedPatterns';
import { Recommendations } from './Recommendations';
import { AetherScoreForecast } from './AetherScoreForecast';
import { IntelligentCoupons } from './IntelligentCoupons';
import { ComparativeInsight } from './ComparativeInsight';
import { SequentialPerformanceView } from './SequentialPerformanceView';
import { HistoricalSuccessView } from './HistoricalSuccessView';
import { SeasonalInsights } from './SeasonalInsights';
import { ModelStatus } from './ModelStatus';
import { MetaPatternInsights } from './MetaPatternInsights';
import { NextDrawForecast } from './NextDrawForecast';
// FIX: Import PatternTimingView component
import { PatternTimingView } from './PatternTimingView';

interface DashboardProps {
    analysisResults: {
        total: AnalysisResult;
        tuesday: AnalysisResult | null;
        friday: AnalysisResult | null;
    };
    activeDataset: ActiveDataset;
    setActiveDataset: (dataset: ActiveDataset) => void;
    performanceTimeline: PerformancePoint[] | null;
    performanceLog: PerformanceLogItem[] | null;
    forecastPerformanceInsight: ForecastPerformanceInsight | null;
    performanceBreakdown: PerformanceBreakdown | null;
    historicalSuccessAnalysis: HistoricalSuccessAnalysis | null;
    // FIX: Add missing patternTimingAnalysis prop
    patternTimingAnalysis: PatternTimingAnalysis | null;
    fileName: string;
    onReset: () => void;
    predictedNextDrawDate: Date | null;
}

// FIX: Add 'pattern-timing' to the ActiveView type
type ActiveView = 'analysis' | 'model-validity' | 'historical-success' | 'pattern-timing';

interface AnalysisContentProps {
    analysisResult: AnalysisResult;
    tuesdayAnalysis: AnalysisResult | null;
    fridayAnalysis: AnalysisResult | null;
    totalAnalysis: AnalysisResult;
}

const AnalysisContent: React.FC<AnalysisContentProps> = ({ analysisResult, tuesdayAnalysis, fridayAnalysis, totalAnalysis }) => {
    const { totalRows, validDraws, topPatterns, patternAnalysis, strategies, aetherScores, intelligentCoupons, seasonalAnalysis, metaPatternAnalysis } = analysisResult;
    const invalidRows = totalRows - validDraws;
    return (
         <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="CSV Rows Processed" value={totalRows.toLocaleString()} />
                <StatCard title="Valid Draws in View" value={validDraws.toLocaleString()} />
                <StatCard title="Invalid Rows Skipped" value={invalidRows.toLocaleString()} />
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-lg p-4 flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-text-secondary">
                    <span className="font-semibold text-brand-text-primary">Hard Rules Analysis:</span> All historical data is analyzed against the current Eurojackpot rules (Main: 1-50, Stars: 1-12). This provides a forward-looking perspective on statistical deviations.
                </p>
            </div>

            <div>
                 <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Top 10 Vigtigste Mønstre (Hard Rules)</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {topPatterns.map((insight, index) => (
                        <InsightCard key={index} insight={insight} rank={index + 1} />
                    ))}
                 </div>
            </div>
            
            {aetherScores && <AetherScoreForecast aetherScores={aetherScores} />}
            
            {tuesdayAnalysis && fridayAnalysis && aetherScores && (
                <ComparativeInsight 
                    tuesdayAnalysis={tuesdayAnalysis}
                    fridayAnalysis={fridayAnalysis}
                    totalAnalysis={totalAnalysis}
                />
            )}
            
            {intelligentCoupons && intelligentCoupons.length > 0 && <IntelligentCoupons coupons={intelligentCoupons} />}

            {seasonalAnalysis && (
                <SeasonalInsights seasonalAnalysis={seasonalAnalysis} />
            )}

            {patternAnalysis && (
                <AdvancedPatterns patterns={patternAnalysis} validDraws={validDraws} />
            )}
            
            {metaPatternAnalysis && (
                 <div className="mt-12">
                    <MetaPatternInsights metaAnalysis={metaPatternAnalysis} />
                 </div>
            )}
            
            {strategies && strategies.length > 0 && (
                <Recommendations strategies={strategies} />
            )}
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    analysisResults, 
    activeDataset, 
    setActiveDataset, 
    performanceTimeline, 
    performanceLog, 
    forecastPerformanceInsight,
    performanceBreakdown,
    historicalSuccessAnalysis,
    // FIX: Destructure patternTimingAnalysis from props
    patternTimingAnalysis,
    fileName, 
    onReset,
    predictedNextDrawDate
}) => {
    const [activeView, setActiveView] = useState<ActiveView>('analysis');

    const analysisToDisplay = activeDataset === 'tuesday' ? analysisResults.tuesday :
                              activeDataset === 'friday' ? analysisResults.friday :
                              analysisResults.total;
    
    const tabs: { key: string; label: string, disabled: boolean }[] = [
        { key: 'total', label: 'Samlet Analyse', disabled: false },
        { key: 'tuesday', label: 'Kun Tirsdage', disabled: !analysisResults.tuesday },
        { key: 'friday', label: 'Kun Fredage', disabled: !analysisResults.friday },
        { key: 'model-validity', label: 'Model Validitet', disabled: !performanceTimeline || performanceTimeline.length === 0 || !performanceLog || !forecastPerformanceInsight },
        { key: 'historical-success', label: 'Historisk Succes', disabled: !historicalSuccessAnalysis},
        // FIX: Add 'Pattern Timing' tab
        { key: 'pattern-timing', label: 'Tidsmæssig Analyse', disabled: !patternTimingAnalysis },
    ];

    const getDrawCount = (tabKey: ActiveDataset): number => {
        switch (tabKey) {
            case 'total':
                return analysisResults.total.validDraws;
            case 'tuesday':
                return analysisResults.tuesday?.validDraws || 0;
            case 'friday':
                return analysisResults.friday?.validDraws || 0;
            default:
                return 0;
        }
    };
    
    // FIX: Update handleTabClick to handle the new view
    const handleTabClick = (key: string) => {
        if (key === 'model-validity') {
            setActiveView('model-validity');
        } else if (key === 'historical-success') {
            setActiveView('historical-success');
        } else if (key === 'pattern-timing') {
            setActiveView('pattern-timing');
        } else {
            setActiveView('analysis');
            setActiveDataset(key as ActiveDataset);
        }
    };

    // FIX: Update isTabActive to handle the new view
    const isTabActive = (key: string): boolean => {
        if (key === 'model-validity') return activeView === 'model-validity';
        if (key === 'historical-success') return activeView === 'historical-success';
        if (key === 'pattern-timing') return activeView === 'pattern-timing';
        return activeView === 'analysis' && activeDataset === key;
    };

    // FIX: Update renderContent to render PatternTimingView
    const renderContent = () => {
        switch(activeView) {
            case 'model-validity':
                return <SequentialPerformanceView performanceTimeline={performanceTimeline!} performanceLog={performanceLog!} forecastPerformanceInsight={forecastPerformanceInsight!} performanceBreakdown={performanceBreakdown!} />;
            case 'historical-success':
                return <HistoricalSuccessView analysis={historicalSuccessAnalysis!} />;
            case 'pattern-timing':
                return <PatternTimingView analysis={patternTimingAnalysis!} />;
            case 'analysis':
            default:
                return analysisToDisplay ? (
                    <AnalysisContent 
                        analysisResult={analysisToDisplay} 
                        tuesdayAnalysis={analysisResults.tuesday}
                        fridayAnalysis={analysisResults.friday}
                        totalAnalysis={analysisResults.total}
                    />
                ) : (
                    <div className="text-center py-16 bg-brand-surface border border-brand-border rounded-lg">
                        <h3 className="text-lg font-semibold text-brand-text-primary">No Data Available</h3>
                        <p className="text-brand-text-secondary mt-1">There were no valid draws found for this specific day or for comparison.</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Analyse Dashboard</h2>
                    <p className="mt-1 text-md text-brand-text-secondary">
                        Prognose og Mønstergenkendelse for <span className="font-medium text-brand-primary">{fileName}</span>
                    </p>
                </div>
                 <button 
                    onClick={onReset}
                    className="px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors text-sm font-medium self-start md:self-center">
                    Analyze Another File
                </button>
            </div>

            <div className="space-y-4">
                {predictedNextDrawDate && (
                    <NextDrawForecast predictedDate={predictedNextDrawDate} />
                )}
                {analysisToDisplay?.optimalWeights && activeView === 'analysis' && (
                    <ModelStatus 
                        weights={analysisToDisplay.optimalWeights}
                        regimeShiftDetected={analysisToDisplay.regimeShiftDetected || false}
                    />
                )}
            </div>
            
            <div className="border-b border-brand-border">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            disabled={tab.disabled}
                            className={`${
                                isTabActive(tab.key)
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-text-secondary'
                            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                            aria-current={isTabActive(tab.key) ? 'page' : undefined}
                        >
                           {/* FIX: Add 'pattern-timing' to the condition for displaying draw count */}
                           {tab.label} {tab.key !== 'model-validity' && tab.key !== 'historical-success' && tab.key !== 'pattern-timing' && (tab.disabled ? '(N/A)' : `(${getDrawCount(tab.key as ActiveDataset)})`)}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                 {renderContent()}
            </div>
        </div>
    );
};
