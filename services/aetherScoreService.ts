
import type { AnalysisResult, AetherScoreData, AetherScoreResult, AetherStarScoreResult, AetherScoreBreakdown, Draw, SeasonalAnalysis, WeightConfiguration, MetaPatternAnalysis, HistoricalSuccessAnalysis, AnalysisRegime } from '../types';
import { MAIN_NUMBER_MAX, MAIN_NUMBER_COUNT, STAR_NUMBER_MAX, STAR_NUMBER_COUNT } from '../constants';
import { getCurrentContext } from './specialDatesService';
import { getContextualBoosts } from './contextualScoringService';
import { calculatePopularityScores } from './popularityService';

const generateMainJustification = (breakdown: AetherScoreBreakdown, score: number, bonusReasons: string[], contextualReason: string): string => {
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

    let justification = "";
    if (positiveFactors.length === 0) {
        justification = "A balanced number with no single strong positive factor.";
    } else if (positiveFactors.length === 1) {
        justification = `Primarily ranked high due to ${positiveFactors[0].text}.`;
    } else {
        justification = `Strong score from a combination of ${positiveFactors[0].text} and ${positiveFactors[1].text}.`;
    }

    if (bonusReasons.length > 0) {
        justification += ` Boosted by ${bonusReasons.join(' & ')} success profile.`;
    }
    
    if (contextualReason) {
        justification += ` Contextually boosted for ${contextualReason}.`;
    }

    if (breakdown.popularity && breakdown.popularity < -5) {
        justification += ` Score reduced due to high popularity.`;
    }

    return justification;
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
    weights: WeightConfiguration,
    historicalSuccess: HistoricalSuccessAnalysis | null | undefined,
    detectedRegime: AnalysisRegime
): AetherScoreData => {
    const { mainNumberFrequencies, starNumberFrequencies, patternAnalysis } = analysis;
    const { frequency: frequencyWeight, dormancy: dormancyWeight, zone: zoneWeight, companion: companionWeight, seasonal: seasonalWeight, momentum: momentumWeight, clusterStrength: clusterStrengthWeight, stability: stabilityWeight } = weights;

    let insight = "Recency-Bias model v10.0 is active, using success-pattern templates and a predicted next draw date for forward-looking analysis.";

    // --- AetherGrid v11: Contextual Scoring ---
    const dateForSeasonal = nextDrawDate ? nextDrawDate : (draws.length > 0 ? new Date(draws[draws.length-1].drawDate) : new Date());
    const { context, easterDate } = getCurrentContext(dateForSeasonal);
    const { boosts: contextualBoosts, justification: contextJustification } = getContextualBoosts(context, easterDate);

    if (contextJustification) {
        insight += ` ${contextJustification}`;
    }

    // --- AetherGrid Fase 4: Dynamic Popularity Weighting ---
    let popularityWeight = 0.3; // Normal periods: 30% anti-popularity
    let popularityInsight = " Using standard anti-popularity weighting.";

    if (context !== 'NONE') {
        popularityWeight = 0.5; // Holiday periods: 50%
        popularityInsight = ` Holiday period detected: increasing anti-popularity weight to 50%.`;
    } else if (detectedRegime === 'Hot Streak' || detectedRegime === 'Volatile') {
        popularityWeight = 0.6; // Trend-periods: 60%
        popularityInsight = ` Trend/Volatile regime detected: increasing anti-popularity weight to 60%.`;
    }
    
    insight += popularityInsight;
    
    const popularityScores = calculatePopularityScores();

    // Pre-calculate profiles for all numbers based on the current analysis window
    const mainFreqSorted = [...mainNumberFrequencies].sort((a, b) => a.count - b.count);
    const hotThreshold = Math.floor(mainFreqSorted.length * 0.67);
    const coldThreshold = Math.floor(mainFreqSorted.length * 0.33);
    const hotNumbers = new Set(mainFreqSorted.slice(hotThreshold).map(f => f.number as number));
    const overdueNumbers = new Set(patternAnalysis.dormancyAnalysis.mainNumberDormancy.filter(d => d.isOverdue).map(d => d.number));
    const [hotZoneMin, hotZoneMax] = patternAnalysis.zoneAnalysis.hotZone.split('-').map(Number);
    const trendingNumbers = new Set(patternAnalysis.momentumAnalysis.filter(m => m.momentumScore > 0).map(m => m.number));
    const strongClusterNumbers = new Set(patternAnalysis.clusterStrengthAnalysis.filter(c => c.clusterScore > 0).map(c => c.number));
    
    const numberProfiles = new Map<number, { isHot: boolean, isOverdue: boolean, isInHotZone: boolean, hasMomentum: boolean, hasClusterStrength: boolean }>();
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        numberProfiles.set(i, {
            isHot: hotNumbers.has(i),
            isOverdue: overdueNumbers.has(i),
            isInHotZone: i >= hotZoneMin && i <= hotZoneMax,
            hasMomentum: trendingNumbers.has(i),
            hasClusterStrength: strongClusterNumbers.has(i),
        });
    }

    // --- AetherGrid v10: Success-Pattern Bonuses ---
    let comboBonuses: { [num: number]: { score: number, reasons: string[] } } = {};
    let timingBonus = 0;

    if (historicalSuccess && historicalSuccess.winnerProfiles.length > 20) {
        const lastDraw = draws[draws.length - 1];
        if (lastDraw) {
            const lastDrawSpread = Math.max(...lastDraw.mainNumbers) - Math.min(...lastDraw.mainNumbers);
            const overdueSpreadIndicator = historicalSuccess.preDrawIndicators.find(p => p.title.includes("Spredning før et 'Overdue'"));
            if (overdueSpreadIndicator) {
                const match = overdueSpreadIndicator.insight.match(/spredning på (\d+\.?\d*)/);
                if (match) {
                    const historicalAvgSpreadForHit = parseFloat(match[1]);
                    if (lastDrawSpread > historicalAvgSpreadForHit) {
                        timingBonus = 15;
                    }
                }
            }
        }
        
        const comboCounts = { "Hot+Overdue": 0, "Hot+Momentum": 0, "HotZone+Cluster": 0 };
        historicalSuccess.winnerProfiles.forEach(wp => {
            if (wp.profile.isHot && wp.profile.isOverdue) comboCounts["Hot+Overdue"]++;
            if (wp.profile.isHot && wp.profile.hasMomentum) comboCounts["Hot+Momentum"]++;
            if (wp.profile.isInHotZone && wp.profile.hasClusterStrength) comboCounts["HotZone+Cluster"]++;
        });

        const totalWinners = historicalSuccess.winnerProfiles.length;
        const comboSuccessRates = {
            "Hot+Overdue": comboCounts["Hot+Overdue"] / totalWinners,
            "Hot+Momentum": comboCounts["Hot+Momentum"] / totalWinners,
            "HotZone+Cluster": comboCounts["HotZone+Cluster"] / totalWinners,
        };

        for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
            const profile = numberProfiles.get(i)!;
            comboBonuses[i] = { score: 0, reasons: [] };
            if (profile.isHot && profile.isOverdue && comboSuccessRates["Hot+Overdue"] > 0.05) {
                comboBonuses[i].score += comboSuccessRates["Hot+Overdue"] * 50;
                comboBonuses[i].reasons.push('Hot+Overdue');
            }
            if (profile.isHot && profile.hasMomentum && comboSuccessRates["Hot+Momentum"] > 0.05) {
                comboBonuses[i].score += comboSuccessRates["Hot+Momentum"] * 50;
                comboBonuses[i].reasons.push('Hot+Momentum');
            }
            if (profile.isInHotZone && profile.hasClusterStrength && comboSuccessRates["HotZone+Cluster"] > 0.05) {
                comboBonuses[i].score += comboSuccessRates["HotZone+Cluster"] * 40;
                comboBonuses[i].reasons.push('HotZone+Cluster');
            }
        }
    }
    
    // ===================================
    // Main Number Scores Calculation
    // ===================================
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
        let score = weightedRatio * 10;
        if (d.isOverdue && timingBonus > 0) score += timingBonus;
        dormancyScores[d.number] = score;
    });

    const companionScores: { [num: number]: number } = {};
    const strongCompanionCounts = new Map<number, number>();
    hotNumbers.forEach(hotNum => {
        const strongCompanions = patternAnalysis.companionAnalysis.companionData[hotNum] || [];
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
    
    const seasonalScores: { [num: number]: number } = {};
    if (dateForSeasonal) {
        const currentMonthName = monthNames[dateForSeasonal.getUTCMonth()];
        const monthlyData = seasonalAnalysis.monthly[currentMonthName] || [];
        if (monthlyData.length > 0) {
            const maxCount = monthlyData[0].count;
            for (const item of monthlyData) {
                seasonalScores[item.number] = maxCount > 0 ? (item.count / maxCount) * 50 : 0;
            }
        }
    }

    const momentumScores: { [num: number]: number } = {};
    patternAnalysis.momentumAnalysis.forEach(m => { momentumScores[m.number] = m.momentumScore; });

    const clusterStrengthScores: { [num: number]: number } = {};
    const maxClusterScore = Math.max(...patternAnalysis.clusterStrengthAnalysis.map(c => c.clusterScore), 1);
    patternAnalysis.clusterStrengthAnalysis.forEach(c => { clusterStrengthScores[c.number] = (c.clusterScore / maxClusterScore) * 50; });

    const stabilityScores: { [num: number]: number } = {};
    if (metaPatternAnalysis?.hotColdTransitions) {
        const transitionsMap = new Map(metaPatternAnalysis.hotColdTransitions.map(t => [t.number, t.transitions]));
        const maxTransitions = Math.max(...Array.from(transitionsMap.values()), 1);
        for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
            const numTransitions = transitionsMap.get(i) || 0;
            stabilityScores[i] = (1 - (numTransitions / maxTransitions)) * 50;
        }
    }

    const mainScores: Omit<AetherScoreResult, 'rank'>[] = [];
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const dormancyInfo = patternAnalysis.dormancyAnalysis.mainNumberDormancy.find(d => d.number === i);
        let postDormancyBonus = 0;
        if (dormancyInfo && dormancyInfo.currentDormancy < 5 && dormancyInfo.averageDormancy > 20) {
            postDormancyBonus = 50 / (dormancyInfo.currentDormancy + 1);
        }

        const contextualBoost = contextualBoosts.get(i) || { score: 0, reason: '' };
        const popularityInfo = popularityScores.get(i) || { score: 0, reason: '' };
        const popularityPenalty = (popularityInfo.score / 100) * 40 * popularityWeight;

        const breakdown: AetherScoreBreakdown = {
            frequency: frequencyScores[i] || 0, zone: numberZoneScores[i] || 0, dormancy: dormancyScores[i] || 0,
            companion: companionScores[i] || 0, seasonal: seasonalScores[i] || 0, postDormancy: postDormancyBonus,
            momentum: momentumScores[i] || 0, clusterStrength: clusterStrengthScores[i] || 0, stability: stabilityScores[i] || 0,
            contextual: contextualBoost.score,
            popularity: -popularityPenalty,
        };
        let totalScore = (breakdown.frequency * frequencyWeight) 
                         + (breakdown.zone * zoneWeight) 
                         + (breakdown.dormancy * dormancyWeight) 
                         + (breakdown.companion * companionWeight)
                         + (breakdown.seasonal * seasonalWeight)
                         + (breakdown.momentum * momentumWeight)
                         + (breakdown.clusterStrength * clusterStrengthWeight)
                         + (breakdown.stability * stabilityWeight)
                         + postDormancyBonus
                         + (comboBonuses[i]?.score || 0)
                         + (breakdown.contextual || 0);

        totalScore -= popularityPenalty;
        
        mainScores.push({
            number: i, score: totalScore, breakdown,
            justification: generateMainJustification(breakdown, totalScore, comboBonuses[i]?.reasons || [], contextualBoost.reason),
        });
    }

    const mainNumberScores = mainScores.sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));

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
        const breakdown = { frequency: starFrequencyScores[i] || 0, dormancy: starDormancyScores[i] || 0 };
        const totalScore = (breakdown.frequency * 0.6) + (breakdown.dormancy * 0.4);
        starScores.push({ number: i, score: totalScore, breakdown, justification: generateStarJustification(breakdown, totalScore) });
    }

    const starNumberScores = starScores.sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));

    return { mainNumberScores, starNumberScores, insight };
};
