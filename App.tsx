
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { UnifiedAnalysisDashboard } from './components/UnifiedAnalysisDashboard';
import { parseCSV } from './services/csvParser';
import { analyzeData, analyzeForecastPerformance } from './services/analysisService';
import { generateAllStrategies } from './services/strategyService';
import { calculateAdaptiveAetherScores } from './services/aetherScoreService';
import { buildIntelligentCoupons } from './services/couponBuilderService';
import { generateMetaCoupons } from './services/metaStrategyService';
import { runSequentialBacktest } from './services/backtester';
import { analyzeSeasonalPatterns } from './services/seasonalityService';
import { detectRegimeShift } from './services/continuousLearningService';
import { analyzeMetaPatterns } from './services/metaPatternService';
import { predictNextDrawDate } from './services/nextDrawDateService';
import { analyzePatternTiming } from './services/patternTimingService';
import type { AnalysisResult, Draw, PerformancePoint, PerformanceLogItem, ForecastPerformanceInsight, SeasonalAnalysis, WeightConfiguration, PerformanceBreakdown, HistoricalSuccessAnalysis, PatternTimingAnalysis } from './types';

interface MultiAnalysisResults {
    total: AnalysisResult;
    tuesday: AnalysisResult | null;
    friday: AnalysisResult | null;
}

// FIX: Export ActiveDataset type to be used by Dashboard components.
export type ActiveDataset = 'total' | 'tuesday' | 'friday';

const App: React.FC = () => {
    const [analysisResults, setAnalysisResults] = useState<MultiAnalysisResults | null>(null);
    const [performanceTimeline, setPerformanceTimeline] = useState<PerformancePoint[] | null>(null);
    const [performanceLog, setPerformanceLog] = useState<PerformanceLogItem[] | null>(null);
    const [forecastPerformanceInsight, setForecastPerformanceInsight] = useState<ForecastPerformanceInsight | null>(null);
    const [performanceBreakdown, setPerformanceBreakdown] = useState<PerformanceBreakdown | null>(null);
    const [historicalSuccessAnalysis, setHistoricalSuccessAnalysis] = useState<HistoricalSuccessAnalysis | null>(null);
    const [patternTimingAnalysis, setPatternTimingAnalysis] = useState<PatternTimingAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [predictedNextDrawDate, setPredictedNextDrawDate] = useState<Date | null>(null);

    const runFullAnalysis = (
        drawsForAnalysis: Draw[], 
        totalDrawsInFile: number,
        optimalWeights: WeightConfiguration,
        regimeShiftDetected: boolean,
        nextDrawDate: Date | null
    ): AnalysisResult | null => {
        if (drawsForAnalysis.length === 0) {
            return null;
        }

        // 1. Core statistical analysis
        const analysisData = analyzeData(drawsForAnalysis, totalDrawsInFile);
        
        // 2. Seasonal analysis
        const seasonalData = analyzeSeasonalPatterns(drawsForAnalysis);
        
        // 3. New: Meta-Pattern Analysis (run before Aether Score)
        const metaPatternAnalysis = analyzeMetaPatterns(drawsForAnalysis);

        // 4. Adaptive Aether Score calculation (now with seasonal & meta-pattern data)
        const aetherScores = calculateAdaptiveAetherScores(analysisData, drawsForAnalysis, seasonalData, metaPatternAnalysis, nextDrawDate, optimalWeights);

        // 5. Generate base strategies (Trend, Contrarian, etc.)
        const baseStrategies = generateAllStrategies(analysisData as AnalysisResult);
        
        // 6. Generate advanced meta-strategies using Aether Scores
        const metaStrategy = generateMetaCoupons(analysisData as AnalysisResult, aetherScores);

        // 7. Build intelligent coupons from Aether Scores
        const intelligentCoupons = buildIntelligentCoupons(
            aetherScores,
            analysisData.patternAnalysis
        );
        
        const allStrategies = [...baseStrategies];
        if (metaStrategy) {
            allStrategies.push(metaStrategy);
        }

        return {
            ...analysisData,
            strategies: allStrategies,
            aetherScores,
            intelligentCoupons,
            seasonalAnalysis: seasonalData,
            optimalWeights,
            regimeShiftDetected,
            metaPatternAnalysis,
        };
    };

    const handleFileUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResults(null);
        setPerformanceTimeline(null);
        setPerformanceLog(null);
        setForecastPerformanceInsight(null);
        setPerformanceBreakdown(null);
        setHistoricalSuccessAnalysis(null);
        setPatternTimingAnalysis(null);
        setFileName(file.name);
        setPredictedNextDrawDate(null);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target?.result as string;
                if (!text) {
                    throw new Error("File is empty or could not be read.");
                }
                const { draws, totalRows } = parseCSV(text);
                if (draws.length === 0) {
                    throw new Error("No valid data found in the CSV file. Please check the file format and data integrity according to Eurojackpot rules.");
                }
                
                // Predict next draw date
                const nextDrawDate = predictNextDrawDate(draws);
                setPredictedNextDrawDate(nextDrawDate);

                // --- Multi-Pass Analysis Pipeline ---

                // 1. Run the new, consolidated backtester.
                // It now returns performance, historical success, and the final optimal weights.
                const {
                    performanceTimeline: timeline,
                    performanceLog: log,
                    performanceBreakdown: breakdown,
                    historicalSuccessAnalysis: historicalSuccess,
                    optimalWeights
                } = runSequentialBacktest(draws);

                setPerformanceTimeline(timeline);
                setPerformanceLog(log);
                setPerformanceBreakdown(breakdown);
                setHistoricalSuccessAnalysis(historicalSuccess);
                
                // New: Run Pattern Timing Analysis
                const timingAnalysis = analyzePatternTiming(draws);
                setPatternTimingAnalysis(timingAnalysis);
                
                // 2. Run a preliminary full analysis with default weights to generate insights for the Model Validity tab
                const defaultWeights: WeightConfiguration = { frequency: 0.25, dormancy: 0.20, zone: 0.10, companion: 0.10, seasonal: 0.10, momentum: 0.15, clusterStrength: 0.10, stability: 0.05 };
                const preliminaryTotalAnalysis = runFullAnalysis(draws, totalRows, defaultWeights, false, nextDrawDate);
                if (!preliminaryTotalAnalysis) {
                    throw new Error("Preliminary analysis run failed.");
                }

                // 3. Analyze the forecast performance based on the preliminary run
                const insights = analyzeForecastPerformance(log, preliminaryTotalAnalysis);
                setForecastPerformanceInsight(insights);
                
                // 4. Detect regime shifts
                const regimeShiftDetected = detectRegimeShift(draws);
                
                // --- End of Multi-Pass Setup ---

                const getDayOfWeek = (dateString: string): string => {
                    let date: Date | null = null;
                    const trimmedDateString = dateString.trim();

                    // Try YYYY-MM-DD
                    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmedDateString)) {
                        const parts = trimmedDateString.split('-');
                        const [year, month, day] = parts.map(Number);
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                            date = new Date(Date.UTC(year, month - 1, day));
                        }
                    }
                    // Try DD.MM.YYYY or DD/MM/YYYY
                    else if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(trimmedDateString)) {
                        const separator = trimmedDateString.includes('.') ? '.' : '/';
                        const parts = trimmedDateString.split(separator);
                        const [day, month, year] = parts.map(Number);
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                            const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
                            date = new Date(Date.UTC(fullYear, month - 1, day));
                        }
                    }

                    // Fallback for other formats like MM/DD/YYYY, which JS's Date.parse can often handle
                    if (!date || isNaN(date.getTime())) {
                        const parsedDate = new Date(trimmedDateString);
                        // If the date string does not contain timezone info, JS treats it as local.
                        // To avoid timezone shift issues, we construct a UTC date from its components.
                        if (!isNaN(parsedDate.getTime())) {
                             date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
                        }
                    }
                    
                    if (date && !isNaN(date.getTime())) {
                        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                        // Use getUTCDay() to be consistent with Date.UTC()
                        return weekdays[date.getUTCDay()];
                    }
                    
                    return 'Unknown';
                };

                const tuesdayDraws = draws.filter(d => getDayOfWeek(d.drawDate) === 'Tuesday');
                const fridayDraws = draws.filter(d => getDayOfWeek(d.drawDate) === 'Friday');

                // 5. Run final, optimized analysis for display using the truth-based weights from the backtester
                const totalAnalysis = runFullAnalysis(draws, totalRows, optimalWeights, regimeShiftDetected, nextDrawDate);
                if (!totalAnalysis) {
                    throw new Error("Analysis failed for the total dataset.");
                }

                const tuesdayAnalysis = runFullAnalysis(tuesdayDraws, totalRows, optimalWeights, regimeShiftDetected, nextDrawDate);
                const fridayAnalysis = runFullAnalysis(fridayDraws, totalRows, optimalWeights, regimeShiftDetected, nextDrawDate);

                setAnalysisResults({
                    total: totalAnalysis,
                    tuesday: tuesdayAnalysis,
                    friday: fridayAnalysis,
                });

                setIsLoading(false);
            };
            reader.onerror = () => {
                throw new Error("Error reading file.");
            };
            reader.readAsText(file);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            setIsLoading(false);
        }
    }, []);
    
    const handleReset = useCallback(() => {
        setAnalysisResults(null);
        setPerformanceTimeline(null);
        setPerformanceLog(null);
        setForecastPerformanceInsight(null);
        setPerformanceBreakdown(null);
        setHistoricalSuccessAnalysis(null);
        setPatternTimingAnalysis(null);
        setError(null);
        setIsLoading(false);
        setFileName('');
        setPredictedNextDrawDate(null);
    }, []);

    return (
        <div className="min-h-screen bg-brand-bg font-sans">
            <Header />
            <main className="container mx-auto px-4 py-8 md:px-8 md:py-12">
                {analysisResults ? (
                    <UnifiedAnalysisDashboard
                        analysisResult={analysisResults.total}
                        historicalSuccessAnalysis={historicalSuccessAnalysis}
                        patternTimingAnalysis={patternTimingAnalysis}
                        fileName={fileName}
                        onReset={handleReset}
                        predictedNextDrawDate={predictedNextDrawDate}
                    />
                ) : (
                    <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} error={error} />
                )}
            </main>
        </div>
    );
};

export default App;
