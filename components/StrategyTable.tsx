
import React from 'react';
import type { StrategyCoupon } from '../types';

interface StrategyTableProps {
    coupons: StrategyCoupon[];
}

const NumberSet: React.FC<{ numbers: number[], color: string }> = ({ numbers, color }) => (
    <div className="flex flex-wrap gap-2">
        {numbers.map(num => (
            <span key={num} className={`flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-sm ${color}`}>
                {num}
            </span>
        ))}
    </div>
);


export const StrategyTable: React.FC<StrategyTableProps> = ({ coupons }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-brand-text-secondary uppercase">
                    <tr>
                        <th scope="col" className="p-4 w-16">Rank</th>
                        <th scope="col" className="p-4">Main Numbers</th>
                        <th scope="col" className="p-4">Star Numbers</th>
                        <th scope="col" className="p-4">Insight: Why this combination?</th>
                    </tr>
                </thead>
                <tbody>
                    {coupons.map((coupon) => (
                        <tr key={coupon.rank} className="border-b border-brand-border last:border-b-0">
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
                            <td className="p-4 text-brand-text-secondary max-w-sm">{coupon.insight}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
