
import React, { useState, useMemo } from 'react';
import type { SeasonalAnalysis } from '../types';
import { PatternCard } from './patterns/PatternCard';
import { MAIN_NUMBER_MAX } from '../constants';
import { TrophyIcon } from './icons/TrophyIcon';

interface SeasonalInsightsProps {
    seasonalAnalysis: SeasonalAnalysis;
}

const Heatmap: React.FC<{ data: { [key: string]: { number: number; count: number }[] }, periods: string[] }> = ({ data, periods }) => {
    const maxCount = useMemo(() => {
        let max = 0;
        Object.values(data).forEach(periodData => {
            if (periodData.length > 0 && periodData[0].count > max) {
                max = periodData[0].count;
            }
        });
        return max > 0 ? max : 1;
    }, [data]);

    const getColor = (count: number) => {
        const intensity = Math.min(1, count / maxCount);
        if (intensity < 0.1) return 'bg-brand-surface';
        // HSL: hue from blue (240) to red (0)
        const hue = 240 - (intensity * 240);
        return `hsl(${hue}, 70%, 50%)`;
    };

    const periodDataMaps = useMemo(() => {
        const maps: { [key: string]: Map<number, number> } = {};
        periods.forEach(p => {
            maps[p] = new Map(data[p]?.map(item => [item.number, item.count]) || []);
        });
        return maps;
    }, [data, periods]);

    return (
        <div className="overflow-x-auto">
            <div className="flex text-xs font-bold text-center text-brand-text-secondary" style={{ minWidth: '600px' }}>
                <div className="w-10 sticky left-0 bg-brand-surface z-10"></div>
                {periods.map(p => <div key={p} className="flex-1">{p}</div>)}
            </div>
            <div className="relative" style={{ minWidth: '600px' }}>
                {Array.from({ length: MAIN_NUMBER_MAX }, (_, i) => i + 1).map(num => (
                    <div key={num} className="flex items-center text-xs">
                        <div className="w-10 sticky left-0 bg-brand-surface z-10 text-center font-mono text-brand-text-primary py-0.5">{num}</div>
                        {periods.map(p => {
                            const count = periodDataMaps[p].get(num) || 0;
                            const bgColor = getColor(count);
                            return (
                                <div key={`${p}-${num}`} className="flex-1 group relative h-5">
                                    <div className="w-full h-full" style={{ backgroundColor: bgColor }}></div>
                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-brand-bg border border-brand-border rounded-md text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-20">
                                        {p} - Tal {num}: {count.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TopPerformers: React.FC<{ data: { number: number; count: number }[]; period: string; type: 'Måned' | 'Kvartal' }> = ({ data, period, type }) => {
    if (data.length === 0) {
        return (
             <div className="text-center">
                <h4 className="text-md font-semibold text-brand-text-primary">Top Performers for {period}</h4>
                <p className="text-sm text-brand-text-secondary mt-2">Ingen data for denne periode.</p>
            </div>
        );
    }
    
    return (
        <div>
            <h4 className="text-md font-semibold text-brand-text-primary text-center">Top Performers for {period}</h4>
            <p className="text-xs text-brand-text-secondary text-center mb-4">(Stærkeste tal i dette {type.toLowerCase()})</p>
            <ul className="space-y-3">
                {data.map((item, index) => (
                    <li key={item.number} className="flex items-center gap-3">
                         <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-yellow-400/20' : 'bg-brand-bg'}`}>
                            {index === 0 
                                ? <TrophyIcon className="w-5 h-5 text-yellow-400" /> 
                                : <span className="text-xs font-semibold text-brand-text-secondary">#{index + 1}</span>
                            }
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-brand-bg font-mono font-bold text-sm">
                            {item.number}
                        </div>
                        <div className="text-sm text-brand-text-secondary">
                           Vægtet score: <span className="font-semibold text-brand-text-primary font-mono">{item.count.toFixed(2)}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const SeasonalInsights: React.FC<SeasonalInsightsProps> = ({ seasonalAnalysis }) => {
    const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const quarterNames = ["Q1", "Q2", "Q3", "Q4"];
    
    const currentMonthName = monthNames[new Date().getUTCMonth()];
    const currentQuarterName = `Q${Math.floor(new Date().getUTCMonth() / 3) + 1}`;
    const topMonthly = seasonalAnalysis.monthly[currentMonthName]?.slice(0, 5) || [];
    const topQuarterly = seasonalAnalysis.quarterly[currentQuarterName]?.slice(0, 5) || [];

    return (
        <PatternCard title="Sæsonbestemt Analyse (Recency-Vægtet)" description="Visualiserer hvornår bestemte tal historisk har været 'varme' eller 'kolde' i løbet af året.">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <div className="flex justify-center gap-2 mb-4">
                        <button
                            onClick={() => setView('monthly')}
                            className={`px-3 py-1 text-sm rounded-md ${view === 'monthly' ? 'bg-brand-primary text-brand-bg font-semibold' : 'bg-brand-bg hover:bg-brand-border'}`}
                        >
                            Månedlig
                        </button>
                        <button
                             onClick={() => setView('quarterly')}
                             className={`px-3 py-1 text-sm rounded-md ${view === 'quarterly' ? 'bg-brand-primary text-brand-bg font-semibold' : 'bg-brand-bg hover:bg-brand-border'}`}
                        >
                            Kvartalsvis
                        </button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto border border-brand-border rounded-md">
                        {view === 'monthly' ? (
                            <Heatmap data={seasonalAnalysis.monthly} periods={monthNames} />
                        ) : (
                            <Heatmap data={seasonalAnalysis.quarterly} periods={quarterNames} />
                        )}
                    </div>
                     <div className="text-xs text-brand-text-secondary mt-2 flex items-center justify-center gap-4">
                        <span>Kold</span>
                        <div className="flex h-3 w-24 rounded-md overflow-hidden">
                            <div className="w-1/2" style={{ background: 'linear-gradient(to right, hsl(240, 70%, 50%), hsl(120, 70%, 50%))' }}></div>
                            <div className="w-1/2" style={{ background: 'linear-gradient(to right, hsl(120, 70%, 50%), hsl(0, 70%, 50%))' }}></div>
                        </div>
                        <span>Varm</span>
                    </div>
                </div>
                 <div className="lg:w-1/3 lg:border-l lg:pl-6 border-brand-border">
                    {view === 'monthly' ? (
                        <TopPerformers data={topMonthly} period={currentMonthName} type="Måned" />
                    ) : (
                        <TopPerformers data={topQuarterly} period={currentQuarterName} type="Kvartal" />
                    )}
                </div>
            </div>
        </PatternCard>
    );
};
