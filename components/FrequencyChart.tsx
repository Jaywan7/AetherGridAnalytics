
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { FrequencyData } from '../types';

interface FrequencyChartProps {
    data: FrequencyData[];
}

export const FrequencyChart: React.FC<FrequencyChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="number" stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0D1117',
                            borderColor: '#30363D',
                            color: '#C9D1D9'
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Bar dataKey="observed" fill="#58A6FF" name="Observed" />
                    {data[0]?.expected !== undefined && (
                         <ReferenceLine y={data[0].expected} label={{ value: "Expected", position: 'insideTopRight', fill: '#8B949E', fontSize: 10 }} stroke="#C9D1D9" strokeDasharray="3 3" />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
