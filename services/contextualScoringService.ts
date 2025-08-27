// services/contextualScoringService.ts

// FIX: Import DateContext from types.ts where it is defined and exported.
import type { DateContext } from '../types';
import { MAIN_NUMBER_MAX } from '../constants';

type BoostsMap = Map<number, { score: number, reason: string }>;

export const getContextualBoosts = (
    context: DateContext, 
    easterDate: Date | null
): { boosts: BoostsMap, justification: string } => {
    
    const boosts: BoostsMap = new Map();
    let justification = '';

    const applyBoost = (condition: (num: number) => boolean, score: number, reason: string) => {
        for (let i = 1; i <= MAIN_NUMBER_MAX; i++) {
            if (condition(i)) {
                const existing = boosts.get(i) || { score: 0, reason: '' };
                boosts.set(i, {
                    score: existing.score + score,
                    reason: existing.reason ? `${existing.reason}, ${reason}` : reason
                });
            }
        }
    };

    switch (context) {
        case 'CHRISTMAS':
            justification = 'Christmas period: Penalizing common holiday numbers.';
            applyBoost(num => num === 24 || num === 25 || num === 12, -20, 'Christmas date');
            break;
            
        case 'NEW_YEAR':
            justification = 'New Year period: Boosting high numbers & penalizing common round numbers.';
            applyBoost(num => num > 31, 15, 'high number');
            applyBoost(num => num % 10 === 0, -15, 'round number');
            break;

        case 'SUMMER_HOLIDAY':
            justification = 'Summer holiday: Boosting unpopular high numbers as many people play birthdays.';
            applyBoost(num => num > 31, 20, 'anti-birthday');
            break;

        case 'EASTER_PERIOD':
            if (easterDate) {
                justification = 'Easter period: Penalizing date-related numbers.';
                const easterDay = easterDate.getUTCDate();
                const easterMonth = easterDate.getUTCMonth() + 1;
                applyBoost(num => num === easterDay || num === easterMonth, -15, 'Easter date');
            }
            break;
            
        case 'NONE':
        default:
            // No boosts
            break;
    }

    return { boosts, justification };
};