
import React from 'react';
import { CalendarIcon } from './icons/CalendarIcon';

interface NextDrawForecastProps {
    predictedDate: Date | null;
}

const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    };
    // Use a locale that fits the user's language from the prompt
    return new Intl.DateTimeFormat('da-DK', options).format(date);
};

export const NextDrawForecast: React.FC<NextDrawForecastProps> = ({ predictedDate }) => {
    if (!predictedDate) {
        return null;
    }

    const formattedDate = formatDate(predictedDate);

    return (
        <div className="bg-brand-surface border border-brand-border rounded-lg p-4 flex items-center gap-4">
            <div className="flex-shrink-0 bg-brand-bg p-3 rounded-lg border border-brand-border">
                <CalendarIcon className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
                <h4 className="text-sm font-medium text-brand-text-secondary">Forventet Næste Trækningsdato</h4>
                <p className="text-xl font-semibold text-brand-text-primary mt-1">{formattedDate}</p>
                 <p className="text-xs text-brand-text-secondary mt-1">
                    Prognose baseret på historisk trækningsmønster. Sæson-analyse er justeret til denne dato.
                </p>
            </div>
        </div>
    );
};
