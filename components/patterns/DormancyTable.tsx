
import React, { useState, useMemo } from 'react';
import type { DormancyData } from '../../types';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface DormancyTableProps {
    data: DormancyData[];
}

type SortKey = keyof DormancyData;

export const DormancyTable: React.FC<DormancyTableProps> = ({ data }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'currentDormancy', direction: 'desc' });
    
    const sortedData = useMemo(() => {
        const sortableData = [...data];
        sortableData.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableData;
    }, [data, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortKey, label: string }> = ({ sortKey, label }) => {
        const isActive = sortConfig.key === sortKey;
        const isDesc = sortConfig.direction === 'desc';
        return (
            <th scope="col" className="p-2 cursor-pointer" onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-1">
                    {label}
                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${isActive ? 'opacity-100' : 'opacity-30'} ${isDesc ? '' : 'rotate-180'}`} />
                </div>
            </th>
        );
    }

    return (
        <div className="overflow-y-auto h-96">
            <table className="w-full text-sm text-left table-fixed">
                <thead className="text-xs text-brand-text-secondary uppercase sticky top-0 bg-brand-surface">
                    <tr>
                        <SortableHeader sortKey="number" label="Num" />
                        <SortableHeader sortKey="currentDormancy" label="Current Dormancy" />
                        <SortableHeader sortKey="averageDormancy" label="Avg. Dormancy" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                    {sortedData.map((item) => (
                        <tr key={item.number} className={item.isOverdue ? 'bg-blue-900/20' : ''}>
                            <td className="p-2 font-mono font-bold text-brand-text-primary">{item.number}</td>
                            <td className="p-2 text-brand-text-primary">{item.currentDormancy}</td>
                            <td className="p-2 text-brand-text-secondary">{item.averageDormancy.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
