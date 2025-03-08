import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import "../../app/globals.css";
import ChartCard from './ChartCard';

const TestCoverageChart = ({ viewMode }) => {
    const testCoverageData = [
        { name: 'User Auth', coverage: 92 },
        { name: 'Dashboard', coverage: 78 },
        { name: 'Reports', coverage: 85 },
        { name: 'Test Mgmt', coverage: 91 },
        { name: 'Defect Tracking', coverage: 87 },
        { name: 'Integrations', coverage: 72 },
    ];

    return (
        <ChartCard
            title="Test Coverage by Module"
            description="Percentage of code covered by automated tests"
            className="lg:col-span-2"
        >
            {viewMode === 'chart' ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={testCoverageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="coverage" fill="#54a0ff">
                                {testCoverageData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.coverage > 90 ? '#1dd1a1' : entry.coverage > 80 ? '#54a0ff' : entry.coverage > 70 ? '#feca57' : '#ff6b6b'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="overflow-x-auto h-64">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage %</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {testCoverageData.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{row.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.coverage}%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs">
                                        <Badge className={`text-xs ${row.coverage > 90 ? 'bg-green-100 text-green-800' :
                                                row.coverage > 80 ? 'bg-blue-100 text-blue-800' :
                                                    row.coverage > 70 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {row.coverage > 90 ? 'Excellent' :
                                                row.coverage > 80 ? 'Good' :
                                                    row.coverage > 70 ? 'Fair' :
                                                        'Needs Improvement'}
                                        </Badge>
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

export default TestCoverageChart;