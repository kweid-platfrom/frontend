import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Settings, RotateCcw, AlertCircle, TrendingUp, Bug, TestTube } from 'lucide-react';

// Import QAID-specific components
import QAIDMetricsOverview from './stats/QAIDMetricsOverview';
import TestCaseMetrics from './stats/TestCaseMetrics';
import BugTrackingMetrics from './stats/BugTrackingMetrics';
import AIGenerationMetrics from './stats/AIGenerationMetrics';
import RecordingMetrics from './stats/RecordingsMetrics';
import AutomationMetrics from './stats/AutomationMetrics';
import TeamProductivity from './stats/TeamProductivity';
import QAIDCharts from './stats/QAIDCharts';
import QuickActions from './stats/QuickActions';

// Import services
import { useBugTrackingMetrics } from '../services/bugTrackingService';

const DashboardContent = ({ hasValidAccess = true }) => {
    const [filters, setFilters] = useState({
        timeRange: '7d',
        component: 'all',
        severity: 'all',
        priority: 'all',
        status: 'all',
        source: 'all',
        team: 'all',
        feature: 'all',
        sprint: 'all'
    });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConnected, setIsConnected] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const { metrics: bugMetrics, loading: bugLoading, error: bugError, refetch: bugRefetch } = useBugTrackingMetrics(filters);

    const loading = bugLoading;
    const error = bugError;

    useEffect(() => {
        if (!hasValidAccess) return;

        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const refreshInterval = autoRefresh ? setInterval(() => {
            bugRefetch();
        }, 30000) : null;

        return () => {
            clearInterval(timeInterval);
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, [autoRefresh, bugRefetch, hasValidAccess]);

    useEffect(() => {
        if (!hasValidAccess) return;

        const checkConnection = () => {
            setIsConnected(navigator.onLine);
        };

        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);

        return () => {
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
        };
    }, [hasValidAccess]);

    const enhancedMetrics = useMemo(() => {
        if (!hasValidAccess || !bugMetrics) {
            return {
                totalTestCases: 245,
                passRate: 87,
                activeBugs: 0,
                criticalIssues: 0,
                totalBugs: 0,
                bugsFromScreenRecording: 0,
                bugsFromManualTesting: 0,
                bugsWithVideoEvidence: 0,
                bugsWithNetworkLogs: 0,
                bugsWithConsoleLogs: 0,
                criticalBugs: 0,
                highPriorityBugs: 0,
                mediumPriorityBugs: 0,
                lowPriorityBugs: 0,
                resolvedBugs: 0,
                avgResolutionTime: 0,
                bugResolutionRate: 0,
                avgBugReportCompleteness: 75,
                bugReportsWithAttachments: 0,
                bugReproductionRate: 0,
                weeklyReportsGenerated: 0,
                monthlyReportsGenerated: 0,
                avgBugsPerReport: 0
            };
        }

        return {
            totalTestCases: 245,
            passRate: 87,
            ...bugMetrics,
            activeBugs: Array.isArray(bugMetrics.bugs)
                ? bugMetrics.bugs.filter(bug => !['Resolved', 'Closed'].includes(bug.status)).length
                : (bugMetrics.activeBugs ?? 0),
            criticalIssues: bugMetrics.criticalBugs || 0,
            bugsFromManualTesting: bugMetrics.bugsFromManualTesting ||
                Math.max(0, (bugMetrics.totalBugs || 0) - (bugMetrics.bugsFromScreenRecording || 0)),
            avgBugReportCompleteness: bugMetrics.avgBugReportCompleteness || 75,
            bugReproductionRate: bugMetrics.bugReproductionRate ||
                (bugMetrics.totalBugs > 0 ? Math.round(((bugMetrics.bugsWithVideoEvidence || 0) / bugMetrics.totalBugs) * 100) : 0),
            weeklyReportsGenerated: bugMetrics.weeklyReportsGenerated || 4,
            monthlyReportsGenerated: bugMetrics.monthlyReportsGenerated || 1,
            avgBugsPerReport: bugMetrics.avgBugsPerReport ||
                (bugMetrics.totalBugs > 0 ? Math.round(bugMetrics.totalBugs / 5) : 0)
        };
    }, [bugMetrics, hasValidAccess]);

    const summaryStats = useMemo(() => {
        return {
            totalTestCases: enhancedMetrics.totalTestCases,
            activeBugs: enhancedMetrics.activeBugs,
            passRate: enhancedMetrics.passRate,
            criticalIssues: enhancedMetrics.criticalIssues
        };
    }, [enhancedMetrics]);

    const FilterButton = ({ active, onClick, children, disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : active
                    ? 'bg-teal-100 text-teal-700 border border-teal-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
        >
            {children}
        </button>
    );

    const timeFilterOptions = [
        { value: '1d', label: 'Last 24h' },
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: '30 days' },
        { value: '90d', label: '90 days' },
        { value: 'all', label: 'All time' }
    ];

    const tabOptions = [
        { value: 'overview', label: 'Overview', icon: TrendingUp },
        { value: 'testing', label: 'Testing', icon: TestTube },
        { value: 'bugs', label: 'Bug Tracking', icon: Bug },
        { value: 'ai', label: 'AI Generation', icon: Activity },
        { value: 'automation', label: 'Automation', icon: Settings }
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleRefresh = () => {
        bugRefetch();
        setCurrentTime(new Date());
    };

    // Show loading screen
    if ((loading && !bugMetrics)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Activity className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg text-gray-600 mb-2">Loading QAID Dashboard</p>
                    <p className="text-sm text-gray-500">Fetching latest metrics...</p>
                </div>
            </div>
        );
    }

    // Show error screen
    if (error && !bugMetrics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4 inline mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-8xl mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            QA Intelligence Dashboard
                        </h1>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>{isConnected ? 'Connected' : 'Offline'}</span>
                            </div>
                            <span>•</span>
                            <span>Updated: {currentTime.toLocaleTimeString()}</span>
                            {loading && (
                                <>
                                    <span>•</span>
                                    <span className="text-teal-600">Refreshing...</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="mr-2 text-teal-600 focus:ring-teal-500"
                            />
                            Auto-refresh
                        </label>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-teal-600">{summaryStats.totalTestCases}</div>
                        <div className="text-sm text-teal-600">Total Test Cases</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{summaryStats.passRate}%</div>
                        <div className="text-sm text-green-600">Pass Rate</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-600">{summaryStats.activeBugs}</div>
                        <div className="text-sm text-orange-600">Active Bugs</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-red-600">{summaryStats.criticalIssues}</div>
                        <div className="text-sm text-red-600">Critical Issues</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-1">
                <div className="flex space-x-1 overflow-x-auto">
                    {tabOptions.map(tab => {
                        const IconComponent = tab.icon;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded transition-colors whitespace-nowrap ${activeTab === tab.value
                                    ? 'bg-teal-100 text-teal-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <IconComponent className="w-4 h-4 mr-2" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Time Range:</span>
                            <div className="flex space-x-1">
                                {timeFilterOptions.map(option => (
                                    <FilterButton
                                        key={option.value}
                                        active={filters.timeRange === option.value}
                                        onClick={() => handleFilterChange('timeRange', option.value)}
                                        disabled={loading}
                                    >
                                        {option.label}
                                    </FilterButton>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Priority:</span>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                                <option value="all">All Priorities</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                                <option value="all">All Statuses</option>
                                <option value="New">New</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Source:</span>
                            <select
                                value={filters.source}
                                onChange={(e) => handleFilterChange('source', e.target.value)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                                <option value="all">All Sources</option>
                                <option value="screen-recording">Screen Recording</option>
                                <option value="manual">Manual Testing</option>
                                <option value="automated">Automated</option>
                                <option value="user-report">User Report</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Warning */}
            {error && bugMetrics && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <p className="text-yellow-800">
                            Warning: Some bug tracking data may be outdated due to connection issues.
                            <button
                                onClick={handleRefresh}
                                className="underline ml-2 hover:no-underline"
                            >
                                Try refreshing
                            </button>
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <>
                        <QAIDMetricsOverview
                            metrics={enhancedMetrics}
                            loading={false}
                        />
                        <QAIDCharts
                            metrics={enhancedMetrics}
                            loading={false}
                        />
                        <TeamProductivity
                            metrics={enhancedMetrics}
                            loading={false}
                        />
                    </>
                )}

                {activeTab === 'testing' && (
                    <>
                        <TestCaseMetrics
                            metrics={{
                                totalTestCases: enhancedMetrics.totalTestCases,
                                passRate: enhancedMetrics.passRate
                            }}
                            loading={false}
                        />
                        <RecordingMetrics
                            metrics={{
                                totalRecordings: enhancedMetrics.bugsFromScreenRecording || 52,
                                successfulRecordings: Math.round((enhancedMetrics.bugsFromScreenRecording || 52) * 0.9)
                            }}
                            loading={false}
                        />
                    </>
                )}

                {activeTab === 'bugs' && (
                    <>
                        <BugTrackingMetrics
                            metrics={enhancedMetrics}
                            loading={loading}
                            error={error}
                        />
                    </>
                )}

                {activeTab === 'ai' && (
                    <>
                        <AIGenerationMetrics
                            metrics={{
                                totalGenerations: 148,
                                successRate: enhancedMetrics.avgBugReportCompleteness || 94
                            }}
                            loading={false}
                        />
                    </>
                )}

                {activeTab === 'automation' && (
                    <>
                        <AutomationMetrics
                            metrics={{
                                automatedTests: 89,
                                automationCoverage: Math.round(
                                    enhancedMetrics.totalBugs > 0 ?
                                        ((enhancedMetrics.bugsFromScreenRecording || 0) / enhancedMetrics.totalBugs) * 100 :
                                        73
                                )
                            }}
                            loading={false}
                        />
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <QuickActions
                metrics={{
                    qa: {
                        testCases: enhancedMetrics.totalTestCases,
                        passRate: enhancedMetrics.passRate
                    },
                    bugs: enhancedMetrics
                }}
                loading={false}
                onRefresh={handleRefresh}
            />
        </div>
    );
};

export default DashboardContent;