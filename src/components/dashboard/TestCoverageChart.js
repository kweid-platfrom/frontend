import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SkeletonLoader from "../ui/Skeleton";

export const TestCoverageChart = () => {
    const [coverageData, setCoverageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCoverageData();
    }, []);

    const fetchCoverageData = async () => {
        setLoading(true);
        try {
            // Real API call to fetch test coverage data
            const response = await fetch('/api/test-coverage');
            
            if (response.ok) {
                const data = await response.json();
                setCoverageData(data);
            } else {
                console.error('Error fetching test coverage data:', response.statusText);
                setError('Failed to load coverage data');
                // Fallback to sample data if API fails
                setCoverageData([
                    { name: "Core", coverage: 85 },
                    { name: "Auth", coverage: 78 },
                    { name: "UI", coverage: 62 },
                    { name: "API", coverage: 91 },
                    { name: "Utils", coverage: 73 },
                ]);
            }
        } catch (error) {
            console.error('Error fetching test coverage data:', error);
            setError('Failed to load coverage data');
            // Fallback to sample data
            setCoverageData([
                { name: "Core", coverage: 85 },
                { name: "Auth", coverage: 78 },
                { name: "UI", coverage: 62 },
                { name: "API", coverage: 91 },
                { name: "Utils", coverage: 73 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <SkeletonLoader className="h-64 w-full rounded" />;
    }

    if (error) {
        return <div className="text-red-500 p-4 text-center">{error}</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverageData}>
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