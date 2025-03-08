import React from 'react';
import KeyMetrics from '../components/dashboard/KeyMetrics';
import { Sidebar } from '../components/layout/sidebar';
import Header from "../components/layout/header";
import MetricCard from '../components/dashboard/MetricCard';
import ChartCard from '../components/dashboard/ChartCard';
import BugStatusChart from '../components/dashboard/BugStatusChart';
import DefectTrendsChart from '../components/dashboard/DefectTrendsChart';
import TestCoverageChart from '../components/dashboard/TestCoverageChart';
import TestResultChart from '../components/dashboard/TestResultsChart';
import ViewToggle from '../components/common/ViewToggle';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
// import AiInsights from '@/components/dashboard/AiInsights';

const Dashboard = () => {
    return (
        <div className="flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-grow p-6 space-y-6">
                {/* Header */}
                <Header />
                {/* <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1> */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1>
                    <ViewToggle />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KeyMetrics />
                    <MetricCard title="Active Tests" value="120" />
                    <MetricCard title="Resolved Bugs" value="87%" />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Bug Status">
                        <BugStatusChart />
                    </ChartCard>
                    <ChartCard title="Defect Trends">
                        <DefectTrendsChart />
                    </ChartCard>
                    <ChartCard title="Test Coverage">
                        <TestCoverageChart />
                    </ChartCard>
                </div>

                {/* Test Results & Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ChartCard title="Test Results">
                            <TestResultChart />
                        </ChartCard>
                    </div>
                    <div>
                        <ActivityFeed />
                    </div>
                </div>

                {/* AI Insights */}
                {/* <div>
                    <AiInsights />
                </div> */}
            </div>
        </div>
    );
};

export default Dashboard;
