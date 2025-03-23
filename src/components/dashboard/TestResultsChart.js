import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SkeletonLoader from "../ui/Skeleton";

const TestResultChart = ({ data, isLoading }) => {
    // If loading, show skeleton
    if (isLoading) {
        return <SkeletonLoader className="h-64 w-full rounded" />;
    }

    // If no data or empty data, show message
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No test results data available
            </div>
        );
    }

    return (
        <div className="flex-grow">
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                        formatter={(value, name) => [
                            `${value} tests`,
                            name === 'passed' ? 'Passed' : name === 'failed' ? 'Failed' : 'Skipped'
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
                    <Area 
                        type="monotone" 
                        dataKey="skipped" 
                        stackId="1" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.6} 
                        name="Skipped"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TestResultChart;