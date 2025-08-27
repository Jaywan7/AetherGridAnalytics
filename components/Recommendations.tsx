
import React from 'react';
import type { StrategyResult } from '../types';
import { Accordion, AccordionItem } from './Accordion';
import { StrategyTable } from './StrategyTable';

interface RecommendationsProps {
    strategies: StrategyResult[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ strategies }) => {
    if (!strategies || strategies.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Strategic Recommendations</h3>
            <Accordion>
                {strategies.map((strategy, index) => (
                    <AccordionItem 
                        key={strategy.title}
                        title={strategy.title}
                        description={strategy.description}
                        defaultOpen={index === strategies.length - 1} // Open meta-analysis by default
                    >
                        <StrategyTable coupons={strategy.coupons} />
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};
