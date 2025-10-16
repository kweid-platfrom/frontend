import React from 'react';
import { AlertTriangle, CheckCircle, Video, Network, FileText, TrendingDown, TrendingUp, Bug } from 'lucide-react';
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor';
import { useDashboard } from '../../hooks/useDashboard';

const BugTrackingMetrics = ({ filters = {} }) => {
    const { metrics: rawMetrics, loading, error, refresh } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);

    const {
        totalBugs = 0,
        activeBugs = 0,
        resolvedBugs = 0,
        criticalBugs = 0,
        highPriorityBugs = 0,
        mediumPriorityBugs = 0,
        lowPriorityBugs = 0,
        bugsWithVideoEvidence = 0,
        bugsWithConsoleLogs = 0,
        bugsWithNetworkLogs = 0,
        bugsFromRecordings = 0,
        avgBugReportCompleteness = 0,
        avgResolutionTime = 0,
        bugResolutionRate = 0,
        criticalBugResolutionTime = 0,
        highBugResolutionTime = 0,
        recentlyResolvedBugs = 0,
        bugReproductionRate = 85,
        bugTrend = [],
        bugReportQualityScore = 0,
        bugHealthStatus = 'good'
    } = metrics;

    // Compute sources (assuming recordings for screen, rest manual)
    const bugsFromScreenRecording = bugsFromRecordings;
    const bugsFromManualTesting = totalBugs - bugsFromScreenRecording;

    // Compute trends from bugTrend
    const computeTrend = (trendData, key = 'count') => {
        if (trendData.length < 2) return null;
        const first = trendData[0][key];
        const last = trendData[trendData.length - 1][key];
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };
    const bugTrendPercent = computeTrend(bugTrend);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-foreground">Loading bug metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-destructive mr-2" />
                            <div>
                                <p className="text-destructive font-medium">{error}</p>
                                {error.includes('suite') && (
                                    <p className="text-destructive text-sm mt-1">
                                        Ensure a valid test suite is selected.
                                    </p>
                                )}
                                {error.includes('authenticated') && (
                                    <p className="text-destructive text-sm mt-1">
                                        Please log in to view bug metrics.
                                    </p>
                                )}
                            </div>
                        </div>
                        <button onClick={refresh} className="text-sm text-info hover:underline">Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    const getColorClasses = (color) => {
        const colorMap = {
            red: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
            green: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
            blue: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
            orange: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
            purple: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
            yellow: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
        };
        return colorMap[color] || colorMap.blue;
    };

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-card rounded-lg border border-border p-6 hover:shadow-theme-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {trend !== null && (
                        <div className={`flex items-center text-sm ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
                            {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
        );
    };

    const SeverityBar = ({ severity, activeCount, totalActive, color }) => {
        const percentage = totalBugs > 0 ? Math.round((activeCount / totalBugs) * 100) : 0;
        const colors = getColorClasses(color);
        const resolvedCount = (severity === 'Critical' ? metrics.criticalBugResolutionTime : 
                               severity === 'High' ? metrics.highBugResolutionTime : 0); // Proxy use avg time

        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                    <span className="font-medium text-foreground">{severity}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right text-xs text-muted-foreground">
                        <div>Active: {activeCount}</div>
                        <div>Resolved: {totalBugs - activeBugs}</div>
                    </div>
                    <div className="w-32 bg-muted-foreground/20 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${colors.bg}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-20 text-right">
                        {activeCount} ({percentage}%)
                    </span>
                </div>
            </div>
        );
    };

    const EvidenceCard = ({ title, value, total, icon: Icon, color = 'blue' }) => {
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        const colors = getColorClasses(color);

        return (
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{value || 0}</p>
                        <p className="text-sm text-muted-foreground">{percentage}%</p>
                    </div>
                </div>
                <p className="text-sm font-medium text-foreground">{title}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Bug Tracking & Resolution</h2>
                <div className="text-sm text-muted-foreground">
                    Total: {totalBugs.toLocaleString()} bugs tracked
                    {filters?.timeRange && filters.timeRange !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-info/10 text-info rounded text-xs">
                            {filters.timeRange === '7d' ? 'Last 7 days' :
                                filters.timeRange === '30d' ? 'Last 30 days' :
                                    filters.timeRange === '90d' ? 'Last 90 days' :
                                        filters.timeRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Bugs" value={totalBugs} icon={Bug} color="red" trend={bugTrendPercent} />
                <MetricCard title="Active Bugs" value={activeBugs} icon={AlertTriangle} color="orange" />
                <MetricCard title="Resolved Bugs" value={resolvedBugs} icon={CheckCircle} color="green" />
                <MetricCard title="Resolution Rate" value={`${bugResolutionRate}%`} icon={TrendingUp} color="blue" />
            </div>

            {/* Severity Distribution */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                    Bug Severity Distribution
                </h3>
                <div className="space-y-4">
                    <SeverityBar severity="Critical" activeCount={criticalBugs} totalActive={activeBugs} color="red" />
                    <SeverityBar severity="High" activeCount={highPriorityBugs} totalActive={activeBugs} color="orange" />
                    <SeverityBar severity="Medium" activeCount={mediumPriorityBugs} totalActive={activeBugs} color="yellow" />
                    <SeverityBar severity="Low" activeCount={lowPriorityBugs} totalActive={activeBugs} color="blue" />
                </div>
            </div>

            {/* Evidence and Report Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Evidence Attachment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <EvidenceCard title="With Video" value={bugsWithVideoEvidence} total={totalBugs} icon={Video} color="blue" />
                        <EvidenceCard title="With Network Logs" value={bugsWithNetworkLogs} total={totalBugs} icon={Network} color="green" />
                        <EvidenceCard title="With Console Logs" value={bugsWithConsoleLogs} total={totalBugs} icon={FileText} color="purple" />
                    </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Report Quality</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-info/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-info" />
                                <span>Avg Completeness</span>
                            </div>
                            <div className="text-3xl font-bold text-info">{Math.round(avgBugReportCompleteness)}%</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span>Reproduction Rate</span>
                            </div>
                            <div className="text-3xl font-bold text-success">{Math.round(bugReproductionRate)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bug Discovery, Resolution, Reporting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Discovery Sources</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Screen Recording</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{bugsFromScreenRecording}</span>
                                <div className="w-2 h-2 rounded-full bg-info"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Manual Testing</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{bugsFromManualTesting}</span>
                                <div className="w-2 h-2 rounded-full bg-warning"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Resolution Metrics</h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-success/10 rounded-lg">
                            <p className="text-2xl font-bold text-success">{Math.round(bugResolutionRate)}%</p>
                            <p className="text-sm text-muted-foreground">Resolution Rate</p>
                        </div>
                        <div className="text-center p-4 bg-warning/10 rounded-lg">
                            <p className="text-2xl font-bold text-warning">{Math.round(avgResolutionTime)}h</p>
                            <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Recently Resolved</span>
                            <span className="font-medium">{recentlyResolvedBugs}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Critical Avg Time</span>
                            <span className="font-medium">{Math.round(criticalBugResolutionTime)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">High Avg Time</span>
                            <span className="font-medium">{Math.round(highBugResolutionTime)}h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bug Management Health */}
            <div className={`${bugHealthStatus === 'critical' ? 'bg-destructive/10' : bugHealthStatus === 'warning' ? 'bg-warning/10' : 'bg-info/10'} rounded-lg border ${bugHealthStatus === 'critical' ? 'border-destructive/20' : bugHealthStatus === 'warning' ? 'border-warning/20' : 'border-info/20'} p-6`}>
                <h3 className="text-lg font-semibold text-foreground mb-4">Bug Management Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">{criticalBugs + highPriorityBugs}</div>
                        <p className="text-sm text-muted-foreground">High Severity Open</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-success">{bugReportQualityScore}%</div>
                        <p className="text-sm text-muted-foreground">Report Quality Score</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-info">{Math.round(bugReproductionRate)}%</div>
                        <p className="text-sm text-muted-foreground">Reproducibility</p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-info">
                            {totalBugs > 0 ? Math.round(((bugsWithVideoEvidence + bugsWithNetworkLogs + bugsWithConsoleLogs) / (totalBugs * 3)) * 100) : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Evidence Coverage</p>
                    </div>
                </div>
            </div>

            {/* Critical & High Status */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                    Critical & High Priority Bug Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-medium text-foreground">Critical Bugs</h4>
                        <div className="bg-destructive/10 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-destructive font-medium">Active Critical</span>
                                <span className="text-2xl font-bold text-destructive">{criticalBugs}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-destructive">Avg Resolution</span>
                                <span className="text-lg font-medium text-destructive">{Math.round(criticalBugResolutionTime)}h</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-destructive/20">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-destructive">Total Active High Severity</span>
                                    <span className="font-bold text-destructive">{criticalBugs + highPriorityBugs}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-medium text-foreground">High Priority Bugs</h4>
                        <div className="bg-warning/10 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-warning font-medium">Active High</span>
                                <span className="text-2xl font-bold text-warning">{highPriorityBugs}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-warning">Avg Resolution</span>
                                <span className="text-lg font-medium text-warning">{Math.round(highBugResolutionTime)}h</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-warning/20">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-warning">Health Status</span>
                                    <span className="font-bold text-warning">{bugHealthStatus}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugTrackingMetrics;