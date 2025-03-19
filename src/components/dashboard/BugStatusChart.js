import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import Skeleton from "react-loading-skeleton";

export const BugStatusChart = ({ data, isLoading }) => {
    // Define consistent colors for bug statuses
    const COLORS = {
        "New": "#EF4444",       // Red for new bugs
        "In Progress": "#F59E0B", // Amber for in progress bugs
        "Resolved": "#3B82F6",   // Blue for resolved bugs
        "Closed": "#10B981"      // Green for closed bugs
    };

    // If loading, show skeleton
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Skeleton className="h-64 w-64 rounded-full" />
            </div>
        );
    }

    // If no data or empty data, show message
    if (!data || data.length === 0 || data.every(item => item.value === 0)) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No bug data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                >
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                        />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value, name) => [`${value} bugs`, name]}
                    separator=": "
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};