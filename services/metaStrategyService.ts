
import type { AnalysisResult, StrategyResult, StrategyCoupon, AetherScoreData } from '../types';

const getUniqueCouponKey = (main: number[], star: number[]): string => 
    [...main].sort((a,b)=>a-b).join(',') + '|' + [...star].sort((a,b)=>a-b).join(',');

export const generateMetaCoupons = (
    baseStrategies: StrategyResult[], 
    analysis: AnalysisResult,
    aetherScores: AetherScoreData
): StrategyResult | null => {
    
    // 1. Aggregate all coupons and track their sources
    const couponMap = new Map<string, { coupon: StrategyCoupon; sources: string[]; count: number }>();

    for (const strategy of baseStrategies) {
        for (const coupon of strategy.coupons) {
            const key = getUniqueCouponKey(coupon.mainNumbers, coupon.starNumbers);
            if (couponMap.has(key)) {
                const existing = couponMap.get(key)!;
                existing.sources.push(strategy.title);
                existing.count++;
                // Keep the coupon with the lowest (best) rank
                if (coupon.rank < existing.coupon.rank) {
                    existing.coupon = coupon;
                }
            } else {
                couponMap.set(key, {
                    coupon: coupon,
                    sources: [strategy.title],
                    count: 1
                });
            }
        }
    }

    // 2. Separate high-confidence (duplicates) from single recommendations
    const highConfidenceCoupons: { coupon: StrategyCoupon; sources: string[]; count: number }[] = [];
    const singleCoupons: { coupon: StrategyCoupon; sources: string[]; count: number }[] = [];

    couponMap.forEach(value => {
        if (value.count > 1) {
            highConfidenceCoupons.push(value);
        } else {
            singleCoupons.push(value);
        }
    });

    // 3. Sort both lists for prioritization
    // High-confidence: sort by count (desc), then by best rank (asc)
    highConfidenceCoupons.sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;
        }
        return a.coupon.rank - b.coupon.rank;
    });

    // Single coupons: sort by best rank (asc)
    singleCoupons.sort((a, b) => a.coupon.rank - b.coupon.rank);

    // 4. Build the final, unique list of meta-coupons
    const finalCoupons: StrategyCoupon[] = [];
    
    // Add high-confidence coupons first
    for (const item of highConfidenceCoupons) {
        if (finalCoupons.length >= 10) break;
        
        const sourceText = item.sources.map(s => s.replace(' Strategi', '')).join(' & ');
        finalCoupons.push({
            ...item.coupon,
            insight: `Høj konfidens: Anbefalet af ${sourceText}. ${item.coupon.insight}`
        });
    }

    // Fill the rest with top-ranked single coupons
    const usedKeys = new Set(finalCoupons.map(c => getUniqueCouponKey(c.mainNumbers, c.starNumbers)));
    
    for (const item of singleCoupons) {
        if (finalCoupons.length >= 10) break;
        const key = getUniqueCouponKey(item.coupon.mainNumbers, item.coupon.starNumbers);
        if (!usedKeys.has(key)) {
            finalCoupons.push(item.coupon); // Use original coupon and insight
            usedKeys.add(key);
        }
    }
    
    if (finalCoupons.length === 0) return null;

    // 5. Re-rank the final list
    const rankedFinalCoupons = finalCoupons.map((coupon, index) => ({
        ...coupon,
        rank: index + 1
    }));
    
    return {
        title: "Meta-Analyse Strategi",
        description: "Syntetiserer de stærkeste, unikke signaler fra alle andre strategier til én samlet, højt-koncentreret anbefalingsliste. Overlappende anbefalinger prioriteres som 'høj konfidens'.",
        coupons: rankedFinalCoupons,
    };
}