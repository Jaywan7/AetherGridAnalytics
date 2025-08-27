import type { Draw, PatternTimingAnalysis, HotStreakAnalysis, DormancyBreakAnalysis, SeasonalTransitionAnalysis, SeasonalTransition } from '../types';
import { MAIN_NUMBER_MAX } from '../constants';
import { analyzeData } from './analysisService';
import { analyzeSeasonalPatterns } from './seasonalityService';
import { analyzeNumberRhythm } from './rhythmService';

const getAverage = (arr: number[]): number => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const getDrawSpread = (draw: Draw): number => {
    if (draw.mainNumbers.length < 2) return 0;
    return Math.max(...draw.mainNumbers) - Math.min(...draw.mainNumbers);
};

const analyzeHotStreaks = (draws: Draw[]): HotStreakAnalysis => {
    const windowSize = 50;
    const result: HotStreakAnalysis = {
        averageStreakDuration: 0,
        longestStreak: { number: 0, duration: 0 },
        streaksByNumber: [],
    };
    if (draws.length < windowSize + 10) return result;

    const streaks: { [num: number]: number[] } = {};
    const currentStreaks: { [num: number]: number } = {};
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        streaks[i] = [];
        currentStreaks[i] = 0;
    }

    for (let i = windowSize; i < draws.length; i++) {
        const trainingData = draws.slice(0, i);
        const analysis = analyzeData(trainingData, trainingData.length);
        
        const mainFreqSorted = analysis.mainNumberFrequencies.sort((a, b) => b.count - a.count);
        const hotThreshold = Math.floor(mainFreqSorted.length * 0.33);
        const hotNumbers = new Set(mainFreqSorted.slice(0, hotThreshold).map(f => f.number as number));

        for (let num = 1; num <= MAIN_NUMBER_MAX; num++) {
            if (hotNumbers.has(num)) {
                currentStreaks[num]++;
            } else {
                if (currentStreaks[num] > 1) { // Only count streaks of 2 or more
                    streaks[num].push(currentStreaks[num]);
                }
                currentStreaks[num] = 0;
            }
        }
    }

    // Finalize any ongoing streaks
    for (let num = 1; num <= MAIN_NUMBER_MAX; num++) {
        if (currentStreaks[num] > 1) {
            streaks[num].push(currentStreaks[num]);
        }
    }

    const allStreaks: number[] = [];
    let longestStreakDuration = 0;
    let longestStreakNumber = 0;

    for (let num = 1; num <= MAIN_NUMBER_MAX; num++) {
        if (streaks[num].length > 0) {
            allStreaks.push(...streaks[num]);
            const maxForNum = Math.max(...streaks[num]);
            if (maxForNum > longestStreakDuration) {
                longestStreakDuration = maxForNum;
                longestStreakNumber = num;
            }
            result.streaksByNumber.push({ number: num, duration: maxForNum });
        }
    }
    
    result.averageStreakDuration = getAverage(allStreaks);
    result.longestStreak = { number: longestStreakNumber, duration: longestStreakDuration };
    result.streaksByNumber.sort((a,b) => b.duration - a.duration);

    return result;
};

const analyzeDormancyBreaks = (draws: Draw[]): DormancyBreakAnalysis => {
    const result: DormancyBreakAnalysis = {
        avgSpreadBeforeBreak: 0,
        globalAvgSpread: getAverage(draws.map(getDrawSpread)),
        companionActivityIncrease: 0,
    };
    if (draws.length < 50) return result;

    const breakEvents: { preDraw: Draw }[] = [];
    const analysis = analyzeData(draws, draws.length);
    
    for (let i = 1; i < draws.length; i++) {
        const preDraw = draws[i-1];
        const currentDraw = draws[i];

        for (const num of currentDraw.mainNumbers) {
            const dormancyInfo = analysis.patternAnalysis.dormancyAnalysis.mainNumberDormancy.find(d => d.number === num);
            if (dormancyInfo && dormancyInfo.isOverdue) {
                let lastSeenIndex = -1;
                for (let j = i - 1; j >= 0; j--) {
                    if (draws[j].mainNumbers.includes(num)) {
                        lastSeenIndex = j;
                        break;
                    }
                }
                if (lastSeenIndex === i-1) { // was drawn in previous draw, so not a dormancy break
                    continue;
                }
                breakEvents.push({ preDraw });
                break; 
            }
        }
    }

    if (breakEvents.length > 0) {
        result.avgSpreadBeforeBreak = getAverage(breakEvents.map(e => getDrawSpread(e.preDraw)));
    }
    
    return result;
};

const analyzeSeasonalTransitions = (draws: Draw[]): SeasonalTransitionAnalysis => {
    const seasonalAnalysis = analyzeSeasonalPatterns(draws);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyTransitions: SeasonalTransition[] = [];
    const topN = 10;

    for (let i = 1; i < monthNames.length; i++) {
        const prevMonth = monthNames[i-1];
        const currentMonth = monthNames[i];

        const prevTop = new Set(seasonalAnalysis.monthly[prevMonth]?.slice(0, topN).map(d => d.number) || []);
        const currentTop = new Set(seasonalAnalysis.monthly[currentMonth]?.slice(0, topN).map(d => d.number) || []);
        
        if(prevTop.size === 0 || currentTop.size === 0) continue;
        
        const intersection = new Set([...prevTop].filter(x => currentTop.has(x)));
        const union = new Set([...prevTop, ...currentTop]);
        const jaccardSimilarity = intersection.size / union.size;
        
        monthlyTransitions.push({
            fromPeriod: prevMonth,
            toPeriod: currentMonth,
            dissimilarityScore: 1 - jaccardSimilarity,
        });
    }

    if (monthlyTransitions.length === 0) {
        return { monthlyTransitions: [], mostVolatileMonth: 'N/A', leastVolatileMonth: 'N/A' };
    }
    
    monthlyTransitions.sort((a,b) => b.dissimilarityScore - a.dissimilarityScore);
    const mostVolatile = monthlyTransitions[0];
    const leastVolatile = monthlyTransitions[monthlyTransitions.length-1];

    return {
        monthlyTransitions: monthlyTransitions.sort((a,b) => monthNames.indexOf(a.toPeriod) - monthNames.indexOf(b.toPeriod)),
        mostVolatileMonth: `${mostVolatile.fromPeriod}-${mostVolatile.toPeriod}`,
        leastVolatileMonth: `${leastVolatile.fromPeriod}-${leastVolatile.toPeriod}`,
    };
};

export const analyzePatternTiming = (draws: Draw[]): PatternTimingAnalysis | null => {
    if (draws.length < 50) {
        return null;
    }

    return {
        hotStreakAnalysis: analyzeHotStreaks(draws),
        dormancyBreakAnalysis: analyzeDormancyBreaks(draws),
        seasonalTransitionAnalysis: analyzeSeasonalTransitions(draws),
        rhythmAnalysis: analyzeNumberRhythm(draws),
    };
};
