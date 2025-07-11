import React from 'react';
import { CheckCircle, Clock, Zap, Bot, Tags, TrendingUp } from 'lucide-react';

const TestCaseMetrics = ({ metrics = {} }) => {
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
        testCaseUpdateFrequency = 0
    } = metrics;

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
                <div className="text-sm text-gray-500">
                    Total: {totalTestCases.toLocaleString()} test cases
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
                    trend={12}
                />
                <MetricCard
                    title="Manual Tests"
                    value={manualTestCases}
                    subtitle={`${totalTestCases > 0 ? Math.round((manualTestCases / totalTestCases) * 100) : 0}% of total`}
                    icon={Clock}
                    color="orange"
                />
                <MetricCard
                    title="Automated Tests"
                    value={automatedTestCases}
                    subtitle={`${totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0}% automated`}
                    icon={Zap}
                    color="green"
                    trend={8}
                />
                <MetricCard
                    title="AI Generated"
                    value={aiGeneratedTestCases}
                    subtitle={`${avgTestCasesPerAIGeneration} avg per generation`}
                    icon={Bot}
                    color="purple"
                    trend={25}
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