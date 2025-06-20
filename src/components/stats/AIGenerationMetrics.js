import React from 'react';
import { Brain, Zap, Target, DollarSign, FileText, CheckCircle, XCircle, TrendingUp, Lightbulb } from 'lucide-react';

const AIGenerationMetrics = ({ metrics = {} }) => {
    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend }) => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${color}-50`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );

    const ProgressBar = ({ label, value, total, color = "blue" }) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-900 font-medium">{value}/{total} ({percentage.toFixed(1)}%)</span>
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

    const GenerationSourceChart = () => {
        const sources = [
            { name: 'User Stories', value: metrics.generationsFromUserStories || 0, color: 'bg-blue-500' },
            { name: 'Documents', value: metrics.generationsFromDocuments || 0, color: 'bg-green-500' },
            { name: 'Requirements', value: metrics.generationsFromRequirements || 0, color: 'bg-purple-500' }
        ];

        const total = sources.reduce((sum, source) => sum + source.value, 0);

        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Sources</h3>
                <div className="space-y-4">
                    {sources.map((source, index) => {
                        const percentage = total > 0 ? (source.value / total) * 100 : 0;
                        return (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                                    <span className="text-sm font-medium text-gray-700">{source.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{source.value}</span>
                                    <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const TestTypeDistribution = () => {
        const testTypes = [
            { name: 'Functional Tests', value: metrics.functionalTestsGenerated || 0, color: 'blue' },
            { name: 'Edge Cases', value: metrics.edgeTestsGenerated || 0, color: 'orange' },
            { name: 'Negative Tests', value: metrics.negativeTestsGenerated || 0, color: 'red' }
        ];

        const total = testTypes.reduce((sum, type) => sum + type.value, 0);

        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Test Types</h3>
                <div className="space-y-3">
                    {testTypes.map((type, index) => (
                        <ProgressBar
                            key={index}
                            label={type.name}
                            value={type.value}
                            total={total}
                            color={type.color}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const PromptEffectiveness = () => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prompt Usage</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.customPromptUsage || 0}</div>
                    <div className="text-sm text-blue-700 font-medium">Custom Prompts</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{metrics.defaultPromptUsage || 0}</div>
                    <div className="text-sm text-gray-700 font-medium">Default Prompts</div>
                </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                        {metrics.promptFineTuningCount || 0} prompt adjustments made this period
                    </span>
                </div>
            </div>
        </div>
    );

    const PerformanceMetrics = () => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance</h3>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.avgGenerationTimeSeconds || 0}s</div>
                    <div className="text-sm text-gray-600">Avg Generation Time</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">${(metrics.aiCostPerTestCase || 0).toFixed(3)}</div>
                    <div className="text-sm text-gray-600">Cost per Test Case</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{(metrics.openAITokensUsed || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-600">OpenAI Tokens Used</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{metrics.openAIAPICallsCount || 0}</div>
                    <div className="text-sm text-gray-600">API Calls Made</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">AI Test Generation</h2>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Generations"
                    value={metrics.totalAIGenerations || 0}
                    subtitle="This period"
                    icon={Zap}
                    color="purple"
                />
                <MetricCard
                    title="Success Rate"
                    value={`${(metrics.aiSuccessRate || 0).toFixed(1)}%`}
                    subtitle={`${metrics.successfulGenerations || 0}/${metrics.totalAIGenerations || 0} successful`}
                    icon={CheckCircle}
                    color="green"
                />
                <MetricCard
                    title="Avg Tests/Generation"
                    value={(metrics.avgTestCasesPerGeneration || 0).toFixed(1)}
                    subtitle="Test cases per generation"
                    icon={Target}
                    color="blue"
                />
                <MetricCard
                    title="Tests Needing Revision"
                    value={metrics.testCasesRequiringRevision || 0}
                    subtitle="Manual adjustments needed"
                    icon={FileText}
                    color="orange"
                />
            </div>

            {/* Generation Quality Overview */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Generation Quality Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Success vs Failed Generations</h4>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-gray-600">Successful: {metrics.successfulGenerations || 0}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-gray-600">Failed: {metrics.failedGenerations || 0}</span>
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${metrics.totalAIGenerations > 0 ? (metrics.successfulGenerations / metrics.totalAIGenerations) * 100 : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Metrics</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Revision Rate</span>
                                <span className="font-medium">
                                    {metrics.totalAIGenerations > 0
                                        ? ((metrics.testCasesRequiringRevision / (metrics.avgTestCasesPerGeneration * metrics.successfulGenerations)) * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Avg Quality Score</span>
                                <span className="font-medium">
                                    {(100 - ((metrics.testCasesRequiringRevision || 0) / Math.max(1, metrics.totalAIGenerations || 1) * 100)).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GenerationSourceChart />
                <TestTypeDistribution />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PromptEffectiveness />
                <PerformanceMetrics />
            </div>

            {/* Cost Analysis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cost & Efficiency Analysis</h3>
                    <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                            ${((metrics.openAITokensUsed || 0) * 0.00002).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-700">Estimated Total Cost</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                            {metrics.avgTestCasesPerGeneration || 0}
                        </div>
                        <div className="text-sm text-blue-700">Tests per Generation</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                            {metrics.avgGenerationTimeSeconds || 0}s
                        </div>
                        <div className="text-sm text-purple-700">Avg Generation Time</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                            {((metrics.successfulGenerations || 0) * (metrics.avgTestCasesPerGeneration || 0) * 5).toFixed(0)}min
                        </div>
                        <div className="text-sm text-orange-700">Est. Time Saved</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIGenerationMetrics;