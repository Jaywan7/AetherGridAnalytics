
import type { AnalysisResult, AetherScoreData, AetherScoreResult, AetherStarScoreResult, AetherScoreBreakdown, Draw, SeasonalAnalysis, WeightConfiguration, MetaPatternAnalysis } from '../types';
import { MAIN_NUMBER_MAX, MAIN_NUMBER_COUNT, STAR_NUMBER_MAX, STAR_NUMBER_COUNT } from '../constants';

const generateMainJustification = (breakdown: AetherScoreBreakdown, score: number): string => {
    if (score <= 0) {
        return "Low overall score due to negative factors like being a cold number or in a cold zone.";
    }

    const positiveFactors = [
        { name: 'frequency', value: breakdown.frequency, text: 'strong frequency' },
        { name: 'dormancy', value: breakdown.dormancy, text: 'highly overdue' },
        { name: 'zone', value: breakdown.zone, text: 'in a hot zone' },
        { name: 'companion', value: breakdown.companion, text: 'strong companion links' },
        { name: 'seasonal', value: breakdown.seasonal || 0, text: 'strong seasonal performance' },
        { name: 'postDormancy', value: breakdown.postDormancy || 0, text: 'a recent dormancy break' },
        { name: 'momentum', value: breakdown.momentum || 0, text: 'strong momentum' },
        { name: 'clusterStrength', value: breakdown.clusterStrength || 0, text: 'an active cluster' },
        { name: 'stability', value: breakdown.stability || 0, text: 'high pattern stability' },
    ].filter(f => f.value > 10).sort((a, b) => b.value - a.value);

    if (positiveFactors.length === 0) {
        return "A balanced number with no single strong positive factor.";
    }
    if (positiveFactors.length === 1) {
        return `Primarily ranked high due to ${positiveFactors[0].text}.`;
    }
    
    return `Strong score from a combination of ${positiveFactors[0].text} and ${positiveFactors[1].text}.`;
};

const generateStarJustification = (breakdown: { frequency: number; dormancy: number }, score: number): string => {
    if (score <= 0) return "Low score due to low frequency or not being overdue.";

    const positiveFactors = [
        { name: 'frequency', value: breakdown.frequency, text: 'strong momentum' },
        { name: 'dormancy', value: breakdown.dormancy, text: 'highly overdue' },
    ].filter(f => f.value > 0).sort((a, b) => b.value - a.value);
    
    if (positiveFactors.length === 2 && Math.abs(positiveFactors[0].value - positiveFactors[1].value) < 10) {
        return "Excellent balance of being both hot and overdue.";
    }
    if (positiveFactors.length > 0) {
        return `Ranked high for having ${positiveFactors[0].text}.`;
    }
    return "A balanced number with moderate scores across factors.";
};

export const calculateAdaptiveAetherScores = (
    analysis: Omit<AnalysisResult, 'strategies' | 'aetherScores' | 'intelligentCoupons'>,
    draws: Draw[],
    seasonalAnalysis: SeasonalAnalysis,
    metaPatternAnalysis: MetaPatternAnalysis,
    nextDrawDate: Date | null,
    weights: WeightConfiguration
): AetherScoreData => {
    const { mainNumberFrequencies, starNumberFrequencies, patternAnalysis } = analysis;

    // AetherGrid v9.5: Forward-looking seasonal analysis
    const { 
        frequency: frequencyWeight, 
        dormancy: dormancyWeight, 
        zone: zoneWeight, 
        companion: companionWeight, 
        seasonal: seasonalWeight,
        momentum: momentumWeight,
        clusterStrength: clusterStrengthWeight,
        stability: stabilityWeight,
    } = weights;
    const insight = "Recency-Bias model v9.5 is active, using a predicted next draw date for forward-looking seasonal analysis.";

    // ===================================
    // Main Number Scores
    // ===================================
    
    // Step 1: Calculate base scores from weighted analysis
    const totalWeightSum = mainNumberFrequencies.reduce((sum, f) => sum + f.count, 0);
    const avgWeightedFreq = totalWeightSum / MAIN_NUMBER_MAX;

    const frequencyScores: { [num: number]: number } = {};
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const freq = mainNumberFrequencies.find(f => f.number === i)?.count || 0;
        frequencyScores[i] = avgWeightedFreq > 0 ? ((freq - avgWeightedFreq) / avgWeightedFreq) * 100 : 0;
    }

    const expectedZoneWeight = totalWeightSum / 5;
    const zoneDeviationScores = new Map<string, number>();
    patternAnalysis.zoneAnalysis.zoneDistribution.forEach(zone => {
        const deviation = expectedZoneWeight > 0 ? ((zone.value - expectedZoneWeight) / expectedZoneWeight) * 100 : 0;
        zoneDeviationScores.set(String(zone.name), deviation);
    });
    const numberZoneScores: { [num: number]: number } = {};
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const zoneIndex = Math.floor((i - 1) / 10);
        const zoneName = `${zoneIndex * 10 + 1}-${(zoneIndex + 1) * 10}`;
        numberZoneScores[i] = zoneDeviationScores.get(zoneName) || 0;
    }
    
    const dormancyScores: { [num: number]: number } = {};
    patternAnalysis.dormancyAnalysis.mainNumberDormancy.forEach(d => {
        const ratio = d.averageDormancy > 0 ? d.currentDormancy / d.averageDormancy : 0;
        const weightedRatio = Math.pow(ratio, 1.5);
        dormancyScores[d.number] = weightedRatio * 10;
    });

    const companionScores: { [num: number]: number } = {};
    const top10ByFreq = mainNumberFrequencies.sort((a,b) => b.count - a.count).slice(0, 10).map(f => f.number as number);
    const strongCompanionCounts = new Map<number, number>();
    top10ByFreq.forEach(topNum => {
        const strongCompanions = patternAnalysis.companionAnalysis.companionData[topNum] || [];
        strongCompanions.forEach(comp => {
            strongCompanionCounts.set(comp.number, (strongCompanionCounts.get(comp.number) || 0) + comp.count);
        });
    });
    const maxCompanionCount = Math.max(...Array.from(strongCompanionCounts.values()), 1);
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const score = strongCompanionCounts.get(i) || 0;
        companionScores[i] = (score / maxCompanionCount) * 50;
    }
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Use nextDrawDate if available, otherwise fallback to last draw date
    const dateForSeasonal = nextDrawDate ? nextDrawDate : (draws.length > 0 ? new Date(draws[draws.length-1].drawDate) : new Date());
    
    const seasonalScores: { [num: number]: number } = {};

    if (dateForSeasonal) {
        const currentMonth = dateForSeasonal.getUTCMonth(); // 0-11
        const currentMonthName = monthNames[currentMonth];
        const monthlyData = seasonalAnalysis.monthly[currentMonthName] || [];
        if (monthlyData.length > 0) {
            const maxCount = monthlyData[0].count;
            for (const item of monthlyData) {
                seasonalScores[item.number] = maxCount > 0 ? (item.count / maxCount) * 50 : 0;
            }
        }
    }

    // Step 2: NEW - Calculate Momentum, Cluster and Stability scores
    const momentumScores: { [num: number]: number } = {};
    patternAnalysis.momentumAnalysis.forEach(m => {
        momentumScores[m.number] = m.momentumScore;
    });

    const clusterStrengthScores: { [num: number]: number } = {};
    const maxClusterScore = Math.max(...patternAnalysis.clusterStrengthAnalysis.map(c => c.clusterScore), 1);
    patternAnalysis.clusterStrengthAnalysis.forEach(c => {
        clusterStrengthScores[c.number] = (c.clusterScore / maxClusterScore) * 50; // Normalize
    });

    const stabilityScores: { [num: number]: number } = {};
    if (metaPatternAnalysis?.hotColdTransitions) {
        const transitionsMap = new Map(metaPatternAnalysis.hotColdTransitions.map(t => [t.number, t.transitions]));
        const maxTransitions = Math.max(...Array.from(transitionsMap.values()), 1);

        for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
            const numTransitions = transitionsMap.get(i) || 0;
            // Inverse score: more transitions = less stable = lower score.
            // Normalize to a 0-50 range like other factors.
            stabilityScores[i] = (1 - (numTransitions / maxTransitions)) * 50;
        }
    }


    // Step 3: Calculate final score
    const mainScores: Omit<AetherScoreResult, 'rank'>[] = [];
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const dormancyInfo = patternAnalysis.dormancyAnalysis.mainNumberDormancy.find(d => d.number === i);
        let postDormancyBonus = 0;
        if (dormancyInfo && dormancyInfo.currentDormancy < 5 && dormancyInfo.averageDormancy > 20) {
            postDormancyBonus = 50 / (dormancyInfo.currentDormancy + 1);
        }

        const breakdown: AetherScoreBreakdown = {
            frequency: frequencyScores[i] || 0,
            zone: numberZoneScores[i] || 0,
            dormancy: dormancyScores[i] || 0,
            companion: companionScores[i] || 0,
            seasonal: seasonalScores[i] || 0,
            postDormancy: postDormancyBonus,
            momentum: momentumScores[i] || 0,
            clusterStrength: clusterStrengthScores[i] || 0,
            stability: stabilityScores[i] || 0,
        };
        const totalScore = (breakdown.frequency * frequencyWeight) 
                         + (breakdown.zone * zoneWeight) 
                         + (breakdown.dormancy * dormancyWeight) 
                         + (breakdown.companion * companionWeight)
                         + (breakdown.seasonal * seasonalWeight)
                         + (breakdown.momentum * momentumWeight)
                         + (breakdown.clusterStrength * clusterStrengthWeight)
                         + (breakdown.stability * stabilityWeight)
                         + postDormancyBonus;
        mainScores.push({
            number: i,
            score: totalScore,
            breakdown,
            justification: generateMainJustification(breakdown, totalScore),
        });
    }

    const mainNumberScores = mainScores.sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, rank: index + 1 }));

    // ===================================
    // Star Number Scores
    // ===================================
    const starScores: Omit<AetherStarScoreResult, 'rank'>[] = [];
    const totalStarWeight = starNumberFrequencies.reduce((sum, f) => sum + f.count, 0);
    const avgStarWeight = totalStarWeight / STAR_NUMBER_MAX;
    
    const starFrequencyScores: { [num: number]: number } = {};
    for (let i = 1; i <= STAR_NUMBER_MAX; i++) {
        const freq = starNumberFrequencies.find(f => f.number === i)?.count || 0;
        starFrequencyScores[i] = avgStarWeight > 0 ? ((freq - avgStarWeight) / avgStarWeight) * 100 : 0;
    }
    
    const starDormancyScores: { [num: number]: number } = {};
    patternAnalysis.dormancyAnalysis.starNumberDormancy.forEach(d => {
        const ratio = d.averageDormancy > 0 ? d.currentDormancy / d.averageDormancy : 0;
        starDormancyScores[d.number] = ratio * 10;
    });

    for (let i = 1; i <= STAR_NUMBER_MAX; i++) {
        const breakdown = {
            frequency: starFrequencyScores[i] || 0,
            dormancy: starDormancyScores[i] || 0,
        };
        const totalScore = (breakdown.frequency * 0.6) + (breakdown.dormancy * 0.4); // Simple 60/40 split for stars
        starScores.push({
            number: i,
            score: totalScore,
            breakdown,
            justification: generateStarJustification(breakdown, totalScore),
        });
    }

    const starNumberScores = starScores.sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, rank: index + 1 }));

    return { mainNumberScores, starNumberScores, insight };
};
