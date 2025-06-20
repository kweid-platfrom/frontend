// components/stats/AutomationProgressChart.js
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AutomationProgressChart = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="period" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                }}
            />
            <Line
                type="monotone"
                dataKey="manual"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
            />
            <Line
                type="monotone"
                dataKey="automated"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
            />
        </LineChart>
    </ResponsiveContainer>
);