import React from 'react';
import "../../app/globals.css";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from './ChartCard';

const BugStatusChart = ({ viewMode }) => {
    const bugStatusData = [
        { name: 'Open', value: 32, color: '#ff6b6b' },
        { name: 'In Progress', value: 18, color: '#feca57' },
        { name: 'Resolved', value: 27, color: '#48dbfb' },
        { name: 'Closed', value: 63, color: '#1dd1a1' },
    ];

    const totalBugs = bugStatusData.reduce((sum, item) => sum + item.value, 0);

    return (
        <ChartCard title="Bug Status Distribution" description="Current state of reported defects">
            {viewMode === 'chart' ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={bugStatusData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
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
                    <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase">Count</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase">%</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bugStatusData.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 whitespace-nowrap flex items-center font-medium text-gray-900">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: row.color }}></span>
                                        {row.name}
                                    </td>
                                    <td className="px-4 py-2 text-gray-700">{row.value}</td>
                                    <td className="px-4 py-2 text-gray-700">{((row.value / totalBugs) * 100).toFixed(1)}%</td>
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
