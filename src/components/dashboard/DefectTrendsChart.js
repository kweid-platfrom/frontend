import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "../../app/globals.css"
import ChartCard from './ChartCard';

const DefectTrendsChart = ({ viewMode }) => {
    const defectTrendData = [
        { name: 'Jan', Critical: 12, Major: 18, Minor: 24, total: 54 },
        { name: 'Feb', Critical: 9, Major: 16, Minor: 22, total: 47 },
        { name: 'Mar', Critical: 11, Major: 20, Minor: 18, total: 49 },
        { name: 'Apr', Critical: 8, Major: 17, Minor: 15, total: 40 },
        { name: 'May', Critical: 7, Major: 15, Minor: 13, total: 35 },
        { name: 'Jun', Critical: 5, Major: 12, Minor: 10, total: 27 },
    ];

    return (
        <ChartCard
            title="Defect Trends"
            description="6-month trend of reported issues by severity"
            className="lg:col-span-2"
        >
            {viewMode === 'chart' ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={defectTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Critical" stroke="#ff6b6b" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Major" stroke="#feca57" />
                            <Line type="monotone" dataKey="Minor" stroke="#54a0ff" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="overflow-x-auto h-64">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minor</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {defectTrendData.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{row.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.Critical}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.Major}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.Minor}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ChartCard>
    );
};

export default DefectTrendsChart;