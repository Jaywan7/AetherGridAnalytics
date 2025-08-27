import type { WinnerProfile, HistoricalSuccessProfile } from '../types';

/**
 * Calculates the percentage distribution of various character traits (hot, cold, overdue, etc.)
 * for a given set of winning number profiles.
 * @param winnerProfiles An array of profiles for actual winning numbers.
 * @returns An object representing the percentage success rate for each factor.
 */
export const calculateHitProfile = (winnerProfiles: WinnerProfile[]): HistoricalSuccessProfile => {
    if (winnerProfiles.length === 0) {
        // FIX: Add missing companion and stability properties
        return { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0, companion: 0, stability: 0 };
    }

    const totalAnalyzedHits = winnerProfiles.length;
    // FIX: Add missing companion and stability properties
    const hitProfileCounter: { [key in keyof HistoricalSuccessProfile]: number } = { hot: 0, cold: 0, overdue: 0, hotZone: 0, momentum: 0, cluster: 0, seasonal: 0, companion: 0, stability: 0 };

    winnerProfiles.forEach(wp => {
        if (wp.profile.isHot) hitProfileCounter.hot++;
        if (wp.profile.isCold) hitProfileCounter.cold++;
        if (wp.profile.isOverdue) hitProfileCounter.overdue++;
        if (wp.profile.isInHotZone) hitProfileCounter.hotZone++;
        if (wp.profile.hasMomentum) hitProfileCounter.momentum++;
        if (wp.profile.hasClusterStrength) hitProfileCounter.cluster++;
        if (wp.profile.isSeasonalHot) hitProfileCounter.seasonal++;
        // FIX: Add checks for new properties
        if (wp.profile.isCompanionHot) hitProfileCounter.companion++;
        if (wp.profile.hasStability) hitProfileCounter.stability++;
    });

    // FIX: Add missing companion and stability properties
    return {
        hot: (hitProfileCounter.hot / totalAnalyzedHits) * 100,
        cold: (hitProfileCounter.cold / totalAnalyzedHits) * 100,
        overdue: (hitProfileCounter.overdue / totalAnalyzedHits) * 100,
        hotZone: (hitProfileCounter.hotZone / totalAnalyzedHits) * 100,
        momentum: (hitProfileCounter.momentum / totalAnalyzedHits) * 100,
        cluster: (hitProfileCounter.cluster / totalAnalyzedHits) * 100,
        seasonal: (hitProfileCounter.seasonal / totalAnalyzedHits) * 100,
        companion: (hitProfileCounter.companion / totalAnalyzedHits) * 100,
        stability: (hitProfileCounter.stability / totalAnalyzedHits) * 100,
    };
};