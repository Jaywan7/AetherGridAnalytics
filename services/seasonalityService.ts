
import type { Draw, SeasonalAnalysis } from '../types';

// Copied from analysisService.ts
const getRecencyWeight = (drawIndex: number, totalDraws: number): number => {
    if (totalDraws <= 1) return 1;
    const decayFactor = totalDraws * 0.2;
    const exponent = (drawIndex - (totalDraws - 1)) / decayFactor;
    return Math.exp(exponent);
};

// Copied and adapted from App.tsx
const getDateInfo = (dateString: string): { month: number, quarter: number } | null => {
    let date: Date | null = null;
    const trimmedDateString = dateString.trim();

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmedDateString)) {
        const parts = trimmedDateString.split('-');
        const [year, month, day] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(Date.UTC(year, month - 1, day));
        }
    } else if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(trimmedDateString)) {
        const separator = trimmedDateString.includes('.') ? '.' : '/';
        const parts = trimmedDateString.split(separator);
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
            date = new Date(Date.UTC(fullYear, month - 1, day));
        }
    }

    if (!date || isNaN(date.getTime())) {
        const parsedDate = new Date(trimmedDateString);
        if (!isNaN(parsedDate.getTime())) {
             date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
        }
    }
    
    if (date && !isNaN(date.getTime())) {
        const month = date.getUTCMonth(); // 0-11
        const quarter = Math.floor(month / 3) + 1; // 1-4
        return { month, quarter };
    }
    
    return null;
};

export const analyzeSeasonalPatterns = (draws: Draw[]): SeasonalAnalysis => {
    const monthlyCounts: { [month: number]: Map<number, number> } = {};
    const quarterlyCounts: { [quarter: number]: Map<number, number> } = {};
    const totalDraws = draws.length;

    for (let i = 0; i < 12; i++) monthlyCounts[i] = new Map();
    for (let i = 1; i <= 4; i++) quarterlyCounts[i] = new Map();

    draws.forEach((draw, index) => {
        const dateInfo = getDateInfo(draw.drawDate);
        if (!dateInfo) return;

        const weight = getRecencyWeight(index, totalDraws);
        const { month, quarter } = dateInfo;

        draw.mainNumbers.forEach(num => {
            monthlyCounts[month].set(num, (monthlyCounts[month].get(num) || 0) + weight);
            quarterlyCounts[quarter].set(num, (quarterlyCounts[quarter].get(num) || 0) + weight);
        });
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const seasonalAnalysis: SeasonalAnalysis = {
        monthly: {},
        quarterly: {},
    };

    monthNames.forEach((name, index) => {
        seasonalAnalysis.monthly[name] = Array.from(monthlyCounts[index].entries())
            .map(([number, count]) => ({ number, count }))
            .sort((a, b) => b.count - a.count);
    });

    for (let i = 1; i <= 4; i++) {
        seasonalAnalysis.quarterly[`Q${i}`] = Array.from(quarterlyCounts[i].entries())
            .map(([number, count]) => ({ number, count }))
            .sort((a, b) => b.count - a.count);
    }

    return seasonalAnalysis;
};
