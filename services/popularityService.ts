// services/popularityService.ts

import { MAIN_NUMBER_MAX } from '../constants';


const LUCKY_NUMBERS = new Set([7, 11, 21]);
const ROUND_NUMBERS = new Set([10, 20, 30, 40, 50]);
const PRIME_NUMBERS = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);


/**
 * Calculates a popularity score for each main number based on common human biases.
 * Higher scores indicate higher popularity.
 * @returns A map where the key is the number (1-50) and the value is its popularity score and justification.
 */
export const calculatePopularityScores = (): Map<number, { score: number, reason: string }> => {
    const popularityScores = new Map<number, { score: number, reason: string }>();
    
    for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
        let score = 0;
        const reasons: string[] = [];

        // Birthday Bias (most significant)
        if (i >= 1 && i <= 31) {
            score += 60;
            reasons.push('Birthday Range');
        }
        
        // Lucky Number Bias
        if (LUCKY_NUMBERS.has(i)) {
            score += 25;
            reasons.push('Lucky Number');
        }

        // Round Number Bias
        if (ROUND_NUMBERS.has(i)) {
            score += 15;
            reasons.push('Round Number');
        }
        
        // Prime Number Bias
        if (PRIME_NUMBERS.has(i)) {
            score += 20;
            reasons.push('Prime Number');
        }

        // Small visual pattern bias for low numbers
        if (i <= 9) {
            score += 10;
            reasons.push('Visual Pattern (Low)');
        }

        if (score > 0) {
            popularityScores.set(i, { score, reason: reasons.join(', ') });
        }
    }
    
    return popularityScores;
};
