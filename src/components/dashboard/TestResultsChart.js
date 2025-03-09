import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TestResultChart = () => {
    const data = [
        { date: "3/1", passed: 242, failed: 14 },
        { date: "3/2", passed: 251, failed: 11 },
        { date: "3/3", passed: 248, failed: 15 },
        { date: "3/4", passed: 255, failed: 9 },
        { date: "3/5", passed: 260, failed: 8 },
        { date: "3/6", passed: 258, failed: 10 },
        { date: "3/7", passed: 263, failed: 7 },
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="passed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default TestResultChart;