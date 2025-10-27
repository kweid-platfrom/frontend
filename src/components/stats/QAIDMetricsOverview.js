// components/QAIDMetricsOverview.jsx - Fixed with Firestore AI Metrics
import React, { useEffect, useState } from 'react';
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
    Tags,
    AlertTriangle
} from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { useApp } from '@/context/AppProvider';
import { calculateSuiteAIMetrics, getAIGeneratedAssetsCount } from '@/services/aiMetricsService';

const QAIDMetricsOverview = ({ metrics = {}, loading = false }) => {
    const [aiMetrics, setAIMetrics] = useState(null);
    const [loadingAI, setLoadingAI] = useState(true);
    const [aiGeneratedCount, setAiGeneratedCount] = useState(0);
    
    const { state } = useApp();
    const activeSuiteId = state.suites?.activeSuite?.id;
    
    // Get AI Context for service status and real-time session data
    const {
        isInitialized,
        isHealthy,
        apiKeyConfigured,
        tokensUsed: sessionTokens,
        totalCost: sessionCost,
        operationsCount: sessionOps    } = useAI();

    // Load AI metrics from Firestore
    useEffect(() => {
        const loadAIMetrics = async () => {
            if (!activeSuiteId) {
                setAIMetrics(null);
                setAiGeneratedCount(0);
                setLoadingAI(false);
                return;
            }

            setLoadingAI(true);
            try {
                // Fetch AI-generated test cases count
                const aiTestCasesCount = await getAIGeneratedAssetsCount(activeSuiteId, 'testCases');
                setAiGeneratedCount(aiTestCasesCount);

                // Fetch AI usage metrics
                const result = await calculateSuiteAIMetrics(activeSuiteId, 30);
                
                if (result.success) {
                    setAIMetrics({
                        // From Firestore (persistent)
                        totalAIGenerations: result.data.totalAIGenerations || 0,
                        totalTestCasesGenerated: result.data.totalTestCasesGenerated || 0,
                        totalBugReportsGenerated: result.data.totalBugReportsGenerated || 0,
                        successfulOperations: result.data.successfulOperations || 0,
                        failedOperations: result.data.failedOperations || 0,
                        aiGenerationSuccessRate: result.data.overallSuccessRate || 0,
                        totalTokensUsed: result.data.totalTokensUsed || 0,
                        totalCost: result.data.totalCost || 0,
                        avgTestCasesPerGeneration: result.data.averageTestCasesPerGeneration || 0,
                        timeSavedHours: result.data.totalTimeSavedHours || 0,
                        estimatedROI: result.data.estimatedROI || 0,
                        // Session data
                        sessionTokens: sessionTokens || 0,
                        sessionCost: sessionCost || 0,
                        sessionOps: sessionOps || 0,
                        recentAIActivity: (result.data.totalAIGenerations || 0) > 0 || (sessionOps || 0) > 0
                    });
                } else {
                    setAIMetrics({
                        totalAIGenerations: 0,
                        totalTestCasesGenerated: 0,
                        totalBugReportsGenerated: 0,
                        successfulOperations: 0,
                        failedOperations: 0,
                        aiGenerationSuccessRate: 0,
                        totalTokensUsed: 0,
                        totalCost: 0,
                        avgTestCasesPerGeneration: 0,
                        timeSavedHours: 0,
                        estimatedROI: 0,
                        sessionTokens: sessionTokens || 0,
                        sessionCost: sessionCost || 0,
                        sessionOps: sessionOps || 0,
                        recentAIActivity: (sessionOps || 0) > 0
                    });
                }
            } catch (error) {
                console.error('Error loading AI metrics:', error);
                setAIMetrics({
                    totalAIGenerations: 0,
                    totalTestCasesGenerated: 0,
                    totalBugReportsGenerated: 0,
                    successfulOperations: 0,
                    failedOperations: 0,
                    aiGenerationSuccessRate: 0,
                    totalTokensUsed: 0,
                    totalCost: 0,
                    avgTestCasesPerGeneration: 0,
                    timeSavedHours: 0,
                    estimatedROI: 0,
                    sessionTokens: 0,
                    sessionCost: 0,
                    sessionOps: 0,
                    recentAIActivity: false
                });
            } finally {
                setLoadingAI(false);
            }
        };

        loadAIMetrics();
    }, [activeSuiteId, sessionTokens, sessionCost, sessionOps]);

    if (loading || loadingAI) {
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
        onClick,
        warning
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
                className={`bg-card rounded-lg shadow-theme border border-border p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-theme-xl hover:border-border/80' : ''} ${warning ? 'border-orange-300' : ''}`}
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
                    {warning && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
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
        aiGeneratedTestCases: aiGeneratedCount, // Use real count from Firestore
        testCasesWithTags: metrics.testCasesWithTags || 0,
        testCasesWithRecordings: metrics.testCasesWithRecordings || 0,
        testCasesLinkedToBugs: metrics.testCasesLinkedToBugs || 0,
        outdatedTestCases: metrics.outdatedTestCases || 0,
        recentlyUpdatedTestCases: metrics.recentlyUpdatedTestCases || 0,
        testCaseUpdateFrequency: metrics.testCaseUpdateFrequency || 0
    };

    const execution = {
        executionCount: metrics.executionCount || 0,
        passCount: metrics.passCount || 0,
        failCount: metrics.failCount || 0,
        passRate: metrics.passRate || 0,
        avgExecutionTime: metrics.avgExecutionTime || 0
    };

    const coverage = {
        functionalCoverage: metrics.functionalCoverage || 0,
        edgeCaseCoverage: metrics.edgeCaseCoverage || 0,
        negativeCaseCoverage: metrics.negativeCaseCoverage || 0
    };

    // Use AI metrics from Firestore
    const ai = {
        totalAIGenerations: aiMetrics?.totalAIGenerations || 0,
        totalTestCasesGenerated: aiMetrics?.totalTestCasesGenerated || 0,
        successfulOperations: aiMetrics?.successfulOperations || 0,
        aiGenerationSuccessRate: aiMetrics?.aiGenerationSuccessRate || 0,
        avgTestCasesPerGeneration: aiMetrics?.avgTestCasesPerGeneration || 0,
        totalBugReports: aiMetrics?.totalBugReportsGenerated || 0,
        totalTokensUsed: aiMetrics?.totalTokensUsed || 0,
        totalCost: aiMetrics?.totalCost || 0,
        aiCostPerGeneration: (aiMetrics?.totalAIGenerations || 0) > 0 
            ? (aiMetrics?.totalCost || 0) / (aiMetrics?.totalAIGenerations || 1)
            : 0,
        timeSavedHours: aiMetrics?.timeSavedHours || 0,
        estimatedROI: aiMetrics?.estimatedROI || 0,
        sessionTokens: aiMetrics?.sessionTokens || 0,
        sessionCost: aiMetrics?.sessionCost || 0,
        sessionOps: aiMetrics?.sessionOps || 0,
        aiServiceAvailable: isInitialized && isHealthy && apiKeyConfigured,
        recentAIActivity: aiMetrics?.recentAIActivity || false
    };

    const automation = {
        automationRatio: metrics.automationRate || (testCases.totalTestCases > 0 ? 
            Math.round((testCases.automatedTestCases / testCases.totalTestCases) * 100) : 0),
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

    const evidenceQuality = testCases.totalTestCases > 0 ? Math.round(
        ((testCases.testCasesWithRecordings + testCases.testCasesWithTags) / 
         (testCases.totalTestCases * 2)) * 100
    ) : 0;

    const aiProductivity = Math.round(
        (ai.aiGenerationSuccessRate * 0.6) + 
        ((testCases.totalTestCases > 0 ? (testCases.aiGeneratedTestCases / testCases.totalTestCases) * 100 : 0) * 0.4)
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
            {/* AI Service Status Alert */}
            {!ai.aiServiceAvailable && (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-orange-800 mb-1">
                                AI Service Not Available
                            </h4>
                            <p className="text-sm text-orange-700">
                                {!isInitialized 
                                    ? 'AI service is initializing. Please wait...'
                                    : !apiKeyConfigured
                                    ? 'Please configure your Gemini API key in settings to enable AI test case generation.'
                                    : !isHealthy
                                    ? 'AI service health check failed. Please verify your API key and try again.'
                                    : 'AI service is not available. Please check your configuration.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* QAID Core Performance */}
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
                        subtitle={ai.aiServiceAvailable 
                            ? `${ai.timeSavedHours.toFixed(1)}h saved • ${ai.estimatedROI.toFixed(0)}% ROI`
                            : "AI Service Not Available"}
                        warning={!ai.aiServiceAvailable}
                    />
                </div>
            </div>

            {/* Test Cases Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Test Cases"
                    value={testCases.totalTestCases?.toLocaleString() || '0'}
                    change={getTrend('totalTestCases')}
                    changeType={getTrendType(getTrend('totalTestCases'))}
                    icon={TestTube}
                    color="teal"
                    subtitle={testCases.aiGeneratedTestCases > 0 
                        ? `${testCases.aiGeneratedTestCases} AI-generated`
                        : 'No AI-generated tests yet'}
                />
                <MetricCard
                    title="Manual Test Cases"
                    value={testCases.manualTestCases?.toLocaleString() || '0'}
                    change={getTrend('manualTestCases')}
                    changeType={getTrendType(getTrend('manualTestCases'))}
                    icon={Clock}
                    color="orange"
                    subtitle={testCases.totalTestCases > 0 
                        ? `${Math.round((testCases.manualTestCases / testCases.totalTestCases) * 100)}% of total`
                        : '0% of total'}
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
                    subtitle={ai.aiServiceAvailable
                        ? (ai.totalAIGenerations > 0 
                            ? `${ai.totalAIGenerations} generations • ${ai.aiGenerationSuccessRate.toFixed(0)}% success`
                            : 'No AI generations yet')
                        : 'AI service not configured'}
                    warning={!ai.aiServiceAvailable}
                />
            </div>

            {/* Test Case Details */}
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
                    subtitle={testCases.totalTestCases > 0 
                        ? `${Math.round((testCases.testCasesWithTags / testCases.totalTestCases) * 100)}% properly tagged`
                        : '0% properly tagged'}
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

            {/* Test Execution Summary */}
            <div className="bg-card rounded-lg shadow-theme border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Test Execution Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-[rgb(var(--color-teal-50))] rounded-lg border border-[rgb(var(--color-teal-300)/0.2)]">
                        <div className="text-2xl font-bold text-teal-800 mb-1">
                            {execution.executionCount}
                        </div>
                        <div className="text-sm text-foreground">Total Executions</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Test runs completed
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-success)/0.1)] rounded-lg border border-[rgb(var(--color-success)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-success))] mb-1">
                            {execution.passRate}%
                        </div>
                        <div className="text-sm text-foreground">Pass Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {execution.executionCount > 0 
                                ? `${execution.passCount} passed`
                                : 'No executions yet'}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-error)/0.1)] rounded-lg border border-[rgb(var(--color-error)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-error))] mb-1">
                            {execution.failCount}
                        </div>
                        <div className="text-sm text-foreground">Failed Tests</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {execution.executionCount > 0 
                                ? `${Math.round((execution.failCount / execution.executionCount) * 100)}% fail rate`
                                : 'No failures'}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-warning)/0.1)] rounded-lg border border-[rgb(var(--color-warning)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-warning))] mb-1">
                            {execution.avgExecutionTime}s
                        </div>
                        <div className="text-sm text-foreground">Avg Exec Time</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Per test execution
                        </div>
                    </div>
                </div>
            </div>

            {/* Coverage Analysis */}
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

            {/* AI Generation Insights - From Firestore */}
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
                        <div className="text-sm text-foreground">Total Generations</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {ai.totalTestCasesGenerated} test cases created
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-success)/0.1)] rounded-lg border border-[rgb(var(--color-success)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-success))] mb-1">
                            {ai.aiGenerationSuccessRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-foreground">Success Rate</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {ai.successfulOperations}/{ai.totalAIGenerations || 1} successful
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-teal-50))] rounded-lg border border-[rgb(var(--color-teal-300)/0.2)]">
                        <div className="text-2xl font-bold text-teal-800 mb-1">
                            {ai.totalTokensUsed.toLocaleString()}
                        </div>
                        <div className="text-sm text-foreground">Tokens Used</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Total consumption
                        </div>
                    </div>
                    <div className="text-center p-4 bg-[rgb(var(--color-warning)/0.1)] rounded-lg border border-[rgb(var(--color-warning)/0.2)]">
                        <div className="text-2xl font-bold text-[rgb(var(--color-warning))] mb-1">
                            ${ai.totalCost.toFixed(4)}
                        </div>
                        <div className="text-sm text-foreground">Total Cost</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {ai.totalAIGenerations > 0 
                                ? `${ai.aiCostPerGeneration.toFixed(4)}/generation`
                                : 'No cost data yet'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Case Health Summary */}
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
                            {testCases.totalTestCases > 0 
                                ? Math.round((testCases.aiGeneratedTestCases / testCases.totalTestCases) * 100) 
                                : 0}%
                        </div>
                        <div className="text-sm text-foreground">AI Contribution</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {testCases.aiGeneratedTestCases} AI-generated
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

            {/* Recommendations */}
            {(testCases.outdatedTestCases > 0 || 
              automation.automationRatio < 30 || 
              ai.aiGenerationSuccessRate < 70 || 
              execution.executionCount === 0 ||
              !ai.aiServiceAvailable) && (
                <div className="bg-card border border-orange-300 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-1 text-orange-500" />
                        Recommendations
                    </h4>
                    <div className="space-y-1 text-sm text-orange-700">
                        {!ai.aiServiceAvailable && (
                            <div>• Configure your Gemini API key to enable AI test case generation and unlock productivity gains</div>
                        )}
                        {execution.executionCount === 0 && (
                            <div>• No test executions yet - start running your test cases to gather metrics</div>
                        )}
                        {testCases.outdatedTestCases > 0 && (
                            <div>• {testCases.outdatedTestCases} test cases need updates - consider reviewing and refreshing</div>
                        )}
                        {automation.automationRatio < 30 && testCases.totalTestCases > 0 && (
                            <div>• Automation coverage is below 30% - consider converting manual tests to automated</div>
                        )}
                        {ai.aiGenerationSuccessRate < 70 && ai.totalAIGenerations > 5 && ai.aiServiceAvailable && (
                            <div>• AI generation success rate is below 70% - review prompts and generation parameters</div>
                        )}
                        {qualityScore < 60 && testCases.totalTestCases > 0 && (
                            <div>• Quality score is below 60% - add more tags and recordings to improve test case documentation</div>
                        )}
                        {testCases.totalTestCases === 0 && (
                            <div>• No test cases found - create your first test case to start tracking metrics</div>
                        )}
                        {ai.aiServiceAvailable && ai.totalAIGenerations === 0 && testCases.totalTestCases > 0 && (
                            <div>• Try using AI to generate test cases - it can save significant time and improve coverage</div>
                        )}
                    </div>
                </div>
            )}

            {/* AI Service Stats Footer */}
            {ai.aiServiceAvailable && ai.recentAIActivity && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">
                                AI Service Active
                            </span>
                        </div>
                        <div className="text-xs text-purple-700">
                            {ai.totalAIGenerations} generations • {ai.totalTokensUsed.toLocaleString()} tokens • ${ai.totalCost.toFixed(4)} cost • {ai.timeSavedHours.toFixed(1)}h saved
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QAIDMetricsOverview;