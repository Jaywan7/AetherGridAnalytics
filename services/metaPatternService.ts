import type { Draw, MetaPatternAnalysis, HotColdTransition, DormancyBreakdownSignal, CorrelationInsight } from '../types';
import { MAIN_NUMBER_MAX } from '../constants';

const analyzeHotColdTransitions = (draws: Draw[]): HotColdTransition[] => {
    if (draws.length < 50) return [];
    
    const windowSize = 25;
    const numberStates: { [num: number]: ('Hot' | 'Cold' | 'Neutral')[] } = {};

    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        numberStates[i] = [];
    }

    for (let i = 0; i <= draws.length - windowSize; i++) {
        const windowDraws = draws.slice(i, i + windowSize);
        const counts = new Map<number, number>();
        windowDraws.forEach(d => d.mainNumbers.forEach(n => counts.set(n, (counts.get(n) || 0) + 1)));

        const frequencies = Array.from({ length: MAIN_NUMBER_MAX }, (_, k) => k + 1)
            .map(num => ({ number: num, count: counts.get(num) || 0 }));
        
        frequencies.sort((a, b) => b.count - a.count);

        const hotThresholdIndex = Math.floor(MAIN_NUMBER_MAX * 0.3);
        const coldThresholdIndex = Math.floor(MAIN_NUMBER_MAX * 0.7);

        const hotNumbers = new Set(frequencies.slice(0, hotThresholdIndex).map(f => f.number));
        const coldNumbers = new Set(frequencies.slice(coldThresholdIndex).map(f => f.number));

        for (let num = 1; num <= MAIN_NUMBER_MAX; num++) {
            let state: 'Hot' | 'Cold' | 'Neutral' = 'Neutral';
            if (hotNumbers.has(num)) state = 'Hot';
            else if (coldNumbers.has(num)) state = 'Cold';
            numberStates[num].push(state);
        }
    }
    
    const transitions: HotColdTransition[] = [];
    for (let num = 1; num <= MAIN_NUMBER_MAX; num++) {
        const states = numberStates[num];
        if (states.length < 2) continue;
        
        let transitionCount = 0;
        for (let i = 1; i < states.length; i++) {
            if (states[i] !== states[i-1]) {
                transitionCount++;
            }
        }
        
        transitions.push({
            number: num,
            transitions: transitionCount,
            currentState: states[states.length - 1],
        });
    }

    // FIX: Return the full list of transitions instead of slicing, to enable comprehensive stability analysis.
    return transitions;
};


const analyzeDormancyBreakSignals = (draws: Draw[]): DormancyBreakdownSignal[] => {
    if (draws.length < 100) return [];

    const lastSeen: { [key: number]: number } = {};
    const dormancies: { [key: number]: number[] } = {};
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) dormancies[i] = [];
    
    draws.forEach((draw, index) => {
        draw.mainNumbers.forEach(num => {
            if (lastSeen[num] !== undefined) {
                dormancies[num].push(index - lastSeen[num]);
            }
            lastSeen[num] = index;
        });
    });

    const avgDormancies = new Map<number, number>();
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const avg = dormancies[i].length > 0 ? dormancies[i].reduce((a, b) => a + b, 0) / dormancies[i].length : 0;
        avgDormancies.set(i, avg);
    }
    
    const signals = {
        companionActivity: { hits: 0, total: 0 },
    };

    const companionMap = new Map<number, Map<number, number>>();
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) companionMap.set(i, new Map());

    draws.forEach((draw) => {
        const numbers = draw.mainNumbers;
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                const n1 = numbers[i];
                const n2 = numbers[j];
                const n1Companions = companionMap.get(n1)!;
                const n2Companions = companionMap.get(n2)!;
                n1Companions.set(n2, (n1Companions.get(n2) || 0) + 1);
                n2Companions.set(n1, (n2Companions.get(n1) || 0) + 1);
            }
        }
    });

    const topCompanions = new Map<number, number[]>();
    for(let i=1; i<=MAIN_NUMBER_MAX; i++) {
        const companions = Array.from(companionMap.get(i)!.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(c => c[0]);
        topCompanions.set(i, companions);
    }

    // Now, find dormancy breaks
    for (let i = 5; i < draws.length; i++) {
        const currentDraw = draws[i];
        
        for (const num of currentDraw.mainNumbers) {
            let lastSeenIndex = -1;
            for (let j = i - 1; j >= 0; j--) {
                if(draws[j].mainNumbers.includes(num)) {
                    lastSeenIndex = j;
                    break;
                }
            }
            if (lastSeenIndex === -1) continue;

            const currentDormancy = i - 1 - lastSeenIndex;
            const avgDormancy = avgDormancies.get(num) || 0;

            if (avgDormancy > 0 && currentDormancy > avgDormancy * 1.5) { // It's a dormancy break
                signals.companionActivity.total++;
                const preBreakWindow = draws.slice(i - 5, i);
                const companions = topCompanions.get(num) || [];
                let companionHit = false;
                for (const preDraw of preBreakWindow) {
                    if (preDraw.mainNumbers.some(n => companions.includes(n))) {
                        companionHit = true;
                        break;
                    }
                }
                if (companionHit) signals.companionActivity.hits++;
            }
        }
    }

    const results: DormancyBreakdownSignal[] = [];
    if (signals.companionActivity.total > 10) { // Only if we have enough data points
        results.push({
            signal: "Aktivitet blandt følgetal",
            occurrenceRate: (signals.companionActivity.hits / signals.companionActivity.total) * 100,
            description: "I tilfælde hvor et tals top-3 følgetal blev trukket inden for 5 trækninger før tallet selv brød sin dvale."
        });
    }

    return results;
};


const analyzeCrossCorrelations = (draws: Draw[]): CorrelationInsight[] => {
    if (draws.length < 50) return [];
    
    const metrics = draws.map((d, i) => {
        if (i === 0) return null;
        const spread = Math.max(...d.mainNumbers) - Math.min(...d.mainNumbers);
        const prevRepeats = d.mainNumbers.filter(n => draws[i-1].mainNumbers.includes(n)).length > 0;
        return { spread, prevRepeats };
    }).filter(Boolean) as { spread: number, prevRepeats: boolean }[];

    metrics.sort((a,b) => a.spread - b.spread);
    const lowSpreadThreshold = metrics[Math.floor(metrics.length * 0.25)].spread;
    const highSpreadThreshold = metrics[Math.floor(metrics.length * 0.75)].spread;
    
    const lowSpreadGroup = metrics.filter(m => m.spread <= lowSpreadThreshold);
    const highSpreadGroup = metrics.filter(m => m.spread >= highSpreadThreshold);

    if (lowSpreadGroup.length < 10 || highSpreadGroup.length < 10) return [];

    const lowSpreadRepeatRate = lowSpreadGroup.filter(m => m.prevRepeats).length / lowSpreadGroup.length;
    const highSpreadRepeatRate = highSpreadGroup.filter(m => m.prevRepeats).length / highSpreadGroup.length;

    const insights: CorrelationInsight[] = [];
    const difference = highSpreadRepeatRate - lowSpreadRepeatRate;

    if (Math.abs(difference) > 0.1) { // More than 10% difference
        const direction = difference > 0 ? "højere" : "lavere";
        insights.push({
            title: "Spredning vs. Gentagelse",
            description: `Trækninger med HØJ spredning har en ${direction} tendens til at blive efterfulgt af en gentagelse af mindst et hovedtal. (${(highSpreadRepeatRate*100).toFixed(0)}% vs ${(lowSpreadRepeatRate*100).toFixed(0)}% for lav spredning).`,
            strength: 'Moderate'
        });
    }
    
    return insights;
};


export const analyzeMetaPatterns = (draws: Draw[]): MetaPatternAnalysis => {
    return {
        hotColdTransitions: analyzeHotColdTransitions(draws),
        dormancyBreakSignals: analyzeDormancyBreakSignals(draws),
        correlationInsights: analyzeCrossCorrelations(draws),
    };
};