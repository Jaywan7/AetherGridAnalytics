
import type { HistoricalSuccessAnalysis, WeightConfiguration, Draw } from '../types';

// ====================================================================================
// SECTION 1: EVIDENCED-BASED WEIGHT RECALIBRATION
// ====================================================================================

/**
 * Calculates Aether Score weights based on the "truth" of what has historically worked.
 * It uses the success profile of actual winning numbers to directly inform the weight distribution.
 * This is an evidence-based approach to pattern weighting.
 * @param successAnalysis The historical success analysis containing the winner profile.
 * @returns A new, truth-based weight configuration.
 */
export const recalibrateWeightsFromHistory = (successAnalysis: HistoricalSuccessAnalysis | null): WeightConfiguration => {
    // Define a baseline/default weight configuration in case there's no success analysis.
    const baselineWeights: WeightConfiguration = {
        frequency: 0.25, // Corresponds to 'hot'
        dormancy: 0.20,  // Corresponds to 'overdue'
        zone: 0.10,      // Corresponds to 'hotZone'
        momentum: 0.15,
        clusterStrength: 0.10, // Corresponds to 'cluster'
        seasonal: 0.10,
        // These factors are not in the success profile, so they keep a fixed portion of weight.
        companion: 0.05,
        stability: 0.05,
    };

    // If there's insufficient data or no analysis, return the safe baseline.
    if (!successAnalysis || successAnalysis.totalAnalyzedHits < 50) {
        return baselineWeights;
    }

    const { hitProfile } = successAnalysis;

    // The total weight pool for factors that are part of the success profile.
    const adjustableWeightPool = 1.0 - baselineWeights.companion - baselineWeights.stability;

    // The total percentage points from the hit profile for the adjustable factors.
    // We add a small epsilon to prevent division by zero. 'cold' is ignored as it's the inverse of 'hot'.
    const totalProfileScore = 
        hitProfile.hot + 
        hitProfile.overdue + 
        hitProfile.hotZone + 
        hitProfile.momentum + 
        hitProfile.cluster +
        hitProfile.seasonal +
        0.001;
    
    // Distribute the adjustable weight pool according to the success profile percentages.
    const newFrequencyWeight = (hitProfile.hot / totalProfileScore) * adjustableWeightPool;
    const newDormancyWeight = (hitProfile.overdue / totalProfileScore) * adjustableWeightPool;
    const newZoneWeight = (hitProfile.hotZone / totalProfileScore) * adjustableWeightPool;
    const newMomentumWeight = (hitProfile.momentum / totalProfileScore) * adjustableWeightPool;
    const newClusterWeight = (hitProfile.cluster / totalProfileScore) * adjustableWeightPool;
    const newSeasonalWeight = (hitProfile.seasonal / totalProfileScore) * adjustableWeightPool;

    return {
        frequency: newFrequencyWeight,
        dormancy: newDormancyWeight,
        zone: newZoneWeight,
        momentum: newMomentumWeight,
        clusterStrength: newClusterWeight,
        seasonal: newSeasonalWeight,
        // Keep companion and stability weights fixed.
        companion: baselineWeights.companion,
        stability: baselineWeights.stability,
    };
};


// ====================================================================================
// SECTION 2: REGIME SHIFT DETECTION
// ====================================================================================

// Helper to calculate average of an array of numbers
const getAverage = (arr: number[]): number => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// Helper to calculate average spread for a set of draws
const calculateAverageSpread = (draws: Draw[]): number => {
    if (draws.length === 0) return 0;
    const spreads = draws.map(d => {
        if (d.mainNumbers.length < 2) return 0;
        return Math.max(...d.mainNumbers) - Math.min(...d.mainNumbers);
    }).filter(s => s > 0);
    return getAverage(spreads);
};

// Helper to calculate main number repeat rate
const calculateRepeatRate = (draws: Draw[]): number => {
    if (draws.length < 2) return 0;
    let repeatCount = 0;
    for (let i = 1; i < draws.length; i++) {
        const prevMain = new Set(draws[i - 1].mainNumbers);
        const currentMain = draws[i].mainNumbers;
        if (currentMain.some(n => prevMain.has(n))) {
            repeatCount++;
        }
    }
    return (repeatCount / (draws.length - 1)) * 100;
};

/**
 * Detects potential regime shifts by comparing statistical properties of recent draws
 * with a previous period. A regime shift suggests that the underlying dynamics of the
 * lottery may have changed, making older data less reliable.
 * @param draws All historical draws.
 * @returns True if a significant shift is detected, otherwise false.
 */
export const detectRegimeShift = (draws: Draw[]): boolean => {
    const windowSize = 50;
    if (draws.length < windowSize * 2) {
        return false; // Not enough data to compare two full windows
    }

    const recentDraws = draws.slice(-windowSize);
    const previousDraws = draws.slice(-windowSize * 2, -windowSize);

    const recentSpread = calculateAverageSpread(recentDraws);
    const previousSpread = calculateAverageSpread(previousDraws);

    const recentRepeatRate = calculateRepeatRate(recentDraws);
    const previousRepeatRate = calculateRepeatRate(previousDraws);

    const spreadChange = Math.abs(recentSpread - previousSpread) / (previousSpread || 1);
    const repeatRateChange = Math.abs(recentRepeatRate - previousRepeatRate) / (previousRepeatRate || 1);

    // A shift is detected if spread changes by >15% OR repeat rate changes by >25%
    if (spreadChange > 0.15 || repeatRateChange > 0.25) {
        return true;
    }

    return false;
};
