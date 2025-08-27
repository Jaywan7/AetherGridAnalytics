
import type { AnalysisResult, StrategyResult, StrategyCoupon, AetherScoreData } from '../types';
import { MAIN_NUMBER_MAX, STAR_NUMBER_MAX, MAIN_NUMBER_COUNT, STAR_NUMBER_COUNT } from '../constants';

const createCoupon = (main: number[], star: number[]): { mainNumbers: number[], starNumbers: number[] } => ({
    mainNumbers: main.sort((a, b) => a - b),
    starNumbers: star.sort((a, b) => a - b),
});

const getUniqueCouponKey = (main: number[], star: number[]): string => 
    [...main].sort((a,b)=>a-b).join(',') + '|' + [...star].sort((a,b)=>a-b).join(',');

const shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const generateMetaCoupons = (analysis: AnalysisResult, aetherScores: AetherScoreData): StrategyResult | null => {
    const coupons: StrategyCoupon[] = [];
    const usedCoupons = new Set<string>();

    const topAetherMain = aetherScores.mainNumberScores.slice(0, 20).map(s => s.number);
    const topAetherStars = aetherScores.starNumberScores.slice(0, 5).map(s => s.number);

    if (topAetherMain.length < 5 || topAetherStars.length < 2) return null;

    const addCoupon = (main: number[], star: number[], insight: string) => {
        if (main.length !== MAIN_NUMBER_COUNT || star.length !== STAR_NUMBER_COUNT) return;
        const key = getUniqueCouponKey(main, star);
        if (!usedCoupons.has(key)) {
            usedCoupons.add(key);
            coupons.push({
                rank: coupons.length + 1,
                ...createCoupon(main, star),
                insight,
            });
        }
    };
    
    // Meta 1: Aether Prime
    addCoupon(
        topAetherMain.slice(0, 5),
        topAetherStars.slice(0, 2),
        "Meta 1: Top 5 Aether Score main numbers with Top 2 Aether Score stars."
    );
    
    // Meta 2: Mean Reversion (Coldest by frequency)
    const coldMain = [...analysis.mainNumberFrequencies].sort((a, b) => a.count - b.count).map(f => f.number as number);
    const coldStars = [...analysis.starNumberFrequencies].sort((a, b) => a.count - b.count).map(f => f.number as number);
    addCoupon(
        coldMain.slice(0, 5),
        coldStars.slice(0, 2),
        "Meta 2: The 5 coldest main numbers and 2 coldest star numbers, based on frequency."
    );

    // Meta 3: The Overdue Aether
    const overdueMain = analysis.patternAnalysis.dormancyAnalysis.mainNumberDormancy
        .filter(d => d.isOverdue)
        .sort((a, b) => b.currentDormancy - a.currentDormancy)
        .map(d => d.number);
    if (overdueMain.length >= 5) {
        addCoupon(
            overdueMain.slice(0, 5),
            [topAetherStars[0], topAetherStars[topAetherStars.length - 1]],
            "Meta 3: The 5 most overdue numbers combined with the highest and lowest ranked Aether stars."
        );
    }
    
    // Meta 4: Aether Companions
    const seed = topAetherMain[0];
    const companions = analysis.patternAnalysis.companionAnalysis.companionData[seed]?.map(c => c.number) || [];
    if (companions.length >= 4) {
        addCoupon(
            [seed, ...companions.slice(0, 4)],
            topAetherStars.slice(0, 2),
            `Meta 4: Highest Aether Score number (${seed}) plus its 4 strongest companions.`
        );
    }

    // Meta 5: Zone Breaker
    const coldZoneName = analysis.patternAnalysis.zoneAnalysis.coldZone;
    const [minZone, maxZone] = coldZoneName.split('-').map(Number);
    const zoneNumbers = Array.from({length: maxZone - minZone + 1}, (_, i) => minZone + i);
    addCoupon(
        shuffle(zoneNumbers).slice(0, 5),
        coldStars.slice(0, 2),
        `Meta 5: Five random numbers from the coldest zone (${coldZoneName}) to break the pattern.`
    );

    // Fill remaining with diversified high-Aether score coupons
    let attempts = 0;
    while (coupons.length < 10 && attempts < 1000) {
        const main = shuffle([...topAetherMain]).slice(0, MAIN_NUMBER_COUNT);
        const star = shuffle([...topAetherStars]).slice(0, STAR_NUMBER_COUNT);
        addCoupon(main, star, `Meta ${coupons.length + 1}: A diversified high Aether Score combination.`);
        attempts++;
    }

    return {
        title: "Meta-Analyse Strategi",
        description: "Kombinerer de stærkeste signaler fra hele analysen for at skabe 10 unikke, strategiske kuponer.",
        coupons,
    };
}
