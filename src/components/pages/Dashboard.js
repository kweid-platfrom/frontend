import React, { useState, useEffect } from 'react';
import { Activity, Settings, RotateCcw } from 'lucide-react';

// Import QAID-specific components (to be created separately)
import QAIDMetricsOverview from '../stats/QAIDMetricsOverview';
import TestCaseMetrics from '../stats/TestCaseMetrics';
import BugTrackingMetrics from '../stats/BugTrackingMetrics';
import AIGenerationMetrics from '../stats/AIGenerationMetrics';
import RecordingMetrics from '../stats/RecordingsMetrics';
import AutomationMetrics from '../stats/AutomationMetrics';
import TeamProductivity from '../stats/TeamProductivity';
import QAIDCharts from '../stats/QAIDCharts';
import QuickActions from '../stats/QuickActions';

// Import existing service
import { useQAIDMetrics } from '../../services/QAIDMetricsService';

const Dashboard = () => {
    const [filters, setFilters] = useState({
        timeRange: '7d',
        component: 'all',
        severity: 'all',
        team: 'all',
        feature: 'all',
        sprint: 'all'
    });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isConnected] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Use the existing QAID metrics service
    const { metrics, loading, error, refetch } = useQAIDMetrics(filters);

    // Real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const FilterButton = ({ active, onClick, children }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                active 
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
        { value: '90d', label: '90 days' }
    ];

    const tabOptions = [
        { value: 'overview', label: 'Overview' },
        { value: 'testing', label: 'Testing' },
        { value: 'bugs', label: 'Bug Tracking' },
        { value: 'ai', label: 'AI Generation' },
        { value: 'automation', label: 'Automation' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Activity className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading QAID metrics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-red-600 mb-4">Error loading metrics: {error}</p>
                        <button 
                            onClick={refetch}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        QA Dashboard
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>Last updated: {currentTime.toLocaleTimeString()}</span>
                        </div>
                        <span>•</span>
                        <span>{metrics?.testCases?.totalTestCases || 0} total test cases</span>
                        <span>•</span>
                        <span>{metrics?.bugs?.totalBugs || 0} active bugs</span>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={refetch}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Refresh
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded shadow-sm border p-1 mb-6">
                <div className="flex space-x-1">
                    {tabOptions.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                                activeTab === tab.value
                                    ? 'bg-teal-100 text-teal-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Time Range:</span>
                        <div className="flex space-x-2">
                            {timeFilterOptions.map(option => (
                                <FilterButton
                                    key={option.value}
                                    active={filters.timeRange === option.value}
                                    onClick={() => setFilters(prev => ({ ...prev, timeRange: option.value }))}
                                >
                                    {option.label}
                                </FilterButton>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Team:</span>
                        <select
                            value={filters.team}
                            onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="all">All Teams</option>
                            <option value="frontend">Frontend</option>
                            <option value="backend">Backend</option>
                            <option value="mobile">Mobile</option>
                            <option value="qa">QA</option>
                        </select>
                        <span className="text-sm font-medium text-gray-700">Feature:</span>
                        <select
                            value={filters.feature}
                            onChange={(e) => setFilters(prev => ({ ...prev, feature: e.target.value }))}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="all">All Features</option>
                            <option value="auth">Authentication</option>
                            <option value="payments">Payments</option>
                            <option value="api">API</option>
                            <option value="ui">User Interface</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    <QAIDMetricsOverview metrics={metrics} />
                    <QAIDCharts metrics={metrics} />
                    <div className=" gap-6">
                        <TeamProductivity metrics={metrics?.team} />
                    </div>
                </>
            )}

            {activeTab === 'testing' && (
                <>
                    <TestCaseMetrics metrics={metrics?.testCases} />
                    <RecordingMetrics metrics={metrics?.recordings} />
                </>
            )}

            {activeTab === 'bugs' && (
                <BugTrackingMetrics metrics={metrics?.bugs} />
            )}

            {activeTab === 'ai' && (
                <AIGenerationMetrics metrics={metrics?.ai} />
            )}

            {activeTab === 'automation' && (
                <AutomationMetrics metrics={metrics?.automation} />
            )}

            {/* Quick Actions - Always visible at bottom */}
            <QuickActions />
        </div>
    );
};

export default Dashboard;