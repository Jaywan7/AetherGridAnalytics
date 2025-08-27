
import type { Draw, AnalysisResult, PatternInsight, PatternAnalysis, DormancyData, FrequencyData, DeltaAnalysisResult, PerformanceLogItem, ForecastPerformanceInsight, HitProfile, MomentumData, ClusterStrengthData } from '../types';
import {
    MAIN_NUMBER_COUNT,
    MAIN_NUMBER_MIN,
    MAIN_NUMBER_MAX,
    STAR_NUMBER_COUNT,
    STAR_NUMBER_MIN,
    STAR_NUMBER_MAX,
    MAIN_POOL_ODD,
    MAIN_POOL_EVEN,
    STAR_POOL_EVEN,
    STAR_POOL_ODD,
} from '../constants';
import { analyzeAntiPopularity } from './antiPopularityService';

const getRecencyWeight = (drawIndex: number, totalDraws: number): number => {
    if (totalDraws <= 1) return 1;
    // This constant controls the decay rate. A smaller value = faster decay.
    const decayFactor = totalDraws * 0.2;
    const exponent = (drawIndex - (totalDraws - 1)) / decayFactor;
    return Math.exp(exponent);
};

// ===================================
// Helper Functions
// ===================================

const factorial = (n: number): number => {
    if (n < 0) return 0;
    if (n === 0) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
};

const binomialCombinations = (n: number, k: number): number => {
    if (k < 0 || k > n) {
        return 0;
    }
    if (k > n / 2) k = n - k;
    let res = 1;
    for (let i = 1; i <= k; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
};

const getAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// ===================================
// Pattern Analysis Functions
// ===================================

const analyzeZones = (draws: Draw[]): PatternAnalysis['zoneAnalysis'] => {
    const zoneCounts = new Map<string, number>();
    let concentrationCount = 0;
    const zones = ['1-10', '11-20', '21-30', '31-40', '41-50'];
    zones.forEach(z => zoneCounts.set(z, 0));

    draws.forEach((draw, index) => {
        const weight = getRecencyWeight(index, draws.length);
        const drawZoneCounts = new Map<string, number>();
        draw.mainNumbers
            .filter(n => n >= MAIN_NUMBER_MIN && n <= MAIN_NUMBER_MAX)
            .forEach(n => {
                const zoneIndex = Math.floor((n - 1) / 10);
                if (zoneIndex >= 0 && zoneIndex < zones.length) {
                    const zoneName = zones[zoneIndex];
                    zoneCounts.set(zoneName, (zoneCounts.get(zoneName) || 0) + weight);
                    drawZoneCounts.set(zoneName, (drawZoneCounts.get(zoneName) || 0) + 1); // unweighted for this stat
                }
            });
        if (Array.from(drawZoneCounts.values()).some(count => count >= 3)) {
            concentrationCount++; // unweighted for this stat
        }
    });

    const zoneDistribution = Array.from(zoneCounts.entries()).map(([name, value]) => ({ name, value }));
    const sortedZones = [...zoneDistribution].sort((a, b) => a.value - b.value);

    return {
        zoneDistribution,
        hotZone: sortedZones[sortedZones.length - 1].name,
        coldZone: sortedZones[0].name,
        concentrationStats: {
            threeOrMoreInZone: {
                percentage: (concentrationCount / draws.length) * 100
            }
        }
    };
};

const analyzeSpread = (draws: Draw[]): PatternAnalysis['spreadAnalysis'] => {
    const spreadsWithWeights = draws.map((d, index) => {
        const validNumbers = d.mainNumbers.filter(n => n >= MAIN_NUMBER_MIN && n <= MAIN_NUMBER_MAX);
        if (validNumbers.length < 2) return null;
        return {
            spread: Math.max(...validNumbers) - Math.min(...validNumbers),
            weight: getRecencyWeight(index, draws.length)
        };
    }).filter(s => s !== null) as { spread: number; weight: number }[];
    
    const spreads = spreadsWithWeights.map(s => s.spread);
    const weights = spreadsWithWeights.map(s => s.weight);

    const weightedSum = spreads.reduce((acc, val, i) => acc + val * weights[i], 0);
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    const averageSpread = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const spreadCounts = new Map<number, number>();
    spreadsWithWeights.forEach(s => spreadCounts.set(s.spread, (spreadCounts.get(s.spread) || 0) + s.weight));
    
    const spreadDistribution = Array.from(spreadCounts.entries())
        .map(([spread, count]) => ({ name: spread, value: count }))
        .sort((a, b) => a.name - b.name);

    const mostCommonSpread = [...spreadDistribution].sort((a,b) => b.value - a.value)[0]?.name || 'N/A';
    
    return {
        spreadDistribution,
        averageSpread,
        mostCommonSpread: `${mostCommonSpread}`,
    };
};

const analyzeCompanions = (draws: Draw[]): PatternAnalysis['companionAnalysis'] => {
    const companionMap = new Map<number, Map<number, number>>();
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        companionMap.set(i, new Map());
    }

    draws.forEach((draw, index) => {
        const weight = getRecencyWeight(index, draws.length);
        const numbers = draw.mainNumbers.filter(n => n >= MAIN_NUMBER_MIN && n <= MAIN_NUMBER_MAX);
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                const n1 = numbers[i];
                const n2 = numbers[j];
                const n1Companions = companionMap.get(n1)!;
                const n2Companions = companionMap.get(n2)!;
                n1Companions.set(n2, (n1Companions.get(n2) || 0) + weight);
                n2Companions.set(n1, (n2Companions.get(n1) || 0) + weight);
            }
        }
    });

    const companionData: PatternAnalysis['companionAnalysis']['companionData'] = {};
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const companions = Array.from(companionMap.get(i)!.entries())
            .map(([number, count]) => ({ number, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        companionData[i] = companions;
    }

    return { companionData };
};

const analyzeStarSum = (draws: Draw[]): PatternAnalysis['starSumAnalysis'] => {
    const sumsWithWeights = draws.map((d, index) => {
        const validStars = d.starNumbers.filter(n => n >= STAR_NUMBER_MIN && n <= STAR_NUMBER_MAX);
        if (validStars.length !== STAR_NUMBER_COUNT) return null;
        return {
            sum: validStars[0] + validStars[1],
            weight: getRecencyWeight(index, draws.length)
        };
    }).filter(s => s !== null) as { sum: number; weight: number }[];

    const sumCounts = new Map<number, number>();
    sumsWithWeights.forEach(s => sumCounts.set(s.sum, (sumCounts.get(s.sum) || 0) + s.weight));

    const sumDistribution = Array.from(sumCounts.entries())
        .map(([sum, count]) => ({ name: sum, value: count }))
        .sort((a, b) => a.name - b.name);
    
    const mostCommonSum = [...sumDistribution].sort((a,b) => b.value - a.value)[0]?.name || 'N/A';

    return {
        sumDistribution,
        mostCommonSum: `${mostCommonSum}`,
    };
};

const analyzeStarEvenOdd = (draws: Draw[]): PatternAnalysis['starEvenOddAnalysis'] => {
    let evenEven = 0, oddOdd = 0, evenOdd = 0;
    let totalWeight = 0;

    draws.forEach((d, index) => {
        const validStars = d.starNumbers.filter(n => n >= STAR_NUMBER_MIN && n <= STAR_NUMBER_MAX);
        if (validStars.length !== STAR_NUMBER_COUNT) return;
        
        const weight = getRecencyWeight(index, draws.length);
        totalWeight += weight;
        
        const isEven1 = validStars[0] % 2 === 0;
        const isEven2 = validStars[1] % 2 === 0;

        if (isEven1 && isEven2) evenEven += weight;
        else if (!isEven1 && !isEven2) oddOdd += weight;
        else evenOdd += weight;
    });

    const total = totalWeight > 0 ? totalWeight : 1;
    const totalCombos = binomialCombinations(STAR_NUMBER_MAX, STAR_NUMBER_COUNT);
    
    return {
        evenOddDistribution: [
            { combination: 'Even/Even', percentage: (evenEven / total) * 100, theoretical: binomialCombinations(STAR_POOL_EVEN, 2) / totalCombos },
            { combination: 'Odd/Odd', percentage: (oddOdd / total) * 100, theoretical: binomialCombinations(STAR_POOL_ODD, 2) / totalCombos },
            { combination: 'Even/Odd', percentage: (evenOdd / total) * 100, theoretical: (STAR_POOL_EVEN * STAR_POOL_ODD) / totalCombos },
        ]
    };
};

const analyzeRepetition = (draws: Draw[]): PatternAnalysis['repetitionAnalysis'] => {
    let mainRepeat = 0, doubleMainRepeat = 0, starRepeat = 0, totalWeight = 0;
    for (let i = 1; i < draws.length; i++) {
        const weight = getRecencyWeight(i, draws.length);
        totalWeight += weight;

        const prevMain = new Set(draws[i - 1].mainNumbers);
        const currentMain = draws[i].mainNumbers;
        const mainIntersection = currentMain.filter(n => prevMain.has(n));
        if (mainIntersection.length === 1) mainRepeat += weight;
        if (mainIntersection.length >= 2) doubleMainRepeat += weight;
        
        const prevStar = new Set(draws[i - 1].starNumbers);
        const currentStar = draws[i].starNumbers;
        if (currentStar.some(n => prevStar.has(n))) starRepeat += weight;
    }

    const comparableWeight = totalWeight > 0 ? totalWeight : 1;
    return {
        mainRepeatRate: (mainRepeat / comparableWeight) * 100,
        doubleMainRepeatRate: (doubleMainRepeat / comparableWeight) * 100,
        starRepeatRate: (starRepeat / comparableWeight) * 100,
    };
};

const analyzeDormancy = (draws: Draw[]): PatternAnalysis['dormancyAnalysis'] => {
    const getWeightedDormancyAverage = (arr: { duration: number, weight: number }[]): number => {
        if (arr.length === 0) return 0;
        const weightedSum = arr.reduce((sum, item) => sum + item.duration * item.weight, 0);
        const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };
    
    const analyzeSet = (maxNum: number, numberGetter: (d: Draw) => number[]): DormancyData[] => {
        const lastSeen: { [key: number]: number } = {};
        const dormancies: { [key: number]: { duration: number, weight: number }[] } = {};

        for (let i = 1; i <= maxNum; i++) dormancies[i] = [];

        draws.forEach((draw, index) => {
            numberGetter(draw).forEach(num => {
                if (num > maxNum || num < 1) return;
                if (lastSeen[num] !== undefined) {
                    const duration = index - lastSeen[num];
                    const weight = getRecencyWeight(index, draws.length);
                    dormancies[num].push({ duration, weight });
                }
                lastSeen[num] = index;
            });
        });
        
        const result: DormancyData[] = [];
        for (let i = 1; i <= maxNum; i++) {
            const currentDormancy = lastSeen[i] !== undefined ? draws.length - 1 - lastSeen[i] : draws.length;
            const averageDormancy = getWeightedDormancyAverage(dormancies[i]);
            result.push({
                number: i,
                currentDormancy,
                averageDormancy,
                isOverdue: averageDormancy > 0 && currentDormancy > averageDormancy
            });
        }
        return result;
    };
    
    return {
        mainNumberDormancy: analyzeSet(MAIN_NUMBER_MAX, d => d.mainNumbers),
        starNumberDormancy: analyzeSet(STAR_NUMBER_MAX, d => d.starNumbers),
    };
};

const analyzeDeltas = (draws: Draw[]): DeltaAnalysisResult => {
    const allDeltasWithWeights: { delta: number; weight: number }[] = [];
    draws.forEach((draw, index) => {
        const weight = getRecencyWeight(index, draws.length);
        const sorted = [...draw.mainNumbers].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length - 1; i++) {
            allDeltasWithWeights.push({ delta: sorted[i + 1] - sorted[i], weight });
        }
    });

    if (allDeltasWithWeights.length === 0) {
        return { averageDelta: 0, deltaDistribution: [] };
    }

    const weightedSum = allDeltasWithWeights.reduce((acc, item) => acc + item.delta * item.weight, 0);
    const totalWeight = allDeltasWithWeights.reduce((acc, item) => acc + item.weight, 0);
    const averageDelta = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    const deltaCounts = new Map<number, number>();
    allDeltasWithWeights.forEach(d => deltaCounts.set(d.delta, (deltaCounts.get(d.delta) || 0) + d.weight));

    const deltaDistribution = Array.from(deltaCounts.entries())
        .map(([delta, count]) => ({ name: delta, value: count }))
        .sort((a, b) => a.name - b.name);

    return { averageDelta, deltaDistribution };
}

const analyzeMomentum = (draws: Draw[]): MomentumData[] => {
    const momentumWindow = 25;
    if (draws.length < momentumWindow * 2) return [];

    const recentDraws = draws.slice(-momentumWindow);
    const historicalDraws = draws.slice(0, -momentumWindow);
    
    const recentCounts = new Map<number, number>();
    recentDraws.forEach(d => d.mainNumbers.forEach(n => recentCounts.set(n, (recentCounts.get(n) || 0) + 1)));
    
    const historicalCounts = new Map<number, number>();
    historicalDraws.forEach(d => d.mainNumbers.forEach(n => historicalCounts.set(n, (historicalCounts.get(n) || 0) + 1)));

    const momentumData: MomentumData[] = [];
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const recentFreq = (recentCounts.get(i) || 0) / recentDraws.length;
        const historicalFreq = (historicalCounts.get(i) || 0) / historicalDraws.length;
        const momentumScore = historicalFreq > 0 ? (recentFreq / historicalFreq - 1) * 100 : recentFreq * 100;
        momentumData.push({ number: i, momentumScore });
    }

    return momentumData;
};

const analyzeClusterStrength = (draws: Draw[], companionAnalysis: PatternAnalysis['companionAnalysis']): ClusterStrengthData[] => {
    const recencyWindow = 10;
    if (draws.length < recencyWindow) return [];

    const lastSeen = new Map<number, number>();
    draws.forEach((d, index) => {
        d.mainNumbers.forEach(n => lastSeen.set(n, index));
    });

    const clusterData: ClusterStrengthData[] = [];
    const latestDrawIndex = draws.length - 1;

    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const companions = companionAnalysis.companionData[i] || [];
        if (companions.length === 0) {
            clusterData.push({ number: i, clusterScore: 0 });
            continue;
        }
        
        let clusterScore = 0;
        const top5Companions = companions.slice(0, 5);
        
        top5Companions.forEach(comp => {
            const seenIndex = lastSeen.get(comp.number);
            if (seenIndex !== undefined && latestDrawIndex - seenIndex < recencyWindow) {
                // Give more score to more recent companions
                clusterScore += (recencyWindow - (latestDrawIndex - seenIndex));
            }
        });
        clusterData.push({ number: i, clusterScore });
    }
    return clusterData;
};


// ===================================
// Main Analysis Orchestrator
// ===================================

export const analyzeData = (draws: Draw[], totalRows: number): Omit<AnalysisResult, 'strategies' | 'intelligentCoupons' | 'aetherScores'> => {
    const validDraws = draws.length;
    if (validDraws === 0) {
        // This should be handled by the caller, but as a safeguard:
        // We will return a structure that doesn't cause crashes downstream.
        const emptyPatterns: PatternAnalysis = {
            zoneAnalysis: { zoneDistribution: [], hotZone: 'N/A', coldZone: 'N/A', concentrationStats: { threeOrMoreInZone: { percentage: 0 } } },
            spreadAnalysis: { spreadDistribution: [], averageSpread: 0, mostCommonSpread: 'N/A' },
            companionAnalysis: { companionData: {} },
            starSumAnalysis: { sumDistribution: [], mostCommonSum: 'N/A' },
            starEvenOddAnalysis: { evenOddDistribution: [] },
            repetitionAnalysis: { mainRepeatRate: 0, doubleMainRepeatRate: 0, starRepeatRate: 0 },
            dormancyAnalysis: { mainNumberDormancy: [], starNumberDormancy: [] },
            deltaAnalysis: { averageDelta: 0, deltaDistribution: [] },
            momentumAnalysis: [],
            clusterStrengthAnalysis: [],
        };
        return {
            totalRows,
            validDraws,
            topPatterns: [],
            patternAnalysis: emptyPatterns,
            mainNumberFrequencies: [],
            starNumberFrequencies: [],
        };
    }

    const allPatterns: PatternInsight[] = [];
    const N = validDraws;

    // --- Advanced Pattern Analysis (run first to use results) ---
    const companionAnalysis = analyzeCompanions(draws);
    const patternAnalysis: PatternAnalysis = {
        zoneAnalysis: analyzeZones(draws),
        spreadAnalysis: analyzeSpread(draws),
        companionAnalysis: companionAnalysis,
        starSumAnalysis: analyzeStarSum(draws),
        starEvenOddAnalysis: analyzeStarEvenOdd(draws),
        repetitionAnalysis: analyzeRepetition(draws),
        dormancyAnalysis: analyzeDormancy(draws),
        deltaAnalysis: analyzeDeltas(draws),
        momentumAnalysis: analyzeMomentum(draws),
        clusterStrengthAnalysis: analyzeClusterStrength(draws, companionAnalysis),
    };

    // --- Per-Draw Anomaly Counting (Single Loop) ---
    const mainCounts = new Map<number, number>();
    const starCounts = new Map<number, number>();
    const mainOddCounts = Array(MAIN_NUMBER_COUNT + 1).fill(0);
    const mainSums: number[] = [];
    let neighborDraws = 0;

    draws.forEach((d, index) => {
        const weight = getRecencyWeight(index, N);

        // Star number aggregation
        d.starNumbers.forEach(n => starCounts.set(n, (starCounts.get(n) || 0) + weight));
        
        // Main number aggregation
        d.mainNumbers.forEach(n => mainCounts.set(n, (mainCounts.get(n) || 0) + weight));
        
        // Unweighted stats for simpler pattern checks
        const oddCount = d.mainNumbers.filter(n => n % 2 !== 0).length;
        mainOddCounts[oddCount]++;
        mainSums.push(d.mainNumbers.reduce((a, b) => a + b, 0));
        const sorted = [...d.mainNumbers].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i] + 1 === sorted[i + 1]) {
                neighborDraws++;
                break;
            }
        }
    });

    const totalWeightSum = Array.from(mainCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalStarWeightSum = Array.from(starCounts.values()).reduce((sum, count) => sum + count, 0);
    
    // --- Generate Insights based on Design Specification ---
    const mainExpected = totalWeightSum / MAIN_NUMBER_MAX;
    const starExpected = totalStarWeightSum / STAR_NUMBER_MAX;

    // --- Analysis 1: Individual Tals Frekvens ---
    const mainFrequenciesList = Array.from({ length: MAIN_NUMBER_MAX }, (_, i) => i + 1)
        .map(num => ({ number: num, count: mainCounts.get(num) || 0 }));
    mainFrequenciesList.sort((a, b) => a.count - b.count);
    const coldestMain = mainFrequenciesList[0];
    const warmestMain = mainFrequenciesList[mainFrequenciesList.length - 1];
    
    allPatterns.push({
        title: `Koldeste Hovedtal (1-${MAIN_NUMBER_MAX})`,
        detail: `Tallet ${coldestMain.number} har en vægtet score på ${coldestMain.count.toFixed(1)}, hvor ${mainExpected.toFixed(1)} var forventet.`,
        deviation: ((coldestMain.count - mainExpected) / mainExpected) * 100
    });
    allPatterns.push({
        title: `Varmeste Hovedtal (1-${MAIN_NUMBER_MAX})`,
        detail: `Tallet ${warmestMain.number} har en vægtet score på ${warmestMain.count.toFixed(1)}, hvor ${mainExpected.toFixed(1)} var forventet.`,
        deviation: ((warmestMain.count - mainExpected) / mainExpected) * 100
    });

    const starFrequenciesList = Array.from({ length: STAR_NUMBER_MAX }, (_, i) => i + 1)
        .map(num => ({ number: num, count: starCounts.get(num) || 0 }));
    starFrequenciesList.sort((a, b) => a.count - b.count);
    const coldestStar = starFrequenciesList[0];
    const warmestStar = starFrequenciesList[starFrequenciesList.length - 1];

    allPatterns.push({
        title: `Koldeste Stjernetal (1-${STAR_NUMBER_MAX})`,
        detail: `Tallet ${coldestStar.number} har en vægtet score på ${coldestStar.count.toFixed(1)}. Den teoretiske forventning var ${starExpected.toFixed(1)}.`,
        deviation: ((coldestStar.count - starExpected) / starExpected) * 100
    });
    allPatterns.push({
        title: `Varmeste Stjernetal (1-${STAR_NUMBER_MAX})`,
        detail: `Tallet ${warmestStar.number} har en vægtet score på ${warmestStar.count.toFixed(1)}, hvor ${starExpected.toFixed(1)} var forventet.`,
        deviation: ((warmestStar.count - starExpected) / starExpected) * 100
    });

    // --- Analysis 2: Lige/Ulige Fordeling (Hovedtal) - Unweighted ---
    const totalMainCombos = binomialCombinations(MAIN_NUMBER_MAX, MAIN_NUMBER_COUNT);
    const evenOddPatterns = [];
    for (let i = 0; i <= MAIN_NUMBER_COUNT; i++) {
        const odd = i;
        const even = MAIN_NUMBER_COUNT - odd;
        const observed = mainOddCounts[i];
        const expected = (binomialCombinations(MAIN_POOL_ODD, odd) * binomialCombinations(MAIN_POOL_EVEN, even) / totalMainCombos) * N;
        evenOddPatterns.push({
            name: `${odd} ulige, ${even} lige`,
            observed,
            expected,
            deviation: expected > 0 ? ((observed - expected) / expected) * 100 : 0
        });
    }
    evenOddPatterns.sort((a, b) => b.deviation - a.deviation);
    const mostOverrepresented = evenOddPatterns[0];

    allPatterns.push({
        title: "Mest Overrepræsenterede Lige/Ulige Fordeling",
        detail: `Kombinationen "${mostOverrepresented.name}" er sket ${((mostOverrepresented.observed / N) * 100).toFixed(1)}% af gangene. Den teoretiske forventning er kun ${((mostOverrepresented.expected / N) * 100).toFixed(1)}%.`,
        deviation: mostOverrepresented.deviation
    });

    // --- Analysis 3: Sum af Hovedtal - Unweighted ---
    const sumMean = getAverage(mainSums);
    const sumStdDev = Math.sqrt(mainSums.map(x => Math.pow(x - sumMean, 2)).reduce((a, b) => a + b, 0) / N);
    const lowerBound = sumMean - sumStdDev;
    const upperBound = sumMean + sumStdDev;
    const outlierCount = mainSums.filter(sum => sum < lowerBound || sum > upperBound).length;
    const observedOutlierPercent = (outlierCount / N) * 100;
    const theoreticalOutlierPercent = 31.7; // For a normal distribution, outside 1 std dev

    allPatterns.push({
        title: "Usædvanlig Høj/Lav Sum-frekvens",
        detail: `Summen af hovedtal faldt uden for det statistisk sandsynlige interval (${lowerBound.toFixed(0)}-${upperBound.toFixed(0)}) i ${observedOutlierPercent.toFixed(1)}% af trækningerne. Teoretisk forventning var ~${theoreticalOutlierPercent.toFixed(1)}%.`,
        deviation: ((observedOutlierPercent - theoreticalOutlierPercent) / theoreticalOutlierPercent) * 100
    });

    // --- Analysis 4: Konsekutive Hovedtal (Nabotal) - Unweighted ---
    const neighborObservedPercent = (neighborDraws / N) * 100;
    const neighborExpectedPercent = 40.0;
    allPatterns.push({
        title: "Afvigelse i Frekvens af Nabotal",
        detail: `Der har været trækninger med nabotal ${neighborDraws} gange (${neighborObservedPercent.toFixed(1)}%). Den teoretiske forventning er ca. ${neighborExpectedPercent.toFixed(0)}%.`,
        deviation: ((neighborObservedPercent - neighborExpectedPercent) / neighborExpectedPercent) * 100
    });

    // --- Final Assembly ---
    const topPatterns = allPatterns
        .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
        .slice(0, 10);
        
    const mainNumberFrequencies: FrequencyData[] = Array.from(mainCounts.entries())
        .map(([number, count]) => ({ number, count, observed: count }));
        
    const starNumberFrequencies: FrequencyData[] = Array.from(starCounts.entries())
        .map(([number, count]) => ({ number, count, observed: count }));

    const antiPopularityAnalysis = analyzeAntiPopularity(draws);

    return {
        totalRows,
        validDraws,
        topPatterns,
        patternAnalysis,
        mainNumberFrequencies,
        starNumberFrequencies,
        antiPopularityAnalysis,
    };
};

export const analyzeForecastPerformance = (
    performanceLog: PerformanceLogItem[],
    fullAnalysis: AnalysisResult
): ForecastPerformanceInsight | null => {
    if (performanceLog.length === 0 || !fullAnalysis) {
        return null;
    }

    // 1. Define character traits from the full analysis
    const mainFreq = fullAnalysis.mainNumberFrequencies.sort((a, b) => a.count - b.count);
    const hotThreshold = Math.floor(mainFreq.length * 0.67); // Top 33%
    const coldThreshold = Math.floor(mainFreq.length * 0.33); // Bottom 33%

    const hotNumbers = new Set(mainFreq.slice(hotThreshold).map(f => f.number as number));
    const coldNumbers = new Set(mainFreq.slice(0, coldThreshold).map(f => f.number as number));
    
    const overdueNumbers = new Set(
        fullAnalysis.patternAnalysis.dormancyAnalysis.mainNumberDormancy
            .filter(d => d.isOverdue)
            .map(d => d.number)
    );

    const [hotZoneMin, hotZoneMax] = fullAnalysis.patternAnalysis.zoneAnalysis.hotZone.split('-').map(Number);
    
    const trendingNumbers = new Set(
        fullAnalysis.patternAnalysis.momentumAnalysis
            .filter(m => m.momentumScore > 0)
            .sort((a, b) => b.momentumScore - a.momentumScore)
            .slice(0, 15) // Top 15 trending
            .map(m => m.number)
    );

    const strongClusterNumbers = new Set(
        fullAnalysis.patternAnalysis.clusterStrengthAnalysis
            .filter(c => c.clusterScore > 0)
            .sort((a, b) => b.clusterScore - a.clusterScore)
            .slice(0, 15) // Top 15 cluster
            .map(c => c.number)
    );

    // 2. Aggregate hits
    let totalMainHits = 0;
    const hitsProfileCounter = {
        hot: 0,
        cold: 0,
        overdue: 0,
        hotZone: 0,
        momentum: 0,
        cluster: 0,
    };

    for (const logItem of performanceLog) {
        if (logItem.mainHits > 0) {
            const actualNumbers = new Set(logItem.actual_main);
            const hits = logItem.forecast_top10_main.filter(n => actualNumbers.has(n));
            
            totalMainHits += hits.length;

            for (const hit of hits) {
                if (hotNumbers.has(hit)) hitsProfileCounter.hot++;
                if (coldNumbers.has(hit)) hitsProfileCounter.cold++;
                if (overdueNumbers.has(hit)) hitsProfileCounter.overdue++;
                if (hit >= hotZoneMin && hit <= hotZoneMax) hitsProfileCounter.hotZone++;
                if (trendingNumbers.has(hit)) hitsProfileCounter.momentum++;
                if (strongClusterNumbers.has(hit)) hitsProfileCounter.cluster++;
            }
        }
    }

    if (totalMainHits === 0) {
        return {
            totalHits: 0,
            hitProfile: { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0 },
            conclusion: "Modellen ramte ingen hovedtal i backtesting-perioden. Profilanalyse er ikke mulig."
        };
    }

    // 3. Calculate percentages
    const hitProfile: HitProfile = {
        hot: (hitsProfileCounter.hot / totalMainHits) * 100,
        cold: (hitsProfileCounter.cold / totalMainHits) * 100,
        overdue: (hitsProfileCounter.overdue / totalMainHits) * 100,
        hotZone: (hitsProfileCounter.hotZone / totalMainHits) * 100,
        momentum: (hitsProfileCounter.momentum / totalMainHits) * 100,
        cluster: (hitsProfileCounter.cluster / totalMainHits) * 100,
    };

    // 4. Generate conclusion
    const sortedProfile = Object.entries(hitProfile)
        .map(([key, value]) => ({ name: key as keyof HitProfile, value }))
        .sort((a, b) => b.value - a.value);

    const bestCategory = sortedProfile[0];
    const worstCategory = sortedProfile[sortedProfile.length - 1];
    
    const categoryNames: Record<keyof HitProfile, string> = {
        hot: "'varme' tal (ofte trukket)",
        cold: "'kolde' tal (sjældent trukket)",
        overdue: "'overdue' tal (modne til trækning)",
        hotZone: "tal i den 'varmeste' zone",
        momentum: "tal med 'momentum' (stigende trend)",
        cluster: "tal med 'stærke klynger' (aktive følgetal)",
    };

    let conclusion = `Modellen viser en markant styrke i at forudsige ${categoryNames[bestCategory.name]}.`;
    if (bestCategory.value > worstCategory.value * 1.5 && bestCategory.value > 0) { // At least 50% better and not zero
        conclusion += ` Den er mindre effektiv til at ramme ${categoryNames[worstCategory.name]}. Dette indikerer, at modellens vægtning bør justeres for at favorisere de faktorer, der driver dens succes.`;
    } else {
        conclusion += ` Præstationen er relativt balanceret på tværs af forskellige talkategorier.`;
    }

    return {
        totalHits: totalMainHits,
        hitProfile,
        conclusion,
    };
};
