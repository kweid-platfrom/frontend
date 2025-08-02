// components/stats/AutomationProgressChart.js
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AutomationProgressChart = ({ data, height = 300 }) => (
    <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
            <CartesianGrid stroke="rgb(var(--color-muted)/0.5)" strokeDasharray="3 3" />
            <XAxis dataKey="period" stroke="rgb(var(--color-muted-foreground))" fontSize={12} />
            <YAxis stroke="rgb(var(--color-muted-foreground))" fontSize={12} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'rgb(var(--color-card))',
                    border: '1px solid rgb(var(--color-border))',
                    borderRadius: '8px',
                    color: 'rgb(var(--color-foreground))'
                }}
            />
            <Line
                type="monotone"
                dataKey="manual"
                stroke="rgb(var(--color-error))"
                strokeWidth={3}
                dot={{ fill: 'rgb(var(--color-error))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'rgb(var(--color-error))', strokeWidth: 2 }}
            />
            <Line
                type="monotone"
                dataKey="automated"
                stroke="rgb(var(--color-success))"
                strokeWidth={3}
                dot={{ fill: 'rgb(var(--color-success))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'rgb(var(--color-success))', strokeWidth: 2 }}
            />
        </LineChart>
    </ResponsiveContainer>
);