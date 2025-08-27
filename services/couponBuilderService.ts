
import type { AetherScoreData, PatternAnalysis, IntelligentCoupon } from '../types';
import { MAIN_NUMBER_COUNT, STAR_NUMBER_COUNT } from '../constants';

/**
 * Generates all combinations of a specific size from an array.
 * @param source The source array.
 * @param k The size of each combination.
 * @returns An array of all possible combinations.
 */
function combinations<T>(source: T[], k: number): T[][] {
    const result: T[][] = [];
    if (k > source.length || k <= 0) {
        return result;
    }

    function backtrack(combination: T[], start: number) {
        if (combination.length === k) {
            result.push([...combination]);
            return;
        }

        for (let i = start; i < source.length; i++) {
            combination.push(source[i]);
            backtrack(combination, i + 1);
            combination.pop();
        }
    }

    backtrack([], 0);
    return result;
}

export const buildIntelligentCoupons = (aetherScores: AetherScoreData, patternAnalysis: PatternAnalysis): IntelligentCoupon[] => {
    // --- MAIN NUMBERS ---
    const top20Main = aetherScores.mainNumberScores.slice(0, 20);
    const top20MainNumbers = top20Main.map(s => s.number);
    const mainScoreMap = new Map(aetherScores.mainNumberScores.map(s => [s.number, s.score]));
    
    if (top20MainNumbers.length < MAIN_NUMBER_COUNT) return [];

    const mainCandidates = combinations(top20MainNumbers, MAIN_NUMBER_COUNT);

    const averageTopScore = top20Main.reduce((sum, s) => sum + s.score, 0) / top20Main.length;

    const scoredMainCoupons = mainCandidates.map(coupon => {
        const totalAetherScore = coupon.reduce((sum, num) => sum + (mainScoreMap.get(num) || 0), 0);
        let bonus = 0;
        const justificationParts: string[] = [];

        // Filter 1: Even/Odd
        const oddCount = coupon.filter(n => n % 2 !== 0).length;
        if (oddCount === 3 || oddCount === 2) {
            bonus += 20;
            justificationParts.push(oddCount === 3 ? 'ideelt 3u/2l-mønster' : 'ideelt 2u/3l-mønster');
        }

        // Filter 2: Sum
        const sum = coupon.reduce((a, b) => a + b, 0);
        if (sum >= 100 && sum <= 155) {
            bonus += 15;
            justificationParts.push('ideel sum');
        }

        // Filter 3: Spread
        const spread = Math.max(...coupon) - Math.min(...coupon);
        if (spread >= 25 && spread <= 45) {
            bonus += 15;
            justificationParts.push('god spredning');
        }

        // Filter 4: Zones
        const zones = new Set(coupon.map(n => Math.floor((n - 1) / 10)));
        if (zones.size >= 3) {
            bonus += 10;
            justificationParts.push('god zonespredning');
        }
        
        // Filter 5: Delta Analysis
        if (patternAnalysis.deltaAnalysis && patternAnalysis.deltaAnalysis.averageDelta > 0) {
            const sortedCoupon = [...coupon].sort((a, b) => a - b);
            const deltas: number[] = [];
            for (let i = 0; i < sortedCoupon.length - 1; i++) {
                deltas.push(sortedCoupon[i+1] - sortedCoupon[i]);
            }
            const couponAvgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            const historicalAvgDelta = patternAnalysis.deltaAnalysis.averageDelta;
            
            // Bonus for being close to the historical average
            if (Math.abs(couponAvgDelta - historicalAvgDelta) < 1.5) { // within 1.5 of average
                bonus += 10;
                justificationParts.push('realistisk intern afstand');
            }
        }

        let justificationHeader = totalAetherScore > averageTopScore * MAIN_NUMBER_COUNT * 1.1 ? 'Meget høj Aether Score' : 'Høj Aether Score';

        let fullJustification = justificationHeader + '.';
        if (justificationParts.length > 0) {
            fullJustification += ` Overholder ${justificationParts.join(', ')}.`;
        }

        return {
            mainNumbers: coupon.sort((a,b)=>a-b),
            score: totalAetherScore + bonus,
            justification: fullJustification,
        };
    });

    const rankedMainCoupons = scoredMainCoupons.sort((a, b) => b.score - a.score).slice(0, 10);

    // --- STAR NUMBERS ---
    const topStar = aetherScores.starNumberScores;
    const topStarNumbers = topStar.map(s => s.number);
    const starScoreMap = new Map(aetherScores.starNumberScores.map(s => [s.number, s.score]));

    if (topStarNumbers.length < STAR_NUMBER_COUNT) return [];

    const starCandidates = combinations(topStarNumbers, STAR_NUMBER_COUNT);
    
    const scoredStarPairs = starCandidates.map(pair => {
        const totalAetherScore = pair.reduce((sum, num) => sum + (starScoreMap.get(num) || 0), 0);
        let bonus = 0;

        // Filter 1: Sum
        const sum = pair[0] + pair[1];
        if (sum >= 8 && sum <= 16) {
            bonus += 10;
        }

        // Filter 2: Even/Odd
        const isEven1 = pair[0] % 2 === 0;
        const isEven2 = pair[1] % 2 === 0;
        if (isEven1 !== isEven2) { // One even, one odd
            bonus += 15;
        }
        
        return {
            starNumbers: pair.sort((a,b)=>a-b),
            score: totalAetherScore + bonus,
        };
    });

    const rankedStarPairs = scoredStarPairs.sort((a, b) => b.score - a.score).slice(0, 10);

    // --- COMBINE ---
    const finalCoupons: IntelligentCoupon[] = [];
    for (let i = 0; i < Math.min(rankedMainCoupons.length, rankedStarPairs.length); i++) {
        const mainCoupon = rankedMainCoupons[i];
        const starPair = rankedStarPairs[i];
        
        finalCoupons.push({
            rank: i + 1,
            mainNumbers: mainCoupon.mainNumbers,
            starNumbers: starPair.starNumbers,
            score: mainCoupon.score + starPair.score,
            justification: mainCoupon.justification
        });
    }

    if (finalCoupons.length === 0) return [];
    
    return finalCoupons.sort((a, b) => b.score - a.score).map((c, i) => ({...c, rank: i + 1}));
};
