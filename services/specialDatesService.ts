// services/specialDatesService.ts

import type { DateContext } from '../types';

const calculateEaster = (year: number): Date => {
    // Gauss Easter algorithm for Gregorian dates
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
};

export const getCurrentContext = (date: Date): { context: DateContext, easterDate: Date | null } => {
    const month = date.getUTCMonth(); // 0 = January
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();

    // New Year: last week of Dec, first week of Jan
    if ((month === 11 && day > 25) || (month === 0 && day < 8)) {
        return { context: 'NEW_YEAR', easterDate: null };
    }
    // Christmas: Dec 1 - 25
    if (month === 11 && day <= 25) {
        return { context: 'CHRISTMAS', easterDate: null };
    }
    // Summer Holiday: Mid-June to Mid-August
    if ((month === 5 && day >= 15) || month === 6 || (month === 7 && day <= 15)) {
        return { context: 'SUMMER_HOLIDAY', easterDate: null };
    }
    // Easter period: week before and week after
    const easterDate = calculateEaster(year);
    const easterTime = easterDate.getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (date.getTime() >= easterTime - oneWeek && date.getTime() <= easterTime + oneWeek) {
        return { context: 'EASTER_PERIOD', easterDate };
    }
    
    return { context: 'NONE', easterDate: null };
};


const getDanishHolidays = (year: number): Date[] => {
    const easterSunday = calculateEaster(year);
    const holidays = [
        // Fixed holidays
        new Date(Date.UTC(year, 0, 1)),   // New Year's Day
        new Date(Date.UTC(year, 4, 5)),    // Constitution Day (Grundlovsdag)
        new Date(Date.UTC(year, 11, 24)), // Christmas Eve
        new Date(Date.UTC(year, 11, 25)), // Christmas Day
        new Date(Date.UTC(year, 11, 26)), // 2nd Christmas Day
        new Date(Date.UTC(year, 11, 31)), // New Year's Eve

        // Movable holidays based on Easter
        new Date(easterSunday.getTime() - 3 * 24 * 60 * 60 * 1000), // Maundy Thursday
        new Date(easterSunday.getTime() - 2 * 24 * 60 * 60 * 1000), // Good Friday
        easterSunday,                                              // Easter Sunday
        new Date(easterSunday.getTime() + 1 * 24 * 60 * 60 * 1000), // Easter Monday
        new Date(easterSunday.getTime() + 39 * 24 * 60 * 60 * 1000), // Ascension Day
        new Date(easterSunday.getTime() + 49 * 24 * 60 * 60 * 1000), // Whit Sunday
        new Date(easterSunday.getTime() + 50 * 24 * 60 * 60 * 1000), // Whit Monday
    ];
    
    // Store Bededag (General Prayer Day) was on the 4th Friday after Easter. Abolished from 2024.
    // We include it for historical context.
    if (year < 2024) {
        const greatPrayerDay = new Date(easterSunday.getTime() + 26 * 24 * 60 * 60 * 1000);
        holidays.push(greatPrayerDay);
    }

    return holidays;
};

export const getPopularNumbers = (year: number): { main: Set<number>, star: Set<number> } => {
    const holidays = getDanishHolidays(year);
    
    const popularMain = new Set<number>();
    const popularStar = new Set<number>();

    // Add day and month parts from holidays
    holidays.forEach(date => {
        popularMain.add(date.getUTCDate());
        popularStar.add(date.getUTCMonth() + 1);
    });

    // Add all possible day-of-month numbers, as these are commonly played for birthdays
    for (let i = 1; i <= 31; i++) {
        popularMain.add(i);
    }
    
    // It's also common to play low numbers in general.
    for (let i = 1; i <= 9; i++) {
        popularMain.add(i);
    }

    return { main: popularMain, star: popularStar };
};
