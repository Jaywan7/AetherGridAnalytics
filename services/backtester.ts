
import type { Draw, PerformancePoint, PerformanceLogItem, WeightConfiguration, PerformanceBreakdown, HistoricalSuccessAnalysis, WinnerProfile, HistoricalSuccessProfile, PreDrawIndicator } from '../types';
import { analyzeData } from './analysisService';
import { calculateAdaptiveAetherScores } from './aetherScoreService';
import { analyzeSeasonalPatterns } from './seasonalityService';
import { analyzeMetaPatterns } from './metaPatternService';
import { recalibrateWeightsFromHistory } from './continuousLearningService';

// --- Helper Functions ---
const getAverage = (arr: number[]): number => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const getDrawSpread = (draw: Draw): number => {
    if (draw.mainNumbers.length < 2) return 0;
    return Math.max(...draw.mainNumbers) - Math.min(...draw.mainNumbers);
};

const getDateInfo = (dateString: string): { month: number, quarter: number } | null => {
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
        const dateInfo = getDateInfo(item.drawDate);
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
        return { hitProfile: { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0 }, preDrawIndicators: [], totalAnalyzedHits: 0, winnerProfiles: [] };
    }

    const totalAnalyzedHits = winnerProfiles.length;
    const hitProfileCounter: { [key in keyof HistoricalSuccessProfile]: number } = { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0 };
    winnerProfiles.forEach(wp => {
        if (wp.profile.isHot) hitProfileCounter.hot++;
        if (wp.profile.isCold) hitProfileCounter.cold++;
        if (wp.profile.isOverdue) hitProfileCounter.overdue++;
        if (wp.profile.isInHotZone) hitProfileCounter.hotZone++;
        if (wp.profile.hasMomentum) hitProfileCounter.momentum++;
        if (wp.profile.hasClusterStrength) hitProfileCounter.cluster++;
        if (wp.profile.isSeasonalHot) hitProfileCounter.seasonal++;
    });

    const hitProfile: HistoricalSuccessProfile = {
        hot: (hitProfileCounter.hot / totalAnalyzedHits) * 100,
        cold: (hitProfileCounter.cold / totalAnalyzedHits) * 100,
        overdue: (hitProfileCounter.overdue / totalAnalyzedHits) * 100,
        hotZone: (hitProfileCounter.hotZone / totalAnalyzedHits) * 100,
        momentum: (hitProfileCounter.momentum / totalAnalyzedHits) * 100,
        cluster: (hitProfileCounter.cluster / totalAnalyzedHits) * 100,
        seasonal: (hitProfileCounter.seasonal / totalAnalyzedHits) * 100,
    };

    const preDrawIndicators: PreDrawIndicator[] = [];
    const globalAvgSpread = getAverage(draws.map(getDrawSpread));
    
    const indicatorSpreads: { [key in keyof HistoricalSuccessProfile]: number[] } = {
        hot: [], cold: [], overdue: [], hotZone: [], momentum: [], cluster: [], seasonal: []
    };
    winnerProfiles.forEach(wp => {
        if (wp.profile.isHot) indicatorSpreads.hot.push(wp.prevDrawSpread);
        if (wp.profile.isCold) indicatorSpreads.cold.push(wp.prevDrawSpread);
        if (wp.profile.isOverdue) indicatorSpreads.overdue.push(wp.prevDrawSpread);
        if (wp.profile.isSeasonalHot) indicatorSpreads.seasonal.push(wp.prevDrawSpread);
    });

    const generateIndicator = (key: keyof HistoricalSuccessProfile, name: string) => {
        const spreads = indicatorSpreads[key];
        if (spreads.length < 20) return;

        const avgSpread = getAverage(spreads);
        const deviation = ((avgSpread - globalAvgSpread) / globalAvgSpread) * 100;
        
        if (Math.abs(deviation) > 5) {
            const direction = deviation > 0 ? "højere" : "lavere";
            const implication = deviation > 0 ? "mere 'kaotiske' trækninger" : "mere 'fokuserede' trækninger";
            preDrawIndicators.push({
                title: `Trækningstype før et '${name}' Tal Rammer`,
                insight: `Trækninger, der kommer lige før et '${name}' tal bliver trukket, har en gennemsnitlig spredning på ${avgSpread.toFixed(1)}, hvilket er ${Math.abs(deviation).toFixed(0)}% ${direction} end det globale gennemsnit. Dette kan indikere, at ${implication} 'forbereder' denne type hit.`,
                strength: 'Moderate'
            });
        }
    };
    
    generateIndicator('hot', 'Varmt');
    generateIndicator('cold', 'Koldt');
    generateIndicator('overdue', 'Overdue');
    generateIndicator('seasonal', 'Sæsonbestemt');

    return { hitProfile, preDrawIndicators, totalAnalyzedHits, winnerProfiles };
};

/**
 * Runs a sequential backtest with a true rolling window and dynamic, truth-based weight recalibration.
 * @param draws An array of all historical draws, chronologically sorted.
 * @returns An object containing performance metrics, the final historical success analysis, and the final optimized weights.
 */
export const runSequentialBacktest = (draws: Draw[]): { 
    performanceTimeline: PerformancePoint[], 
    performanceLog: PerformanceLogItem[], 
    performanceBreakdown: PerformanceBreakdown,
    historicalSuccessAnalysis: HistoricalSuccessAnalysis,
    optimalWeights: WeightConfiguration
} => {
    const initialWindowSize = 100;
    const emptyResult = {
        performanceTimeline: [],
        performanceLog: [],
        performanceBreakdown: { abTest: { aetherTotalHits: 0, baselineTotalHits: 0, improvementPercentage: 0 }, seasonal: { monthly: [], quarterly: [] } },
        historicalSuccessAnalysis: { hitProfile: { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0 }, preDrawIndicators: [], totalAnalyzedHits: 0, winnerProfiles: [] },
        optimalWeights: { frequency: 0.25, dormancy: 0.20, zone: 0.10, companion: 0.05, seasonal: 0.10, momentum: 0.15, clusterStrength: 0.10, stability: 0.05 }
    };

    if (draws.length < initialWindowSize + 1) {
        return emptyResult;
    }

    const performanceLog: PerformanceLogItem[] = [];
    const winnerProfiles: WinnerProfile[] = [];

    let adaptiveWeights: WeightConfiguration = { frequency: 0.25, dormancy: 0.20, zone: 0.10, companion: 0.05, seasonal: 0.10, momentum: 0.15, clusterStrength: 0.10, stability: 0.05 };
    const recalibrationInterval = 20;

    for (let i = initialWindowSize; i < draws.length; i++) {
        const trainingData = draws.slice(0, i);
        const targetDraw = draws[i];
        const prevDraw = draws[i - 1];

        // --- DYNAMIC RECALIBRATION ---
        if ((i - initialWindowSize) > 0 && (i - initialWindowSize) % recalibrationInterval === 0 && winnerProfiles.length > 20) {
            const tempSuccessAnalysis = createFullSuccessAnalysis(winnerProfiles, trainingData);
            adaptiveWeights = recalibrateWeightsFromHistory(tempSuccessAnalysis);
        }
        
        // Run full analysis on the expanding window of training data
        const historicalAnalysis = analyzeData(trainingData, trainingData.length);
        const seasonalAnalysis = analyzeSeasonalPatterns(trainingData);
        const metaPatternAnalysis = analyzeMetaPatterns(trainingData);
        const nextDrawDateForForecast = new Date(targetDraw.drawDate);
        
        // Generate forecast with the current (potentially recalibrated) weights
        const forecast = calculateAdaptiveAetherScores(historicalAnalysis, trainingData, seasonalAnalysis, metaPatternAnalysis, nextDrawDateForForecast, adaptiveWeights);
        const top10MainForecast = forecast.mainNumberScores.slice(0, 10).map(s => s.number);
        const top5StarForecast = forecast.starNumberScores.slice(0, 5).map(s => s.number);
        
        // Validate against the target draw
        const mainHits = targetDraw.mainNumbers.filter(num => top10MainForecast.includes(num)).length;
        const starHits = targetDraw.starNumbers.filter(num => top5StarForecast.includes(num)).length;

        // A/B Test: Baseline Model (simple frequency)
        const baseline_top10_main = historicalAnalysis.mainNumberFrequencies
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(f => f.number as number);
        const baselineMainHits = targetDraw.mainNumbers.filter(num => baseline_top10_main.includes(num)).length;
        
        performanceLog.push({
            drawNumber: i + 1, drawDate: targetDraw.drawDate, forecast_top10_main: top10MainForecast, forecast_top5_star: top5StarForecast,
            actual_main: targetDraw.mainNumbers, actual_star: targetDraw.starNumbers, mainHits, starHits,
            forecast_baseline_main: baseline_top10_main, baselineMainHits,
        });

        // --- Update Winner Profiles for next recalibration ---
        const { mainNumberFrequencies, patternAnalysis } = historicalAnalysis;
        const mainFreqSorted = mainNumberFrequencies.sort((a, b) => a.count - b.count);
        const hotThreshold = Math.floor(mainFreqSorted.length * 0.67);
        const coldThreshold = Math.floor(mainFreqSorted.length * 0.33);
        const hotNumbers = new Set(mainFreqSorted.slice(hotThreshold).map(f => f.number as number));
        const coldNumbers = new Set(mainFreqSorted.slice(0, coldThreshold).map(f => f.number as number));
        const overdueNumbers = new Set(patternAnalysis.dormancyAnalysis.mainNumberDormancy.filter(d => d.isOverdue).map(d => d.number));
        const [hotZoneMin, hotZoneMax] = patternAnalysis.zoneAnalysis.hotZone.split('-').map(Number);
        const trendingNumbers = new Set(patternAnalysis.momentumAnalysis.filter(m => m.momentumScore > 0).map(m => m.number));
        const strongClusterNumbers = new Set(patternAnalysis.clusterStrengthAnalysis.filter(c => c.clusterScore > 0).map(c => c.number));
        const targetDrawDateInfo = getDateInfo(targetDraw.drawDate);
        let seasonalHotNumbers = new Set<number>();
        if (targetDrawDateInfo) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const currentMonthName = monthNames[targetDrawDateInfo.month];
            const monthlyData = seasonalAnalysis.monthly[currentMonthName] || [];
            seasonalHotNumbers = new Set(monthlyData.slice(0, Math.floor(monthlyData.length * 0.2)).map(item => item.number));
        }

        for (const num of targetDraw.mainNumbers) {
            winnerProfiles.push({
                drawNumber: i + 1, drawDate: targetDraw.drawDate, winningNumber: num,
                profile: {
                    isHot: hotNumbers.has(num), isCold: coldNumbers.has(num), isOverdue: overdueNumbers.has(num),
                    isInHotZone: num >= hotZoneMin && num <= hotZoneMax, hasMomentum: trendingNumbers.has(num),
                    hasClusterStrength: strongClusterNumbers.has(num), isSeasonalHot: seasonalHotNumbers.has(num),
                },
                prevDrawSpread: getDrawSpread(prevDraw),
            });
        }
    }

    const performanceBreakdown = analyzePerformanceLog(performanceLog);
    const historicalSuccessAnalysis = createFullSuccessAnalysis(winnerProfiles, draws);
    const finalOptimalWeights = recalibrateWeightsFromHistory(historicalSuccessAnalysis);
    
    // Generate a summarized timeline from the detailed log for the chart
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
                
                performanceTimeline.push({
                    trainingSize: initialWindowSize + start,
                    avgMainHits: totalMainHits / batch.length,
                    avgStarHits: totalStarHits / batch.length,
                });
            }
        }
    }

    return { performanceTimeline, performanceLog, performanceBreakdown, historicalSuccessAnalysis, optimalWeights: finalOptimalWeights };
};
