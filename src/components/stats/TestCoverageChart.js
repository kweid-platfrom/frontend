// components/stats/TestCoverageChart.js
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const TestCoverageChart = ({ data, height = 300 }) => (
    <div>
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`${value}%`, 'Coverage']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center space-x-4 mt-4">
            {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
                </div>
            ))}
        </div>
    </div>
);
