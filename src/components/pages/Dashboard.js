import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Settings, RotateCcw, AlertCircle, TrendingUp, Bug, TestTube } from 'lucide-react';

// Import QAID-specific components
import QAIDMetricsOverview from '../stats/QAIDMetricsOverview';
import TestCaseMetrics from '../stats/TestCaseMetrics';
import BugTrackingMetrics from '../stats/BugTrackingMetrics';
import AIGenerationMetrics from '../stats/AIGenerationMetrics';
import RecordingMetrics from '../stats/RecordingsMetrics';
import AutomationMetrics from '../stats/AutomationMetrics';
import TeamProductivity from '../stats/TeamProductivity';
import QAIDCharts from '../stats/QAIDCharts';
import QuickActions from '../stats/QuickActions';

// Import services - Only bug tracking is active
import { useBugTrackingMetrics } from '../../services/bugTrackingService';

const Dashboard = () => {
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

    // Only use bug tracking metrics - other services are commented out
    const { metrics: bugMetrics, loading: bugLoading, error: bugError, refetch: bugRefetch } = useBugTrackingMetrics(filters);

    // Only bug metrics are active
    const loading = bugLoading;
    const error = bugError;

    // Auto-refresh timer - only refresh bug metrics
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const refreshInterval = autoRefresh ? setInterval(() => {
            bugRefetch(); // Only refresh bug metrics
        }, 30000) : null; // Refresh every 30 seconds if auto-refresh is enabled

        return () => {
            clearInterval(timeInterval);
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, [autoRefresh, bugRefetch]);

    // Connection status simulation
    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(navigator.onLine);
        };

        window.addEventListener('online', checkConnection);
        window.addEventListener('offline', checkConnection);
        
        return () => {
            window.removeEventListener('online', checkConnection);
            window.removeEventListener('offline', checkConnection);
        };
    }, []);

    // Mock data for other metrics to display properly
    const mockMetrics = useMemo(() => ({
        totalTestCases: 245,
        passRate: 87,
        // Real bug data from service
        activeBugs: bugMetrics?.activeBugs || 0,
        criticalIssues: bugMetrics?.criticalBugs || 0
    }), [bugMetrics?.activeBugs, bugMetrics?.criticalBugs]);

    // Summary stats for header using mock data + real bug data
    const summaryStats = useMemo(() => {
        return {
            totalTestCases: mockMetrics.totalTestCases,
            activeBugs: mockMetrics.activeBugs,
            passRate: mockMetrics.passRate,
            criticalIssues: mockMetrics.criticalIssues
        };
    }, [mockMetrics]);

    const FilterButton = ({ active, onClick, children, disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                disabled 
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
        bugRefetch(); // Only refresh bug metrics
        setCurrentTime(new Date());
    };

    // Loading state - only check bug metrics
    if (loading && !bugMetrics) {
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

    // Error state - only check bug metrics
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
        <div className="min-h-screen bg-gray-50">
            <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
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

                    {/* Quick Stats - Using mock data + real bug data */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalTestCases}</div>
                            <div className="text-sm text-blue-600">Total Test Cases</div>
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
                        {tabOptions.map(tab => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                                        activeTab === tab.value
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

                {/* Error Banner - Only show for bug metrics errors */}
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

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            {/* Pass mockMetrics as static data to prevent loading states */}
                            <QAIDMetricsOverview 
                                metrics={{
                                    testCases: mockMetrics.totalTestCases,
                                    passRate: mockMetrics.passRate,
                                    activeBugs: mockMetrics.activeBugs,
                                    criticalBugs: mockMetrics.criticalIssues
                                }} 
                                loading={false} 
                            />
                            <QAIDCharts 
                                metrics={{
                                    testCases: mockMetrics.totalTestCases,
                                    passRate: mockMetrics.passRate,
                                    activeBugs: mockMetrics.activeBugs,
                                    criticalBugs: mockMetrics.criticalIssues
                                }} 
                                loading={false} 
                            />
                            <TeamProductivity 
                                metrics={{
                                    testCases: mockMetrics.totalTestCases,
                                    passRate: mockMetrics.passRate
                                }} 
                                loading={false} 
                            />
                        </>
                    )}

                    {activeTab === 'testing' && (
                        <>
                            {/* Pass mockMetrics as static data to prevent loading states */}
                            <TestCaseMetrics 
                                metrics={{
                                    totalTestCases: mockMetrics.totalTestCases,
                                    passRate: mockMetrics.passRate
                                }} 
                                loading={false} 
                            />
                            <RecordingMetrics 
                                metrics={{
                                    totalRecordings: 52,
                                    successfulRecordings: 47
                                }} 
                                loading={false} 
                            />
                        </>
                    )}

                    {activeTab === 'bugs' && (
                        <>
                            {/* Only bug tracking uses real data */}
                            <BugTrackingMetrics />
                        </>
                    )}

                    {activeTab === 'ai' && (
                        <>
                            {/* Pass mockMetrics as static data to prevent loading states */}
                            <AIGenerationMetrics 
                                metrics={{
                                    totalGenerations: 148,
                                    successRate: 94
                                }} 
                                loading={false} 
                            />
                        </>
                    )}

                    {activeTab === 'automation' && (
                        <>
                            {/* Pass mockMetrics as static data to prevent loading states */}
                            <AutomationMetrics 
                                metrics={{
                                    automatedTests: 89,
                                    automationCoverage: 73
                                }} 
                                loading={false} 
                            />
                        </>
                    )}
                </div>

                {/* Quick Actions - Pass only bug metrics as real data */}
                <QuickActions 
                    metrics={{ 
                        qa: {
                            testCases: mockMetrics.totalTestCases,
                            passRate: mockMetrics.passRate
                        },
                        bugs: bugMetrics 
                    }} 
                    loading={false} 
                    onRefresh={handleRefresh} 
                />
            </div>
        </div>
    );
};

export default Dashboard;