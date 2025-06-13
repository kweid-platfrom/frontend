import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SkeletonLoader from "../ui/Skeleton";

export const DefectTrendsChart = ({ data, isLoading }) => {
    // If loading, show skeleton
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <SkeletonLoader className="h-64 w-full rounded" />
            </div>
        );
    }

    // If no data or empty data, show message
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No defect trends data available
            </div>
        );
    }

    // Transform the data to the format expected by the chart
    const chartData = data.map(item => ({
        name: item.date,
        defects: item.count || 0
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} defects`, "Reported"]} />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="defects" 
                    stroke="#EF4444" 
                    activeDot={{ r: 8 }} 
                    name="Reported Defects"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};