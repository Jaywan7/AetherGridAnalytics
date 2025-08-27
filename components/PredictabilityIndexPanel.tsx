
import React from 'react';
import type { PerformanceLogItem } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { SeismographIcon } from './icons/SeismographIcon';
import { SimpleLineChart } from './charts/SimpleLineChart';

interface PredictabilityIndexPanelProps {
    performanceLog: PerformanceLogItem[];
}

const calculateRollingAverage = (data: { name: number, value: number }[], windowSize: number): { name: number, value: number }[] => {
    const result: { name: number, value: number }[] = [];
    if (!data || data.length === 0) return result;

    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const windowSlice = data.slice(start, i + 1);
        const windowValues = windowSlice.map(d => d.value);
        const avg = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
        result.push({ name: data[i].name, value: avg });
    }
    return result;
};

export const PredictabilityIndexPanel: React.FC<PredictabilityIndexPanelProps> = ({ performanceLog }) => {
    if (performanceLog.length < 20) {
        return null;
    }

    const chartData = performanceLog.map(log => ({
        name: log.drawNumber, // Use drawNumber for the x-axis label
        value: log.averageWinnerRank || 0
    })).filter(d => d.value > 0);
    
    // Invert the score for charting: a low rank is good (high predictability)
    const invertedChartData = chartData.map(d => ({...d, value: 51 - d.value}));

    const rollingAvgData = calculateRollingAverage(invertedChartData, 20); // Use a 20-draw rolling average for smoother trend
    
    const lineChartData = rollingAvgData.map(d => ({
        name: d.name,
        'Forudsigelighed': d.value
    }));

    const currentPredictability = rollingAvgData.length > 0 ? rollingAvgData[rollingAvgData.length - 1].value : 0;

    let sentiment: 'Forudsigelig' | 'Neutral' | 'Kaotisk';
    let color: string;
    let description: string;

    if (currentPredictability > 35) { // (51 - 16 = 35) -> avg rank < 16
        sentiment = 'Forudsigelig';
        color = 'text-green-400';
        description = 'Spillet følger forventede mønstre. Prognoser er mere pålidelige.';
    } else if (currentPredictability < 26) { // (51-25 = 26) -> avg rank > 25
        sentiment = 'Kaotisk';
        color = 'text-red-400';
        description = 'Spillet er uforudsigeligt med mange overraskelser. Vær forsigtig med prognoser.';
    } else {
        sentiment = 'Neutral';
        color = 'text-yellow-400';
        description = 'Spillet viser en blanding af forventede og uventede resultater.';
    }


    return (
        <PatternCard
            title="Forudsigelighedsindeks (Markedssentiment)"
            description="Måler hvor 'overraskende' de seneste trækninger har været. En høj score indikerer, at vindertallene var dem, modellen forventede (lav gennemsnitlig rang), mens en lav score indikerer et kaotisk og uforudsigeligt marked."
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <SimpleLineChart
                        data={lineChartData}
                        xAxisKey="name"
                        lineKey="Forudsigelighed"
                        lineName="Rullende Gns. Forudsigelighed"
                        lineColor="#9E4AD3"
                    />
                </div>
                <div className="flex flex-col items-center justify-center bg-brand-bg p-6 rounded-lg border border-brand-border">
                    <div className="relative">
                        <SeismographIcon className={`w-16 h-16 ${color}`} />
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-sm text-brand-text-secondary">Nuværende Sentiment</p>
                        <p className={`text-3xl font-bold ${color} mt-1`}>{sentiment}</p>
                        <p className="text-xs text-brand-text-secondary mt-2">{description}</p>
                    </div>
                </div>
            </div>
        </PatternCard>
    );
};
