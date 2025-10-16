import React from 'react';
import { CheckCircle, Clock, Zap, Bot, Tags, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor';
import { useDashboard } from '../../hooks/useDashboard'; 

const TestCaseMetrics = ({
    lastUpdated = null,
    isRealtime = false
}) => {
    const { metrics: rawMetrics, loading, error, refresh } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                text: 'text-[rgb(var(--color-success))]',
                bar: 'bg-[rgb(var(--color-success))]',
                border: 'border-[rgb(var(--color-success)/0.2)]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                text: 'text-[rgb(var(--color-info))]',
                bar: 'bg-[rgb(var(--color-info))]',
                border: 'border-[rgb(var(--color-info)/0.2)]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                text: 'text-[rgb(var(--color-warning))]',
                bar: 'bg-[rgb(var(--color-warning))]',
                border: 'border-[rgb(var(--color-warning)/0.2)]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                text: 'text-[rgb(var(--color-error))]',
                bar: 'bg-[rgb(var(--color-error))]',
                border: 'border-[rgb(var(--color-error)/0.2)]'
            }
        };
        return colorMap[color] || colorMap.info;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Test Case Management</h2>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Loading metrics...
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="w-16 h-8 bg-muted rounded"></div>
                                <div className="w-24 h-4 bg-muted rounded"></div>
                                <div className="w-20 h-3 bg-muted rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Test Case Management</h2>
                    <button
                        onClick={refresh}
                        className="flex items-center px-3 py-1 text-sm text-[rgb(var(--color-info))] hover:text-[rgb(var(--color-info)/0.8)] border border-[rgb(var(--color-info)/0.2)] rounded-lg hover:bg-[rgb(var(--color-info)/0.1)]"
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                    </button>
                </div>
                <div className="bg-[rgb(var(--color-error)/0.1)] border border-[rgb(var(--color-error)/0.2)] rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-[rgb(var(--color-error))] mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-[rgb(var(--color-error))]">Error Loading Metrics</h3>
                            <p className="text-sm text-[rgb(var(--color-error))] mt-1">
                                {error?.message || 'Failed to load test case metrics. Please try again.'}
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
        aiGeneratedTestCases = 0,
        testCasesWithTags = 0,
        testCasesLinkedToBugs = 0,
        testCasesWithRecordings = 0,
        functionalCoverage = 0,
        edgeCaseCoverage = 0,
        negativeCaseCoverage = 0,
        aiGenerationSuccessRate = 0,
        outdatedTestCases = 0,
        recentlyUpdatedTestCases = 0,
        automationRate = 0,
        aiContributionRate = 0,
        avgCoverage = 0,
        testCaseQualityScore = 0,
        testCaseTrend = []
    } = metrics;

    // Compute trends from testCaseTrend (simple % change from first to last)
    const computeTrend = (trendData, key = 'count') => {
        if (trendData.length < 2) return null;
        const first = trendData[0][key];
        const last = trendData[trendData.length - 1][key];
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };

    const trends = {
        totalTestCases: computeTrend(testCaseTrend),
        // Add more if needed, but for simplicity using overall
    };

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "info", trend = null }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-card rounded-lg border border-border p-6 hover:shadow-theme-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {trend !== null && (
                        <div className={`flex items-center text-sm ${trend > 0 ? 'text-[rgb(var(--color-success))]' : trend < 0 ? 'text-[rgb(var(--color-error))]' : 'text-muted-foreground'}`}>
                            <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{value?.toLocaleString()}</p>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
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
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value} ({percentage}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors.bar}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Test Case Management</h2>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">
                        Total: {totalTestCases.toLocaleString()} test cases
                    </div>
                    {lastUpdated && (
                        <div className="text-xs text-muted-foreground">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                    {isRealtime && (
                        <div className="flex items-center text-xs text-[rgb(var(--color-success))]">
                            <div className="w-2 h-2 bg-[rgb(var(--color-success))] rounded-full mr-1 animate-pulse"></div>
                            Live
                        </div>
                    )}
                    <button
                        onClick={refresh}
                        className="flex items-center px-3 py-1 text-sm text-[rgb(var(--color-info))] hover:text-[rgb(var(--color-info)/0.8)] border border-[rgb(var(--color-info)/0.2)] rounded-lg hover:bg-[rgb(var(--color-info)/0.1)]"
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Test Cases"
                    value={totalTestCases}
                    subtitle="All test cases created"
                    icon={CheckCircle}
                    color="info"
                    trend={trends.totalTestCases}
                />
                <MetricCard
                    title="Manual Tests"
                    value={manualTestCases}
                    subtitle={`${totalTestCases > 0 ? (100 - automationRate) : 0}% of total`}
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
                    color="info"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Tags className="w-5 h-5 mr-2 text-[rgb(var(--color-info))]" />
                        Test Case Distribution
                    </h3>
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
                            color="info"
                        />
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Coverage Analysis</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-[rgb(var(--color-info)/0.1)] rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Functional Coverage</p>
                                <p className="text-sm text-muted-foreground">Core functionality tests</p>
                            </div>
                            <div className="text-2xl font-bold text-[rgb(var(--color-info))]">{functionalCoverage}%</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[rgb(var(--color-warning)/0.1)] rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Edge Case Coverage</p>
                                <p className="text-sm text-muted-foreground">Boundary & edge cases</p>
                            </div>
                            <div className="text-2xl font-bold text-[rgb(var(--color-warning))]">{edgeCaseCoverage}%</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[rgb(var(--color-error)/0.1)] rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Negative Testing</p>
                                <p className="text-sm text-muted-foreground">Error & failure scenarios</p>
                            </div>
                            <div className="text-2xl font-bold text-[rgb(var(--color-error))]">{negativeCaseCoverage}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Test Case Quality</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">With Tags</span>
                            <span className="font-medium text-foreground">{testCasesWithTags}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Linked to Bugs</span>
                            <span className="font-medium text-foreground">{testCasesLinkedToBugs}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">With Recordings</span>
                            <span className="font-medium text-foreground">{testCasesWithRecordings}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">AI Generation</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Success Rate</span>
                            <span className="font-medium text-[rgb(var(--color-success))]">{aiGenerationSuccessRate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Contribution Rate</span>
                            <span className="font-medium text-foreground">{aiContributionRate}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground pt-2">
                            AI contributes {aiGeneratedTestCases} test cases ({aiContributionRate}% of total)
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Maintenance</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Outdated</span>
                            <span className="font-medium text-[rgb(var(--color-error))]">{outdatedTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Recently Updated</span>
                            <span className="font-medium text-[rgb(var(--color-success))]">{recentlyUpdatedTestCases}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Update Frequency</span>
                            <span className="font-medium text-foreground">{recentlyUpdatedTestCases}/week</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[rgb(var(--color-info)/0.1)] rounded-lg border border-[rgb(var(--color-info)/0.2)] p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Test Case Health Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-info))]">
                            {testCaseQualityScore}%
                        </div>
                        <div className="text-sm text-muted-foreground">Quality Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-success))]">
                            {automationRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">Automation Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-info))]">
                            {aiContributionRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">AI Contribution</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-warning))]">
                            {avgCoverage}%
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Coverage</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCaseMetrics;