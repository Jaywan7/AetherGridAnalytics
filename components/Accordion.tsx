
import React, { useState, useContext, createContext, PropsWithChildren } from 'react';

const AccordionContext = createContext<{ openItems: string[], toggleItem: (id: string) => void }>({
    openItems: [],
    toggleItem: () => {},
});

export const Accordion: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <AccordionContext.Provider value={{ openItems, toggleItem }}>
            <div className="space-y-2">{children}</div>
        </AccordionContext.Provider>
    );
};

interface AccordionItemProps {
    title: string;
    description: string;
    defaultOpen?: boolean;
}

export const AccordionItem: React.FC<PropsWithChildren<AccordionItemProps>> = ({ children, title, description, defaultOpen = false }) => {
    const { openItems, toggleItem } = useContext(AccordionContext);
    const [isInitialized, setIsInitialized] = useState(false);
    
    if (defaultOpen && !isInitialized) {
        if (!openItems.includes(title)) {
            toggleItem(title);
        }
        setIsInitialized(true);
    }
    
    const isOpen = openItems.includes(title);

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden">
            <button
                type="button"
                className="w-full flex justify-between items-center p-5 text-left"
                onClick={() => toggleItem(title)}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${title}`}
            >
                <div className="flex-1 pr-4">
                    <h4 className="font-semibold text-brand-text-primary">{title}</h4>
                    <p className="text-sm text-brand-text-secondary mt-1">{description}</p>
                </div>
                <svg className={`w-5 h-5 text-brand-text-secondary transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                id={`accordion-content-${title}`}
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                role="region"
                aria-labelledby={`accordion-button-${title}`}
            >
                <div className="p-1">
                    {children}
                </div>
            </div>
        </div>
    );
};
