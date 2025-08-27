import type { Draw, RhythmAnalysisResult } from '../types';
import { MAIN_NUMBER_MAX } from '../constants';

const calculateStandardDeviation = (arr: number[]): number => {
    if (arr.length < 2) return 0;
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

export const analyzeNumberRhythm = (draws: Draw[]): RhythmAnalysisResult[] => {
    if (draws.length < 20) {
        return [];
    }

    const lastSeen: { [key: number]: number } = {};
    const dormancies: { [key: number]: number[] } = {};

    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        dormancies[i] = [];
    }

    draws.forEach((draw, index) => {
        draw.mainNumbers.forEach(num => {
            if (lastSeen[num] !== undefined) {
                const duration = index - lastSeen[num];
                dormancies[num].push(duration);
            }
            lastSeen[num] = index;
        });
    });

    const results: RhythmAnalysisResult[] = [];
    const allStdDevs: number[] = [];

    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        const numberDormancies = dormancies[i];
        if (numberDormancies.length >= 5) { // Require at least 5 hits to establish a rhythm
            const averageDormancy = numberDormancies.reduce((a, b) => a + b, 0) / numberDormancies.length;
            const dormancyStdDev = calculateStandardDeviation(numberDormancies);
            allStdDevs.push(dormancyStdDev);
            results.push({
                number: i,
                averageDormancy,
                dormancyStdDev,
                pulseStrength: 0, // Placeholder
            });
        }
    }

    if (results.length === 0) return [];

    // Normalize pulse strength: lower std dev is better
    const maxStdDev = Math.max(...allStdDevs, 1);
    const minStdDev = Math.min(...allStdDevs);
    
    // Invert and scale to 0-100
    results.forEach(res => {
        if (maxStdDev > minStdDev) {
            const normalized = (maxStdDev - res.dormancyStdDev) / (maxStdDev - minStdDev);
            res.pulseStrength = normalized * 100;
        } else {
            res.pulseStrength = 100; // All have the same rhythm
        }
    });

    return results.sort((a, b) => b.pulseStrength - a.pulseStrength);
};
