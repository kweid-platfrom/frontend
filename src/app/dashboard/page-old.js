// Old Dashboard
'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Activity, Settings, RotateCcw, AlertCircle, TrendingUp, Bug, TestTube } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { useAppNotifications } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useSubscription } from '@/contexts/subscriptionContext';
import QAIDMetricsOverview from '../../components/stats/QAIDMetricsOverview';
import TestCaseMetrics from '../../components/stats/TestCaseMetrics';
import BugTrackingMetrics from '../../components/stats/BugTrackingMetrics';
import AIGenerationMetrics from '../../components/stats/AIGenerationMetrics';
import RecordingMetrics from '../../components/stats/RecordingsMetrics';
import AutomationMetrics from '../../components/stats/AutomationMetrics';
import TeamProductivity from '../../components/stats/TeamProductivity';
import QAIDCharts from '../../components/stats/QAIDCharts';
import QuickActions from '../../components/stats/QuickActions';
import { useBugTrackingMetrics } from '../../hooks/old-hooks/useBugTrackingMetrics';
import { useTestMetrics } from '../../hooks/old-hooks/useTestCaseMetrics';

const Dashboard = () => {
    const { suites, isLoading: suiteLoading, error: suiteError, refetchSuites } = useSuite();
    const { addNotification } = useAppNotifications();
    const { isLoading: subscriptionLoading } = useSubscription();
    
    // Get current suite ID (assuming you want to show metrics for the first/active suite)
    const currentSuiteId = suites?.length > 0 ? suites[0].id : null;
    
    // Initialize test metrics hook
    const {
        metrics: testMetrics,
        loading: testMetricsLoading,
        error: testMetricsError,
        refresh: refreshTestMetrics,
        lastUpdated: testMetricsLastUpdated
    } = useTestMetrics(currentSuiteId, null, {
        autoRefresh: true,
        refreshInterval: 30000,
        enableRealtime: true,
        includeExecutions: true
    });

    const [filters, setFilters] = useState({
        timeRange: '7d',
        severity: 'all',
        priority: 'all',
        status: 'all',
        source: 'all',
        environment: 'all',
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConnected, setIsConnected] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const timeIntervalRef = useRef(null);
    
    const { metrics: bugMetrics, loading: bugLoading, error: bugError, refetch: bugRefetch } = useBugTrackingMetrics(filters);

    // Time update timer
    useEffect(() => {
        if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
        }
        timeIntervalRef.current = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => {
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, []);

    // Connection status
    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(navigator.onLine);
        };
        checkConnection();
        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);
        return () => {
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
        };
    }, []);

    // Error notifications
    useEffect(() => {
        if (bugError) {
            addNotification({
                type: 'error',
                title: 'Bug Tracking Error',
                message: bugError.includes('permission')
                    ? 'You lack permission to view bug tracking data. Contact your organization admin to be added as a member.'
                    : `Failed to load bug tracking data: ${bugError}`,
                persistent: true,
            });
        }
    }, [bugError, addNotification]);

    useEffect(() => {
        if (testMetricsError) {
            addNotification({
                type: 'error',
                title: 'Test Metrics Error',
                message: `Failed to load test case metrics: ${testMetricsError?.message || testMetricsError}`,
                persistent: true,
            });
        }
    }, [testMetricsError, addNotification]);

    // Calculate enhanced metrics combining test and bug data
    const enhancedMetrics = useMemo(() => {
        // Default values for bug metrics
        const bugMetricsWithDefaults = {
            totalBugs: 0,
            activeBugs: 0,
            criticalIssues: 0,
            bugsFromScreenRecording: 0,
            bugsFromManualTesting: 0,
            bugsWithVideoEvidence: 0,
            bugsWithConsoleLogs: 0,
            criticalBugs: 0,
            highPriorityBugs: 0,
            mediumPriorityBugs: 0,
            lowPriorityBugs: 0,
            resolvedBugs: 0,
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            avgBugReportCompleteness: 0,
            bugReportsWithAttachments: 0,
            bugReproductionRate: 0,
            weeklyReportsGenerated: 0,
            monthlyReportsGenerated: 0,
            avgBugsPerReport: 0,
            ...bugMetrics
        };

        // Default values for test metrics
        const testMetricsWithDefaults = {
            totalTestCases: 0,
            manualTestCases: 0,
            automatedTestCases: 0,
            aiGeneratedTestCases: 0,
            testCasesWithTags: 0,
            testCasesLinkedToBugs: 0,
            testCasesWithRecordings: 0,
            functionalCoverage: 0,
            edgeCaseCoverage: 0,
            negativeCaseCoverage: 0,
            aiGenerationSuccessRate: 0,
            avgTestCasesPerAIGeneration: 0,
            outdatedTestCases: 0,
            recentlyUpdatedTestCases: 0,
            testCaseUpdateFrequency: 0,
            passRate: 0,
            failRate: 0,
            executionCount: 0,
            avgExecutionTime: 0,
            ...testMetrics
        };

        // Calculate pass rate if we have execution data
        const calculatedPassRate = testMetricsWithDefaults.executionCount > 0
            ? Math.round(((testMetricsWithDefaults.executionCount - (testMetricsWithDefaults.failRate || 0)) / testMetricsWithDefaults.executionCount) * 100)
            : testMetricsWithDefaults.passRate || 0;

        return {
            ...bugMetricsWithDefaults,
            ...testMetricsWithDefaults,
            passRate: calculatedPassRate,
            // Calculate additional derived metrics
            automationRate: testMetricsWithDefaults.totalTestCases > 0
                ? Math.round((testMetricsWithDefaults.automatedTestCases / testMetricsWithDefaults.totalTestCases) * 100)
                : 0,
            aiContributionRate: testMetricsWithDefaults.totalTestCases > 0
                ? Math.round((testMetricsWithDefaults.aiGeneratedTestCases / testMetricsWithDefaults.totalTestCases) * 100)
                : 0,
            avgCoverage: Math.round((testMetricsWithDefaults.functionalCoverage + testMetricsWithDefaults.edgeCaseCoverage + testMetricsWithDefaults.negativeCaseCoverage) / 3),
            qualityScore: testMetricsWithDefaults.totalTestCases > 0
                ? Math.round(((testMetricsWithDefaults.testCasesWithTags + testMetricsWithDefaults.testCasesWithRecordings) / (testMetricsWithDefaults.totalTestCases * 2)) * 100)
                : 0
        };
    }, [bugMetrics, testMetrics]);

    // Summary stats for the top cards
    const summaryStats = useMemo(() => ({
        totalTestCases: enhancedMetrics.totalTestCases,
        activeBugs: enhancedMetrics.totalBugs - (enhancedMetrics.resolvedBugs || 0),
        passRate: enhancedMetrics.passRate,
        criticalIssues: enhancedMetrics.criticalBugs || 0,
    }), [enhancedMetrics]);

    // Handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleRefresh = useCallback(async () => {
        try {
            const refreshPromises = [refetchSuites?.()];
            
            if (bugRefetch) {
                refreshPromises.push(bugRefetch());
            }
            
            if (refreshTestMetrics) {
                refreshPromises.push(refreshTestMetrics());
            }

            await Promise.all(refreshPromises);
            setCurrentTime(new Date());
            
            addNotification({
                type: 'success',
                title: 'Data Refreshed',
                message: 'Dashboard data has been updated.',
            });
        } catch (error) {
            console.error('Refresh error:', error);
            addNotification({
                type: 'error',
                title: 'Refresh Failed',
                message: 'Failed to refresh dashboard data. Please try again.',
                persistent: true,
            });
        }
    }, [bugRefetch, refreshTestMetrics, refetchSuites, addNotification]);

    const FilterButton = useCallback(
        ({ active, onClick, children, disabled = false }) => (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : active
                            ? 'bg-teal-100 text-teal-700 border border-teal-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                aria-pressed={active}
                aria-disabled={disabled}
            >
                {children}
            </button>
        ),
        [],
    );

    const timeFilterOptions = [
        { value: '1d', label: 'Last 24h' },
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: '30 days' },
        { value: '90d', label: '90 days' },
        { value: 'all', label: 'All time' },
    ];

    const tabOptions = [
        { value: 'overview', label: 'Overview', icon: TrendingUp },
        { value: 'testing', label: 'Testing', icon: TestTube },
        { value: 'bugs', label: 'Bug Tracking', icon: Bug },
        { value: 'ai', label: 'AI Generation', icon: Activity },
        { value: 'automation', label: 'Automation', icon: Settings },
    ];

    const isLoading = bugLoading || suiteLoading || subscriptionLoading || testMetricsLoading;
    const hasErrors = bugError || suiteError || testMetricsError;

    const toolbar = (
        <div className="flex items-center">
            <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                title="Refresh Data"
                aria-label="Refresh dashboard data"
            >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );

    return (
        <PageLayout title="Intelligent Dashboard" toolbar={toolbar} requiresTestSuite={true}>
            <div className="space-y-6">
                {/* Status Bar */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                                    aria-label={isConnected ? 'Connected' : 'Offline'}
                                ></div>
                                <span>{isConnected ? 'Connected' : 'Offline'}</span>
                            </div>
                            <span>•</span>
                            <span>Updated: {currentTime.toLocaleTimeString()}</span>
                            {testMetricsLastUpdated && (
                                <>
                                    <span>•</span>
                                    <span>Metrics: {testMetricsLastUpdated.toLocaleTimeString()}</span>
                                </>
                            )}
                            {isLoading && (
                                <>
                                    <span>•</span>
                                    <span className="text-teal-600">Refreshing...</span>
                                </>
                            )}
                        </div>
                        {suites?.length > 0 && (
                            <div className="text-sm text-teal-600 font-medium">
                                {suites.length} Test Suite{suites.length !== 1 ? 's' : ''} Active
                            </div>
                        )}
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
                        {tabOptions.map((tab) => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded transition-colors whitespace-nowrap ${activeTab === tab.value
                                            ? 'bg-teal-100 text-teal-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    aria-current={activeTab === tab.value ? 'page' : undefined}
                                >
                                    <IconComponent className="w-4 h-4 mr-2" aria-hidden="true" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                                <div className="flex space-x-1">
                                    {timeFilterOptions.map((option) => (
                                        <FilterButton
                                            key={option.value}
                                            active={filters.timeRange === option.value}
                                            onClick={() => handleFilterChange('timeRange', option.value)}
                                            disabled={isLoading}
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
                                    disabled={isLoading}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    aria-label="Select priority"
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
                                    disabled={isLoading}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    aria-label="Select status"
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
                                    disabled={isLoading}
                                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                    aria-label="Select source"
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

                {/* Error Messages */}
                {hasErrors && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" aria-hidden="true" />
                            <div className="text-yellow-800">
                                {testMetricsError && (
                                    <p className="mb-2">Test metrics error: {testMetricsError?.message || testMetricsError}</p>
                                )}
                                {bugError && (
                                    <p className="mb-2">
                                        {bugError.includes('permission')
                                            ? 'You lack permission to view bug tracking data. Contact your organization admin to be added as a member.'
                                            : `Bug tracking error: ${bugError}`}
                                    </p>
                                )}
                                {suiteError && (
                                    <p className="mb-2">Suite error: {suiteError}</p>
                                )}
                                <button
                                    onClick={handleRefresh}
                                    className="underline hover:no-underline"
                                    aria-label="Try refreshing data"
                                >
                                    Try refreshing
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            <QAIDMetricsOverview metrics={enhancedMetrics} loading={isLoading} />
                            <QAIDCharts metrics={enhancedMetrics} loading={isLoading} />
                            <TeamProductivity metrics={enhancedMetrics} loading={isLoading} />
                        </>
                    )}
                    {activeTab === 'testing' && (
                        <>
                            <TestCaseMetrics 
                                suiteId={currentSuiteId} 
                                sprintId={null}
                                options={{
                                    autoRefresh: true,
                                    refreshInterval: 30000,
                                    enableRealtime: true,
                                    includeExecutions: true
                                }}
                            />
                            <RecordingMetrics
                                metrics={{
                                    totalRecordings: enhancedMetrics.testCasesWithRecordings || 0,
                                    successfulRecordings: Math.round((enhancedMetrics.testCasesWithRecordings || 0) * 0.9),
                                    bugsFromRecordings: enhancedMetrics.bugsFromScreenRecording || 0,
                                }}
                                loading={isLoading}
                            />
                        </>
                    )}
                    {activeTab === 'bugs' && (
                        <BugTrackingMetrics filters={filters} loading={isLoading} error={bugError} />
                    )}
                    {activeTab === 'ai' && (
                        <AIGenerationMetrics
                            metrics={{
                                totalGenerations: enhancedMetrics.aiGeneratedTestCases || 0,
                                successRate: enhancedMetrics.aiGenerationSuccessRate || 0,
                                avgTestCasesPerGeneration: enhancedMetrics.avgTestCasesPerAIGeneration || 0,
                                aiContributionRate: enhancedMetrics.aiContributionRate || 0,
                            }}
                            loading={isLoading}
                        />
                    )}
                    {activeTab === 'automation' && (
                        <AutomationMetrics
                            metrics={{
                                automatedTests: enhancedMetrics.automatedTestCases || 0,
                                automationCoverage: enhancedMetrics.automationRate || 0,
                                totalTestCases: enhancedMetrics.totalTestCases || 0,
                                manualTests: enhancedMetrics.manualTestCases || 0,
                            }}
                            loading={isLoading}
                        />
                    )}
                </div>

                {/* Quick Actions */}
                <QuickActions
                    metrics={{
                        qa: {
                            testCases: enhancedMetrics.totalTestCases,
                            passRate: enhancedMetrics.passRate,
                            automationRate: enhancedMetrics.automationRate,
                        },
                        bugs: enhancedMetrics,
                    }}
                    loading={isLoading}
                    onRefresh={handleRefresh}
                />
            </div>
        </PageLayout>
    );
};

export default Dashboard;