/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
    Brain, 
    Zap, 
    Target, 
    DollarSign, 
    FileText, 
    CheckCircle,
    TrendingUp, 
    TrendingDown,
    Lightbulb, 
    Clock,
    BarChart3,
    PieChart,
    Download,
    AlertTriangle,
    Users,
    Settings,
    RefreshCw,
    Activity
} from 'lucide-react';

const AIGenerationMetrics = ({ aiService, dateRange = 30 }) => {
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState(dateRange);

    useEffect(() => {
        if (!aiService || !aiService.getAIMetrics) {
            setError('AI service is not available. Please check the service configuration.');
            setLoading(false);
            return;
        }
        loadMetrics();
    }, [timeRange, aiService]);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await aiService.getAIMetrics(timeRange);
            
            if (result.success) {
                setMetrics(result.data);
            } else {
                setError(result.error || 'Failed to load AI metrics');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred while loading metrics');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!aiService || !aiService.getAIMetrics) {
            setError('AI service is not available for refresh');
            return;
        }
        setRefreshing(true);
        await loadMetrics();
        setRefreshing(false);
    };

    const handleExportReport = async (format) => {
        if (!aiService || !aiService.exportAIReport) {
            alert('AI service is not available for export');
            return;
        }
        try {
            const result = await aiService.exportAIReport(format, timeRange);
            if (result.success) {
                const blob = new Blob([result.data], { type: result.contentType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert('Export failed: ' + result.error);
            }
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    };

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend, change }) => (
        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${color}-50`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : trend < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : <Activity className="w-4 h-4 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                {change && <p className="text-xs text-blue-600">{change} from last period</p>}
            </div>
        </div>
    );

    const ProgressBar = ({ label, value, total, color = "blue", showPercentage = true }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-900 font-semibold">
                        {value}{showPercentage && `/${total} (${percentage.toFixed(1)}%)`}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className={`bg-${color}-500 h-2.5 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>
        );
    };

    const GenerationSourceChart = () => {
        const sources = [
            { name: 'User Stories', value: metrics.generationsFromUserStories || 0, color: 'bg-blue-500' },
            { name: 'Documents', value: metrics.generationsFromDocuments || 0, color: 'bg-green-500' },
            { name: 'Requirements', value: metrics.generationsFromRequirements || 0, color: 'bg-purple-500' },
            { name: 'Bug Analysis', value: metrics.generationsFromBugs || 0, color: 'bg-red-500' }
        ];

        const total = sources.reduce((sum, source) => sum + source.value, 0);

        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Generation Sources</h3>
                    <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                    {sources.map((source, index) => {
                        const percentage = total > 0 ? (source.value / total) * 100 : 0;
                        return (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${source.color}`} />
                                    <span className="text-sm font-medium text-gray-700">{source.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 font-semibold">{source.value}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {total === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No generation data available</p>
                    </div>
                )}
            </div>
        );
    };

    const TestTypeDistribution = () => {
        const testTypes = [
            { name: 'Functional Tests', value: metrics.functionalTestsGenerated || 0, color: 'blue' },
            { name: 'Integration Tests', value: metrics.integrationTestsGenerated || 0, color: 'green' },
            { name: 'Edge Cases', value: metrics.edgeTestsGenerated || 0, color: 'orange' },
            { name: 'Negative Tests', value: metrics.negativeTestsGenerated || 0, color: 'red' },
            { name: 'Performance Tests', value: metrics.performanceTestsGenerated || 0, color: 'purple' },
            { name: 'Security Tests', value: metrics.securityTestsGenerated || 0, color: 'yellow' }
        ];

        const total = testTypes.reduce((sum, type) => sum + type.value, 0);

        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Generated Test Types</h3>
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                    {testTypes.map((type, index) => (
                        <ProgressBar
                            key={index}
                            label={type.name}
                            value={type.value}
                            total={total}
                            color={type.color}
                            showPercentage={false}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const ProviderUsageStats = () => {
        const providerStats = metrics.providerUsage || {};
        const providers = Object.keys(providerStats);

        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Usage</h3>
                {providers.length > 0 ? (
                    <div className="space-y-4">
                        {providers.map(provider => {
                            const stats = providerStats[provider];
                            const successRate = stats.successRate || 0;
                            return (
                                <div key={provider} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900 capitalize">{provider}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            successRate >= 90 ? 'bg-green-100 text-green-800' :
                                            successRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {successRate.toFixed(1)}% success
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">API Calls:</span>
                                            <span className="font-medium ml-2">{stats.calls || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Tokens:</span>
                                            <span className="font-medium ml-2">{(stats.tokens || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No provider usage data available</p>
                    </div>
                )}
            </div>
        );
    };

    const QualityMetrics = () => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality & Efficiency</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Quality Score</span>
                            <span className="text-lg font-bold text-green-600">
                                {metrics.averageQualityScore || 0}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${metrics.averageQualityScore || 0}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                            {metrics.estimatedTimeSavedHours || 0}h
                        </div>
                        <div className="text-sm text-blue-700">Time Saved</div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Productivity Gain</span>
                            <span className="text-lg font-bold text-purple-600">
                                {(metrics.productivityIncrease || 0).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(metrics.productivityIncrease || 0, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                            {metrics.testCasesRequiringRevision || 0}
                        </div>
                        <div className="text-sm text-green-700">Revisions Needed</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const PerformanceMetrics = () => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">
                        {metrics.avgGenerationTimeSeconds || 0}s
                    </div>
                    <div className="text-sm text-gray-600">Avg Generation Time</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                        {(metrics.avgTestCasesPerGeneration || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-blue-700">Tests per Generation</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                        ${(metrics.aiCostPerTestCase || 0).toFixed(4)}
                    </div>
                    <div className="text-sm text-green-700">Cost per Test Case</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                        {(metrics.averageSuggestionAccuracy || 0)}%
                    </div>
                    <div className="text-sm text-purple-700">Suggestion Accuracy</div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <div>
                        <h3 className="text-red-800 font-medium">Error Loading AI Metrics</h3>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">AI Test Generation Metrics</h2>
                        <p className="text-sm text-gray-600">
                            Last updated: {metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || !aiService}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => document.getElementById('export-menu').classList.toggle('hidden')}
                            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded text-sm hover:from-teal-800 hover:to-teal-700"
                            disabled={!aiService}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <div id="export-menu" className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10 hidden">
                            <button
                                onClick={() => {
                                    handleExportReport('json');
                                    document.getElementById('export-menu').classList.add('hidden');
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                JSON Report
                            </button>
                            <button
                                onClick={() => {
                                    handleExportReport('csv');
                                    document.getElementById('export-menu').classList.add('hidden');
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                CSV Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Generations"
                    value={metrics.totalAIGenerations || 0}
                    subtitle="AI-powered test cases created"
                    icon={Zap}
                    color="purple"
                    trend={5}
                />
                <MetricCard
                    title="Success Rate"
                    value={`${(metrics.aiSuccessRate || 0).toFixed(1)}%`}
                    subtitle={`${metrics.successfulGenerations || 0}/${metrics.totalAIGenerations || 0} successful`}
                    icon={CheckCircle}
                    color="green"
                    trend={2}
                />
                <MetricCard
                    title="Avg Tests/Generation"
                    value={(metrics.avgTestCasesPerGeneration || 0).toFixed(1)}
                    subtitle="Test cases per generation"
                    icon={Target}
                    color="blue"
                    trend={-1}
                />
                <MetricCard
                    title="Time Saved"
                    value={`${metrics.estimatedTimeSavedHours || 0}h`}
                    subtitle="Estimated manual work saved"
                    icon={Clock}
                    color="orange"
                    trend={15}
                />
            </div>

            {/* Quality Overview */}
            <QualityMetrics />

            {/* Charts and Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GenerationSourceChart />
                <TestTypeDistribution />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProviderUsageStats />
                <PerformanceMetrics />
            </div>

            {/* AI Suggestions and Bug Analysis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Suggestions & Bug Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                            {metrics.bugSuggestionsGenerated || 0}
                        </div>
                        <div className="text-sm text-yellow-700 font-medium">Bug Suggestions</div>
                        <div className="text-xs text-yellow-600 mt-1">Generated this period</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">
                            {metrics.testCasesFromAISuggestions || 0}
                        </div>
                        <div className="text-sm text-indigo-700 font-medium">Tests from AI</div>
                        <div className="text-xs text-indigo-600 mt-1">Suggested test cases</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">
                            {(metrics.averageSuggestionAccuracy || 0)}%
                        </div>
                        <div className="text-sm text-emerald-700 font-medium">Accuracy Rate</div>
                        <div className="text-xs text-emerald-600 mt-1">AI suggestion quality</div>
                    </div>
                </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Cost & ROI Analysis</h3>
                    <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                            ${((metrics.openAITokensUsed || 0) * 0.00002).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-700 font-medium">OpenAI Cost</div>
                        <div className="text-xs text-green-600 mt-1">Estimated total spend</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                            ${(metrics.aiCostPerTestCase || 0).toFixed(4)}
                        </div>
                        <div className="text-sm text-blue-700 font-medium">Cost per Test</div>
                        <div className="text-xs text-blue-600 mt-1">Average generation cost</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                            ${((metrics.estimatedTimeSavedHours || 0) * 50).toFixed(0)}
                        </div>
                        <div className="text-sm text-purple-700 font-medium">Value Generated</div>
                        <div className="text-xs text-purple-600 mt-1">Time savings at $50/hr</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                            {metrics.estimatedTimeSavedHours > 0 ? 
                                (((metrics.estimatedTimeSavedHours * 50) / Math.max(((metrics.openAITokensUsed || 0) * 0.00002), 0.01)) * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-sm text-orange-700 font-medium">ROI</div>
                        <div className="text-xs text-orange-600 mt-1">Return on investment</div>
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Cost Efficiency Trend</h4>
                            <p className="text-sm text-gray-600">
                                Your AI usage is generating {((metrics.estimatedTimeSavedHours || 0) / Math.max((metrics.totalAIGenerations || 1), 1)).toFixed(1)} hours 
                                of time savings per generation at ${(metrics.aiCostPerTestCase || 0).toFixed(4)} per test case.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Monthly Projection</div>
                            <div className="text-lg font-semibold text-green-600">
                                ${(((metrics.totalAIGenerations || 0) / Math.max(timeRange, 1)) * 30 * (metrics.aiCostPerTestCase || 0)).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights and Recommendations */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border p-6">
                <div className="flex items-center mb-4">
                    <Lightbulb className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Insights & Recommendations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Performance Insights</h4>
                        <div className="space-y-2 text-sm">
                            {metrics.aiSuccessRate >= 90 ? (
                                <div className="flex items-center text-green-700">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Excellent AI success rate - keep current configuration
                                </div>
                            ) : (
                                <div className="flex items-center text-yellow-700">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Consider optimizing prompts to improve success rate
                                </div>
                            )}
                            
                            {(metrics.avgTestCasesPerGeneration || 0) < 5 ? (
                                <div className="flex items-center text-blue-700">
                                    <Target className="w-4 h-4 mr-2" />
                                    Try increasing test case count per generation for better efficiency
                                </div>
                            ) : (
                                <div className="flex items-center text-green-700">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Good test case generation density
                                </div>
                            )}
                            
                            {(metrics.avgGenerationTimeSeconds || 0) > 30 ? (
                                <div className="flex items-center text-orange-700">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Consider using a faster AI provider for better response times
                                </div>
                            ) : (
                                <div className="flex items-center text-green-700">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Fast AI response times
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Optimization Opportunities</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center text-purple-700">
                                <Brain className="w-4 h-4 mr-2" />
                                {metrics.customPromptUsage > metrics.defaultPromptUsage ? 
                                    'Great use of custom prompts for better results' :
                                    'Consider using more custom prompts for specialized test cases'
                                }
                            </div>
                            
                            <div className="flex items-center text-indigo-700">
                                <Users className="w-4 h-4 mr-2" />
                                Team productivity increased by {(metrics.productivityIncrease || 0).toFixed(1)}% with AI assistance
                            </div>
                            
                            <div className="flex items-center text-emerald-700">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                {metrics.estimatedTimeSavedHours > 10 ? 
                                    `Excellent time savings of ${metrics.estimatedTimeSavedHours}h this period` :
                                    'Consider increasing AI usage to maximize time savings'
                                }
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>• {metrics.testCasesRequiringRevision > (metrics.totalAIGenerations * 0.15) ? 
                            'Focus on prompt optimization to reduce manual revisions' :
                            'Maintain current quality standards with minimal revisions needed'
                        }</li>
                        <li>• {Object.keys(metrics.providerUsage || {}).length < 2 ?
                            'Consider testing multiple AI providers for cost optimization' :
                            'Monitor provider performance to optimize cost and quality'
                        }</li>
                        <li>• Schedule weekly reviews of AI-generated test cases for continuous improvement</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

AIGenerationMetrics.propTypes = {
    aiService: PropTypes.shape({
        getAIMetrics: PropTypes.func.isRequired,
        exportAIReport: PropTypes.func.isRequired,
    }).isRequired,
    dateRange: PropTypes.number,
};

AIGenerationMetrics.defaultProps = {
    dateRange: 30,
};

export default AIGenerationMetrics;