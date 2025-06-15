import React from 'react';
import {
    TestTube,
    Bug,
    Video,
    Brain,
    Zap,
    Users,
    TrendingUp,
    TrendingDown,
    Activity,
    Shield,
    Target,
    Gauge
} from 'lucide-react';

const QAIDMetricsOverview = ({ metrics }) => {
    if (!metrics) {
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
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100'
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

    // Calculate key QAID metrics
    const testCases = metrics?.testCases || {};
    const bugs = metrics?.bugs || {};
    const recordings = metrics?.recordings || {};
    const ai = metrics?.ai || {};
    const automation = metrics?.automation || {};
    const team = metrics?.team || {};

    // Core QAID KPIs
    const qaEfficiency = metrics?.overallQAEfficiency || 0;
    const evidenceQuality = metrics?.evidenceQualityScore || 0;
    const aiProductivity = metrics?.aiProductivityGain || 0;

    // Calculate trends (mock data - in real implementation, compare with previous period)
    const calculateTrend = (current, previous = current * 0.85) => {
        return Math.round(((current - previous) / previous) * 100);
    };

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
                        change={calculateTrend(qaEfficiency)}
                        changeType={qaEfficiency > 75 ? 'positive' : qaEfficiency > 50 ? 'neutral' : 'negative'}
                        icon={Target}
                        color="blue"
                        subtitle="Automation + Bug Quality + AI Success"
                    />
                    <MetricCard
                        title="Evidence Quality Score"
                        value={`${evidenceQuality}%`}
                        change={calculateTrend(evidenceQuality)}
                        changeType={evidenceQuality > 80 ? 'positive' : 'neutral'}
                        icon={Shield}
                        color="green"
                        subtitle="Video + Network + Console Coverage"
                    />
                    <MetricCard
                        title="AI Productivity Gain"
                        value={`${aiProductivity}%`}
                        change={calculateTrend(aiProductivity)}
                        changeType={aiProductivity > 30 ? 'positive' : 'neutral'}
                        icon={Brain}
                        color="purple"
                        subtitle="AI Contribution + Generation Efficiency"
                    />
                </div>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Test Cases"
                    value={testCases.totalTestCases?.toLocaleString() || '0'}
                    change={calculateTrend(testCases.totalTestCases || 0)}
                    changeType="positive"
                    icon={TestTube}
                    color="blue"
                    subtitle={`${testCases.aiGeneratedTestCases || 0} AI-generated`}
                />

                <MetricCard
                    title="Active Bugs"
                    value={bugs.totalBugs?.toLocaleString() || '0'}
                    change={calculateTrend(bugs.totalBugs || 0, (bugs.totalBugs || 0) * 1.1)}
                    changeType="negative"
                    icon={Bug}
                    color="red"
                    subtitle={`${bugs.bugsWithVideoEvidence || 0} with video evidence`}
                />

                <MetricCard
                    title="Screen Recordings"
                    value={recordings.totalRecordings?.toLocaleString() || '0'}
                    change={calculateTrend(recordings.totalRecordings || 0)}
                    changeType="positive"
                    icon={Video}
                    color="yellow"
                    subtitle={`${Math.round(recordings.avgRecordingDuration || 0)}min avg duration`}
                />

                <MetricCard
                    title="AI Generations"
                    value={ai.totalAIGenerations?.toLocaleString() || '0'}
                    change={calculateTrend(ai.totalAIGenerations || 0)}
                    changeType="positive"
                    icon={Brain}
                    color="purple"
                    subtitle={`${Math.round(ai.aiSuccessRate || 0)}% success rate`}
                />
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Automation Coverage"
                    value={`${Math.round(automation.automationRatio || 0)}%`}
                    change={calculateTrend(automation.automationRatio || 0)}
                    changeType="positive"
                    icon={Zap}
                    color="green"
                    subtitle={`${automation.cypressScriptsGenerated || 0} Cypress scripts`}
                />

                <MetricCard
                    title="Bug Resolution Rate"
                    value={`${Math.round(bugs.bugResolutionRate || 0)}%`}
                    change={calculateTrend(bugs.bugResolutionRate || 0)}
                    changeType="positive"
                    icon={Shield}
                    color="green"
                    subtitle={`${Math.round(bugs.avgResolutionTime || 0)}h avg resolution`}
                />

                <MetricCard
                    title="Active Team Members"
                    value={team.activeTeamMembers?.toLocaleString() || '0'}
                    change={calculateTrend(team.activeTeamMembers || 0)}
                    changeType="neutral"
                    icon={Users}
                    color="indigo"
                    subtitle={`${Math.round(team.testCasesCreatedPerMember || 0)} tests/member`}
                />

                <MetricCard
                    title="Recording-to-Bug Rate"
                    value={`${Math.round(recordings.recordingToReportConversionRate || 0)}%`}
                    change={calculateTrend(recordings.recordingToReportConversionRate || 0)}
                    changeType="positive"
                    icon={Activity}
                    color="yellow"
                    subtitle="Recordings leading to bug reports"
                />
            </div>

            {/* Quality Insights */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {Math.round(testCases.functionalCoverage || 0)}%
                        </div>
                        <div className="text-sm text-gray-600">Functional Coverage</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {testCases.testCasesWithTags || 0} tests with proper tags
                        </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {Math.round(bugs.bugReproductionRate || 0)}%
                        </div>
                        <div className="text-sm text-gray-600">Bug Reproduction Rate</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Enhanced by screen recordings
                        </div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                            {Math.round(ai.avgTestCasesPerGeneration || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Tests per AI Generation</div>
                        <div className="text-xs text-gray-500 mt-1">
                            ${(ai.aiCostPerTestCase || 0).toFixed(3)} cost per test
                        </div>
                    </div>
                </div>
            </div>

            {/* Critical Alerts */}
            {(bugs.criticalBugs > 0 || automation.automationRatio < 30 || ai.aiSuccessRate < 70) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                        <Bug className="w-4 h-4 mr-1" />
                        Attention Required
                    </h4>
                    <div className="space-y-1 text-sm text-red-700">
                        {bugs.criticalBugs > 0 && (
                            <div>• {bugs.criticalBugs} critical bugs need immediate attention</div>
                        )}
                        {automation.automationRatio < 30 && (
                            <div>• Automation coverage is below 30% - consider increasing automated tests</div>
                        )}
                        {ai.aiSuccessRate < 70 && (
                            <div>• AI generation success rate is below 70% - review prompts and inputs</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QAIDMetricsOverview;