'use client'
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Activity, Settings, RotateCcw, AlertCircle, TrendingUp, Bug, TestTube, Plus } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

// Import QAID-specific components
import QAIDMetricsOverview from '@/components/stats/QAIDMetricsOverview';
import TestCaseMetrics from '@/components/stats/TestCaseMetrics';
import BugTrackingMetrics from '@/components/stats/BugTrackingMetrics';
import AIGenerationMetrics from '@/components/stats/AIGenerationMetrics';
import RecordingMetrics from '@/components/stats/RecordingsMetrics';
import AutomationMetrics from '@/components/stats/AutomationMetrics';
import TeamProductivity from '@/components/stats/TeamProductivity';
import QAIDCharts from '@/components/stats/QAIDCharts';
import QuickActions from '@/components/stats/QuickActions';
import CreateTestSuiteModal from '@/components/modals/CreateTestSuiteModal';

// Import context and services
import { useSuite } from '@/contexts/SuiteContext';
import { useBugTrackingMetrics } from '@/services/bugTrackingService';
import { useApp } from '@/contexts/AppProvider';

export default function DashboardPage() {
    // AppProvider context for app-wide state
    const { isInitialized } = useApp();

    // SuiteContext for test suite management
    const {
        suites,
        isLoading: suiteLoading,
        error: suiteError,
        refetchSuites,
        createTestSuite,
        canCreateSuite,
        shouldFetchSuites,
    } = useSuite();

    const [filters, setFilters] = useState({
        timeRange: '7d',
        component: 'all',
        severity: 'all',
        priority: 'all',
        status: 'all',
        source: 'all',
        team: 'all',
        feature: 'all',
        sprint: 'all',
    });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConnected, setIsConnected] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showFirstSuiteModal, setShowFirstSuiteModal] = useState(false);
    const [firstSuiteCreated, setFirstSuiteCreated] = useState(false); // New state to track first suite creation

    const timeIntervalRef = useRef(null);
    const refreshIntervalRef = useRef(null);
    const firstSuiteCheckRef = useRef(false);

    // Bug tracking metrics
    const { metrics: bugMetrics, loading: bugLoading, error: bugError, refetch: bugRefetch } = useBugTrackingMetrics(filters);

    const loading = bugLoading || suiteLoading;
    const error = bugError || suiteError;

    // Enhanced logic for first suite modal
    const shouldShowFirstSuiteModal = useMemo(() => {
        // If first suite was already created, never show modal again
        if (firstSuiteCreated) {
            return false;
        }

        // If we've already shown the modal, don't show it again
        if (firstSuiteCheckRef.current) {
            return false;
        }

        // Must be able to fetch suites
        if (!shouldFetchSuites) {
            return false;
        }

        // Must not be loading
        if (suiteLoading) {
            return false;
        }

        // Must be able to create suites
        if (!canCreateSuite) {
            return false;
        }

        // Must have no suites
        if (!Array.isArray(suites) || suites.length > 0) {
            return false;
        }

        return true;
    }, [shouldFetchSuites, suiteLoading, suites, canCreateSuite, firstSuiteCreated]);

    // Show first suite modal when conditions are met
    useEffect(() => {
        if (shouldShowFirstSuiteModal) {
            console.log('Showing first suite modal');
            setShowFirstSuiteModal(true);
            firstSuiteCheckRef.current = true;
        }
    }, [shouldShowFirstSuiteModal]);

    // Hide first suite modal when suites are available
    useEffect(() => {
        if (showFirstSuiteModal && Array.isArray(suites) && suites.length > 0) {
            console.log('Hiding first suite modal - suites available:', suites.length);
            setShowFirstSuiteModal(false);
            setFirstSuiteCreated(true);
        }
    }, [suites, showFirstSuiteModal]);

    // Auto-refresh and time update
    useEffect(() => {
        if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

        timeIntervalRef.current = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        if (autoRefresh && bugRefetch) {
            refreshIntervalRef.current = setInterval(() => {
                bugRefetch();
            }, 30000);
        }

        return () => {
            if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [autoRefresh, bugRefetch]);

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

    // Enhanced metrics
    const enhancedMetrics = useMemo(() => {
        if (!bugMetrics) {
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
                avgBugsPerReport: 0,
            };
        }

        return {
            totalTestCases: 245,
            passRate: 87,
            ...bugMetrics,
            activeBugs: Array.isArray(bugMetrics.bugs)
                ? bugMetrics.bugs.filter((bug) => !['Resolved', 'Closed'].includes(bug.status)).length
                : bugMetrics.activeBugs ?? 0,
            criticalIssues: bugMetrics.criticalBugs || 0,
            bugsFromManualTesting:
                bugMetrics.bugsFromManualTesting ||
                Math.max(0, (bugMetrics.totalBugs || 0) - (bugMetrics.bugsFromScreenRecording || 0)),
            avgBugReportCompleteness: bugMetrics.avgBugReportCompleteness || 75,
            bugReproductionRate:
                bugMetrics.bugReproductionRate ||
                (bugMetrics.totalBugs > 0
                    ? Math.round(((bugMetrics.bugsWithVideoEvidence || 0) / bugMetrics.totalBugs) * 100)
                    : 0),
            weeklyReportsGenerated: bugMetrics.weeklyReportsGenerated || 4,
            monthlyReportsGenerated: bugMetrics.monthlyReportsGenerated || 1,
            avgBugsPerReport:
                bugMetrics.avgBugsPerReport ||
                (bugMetrics.totalBugs > 0 ? Math.round(bugMetrics.totalBugs / 5) : 0),
        };
    }, [bugMetrics]);

    // Summary stats
    const summaryStats = useMemo(() => ({
        totalTestCases: enhancedMetrics.totalTestCases,
        activeBugs: enhancedMetrics.activeBugs,
        passRate: enhancedMetrics.passRate,
        criticalIssues: enhancedMetrics.criticalIssues,
    }), [enhancedMetrics]);

    // Callbacks
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleRefresh = useCallback(() => {
        if (bugRefetch) bugRefetch();
        setCurrentTime(new Date());
        if (refetchSuites) refetchSuites(true);
    }, [bugRefetch, refetchSuites]);

    const handleCreateNewSuite = useCallback(() => {
        if (!canCreateSuite) {
            alert('Suite creation limit reached. Please upgrade your subscription.');
            return;
        }
        setIsCreateModalOpen(true);
    }, [canCreateSuite]);

    const handleCreateModalClose = useCallback(() => {
        setIsCreateModalOpen(false);
    }, []);

    const handleFirstSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                console.log('Creating first suite:', suiteData);
                await createTestSuite(suiteData);

                // Mark first suite as created immediately
                setFirstSuiteCreated(true);
                setShowFirstSuiteModal(false);

                // Don't reset the ref - we want to remember we've shown the modal
                // firstSuiteCheckRef.current = false; // Remove this line

                // Refresh suites to get the latest data
                if (refetchSuites) {
                    await refetchSuites(true);
                }
            } catch (error) {
                console.error('Error creating first suite:', error);
                // On error, allow showing the modal again
                setFirstSuiteCreated(false);
                setShowFirstSuiteModal(true);
            }
        },
        [createTestSuite, refetchSuites],
    );

    const handleNewSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                await createTestSuite(suiteData);
                setIsCreateModalOpen(false);
                if (refetchSuites) await refetchSuites(true);
            } catch (error) {
                console.error('Error creating new suite:', error);
            }
        },
        [createTestSuite, refetchSuites],
    );

    const handleAutoRefreshChange = useCallback((e) => {
        setAutoRefresh(e.target.checked);
    }, []);

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

    // Check if app is not initialized
    if (!isInitialized) {
        return (
            <PageLayout title="Dashboard">
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Activity className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-2">Initializing QAID Dashboard</p>
                        <p className="text-sm text-gray-500">Please wait...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    // Loading state while checking suites
    if (suiteLoading && shouldFetchSuites) {
        return (
            <PageLayout title="Dashboard">
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Activity className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-2">Loading QAID Dashboard</p>
                        <p className="text-sm text-gray-500">Checking your test suites...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    // First suite modal - only show if explicitly set to show
    if (showFirstSuiteModal && !firstSuiteCreated) {
        return (
            <PageLayout title="Dashboard">
                <div className="min-h-screen bg-gray-50">
                    <CreateTestSuiteModal
                        isOpen={showFirstSuiteModal}
                        onClose={() => {
                            // Allow closing if user doesn't want to create a suite right now
                            setShowFirstSuiteModal(false);
                            firstSuiteCheckRef.current = true;
                        }}
                        isFirstSuite={true}
                        onSuccess={handleFirstSuiteSuccess}
                    />
                </div>
            </PageLayout>
        );
    }

    // Check if user shouldn't fetch suites
    if (!shouldFetchSuites) {
        return (
            <PageLayout title="Dashboard">
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center max-w-md">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-blue-800 mb-2">Access Restricted</h2>
                            <p className="text-blue-600 mb-4">You do not have permission to access the QAID dashboard.</p>
                        </div>
                    </div>
                </div>
            </PageLayout>
        );
    }

    // Loading state for metrics
    if (loading && !bugMetrics) {
        return (
            <PageLayout title="Dashboard">
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Activity className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-2">Loading QAID Dashboard</p>
                        <p className="text-sm text-gray-500">Fetching latest metrics...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    // Error state
    if (error && !bugMetrics) {
        return (
            <PageLayout title="Dashboard">
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
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Dashboard">
            <div className="min-h-screen bg-gray-50">
                <div className="space-y-6 max-w-8xl mx-auto px-4 py-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    QA Intelligence Dashboard
                                </h1>
                                <div className="flex items-center space-x-6 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                                        ></div>
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
                                    {suites && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                {suites.length} Test Suite{suites.length !== 1 ? 's' : ''}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleCreateNewSuite}
                                    disabled={!canCreateSuite}
                                    className={`px-4 py-2 rounded-md flex items-center shadow-md hover:shadow-lg transition-all duration-200 ${canCreateSuite
                                        ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    title={canCreateSuite ? 'Create new test suite' : 'Suite creation limit reached'}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Suite
                                </button>
                                <label className="flex items-center text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={handleAutoRefreshChange}
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

                        {/* Quick Stats */}
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

                    {/* Navigation Tabs */}
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
                                    >
                                        <IconComponent className="w-4 h-4 mr-2" />
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

                    {/* Error Banner */}
                    {error && bugMetrics && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                <p className="text-yellow-800">
                                    Warning: Some bug tracking data may be outdated due to connection issues.
                                    <button onClick={handleRefresh} className="underline ml-2 hover:no-underline">
                                        Try refreshing
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {activeTab === 'overview' && (
                            <>
                                <QAIDMetricsOverview metrics={enhancedMetrics} loading={false} />
                                <QAIDCharts metrics={enhancedMetrics} loading={false} />
                                <TeamProductivity metrics={enhancedMetrics} loading={false} />
                            </>
                        )}
                        {activeTab === 'testing' && (
                            <>
                                <TestCaseMetrics
                                    metrics={{ totalTestCases: enhancedMetrics.totalTestCases, passRate: enhancedMetrics.passRate }}
                                    loading={false}
                                />
                                <RecordingMetrics
                                    metrics={{
                                        totalRecordings: enhancedMetrics.bugsFromScreenRecording || 52,
                                        successfulRecordings: Math.round((enhancedMetrics.bugsFromScreenRecording || 52) * 0.9),
                                    }}
                                    loading={false}
                                />
                            </>
                        )}
                        {activeTab === 'bugs' && (
                            <BugTrackingMetrics metrics={enhancedMetrics} loading={loading} error={error} />
                        )}
                        {activeTab === 'ai' && (
                            <AIGenerationMetrics
                                metrics={{ totalGenerations: 148, successRate: enhancedMetrics.avgBugReportCompleteness || 94 }}
                                loading={false}
                            />
                        )}
                        {activeTab === 'automation' && (
                            <AutomationMetrics
                                metrics={{
                                    automatedTests: 89,
                                    automationCoverage: Math.round(
                                        enhancedMetrics.totalBugs > 0
                                            ? ((enhancedMetrics.bugsFromScreenRecording || 0) / enhancedMetrics.totalBugs) * 100
                                            : 73,
                                    ),
                                }}
                                loading={false}
                            />
                        )}
                    </div>

                    {/* Quick Actions */}
                    <QuickActions
                        metrics={{ qa: { testCases: enhancedMetrics.testCases, passRate: enhancedMetrics.passRate }, bugs: enhancedMetrics }}
                        loading={false}
                        onRefresh={handleRefresh}
                    />
                </div>

                {/* Create Test Suite Modal */}
                <CreateTestSuiteModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCreateModalClose}
                    isFirstSuite={false}
                    onSuccess={handleNewSuiteSuccess}
                />
            </div>
        </PageLayout>
    );
}
