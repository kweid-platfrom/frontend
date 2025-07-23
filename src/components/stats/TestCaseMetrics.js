import React from 'react';
import { CheckCircle, Clock, Zap, Bot, Tags, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useTestMetrics } from '../../hooks/old-hooks/useTestCaseMetrics';

const TestCaseMetrics = ({ suiteId, sprintId = null, options = {} }) => {
    const {
        metrics,
        loading,
        error,
        lastUpdated,
        refresh,
        isRealtime
    } = useTestMetrics(suiteId, sprintId, {
        autoRefresh: true,
        refreshInterval: 30000,
        enableRealtime: true,
        includeExecutions: false,
        ...options
    });

    // Handle loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Test Case Management</h2>
                    <div className="flex items-center text-sm text-gray-500">
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Loading metrics...
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Test Case Management</h2>
                    <button
                        onClick={refresh}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                    </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Metrics</h3>
                            <p className="text-sm text-red-600 mt-1">
                                {error?.message || 'Failed to load test case metrics. Please try again.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Extract metrics with fallback values
    const {
        totalTestCases = 0,
        manualTestCases = 0,
        automatedTestCases = 0,
        aiGeneratedTestCases = 0,
        testCasesWithTags = 0,
        testCasesLinkedToBugs = 0,
        testCasesWithRecordings = 0,
        functionalCoverage = 0,
        edgeCaseCoverage = 0,
        negativeCaseCoverage = 0,
        aiGenerationSuccessRate = 0,
        avgTestCasesPerAIGeneration = 0,
        outdatedTestCases = 0,
        recentlyUpdatedTestCases = 0,
        testCaseUpdateFrequency = 0,
        trends = {}
    } = metrics || {};

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend = null }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString()}</p>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );

    const ProgressBar = ({ label, value, total, color = "blue" }) => {
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{value} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Test Case Management</h2>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                        Total: {totalTestCases.toLocaleString()} test cases
                    </div>
                    {lastUpdated && (
                        <div className="text-xs text-gray-400">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                    {isRealtime && (
                        <div className="flex items-center text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Live
                        </div>
                    )}
                    <button
                        onClick={refresh}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Test Cases"
                    value={totalTestCases}
                    subtitle="All test cases created"
                    icon={CheckCircle}
                    color="blue"
                    trend={trends.totalTestCases}
                />
                <MetricCard
                    title="Manual Tests"
                    value={manualTestCases}
                    subtitle={`${totalTestCases > 0 ? Math.round((manualTestCases / totalTestCases) * 100) : 0}% of total`}
                    icon={Clock}
                    color="orange"
                    trend={trends.manualTestCases}
                />
                <MetricCard
                    title="Automated Tests"
                    value={automatedTestCases}
                    subtitle={`${totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0}% automated`}
                    icon={Zap}
                    color="green"
                    trend={trends.automatedTestCases}
                />
                <MetricCard
                    title="AI Generated"
                    value={aiGeneratedTestCases}
                    subtitle={`${avgTestCasesPerAIGeneration} avg per generation`}
                    icon={Bot}
                    color="purple"
                    trend={trends.aiGeneratedTestCases}
                />
            </div>

            {/* Test Case Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Case Types */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Tags className="w-5 h-5 mr-2 text-blue-600" />
                        Test Case Distribution
                    </h3>
                    <div className="space-y-4">
                        <ProgressBar
                            label="Manual Test Cases"
                            value={manualTestCases}
                            total={totalTestCases}
                            color="orange"
                        />
                        <ProgressBar
                            label="Automated Test Cases"
                            value={automatedTestCases}
                            total={totalTestCases}
                            color="green"
                        />
                        <ProgressBar
                            label="AI Generated"
                            value={aiGeneratedTestCases}
                            total={totalTestCases}
                            color="purple"
                        />
                    </div>
                </div>

                {/* Coverage Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Analysis</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                                <p className="font-medium text-blue-900">Functional Coverage</p>
                                <p className="text-sm text-blue-600">Core functionality tests</p>
                            </div>
                            <div className="text-2xl font-bold text-blue-700">{functionalCoverage}%</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <div>
                                <p className="font-medium text-yellow-900">Edge Case Coverage</p>
                                <p className="text-sm text-yellow-600">Boundary & edge cases</p>
                            </div>
                            <div className="text-2xl font-bold text-yellow-700">{edgeCaseCoverage}%</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div>
                                <p className="font-medium text-red-900">Negative Testing</p>
                                <p className="text-sm text-red-600">Error & failure scenarios</p>
                            </div>
                            <div className="text-2xl font-bold text-red-700">{negativeCaseCoverage}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality & Enhancement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Case Quality</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">With Tags</span>
                            <span className="font-medium">{testCasesWithTags}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Linked to Bugs</span>
                            <span className="font-medium">{testCasesLinkedToBugs}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">With Recordings</span>
                            <span className="font-medium">{testCasesWithRecordings}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Generation</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Success Rate</span>
                            <span className="font-medium text-green-600">{aiGenerationSuccessRate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg per Generation</span>
                            <span className="font-medium">{avgTestCasesPerAIGeneration}</span>
                        </div>
                        <div className="text-xs text-gray-500 pt-2">
                            AI generates {avgTestCasesPerAIGeneration} test cases per successful attempt
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Outdated</span>
                            <span className="font-medium text-red-600">{outdatedTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Recently Updated</span>
                            <span className="font-medium text-green-600">{recentlyUpdatedTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Updates/Week</span>
                            <span className="font-medium">{testCaseUpdateFrequency}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Case Health Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Case Health Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {totalTestCases > 0 ? Math.round(((testCasesWithTags + testCasesWithRecordings) / (totalTestCases * 2)) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Quality Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Automation Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {totalTestCases > 0 ? Math.round((aiGeneratedTestCases / totalTestCases) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">AI Contribution</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {totalTestCases > 0 ? Math.round(((functionalCoverage + edgeCaseCoverage + negativeCaseCoverage) / 3)) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Coverage</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCaseMetrics;