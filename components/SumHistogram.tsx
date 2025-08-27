
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { SumData } from '../types';

interface SumHistogramProps {
    data: SumData[];
}

export const SumHistogram: React.FC<SumHistogramProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="sumRange" stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={50} />
                    <YAxis stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0D1117',
                            borderColor: '#30363D',
                            color: '#C9D1D9'
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                        labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="#238636" name="Draw Count" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
