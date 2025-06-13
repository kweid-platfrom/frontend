// components/stats/BugTrendsChart.js
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const BugTrendsChart = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                }}
            />
            <Bar dataKey="critical" stackId="a" fill="#DC2626" radius={[0, 0, 0, 0]} />
            <Bar dataKey="high" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="medium" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="low" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);