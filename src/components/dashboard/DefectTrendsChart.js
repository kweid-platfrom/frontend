import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const DefectTrendsChart = () => {
    const data = [
        { name: "Jan", open: 12, closed: 8 },
        { name: "Feb", open: 19, closed: 14 },
        { name: "Mar", open: 15, closed: 18 },
        { name: "Apr", open: 22, closed: 16 },
        { name: "May", open: 18, closed: 21 },
        { name: "Jun", open: 24, closed: 28 },
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="open" stroke="#EF4444" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="closed" stroke="#10B981" />
            </LineChart>
        </ResponsiveContainer>
    );
};