
import React, 'react';
import { useState, useMemo } from 'react';
import type { FullAnalysisBundle, AnalysisResult, MegaAnalysisBundle, AnalysisState, AnalysisRegime } from '../types';
import { StatCard } from './StatCard';
import { InsightCard } from './InsightCard';
import { InfoIcon } from './icons/InfoIcon';
import { AdvancedPatterns } from './AdvancedPatterns';
import { Recommendations } from './Recommendations';
import { AetherScoreForecast } from './AetherScoreForecast';
import { IntelligentCoupons } from './IntelligentCoupons';
import { HistoricalSuccessView } from './HistoricalSuccessView';
import { SeasonalInsights } from './SeasonalInsights';
import { MetaPatternInsights } from './MetaPatternInsights';
import { NextDrawForecast } from './NextDrawForecast';
import { PatternTimingView } from './PatternTimingView';
import { ValidationPanel } from './ValidationPanel';
import { SequentialPerformanceView } from './SequentialPerformanceView';
import { AetherScoreDNAPanel } from './AetherScoreDNAPanel';
import { AntiPopularityPanel } from './AntiPopularityPanel';
import { Spinner } from './icons/Spinner';
import { ComparativeAnalysis } from './ComparativeAnalysis';
import { DynamicStrategyView } from './DynamicStrategyView';
import { BrainIcon } from './icons/BrainIcon';
import { AlertIcon } from './icons/AlertIcon';


interface DashboardProps {
    analysisState: AnalysisState;
    fileName: string;
    onReset: () => void;
}

type ActiveView = 'analysis' | 'model-precision' | 'historical-success' | 'pattern-timing' | 'context-validation' | 'comparison';
type ActiveDataset = 'total' | 'tuesday' | 'friday';

const AnalysisContent: React.FC<{ analysisResult: AnalysisResult; }> = ({ analysisResult }) => {
    const { totalRows, validDraws, topPatterns, patternAnalysis, strategies, aetherScores, intelligentCoupons, seasonalAnalysis, metaPatternAnalysis, antiPopularityAnalysis } = analysisResult;
    const invalidRows = totalRows - validDraws;
    return (
         <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Rows in File" value={totalRows.toLocaleString()} />
                <StatCard title="Valid Draws for Analysis" value={validDraws.toLocaleString()} />
                <StatCard title="Invalid/Skipped Rows" value={invalidRows.toLocaleString()} />
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-lg p-4 flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-text-secondary">
                    All analyses are conducted against current Eurojackpot rules (Main: 1-50, Stars: 1-12) to provide a forward-looking perspective on statistical deviations.
                </p>
            </div>
            
            <div>
                 <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Top 10 Key Patterns</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {topPatterns.map((insight, index) => (
                        <InsightCard key={index} insight={insight} rank={index + 1} />
                    ))}
                 </div>
            </div>
            
            {aetherScores && <AetherScoreForecast aetherScores={aetherScores} />}
            {aetherScores && aetherScores.mainNumberScores.length > 0 && <AetherScoreDNAPanel topScore={aetherScores.mainNumberScores[0]} />}
            {intelligentCoupons && intelligentCoupons.length > 0 && <IntelligentCoupons coupons={intelligentCoupons} />}
            {seasonalAnalysis && <SeasonalInsights seasonalAnalysis={seasonalAnalysis} />}
            {antiPopularityAnalysis && <div className="mt-12"><AntiPopularityPanel analysis={antiPopularityAnalysis} /></div>}
            {patternAnalysis && <AdvancedPatterns patterns={patternAnalysis} validDraws={validDraws} />}
            {metaPatternAnalysis && <div className="mt-12"><MetaPatternInsights metaAnalysis={metaPatternAnalysis} /></div>}
            {strategies && strategies.length > 0 && <Recommendations strategies={strategies} />}
        </div>
    )
}


const RegimeCards: React.FC<{ detectedRegime: AnalysisRegime; regimeShiftDetected: boolean; }> = ({ detectedRegime, regimeShiftDetected }) => {
    const regimeDetails = {
        'Balanced': { color: 'text-gray-300', description: 'No single dominant pattern detected. The model is using a balanced, evidence-based weighting strategy.' },
        'Hot Streak': { color: 'text-red-400', description: 'A "hot streak" pattern is dominant. The model is prioritizing momentum and frequency factors.' },
        'Volatile': { color: 'text-yellow-400', description: 'High seasonal volatility detected. The model is favoring short-term momentum and pattern stability over seasonal history.' },
        'Stable': { color: 'text-green-400', description: 'A stable seasonal period is detected. The model is putting more trust in seasonal patterns and mean-reversion (dormancy).' }
    };
    const currentRegime = regimeDetails[detectedRegime];

    return (
        <div className="space-y-4">
            <div className={`bg-brand-surface border rounded-lg p-4 flex items-start gap-3 border-brand-border`}>
                <BrainIcon className={`w-6 h-6 flex-shrink-0 ${currentRegime.color}`} />
                <div>
                    <h4 className={`font-semibold ${currentRegime.color}`}>
                        Analyse-Regime: {detectedRegime}
                    </h4>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        {currentRegime.description}
                    </p>
                </div>
            </div>
            <div className={`bg-brand-surface border rounded-lg p-4 flex items-start gap-3 ${regimeShiftDetected ? 'border-yellow-500/50' : 'border-green-500/30'}`}>
                <AlertIcon className={`w-6 h-6 flex-shrink-0 ${regimeShiftDetected ? 'text-yellow-400' : 'text-green-400'}`} />
                <div>
                    <h4 className={`font-semibold ${regimeShiftDetected ? 'text-yellow-300' : 'text-green-300'}`}>
                        {regimeShiftDetected ? 'Regime-Skift Opdaget' : 'Stabilt Data-Regime'}
                    </h4>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        {regimeShiftDetected
                            ? "Der er opdaget et signifikant skift i de statistiske mønstre inden for de seneste 50 trækninger. Modellens prognoser kan være mindre pålidelige."
                            : "De underliggende statistiske egenskaber i datasættet har været stabile. Historiske data er en pålidelig base for fremtidige prognoser."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};


export const Dashboard: React.FC<DashboardProps> = ({ 
    analysisState, fileName, onReset
}) => {
    const [activeView, setActiveView] = useState<ActiveView>('analysis');
    const [activeDataset, setActiveDataset] = useState<ActiveDataset>('total');
    
    const megaBundle = analysisState.status === 'completed' ? analysisState.data : null;
    const activeBundle = megaBundle ? megaBundle[activeDataset] : null;

    const datasetTabs: { key: ActiveDataset; label: string; disabled: boolean }[] = [
        { key: 'total', label: 'Total Analyse', disabled: !megaBundle?.total?.analysisResult?.validDraws },
        { key: 'tuesday', label: 'Tirsdags-Analyse', disabled: !megaBundle?.tuesday?.analysisResult?.validDraws },
        { key: 'friday', label: 'Fredags-Analyse', disabled: !megaBundle?.friday?.analysisResult?.validDraws },
    ];

    const viewTabs = useMemo(() => {
        const tabs = [
            { key: 'analysis', label: 'Analyse', disabled: !activeBundle?.analysisResult },
            { key: 'model-precision', label: 'Model Præcision', disabled: !activeBundle?.performanceLog || !activeBundle.forecastPerformanceInsight },
            { key: 'historical-success', label: 'Vindertals-DNA', disabled: !activeBundle?.historicalSuccessAnalysis },
            { key: 'pattern-timing', label: 'Spillets Rytme', disabled: !activeBundle?.patternTimingAnalysis },
            { key: 'context-validation', label: 'Kontekst Validering', disabled: !activeBundle?.validationResult },
        ];

        if (activeDataset === 'total') {
            tabs.push({ 
                key: 'comparison', 
                label: 'Tirsdag vs. Fredag', 
                disabled: !megaBundle?.tuesday?.analysisResult?.validDraws || !megaBundle?.friday?.analysisResult?.validDraws 
            });
        }
        
        return tabs;
    }, [activeBundle, megaBundle, activeDataset]);
    
    const handleDatasetChange = (dataset: ActiveDataset) => {
        setActiveDataset(dataset);
        // If current view is comparison and we switch away from total, reset view
        if (activeView === 'comparison' && dataset !== 'total') {
            setActiveView('analysis');
        }
    };
    
    const renderContent = () => {
        if (!activeBundle) {
            return <div className="text-center text-brand-text-secondary py-16">No analysis data available for this selection.</div>;
        }

        switch (activeView) {
            case 'analysis':
                return <AnalysisContent analysisResult={activeBundle.analysisResult} />;
            case 'model-precision':
                if (activeBundle.performanceLog && activeBundle.forecastPerformanceInsight && activeBundle.performanceBreakdown && activeBundle.events) {
                    return <SequentialPerformanceView 
                        performanceTimeline={activeBundle.performanceTimeline}
                        performanceLog={activeBundle.performanceLog}
                        forecastPerformanceInsight={activeBundle.forecastPerformanceInsight}
                        performanceBreakdown={activeBundle.performanceBreakdown}
                        optimalWeights={activeBundle.analysisResult.optimalWeights}
                        events={activeBundle.events}
                    />;
                }
                return null;
            case 'historical-success':
                 if (activeBundle.historicalSuccessAnalysis) {
                    return <HistoricalSuccessView analysis={activeBundle.historicalSuccessAnalysis} />;
                }
                return null;
            case 'pattern-timing':
                 if (activeBundle.patternTimingAnalysis) {
                    return <PatternTimingView analysis={activeBundle.patternTimingAnalysis} />;
                }
                return null;
            case 'context-validation':
                if (activeBundle.validationResult) {
                    return <ValidationPanel result={activeBundle.validationResult} />;
                }
                return null;
            case 'comparison':
                 if (megaBundle && megaBundle.tuesday.analysisResult && megaBundle.friday.analysisResult) {
                    return <ComparativeAnalysis tuesdayAnalysis={megaBundle.tuesday.analysisResult} fridayAnalysis={megaBundle.friday.analysisResult} />;
                }
                return null;
            default:
                return null;
        }
    };
    
    if (analysisState.status === 'loading') {
        return (
             <div className="flex flex-col items-center justify-center h-96">
                <Spinner className="w-12 h-12 text-brand-primary animate-spin" />
                <p className="mt-4 text-brand-text-secondary">{analysisState.progress.stage}</p>
                <div className="w-full max-w-md mt-2">
                    <div className="w-full bg-brand-surface rounded-full h-2.5 border border-brand-border">
                        <div
                            className="bg-brand-primary h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${analysisState.progress.percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    if (analysisState.status === 'error') {
        return (
            <div className="text-center">
                <div className="mt-6 p-4 w-full bg-red-900/20 border border-red-500/50 text-red-300 rounded-lg text-left max-w-2xl mx-auto">
                    <p className="font-semibold">Analysis Failed</p>
                    <p className="text-sm">{analysisState.message}</p>
                </div>
                <button
                    onClick={onReset}
                    className="mt-6 px-4 py-2 bg-brand-primary text-brand-bg rounded-md hover:opacity-90 transition-opacity text-sm font-semibold"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (analysisState.status === 'completed' && megaBundle && activeBundle) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold tracking-tight text-white">{fileName}</h2>
                        <p className="mt-1 text-md text-brand-text-secondary">Dashboard & Analysis</p>
                    </div>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 bg-brand-surface border border-brand-border text-brand-text-primary rounded-md hover:bg-brand-border transition-colors text-sm font-medium"
                    >
                        Start New Analysis
                    </button>
                </div>
                
                {activeBundle.predictedNextDrawDate && <NextDrawForecast predictedDate={activeBundle.predictedNextDrawDate} />}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                         {activeBundle.historicalSuccessAnalysis && (
                            <DynamicStrategyView historicalSuccessAnalysis={activeBundle.historicalSuccessAnalysis} />
                        )}
                    </div>
                    <div className="lg:col-span-1">
                        <RegimeCards 
                            detectedRegime={activeBundle.analysisResult.detectedRegime || 'Balanced'}
                            regimeShiftDetected={activeBundle.analysisResult.regimeShiftDetected || false}
                        />
                    </div>
                </div>


                <div>
                    <div className="border-b border-brand-border">
                        <nav className="-mb-px flex space-x-6" aria-label="Datasets">
                            {datasetTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleDatasetChange(tab.key)}
                                    disabled={tab.disabled}
                                    className={`${
                                        activeDataset === tab.key
                                            ? 'border-brand-primary text-brand-primary'
                                            : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-text-secondary'
                                    } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                     <div className="border-b border-brand-border">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Views">
                            {viewTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveView(tab.key as ActiveView)}
                                    disabled={tab.disabled}
                                    className={`${
                                        activeView === tab.key
                                            ? 'border-brand-primary text-brand-primary'
                                            : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-text-secondary'
                                    } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-8">
                        {renderContent()}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
