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
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg shadow-theme border border-border p-6 animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-8 h-8 bg-muted rounded"></div>
                            <div className="w-12 h-4 bg-muted rounded"></div>
                        </div>
                        <div className="w-16 h-8 bg-muted rounded mb-2"></div>
                        <div className="w-24 h-4 bg-muted rounded"></div>
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
        color = 'teal',
        subtitle,
        onClick
    }) => {
        const colorClasses = {
            teal: 'bg-teal-50 text-teal-800 border-teal-300',
            green: 'bg-[rgb(var(--color-success)/0.1)] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.2)]',
            yellow: 'bg-[rgb(var(--color-warning)/0.1)] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.2)]',
            red: 'bg-[rgb(var(--color-error)/0.1)] text-[rgb(var(--color-error))] border-[rgb(var(--color-error)/0.2)]',
            purple: 'bg-[rgb(var(--color-info)/0.1)] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.2)]',
            indigo: 'bg-[rgb(var(--color-info)/0.1)] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.2)]',
            orange: 'bg-[rgb(var(--color-warning)/0.1)] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.2)]'
        };

        const getTrendIcon = () => {
            if (changeType === 'positive') return <TrendingUp className="w-4 h-4 text-green-500" />;
            if (changeType === 'negative') return <TrendingDown className="w-4 h-4 text-red-500" />;
            return <Activity className="w-4 h-4 text-muted-foreground" />;
        };

        const getTrendColor = () => {
            if (changeType === 'positive') return 'text-green-500';
            if (changeType === 'negative') return 'text-red-500';
            return 'text-muted-foreground';
        };

        return (
            <div
                className={`bg-card rounded-lg shadow-theme border border-border p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-theme-xl hover:border-border/80' : ''}`}
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
                    <h3 className="text-2xl font-bold text-foreground">{value}</h3>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            </div>
        );
    };

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

    const coverage = {
        functionalCoverage: metrics.functionalCoverage || 0,
        edgeCaseCoverage: metrics.edgeCaseCoverage || 0,
        negativeCaseCoverage: metrics.negativeCaseCoverage || 0
    };

    const ai = {
        aiGenerationSuccessRate: metrics.aiGenerationSuccessRate || 0,
        avgTestCasesPerAIGeneration: metrics.avgTestCasesPerAIGeneration || 0,
        totalAIGenerations: Math.round((testCases.aiGeneratedTestCases || 0) / Math.max(metrics.avgTestCasesPerAIGeneration || 1, 1)),
        aiCostPerTestCase: 0.05
    };

    const automation = {
        automationRatio: testCases.totalTestCases > 0 ? 
            Math.round((testCases.automatedTestCases / testCases.totalTestCases) * 100) : 0,
        cypressScriptsGenerated: Math.round((testCases.automatedTestCases || 0) * 0.8)
    };

    const recordings = {
        totalRecordings: testCases.testCasesWithRecordings || 0,
        avgRecordingDuration: 5,
        recordingToTestCaseRatio: testCases.totalTestCases > 0 ? 
            Math.round((testCases.testCasesWithRecordings / testCases.totalTestCases) * 100) : 0
    };

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

    const getTrend = (metricName) => {
        if (metrics.trends && metrics.trends[metricName] !== undefined) {
            return metrics.trends[metricName];
        }
        return null;
    };

    const getTrendType = (trend) => {
        if (trend === null || trend === undefined) return 'neutral';
        if (trend > 5) return 'positive';
        if (trend < -5) return 'negative';
        return 'neutral';
    };

    const qualityScore = testCases.totalTestCases > 0 ? 
        Math.round(((testCases.testCasesWithTags + testCases.testCasesWithRecordings) / (testCases.totalTestCases * 2)) * 100) : 0;

    const avgCoverage = Math.round((coverage.functionalCoverage + coverage.edgeCaseCoverage + coverage.negativeCaseCoverage) / 3);

    return (
        <div className="space-y-8">
            <div className="bg-background/50 rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                    <Gauge className="w-5 h-5 mr-2 text-primary" />
                    QAID Core Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="QA Efficiency Score"
                        value={`${qaEfficiency}%`}
                        change={getTrend('qaEfficiency')}
                        changeType={getTrendType(getTrend('qaEfficiency'))}
                        icon={Target}
                        color="teal"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Test Cases"
                    value={testCases.totalTestCases?.toLocaleString() || '0'}
                    change={getTrend('totalTestCases')}
                    changeType={getTrendType(getTrend('totalTestCases'))}
                    icon={TestTube}
                    color="teal"
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

            <div className="bg-card rounded-lg shadow-theme border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Coverage Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-[rgb(var(--color-teal-50))] rounded-lg border border-[rgb(var(--color-teal-300)/0.2)]">
                        <div className="text-2xl font-bold text-teal-800 mb-1">
                            {coverage.functionalCoverage}%
                        </div>
                        <div className="text-sm text-foreground">Functional Coverage</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Core functionality testing
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-warning)/0.1)] rounded-lg border border-[rgb(var(--color-warning)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-warning))] mb-1">
                            {coverage.edgeCaseCoverage}%
                        </div>
                        <div className="text-sm text-foreground">Edge Case Coverage</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Boundary & edge scenarios
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-error)/0.1)] rounded-lg border border-[rgb(var(--color-error)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-error))] mb-1">
                            {coverage.negativeCaseCoverage}%
                        </div>
                        <div className="text-sm text-foreground">Negative Testing</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Error & failure scenarios
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg shadow-theme border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-500" />
                    AI Generation Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-[rgb(var(--color-info)/0.1)] rounded-lg border border-[rgb(var(--color-info)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-info))] mb-1">
                            {ai.totalAIGenerations}
                        </div>
                        <div className="text-sm text-foreground">Total AI Generations</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Successful generation attempts
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-success)/0.1)] rounded-lg border border-[rgb(var(--color-success)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-success))] mb-1">
                            {ai.aiGenerationSuccessRate}%
                        </div>
                        <div className="text-sm text-foreground">Success Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            AI generation efficiency
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-teal-50))] rounded-lg border border-[rgb(var(--color-teal-300)/0.2)]">
                        <div className="text-2xl font-bold text-teal-800 mb-1">
                            {ai.avgTestCasesPerAIGeneration}
                        </div>
                        <div className="text-sm text-foreground">Tests per Generation</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Average output per attempt
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-warning)/0.1)] rounded-lg border border-[rgb(var(--color-warning)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-warning))] mb-1">
                            ${(ai.aiCostPerTestCase).toFixed(3)}
                        </div>
                        <div className="text-sm text-foreground">Cost per Test</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            AI generation cost efficiency
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-background/50 rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-500" />
                    Test Case Health Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                            {qualityScore}%
                        </div>
                        <div className="text-sm text-foreground">Quality Score</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Tags + Recordings coverage
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-teal-800">
                            {automation.automationRatio}%
                        </div>
                        <div className="text-sm text-foreground">Automation Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Automated vs manual tests
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-500">
                            {testCases.totalTestCases > 0 ? Math.round((testCases.aiGeneratedTestCases / testCases.totalTestCases) * 100) : 0}%
                        </div>
                        <div className="text-sm text-foreground">AI Contribution</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            AI-generated test cases
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                            {avgCoverage}%
                        </div>
                        <div className="text-sm text-foreground">Avg Coverage</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Functional + Edge + Negative
                        </div>
                    </div>
                </div>
            </div>

            {(testCases.outdatedTestCases > 0 || automation.automationRatio < 30 || ai.aiGenerationSuccessRate < 70) && (
                <div className="bg-card border border-orange-300 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-1 text-orange-500" />
                        Maintenance Recommendations
                    </h4>
                    <div className="space-y-1 text-sm text-orange-700">
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