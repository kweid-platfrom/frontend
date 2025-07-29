import React from 'react';
import {
    TestTube,
    Bug,
    Video,
    Brain,
    Zap,
    TrendingUp,
    TrendingDown,
    Activity,
    Shield,
    Target,
    Gauge,
    Clock,
    CheckCircle,
    Bot,
    Tags
} from 'lucide-react';

const QAIDMetricsOverview = ({ metrics = {}, loading = false }) => {
    // Show loading state
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-12 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    const MetricCard = ({
        title,
        value,
        change,
        changeType,
        icon: Icon,
        color = 'blue',
        subtitle,
        onClick
    }) => {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            green: 'bg-green-50 text-green-600 border-green-100',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
            red: 'bg-red-50 text-red-600 border-red-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            orange: 'bg-orange-50 text-orange-600 border-orange-100'
        };

        const getTrendIcon = () => {
            if (changeType === 'positive') return <TrendingUp className="w-4 h-4 text-green-500" />;
            if (changeType === 'negative') return <TrendingDown className="w-4 h-4 text-red-500" />;
            return <Activity className="w-4 h-4 text-gray-400" />;
        };

        const getTrendColor = () => {
            if (changeType === 'positive') return 'text-green-600';
            if (changeType === 'negative') return 'text-red-600';
            return 'text-gray-500';
        };

        return (
            <div
                className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200' : ''
                    }`}
                onClick={onClick}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center space-x-1 text-sm ${getTrendColor()}`}>
                            {getTrendIcon()}
                            <span>{change > 0 ? '+' : ''}{change}%</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    )}
                </div>
            </div>
        );
    };

    // Extract test case metrics with proper fallbacks
    const testCases = {
        totalTestCases: metrics.totalTestCases || 0,
        manualTestCases: metrics.manualTestCases || 0,
        automatedTestCases: metrics.automatedTestCases || 0,
        aiGeneratedTestCases: metrics.aiGeneratedTestCases || 0,
        testCasesWithTags: metrics.testCasesWithTags || 0,
        testCasesWithRecordings: metrics.testCasesWithRecordings || 0,
        testCasesLinkedToBugs: metrics.testCasesLinkedToBugs || 0,
        outdatedTestCases: metrics.outdatedTestCases || 0,
        recentlyUpdatedTestCases: metrics.recentlyUpdatedTestCases || 0,
        testCaseUpdateFrequency: metrics.testCaseUpdateFrequency || 0
    };

    // Extract coverage metrics
    const coverage = {
        functionalCoverage: metrics.functionalCoverage || 0,
        edgeCaseCoverage: metrics.edgeCaseCoverage || 0,
        negativeCaseCoverage: metrics.negativeCaseCoverage || 0
    };

    // Extract AI metrics
    const ai = {
        aiGenerationSuccessRate: metrics.aiGenerationSuccessRate || 0,
        avgTestCasesPerAIGeneration: metrics.avgTestCasesPerAIGeneration || 0,
        totalAIGenerations: Math.round((testCases.aiGeneratedTestCases || 0) / Math.max(metrics.avgTestCasesPerAIGeneration || 1, 1)),
        aiCostPerTestCase: 0.05 // Default cost estimate
    };

    // Extract automation metrics
    const automation = {
        automationRatio: testCases.totalTestCases > 0 ? 
            Math.round((testCases.automatedTestCases / testCases.totalTestCases) * 100) : 0,
        cypressScriptsGenerated: Math.round((testCases.automatedTestCases || 0) * 0.8) // Estimate
    };

    // Extract recording metrics
    const recordings = {
        totalRecordings: testCases.testCasesWithRecordings || 0,
        avgRecordingDuration: 5, // Default 5 minutes
        recordingToTestCaseRatio: testCases.totalTestCases > 0 ? 
            Math.round((testCases.testCasesWithRecordings / testCases.totalTestCases) * 100) : 0
    };

    // Calculate key QAID metrics using actual test case data
    const qaEfficiency = Math.round(
        (automation.automationRatio * 0.4) + 
        (ai.aiGenerationSuccessRate * 0.3) + 
        (coverage.functionalCoverage * 0.3)
    );

    const evidenceQuality = Math.round(
        ((testCases.testCasesWithRecordings + testCases.testCasesWithTags) / 
         Math.max(testCases.totalTestCases * 2, 1)) * 100
    );

    const aiProductivity = Math.round(
        (ai.aiGenerationSuccessRate * 0.6) + 
        ((testCases.aiGeneratedTestCases / Math.max(testCases.totalTestCases, 1)) * 100 * 0.4)
    );

    // Calculate trends using metrics.trends if available
    const getTrend = (metricName) => {
        if (metrics.trends && metrics.trends[metricName] !== undefined) {
            return metrics.trends[metricName];
        }
        // Return null if no trend data available
        return null;
    };

    const getTrendType = (trend) => {
        if (trend === null || trend === undefined) return 'neutral';
        if (trend > 5) return 'positive';
        if (trend < -5) return 'negative';
        return 'neutral';
    };

    // Calculate quality score
    const qualityScore = testCases.totalTestCases > 0 ? 
        Math.round(((testCases.testCasesWithTags + testCases.testCasesWithRecordings) / (testCases.totalTestCases * 2)) * 100) : 0;

    // Calculate average coverage
    const avgCoverage = Math.round((coverage.functionalCoverage + coverage.edgeCaseCoverage + coverage.negativeCaseCoverage) / 3);

    return (
        <div className="space-y-8">
            {/* QAID Core KPI Cards */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Gauge className="w-5 h-5 mr-2 text-blue-600" />
                    QAID Core Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="QA Efficiency Score"
                        value={`${qaEfficiency}%`}
                        change={getTrend('qaEfficiency')}
                        changeType={getTrendType(getTrend('qaEfficiency'))}
                        icon={Target}
                        color="blue"
                        subtitle="Automation + AI Success + Coverage"
                    />
                    <MetricCard
                        title="Evidence Quality Score"
                        value={`${evidenceQuality}%`}
                        change={getTrend('evidenceQuality')}
                        changeType={getTrendType(getTrend('evidenceQuality'))}
                        icon={Shield}
                        color="green"
                        subtitle="Tags + Recordings Coverage"
                    />
                    <MetricCard
                        title="AI Productivity Gain"
                        value={`${aiProductivity}%`}
                        change={getTrend('aiProductivity')}
                        changeType={getTrendType(getTrend('aiProductivity'))}
                        icon={Brain}
                        color="purple"
                        subtitle="AI Generation Success + Contribution"
                    />
                </div>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Test Cases"
                    value={testCases.totalTestCases?.toLocaleString() || '0'}
                    change={getTrend('totalTestCases')}
                    changeType={getTrendType(getTrend('totalTestCases'))}
                    icon={TestTube}
                    color="blue"
                    subtitle={`${testCases.aiGeneratedTestCases || 0} AI-generated`}
                />

                <MetricCard
                    title="Manual Test Cases"
                    value={testCases.manualTestCases?.toLocaleString() || '0'}
                    change={getTrend('manualTestCases')}
                    changeType={getTrendType(getTrend('manualTestCases'))}
                    icon={Clock}
                    color="orange"
                    subtitle={`${testCases.totalTestCases > 0 ? Math.round((testCases.manualTestCases / testCases.totalTestCases) * 100) : 0}% of total`}
                />

                <MetricCard
                    title="Automated Tests"
                    value={testCases.automatedTestCases?.toLocaleString() || '0'}
                    change={getTrend('automatedTestCases')}
                    changeType={getTrendType(getTrend('automatedTestCases'))}
                    icon={Zap}
                    color="green"
                    subtitle={`${automation.automationRatio}% automation coverage`}
                />

                <MetricCard
                    title="AI Generated Tests"
                    value={testCases.aiGeneratedTestCases?.toLocaleString() || '0'}
                    change={getTrend('aiGeneratedTestCases')}
                    changeType={getTrendType(getTrend('aiGeneratedTestCases'))}
                    icon={Bot}
                    color="purple"
                    subtitle={`${ai.aiGenerationSuccessRate}% success rate`}
                />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Tests with Recordings"
                    value={testCases.testCasesWithRecordings?.toLocaleString() || '0'}
                    change={getTrend('testCasesWithRecordings')}
                    changeType={getTrendType(getTrend('testCasesWithRecordings'))}
                    icon={Video}
                    color="yellow"
                    subtitle={`${recordings.recordingToTestCaseRatio}% of all tests`}
                />

                <MetricCard
                    title="Tests with Tags"
                    value={testCases.testCasesWithTags?.toLocaleString() || '0'}
                    change={getTrend('testCasesWithTags')}
                    changeType={getTrendType(getTrend('testCasesWithTags'))}
                    icon={Tags}
                    color="indigo"
                    subtitle={`${testCases.totalTestCases > 0 ? Math.round((testCases.testCasesWithTags / testCases.totalTestCases) * 100) : 0}% properly tagged`}
                />

                <MetricCard
                    title="Linked to Bugs"
                    value={testCases.testCasesLinkedToBugs?.toLocaleString() || '0'}
                    change={getTrend('testCasesLinkedToBugs')}
                    changeType={getTrendType(getTrend('testCasesLinkedToBugs'))}
                    icon={Bug}
                    color="red"
                    subtitle="Tests connected to bug reports"
                />

                <MetricCard
                    title="Recently Updated"
                    value={testCases.recentlyUpdatedTestCases?.toLocaleString() || '0'}
                    change={getTrend('recentlyUpdatedTestCases')}
                    changeType={getTrendType(getTrend('recentlyUpdatedTestCases'))}
                    icon={Activity}
                    color="green"
                    subtitle={`${testCases.testCaseUpdateFrequency || 0} updates/week`}
                />
            </div>

            {/* Coverage Analysis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Coverage Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {coverage.functionalCoverage}%
                        </div>
                        <div className="text-sm text-gray-600">Functional Coverage</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Core functionality testing
                        </div>
                    </div>

                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                            {coverage.edgeCaseCoverage}%
                        </div>
                        <div className="text-sm text-gray-600">Edge Case Coverage</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Boundary & edge scenarios
                        </div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                            {coverage.negativeCaseCoverage}%
                        </div>
                        <div className="text-sm text-gray-600">Negative Testing</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Error & failure scenarios
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Generation Insights */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    AI Generation Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                            {ai.totalAIGenerations}
                        </div>
                        <div className="text-sm text-gray-600">Total AI Generations</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Successful generation attempts
                        </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {ai.aiGenerationSuccessRate}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                        <div className="text-xs text-gray-500 mt-1">
                            AI generation efficiency
                        </div>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {ai.avgTestCasesPerAIGeneration}
                        </div>
                        <div className="text-sm text-gray-600">Tests per Generation</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Average output per attempt
                        </div>
                    </div>

                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                            ${(ai.aiCostPerTestCase).toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">Cost per Test</div>
                        <div className="text-xs text-gray-500 mt-1">
                            AI generation cost efficiency
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Case Health Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    Test Case Health Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {qualityScore}%
                        </div>
                        <div className="text-sm text-gray-600">Quality Score</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Tags + Recordings coverage
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {automation.automationRatio}%
                        </div>
                        <div className="text-sm text-gray-600">Automation Rate</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Automated vs manual tests
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {testCases.totalTestCases > 0 ? Math.round((testCases.aiGeneratedTestCases / testCases.totalTestCases) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">AI Contribution</div>
                        <div className="text-xs text-gray-500 mt-1">
                            AI-generated test cases
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {avgCoverage}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Coverage</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Functional + Edge + Negative
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Alerts */}
            {(testCases.outdatedTestCases > 0 || automation.automationRatio < 30 || ai.aiGenerationSuccessRate < 70) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-1" />
                        Maintenance Recommendations
                    </h4>
                    <div className="space-y-1 text-sm text-yellow-700">
                        {testCases.outdatedTestCases > 0 && (
                            <div>• {testCases.outdatedTestCases} test cases need updates - consider reviewing and refreshing</div>
                        )}
                        {automation.automationRatio < 30 && (
                            <div>• Automation coverage is below 30% - consider converting manual tests to automated</div>
                        )}
                        {ai.aiGenerationSuccessRate < 70 && (
                            <div>• AI generation success rate is below 70% - review prompts and generation parameters</div>
                        )}
                        {qualityScore < 60 && (
                            <div>• Quality score is below 60% - add more tags and recordings to improve test case documentation</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QAIDMetricsOverview;