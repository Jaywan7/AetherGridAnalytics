
import React from 'react';

interface PatternCardProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export const PatternCard: React.FC<PatternCardProps> = ({ title, description, children }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-lg border border-brand-border h-full flex flex-col">
            <div>
                <h4 className="font-semibold text-brand-text-primary">{title}</h4>
                <p className="mt-1 text-sm text-brand-text-secondary">{description}</p>
            </div>
            <div className="mt-4 flex-grow">
                {children}
            </div>
        </div>
    );
};
