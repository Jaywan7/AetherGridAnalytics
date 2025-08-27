
import type { AnalysisResult, StrategyResult, StrategyCoupon } from '../types';
import { MAIN_NUMBER_MAX, STAR_NUMBER_MAX, MAIN_NUMBER_COUNT, STAR_NUMBER_COUNT } from '../constants';
import { getPopularNumbers } from './specialDatesService';

// ===================================
// Helper Functions
// ===================================

const combinations = <T>(source: T[], k: number): T[][] => {
    if (k > source.length || k <= 0) return [];
    if (k === source.length) return [source];
    if (k === 1) return source.map(item => [item]);

    const result: T[][] = [];
    const backtrack = (combination: T[], start: number) => {
        if (combination.length === k) {
            result.push([...combination]);
            return;
        }
        for (let i = start; i < source.length; i++) {
            combination.push(source[i]);
            backtrack(combination, i + 1);
            combination.pop();
        }
    };
    backtrack([], 0);
    return result;
};

const createCoupon = (main: number[], star: number[]): { mainNumbers: number[], starNumbers: number[] } => ({
    mainNumbers: main.sort((a, b) => a - b),
    starNumbers: star.sort((a, b) => a - b),
});

const getUniqueCouponKey = (main: number[], star: number[]): string =>
    [...main].sort((a,b)=>a-b).join(',') + '|' + [...star].sort((a,b)=>a-b).join(',');

// ===================================
// Strategy Generators
// ===================================

function generateTrendCoupons(analysis: AnalysisResult): StrategyResult {
    // 1. Identify Hot Pools
    const hotMainPool = analysis.mainNumberFrequencies.sort((a, b) => b.count - a.count).slice(0, 15).map(f => f.number as number);
    const hotStarPool = analysis.starNumberFrequencies.sort((a, b) => b.count - a.count).slice(0, 5).map(f => f.number as number);

    if (hotMainPool.length < MAIN_NUMBER_COUNT || hotStarPool.length < STAR_NUMBER_COUNT) return { title: "", description: "", coupons: [] };

    const mainFreqMap = new Map(analysis.mainNumberFrequencies.map(f => [f.number, f.count]));
    const topPattern = analysis.topPatterns.find(p => p.title.includes('Lige/Ulige'));
    let bonusOddCount = -1;
    if (topPattern && topPattern.deviation > 0) {
        const match = topPattern.detail.match(/(\d) ulige, (\d) lige/);
        if (match) bonusOddCount = parseInt(match[1]);
    }

    // 2. Generate and Score Main Number Candidates
    const mainCandidates = combinations(hotMainPool, MAIN_NUMBER_COUNT);
    const scoredCandidates = mainCandidates.map(coupon => {
        let score = coupon.reduce((acc, num) => acc + (mainFreqMap.get(num) || 0), 0);
        const oddCount = coupon.filter(n => n % 2 !== 0).length;
        if (bonusOddCount !== -1 && oddCount === bonusOddCount) {
            score += 100; // Pattern Bonus
        }
        return { coupon, score };
    }).sort((a, b) => b.score - a.score);

    // 3. Generate and Score Star Number Pairs
    const starCandidates = combinations(hotStarPool, STAR_NUMBER_COUNT);
    const scoredStarPairs = starCandidates.map(pair => {
        const isMixed = (pair[0] % 2 === 0 && pair[1] % 2 !== 0) || (pair[0] % 2 !== 0 && pair[1] % 2 === 0);
        return { pair, score: isMixed ? 1 : 0 };
    }).sort((a, b) => b.score - a.score);

    // 4. Combine and build final coupons
    const coupons: StrategyCoupon[] = [];
    for (let i = 0; i < Math.min(10, scoredCandidates.length); i++) {
        const main = scoredCandidates[i].coupon;
        const star = scoredStarPairs[i % scoredStarPairs.length].pair;
        coupons.push({
            rank: i + 1,
            ...createCoupon(main, star),
            insight: "Kombinerer de 'varmeste' tal og favoriserer de mest overrepræsenterede mønstre.",
        });
    }

    return {
        title: "Trend-Følger Strategi",
        description: "Fokuserer på 'varme' tal og mønstre, der for nylig har vist sig hyppigt.",
        coupons,
    };
}

function generateContrarianCoupons(analysis: AnalysisResult): StrategyResult {
    // 1. Identify Cold/Overdue Pools
    const coldMain = analysis.mainNumberFrequencies.sort((a, b) => a.count - b.count).slice(0, 15).map(f => f.number as number);
    const overdueMain = analysis.patternAnalysis.dormancyAnalysis.mainNumberDormancy.filter(d => d.isOverdue).sort((a,b) => b.currentDormancy - a.currentDormancy).slice(0, 15).map(d => d.number);
    const mainPool = [...new Set([...coldMain, ...overdueMain])];

    const coldStars = analysis.starNumberFrequencies.sort((a, b) => a.count - b.count).slice(0, 5).map(f => f.number as number);
    const overdueStars = analysis.patternAnalysis.dormancyAnalysis.starNumberDormancy.filter(d => d.isOverdue).sort((a,b) => b.currentDormancy - a.currentDormancy).slice(0, 5).map(d => d.number);
    const starPool = [...new Set([...coldStars, ...overdueStars])];
    
    if (mainPool.length < MAIN_NUMBER_COUNT || starPool.length < STAR_NUMBER_COUNT) return { title: "", description: "", coupons: [] };

    // 2. Generate and Score
    const mainCandidates = combinations(mainPool, MAIN_NUMBER_COUNT);
    const dormancyMap = new Map(analysis.patternAnalysis.dormancyAnalysis.mainNumberDormancy.map(d => [d.number, d.currentDormancy]));
    
    const scoredCandidates = mainCandidates.map(coupon => {
        const score = coupon.reduce((acc, num) => acc + (dormancyMap.get(num) || 0), 0);
        return { coupon, score };
    }).sort((a, b) => b.score - a.score);

    const starCandidates = combinations(starPool, STAR_NUMBER_COUNT);

    // 3. Combine and build final coupons
    const coupons: StrategyCoupon[] = [];
    for (let i = 0; i < Math.min(10, scoredCandidates.length); i++) {
        const main = scoredCandidates[i].coupon;
        const star = starCandidates[i % starCandidates.length];
        coupons.push({
            rank: i + 1,
            ...createCoupon(main, star),
            insight: "Satser på 'kolde' og 'overdue' tal, der statistisk set er modne til en trækning.",
        });
    }

    return {
        title: "Kontrær Strategi",
        description: "Satser på 'kolde' og 'overdue' tal med forventning om, at de vender tilbage til gennemsnittet.",
        coupons,
    };
}

function generateBalancedCoupons(analysis: AnalysisResult): StrategyResult {
    const coupons: StrategyCoupon[] = [];
    const allMainNumbers = Array.from({ length: MAIN_NUMBER_MAX }, (_, i) => i + 1);
    const allStarNumbers = Array.from({ length: STAR_NUMBER_MAX }, (_, i) => i + 1);
    let attempts = 0;
    
    while (coupons.length < 10 && attempts < 50000) {
        const main = [];
        const usedIndexes = new Set<number>();
        while(main.length < MAIN_NUMBER_COUNT) {
            const randomIndex = Math.floor(Math.random() * MAIN_NUMBER_MAX);
            if (!usedIndexes.has(randomIndex)) {
                usedIndexes.add(randomIndex);
                main.push(allMainNumbers[randomIndex]);
            }
        }
        
        // Apply filters
        const oddCount = main.filter(n => n % 2 !== 0).length;
        if (oddCount !== 2 && oddCount !== 3) { attempts++; continue; }

        const sum = main.reduce((a, b) => a + b, 0);
        if (sum < 100 || sum > 155) { attempts++; continue; }
        
        const sortedMain = main.sort((a, b) => a - b);
        const spread = sortedMain[4] - sortedMain[0];
        if (spread < 25 || spread > 45) { attempts++; continue; }

        const zones = new Set(main.map(n => Math.floor((n - 1) / 10)));
        if (zones.size < 3) { attempts++; continue; }

        const star = [];
        const usedStarIndexes = new Set<number>();
        while(star.length < STAR_NUMBER_COUNT) {
            const randomIndex = Math.floor(Math.random() * STAR_NUMBER_MAX);
            if (!usedStarIndexes.has(randomIndex)) {
                usedStarIndexes.add(randomIndex);
                star.push(allStarNumbers[randomIndex]);
            }
        }
        
        coupons.push({
            rank: coupons.length + 1,
            ...createCoupon(main, star),
            insight: "Designet til at matche en teoretisk 'ideel' trækning med balanceret lige/ulige, sum og spredning.",
        });
        attempts++;
    }
    
    return {
        title: "Balanceret Strategi",
        description: "Skaber kuponer, der afspejler spillets teoretiske statistiske fodaftryk.",
        coupons,
    };
}

function generateCompanionCoupons(analysis: AnalysisResult): StrategyResult {
    const companionData = analysis.patternAnalysis.companionAnalysis.companionData;
    const allStarNumbers = Array.from({ length: STAR_NUMBER_MAX }, (_, i) => i + 1);

    // 1. Find Strong Kernels
    const kernelScores = Object.entries(companionData).map(([num, companions]) => {
        const score = companions.reduce((acc, comp) => acc + comp.count, 0);
        return { number: parseInt(num), score };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    // 2. Build Coupons
    const coupons: StrategyCoupon[] = [];
    for (const kernel of kernelScores) {
        const companions = companionData[kernel.number];
        if (companions && companions.length >= 4) {
            const main = [kernel.number, ...companions.slice(0, 4).map(c => c.number)];
            
            // Add a balanced star pair
            const star = [];
            const usedStarIndexes = new Set<number>();
            while(star.length < STAR_NUMBER_COUNT) {
                const randomIndex = Math.floor(Math.random() * STAR_NUMBER_MAX);
                if (!usedStarIndexes.has(randomIndex)) {
                    usedStarIndexes.add(randomIndex);
                    star.push(allStarNumbers[randomIndex]);
                }
            }
            
            coupons.push({
                rank: coupons.length + 1,
                ...createCoupon(main, star),
                insight: `Bygget op omkring kernetallet ${kernel.number} og dets 4 stærkeste følgetal.`,
            });
        }
        if (coupons.length >= 10) break;
    }

    return {
        title: "Følgetal Strategi",
        description: "Fokuserer på grupper af tal, der historisk set ofte trækkes sammen.",
        coupons,
    };
}

function generateAntiPopularityCoupons(analysis: AnalysisResult): StrategyResult {
    const year = new Date().getFullYear();
    const popularNumbers = getPopularNumbers(year);

    const mainFreqMap = new Map(analysis.mainNumberFrequencies.map(f => [f.number, f.count]));
    const starFreqMap = new Map(analysis.starNumberFrequencies.map(f => [f.number, f.count]));

    // 1. Create pool of UNPOPULAR main numbers
    const unpopularMainPool = Array.from({ length: MAIN_NUMBER_MAX }, (_, i) => i + 1)
        .filter(num => !popularNumbers.main.has(num));

    // 2. Select the "hottest" among the unpopular numbers
    const hotUnpopularMain = unpopularMainPool
        .sort((a, b) => (mainFreqMap.get(b) || 0) - (mainFreqMap.get(a) || 0))
        .slice(0, 15);

    // 3. Create pool of UNPOPULAR star numbers
    const unpopularStarPool = Array.from({ length: STAR_NUMBER_MAX }, (_, i) => i + 1)
        .filter(num => !popularNumbers.star.has(num));

    // 4. Select the "hottest" among the unpopular stars
    const hotUnpopularStars = unpopularStarPool
        .sort((a, b) => (starFreqMap.get(b) || 0) - (starFreqMap.get(a) || 0))
        .slice(0, 5);
        
    if (hotUnpopularMain.length < MAIN_NUMBER_COUNT || hotUnpopularStars.length < STAR_NUMBER_COUNT) {
        return { title: "", description: "", coupons: [] };
    }

    // 5. Generate and score main number candidates
    const mainCandidates = combinations(hotUnpopularMain, MAIN_NUMBER_COUNT);
    const scoredMainCandidates = mainCandidates.map(coupon => {
        let score = coupon.reduce((acc, num) => acc + (mainFreqMap.get(num) || 0), 0);
        // Bonus for having more numbers > 31
        score += coupon.filter(n => n > 31).length * 50;
        return { coupon, score };
    }).sort((a, b) => b.score - a.score);

    // 6. Generate star number candidates
    const starCandidates = combinations(hotUnpopularStars, STAR_NUMBER_COUNT);
    
    // 7. Combine and build final coupons
    const coupons: StrategyCoupon[] = [];
    for (let i = 0; i < Math.min(10, scoredMainCandidates.length); i++) {
        const main = scoredMainCandidates[i].coupon;
        const star = starCandidates[i % starCandidates.length];
        coupons.push({
            rank: i + 1,
            ...createCoupon(main, star),
            insight: "Kombinerer statistisk stærke tal, der er mindre populære, for at øge den potentielle gevinst ved at undgå at dele med andre.",
        });
    }

    return {
        title: "Anti-Popularitets Strategi",
        description: "Fokuserer på tal, som folk sjældent spiller (f.eks. tal over 31), for at maksimere potentielle gevinster.",
        coupons,
    };
}


export const generateAllStrategies = (analysisResult: AnalysisResult): StrategyResult[] => {
  const strategies = [
    generateTrendCoupons(analysisResult),
    generateContrarianCoupons(analysisResult),
    generateBalancedCoupons(analysisResult),
    generateCompanionCoupons(analysisResult),
    generateAntiPopularityCoupons(analysisResult),
  ].filter(s => s.coupons.length > 0);
  
  return strategies;
};
