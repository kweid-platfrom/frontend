'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Activity, Settings, RotateCcw, AlertCircle, TrendingUp, Bug, TestTube } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useUI } from '../../hooks/useUI';
import { useApp } from '../../context/AppProvider';
import TipsMode from '../../components/TipsMode';
import QAIDMetricsOverview from '../../components/stats/QAIDMetricsOverview';
import TestCaseMetrics from '../../components/stats/TestCaseMetrics';
import BugTrackingMetrics from '../../components/stats/BugTrackingMetrics';
import AIGenerationMetrics from '../../components/stats/AIGenerationMetrics';
import RecordingMetrics from '../../components/stats/RecordingsMetrics';
import AutomationMetrics from '../../components/stats/AutomationMetrics';
import TeamProductivity from '../../components/stats/TeamProductivity';
import QAIDCharts from '../../components/stats/QAIDCharts';
import QuickActions from '../../components/stats/QuickActions';

const Dashboard = () => {
    const { metrics, loading, error, refresh, dataStatus } = useDashboard();
    const { toggleSidebar, sidebarOpen } = useUI();
    const { 
        state, 
        activeSuite, 
        isTrialActive, 
        currentUser,
        actions 
    } = useApp();
    
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

    // Fixed isInTipsMode logic - only show tips if there's genuinely no data AND no successful data loads
    const isInTipsMode = useMemo(() => {
        // If we don't have an active suite, we might want to show tips
        if (!activeSuite) return true;
        
        // Check if we have any actual data (not just status)
        const hasAnyData = metrics && (
            metrics.totalTestCases > 0 ||
            metrics.activeBugs > 0 ||
            metrics.recordings > 0 ||
            (metrics.recentActivity && metrics.recentActivity.length > 0)
        );

        // Check if at least one data source has loaded successfully
        const hasAnySuccessfulLoad = Object.values(dataStatus).some(status => status === 'loaded');

        // Check if all data sources are either not authenticated or in error state (but not pending)
        const allDataSourcesFailed = Object.values(dataStatus).every(status => 
            status === 'error' || status === 'not-authenticated'
        );

        // Only show tips mode if:
        // 1. We have no data AND
        // 2. Either all data sources failed OR no successful loads have occurred yet AND we're not loading
        return !hasAnyData && (allDataSourcesFailed || (!hasAnySuccessfulLoad && !loading));
    }, [activeSuite, metrics, dataStatus, loading]);

    const isOrganizationAccount = currentUser?.accountType === 'organization' || state?.subscription?.type === 'organization';

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

    // Enhanced metrics calculation combining all data sources
    const enhancedMetrics = useMemo(() => {
        const defaultMetrics = {
            // Test Case Metrics
            testCases: 0,
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
            
            // Bug Tracking Metrics
            bugs: 0,
            totalBugs: 0,
            activeBugs: 0,
            criticalBugs: 0,
            criticalIssues: 0,
            bugsFromScreenRecording: 0,
            bugsFromManualTesting: 0,
            bugsWithVideoEvidence: 0,
            bugsWithConsoleLogs: 0,
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
            
            // Performance Metrics
            recordings: 0,
            passRate: 0,
            failRate: 0,
            executionCount: 0,
            avgExecutionTime: 0,
            automationRate: 0,
            aiContributionRate: 0,
            
            // Activity
            recentActivity: []
        };

        if (!metrics) return defaultMetrics;

        const combined = { ...defaultMetrics, ...metrics };
        
        // Calculate derived metrics
        combined.automationRate = combined.totalTestCases > 0
            ? Math.round((combined.automatedTestCases / combined.totalTestCases) * 100)
            : 0;
        
        combined.aiContributionRate = combined.totalTestCases > 0
            ? Math.round((combined.aiGeneratedTestCases / combined.totalTestCases) * 100)
            : 0;

        // Calculate pass rate if we have execution data
        combined.passRate = combined.executionCount > 0
            ? Math.round(((combined.executionCount - (combined.failRate || 0)) / combined.executionCount) * 100)
            : combined.passRate || 0;

        // Calculate additional derived metrics
        combined.avgCoverage = Math.round((combined.functionalCoverage + combined.edgeCaseCoverage + combined.negativeCaseCoverage) / 3);
        
        combined.qualityScore = combined.totalTestCases > 0
            ? Math.round(((combined.testCasesWithTags + combined.testCasesWithRecordings) / (combined.totalTestCases * 2)) * 100)
            : 0;

        // Bug resolution rate calculation
        combined.bugResolutionRate = combined.totalBugs > 0
            ? Math.round((combined.resolvedBugs / combined.totalBugs) * 100)
            : 0;

        return combined;
    }, [metrics]);

    const summaryStats = useMemo(() => ({
        totalTestCases: enhancedMetrics.totalTestCases || enhancedMetrics.testCases || 0,
        activeBugs: enhancedMetrics.activeBugs || (enhancedMetrics.totalBugs - (enhancedMetrics.resolvedBugs || 0)) || enhancedMetrics.bugs || 0,
        passRate: enhancedMetrics.passRate || 0,
        criticalIssues: enhancedMetrics.criticalBugs || enhancedMetrics.criticalIssues || 0,
    }), [enhancedMetrics]);

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleRefresh = useCallback(async () => {
        try {
            await refresh?.();
            setCurrentTime(new Date());
            
            if (actions?.ui?.showNotification) {
                actions.ui.showNotification({
                    type: 'success',
                    title: 'Data Refreshed',
                    message: 'Dashboard data has been updated.',
                });
            }
        } catch (error) {
            console.error('Refresh error:', error);
            if (actions?.ui?.showNotification) {
                actions.ui.showNotification({
                    type: 'error',
                    title: 'Refresh Failed',
                    message: 'Failed to refresh dashboard data. Please try again.',
                    persistent: true,
                });
            }
        }
    }, [refresh, actions]);

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

    // Helper function to render data section based on status
    const renderDataSection = useCallback((status, pendingContent, errorContent, successContent) => {
        switch (status) {
            case 'pending':
                return (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="animate-pulse flex items-center">
                            <div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>
                            <div className="text-gray-600">{pendingContent}</div>
                        </div>
                    </div>
                );
            case 'error':
            case 'not-authenticated':
                return (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                            <p className="text-yellow-800">{errorContent}</p>
                        </div>
                    </div>
                );
            case 'loaded':
            default:
                return successContent;
        }
    }, []);

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

    const trialDaysRemaining = state?.subscription?.trialDaysRemaining || 0;
    const hasErrors = error;

    const headerActionButtons = (
        <div className="flex items-center space-x-3">
            <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                title="Refresh Data"
                aria-label="Refresh dashboard data"
            >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
                {sidebarOpen ? 'Close' : 'Open'} Sidebar
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeSuite ? `${activeSuite.name} Dashboard` : 'Intelligent QA Dashboard'}
                    </h1>
                    {headerActionButtons}
                </div>

                {isInTipsMode ? (
                    <TipsMode 
                        activeSuite={activeSuite} 
                        isTrialActive={isTrialActive} 
                        trialDaysRemaining={trialDaysRemaining} 
                        isOrganizationAccount={isOrganizationAccount} 
                    />
                ) : (
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
                                    {loading && (
                                        <>
                                            <span>•</span>
                                            <span className="text-teal-600">Refreshing...</span>
                                        </>
                                    )}
                                </div>
                                {activeSuite && (
                                    <div className="text-sm text-teal-600 font-medium">
                                        Suite: {activeSuite.name}
                                    </div>
                                )}
                            </div>
                            
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-teal-600">{summaryStats.totalTestCases}</div>
                                    <div className="text-sm text-teal-600">Total Test Cases</div>
                                    {dataStatus.testCases === 'pending' && (
                                        <div className="text-xs text-gray-500 mt-1">Loading...</div>
                                    )}
                                    {dataStatus.testCases === 'error' && (
                                        <div className="text-xs text-red-500 mt-1">Error loading</div>
                                    )}
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-green-600">{summaryStats.passRate}%</div>
                                    <div className="text-sm text-green-600">Pass Rate</div>
                                    {dataStatus.testCases === 'pending' && (
                                        <div className="text-xs text-gray-500 mt-1">Loading...</div>
                                    )}
                                    {dataStatus.testCases === 'error' && (
                                        <div className="text-xs text-red-500 mt-1">Error loading</div>
                                    )}
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-orange-600">{summaryStats.activeBugs}</div>
                                    <div className="text-sm text-orange-600">Active Bugs</div>
                                    {dataStatus.bugs === 'pending' && (
                                        <div className="text-xs text-gray-500 mt-1">Loading...</div>
                                    )}
                                    {dataStatus.bugs === 'error' && (
                                        <div className="text-xs text-red-500 mt-1">Error loading</div>
                                    )}
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-red-600">{summaryStats.criticalIssues}</div>
                                    <div className="text-sm text-red-600">Critical Issues</div>
                                    {dataStatus.bugs === 'pending' && (
                                        <div className="text-xs text-gray-500 mt-1">Loading...</div>
                                    )}
                                    {dataStatus.bugs === 'error' && (
                                        <div className="text-xs text-red-500 mt-1">Error loading</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trial Banner */}
                        {isTrialActive && trialDaysRemaining > 0 && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow rounded-lg p-6">
                                <p className="text-gray-600">
                                    🎉 Trial active: {trialDaysRemaining} days remaining
                                </p>
                            </div>
                        )}

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
                                            disabled={loading}
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
                                            disabled={loading}
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
                                        <p className="mb-2">Error loading some dashboard data: {error}</p>
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
                                    <QAIDMetricsOverview metrics={enhancedMetrics} loading={loading} />
                                    <QAIDCharts metrics={enhancedMetrics} loading={loading} />
                                    <TeamProductivity metrics={enhancedMetrics} loading={loading} />
                                </>
                            )}

                            {activeTab === 'testing' && (
                                <>
                                    <TestCaseMetrics 
                                        suiteId={activeSuite?.id} 
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
                                            totalRecordings: enhancedMetrics.testCasesWithRecordings || enhancedMetrics.recordings || 0,
                                            successfulRecordings: Math.round((enhancedMetrics.testCasesWithRecordings || enhancedMetrics.recordings || 0) * 0.9),
                                            bugsFromRecordings: enhancedMetrics.bugsFromScreenRecording || 0,
                                        }}
                                        loading={loading}
                                    />
                                </>
                            )}

                            {activeTab === 'bugs' && (
                                <BugTrackingMetrics filters={filters} loading={loading} error={error} />
                            )}

                            {activeTab === 'ai' && (
                                <AIGenerationMetrics
                                    metrics={{
                                        totalGenerations: enhancedMetrics.aiGeneratedTestCases || 0,
                                        successRate: enhancedMetrics.aiGenerationSuccessRate || 0,
                                        avgTestCasesPerGeneration: enhancedMetrics.avgTestCasesPerAIGeneration || 0,
                                        aiContributionRate: enhancedMetrics.aiContributionRate || 0,
                                    }}
                                    loading={loading}
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
                                    loading={loading}
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
                            loading={loading}
                            onRefresh={handleRefresh}
                        />

                        {/* Recent Activity Section */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                            {renderDataSection(
                                dataStatus.activity,
                                'Loading activity data...',
                                'No activity data available',
                                <div>
                                    {enhancedMetrics.recentActivity.length === 0 ? (
                                        <p className="text-gray-600 text-center py-4">No recent activity to display</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {enhancedMetrics.recentActivity.map((activity, index) => (
                                                <li key={index} className="flex items-start">
                                                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                                    <div>
                                                        <p className="text-sm text-gray-900">
                                                            <strong>{activity.action || 'Unknown action'}</strong> in {activity.suiteName || 'Unnamed Suite'}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {activity.timestamp?.toDate
                                                                ? activity.timestamp.toDate().toLocaleString()
                                                                : new Date(activity.timestamp || Date.now()).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;