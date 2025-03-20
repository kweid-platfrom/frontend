import React from "react";
import { Card } from "@/components/ui/card";
import Skeleton  from "../ui/Skeleton";
import { Bug, ClipboardCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const KeyMetrics = ({ dashboardData, isLoading }) => {
    // Function to calculate key metrics from dashboard data
    const calculateMetrics = () => {
        const { bugStatusData, testResultsData, testCoverageData } = dashboardData;
        
        // Calculate total bugs
        const totalBugs = bugStatusData?.reduce((sum, item) => sum + item.value, 0) || 0;
        
        // Calculate open bugs (New + In Progress)
        const openBugs = bugStatusData?.reduce((sum, item) => {
            if (item.name === "New" || item.name === "In Progress") {
                return sum + item.value;
            }
            return sum;
        }, 0) || 0;
        
        // Calculate test pass rate
        let passRate = 0;
        if (testResultsData && testResultsData.length > 0) {
            const totalPassed = testResultsData.reduce((sum, item) => sum + item.passed, 0);
            const totalTests = testResultsData.reduce((sum, item) => sum + item.passed + item.failed, 0);
            passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
        }
        
        // Calculate average test coverage
        let avgCoverage = 0;
        if (testCoverageData && testCoverageData.length > 0) {
            avgCoverage = Math.round(
                testCoverageData.reduce((sum, item) => sum + item.coverage, 0) / testCoverageData.length
            );
        }
        
        return {
            totalBugs,
            openBugs,
            passRate,
            avgCoverage
        };
    };
    
    const metrics = calculateMetrics();
    
    // Array of metrics to display
    const metricsData = [
        {
            title: "Total Bugs",
            value: metrics.totalBugs,
            icon: <Bug className="w-6 h-6 text-red-500" />,
            color: "text-red-500",
            bgColor: "bg-red-100",
        },
        {
            title: "Open Bugs",
            value: metrics.openBugs,
            icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
            color: "text-amber-500",
            bgColor: "bg-amber-100",
        },
        {
            title: "Test Pass Rate",
            value: `${metrics.passRate}%`,
            icon: <CheckCircle className="w-6 h-6 text-green-500" />,
            color: "text-green-500",
            bgColor: "bg-green-100",
        },
        {
            title: "Avg Test Coverage",
            value: `${metrics.avgCoverage}%`,
            icon: <ClipboardCheck className="w-6 h-6 text-blue-500" />,
            color: "text-blue-500",
            bgColor: "bg-blue-100",
        },
    ];

    return (
        <>
            {metricsData.map((metric, index) => (
                <Card key={index} className="p-6 rounded border-0">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${metric.bgColor}`}>
                            {metric.icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20 mt-1" />
                            ) : (
                                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </>
    );
};