// components/stats/TestExecutionChart.js
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TestExecutionChart = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
            <defs>
                <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
            />
            <Area type="monotone" dataKey="passed" stackId="1" stroke="#10B981" fill="url(#passedGradient)" />
            <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="url(#failedGradient)" />
            <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="url(#pendingGradient)" />
        </AreaChart>
    </ResponsiveContainer>
);
