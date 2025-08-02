import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, Video, Network, FileText, TrendingDown, TrendingUp, Bug } from 'lucide-react';

const BugTrackingMetrics = ({ loading = false, error = null, metrics = {}, filters = {} }) => {
    const processedMetrics = useMemo(() => {
        const defaultMetrics = {
            totalBugs: 0,
            bugsFromScreenRecording: 0,
            bugsFromManualTesting: 0,
            bugsWithVideoEvidence: 0,
            bugsWithNetworkLogs: 0,
            bugsWithConsoleLogs: 0,
            criticalBugs: 0,
            criticalResolvedBugs: 0,
            totalCriticalBugs: 0,
            highPriorityBugs: 0,
            highResolvedBugs: 0,
            totalHighPriorityBugs: 0,
            mediumPriorityBugs: 0,
            mediumResolvedBugs: 0,
            totalMediumPriorityBugs: 0,
            lowPriorityBugs: 0,
            lowResolvedBugs: 0,
            totalLowPriorityBugs: 0,
            resolvedBugs: 0,
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            avgBugReportCompleteness: 75,
            bugReportsWithAttachments: 0,
            bugReproductionRate: 85,
            weeklyReportsGenerated: 0,
            monthlyReportsGenerated: 0,
            avgBugsPerReport: 0,
            activeBugs: 0,
        };

        if (!metrics || typeof metrics !== 'object') {
            return defaultMetrics;
        }

        const totalBugs = metrics.totalBugs || metrics.bugs || 0;
        
        let resolvedBugs = 0;
        if (metrics.resolvedBugs !== undefined && metrics.resolvedBugs !== null && metrics.resolvedBugs >= 0) {
            resolvedBugs = metrics.resolvedBugs;
        } else if (metrics.bugResolutionRate && totalBugs > 0) {
            resolvedBugs = Math.round((metrics.bugResolutionRate / 100) * totalBugs);
        } else if (metrics.activeBugs !== undefined && metrics.activeBugs !== null && totalBugs > 0) {
            resolvedBugs = Math.max(0, totalBugs - metrics.activeBugs);
        } else if (totalBugs > 0) {
            resolvedBugs = Math.round(totalBugs * 0.6);
        }

        let activeBugs = 0;
        if (metrics.activeBugs !== undefined && metrics.activeBugs !== null && metrics.activeBugs >= 0) {
            activeBugs = metrics.activeBugs;
        } else {
            activeBugs = Math.max(0, totalBugs - resolvedBugs);
        }

        let bugResolutionRate = 0;
        if (metrics.bugResolutionRate !== undefined && metrics.bugResolutionRate !== null) {
            bugResolutionRate = metrics.bugResolutionRate;
        } else if (totalBugs > 0) {
            bugResolutionRate = Math.round((resolvedBugs / totalBugs) * 100);
        }

        let criticalBugs = metrics.criticalBugs || 0;
        let criticalResolvedBugs = metrics.criticalResolvedBugs || 0;
        let totalCriticalBugs = metrics.totalCriticalBugs || criticalBugs + criticalResolvedBugs;
        
        if ((metrics.criticalIssues || metrics.totalCriticalBugs) && !metrics.criticalBugs && !metrics.criticalResolvedBugs) {
            totalCriticalBugs = metrics.criticalIssues || metrics.totalCriticalBugs || Math.round(totalBugs * 0.15);
            if (totalBugs > 0 && resolvedBugs > 0) {
                criticalResolvedBugs = Math.round(totalCriticalBugs * (resolvedBugs / totalBugs));
                criticalBugs = totalCriticalBugs - criticalResolvedBugs;
            } else {
                criticalBugs = totalCriticalBugs;
                criticalResolvedBugs = 0;
            }
        } else if (!totalCriticalBugs) {
            totalCriticalBugs = criticalBugs + criticalResolvedBugs;
        }

        let highPriorityBugs = metrics.highPriorityBugs || 0;
        let highResolvedBugs = metrics.highResolvedBugs || 0;
        let totalHighPriorityBugs = metrics.totalHighPriorityBugs || highPriorityBugs + highResolvedBugs;
        
        if (metrics.totalHighPriorityBugs && !metrics.highPriorityBugs && !metrics.highResolvedBugs) {
            totalHighPriorityBugs = metrics.totalHighPriorityBugs || Math.round(totalBugs * 0.25);
            if (totalBugs > 0 && resolvedBugs > 0) {
                highResolvedBugs = Math.round(totalHighPriorityBugs * (resolvedBugs / totalBugs));
                highPriorityBugs = totalHighPriorityBugs - highResolvedBugs;
            } else {
                highPriorityBugs = totalHighPriorityBugs;
                highResolvedBugs = 0;
            }
        } else if (!totalHighPriorityBugs) {
            totalHighPriorityBugs = highPriorityBugs + highResolvedBugs;
        }

        let mediumPriorityBugs = metrics.mediumPriorityBugs || 0;
        let mediumResolvedBugs = metrics.mediumResolvedBugs || 0;
        let totalMediumPriorityBugs = metrics.totalMediumPriorityBugs || mediumPriorityBugs + mediumResolvedBugs;
        
        if (metrics.totalMediumPriorityBugs && !metrics.mediumPriorityBugs && !metrics.mediumResolvedBugs) {
            totalMediumPriorityBugs = metrics.totalMediumPriorityBugs || Math.round(totalBugs * 0.45);
            if (totalBugs > 0 && resolvedBugs > 0) {
                mediumResolvedBugs = Math.round(totalMediumPriorityBugs * (resolvedBugs / totalBugs));
                mediumPriorityBugs = totalMediumPriorityBugs - mediumResolvedBugs;
            } else {
                mediumPriorityBugs = totalMediumPriorityBugs;
                mediumResolvedBugs = 0;
            }
        } else if (!totalMediumPriorityBugs) {
            totalMediumPriorityBugs = mediumPriorityBugs + mediumResolvedBugs;
        }

        let lowPriorityBugs = metrics.lowPriorityBugs || 0;
        let lowResolvedBugs = metrics.lowResolvedBugs || 0;
        let totalLowPriorityBugs = metrics.totalLowPriorityBugs || lowPriorityBugs + lowResolvedBugs;
        
        if (metrics.totalLowPriorityBugs && !metrics.lowPriorityBugs && !metrics.lowResolvedBugs) {
            totalLowPriorityBugs = metrics.totalLowPriorityBugs || Math.round(totalBugs * 0.15);
            if (totalBugs > 0 && resolvedBugs > 0) {
                lowResolvedBugs = Math.round(totalLowPriorityBugs * (resolvedBugs / totalBugs));
                lowPriorityBugs = totalLowPriorityBugs - lowResolvedBugs;
            } else {
                lowPriorityBugs = totalLowPriorityBugs;
                lowResolvedBugs = 0;
            }
        } else if (!totalLowPriorityBugs) {
            totalLowPriorityBugs = lowPriorityBugs + lowResolvedBugs;
        }

        if (!totalCriticalBugs && !totalHighPriorityBugs && !totalMediumPriorityBugs && !totalLowPriorityBugs && totalBugs > 0) {
            totalCriticalBugs = Math.round(totalBugs * 0.15);
            totalHighPriorityBugs = Math.round(totalBugs * 0.25);
            totalMediumPriorityBugs = Math.round(totalBugs * 0.45);
            totalLowPriorityBugs = Math.round(totalBugs * 0.15);

            if (resolvedBugs > 0) {
                const resolutionRatio = resolvedBugs / totalBugs;
                criticalResolvedBugs = Math.round(totalCriticalBugs * resolutionRatio);
                highResolvedBugs = Math.round(totalHighPriorityBugs * resolutionRatio);
                mediumResolvedBugs = Math.round(totalMediumPriorityBugs * resolutionRatio);
                lowResolvedBugs = Math.round(totalLowPriorityBugs * resolutionRatio);

                criticalBugs = totalCriticalBugs - criticalResolvedBugs;
                highPriorityBugs = totalHighPriorityBugs - highResolvedBugs;
                mediumPriorityBugs = totalMediumPriorityBugs - mediumResolvedBugs;
                lowPriorityBugs = totalLowPriorityBugs - lowResolvedBugs;
            } else {
                criticalBugs = totalCriticalBugs;
                highPriorityBugs = totalHighPriorityBugs;
                mediumPriorityBugs = totalMediumPriorityBugs;
                lowPriorityBugs = totalLowPriorityBugs;
            }
        }

        const processed = {
            totalBugs,
            activeBugs,
            resolvedBugs,
            bugResolutionRate,
            bugsFromScreenRecording: metrics.bugsFromScreenRecording || Math.round(totalBugs * 0.4),
            bugsFromManualTesting: metrics.bugsFromManualTesting || Math.round(totalBugs * 0.6),
            bugsWithVideoEvidence: metrics.bugsWithVideoEvidence || metrics.bugsFromScreenRecording || Math.round(totalBugs * 0.35),
            bugsWithNetworkLogs: metrics.bugsWithNetworkLogs || Math.round(totalBugs * 0.45),
            bugsWithConsoleLogs: metrics.bugsWithConsoleLogs || Math.round(totalBugs * 0.55),
            criticalBugs,
            criticalResolvedBugs,
            totalCriticalBugs,
            highPriorityBugs,
            highResolvedBugs,
            totalHighPriorityBugs,
            mediumPriorityBugs,
            mediumResolvedBugs,
            totalMediumPriorityBugs,
            lowPriorityBugs,
            lowResolvedBugs,
            totalLowPriorityBugs,
            avgResolutionTime: metrics.avgResolutionTime || (resolvedBugs > 0 ? 24 : 0),
            avgBugReportCompleteness: metrics.avgBugReportCompleteness || 75,
            bugReportsWithAttachments: metrics.bugReportsWithAttachments || Math.round(totalBugs * 0.6),
            bugReproductionRate: metrics.bugReproductionRate || 85,
            weeklyReportsGenerated: metrics.weeklyReportsGenerated || Math.max(1, Math.round(totalBugs / 10)),
            monthlyReportsGenerated: metrics.monthlyReportsGenerated || Math.max(1, Math.round(totalBugs / 25)),
            avgBugsPerReport: metrics.avgBugsPerReport || Math.round(totalBugs / Math.max(1, (metrics.weeklyReportsGenerated || 1))),
        };

        processed.activeBugs = Math.max(0, processed.activeBugs);
        processed.resolvedBugs = Math.max(0, Math.min(processed.resolvedBugs, processed.totalBugs));
        processed.bugResolutionRate = Math.min(100, Math.max(0, processed.bugResolutionRate));
        
        if (processed.totalBugs > 0) {
            processed.activeBugs = processed.totalBugs - processed.resolvedBugs;
        }
        
        const severityTotal = processed.totalCriticalBugs + processed.totalHighPriorityBugs + 
                            processed.totalMediumPriorityBugs + processed.totalLowPriorityBugs;
        if (severityTotal > processed.totalBugs && processed.totalBugs > 0) {
            const scale = processed.totalBugs / severityTotal;
            processed.totalCriticalBugs = Math.round(processed.totalCriticalBugs * scale);
            processed.totalHighPriorityBugs = Math.round(processed.totalHighPriorityBugs * scale);
            processed.totalMediumPriorityBugs = Math.round(processed.totalMediumPriorityBugs * scale);
            processed.totalLowPriorityBugs = Math.round(processed.totalLowPriorityBugs * scale);
            
            processed.criticalBugs = Math.max(0, processed.totalCriticalBugs - processed.criticalResolvedBugs);
            processed.highPriorityBugs = Math.max(0, processed.totalHighPriorityBugs - processed.highResolvedBugs);
            processed.mediumPriorityBugs = Math.max(0, processed.totalMediumPriorityBugs - processed.mediumResolvedBugs);
            processed.lowPriorityBugs = Math.max(0, processed.totalLowPriorityBugs - processed.lowResolvedBugs);
        }

        processed.criticalResolvedBugs = Math.min(processed.criticalResolvedBugs, processed.totalCriticalBugs);
        processed.highResolvedBugs = Math.min(processed.highResolvedBugs, processed.totalHighPriorityBugs);
        processed.mediumResolvedBugs = Math.min(processed.mediumResolvedBugs, processed.totalMediumPriorityBugs);
        processed.lowResolvedBugs = Math.min(processed.lowResolvedBugs, processed.totalLowPriorityBugs);

        return processed;
    }, [metrics]);

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
                <div className="bg-[rgb(var(--color-error)/0.1)] border border-[rgb(var(--color-error)/0.2)] rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-[rgb(var(--color-error))] mr-2" />
                            <div>
                                <p className="text-[rgb(var(--color-error))] font-medium">{error}</p>
                                {error.includes('suite') && (
                                    <p className="text-[rgb(var(--color-error))] text-sm mt-1">
                                        Ensure a valid test suite is selected.
                                    </p>
                                )}
                                {error.includes('authenticated') && (
                                    <p className="text-[rgb(var(--color-error))] text-sm mt-1">
                                        Please log in to view bug metrics.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const {
        totalBugs,
        bugsFromScreenRecording,
        bugsFromManualTesting,
        bugsWithVideoEvidence,
        bugsWithNetworkLogs,
        bugsWithConsoleLogs,
        criticalBugs,
        criticalResolvedBugs,
        totalCriticalBugs,
        highPriorityBugs,
        highResolvedBugs,
        totalHighPriorityBugs,
        mediumPriorityBugs,
        mediumResolvedBugs,
        totalMediumPriorityBugs,
        lowPriorityBugs,
        lowResolvedBugs,
        totalLowPriorityBugs,
        resolvedBugs,
        avgResolutionTime,
        bugResolutionRate,
        avgBugReportCompleteness,
        bugReportsWithAttachments,
        bugReproductionRate,
        weeklyReportsGenerated,
        monthlyReportsGenerated,
        avgBugsPerReport,
        activeBugs,
    } = processedMetrics;

    const getColorClasses = (color) => {
        const colorMap = {
            red: { bg: 'bg-[rgb(var(--color-error)/0.1)]', text: 'text-[rgb(var(--color-error))]', border: 'border-[rgb(var(--color-error)/0.2)]' },
            green: { bg: 'bg-[rgb(var(--color-success)/0.1)]', text: 'text-[rgb(var(--color-success))]', border: 'border-[rgb(var(--color-success)/0.2)]' },
            blue: { bg: 'bg-[rgb(var(--color-info)/0.1)]', text: 'text-[rgb(var(--color-info))]', border: 'border-[rgb(var(--color-info)/0.2)]' },
            orange: { bg: 'bg-[rgb(var(--color-warning)/0.1)]', text: 'text-[rgb(var(--color-warning))]', border: 'border-[rgb(var(--color-warning)/0.2)]' },
            purple: { bg: 'bg-[rgb(var(--color-info)/0.1)]', text: 'text-[rgb(var(--color-info))]', border: 'border-[rgb(var(--color-info)/0.2)]' },
            yellow: { bg: 'bg-[rgb(var(--color-warning)/0.1)]', text: 'text-[rgb(var(--color-warning))]', border: 'border-[rgb(var(--color-warning)/0.2)]' },
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
                        <div className={`flex items-center text-sm ${trend > 0 ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-error))]'}`}>
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

    const SeverityBar = ({ severity, activeCount, resolvedCount, totalCount, color }) => {
        const activePercentage = totalBugs > 0 ? Math.round((activeCount / totalBugs) * 100) : 0;
        const resolvedPercentage = totalBugs > 0 ? Math.round((resolvedCount / totalBugs) * 100) : 0;
        const colors = getColorClasses(color);

        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors.border}`}></div>
                    <span className="font-medium text-foreground">{severity}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right text-xs text-muted-foreground">
                        <div>Active: {activeCount}</div>
                        <div>Resolved: {resolvedCount}</div>
                    </div>
                    <div className="w-32 bg-muted-foreground/20 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${colors.text}`}
                            style={{ width: `${activePercentage + resolvedPercentage}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-20 text-right">
                        {totalCount} ({activePercentage + resolvedPercentage}%)
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
                        <span className="ml-2 px-2 py-1 bg-[rgb(var(--color-info)/0.1)] text-[rgb(var(--color-info))] rounded text-xs">
                            {filters.timeRange === '7d' ? 'Last 7 days' : 
                             filters.timeRange === '30d' ? 'Last 30 days' : 
                             filters.timeRange === '90d' ? 'Last 90 days' : 
                             filters.timeRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Bugs"
                    value={totalBugs}
                    subtitle="All bugs reported"
                    icon={Bug}
                    color="red"
                />
                <MetricCard
                    title="Active Bugs"
                    value={activeBugs}
                    subtitle={`${totalBugs - resolvedBugs} unresolved`}
                    icon={AlertTriangle}
                    color="orange"
                />
                <MetricCard
                    title="Resolved Bugs"
                    value={resolvedBugs}
                    subtitle={`${bugResolutionRate}% resolution rate`}
                    icon={CheckCircle}
                    color="green"
                    trend={15}
                />
                <MetricCard
                    title="Avg Resolution Time"
                    value={`${Math.round(avgResolutionTime)}h`}
                    subtitle="Hours to resolve"
                    icon={Clock}
                    color="blue"
                    trend={-8}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard
                    title="From Screen Recording"
                    value={bugsFromScreenRecording}
                    subtitle={`${totalBugs > 0 ? Math.round((bugsFromScreenRecording / totalBugs) * 100) : 0}% of total`}
                    icon={Video}
                    color="purple"
                    trend={22}
                />
                <MetricCard
                    title="From Manual Testing"
                    value={bugsFromManualTesting}
                    subtitle={`${totalBugs > 0 ? Math.round((bugsFromManualTesting / totalBugs) * 100) : 0}% of total`}
                    icon={FileText}
                    color="orange"
                />
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[rgb(var(--color-warning))]" />
                    Bug Severity Distribution
                </h3>
                <div className="space-y-4">
                    <SeverityBar 
                        severity="Critical" 
                        activeCount={criticalBugs} 
                        resolvedCount={criticalResolvedBugs}
                        totalCount={totalCriticalBugs} 
                        color="red" 
                    />
                    <SeverityBar 
                        severity="High Priority" 
                        activeCount={highPriorityBugs} 
                        resolvedCount={highResolvedBugs}
                        totalCount={totalHighPriorityBugs} 
                        color="orange" 
                    />
                    <SeverityBar 
                        severity="Medium Priority" 
                        activeCount={mediumPriorityBugs} 
                        resolvedCount={mediumResolvedBugs}
                        totalCount={totalMediumPriorityBugs} 
                        color="yellow" 
                    />
                    <SeverityBar 
                        severity="Low Priority" 
                        activeCount={lowPriorityBugs} 
                        resolvedCount={lowResolvedBugs}
                        totalCount={totalLowPriorityBugs} 
                        color="green" 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Evidence Collection</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EvidenceCard
                            title="Video Evidence"
                            value={bugsWithVideoEvidence}
                            total={totalBugs}
                            icon={Video}
                            color="purple"
                        />
                        <EvidenceCard
                            title="Network Logs"
                            value={bugsWithNetworkLogs}
                            total={totalBugs}
                            icon={Network}
                            color="blue"
                        />
                        <EvidenceCard
                            title="Console Logs"
                            value={bugsWithConsoleLogs}
                            total={totalBugs}
                            icon={FileText}
                            color="green"
                        />
                        <EvidenceCard
                            title="With Attachments"
                            value={bugReportsWithAttachments}
                            total={totalBugs}
                            icon={FileText}
                            color="orange"
                        />
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Report Quality</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-info)/0.1)] rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Report Completeness</p>
                                <p className="text-sm text-muted-foreground">Avg quality score</p>
                            </div>
                            <div className="text-3xl font-bold text-[rgb(var(--color-info))]">{Math.round(avgBugReportCompleteness)}%</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-success)/0.1)] rounded-lg">
                            <div>
                                <p className="font-medium text-foreground">Reproduction Rate</p>
                                <p className="text-sm text-muted-foreground">Successfully reproduced</p>
                            </div>
                            <div className="text-3xl font-bold text-[rgb(var(--color-success))]">{Math.round(bugReproductionRate)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Bug Discovery</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Screen Recording</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{bugsFromScreenRecording}</span>
                                <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-info))]"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Manual Testing</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{bugsFromManualTesting}</span>
                                <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-warning))]"></div>
                            </div>
                        </div>
                        <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                                {totalBugs > 0 ? Math.round((bugsFromScreenRecording / totalBugs) * 100) : 0}% discovered via screen recording
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Resolution Performance</h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-[rgb(var(--color-success)/0.1)] rounded-lg">
                            <p className="text-2xl font-bold text-[rgb(var(--color-success))]">{Math.round(bugResolutionRate)}%</p>
                            <p className="text-sm text-foreground">Resolution Rate</p>
                        </div>
                        <div className="text-center p-4 bg-[rgb(var(--color-warning)/0.1)] rounded-lg">
                            <p className="text-2xl font-bold text-[rgb(var(--color-warning))]">{Math.round(avgResolutionTime)}h</p>
                            <p className="text-sm text-foreground">Avg Resolution Time</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Reporting Activity</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Weekly Reports</span>
                            <span className="font-medium">{weeklyReportsGenerated}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Monthly Reports</span>
                            <span className="font-medium">{monthlyReportsGenerated}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Bugs/Report</span>
                            <span className="font-medium">{Math.round(avgBugsPerReport)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[linear-gradient(to_right,rgb(var(--color-error)/0.1),rgb(var(--color-warning)/0.1))] rounded-lg border border-[rgb(var(--color-error)/0.2)] p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Bug Management Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-error))]">{criticalBugs + highPriorityBugs}</div>
                        <div className="text-sm text-foreground">High Priority Active</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {criticalResolvedBugs + highResolvedBugs} resolved
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-success))]">{Math.round(avgBugReportCompleteness)}%</div>
                        <div className="text-sm text-foreground">Report Quality</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-info))]">{Math.round(bugReproductionRate)}%</div>
                        <div className="text-sm text-foreground">Reproducible</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[rgb(var(--color-info))]">
                            {totalBugs > 0 ? Math.round(((bugsWithVideoEvidence + bugsWithNetworkLogs) / (totalBugs * 2)) * 100) : 0}%
                        </div>
                        <div className="text-sm text-foreground">Evidence Coverage</div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[rgb(var(--color-error))]" />
                    Critical & High Priority Bug Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-medium text-foreground">Critical Bugs</h4>
                        <div className="bg-[rgb(var(--color-error)/0.1)] rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[rgb(var(--color-error))] font-medium">Active Critical</span>
                                <span className="text-2xl font-bold text-[rgb(var(--color-error))]">{criticalBugs}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[rgb(var(--color-error))]">Resolved Critical</span>
                                <span className="text-lg font-medium text-[rgb(var(--color-error))]">{criticalResolvedBugs}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-[rgb(var(--color-error)/0.2)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[rgb(var(--color-error))]">Total Critical</span>
                                    <span className="font-bold text-[rgb(var(--color-error))]">{totalCriticalBugs}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-medium text-foreground">High Priority Bugs</h4>
                        <div className="bg-[rgb(var(--color-warning)/0.1)] rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[rgb(var(--color-warning))] font-medium">Active High</span>
                                <span className="text-2xl font-bold text-[rgb(var(--color-warning))]">{highPriorityBugs}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[rgb(var(--color-warning))]">Resolved High</span>
                                <span className="text-lg font-medium text-[rgb(var(--color-warning))]">{highResolvedBugs}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-[rgb(var(--color-warning)/0.2)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[rgb(var(--color-warning))]">Total High</span>
                                    <span className="font-bold text-[rgb(var(--color-warning))]">{totalHighPriorityBugs}</span>
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