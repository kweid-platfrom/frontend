import React from "react";
import { Sidebar } from "../components/layout";
import Header from "../components/layout";
import {
    KeyMetrics,
    BugStatusChart,
    DefectTrendsChart,
    TestCoverageChart,
    TestResultChart,
    ActivityFeed,
} from "../components/dashboard";

const Dashboard = () => {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow p-6 space-y-6">
                <Header />
                <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1>

                {/* Key Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KeyMetrics />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <BugStatusChart />
                        <DefectTrendsChart />
                        <TestCoverageChart />
                        <TestResultChart />
                    </div>
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
