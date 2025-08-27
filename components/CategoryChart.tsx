
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CategoryData } from '../types';

interface CategoryChartProps {
    data: CategoryData[];
    totalDraws: number;
}

const COLORS = ['#1F6FEB', '#238636', '#9E4AD3', '#DB6D28', '#A27031', '#6A737D'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const { name, observed } = payload[0].payload;
        const percentage = ((observed / payload[0].payload.totalDraws) * 100).toFixed(2);
        return (
            <div className="p-2 bg-brand-bg border border-brand-border rounded-md text-sm">
                <p className="label">{`${name}`}</p>
                <p className="intro">{`Observed: ${observed} (${percentage}%)`}</p>
            </div>
        );
    }
    return null;
};


export const CategoryChart: React.FC<CategoryChartProps> = ({ data, totalDraws }) => {
    const chartData = data.map(item => ({...item, totalDraws}));
    
    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="observed"
                            nameKey="name"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "12px", marginTop: "10px"}}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-brand-text-secondary">
                        <thead className="text-xs text-brand-text-secondary uppercase bg-brand-bg">
                            <tr>
                                <th scope="col" className="px-4 py-2">Combination</th>
                                <th scope="col" className="px-4 py-2 text-right">Observed</th>
                                <th scope="col" className="px-4 py-2 text-right">Expected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.name} className="border-b border-brand-border">
                                    <th scope="row" className="px-4 py-2 font-medium text-brand-text-primary whitespace-nowrap flex items-center">
                                        <span className="w-3 h-3 mr-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                                        {item.name}
                                    </th>
                                    <td className="px-4 py-2 text-right">{((item.observed / totalDraws) * 100).toFixed(2)}%</td>
                                    <td className="px-4 py-2 text-right">{(item.theoretical * 100).toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
