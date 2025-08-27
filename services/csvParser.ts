
import type { Draw } from '../types';
import {
    MAIN_NUMBER_COUNT,
    MAIN_NUMBER_MIN,
    MAIN_NUMBER_MAX,
    STAR_NUMBER_COUNT,
    STAR_NUMBER_MIN,
    STAR_NUMBER_MAX,
} from '../constants';

const validateRow = (mainNumbers: number[], starNumbers: number[]): boolean => {
    // Check main numbers
    if (mainNumbers.length !== MAIN_NUMBER_COUNT) return false;
    if (new Set(mainNumbers).size !== MAIN_NUMBER_COUNT) return false; // Check for uniqueness
    for (const num of mainNumbers) {
        if (!Number.isInteger(num) || num < MAIN_NUMBER_MIN || num > MAIN_NUMBER_MAX) {
            return false;
        }
    }

    // Check star numbers
    if (starNumbers.length !== STAR_NUMBER_COUNT) return false;
    if (new Set(starNumbers).size !== STAR_NUMBER_COUNT) return false; // Check for uniqueness
    for (const num of starNumbers) {
        if (!Number.isInteger(num) || num < STAR_NUMBER_MIN || num > STAR_NUMBER_MAX) {
            return false;
        }
    }

    return true;
};


export const parseCSV = (csvText: string): { draws: Draw[], validRows: number, totalRows: number } => {
    const lines = csvText.trim().split('\n');
    const header = lines.shift()?.trim().toLowerCase();

    if (!header || !header.includes('drawdate')) {
        throw new Error("Invalid CSV header. Expected 'DrawDate' column.");
    }

    const draws: Draw[] = [];
    const totalRows = lines.length;
    let validRows = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        const values = line.split(',').map(v => v.trim());
        const expectedColumnCount = 1 + MAIN_NUMBER_COUNT + STAR_NUMBER_COUNT;
        
        if (values.length < expectedColumnCount) {
            continue;
        }

        try {
            const drawDate = values[0];
            const numbers = values.slice(1).map(Number);
            
            if (numbers.some(isNaN)) {
                continue;
            }

            const mainNumbers = numbers.slice(0, MAIN_NUMBER_COUNT);
            const starNumbers = numbers.slice(MAIN_NUMBER_COUNT, MAIN_NUMBER_COUNT + STAR_NUMBER_COUNT);

            if (validateRow(mainNumbers, starNumbers)) {
                draws.push({
                    drawDate,
                    mainNumbers,
                    starNumbers,
                });
                validRows++;
            }
        } catch (e) {
            // Silently ignore rows that cause parsing errors
        }
    }

    return { draws, validRows, totalRows };
};
