
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
            <h4 className="text-sm font-medium text-brand-text-secondary">{title}</h4>
            <p className="mt-1 text-3xl font-semibold text-brand-text-primary">{value}</p>
        </div>
    );
};
