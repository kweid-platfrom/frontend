import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SkeletonLoader from "../ui/Skeleton";

const TestResultChart = () => {
    const [resultData, setResultData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('week'); // Options: 'week', 'month', 'quarter'

    useEffect(() => {
        fetchTestResultData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange]);

    const fetchTestResultData = async () => {
        setLoading(true);
        try {
            // Real API call to fetch test result data with time range parameter
            const response = await fetch(`/api/test-results?range=${timeRange}`);
            
            if (response.ok) {
                const data = await response.json();
                setResultData(data);
            } else {
                console.error('Error fetching test result data:', response.statusText);
                setError('Failed to load test result data');
                // Fallback to sample data if API fails
                setResultData([
                    { date: "3/1", passed: 242, failed: 14 },
                    { date: "3/2", passed: 251, failed: 11 },
                    { date: "3/3", passed: 248, failed: 15 },
                    { date: "3/4", passed: 255, failed: 9 },
                    { date: "3/5", passed: 260, failed: 8 },
                    { date: "3/6", passed: 258, failed: 10 },
                    { date: "3/7", passed: 263, failed: 7 },
                ]);
            }
        } catch (error) {
            console.error('Error fetching test result data:', error);
            setError('Failed to load test result data');
            // Fallback to sample data
            setResultData([
                { date: "3/1", passed: 242, failed: 14 },
                { date: "3/2", passed: 251, failed: 11 },
                { date: "3/3", passed: 248, failed: 15 },
                { date: "3/4", passed: 255, failed: 9 },
                { date: "3/5", passed: 260, failed: 8 },
                { date: "3/6", passed: 258, failed: 10 },
                { date: "3/7", passed: 263, failed: 7 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    if (loading) {
        return <SkeletonLoader className="h-64 w-full rounded" />;
    }

    if (error) {
        return <div className="text-red-500 p-4 text-center">{error}</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${timeRange === 'week' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'} 
                        border border-gray-200 rounded-l-lg`}
                        onClick={() => handleTimeRangeChange('week')}
                    >
                        Week
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${timeRange === 'month' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'} 
                        border-t border-b border-r border-gray-200`}
                        onClick={() => handleTimeRangeChange('month')}
                    >
                        Month
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium ${timeRange === 'quarter' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'} 
                        border-t border-b border-r border-gray-200 rounded-r-lg`}
                        onClick={() => handleTimeRangeChange('quarter')}
                    >
                        Quarter
                    </button>
                </div>
            </div>
            
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resultData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                            formatter={(value, name) => [
                                `${value} tests`,
                                name === 'passed' ? 'Passed' : 'Failed'
                            ]}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="passed" 
                            stackId="1" 
                            stroke="#10B981" 
                            fill="#10B981" 
                            fillOpacity={0.6} 
                            name="Passed"
                        />
                        <Area 
                            type="monotone" 
                            dataKey="failed" 
                            stackId="1" 
                            stroke="#EF4444" 
                            fill="#EF4444" 
                            fillOpacity={0.6} 
                            name="Failed"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TestResultChart;