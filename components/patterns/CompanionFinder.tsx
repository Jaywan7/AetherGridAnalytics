
import React, { useState, useCallback, useMemo } from 'react';
import type { Companion, CompanionAnalysis } from '../../types';

interface CompanionFinderProps {
    companionData: CompanionAnalysis['companionData'];
}

export const CompanionFinder: React.FC<CompanionFinderProps> = ({ companionData }) => {
    const [selectedNumber, setSelectedNumber] = useState('');
    const [foundCompanions, setFoundCompanions] = useState<Companion[] | null>(null);

    const handleFind = useCallback(() => {
        const num = parseInt(selectedNumber);
        if (num >= 1 && num <= 50 && companionData[num]) {
            setFoundCompanions(companionData[num]);
        } else {
            setFoundCompanions(null);
        }
    }, [selectedNumber, companionData]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleFind();
        }
    }

    const maxCount = useMemo(() => {
        if (!foundCompanions || foundCompanions.length === 0) return 1;
        return Math.max(...foundCompanions.map(c => c.count));
    }, [foundCompanions]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <label htmlFor="companion-number-input" className="text-sm font-medium text-brand-text-secondary">Enter a main number (1-50):</label>
                <input
                    type="number"
                    id="companion-number-input"
                    value={selectedNumber}
                    onChange={(e) => setSelectedNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-brand-bg border border-brand-border rounded-md px-3 py-1.5 w-24 text-center focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    min="1"
                    max="50"
                />
                <button
                    onClick={handleFind}
                    className="px-4 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors text-sm font-medium"
                >
                    Find Companions
                </button>
            </div>

            {foundCompanions && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-secondary uppercase">
                            <tr>
                                <th scope="col" className="p-2">Companion Number</th>
                                <th scope="col" className="p-2">Drawn Together</th>
                                <th scope="col" className="p-2">Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foundCompanions.map((comp) => (
                                <tr key={comp.number} className="border-b border-brand-border last:border-b-0">
                                    <td className="p-2 font-bold text-brand-text-primary text-center">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono">
                                            {comp.number}
                                        </div>
                                    </td>
                                    <td className="p-2 text-brand-text-secondary">{comp.count} times</td>
                                    <td className="p-2">
                                        <div className="w-full bg-brand-border rounded-full h-2.5">
                                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(comp.count / maxCount) * 100}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
