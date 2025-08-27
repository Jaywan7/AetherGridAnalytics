// services/validationService.ts
import type { PerformanceLogItem, Draw, ValidationResult, ContextualPerformance, CulturalValidation, DateContext } from '../types';
import { analyzeAntiPopularity } from './antiPopularityService';

const CONTEXTS_TO_VALIDATE: DateContext[] = ['CHRISTMAS', 'SUMMER_HOLIDAY', 'EASTER_PERIOD', 'NEW_YEAR'];

export const analyzeValidationResults = (performanceLog: PerformanceLogItem[], draws: Draw[]): ValidationResult => {
    // --- 1. Contextual Performance ---
    const contextualPerformance: ContextualPerformance[] = [];
    
    for (const context of CONTEXTS_TO_VALIDATE) {
        const contextLog = performanceLog.filter(item => item.context === context);
        if (contextLog.length > 5) { // Only analyze if we have a reasonable sample size
            const modelHits = contextLog.reduce((sum, item) => sum + item.mainHits, 0);
            const baselineHits = contextLog.reduce((sum, item) => sum + (item.baselineMainHits || 0), 0);
            const modelAvgHits = modelHits / contextLog.length;
            const baselineAvgHits = baselineHits / contextLog.length;
            
            let improvement: number | null = null;
            if (baselineAvgHits > 0) {
                 improvement = ((modelAvgHits - baselineAvgHits) / baselineAvgHits) * 100;
            }

            contextualPerformance.push({
                context,
                draws: contextLog.length,
                modelAvgHits,
                baselineAvgHits,
                improvement,
            });
        }
    }

    // --- 2. Cultural Validation ---
    const culturalValidation: CulturalValidation[] = [];
    const antiPopAnalysis = analyzeAntiPopularity(draws);

    const checkBias = (biasName: string, expectedDirection: 'under' | 'over') => {
        const bias = antiPopAnalysis.humanBiasAnalysis.find(b => b.name.includes(biasName)) || antiPopAnalysis.combinationBiasAnalysis.find(b => b.name.includes(biasName));
        if (!bias) return;

        const isUnder = bias.observed < bias.expected;
        const isOver = bias.observed > bias.expected;
        const isConfirmed = (expectedDirection === 'under' && isUnder) || (expectedDirection === 'over' && isOver);

        culturalValidation.push({
            name: `Bias Check: ${bias.name}`,
            isConfirmed,
            details: `Anti-popularitetsstrategien forventer, at dette mønster er ${expectedDirection}-repræsenteret. Observeret: ${bias.observed.toFixed(2)}${bias.unit}, Forventet: ${bias.expected.toFixed(2)}${bias.unit}. Forudsætningen er derfor ${isConfirmed ? 'bekræftet' : 'ikke bekræftet'}.`,
        });
    };

    checkBias('Fødselsdags-koefficient', 'under');
    checkBias('Høje tal-fordel', 'over');
    checkBias('Gennemsnitlig Sum', 'over');
    checkBias('Nabotal', 'over');

    return { contextualPerformance, culturalValidation };
}
