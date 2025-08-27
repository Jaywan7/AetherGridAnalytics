
import React, { useState, ReactElement, Children } from 'react';

interface TabProps {
    label: string;
    children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => <>{children}</>;

interface TabsProps {
    children: ReactElement<TabProps> | ReactElement<TabProps>[];
}

export const Tabs: React.FC<TabsProps> = ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = Children.toArray(children) as ReactElement<TabProps>[];

    return (
        <div>
            <div className="border-b border-brand-border">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.props.label}
                            onClick={() => setActiveTab(index)}
                            className={`${
                                activeTab === index
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-text-secondary'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            aria-current={activeTab === index ? 'page' : undefined}
                        >
                            {tab.props.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="py-6">
                {tabs[activeTab]}
            </div>
        </div>
    );
};
