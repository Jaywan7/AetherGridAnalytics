import React from 'react';
import type { ValidationResult, ContextualPerformance, CulturalValidation } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { InfoIcon } from './icons/InfoIcon'; // Using InfoIcon for 'not confirmed'

const CONTEXT_LABELS: Record<string, string> = {
    CHRISTMAS: 'Jul',
    EASTER_PERIOD: 'Påske',
    SUMMER_HOLIDAY: 'Sommerferie',
    NEW_YEAR: 'Nytår',
};

const ContextualPerformanceCard: React.FC<{ data: ContextualPerformance }> = ({ data }) => {
    const improvementColor = data.improvement === null ? 'text-brand-text-secondary' : data.improvement > 0 ? 'text-green-400' : 'text-red-400';
    const improvementText = data.improvement === null ? 'N/A' : `${data.improvement > 0 ? '+' : ''}${data.improvement.toFixed(1)}%`;

    return (
        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
            <h5 className="font-semibold text-brand-text-primary">{CONTEXT_LABELS[data.context] || data.context}</h5>
            <p className="text-xs text-brand-text-secondary">{data.draws} trækninger analyseret</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-xs text-brand-text-secondary">Model Gns. Træf</div>
                    <div className="text-lg font-bold text-brand-primary">{data.modelAvgHits.toFixed(2)}</div>
                </div>
                <div>
                    <div className="text-xs text-brand-text-secondary">Baseline Gns. Træf</div>
                    <div className="text-lg font-bold text-brand-text-secondary">{data.baselineAvgHits.toFixed(2)}</div>
                </div>
                <div>
                    <div className="text-xs text-brand-text-secondary">Forbedring</div>
                    <div className={`text-lg font-bold ${improvementColor}`}>{improvementText}</div>
                </div>
            </div>
        </div>
    );
}

const CulturalValidationCard: React.FC<{ data: CulturalValidation }> = ({ data }) => {
    const Icon = data.isConfirmed ? CheckCircleIcon : InfoIcon;
    const color = data.isConfirmed ? 'text-green-400' : 'text-yellow-400';

    return (
         <div className="bg-brand-bg p-4 rounded-lg border border-brand-border flex items-start gap-4">
            <Icon className={`w-6 h-6 flex-shrink-0 mt-1 ${color}`} />
            <div>
                <h5 className={`font-semibold ${color}`}>{data.name}</h5>
                <p className="text-xs text-brand-text-secondary mt-1 italic">ⓘ {data.details}</p>
            </div>
        </div>
    );
};


export const ValidationPanel: React.FC<{ result: ValidationResult }> = ({ result }) => {
    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <TestTubeIcon className="w-8 h-8 text-purple-400" />
                <div>
                    <h3 className="text-xl font-bold text-white">Model Validation & Cultural Tuning</h3>
                    <p className="text-sm text-brand-text-secondary">Testing the model's core assumptions against historical reality.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-3 text-center">Contextual Performance: Did the model adapt?</h4>
                     <div className="space-y-3">
                        {result.contextualPerformance.length > 0 ? (
                            result.contextualPerformance.map(item => <ContextualPerformanceCard key={item.context} data={item} />)
                        ) : (
                            <p className="text-sm text-brand-text-secondary text-center p-4">No significant holiday periods found in the backtest data.</p>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-brand-text-primary mb-3 text-center">Cultural Validation: Do our assumptions hold true?</h4>
                    <div className="space-y-3">
                        {result.culturalValidation.map(item => <CulturalValidationCard key={item.name} data={item} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};
