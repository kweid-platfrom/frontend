'use client';
import React, { useState, useMemo, memo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Import chart components
import TrendsChart from './charts/TrendsChart';
import BugsChart from './charts/BugsChart';
import TestsChart from './charts/TestsChart';
import PerformanceChart from './charts/PerformanceChart';
import ExecutionChart from './charts/ExecutionChart';
import RecordingsChart from './charts/RecordingsChart';
import DocumentsChart from './charts/DocumentsChart';
import SprintChart from './charts/SprintChart';
import TestDataChart from './charts/TestDataChart';
import ReportsChart from './charts/ReportsChart';

const QAIDCharts = ({ metrics, dataStatus }) => {
    const [activeChart, setActiveChart] = useState('trends');

    // Normalize metrics to handle null/undefined values
    const normalizedMetrics = useMemo(() => {
        const totalTestCases = Number(metrics?.totalTestCases) || 0;
        const activeBugs = Number(metrics?.activeBugs) || 0;
        const totalBugs = Number(metrics?.totalBugs) || 0;
        const automatedTestCases = Number(metrics?.automatedTestCases) || 0;
        const manualTestCases = Number(metrics?.manualTestCases) || 0;
        const aiGeneratedTestCases = Number(metrics?.aiGeneratedTestCases) || 0;
        const passRate = Number(metrics?.passRate) || 0;
        const automationRate = Number(metrics?.automationRate) || 0;
        const bugResolutionRate = Number(metrics?.bugResolutionRate) || 0;
        const aiContributionRate = Number(metrics?.aiContributionRate) || 0;
        const criticalBugs = Number(metrics?.criticalBugs) || 0;
        const highPriorityBugs = Number(metrics?.highPriorityBugs) || 0;
        const mediumPriorityBugs = Number(metrics?.mediumPriorityBugs) || 0;
        const lowPriorityBugs = Number(metrics?.lowPriorityBugs) || 0;
        const recordings = Number(metrics?.recordings) || 0;
        const recentActivity = Array.isArray(metrics?.recentActivity) ? metrics.recentActivity : [];
        const avgExecutionTime = Number(metrics?.avgExecutionTime) || 0;
        const avgResolutionTime = Number(metrics?.avgResolutionTime) || 0;
        const executionCount = Number(metrics?.executionCount) || 0;
        const totalDocuments = Number(metrics?.totalDocuments) || 0;
        const activeDocuments = Number(metrics?.activeDocuments) || 0;
        const totalTestData = Number(metrics?.totalTestData) || 0;
        const activeTestData = Number(metrics?.activeTestData) || 0;
        const sprintVelocity = Number(metrics?.sprintVelocity) || 0;
        const passCount = Number(metrics?.passCount) || 0;
        const failCount = Number(metrics?.failCount) || 0;
        const executionTrend = Array.isArray(metrics?.executionTrend) ? metrics.executionTrend : [];
        const bugTrend = Array.isArray(metrics?.bugTrend) ? metrics.bugTrend : [];
        const testCaseTrend = Array.isArray(metrics?.testCaseTrend) ? metrics.testCaseTrend : [];
        const resolvedBugs = Number(metrics?.resolvedBugs) || 0;
        const activeSprints = Number(metrics?.activeSprints) || 0;
        const completedSprints = Number(metrics?.completedSprints) || 0;
        const testDataCoverage = totalTestData > 0 ? Math.round((activeTestData / totalTestData) * 100) : 0;
        const dataSets = totalTestData;
        const sprintProgress = (activeSprints + completedSprints > 0) ? Math.round((completedSprints / (activeSprints + completedSprints)) * 100) : 0;

        return {
            totalTestCases,
            activeBugs,
            totalBugs,
            automatedTestCases,
            manualTestCases,
            aiGeneratedTestCases,
            passRate,
            automationRate,
            bugResolutionRate,
            aiContributionRate,
            criticalBugs,
            highPriorityBugs,
            mediumPriorityBugs,
            lowPriorityBugs,
            recordings,
            recentActivity,
            avgExecutionTime,
            avgResolutionTime,
            executionCount,
            totalDocuments,
            activeDocuments,
            totalTestData,
            activeTestData,
            sprintVelocity,
            testDataCoverage,
            dataSets,
            passCount,
            failCount,
            executionTrend,
            bugTrend,
            testCaseTrend,
            resolvedBugs,
            activeSprints,
            completedSprints,
            sprintProgress
        };
    }, [metrics]);

    // Generate chart data using real metrics
    const chartData = useMemo(() => {
        const generateWeeklyTrends = () => {
            const weeks = [];
            const testCasesSum = Math.floor(normalizedMetrics.testCaseTrend.reduce((sum, t) => sum + (t.count || 0), 0)) || Math.floor(normalizedMetrics.totalTestCases / 10);
            const bugsSum = Math.floor(normalizedMetrics.bugTrend.reduce((sum, t) => sum + (t.count || 0), 0)) || Math.floor(normalizedMetrics.activeBugs / 5);
            const resolutionRatio = normalizedMetrics.bugResolutionRate / 100;
            const autoRatio = normalizedMetrics.automationRate / 100;
            for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
                const factor = (weekIndex + 1) / 4.0;
                const testCasesCreated = Math.floor(testCasesSum * factor);
                const bugsReported = Math.floor(bugsSum * factor);
                const bugsResolved = Math.floor(bugsReported * resolutionRatio);
                const automatedTests = Math.floor(testCasesCreated * autoRatio);
                const manualTests = testCasesCreated - automatedTests;
                weeks.push({
                    week: `Week ${weekIndex + 1}`,
                    bugsReported,
                    bugsResolved,
                    testCasesCreated,
                    automatedTests,
                    manualTests
                });
            }
            return weeks;
        };

        const generateDailyResolution = () => {
            return normalizedMetrics.bugTrend.map((entry) => {
                const reported = entry.count || 0;
                const resolved = Math.floor(reported * (normalizedMetrics.bugResolutionRate / 100));
                return {
                    day: entry.date,
                    reported,
                    resolved
                };
            });
        };

        const generateTestCaseDistribution = () => {
            const total = normalizedMetrics.totalTestCases || 1;
            let automated = normalizedMetrics.automatedTestCases - normalizedMetrics.aiGeneratedTestCases;
            if (automated < 0) automated = 0;
            const manual = normalizedMetrics.manualTestCases;
            const ai = normalizedMetrics.aiGeneratedTestCases;
            const remaining = Math.max(0, total - manual - automated - ai);

            return [
                { name: 'Manual', value: manual },
                { name: 'Automated', value: automated },
                { name: 'AI Generated', value: ai },
                { name: 'Other', value: remaining }
            ].filter(item => item.value > 0);
        };

        const generateBugPriority = () => {
            const total = normalizedMetrics.activeBugs;
            if (total === 0) return [];
            const critical = normalizedMetrics.criticalBugs;
            const high = normalizedMetrics.highPriorityBugs;
            const medium = normalizedMetrics.mediumPriorityBugs;
            const low = normalizedMetrics.lowPriorityBugs;
            const sum = critical + high + medium + low;
            const other = Math.max(0, total - sum);
            return [
                { name: 'Critical', value: critical },
                { name: 'High', value: high },
                { name: 'Medium', value: medium },
                { name: 'Low', value: low },
                ...(other > 0 ? [{ name: 'Other', value: other }] : [])
            ].filter(item => item.value > 0);
        };

        const generatePerformanceData = () => {
            const perfData = [];
            normalizedMetrics.executionTrend.forEach((entry, index) => {
                perfData.push({
                    month: entry.date,
                    passRate: entry.passRate,
                    automationRate: normalizedMetrics.automationRate,
                    testCases: entry.total,
                    bugs: normalizedMetrics.bugTrend[index]?.count || 0
                });
            });
            return perfData;
        };

        const generateExecutionData = () => {
            const pending = normalizedMetrics.totalTestCases - normalizedMetrics.executionCount;
            return [{
                feature: 'Overall',
                passed: normalizedMetrics.passCount,
                failed: normalizedMetrics.failCount,
                pending: Math.max(0, pending),
                total: normalizedMetrics.totalTestCases
            }];
        };

        const generateRecordingTrends = () => {
            const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            const coveragePercent = normalizedMetrics.totalTestCases > 0
                ? Math.min(100, Math.floor((normalizedMetrics.recordings / normalizedMetrics.totalTestCases) * 100))
                : 0;
            return weeks.map((week, index) => ({
                week,
                recordings: Math.floor(normalizedMetrics.recordings * (index + 1) / 4),
                coverage: coveragePercent
            }));
        };

        const generateDocumentTrends = () => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr'];
            return months.map((month, index) => ({
                month,
                documents: Math.floor(normalizedMetrics.totalDocuments * (index + 1) / 4),
                updates: Math.floor(normalizedMetrics.activeDocuments * (index + 1) / 4)
            }));
        };

        const generateSprintTrends = () => {
            const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
            return days.map((day, index) => ({
                day,
                progress: Math.min(100, normalizedMetrics.sprintProgress * (index + 1) / 5),
                velocity: normalizedMetrics.sprintVelocity
            }));
        };

        const generateTestDataTrends = () => {
            const sets = ['Set 1', 'Set 2', 'Set 3', 'Set 4'];
            return sets.map((set, index) => ({
                set,
                coverage: normalizedMetrics.testDataCoverage,
                items: Math.floor(normalizedMetrics.dataSets * (index + 1) / 4)
            }));
        };

        const generateReportTrends = () => {
            const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            const baseOverdue = normalizedMetrics.activeBugs / 4;
            const baseCompleted = normalizedMetrics.resolvedBugs / 4;
            return weeks.map((week, index) => ({
                week,
                overdue: Math.floor(baseOverdue * (4 - index) / 4),
                completed: Math.floor(baseCompleted * (index + 1))
            }));
        };

        // Memoized chart datasets
        const weeklyTrendsChartData = {
            labels: generateWeeklyTrends().map(d => d.week),
            datasets: [
                {
                    label: 'Test Cases Created',
                    data: generateWeeklyTrends().map(d => d.testCasesCreated),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3B82F6',
                    pointHoverBorderWidth: 3
                },
                {
                    label: 'Bugs Reported',
                    data: generateWeeklyTrends().map(d => d.bugsReported),
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#EF4444',
                    pointHoverBorderWidth: 3
                },
                {
                    label: 'Bugs Resolved',
                    data: generateWeeklyTrends().map(d => d.bugsResolved),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#10B981',
                    pointHoverBorderWidth: 3
                }
            ]
        };

        const testTypeChartData = {
            labels: generateWeeklyTrends().map(d => d.week),
            datasets: [
                {
                    label: 'Automated Tests',
                    data: generateWeeklyTrends().map(d => d.automatedTests),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Manual Tests',
                    data: generateWeeklyTrends().map(d => d.manualTests),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#8B5CF6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        };

        const bugResolutionChartData = {
            labels: generateDailyResolution().map(d => d.day),
            datasets: [
                {
                    label: 'Bugs Reported',
                    data: generateDailyResolution().map(d => d.reported),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: '#EF4444'
                },
                {
                    label: 'Bugs Resolved',
                    data: generateDailyResolution().map(d => d.resolved),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10B981',
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: '#10B981'
                }
            ]
        };

        const bugPriorityChartData = {
            labels: generateBugPriority().map(d => d.name),
            datasets: [{
                data: generateBugPriority().map(d => d.value),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(107, 114, 128, 0.8)'
                ],
                borderColor: [
                    '#EF4444',
                    '#F97316',
                    '#F59E0B',
                    '#10B981',
                    '#6B7280'
                ],
                borderWidth: 2,
                hoverOffset: 15,
                offset: 5
            }]
        };

        const testDistributionChartData = {
            labels: generateTestCaseDistribution().map(d => d.name),
            datasets: [{
                data: generateTestCaseDistribution().map(d => d.value),
                backgroundColor: [
                    'rgba(148, 163, 184, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(229, 231, 235, 0.8)'
                ],
                borderColor: [
                    '#94A3B8',
                    '#3B82F6',
                    '#8B5CF6',
                    '#E5E7EB'
                ],
                borderWidth: 2,
                hoverOffset: 15,
                offset: 5
            }]
        };

        const performanceChartData = {
            labels: generatePerformanceData().map(d => d.month),
            datasets: [
                {
                    label: 'Pass Rate %',
                    data: generatePerformanceData().map(d => d.passRate),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Automation Rate %',
                    data: generatePerformanceData().map(d => d.automationRate),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        };

        return {
            weeklyTrends: generateWeeklyTrends(),
            dailyResolution: generateDailyResolution(),
            testCaseDistribution: generateTestCaseDistribution(),
            bugPriority: generateBugPriority(),
            performanceData: generatePerformanceData(),
            recordingTrends: generateRecordingTrends(),
            documentTrends: generateDocumentTrends(),
            sprintTrends: generateSprintTrends(),
            testDataTrends: generateTestDataTrends(),
            reportTrends: generateReportTrends(),
            executionData: generateExecutionData(),
            weeklyTrendsChartData,
            testTypeChartData,
            bugResolutionChartData,
            bugPriorityChartData,
            testDistributionChartData,
            performanceChartData
        };
    }, [normalizedMetrics]);

    // Calculate trends based on real metrics
    const trends = useMemo(() => ({
        passRateTrend: normalizedMetrics.passRate > 70 ? 12 : -8,
        automationTrend: normalizedMetrics.automationRate > 50 ? 15 : -5,
        bugTrend: normalizedMetrics.activeBugs < normalizedMetrics.totalTestCases * 0.1 ? 10 : -12,
        resolutionTrend: normalizedMetrics.bugResolutionRate > 60 ? 18 : -7,
        aiTrend: normalizedMetrics.aiContributionRate > 30 ? 25 : 5
    }), [normalizedMetrics]);

    // Modern chart options with smooth animations
    const defaultOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        },
        transitions: {
            active: {
                animation: {
                    duration: 300
                }
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    color: '#64748b'
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 16,
                titleFont: {
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    size: 13,
                    weight: '400'
                },
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 6,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: '#94a3b8'
                }
            },
            y: {
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: '#94a3b8'
                }
            }
        }
    }), []);

    // Doughnut specific options
    const doughnutOptions = useMemo(() => ({
        ...defaultOptions,
        cutout: '65%',
        plugins: {
            ...defaultOptions.plugins,
            legend: {
                ...defaultOptions.plugins.legend,
                position: 'right'
            }
        }
    }), [defaultOptions]);

    // Handle loading or error states
    if (dataStatus?.testCases === 'pending' || dataStatus?.bugs === 'pending') {
        return (
            <div className="bg-card rounded-lg shadow-theme border border-border p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                        <p className="text-muted-foreground">Loading metrics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (dataStatus?.testCases === 'error' || dataStatus?.bugs === 'error') {
        return (
            <div className="bg-card rounded-lg shadow-theme border border-border p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Failed to load metrics</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!normalizedMetrics.totalTestCases && !normalizedMetrics.activeBugs && !normalizedMetrics.recentActivity.length) {
        return (
            <div className="bg-card rounded-lg shadow-theme border border-border p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No data available</p>
                    </div>
                </div>
            </div>
        );
    }

    const chartTabs = [
        { id: 'trends', label: 'Trends' },
        { id: 'bugs', label: 'Bug Analysis' },
        { id: 'tests', label: 'Test Distribution' },
        { id: 'performance', label: 'Performance' },
        { id: 'execution', label: 'Execution Status' },
        { id: 'recordings', label: 'Recordings' },
        { id: 'documents', label: 'Documents' },
        { id: 'sprint', label: 'Sprint' },
        { id: 'testdata', label: 'Test Data' },
        { id: 'reports', label: 'Reports' }
    ];

    return (
        <div className="space-y-6">
            {/* Chart Navigation - Improved Responsiveness */}
            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-1">
                <div className="flex space-x-1 overflow-x-auto">
                    {chartTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveChart(tab.id)}
                            className={`flex items-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 ${activeChart === tab.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                }`}
                            aria-current={activeChart === tab.id ? 'page' : undefined}
                        >
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Content */}
            {activeChart === 'trends' && (
                <TrendsChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                    trends={trends}
                    normalizedMetrics={normalizedMetrics}
                />
            )}
            {activeChart === 'bugs' && (
                <BugsChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                    doughnutOptions={doughnutOptions}
                    trends={trends}
                />
            )}
            {activeChart === 'tests' && (
                <TestsChart
                    chartData={chartData}
                    doughnutOptions={doughnutOptions}
                    defaultOptions={defaultOptions}
                    trends={trends}
                    normalizedMetrics={normalizedMetrics}
                />
            )}
            {activeChart === 'performance' && (
                <PerformanceChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                    trends={trends}
                />
            )}
            {activeChart === 'execution' && (
                <ExecutionChart
                    normalizedMetrics={normalizedMetrics}
                    doughnutOptions={doughnutOptions}
                />
            )}
            {activeChart === 'recordings' && (
                <RecordingsChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                />
            )}
            {activeChart === 'documents' && (
                <DocumentsChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                />
            )}
            {activeChart === 'sprint' && (
                <SprintChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                />
            )}
            {activeChart === 'testdata' && (
                <TestDataChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                />
            )}
            {activeChart === 'reports' && (
                <ReportsChart
                    chartData={chartData}
                    defaultOptions={defaultOptions}
                />
            )}
        </div>
    );
};

// Wrap component with React.memo to prevent unnecessary re-renders
export default memo(QAIDCharts);