
import type { Draw, AntiPopularityAnalysis, BiasAnalysis } from '../types';

const getAverage = (arr: number[]): number => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const countNumbersInDraws = (draws: Draw[], condition: (num: number) => boolean): number => {
    return draws.reduce((count, draw) => {
        return count + draw.mainNumbers.filter(condition).length;
    }, 0);
};

export const analyzeAntiPopularity = (draws: Draw[]): AntiPopularityAnalysis => {
    const totalDraws = draws.length;
    if (totalDraws < 50) {
        return { humanBiasAnalysis: [], combinationBiasAnalysis: [] };
    }
    const totalNumbersDrawn = totalDraws * 5;

    // --- 2.1 Reverse-Engineering Human Bias ---
    const humanBiasAnalysis: BiasAnalysis[] = [];

    // Birthday Coefficient
    const birthdayNumbersCount = countNumbersInDraws(draws, num => num >= 1 && num <= 31);
    const birthdayObserved = (birthdayNumbersCount / totalNumbersDrawn) * 100;
    const birthdayExpected = (31 / 50) * 100;
    humanBiasAnalysis.push({
        name: 'Fødselsdags-koefficient (Tal 1-31)',
        observed: birthdayObserved,
        expected: birthdayExpected,
        conclusion: birthdayObserved < birthdayExpected
            ? `Tal inden for fødselsdags-intervallet (1-31) er underrepræsenterede, hvilket tyder på, at kuponer, der undgår disse, kan give en fordel.`
            : `Tal inden for fødselsdags-intervallet (1-31) er overrepræsenterede, hvilket går imod den forventede popularitets-bias.`,
        unit: '%',
    });

    // Lucky Number Bias (7, 11, 21)
    const luckyNumbers = new Set([7, 11, 21]);
    const luckyNumbersCount = countNumbersInDraws(draws, num => luckyNumbers.has(num));
    const luckyObserved = (luckyNumbersCount / totalNumbersDrawn) * 100;
    const luckyExpected = (luckyNumbers.size / 50) * 100;
     humanBiasAnalysis.push({
        name: '"Lykketal"-bias (7, 11, 21)',
        observed: luckyObserved,
        expected: luckyExpected,
        conclusion: luckyObserved < luckyExpected
            ? `"Lykketal" er trukket sjældnere end forventet, hvilket indikerer, at det kan være en fordel at undgå dem.`
            : `"Lykketal" klarer sig bedre end forventet, på trods af deres popularitet.`,
        unit: '%',
    });

    // Round Number Effect (10, 20, 30, 40, 50)
    const roundNumbers = new Set([10, 20, 30, 40, 50]);
    const roundNumbersCount = countNumbersInDraws(draws, num => roundNumbers.has(num));
    const roundObserved = (roundNumbersCount / totalNumbersDrawn) * 100;
    const roundExpected = (roundNumbers.size / 50) * 100;
     humanBiasAnalysis.push({
        name: 'Runde tal-effekt (10, 20..)',
        observed: roundObserved,
        expected: roundExpected,
        conclusion: roundObserved < roundExpected
            ? `Runde tal er underrepræsenterede, hvilket stemmer overens med en bias mod at vælge dem.`
            : `Runde tal er overrepræsenterede, hvilket er en uventet tendens.`,
        unit: '%',
    });

    // High Number Advantage (32-50)
    const highNumbersCount = countNumbersInDraws(draws, num => num >= 32 && num <= 50);
    const highObserved = (highNumbersCount / totalNumbersDrawn) * 100;
    const highExpected = (19 / 50) * 100; // 19 numbers from 32 to 50
     humanBiasAnalysis.push({
        name: 'Høje tal-fordel (32-50)',
        observed: highObserved,
        expected: highExpected,
        conclusion: highObserved > highExpected
            ? `Høje tal (uden for fødselsdags-intervallet) er overrepræsenterede, hvilket bekræfter, at spil på disse tal historisk har været en fordel.`
            : `Høje tal er underrepræsenterede, hvilket går imod teorien om, at de skulle have en fordel.`,
        unit: '%',
    });


    // --- 2.2 Combination Popularity ---
    const combinationBiasAnalysis: BiasAnalysis[] = [];

    // Sum-bias detection
    const sums = draws.map(d => d.mainNumbers.reduce((a, b) => a + b, 0));
    const observedAvgSum = getAverage(sums);
    const expectedAvgSum = 127.5; // (1+50)/2 * 5
    combinationBiasAnalysis.push({
        name: 'Gennemsnitlig Sum',
        observed: observedAvgSum,
        expected: expectedAvgSum,
        conclusion: observedAvgSum > expectedAvgSum
            ? `Den gennemsnitlige sum af vindertal er højere end teoretisk forventet. Dette understøtter tesen om, at kombinationer med højere sum vinder oftere.`
            : `Den gennemsnitlige sum er lavere end forventet, hvilket kan tyde på, at populære (lave) kombinationer vinder oftere end antaget.`,
        unit: 'avg',
    });

    // Spread-bias detection
    const spreads = draws.map(d => Math.max(...d.mainNumbers) - Math.min(...d.mainNumbers));
    const observedAvgSpread = getAverage(spreads);
    const expectedAvgSpread = 33.67; // Approx. theoretical average
    combinationBiasAnalysis.push({
        name: 'Gennemsnitlig Spredning',
        observed: observedAvgSpread,
        expected: expectedAvgSpread,
        conclusion: observedAvgSpread > expectedAvgSpread
            ? `Vinderkuponer har i gennemsnit en større spredning end forventet, hvilket indikerer at "pæne", tætliggende kombinationer er mindre succesfulde.`
            : `Vinderkuponer har en mindre spredning end forventet, hvilket udfordrer ideen om, at man skal sprede sine tal meget.`,
        unit: 'avg',
    });
    
    // Consecutive-fordel
    let consecutiveDraws = 0;
    draws.forEach(d => {
        const sorted = [...d.mainNumbers].sort((a,b) => a-b);
        for(let i=0; i < sorted.length - 1; i++) {
            if(sorted[i+1] === sorted[i] + 1) {
                consecutiveDraws++;
                break;
            }
        }
    });
    const consecutiveObserved = (consecutiveDraws / totalDraws) * 100;
    const consecutiveExpected = 40.0;
    combinationBiasAnalysis.push({
        name: 'Trækninger med Nabotal',
        observed: consecutiveObserved,
        expected: consecutiveExpected,
        conclusion: consecutiveObserved > consecutiveExpected
            ? `"Grimme" kombinationer med nabotal vinder oftere end teoretisk forventet. At inkludere dem er en stærk anti-popularitets-strategi.`
            : `Kombinationer med nabotal vinder sjældnere end forventet.`,
        unit: '%',
    });


    return { humanBiasAnalysis, combinationBiasAnalysis };
};
