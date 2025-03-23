import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SkeletonLoader from "../ui/Skeleton";

export const TestCoverageChart = ({ data, isLoading }) => {
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
                No test coverage data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="coverage" fill="#3B82F6" name="Test Coverage %" />
            </BarChart>
        </ResponsiveContainer>
    );
};