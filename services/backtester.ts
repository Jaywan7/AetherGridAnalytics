import type { Draw, PerformancePoint, PerformanceLogItem, WeightConfiguration, PerformanceBreakdown, HistoricalSuccessAnalysis, WinnerProfile, HistoricalSuccessProfile, PreDrawIndicator, AnalysisRegime, DateContext, BacktestEvent } from '../types';
import { analyzeData } from './analysisService';
import { calculateAdaptiveAetherScores } from './aetherScoreService';
import { analyzeSeasonalPatterns } from './seasonalityService';
import { analyzeMetaPatterns } from './metaPatternService';
import { recalibrateWeightsFromHistory, detectRegimeShift } from './continuousLearningService';
import { calculateHitProfile } from './historicalSuccessService';
import { analyzePatternTiming } from './patternTimingService';
import { getCurrentContext } from './specialDatesService';
// FIX: Import MAIN_NUMBER_MAX for stability analysis calculation.
import { MAIN_NUMBER_MAX } from '../constants';

// --- Helper Functions ---
const getAverage = (arr: number[]): number => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const getDrawSpread = (draw: Draw): number => {
    if (draw.mainNumbers.length < 2) return 0;
    return Math.max(...draw.mainNumbers) - Math.min(...draw.mainNumbers);
};

const getDrawSum = (draw: Draw): number => {
    if (draw.mainNumbers.length === 0) return 0;
    return draw.mainNumbers.reduce((a, b) => a + b, 0);
};

const _getDateInfo = (dateString: string): { month: number, quarter: number } | null => {
    let date: Date | null = null;
    const trimmedDateString = dateString.trim();

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmedDateString)) {
        const parts = trimmedDateString.split('-');
        const [year, month, day] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(Date.UTC(year, month - 1, day));
        }
    } else if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(trimmedDateString)) {
        const separator = trimmedDateString.includes('.') ? '.' : '/';
        const parts = trimmedDateString.split(separator);
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
            date = new Date(Date.UTC(fullYear, month - 1, day));
        }
    }

    if (!date || isNaN(date.getTime())) {
        const parsedDate = new Date(trimmedDateString);
        if (!isNaN(parsedDate.getTime())) {
             date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
        }
    }
    
    if (date && !isNaN(date.getTime())) {
        const month = date.getUTCMonth(); // 0-11
        const quarter = Math.floor(month / 3) + 1; // 1-4
        return { month, quarter };
    }
    
    return null;
};


const analyzePerformanceLog = (performanceLog: PerformanceLogItem[]): PerformanceBreakdown => {
    // A/B test analysis
    const aetherTotalHits = performanceLog.reduce((sum, item) => sum + item.mainHits, 0);
    const baselineTotalHits = performanceLog.reduce((sum, item) => sum + (item.baselineMainHits || 0), 0);
    const improvementPercentage = baselineTotalHits > 0 ? ((aetherTotalHits - baselineTotalHits) / baselineTotalHits) * 100 : 0;
    
    // Seasonal analysis
    const monthlyData: { [month: string]: { hits: number, draws: number } } = {};
    const quarterlyData: { [quarter: string]: { hits: number, draws: number } } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (const item of performanceLog) {
        const dateInfo = _getDateInfo(item.drawDate);
        if (!dateInfo) continue;
        
        const month = monthNames[dateInfo.month];
        const quarter = `Q${dateInfo.quarter}`;
        
        if (!monthlyData[month]) monthlyData[month] = { hits: 0, draws: 0 };
        monthlyData[month].hits += item.mainHits;
        monthlyData[month].draws++;
        
        if (!quarterlyData[quarter]) quarterlyData[quarter] = { hits: 0, draws: 0 };
        quarterlyData[quarter].hits += item.mainHits;
        quarterlyData[quarter].draws++;
    }

    const formatSeasonal = (data: { [key: string]: { hits: number, draws: number } }) => 
        Object.entries(data).map(([period, values]) => ({
            period,
            totalDraws: values.draws,
            totalHits: values.hits,
            avgHits: values.draws > 0 ? values.hits / values.draws : 0
        })).sort((a,b) => a.period.startsWith('Q') ? parseInt(a.period[1]) - parseInt(b.period[1]) : monthNames.indexOf(a.period) - monthNames.indexOf(b.period));

    return {
        abTest: { aetherTotalHits, baselineTotalHits, improvementPercentage },
        seasonal: {
            monthly: formatSeasonal(monthlyData),
            quarterly: formatSeasonal(quarterlyData),
        }
    };
};

const createFullSuccessAnalysis = (winnerProfiles: WinnerProfile[], draws: Draw[]): HistoricalSuccessAnalysis => {
    if (winnerProfiles.length === 0) {
        // FIX: Add missing companion and stability properties
        return { hitProfile: { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0, companion: 0, stability: 0 }, preDrawIndicators: [], totalAnalyzedHits: 0, winnerProfiles: [] };
    }

    const totalAnalyzedHits = winnerProfiles.length;
    const hitProfile = calculateHitProfile(winnerProfiles);

    const preDrawIndicators: PreDrawIndicator[] = [];
    const globalAvgSpread = getAverage(draws.map(getDrawSpread));
    const globalAvgSum = getAverage(draws.map(getDrawSum));
    
    // FIX: Add missing companion and stability properties
    const indicatorSpreads: { [key in keyof HistoricalSuccessProfile]: number[] } = { hot: [], cold: [], overdue: [], hotZone: [], momentum: [], cluster: [], seasonal: [], companion: [], stability: [] };
    // FIX: Add missing companion and stability properties
    const indicatorSums: { [key in keyof HistoricalSuccessProfile]: number[] } = { hot: [], cold: [], overdue: [], hotZone: [], momentum: [], cluster: [], seasonal: [], companion: [], stability: [] };

    winnerProfiles.forEach(wp => {
        const keys: (keyof HistoricalSuccessProfile)[] = [];
        if (wp.profile.isHot) keys.push('hot');
        if (wp.profile.isCold) keys.push('cold');
        if (wp.profile.isOverdue) keys.push('overdue');
        if (wp.profile.isSeasonalHot) keys.push('seasonal');
        // FIX: Add checks for new profile properties
        if (wp.profile.isCompanionHot) keys.push('companion');
        if (wp.profile.hasStability) keys.push('stability');

        keys.forEach(key => {
            indicatorSpreads[key].push(wp.prevDrawSpread);
            indicatorSums[key].push(wp.prevDrawSum);
        });
    });

    const generateIndicator = (key: keyof HistoricalSuccessProfile, name: string) => {
        // Spread Analysis
        const spreads = indicatorSpreads[key];
        if (spreads.length >= 20) {
            const avgSpread = getAverage(spreads);
            const deviation = ((avgSpread - globalAvgSpread) / globalAvgSpread) * 100;
            if (Math.abs(deviation) > 5) {
                const direction = deviation > 0 ? "højere" : "lavere";
                const implication = deviation > 0 ? "mere 'kaotiske' trækninger" : "mere 'fokuserede' trækninger";
                preDrawIndicators.push({
                    title: `Spredning før et '${name}' Tal Rammer`,
                    insight: `Trækninger før et '${name}' hit har en gennemsnitlig spredning på ${avgSpread.toFixed(1)}, ${Math.abs(deviation).toFixed(0)}% ${direction} end normalen. Dette indikerer, at ${implication} 'forbereder' denne type hit.`,
                    strength: 'Moderate'
                });
            }
        }
        
        // Sum Analysis
        const sums = indicatorSums[key];
        if (sums.length >= 20) {
            const avgSum = getAverage(sums);
            const deviation = ((avgSum - globalAvgSum) / globalAvgSum) * 100;
            if (Math.abs(deviation) > 2) {
                const direction = deviation > 0 ? "højere" : "lavere";
                preDrawIndicators.push({
                    title: `Sum før et '${name}' Tal Rammer`,
                    insight: `Trækninger før et '${name}' hit har en gennemsnitlig sum på ${avgSum.toFixed(0)}, ${Math.abs(deviation).toFixed(1)}% ${direction} end normalen.`,
                    strength: 'Weak'
                });
            }
        }
    };
    
    generateIndicator('hot', 'Varmt');
    generateIndicator('cold', 'Koldt');
    generateIndicator('overdue', 'Overdue');
    generateIndicator('seasonal', 'Sæsonbestemt');
    // FIX: Add indicator generation for new properties
    generateIndicator('companion', 'Følgetal');
    generateIndicator('stability', 'Stabilt');

    return { hitProfile, preDrawIndicators, totalAnalyzedHits, winnerProfiles };
};

/**
 * Runs a sequential backtest with a true rolling window and dynamic, truth-based weight recalibration.
 * @param draws An array of all historical draws, chronologically sorted.
 * @returns An object containing performance metrics, the final historical success analysis, and the final optimized weights.
 */
export const runSequentialBacktest = async (
    draws: Draw[],
    onProgress: (progress: number) => void
): Promise<{ 
    performanceTimeline: PerformancePoint[], 
    performanceLog: PerformanceLogItem[], 
    performanceBreakdown: PerformanceBreakdown,
    historicalSuccessAnalysis: HistoricalSuccessAnalysis,
    optimalWeights: WeightConfiguration,
    events: BacktestEvent[],
}> => {
    const initialWindowSize = 100;
    const emptyResult = {
        performanceTimeline: [],
        performanceLog: [],
        performanceBreakdown: { abTest: { aetherTotalHits: 0, baselineTotalHits: 0, improvementPercentage: 0 }, seasonal: { monthly: [], quarterly: [] } },
        // FIX: Add missing companion and stability properties
        historicalSuccessAnalysis: { hitProfile: { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0, companion: 0, stability: 0 }, preDrawIndicators: [], totalAnalyzedHits: 0, winnerProfiles: [] },
        optimalWeights: { frequency: 0.25, dormancy: 0.20, zone: 0.10, companion: 0.05, seasonal: 0.10, momentum: 0.15, clusterStrength: 0.10, stability: 0.05 },
        events: [],
    };

    if (draws.length < initialWindowSize + 1) {
        onProgress(1); // Complete immediately if nothing to do
        return emptyResult;
    }

    const performanceLog: PerformanceLogItem[] = [];
    const winnerProfiles: WinnerProfile[] = [];
    const events: BacktestEvent[] = [];
    let lastRegimeShiftState = false;

    let adaptiveWeights: WeightConfiguration = { frequency: 0.25, dormancy: 0.20, zone: 0.10, companion: 0.05, seasonal: 0.10, momentum: 0.15, clusterStrength: 0.10, stability: 0.05 };
    const recalibrationInterval = 20;
    const totalSteps = draws.length - initialWindowSize;

    for (let i = initialWindowSize; i < draws.length; i++) {
        const trainingData = draws.slice(0, i);
        const targetDraw = draws[i];
        const prevDraw = draws[i - 1];

        // --- DYNAMIC RECALIBRATION & EVENT DETECTION ---
        let tempSuccessAnalysis: HistoricalSuccessAnalysis | null = null;
        if ((i - initialWindowSize) > 0 && (i - initialWindowSize) % recalibrationInterval === 0 && winnerProfiles.length > 20) {
            tempSuccessAnalysis = createFullSuccessAnalysis(winnerProfiles, trainingData);
            events.push({
                drawNumber: i + 1,
                type: 'Weight Calibration',
                label: 'Vægt-Kalibrering',
            });

            // Prioritize recent performance for weight calibration if enough data exists
            if (winnerProfiles.length > 50) {
                 const recentWinnerProfiles = winnerProfiles.slice(-250);
                 const recentSuccessAnalysis = createFullSuccessAnalysis(recentWinnerProfiles, trainingData);
                 adaptiveWeights = recalibrateWeightsFromHistory(recentSuccessAnalysis);
            } else {
                 // Fallback to full history if not enough recent data
                 adaptiveWeights = recalibrateWeightsFromHistory(tempSuccessAnalysis);
            }
        }
        
        const currentRegimeShiftState = detectRegimeShift(trainingData);
        if (currentRegimeShiftState && !lastRegimeShiftState) {
            events.push({
                drawNumber: i + 1,
                type: 'Regime Shift Detected',
                label: 'Regime-Skift Detekteret',
            });
        }
        lastRegimeShiftState = currentRegimeShiftState;

        const historicalAnalysis = analyzeData(trainingData, trainingData.length);
        const seasonalAnalysis = analyzeSeasonalPatterns(trainingData);
        const metaPatternAnalysis = analyzeMetaPatterns(trainingData);
        const nextDrawDateForForecast = new Date(targetDraw.drawDate);
        
        const timingAnalysis = analyzePatternTiming(trainingData);
        let detectedRegime: AnalysisRegime = 'Balanced';
        if (timingAnalysis) {
            const { hotStreakAnalysis, seasonalTransitionAnalysis } = timingAnalysis;

            if (hotStreakAnalysis.averageStreakDuration > 4.0) {
                detectedRegime = 'Hot Streak';
            } else {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const nextMonthName = monthNames[nextDrawDateForForecast.getUTCMonth()];
                const transition = seasonalTransitionAnalysis.monthlyTransitions.find(t => t.toPeriod === nextMonthName);
                if (transition) {
                    if (transition.dissimilarityScore > 0.6) {
                        detectedRegime = 'Volatile';
                    } else if (transition.dissimilarityScore < 0.3) {
                        detectedRegime = 'Stable';
                    }
                }
            }
        }

        const forecast = calculateAdaptiveAetherScores(
            historicalAnalysis, 
            trainingData, 
            seasonalAnalysis, 
            metaPatternAnalysis, 
            nextDrawDateForForecast, 
            adaptiveWeights,
            tempSuccessAnalysis,
            detectedRegime
        );
        const top10MainForecast = forecast.mainNumberScores.slice(0, 10).map(s => s.number);
        const top5StarForecast = forecast.starNumberScores.slice(0, 5).map(s => s.number);
        
        const mainHits = targetDraw.mainNumbers.filter(num => top10MainForecast.includes(num)).length;
        const starHits = targetDraw.starNumbers.filter(num => top5StarForecast.includes(num)).length;

        const baseline_top10_main = historicalAnalysis.mainNumberFrequencies
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(f => f.number as number);
        const baselineMainHits = targetDraw.mainNumbers.filter(num => baseline_top10_main.includes(num)).length;
        
        const { context } = getCurrentContext(nextDrawDateForForecast);

        // Calculate average winner rank for predictability index
        const winnerRanks = targetDraw.mainNumbers.map(winner => {
            const found = forecast.mainNumberScores.find(s => s.number === winner);
            return found ? found.rank : 51; // 51 for not found in top 50
        });
        const averageWinnerRank = getAverage(winnerRanks);

        performanceLog.push({
            drawNumber: i + 1, drawDate: targetDraw.drawDate, forecast_top10_main: top10MainForecast, forecast_top5_star: top5StarForecast,
            actual_main: targetDraw.mainNumbers, actual_star: targetDraw.starNumbers, mainHits, starHits,
            forecast_baseline_main: baseline_top10_main, baselineMainHits, context, averageWinnerRank
        });

        // --- Update Winner Profiles for next recalibration ---
        const { mainNumberFrequencies, patternAnalysis } = historicalAnalysis;
        const mainFreqSorted = mainNumberFrequencies.sort((a, b) => a.count - a.count);
        const hotThreshold = Math.floor(mainFreqSorted.length * 0.67);
        const coldThreshold = Math.floor(mainFreqSorted.length * 0.33);
        const hotNumbers = new Set(mainFreqSorted.slice(hotThreshold).map(f => f.number as number));
        const coldNumbers = new Set(mainFreqSorted.slice(0, coldThreshold).map(f => f.number as number));
        const overdueNumbers = new Set(patternAnalysis.dormancyAnalysis.mainNumberDormancy.filter(d => d.isOverdue).map(d => d.number));
        const [hotZoneMin, hotZoneMax] = patternAnalysis.zoneAnalysis.hotZone.split('-').map(Number);
        const trendingNumbers = new Set(patternAnalysis.momentumAnalysis.filter(m => m.momentumScore > 0).map(m => m.number));
        const strongClusterNumbers = new Set(patternAnalysis.clusterStrengthAnalysis.filter(c => c.clusterScore > 0).map(c => c.number));
        const targetDrawDateInfo = _getDateInfo(targetDraw.drawDate);
        let seasonalHotNumbers = new Set<number>();
        if (targetDrawDateInfo) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const currentMonthName = monthNames[targetDrawDateInfo.month];
            const monthlyData = seasonalAnalysis.monthly[currentMonthName] || [];
            seasonalHotNumbers = new Set(monthlyData.slice(0, Math.floor(monthlyData.length * 0.2)).map(item => item.number));
        }
        
        // FIX: Add logic to determine companion hotness and stability
        const stableNumbers = new Set<number>();
        if(metaPatternAnalysis?.hotColdTransitions) {
            const sortedTransitions = [...metaPatternAnalysis.hotColdTransitions].sort((a,b) => a.transitions - b.transitions);
            // Stable numbers are those with few transitions (e.g., bottom 40%)
            sortedTransitions.slice(0, Math.floor(MAIN_NUMBER_MAX * 0.4)).forEach(t => stableNumbers.add(t.number));
        }

        const hotCompanionNumbers = new Set<number>();
        const companionData = historicalAnalysis.patternAnalysis.companionAnalysis.companionData;
        hotNumbers.forEach(hotNum => {
            const companions = companionData[hotNum as number] || [];
            // consider top 3 companions of each hot number as also hot
            companions.slice(0, 3).forEach(comp => hotCompanionNumbers.add(comp.number));
        });

        const prevDrawSpread = getDrawSpread(prevDraw);
        const prevDrawSum = getDrawSum(prevDraw);

        for (const num of targetDraw.mainNumbers) {
            winnerProfiles.push({
                drawNumber: i + 1, drawDate: targetDraw.drawDate, winningNumber: num,
                // FIX: Add missing isCompanionHot and hasStability properties
                profile: {
                    isHot: hotNumbers.has(num), isCold: coldNumbers.has(num), isOverdue: overdueNumbers.has(num),
                    isInHotZone: num >= hotZoneMin && num <= hotZoneMax, hasMomentum: trendingNumbers.has(num),
                    hasClusterStrength: strongClusterNumbers.has(num), isSeasonalHot: seasonalHotNumbers.has(num),
                    isCompanionHot: hotCompanionNumbers.has(num),
                    hasStability: stableNumbers.has(num),
                },
                prevDrawSpread,
                prevDrawSum,
            });
        }
        
        const currentStep = i - initialWindowSize;
        // Update progress every 10 steps to reduce overhead, and always on the last step.
        if (currentStep % 10 === 0 || i === draws.length - 1) {
            onProgress((currentStep + 1) / totalSteps);
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
        }
    }

    const performanceBreakdown = analyzePerformanceLog(performanceLog);
    const historicalSuccessAnalysis = createFullSuccessAnalysis(winnerProfiles, draws);
    
    // Final calibration uses the most recent data available from the entire backtest run
    const finalRecentWinnerProfiles = winnerProfiles.slice(-250);
    const finalOptimalWeights = recalibrateWeightsFromHistory(
        createFullSuccessAnalysis(finalRecentWinnerProfiles.length > 50 ? finalRecentWinnerProfiles : winnerProfiles, draws)
    );
    
    const performanceTimeline: PerformancePoint[] = [];
    const validatedDrawsCount = performanceLog.length;
    if (validatedDrawsCount > 0) {
        const numBatches = 10;
        const batchSize = Math.max(1, Math.floor(validatedDrawsCount / numBatches));
        
        for (let i = 0; i < numBatches; i++) {
            const start = i * batchSize;
            const end = start + batchSize;
            const batch = performanceLog.slice(start, end);

            if (batch.length > 0) {
                const totalMainHits = batch.reduce((sum, item) => sum + item.mainHits, 0);
                const totalStarHits = batch.reduce((sum, item) => sum + item.starHits, 0);
                const totalBaselineHits = batch.reduce((sum, item) => sum + (item.baselineMainHits || 0), 0);
                
                performanceTimeline.push({
                    trainingSize: initialWindowSize + start,
                    avgMainHits: totalMainHits / batch.length,
                    avgStarHits: totalStarHits / batch.length,
                    avgBaselineHits: totalBaselineHits / batch.length,
                });
            }
        }
    }

    return { performanceTimeline, performanceLog, performanceBreakdown, historicalSuccessAnalysis, optimalWeights: finalOptimalWeights, events };
};