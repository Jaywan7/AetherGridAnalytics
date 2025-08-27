
import type { WeightConfiguration, PatternTimingAnalysis } from '../types';

/**
 * Adjusts Aether Score weights based on seasonal volatility patterns.
 * If the upcoming period is historically volatile, it reduces trust in seasonal patterns
 * and increases trust in recent momentum. If stable, it does the opposite.
 * @param weights The current, truth-based weight configuration.
 * @param timingAnalysis The analysis containing seasonal transition volatility.
 * @param nextDrawDate The predicted date of the next draw.
 * @returns A new, seasonally-adjusted weight configuration.
 */
export const adjustWeightsForSeasonality = (
    weights: WeightConfiguration,
    timingAnalysis: PatternTimingAnalysis | null,
    nextDrawDate: Date | null
): WeightConfiguration => {
    // Return original weights if required data is missing
    if (!timingAnalysis || !nextDrawDate) {
        return weights;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const nextMonthIndex = nextDrawDate.getUTCMonth();
    const nextMonthName = monthNames[nextMonthIndex];

    const transition = timingAnalysis.seasonalTransitionAnalysis.monthlyTransitions.find(
        t => t.toPeriod === nextMonthName
    );

    // If no transition data for the upcoming month, return original weights
    if (!transition) {
        return weights;
    }

    const volatility = transition.dissimilarityScore; // 0 (stable) to 1 (volatile)
    const adjustedWeights = { ...weights };

    // Volatility > 0.6 is considered high, < 0.3 is considered low
    if (volatility > 0.6) {
        // High volatility: distrust seasonal patterns, trust recent momentum and frequency more.
        const seasonalWeight = adjustedWeights.seasonal;
        adjustedWeights.seasonal *= 0.5; // Halve seasonal weight
        const freedUpWeight = seasonalWeight - adjustedWeights.seasonal;
        adjustedWeights.momentum += freedUpWeight * 0.7; // Give 70% of freed weight to momentum
        adjustedWeights.frequency += freedUpWeight * 0.3; // Give 30% to frequency
    } else if (volatility < 0.3) {
        // Low volatility: seasonal patterns are stable, trust them more.
        const momentumWeight = adjustedWeights.momentum;
        adjustedWeights.momentum *= 0.7; // Reduce momentum weight as it's less important in stable periods
        const freedUpWeight = momentumWeight - adjustedWeights.momentum;
        adjustedWeights.seasonal += freedUpWeight; // Give all freed weight to seasonal
    }
    
    // Re-normalize all weights to ensure they sum up to the original total, preserving balance.
    const originalTotal = Object.values(weights).reduce((sum, w) => sum + w, 0);
    const newTotal = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);

    if (newTotal > 0.001) { // Avoid division by zero
        const factor = originalTotal / newTotal;
        (Object.keys(adjustedWeights) as Array<keyof WeightConfiguration>).forEach(key => {
            adjustedWeights[key] *= factor;
        });
    }

    return adjustedWeights;
};
