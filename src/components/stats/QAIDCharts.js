'use client';
import React, { useState, useMemo, memo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Activity, Bug, TestTube, Brain, Zap, Video, FileText, Calendar, Database, FileBarChart } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

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
            executionData: generateExecutionData()
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
                    label: function(context) {
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

    // Memoize individual chart data and options
    const weeklyTrendsChartData = useMemo(() => ({
        labels: chartData.weeklyTrends.map(d => d.week),
        datasets: [
            {
                label: 'Test Cases Created',
                data: chartData.weeklyTrends.map(d => d.testCasesCreated),
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
                data: chartData.weeklyTrends.map(d => d.bugsReported),
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
                data: chartData.weeklyTrends.map(d => d.bugsResolved),
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
    }), [chartData.weeklyTrends]);

    const testTypeChartData = useMemo(() => ({
        labels: chartData.weeklyTrends.map(d => d.week),
        datasets: [
            {
                label: 'Automated Tests',
                data: chartData.weeklyTrends.map(d => d.automatedTests),
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
                data: chartData.weeklyTrends.map(d => d.manualTests),
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
    }), [chartData.weeklyTrends]);

    const bugResolutionChartData = useMemo(() => ({
        labels: chartData.dailyResolution.map(d => d.day),
        datasets: [
            {
                label: 'Bugs Reported',
                data: chartData.dailyResolution.map(d => d.reported),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: '#EF4444',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: '#EF4444'
            },
            {
                label: 'Bugs Resolved',
                data: chartData.dailyResolution.map(d => d.resolved),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10B981',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: '#10B981'
            }
        ]
    }), [chartData.dailyResolution]);

    const bugPriorityChartData = useMemo(() => ({
        labels: chartData.bugPriority.map(d => d.name),
        datasets: [{
            data: chartData.bugPriority.map(d => d.value),
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
    }), [chartData.bugPriority]);

    const testDistributionChartData = useMemo(() => ({
        labels: chartData.testCaseDistribution.map(d => d.name),
        datasets: [{
            data: chartData.testCaseDistribution.map(d => d.value),
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
    }), [chartData.testCaseDistribution]);

    const performanceChartData = useMemo(() => ({
        labels: chartData.performanceData.map(d => d.month),
        datasets: [
            {
                label: 'Pass Rate %',
                data: chartData.performanceData.map(d => d.passRate),
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
                data: chartData.performanceData.map(d => d.automationRate),
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
    }), [chartData.performanceData]);

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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                        <p className="text-gray-500">Loading metrics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (dataStatus?.testCases === 'error' || dataStatus?.bugs === 'error') {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Failed to load metrics</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!normalizedMetrics.totalTestCases && !normalizedMetrics.activeBugs && !normalizedMetrics.recentActivity.length) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No data available</p>
                    </div>
                </div>
            </div>
        );
    }

    const chartTabs = [
        { id: 'trends', label: 'Trends', icon: Activity },
        { id: 'bugs', label: 'Bug Analysis', icon: Bug },
        { id: 'tests', label: 'Test Distribution', icon: TestTube },
        { id: 'performance', label: 'Performance', icon: Brain },
        { id: 'execution', label: 'Execution Status', icon: Zap },
        { id: 'recordings', label: 'Recordings', icon: Video },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'sprint', label: 'Sprint', icon: Calendar },
        { id: 'testdata', label: 'Test Data', icon: Database },
        { id: 'reports', label: 'Reports', icon: FileBarChart }
    ];

    const ChartCard = ({ title, children, icon: Icon, trend, subtitle }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    </div>
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            {children}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Chart Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
                <div className="flex space-x-1 overflow-x-auto">
                    {chartTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveChart(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                activeChart === tab.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Content - Keep all charts mounted but hidden */}
            <div className={activeChart === 'trends' ? '' : 'hidden'}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ChartCard 
                        title="Weekly Activity Trends" 
                        icon={Activity} 
                        trend={trends.passRateTrend}
                        subtitle="Test cases and bug activity over time"
                    >
                        <div style={{ height: '320px' }}>
                            {chartData.weeklyTrends.length > 0 ? (
                                <Line
                                    data={weeklyTrendsChartData}
                                    options={defaultOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No activity data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ChartCard>

                    <ChartCard 
                        title="Test Type Distribution" 
                        icon={TestTube} 
                        trend={trends.automationTrend}
                        subtitle="Manual vs Automated test coverage"
                    >
                        <div style={{ height: '320px' }}>
                            {chartData.weeklyTrends.length > 0 ? (
                                <Line
                                    data={testTypeChartData}
                                    options={defaultOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <TestTube className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No test case data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ChartCard>
                </div>
            </div>

            <div className={activeChart === 'bugs' ? '' : 'hidden'}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ChartCard 
                        title="Daily Bug Resolution" 
                        icon={Bug} 
                        trend={trends.resolutionTrend}
                        subtitle="Bug reporting and resolution patterns"
                    >
                        <div style={{ height: '320px' }}>
                            {chartData.dailyResolution.length > 0 ? (
                                <Bar
                                    data={bugResolutionChartData}
                                    options={defaultOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Bug className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No bug data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ChartCard>

                    <ChartCard 
                        title="Bug Priority Distribution" 
                        icon={Bug}
                        subtitle="Current bug priority breakdown"
                    >
                        <div style={{ height: '320px' }}>
                            {chartData.bugPriority.length > 0 ? (
                                <Doughnut
                                    data={bugPriorityChartData}
                                    options={doughnutOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Bug className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No bugs reported</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ChartCard>
                </div>
            </div>

            <div className={activeChart === 'tests' ? '' : 'hidden'}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ChartCard 
                        title="Test Case Distribution" 
                        icon={TestTube}
                        trend={trends.aiTrend}
                        subtitle="Test case types and automation coverage"
                    >
                        <div style={{ height: '320px' }}>
                            {chartData.testCaseDistribution.length > 0 ? (
                                <Pie
                                    data={testDistributionChartData}
                                    options={doughnutOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <TestTube className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No test cases available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ChartCard>

                    <ChartCard 
                        title="Test Case Metrics" 
                        icon={TestTube}
                        subtitle="Detailed breakdown of test cases"
                    >
                        <div className="space-y-6 pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manual Tests</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{normalizedMetrics.manualTestCases}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.max(0, 100 - normalizedMetrics.automationRate)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Automated Tests</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{normalizedMetrics.automatedTestCases}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${normalizedMetrics.automationRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Generated</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{normalizedMetrics.aiGeneratedTestCases}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${normalizedMetrics.aiContributionRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Test Cases</span>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{normalizedMetrics.totalTestCases}</span>
                                </div>
                            </div>
                        </div>
                    </ChartCard>
                </div>
            </div>

            <div className={activeChart === 'performance' ? '' : 'hidden'}>
                <ChartCard 
                    title="Performance Metrics Over Time" 
                    icon={Brain}
                    trend={trends.passRateTrend}
                    subtitle="Pass rates and automation progress"
                >
                    <div style={{ height: '400px' }}>
                        {chartData.performanceData.length > 0 ? (
                            <Line
                                data={performanceChartData}
                                options={defaultOptions}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">No performance data</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ChartCard>
            </div>

            <div className={activeChart === 'execution' ? '' : 'hidden'}>
                <ChartCard 
                    title="Test Execution Status" 
                    icon={Zap}
                    subtitle="Current test execution breakdown"
                >
                    <div style={{ height: '300px' }}>
                        <div className="grid grid-cols-3 gap-4 h-full items-center">
                            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{normalizedMetrics.passCount}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Passed</div>
                            </div>
                            <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{normalizedMetrics.failCount}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Failed</div>
                            </div>
                            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{normalizedMetrics.totalTestCases - normalizedMetrics.executionCount}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Pending</div>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className={activeChart === 'recordings' ? '' : 'hidden'}>
                <ChartCard 
                    title="Recording Trends" 
                    icon={Video}
                    subtitle="Test recording activity"
                >
                    <div style={{ height: '300px' }}>
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Video className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{normalizedMetrics.recordings}</div>
                                <p className="text-gray-500">Total Recordings</p>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className={activeChart === 'documents' ? '' : 'hidden'}>
                <ChartCard 
                    title="Documentation Trends" 
                    icon={FileText}
                    subtitle="Documentation activity over time"
                >
                    <div style={{ height: '300px' }}>
                        <div className="grid grid-cols-2 gap-4 h-full items-center">
                            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{normalizedMetrics.totalDocuments}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Documents</div>
                            </div>
                            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{normalizedMetrics.activeDocuments}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Active Documents</div>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className={activeChart === 'sprint' ? '' : 'hidden'}>
                <ChartCard 
                    title="Sprint Progress" 
                    icon={Calendar}
                    subtitle="Current sprint metrics"
                >
                    <div style={{ height: '300px' }}>
                        <div className="space-y-6 h-full flex flex-col justify-center">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{normalizedMetrics.sprintProgress}%</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Sprint Progress</div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000"
                                    style={{ width: `${normalizedMetrics.sprintProgress}%` }}
                                ></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{normalizedMetrics.activeSprints}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{normalizedMetrics.completedSprints}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className={activeChart === 'testdata' ? '' : 'hidden'}>
                <ChartCard 
                    title="Test Data Coverage" 
                    icon={Database}
                    subtitle="Test data usage and coverage"
                >
                    <div style={{ height: '300px' }}>
                        <div className="space-y-6 h-full flex flex-col justify-center">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">{normalizedMetrics.testDataCoverage}%</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Test Data Coverage</div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
                                    style={{ width: `${normalizedMetrics.testDataCoverage}%` }}
                                ></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{normalizedMetrics.totalTestData}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Data Sets</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{normalizedMetrics.activeTestData}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active Data Sets</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>

            <div className={activeChart === 'reports' ? '' : 'hidden'}>
                <ChartCard 
                    title="Report Trends" 
                    icon={FileBarChart}
                    subtitle="Reporting activity and metrics"
                >
                    <div style={{ height: '300px' }}>
                        <div className="grid grid-cols-2 gap-4 h-full items-center">
                            <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{normalizedMetrics.activeBugs}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Active Issues</div>
                            </div>
                            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{normalizedMetrics.resolvedBugs}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Resolved Issues</div>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

// Wrap component with React.memo to prevent unnecessary re-renders
export default memo(QAIDCharts);