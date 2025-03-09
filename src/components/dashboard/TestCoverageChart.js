import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const TestCoverageChart = () => {
    const data = [
        { name: "Core", coverage: 85 },
        { name: "Auth", coverage: 78 },
        { name: "UI", coverage: 62 },
        { name: "API", coverage: 91 },
        { name: "Utils", coverage: 73 },
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="coverage" fill="#3B82F6" />
            </BarChart>
        </ResponsiveContainer>
    );
};