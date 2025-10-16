import React, { useMemo } from 'react';
import { 
    Calendar, 
    Clock, 
    Target, 
    TrendingUp, 
    TrendingDown, 
    CheckCircle, 
    AlertCircle,
    Users,
    BarChart3,
    Zap
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard'; // Adjust path as needed
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor'; // Adjust path as needed
import { useApp } from '../../context/AppProvider';

const SprintMetrics = ({ filters = {} }) => {
    const { metrics: rawMetrics, loading, error } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);
    const { state } = useApp();
    const { sprints = [] } = state.sprints || {};
    const { activeSuite } = state.suites || {};

    const processedMetrics = useMemo(() => {
        const defaultMetrics = {
            totalSprints: 0,
            activeSprints: 0,
            completedSprints: 0,
            onHoldSprints: 0,
            planningSprints: 0,
            avgSprintDuration: 0,
            avgVelocity: 0,
            avgCompletionRate: 0,
            totalStoryPoints: 0,
            completedStoryPoints: 0,
            bugsInSprints: 0,
            testsExecutedInSprints: 0,
            automationRateInSprints: 0,
            teamMembersInvolved: 0,
            avgBugResolutionInSprints: 0,
            sprintGoalAchievementRate: 0,
            overdueSprints: 0,
            onTimeCompletionRate: 0,
            sprintTrend: []
        };

        const totalSprints = metrics.totalSprints ?? sprints.length ?? 0;

        let activeSprints = metrics.activeSprints ?? sprints.filter(s => s.status === 'active').length;
        let completedSprints = metrics.completedSprints ?? sprints.filter(s => s.status === 'completed').length;
        let onHoldSprints = metrics.onHoldSprints ?? sprints.filter(s => s.status === 'on-hold').length;
        let planningSprints = metrics.planningSprints ?? sprints.filter(s => s.status === 'planning').length;

        let totalStoryPoints = metrics.totalStoryPoints ?? 0;
        let completedStoryPoints = metrics.completedStoryPoints ?? 0;

        if (totalSprints > 0 && sprints.length > 0) {
            totalStoryPoints = sprints.reduce((sum, s) => sum + (s.progress?.totalTasks || 0), 0);
            completedStoryPoints = sprints.reduce((sum, s) => sum + (s.progress?.completedTasks || 0), 0);
        }

        const avgCompletionRate = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;
        const avgVelocity = metrics.avgVelocity ?? (totalSprints > 0 ? Math.round(completedStoryPoints / totalSprints) : 0);
        const onTimeCompletionRate = metrics.onTimeCompletionRate ?? (totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0);

        return {
            totalSprints,
            activeSprints,
            completedSprints,
            onHoldSprints,
            planningSprints,
            avgSprintDuration: metrics.avgSprintDuration ?? 14,
            avgVelocity,
            avgCompletionRate,
            totalStoryPoints,
            completedStoryPoints,
            bugsInSprints: metrics.bugsInSprints ?? 0,
            testsExecutedInSprints: metrics.testsExecutedInSprints ?? 0,
            automationRateInSprints: metrics.automationRateInSprints ?? 0,
            teamMembersInvolved: metrics.teamMembersInvolved ?? 0,
            avgBugResolutionInSprints: metrics.avgBugResolutionInSprints ?? 0,
            sprintGoalAchievementRate: metrics.sprintGoalAchievementRate ?? 0,
            overdueSprints: metrics.overdueSprints ?? 0,
            onTimeCompletionRate,
            sprintTrend: metrics.sprintTrend ?? []
        };
    }, [metrics, sprints]);

    const computeTrend = (trendData, key = 'count') => {
        if (!Array.isArray(trendData) || trendData.length < 2) return null;
        const first = trendData[0]?.[key] ?? 0;
        const last = trendData[trendData.length - 1]?.[key] ?? 0;
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };
    const sprintTrendPercent = computeTrend(processedMetrics.sprintTrend);

    // Debug
    console.log('Processed Sprint Metrics:', processedMetrics);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-foreground">Loading sprint metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-destructive mr-2" />
                        <div>
                            <p className="text-destructive font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getColorClasses = (color) => {
        const colorMap = {
            blue: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
            green: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
            orange: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
            red: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
            purple: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
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

    const {
        totalSprints, activeSprints, completedSprints, onHoldSprints, planningSprints,
        avgSprintDuration, avgVelocity, avgCompletionRate, totalStoryPoints, completedStoryPoints,
        bugsInSprints, testsExecutedInSprints, automationRateInSprints, teamMembersInvolved,
        avgBugResolutionInSprints, sprintGoalAchievementRate, overdueSprints, onTimeCompletionRate
    } = processedMetrics;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Sprint Metrics & Performance</h2>
                <div className="text-sm text-muted-foreground">
                    Total: {totalSprints} sprints for {activeSuite?.name || 'suite'}
                    {filters?.timeRange && filters.timeRange !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-info/10 text-info rounded text-xs">
                            {filters.timeRange === '7d' ? 'Last 7 days' : filters.timeRange === '30d' ? 'Last 30 days' : filters.timeRange === '90d' ? 'Last 90 days' : filters.timeRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Sprints" value={totalSprints} icon={Calendar} color="blue" trend={sprintTrendPercent} />
                <MetricCard title="Active Sprints" value={activeSprints} icon={Zap} color="green" />
                <MetricCard title="Completed Sprints" value={completedSprints} icon={CheckCircle} color="green" />
                <MetricCard title="Avg Velocity" value={avgVelocity} subtitle="points/sprint" icon={TrendingUp} color="purple" />
                <MetricCard title="Completion Rate" value={`${avgCompletionRate}%`} icon={BarChart3} color="blue" />
                <MetricCard title="On-Time Rate" value={`${onTimeCompletionRate}%`} icon={Clock} color="orange" />
                <MetricCard title="Overdue Sprints" value={overdueSprints} icon={AlertCircle} color="red" />
                <MetricCard title="Goal Achievement" value={`${sprintGoalAchievementRate}%`} icon={Target} color="green" />
            </div>

            {/* Status Distribution */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-info" />
                    Sprint Status Distribution
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">Active</span>
                        </div>
                        <span className="font-medium text-foreground">{activeSprints} ({totalSprints > 0 ? Math.round((activeSprints / totalSprints) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="font-medium">Completed</span>
                        </div>
                        <span className="font-medium text-foreground">{completedSprints} ({totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="font-medium">On Hold</span>
                        </div>
                        <span className="font-medium text-foreground">{onHoldSprints} ({totalSprints > 0 ? Math.round((onHoldSprints / totalSprints) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            <span className="font-medium">Planning</span>
                        </div>
                        <span className="font-medium text-foreground">{planningSprints} ({totalSprints > 0 ? Math.round((planningSprints / totalSprints) * 100) : 0}%)</span>
                    </div>
                </div>
            </div>

            {/* Performance & Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Sprint Performance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Target className="w-5 h-5 text-success" />
                                <span>Story Points Completed</span>
                            </div>
                            <div className="text-2xl font-bold text-success">{completedStoryPoints} / {totalStoryPoints}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-info/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-info" />
                                <span>Avg Duration</span>
                            </div>
                            <div className="text-2xl font-bold text-info">{avgSprintDuration} days</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Users className="w-5 h-5 text-purple" />
                                <span>Team Members</span>
                            </div>
                            <div className="text-2xl font-bold text-purple">{teamMembersInvolved}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Quality Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-destructive" />
                                <span>Bugs in Sprints</span>
                            </div>
                            <div className="text-2xl font-bold text-destructive">{bugsInSprints}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-warning" />
                                <span>Avg Bug Resolution</span>
                            </div>
                            <div className="text-2xl font-bold text-warning">{avgBugResolutionInSprints}h</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Zap className="w-5 h-5 text-success" />
                                <span>Automation Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-success">{automationRateInSprints}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sprint Health */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-info" />
                    Overall Sprint Health
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                        <div className="text-2xl font-bold text-info">{avgVelocity}</div>
                        <p className="text-sm text-muted-foreground">Avg Velocity</p>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success">{avgCompletionRate}%</div>
                        <p className="text-sm text-muted-foreground">Completion</p>
                    </div>
                    <div className="text-center p-4 bg-warning/10 rounded-lg">
                        <div className="text-2xl font-bold text-warning">{testsExecutedInSprints}</div>
                        <p className="text-sm text-muted-foreground">Tests Executed</p>
                    </div>
                    <div className="text-center p-4 bg-destructive/10 rounded-lg">
                        <div className="text-2xl font-bold text-destructive">{overdueSprints}</div>
                        <p className="text-sm text-muted-foreground">Overdue</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SprintMetrics;