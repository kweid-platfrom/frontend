import React from 'react';
import "../../app/globals.css"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';

const BugStatusChart = ({ viewMode }) => {
    const bugStatusData = [
        { name: 'Open', value: 32, color: '#ff6b6b' },
        { name: 'In Progress', value: 18, color: '#feca57' },
        { name: 'Resolved', value: 27, color: '#48dbfb' },
        { name: 'Closed', value: 63, color: '#1dd1a1' },
    ];

    return (
        <ChartCard
            title="Bug Status Distribution"
            description="Current state of reported defects"
        >
            {viewMode === 'chart' ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={bugStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {bugStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="overflow-x-auto h-64">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bugStatusData.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: row.color }}></div>
                                            {row.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.value}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                        {(row.value / bugStatusData.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ChartCard>
    );
};

export default BugStatusChart;