
import React from 'react';
import type { IntelligentCoupon } from '../types';
import { InfoIcon } from './icons/InfoIcon';

const NumberSet: React.FC<{ numbers: number[], color: string }> = ({ numbers, color }) => (
    <div className="flex flex-wrap gap-2">
        {numbers.map(num => (
            <span key={num} className={`flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-sm ${color}`}>
                {num}
            </span>
        ))}
    </div>
);

const getConfidenceColor = (level: 'High' | 'Medium' | 'Low') => {
    switch(level) {
        case 'High': return 'bg-green-500/20 text-green-300';
        case 'Medium': return 'bg-blue-500/20 text-blue-300';
        case 'Low': return 'bg-yellow-500/20 text-yellow-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
};

export const IntelligentCoupons: React.FC<{ coupons: IntelligentCoupon[] }> = ({ coupons }) => {
    if (!coupons || coupons.length === 0) return null;

    const scores = coupons.map(d => d.score);
    const maxScore = scores.length > 0 ? Math.max(1, ...scores) : 1;

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-semibold text-brand-text-primary">Intelligente Kupon-Forslag: Den Sidste Forfining</h3>
                <p className="mt-1 text-sm text-brand-text-secondary max-w-4xl">
                    Disse Top 10 kuponer er bygget ved at kombinere de tal med den højeste Aether Score, samtidig med at de overholder de mest almindelige strukturelle mønstre (som sum, spredning og lige/ulige-fordeling). Hver række repræsenterer en statistisk robust kombination.
                </p>
                 <div className="mt-2 flex items-center gap-2 text-xs text-brand-text-secondary p-2 bg-brand-bg rounded-md">
                    <InfoIcon className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <em className="italic">
                        ⓘ Disse kuponer er nu også optimeret til at have en realistisk intern afstand (delta) mellem tallene, baseret på historiske mønstre.
                    </em>
                </div>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-lg">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th scope="col" className="p-4 w-16">Rank</th>
                                <th scope="col" className="p-4">Hovedtal</th>
                                <th scope="col" className="p-4">Stjernetal</th>
                                <th scope="col" className="p-4">Kupon Score</th>
                                <th scope="col" className="p-4">Konfidens</th>
                                <th scope="col" className="p-4">Begrundelse</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => (
                                <tr key={coupon.rank} className="border-t border-brand-border">
                                    <td className="p-4 font-bold text-brand-text-primary text-center">
                                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-bg border border-brand-border">
                                            {coupon.rank}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <NumberSet numbers={coupon.mainNumbers} color="bg-brand-primary text-brand-bg" />
                                    </td>
                                    <td className="p-4">
                                        <NumberSet numbers={coupon.starNumbers} color="bg-yellow-400 text-brand-bg" />
                                    </td>
                                     <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-brand-text-primary w-12">{coupon.score.toFixed(0)}</span>
                                            <div className="w-full bg-brand-border rounded-full h-2.5">
                                                <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${Math.max(0, (coupon.score / maxScore)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="relative group">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(coupon.confidence.level)}`}>
                                                {coupon.confidence.level}
                                            </span>
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64
                                                            bg-brand-bg border border-brand-border rounded-lg p-3 text-xs text-left
                                                            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10
                                                            shadow-lg">
                                                {coupon.confidence.justification}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-brand-text-secondary text-xs max-w-sm">{coupon.justification}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
