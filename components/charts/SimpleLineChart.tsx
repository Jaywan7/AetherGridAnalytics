
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SimpleLineChartProps {
    data: any[];
    xAxisKey: string;
    lineKey: string;
    lineName: string;
    lineColor?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
    data,
    xAxisKey,
    lineKey,
    lineName,
    lineColor = '#58A6FF'
}) => {
    return (
        <div className="w-full h-80">
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis dataKey={xAxisKey} stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} name="Antal Trænings-trækninger" />
                    <YAxis stroke="#8B949E" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 0.1', 'dataMax + 0.1']} tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0D1117',
                            borderColor: '#30363D',
                            color: '#C9D1D9'
                        }}
                        cursor={{ stroke: '#58A6FF', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Line type="monotone" dataKey={lineKey} name={lineName} stroke={lineColor} strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4, fill: lineColor }}/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
