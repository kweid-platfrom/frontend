import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Zap, Bot, Tags, TrendingUp, RefreshCw, AlertCircle, DollarSign, Timer, Target, Sparkles } from 'lucide-react';
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor';
import { useDashboard } from '../../hooks/useDashboard';
import { calculateSuiteAIMetrics } from '../../services/aiMetricsService';

const TestCaseMetrics = ({
    suiteId,
    lastUpdated = null,
    isRealtime = false
}) => {
    const { metrics: rawMetrics, loading: metricsLoading, error: metricsError, refresh: refreshMetrics } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);
    
    const [aiMetrics, setAiMetrics] = useState(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiError, setAiError] = useState(null);

    const fetchAIMetrics = async () => {
        if (!suiteId) return;
        
        setAiLoading(true);
        setAiError(null);
        
        try {
            const result = await calculateSuiteAIMetrics(suiteId, 30);
            if (result.success) {
                setAiMetrics(result.data);
            } else {
                setAiError(new Error(result.error));
                setAiMetrics(result.data); // Use default metrics
            }
        } catch (err) {
            setAiError(err);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        fetchAIMetrics();
    }, [suiteId]);

    const handleRefresh = () => {
        refreshMetrics();
        fetchAIMetrics();
    };

    const loading = metricsLoading || aiLoading;
    const error = metricsError || aiError;

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-green-50',
                text: 'text-green-600',
                bar: 'bg-green-500',
                border: 'border-green-200'
            },
            info: {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                bar: 'bg-blue-500',
                border: 'border-blue-200'
            },
            warning: {
                bg: 'bg-yellow-50',
                text: 'text-yellow-600',
                bar: 'bg-yellow-500',
                border: 'border-yellow-200'
            },
            error: {
                bg: 'bg-red-50',
                text: 'text-red-600',
                bar: 'bg-red-500',
                border: 'border-red-200'
            },
            purple: {
                bg: 'bg-purple-50',
                text: 'text-purple-600',
                bar: 'bg-purple-500',
                border: 'border-purple-200'
            }
        };
        return colorMap[color] || colorMap.info;
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Test Case & AI Metrics</h2>
                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                            <div className="w-32 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Test Case & AI Metrics</h2>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Metrics</h3>
                            <p className="text-sm text-red-600 mt-1">
                                {error?.message || 'Failed to load metrics. Please try again.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const {
        totalTestCases = 0,
        manualTestCases = 0,
        automatedTestCases = 0,
        testCasesWithTags = 0,
        testCasesLinkedToBugs = 0,
        testCasesWithRecordings = 0,
        functionalCoverage = 0,
        edgeCaseCoverage = 0,
        negativeCaseCoverage = 0,
        outdatedTestCases = 0,
        recentlyUpdatedTestCases = 0,
        automationRate = 0,
        avgCoverage = 0,
        testCaseQualityScore = 0
    } = metrics;
    
    // Use AI metrics data for AI-related counts
    const aiGeneratedTestCases = aiMetrics?.totalTestCasesGenerated || 0;
    const aiContributionRate = totalTestCases > 0 
        ? Math.round((aiGeneratedTestCases / totalTestCases) * 100) 
        : 0;

    const {
        totalTestCasesGenerated = 0,
        totalBugReportsGenerated = 0,
        totalAIGenerations = 0,
        totalOperations = 0,
        successfulOperations = 0,
        failedOperations = 0,
        overallSuccessRate = 0,
        totalTokensUsed = 0,
        totalCost = 0,
        totalTimeSavedHours = 0,
        costEfficiency = 0,
        estimatedROI = 0,
        efficiencyScore = 0,
        qualityScore = 0,
        productivityIncrease = 0,
        operationsByType = {},
        providerUsage = {},
        averageTestCasesPerGeneration = 0,
        averageTokensPerOperation = 0,
        averageCostPerOperation = 0,
        automationCandidates = 0,
        criticalBugsIdentified = 0
    } = aiMetrics || {};

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "info", badge = null }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {badge && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString ? value.toLocaleString() : value}</p>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, value, total, color = "info" }) => {
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        const colors = getColorClasses(color);
        return (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{value} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors.bar}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Test Case & AI Metrics</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Comprehensive testing and AI automation insights
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    {lastUpdated && (
                        <div className="text-xs text-gray-500">
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
                        onClick={handleRefresh}
                        className="flex items-center px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Test Case Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Test Cases"
                    value={totalTestCases}
                    subtitle="All test cases"
                    icon={CheckCircle}
                    color="info"
                />
                <MetricCard
                    title="Manual Tests"
                    value={manualTestCases}
                    subtitle={`${100 - automationRate}% of total`}
                    icon={Clock}
                    color="warning"
                />
                <MetricCard
                    title="Automated Tests"
                    value={automatedTestCases}
                    subtitle={`${automationRate}% automated`}
                    icon={Zap}
                    color="success"
                />
                <MetricCard
                    title="AI Generated"
                    value={aiGeneratedTestCases}
                    subtitle={`${aiContributionRate}% of total`}
                    icon={Bot}
                    color="purple"
                    badge="AI"
                />
            </div>

            {/* AI Performance Metrics */}
            {aiMetrics && totalAIGenerations > 0 && (
                <>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
                        <div className="flex items-center mb-6">
                            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
                            <h3 className="text-xl font-bold text-gray-900">AI Performance Overview</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <div className="text-3xl font-bold text-purple-600">{efficiencyScore}</div>
                                <div className="text-sm text-gray-600 mt-1">Efficiency Score</div>
                                <div className="text-xs text-gray-500 mt-1">Out of 100</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                                <div className="text-3xl font-bold text-blue-600">{qualityScore}</div>
                                <div className="text-sm text-gray-600 mt-1">Quality Score</div>
                                <div className="text-xs text-gray-500 mt-1">AI generation quality</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-green-100">
                                <div className="text-3xl font-bold text-green-600">{overallSuccessRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600 mt-1">Success Rate</div>
                                <div className="text-xs text-gray-500 mt-1">{successfulOperations}/{totalOperations} ops</div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-yellow-100">
                                <div className="text-3xl font-bold text-yellow-600">{productivityIncrease.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600 mt-1">Productivity Gain</div>
                                <div className="text-xs text-gray-500 mt-1">Time efficiency</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Generation Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Test Cases Generated"
                            value={totalTestCasesGenerated}
                            subtitle={`${averageTestCasesPerGeneration.toFixed(1)} per generation`}
                            icon={Bot}
                            color="purple"
                        />
                        <MetricCard
                            title="Bug Reports Generated"
                            value={totalBugReportsGenerated}
                            subtitle={`${criticalBugsIdentified} critical bugs`}
                            icon={AlertCircle}
                            color="error"
                        />
                        <MetricCard
                            title="Total AI Operations"
                            value={totalAIGenerations}
                            subtitle={`${totalOperations} total requests`}
                            icon={Zap}
                            color="info"
                        />
                        <MetricCard
                            title="Automation Candidates"
                            value={automationCandidates}
                            subtitle="Ready for automation"
                            icon={Target}
                            color="success"
                        />
                    </div>

                    {/* Cost & Value Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                Cost Analysis
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Cost</span>
                                    <span className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Avg per Operation</span>
                                    <span className="text-sm font-medium text-gray-900">${averageCostPerOperation.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Tokens</span>
                                    <span className="text-sm font-medium text-gray-900">{totalTokensUsed.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Avg Tokens/Op</span>
                                    <span className="text-sm font-medium text-gray-900">{averageTokensPerOperation.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Timer className="w-5 h-5 mr-2 text-blue-600" />
                                Time Savings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Hours Saved</span>
                                    <span className="text-2xl font-bold text-blue-600">{totalTimeSavedHours.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Value Generated</span>
                                    <span className="text-sm font-medium text-green-600">${(totalTimeSavedHours * 50).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Cost Efficiency</span>
                                    <span className="text-sm font-medium text-gray-900">{costEfficiency.toFixed(1)}x</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-900">ROI</span>
                                        <span className="text-lg font-bold text-green-600">{estimatedROI.toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations Breakdown</h3>
                            <div className="space-y-3">
                                {Object.entries(operationsByType).length > 0 ? (
                                    Object.entries(operationsByType).map(([type, count]) => (
                                        <div key={type} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 capitalize">
                                                {type.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">{count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No operations data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Provider Performance */}
                    {Object.keys(providerUsage).length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Performance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(providerUsage).map(([provider, stats]) => (
                                    <div key={provider} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-gray-900 capitalize">{provider}</h4>
                                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                                stats.successRate >= 90 ? 'bg-green-100 text-green-700' :
                                                stats.successRate >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {stats.successRate.toFixed(1)}% success
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600">API Calls</p>
                                                <p className="text-lg font-bold text-gray-900">{stats.calls}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Cost</p>
                                                <p className="text-lg font-bold text-gray-900">${stats.cost.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Tokens</p>
                                                <p className="text-lg font-bold text-gray-900">{(stats.tokens / 1000).toFixed(0)}K</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Failed</p>
                                                <p className="text-lg font-bold text-red-600">{stats.failed}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Coverage Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Distribution</h3>
                    <div className="space-y-4">
                        <ProgressBar
                            label="Manual Test Cases"
                            value={manualTestCases}
                            total={totalTestCases}
                            color="warning"
                        />
                        <ProgressBar
                            label="Automated Test Cases"
                            value={automatedTestCases}
                            total={totalTestCases}
                            color="success"
                        />
                        <ProgressBar
                            label="AI Generated"
                            value={aiGeneratedTestCases}
                            total={totalTestCases}
                            color="purple"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Analysis</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Functional Coverage</p>
                                <p className="text-sm text-gray-600">Core functionality tests</p>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{functionalCoverage}%</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Edge Case Coverage</p>
                                <p className="text-sm text-gray-600">Boundary & edge cases</p>
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">{edgeCaseCoverage}%</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">Negative Testing</p>
                                <p className="text-sm text-gray-600">Error & failure scenarios</p>
                            </div>
                            <div className="text-2xl font-bold text-red-600">{negativeCaseCoverage}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Quality</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">With Tags</span>
                            <span className="font-medium text-gray-900">{testCasesWithTags}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Linked to Bugs</span>
                            <span className="font-medium text-gray-900">{testCasesLinkedToBugs}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">With Recordings</span>
                            <span className="font-medium text-gray-900">{testCasesWithRecordings}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">Quality Score</span>
                                <span className="text-xl font-bold text-blue-600">{testCaseQualityScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Outdated</span>
                            <span className="font-medium text-red-600">{outdatedTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Recently Updated</span>
                            <span className="font-medium text-green-600">{recentlyUpdatedTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Update Frequency</span>
                            <span className="font-medium text-gray-900">{recentlyUpdatedTestCases}/week</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Health</h3>
                    <div className="space-y-3">
                        <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{testCaseQualityScore}%</div>
                            <div className="text-xs text-gray-600 mt-1">Quality Score</div>
                        </div>
                        {aiMetrics && totalAIGenerations > 0 && (
                            <div className="text-center p-3 bg-white rounded-lg">
                                <div className="text-3xl font-bold text-purple-600">{efficiencyScore}%</div>
                                <div className="text-xs text-gray-600 mt-1">AI Efficiency</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCaseMetrics;