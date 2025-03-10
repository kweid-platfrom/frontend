"use client"
import React, { useState } from "react";
import "../app/globals.css";
import {
    ChartCard,
    BugStatusChart,
    DefectTrendsChart,
    TestCoverageChart,
    ViewToggle,
} from "../components/dashboard";
import TestResultChart from "../components/dashboard/TestResultsChart";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import { Sidebar } from "../components/layout";
import Header from "../components/layout/header";
// import { BarChart2, Bug, Code, Activity } from "lucide-react";
import { KeyMetrics } from "../components/dashboard/KeyMetrics";
import BugReportForm from "../components/BugReportForm";

const Dashboard = () => {
    const [showBugForm, setShowBugForm] = useState(false);
    const [timeframeView, setTimeframeView] = useState({ value: "weekly", label: "Weekly" });

    const viewOptions = [
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" }
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-grow overflow-auto">
            <Header setShowBugForm={setShowBugForm} />
                <main className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Testing Dashboard</h1>

                        <div className="flex items-center space-x-4">
                            <ViewToggle
                                options={viewOptions}
                                defaultOption={viewOptions[0]}
                                onChange={setTimeframeView}
                            />
                        </div>
                    </div>

                    {/* Key Metrics Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KeyMetrics />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <ChartCard title={`Bug Status (${timeframeView.label})`}>
                                    <BugStatusChart />
                                </ChartCard>
                                <ChartCard title="Test Coverage by Module">
                                    <TestCoverageChart />
                                </ChartCard>

                            </div>
                            <ChartCard title={`Defect Trends (${timeframeView.label})`}>
                                <DefectTrendsChart />
                            </ChartCard>
                            <ChartCard title={`Test Results (${timeframeView.label})`}>
                                <TestResultChart timeframe={timeframeView.value} />
                            </ChartCard>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow p-6 h-full">
                                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                                <ActivityFeed />
                            </div>
                        </div>
                    </div>
    
                        {showBugForm && <BugReportForm onClose={() => setShowBugForm(false)} />}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
