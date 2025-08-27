
import type { Draw } from '../types';

// Helper to parse date strings into Date objects, ensuring UTC context
const parseDateUTC = (dateString: string): Date | null => {
    let date: Date | null = null;
    const trimmedDateString = dateString.trim();

    // Try YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmedDateString)) {
        const parts = trimmedDateString.split('-');
        const [year, month, day] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(Date.UTC(year, month - 1, day));
        }
    }
    // Try DD.MM.YYYY or DD/MM/YYYY
    else if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(trimmedDateString)) {
        const separator = trimmedDateString.includes('.') ? '.' : '/';
        const parts = trimmedDateString.split(separator);
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
            date = new Date(Date.UTC(fullYear, month - 1, day));
        }
    }

    // Fallback for other formats
    if (!date || isNaN(date.getTime())) {
        const parsedDate = new Date(trimmedDateString);
        if (!isNaN(parsedDate.getTime())) {
             date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
        }
    }
    
    return (date && !isNaN(date.getTime())) ? date : null;
};

export const predictNextDrawDate = (draws: Draw[]): Date | null => {
    if (draws.length < 2) {
        return null; // Not enough data to establish a pattern
    }

    const sortedDraws = [...draws].sort((a, b) => (parseDateUTC(a.drawDate)?.getTime() || 0) - (parseDateUTC(b.drawDate)?.getTime() || 0));
    const lastDraw = sortedDraws[sortedDraws.length - 1];
    const lastDrawDate = parseDateUTC(lastDraw.drawDate);

    if (!lastDrawDate) {
        return null;
    }

    const lastDrawDay = lastDrawDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

    // Check for a Tuesday/Friday pattern in the last 20 draws
    const recentDraws = sortedDraws.slice(-20);
    const daysOfWeek = new Set(recentDraws.map(d => parseDateUTC(d.drawDate)?.getUTCDay()));
    
    const hasTuesday = daysOfWeek.has(2);
    const hasFriday = daysOfWeek.has(5);

    if (hasTuesday && hasFriday) {
        // Standard Tue/Fri pattern detected
        if (lastDrawDay === 2) { // Last was Tuesday
            lastDrawDate.setUTCDate(lastDrawDate.getUTCDate() + 3); // Next is Friday
            return lastDrawDate;
        } else if (lastDrawDay === 5) { // Last was Friday
            lastDrawDate.setUTCDate(lastDrawDate.getUTCDate() + 4); // Next is Tuesday
            return lastDrawDate;
        }
    }
    
    // Fallback: Calculate the most common interval between draws
    const intervals: number[] = [];
    for (let i = 1; i < sortedDraws.length; i++) {
        const dateA = parseDateUTC(sortedDraws[i-1].drawDate);
        const dateB = parseDateUTC(sortedDraws[i].drawDate);
        if (dateA && dateB) {
            const diffTime = Math.abs(dateB.getTime() - dateA.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                intervals.push(diffDays);
            }
        }
    }
    
    if (intervals.length > 0) {
        const intervalCounts = new Map<number, number>();
        intervals.forEach(interval => {
            intervalCounts.set(interval, (intervalCounts.get(interval) || 0) + 1);
        });
        
        const [mostCommonInterval] = [...intervalCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        
        if (mostCommonInterval) {
            lastDrawDate.setUTCDate(lastDrawDate.getUTCDate() + mostCommonInterval);
            return lastDrawDate;
        }
    }

    // Ultimate fallback: assume weekly draw
    lastDrawDate.setUTCDate(lastDrawDate.getUTCDate() + 7);
    return lastDrawDate;
};
