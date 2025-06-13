/* eslint-disable @typescript-eslint/no-unused-vars */
// components/pages/Dashboard.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import {
    Activity, CheckCircle, AlertTriangle, TestTube, Clock, Cpu,
    Bug, PlayCircle, FileText, Camera, Users, Target, Zap,
    TrendingUp, BarChart3, PieChart, LineChart
} from 'lucide-react';

// Import modular stats components
import {
    MetricCard,
    StatusBadge,
    ChartContainer,
    TestExecutionChart,
    TestCoverageChart,
    BugTrendsChart,
    AutomationProgressChart,
    QuickActionButton,
    RealTimeIndicator,
    AlertCard,
    TestExecutionSummary,
    PerformanceMetrics,
    TeamProductivity
} from '../stats';

// Mock data service - replace with real API calls
const mockDataService = {
    getRealTimeMetrics: () => ({
        activeTests: Math.floor(Math.random() * 50) + 10,
        passRate: (Math.random() * 10 + 85).toFixed(1),
        avgExecutionTime: (Math.random() * 2 + 1).toFixed(1),
        criticalBugs: Math.floor(Math.random() * 8) + 1,
        testCasesCreated: 156 + Math.floor(Math.random() * 20),
        automationCoverage: 68 + Math.floor(Math.random() * 15),
        throughput: 45 + Math.floor(Math.random() * 20),
        reliability: 94 + Math.floor(Math.random() * 6)
    }),

    getTestExecutionData: () => [
        { name: 'Mon', passed: 45, failed: 5, pending: 8 },
        { name: 'Tue', passed: 52, failed: 3, pending: 6 },
        { name: 'Wed', passed: 38, failed: 7, pending: 12 },
        { name: 'Thu', passed: 61, failed: 2, pending: 4 },
        { name: 'Fri', passed: 48, failed: 6, pending: 9 },
        { name: 'Sat', passed: 35, failed: 4, pending: 5 },
        { name: 'Sun', passed: 42, failed: 3, pending: 7 }
    ],

    getBugTrends: () => [
        { month: 'Jan', critical: 12, high: 28, medium: 45, low: 23 },
        { month: 'Feb', critical: 8, high: 32, medium: 38, low: 19 },
        { month: 'Mar', critical: 15, high: 25, medium: 52, low: 31 },
        { month: 'Apr', critical: 6, high: 29, medium: 43, low: 28 },
        { month: 'May', critical: 11, high: 34, medium: 41, low: 25 },
        { month: 'Jun', critical: 4, high: 18, medium: 48, low: 22 }
    ],

    getTestCoverage: () => [
        { name: 'Frontend', value: 85, color: '#3B82F6' },
        { name: 'Backend', value: 92, color: '#10B981' },
        { name: 'API', value: 78, color: '#F59E0B' },
        { name: 'Mobile', value: 67, color: '#EF4444' }
    ],

    getAutomationRatio: () => [
        { period: 'Week 1', manual: 65, automated: 35 },
        { period: 'Week 2', manual: 58, automated: 42 },
        { period: 'Week 3', manual: 52, automated: 48 },
        { period: 'Week 4', manual: 45, automated: 55 }
    ],

    getTeamData: () => [
        { name: 'Alice Johnson', role: 'Senior QA Engineer', testsCreated: 23 },
        { name: 'Bob Smith', role: 'QA Automation Engineer', testsCreated: 18 },
        { name: 'Carol Davis', role: 'QA Analyst', testsCreated: 15 },
        { name: 'David Wilson', role: 'QA Lead', testsCreated: 12 }
    ],

    getAlerts: () => [
        {
            id: 1,
            type: 'warning',
            title: 'High Failure Rate Detected',
            message: 'API tests are failing at 15% rate. Investigate immediately.',
            timestamp: '2 minutes ago'
        },
        {
            id: 2,
            type: 'info',
            title: 'Weekly Report Generated',
            message: 'Your weekly QA report has been generated and is ready for review.',
            timestamp: '1 hour ago'
        }
    ]
};

export default function Dashboard() {
    const { currentUser, userProfile, loading, initialized } = useAuth();
    const [realTimeData, setRealTimeData] = useState(mockDataService.getRealTimeMetrics());
    const [testExecutionData, setTestExecutionData] = useState(mockDataService.getTestExecutionData());
    const [bugTrends, setBugTrends] = useState(mockDataService.getBugTrends());
    const [testCoverage, setTestCoverage] = useState(mockDataService.getTestCoverage());
    const [automationRatio, setAutomationRatio] = useState(mockDataService.getAutomationRatio());
    const [teamData, setTeamData] = useState(mockDataService.getTeamData());
    const [alerts, setAlerts] = useState(mockDataService.getAlerts());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConnected, setIsConnected] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            setRealTimeData(mockDataService.getRealTimeMetrics());

            // Simulate occasional disconnection
            if (Math.random() < 0.1) {
                setIsConnected(false);
                setTimeout(() => setIsConnected(true), 3000);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Simulate data loading
    const refreshData = async () => {
        setChartsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTestExecutionData(mockDataService.getTestExecutionData());
        setBugTrends(mockDataService.getBugTrends());
        setChartsLoading(false);
    };

    const dismissAlert = (alertId) => {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
    };

    if (loading || !initialized || !currentUser) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-500 text-lg">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    const testSummary = {
        passed: testExecutionData.reduce((sum, day) => sum + day.passed, 0),
        failed: testExecutionData.reduce((sum, day) => sum + day.failed, 0),
        pending: testExecutionData.reduce((sum, day) => sum + day.pending, 0),
        skipped: 12
    };

    const performanceMetrics = {
        avgExecutionTime: realTimeData.avgExecutionTime,
        executionTrend: -12,
        throughput: realTimeData.throughput,
        peakThroughput: 78,
        reliability: realTimeData.reliability,
        flakiness: 3
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, {userProfile?.name || 'User'} 👋
                    </h1>
                    <div className="flex items-center space-x-4 mt-2">
                        <p className="text-gray-600">QAID Real-time Analytics Dashboard</p>
                        <RealTimeIndicator
                            lastUpdate={currentTime.toLocaleTimeString()}
                            isConnected={isConnected}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <StatusBadge status="running" count={realTimeData.activeTests} />
                    <StatusBadge status="passed" count="127" />
                    <StatusBadge status="failed" count="8" />
                    <StatusBadge status="critical" count={realTimeData.criticalBugs} />
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <AlertCard
                            key={alert.id}
                            type={alert.type}
                            title={alert.title}
                            message={alert.message}
                            timestamp={alert.timestamp}
                            onDismiss={() => dismissAlert(alert.id)}
                        />
                    ))}
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <MetricCard
                    title="Active Test Runs"
                    value={realTimeData.activeTests}
                    change="+12%"
                    changeType="positive"
                    icon={Activity}
                    color="blue"
                    subtitle="Currently executing"
                />
                <MetricCard
                    title="Pass Rate"
                    value={`${realTimeData.passRate}%`}
                    change="+2.3%"
                    changeType="positive"
                    icon={CheckCircle}
                    color="green"
                    subtitle="Last 7 days"
                />
                <MetricCard
                    title="Critical Bugs"
                    value={realTimeData.criticalBugs}
                    change="-25%"
                    changeType="positive"
                    icon={AlertTriangle}
                    color="red"
                    subtitle="Needs attention"
                />
                <MetricCard
                    title="Test Cases"
                    value={realTimeData.testCasesCreated}
                    change="+18"
                    changeType="positive"
                    icon={TestTube}
                    color="purple"
                    subtitle="This month"
                />
                <MetricCard
                    title="Automation Coverage"
                    value={`${realTimeData.automationCoverage}%`}
                    change="+5%"
                    changeType="positive"
                    icon={Cpu}
                    color="indigo"
                    subtitle="Automated tests"
                />
                <MetricCard
                    title="Avg Execution Time"
                    value={`${realTimeData.avgExecutionTime}min`}
                    change="-0.3min"
                    changeType="positive"
                    icon={Clock}
                    color="yellow"
                    subtitle="Per test suite"
                />
            </div>

            {/* Test Execution Summary */}
            <TestExecutionSummary data={testSummary} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Execution Trends */}
                <ChartContainer
                    title="Test Execution Trends (7 Days)"
                    loading={chartsLoading}
                    actions={[
                        <button
                            key="refresh"
                            onClick={refreshData}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Refresh
                        </button>
                    ]}
                >
                    <TestExecutionChart data={testExecutionData} />
                </ChartContainer>

                {/* Test Coverage Distribution */}
                <ChartContainer title="Test Coverage by Component">
                    <TestCoverageChart data={testCoverage} />
                </ChartContainer>
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bug Trends */}
                <ChartContainer title="Bug Trends by Severity" loading={chartsLoading}>
                    <BugTrendsChart data={bugTrends} />
                </ChartContainer>

                {/* Automation Progress */}
                <ChartContainer title="Manual vs Automated Testing Ratio">
                    <AutomationProgressChart data={automationRatio} />
                </ChartContainer>
            </div>

            {/* Performance Metrics and Team Productivity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceMetrics metrics={performanceMetrics} />
                <TeamProductivity teamData={teamData} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-blue-600" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionButton
                        icon={TestTube}
                        label="Run Test Suite"
                        onClick={() => console.log('Running test suite...')}
                        color="blue"
                    />
                    <QuickActionButton
                        icon={FileText}
                        label="Generate Report"
                        onClick={() => console.log('Generating report...')}
                        color="green"
                    />
                    <QuickActionButton
                        icon={Camera}
                        label="Start Recording"
                        onClick={() => console.log('Starting recording...')}
                        color="purple"
                    />
                    <QuickActionButton
                        icon={Bug}
                        label="Report Bug"
                        onClick={() => console.log('Reporting bug...')}
                        color="red"
                    />
                </div>
            </div>

            {/* Additional Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        <span className="text-blue-600 text-sm font-medium">Analytics</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Reports</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Generate comprehensive test reports with detailed insights and recommendations.
                    </p>
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        View Reports
                    </button>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                        <Target className="w-8 h-8 text-green-600" />
                        <span className="text-green-600 text-sm font-medium">Optimization</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Suggestions</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Get AI-powered recommendations to improve your testing strategy.
                    </p>
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Get Insights
                    </button>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-purple-600" />
                        <span className="text-purple-600 text-sm font-medium">Collaboration</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Management</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Manage team assignments, track progress, and collaborate effectively.
                    </p>
                    <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Manage Team
                    </button>
                </div>
            </div>
        </div>
    );
}