
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { SimpleBarChartData } from '../../types';

interface SimpleBarChartProps {
    data: SimpleBarChartData[];
    barColor?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, barColor = '#8884d8' }) => {
    return (
        <div className="w-full h-56">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} />
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
                    <Bar dataKey="value" fill={barColor} name="Count" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
