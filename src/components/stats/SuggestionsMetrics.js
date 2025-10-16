import React, { useMemo } from 'react';
import { 
    Lightbulb, 
    TrendingUp,
    TrendingDown, 
    AlertCircle,
    Clock, 
    Users,
    ThumbsUp,
    ThumbsDown,
    CheckCircle,
    XCircle,
    Zap
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard'; // Adjust path as needed
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor'; // Adjust path as needed

const SuggestionsMetrics = ({ filters = {} }) => {
    const { metrics: rawMetrics, loading, error } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);

    const processedMetrics = useMemo(() => {
        const totalSuggestions = metrics.totalSuggestions ?? 0;
        const approvedSuggestions = metrics.approvedSuggestions ?? 0;
        const rejectedSuggestions = metrics.rejectedSuggestions ?? 0;
        const underReview = metrics.underReview ?? 0;
        const avgVotesPerSuggestion = metrics.avgVotesPerSuggestion ?? 0;

        const suggestionsByCategory = metrics.suggestionsByCategory ?? {};
        const mostVotedSuggestion = metrics.mostVotedSuggestion ?? 'None';

        const totalVotes = metrics.totalVotes ?? 0;
        const upvotes = metrics.upvotes ?? 0;
        const downvotes = metrics.downvotes ?? 0;

        return {
            totalSuggestions,
            submittedToday: metrics.submittedToday ?? 0,
            submittedThisWeek: metrics.submittedThisWeek ?? 0,
            submittedThisMonth: metrics.submittedThisMonth ?? 0,
            approvedSuggestions,
            rejectedSuggestions,
            underReview,
            inDevelopment: metrics.inDevelopment ?? 0,
            avgVotesPerSuggestion,
            totalVotes,
            upvotes,
            downvotes,
            mostVotedSuggestion,
            suggestionsByCategory,
            suggestionsByPriority: metrics.suggestionsByPriority ?? {},
            topSubmitters: metrics.topSubmitters ?? {},
            archivedSuggestions: metrics.archivedSuggestions ?? 0,
            suggestionsTrend: metrics.suggestionsTrend ?? []
        };
    }, [metrics]);

    const computeTrend = (trendData, key = 'count') => {
        if (!Array.isArray(trendData) || trendData.length < 2) return null;
        const first = trendData[0]?.[key] ?? 0;
        const last = trendData[trendData.length - 1]?.[key] ?? 0;
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };
    const suggestionsTrendPercent = computeTrend(processedMetrics.suggestionsTrend);

    // Debug
    console.log('Processed Suggestions Metrics:', processedMetrics);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-foreground">Loading feature metrics...</span>
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
            teal: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/20' },
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

    const CategoryBar = ({ category, count, totalSuggestions, color }) => {
        const percentage = totalSuggestions > 0 ? Math.round((count / totalSuggestions) * 100) : 0;
        const colors = getColorClasses(color);

        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                    <Lightbulb className={`w-5 h-5 ${colors.text}`} />
                    <span className="font-medium text-foreground">{category.charAt(0).toUpperCase() + category.slice(1).replace('-', '/')}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right text-xs text-muted-foreground">
                        {count} suggestions
                    </div>
                    <div className="w-32 bg-muted-foreground/20 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${colors.bg}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground w-20 text-right">
                        {percentage}%
                    </span>
                </div>
            </div>
        );
    };

    const {
        totalSuggestions, submittedToday, submittedThisWeek, submittedThisMonth,
        approvedSuggestions, rejectedSuggestions, underReview, inDevelopment,
        avgVotesPerSuggestion, totalVotes, upvotes, downvotes, mostVotedSuggestion,
        suggestionsByCategory, suggestionsByPriority, topSubmitters, archivedSuggestions
    } = processedMetrics;

    const topCategories = Object.entries(suggestionsByCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const topPriorities = Object.entries(suggestionsByPriority)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    const topSubmittersList = Object.entries(topSubmitters)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Feature Suggestions Metrics</h2>
                <div className="text-sm text-muted-foreground">
                    Total: {totalSuggestions.toLocaleString()} suggestions
                    {filters?.timeRange && filters.timeRange !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-info/10 text-info rounded text-xs">
                            {filters.timeRange === '7d' ? 'Last 7 days' : filters.timeRange === '30d' ? 'Last 30 days' : filters.timeRange === '90d' ? 'Last 90 days' : filters.timeRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Suggestions" value={totalSuggestions} icon={Lightbulb} color="teal" trend={suggestionsTrendPercent} />
                <MetricCard title="Submitted Today" value={submittedToday} icon={Clock} color="green" />
                <MetricCard title="This Week" value={submittedThisWeek} icon={Clock} color="orange" />
                <MetricCard title="This Month" value={submittedThisMonth} icon={Clock} color="purple" />
                <MetricCard title="Approved" value={approvedSuggestions} icon={CheckCircle} color="green" />
                <MetricCard title="Rejected" value={rejectedSuggestions} icon={XCircle} color="red" />
                <MetricCard title="Under Review" value={underReview} icon={Zap} color="blue" />
                <MetricCard title="In Development" value={inDevelopment} icon={TrendingUp} color="teal" />
            </div>

            {/* Voting and Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Voting Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
                            <div className="flex items-center space-x-2">
                                <ThumbsUp className="w-5 h-5 text-success" />
                                <span className="text-foreground">Upvotes</span>
                            </div>
                            <div className="text-2xl font-bold text-success">{upvotes}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <div className="flex items-center space-x-2">
                                <ThumbsDown className="w-5 h-5 text-destructive" />
                                <span className="text-foreground">Downvotes</span>
                            </div>
                            <div className="text-2xl font-bold text-destructive">{downvotes}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-info/10 rounded-lg border border-info/20">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-5 h-5 text-info" />
                                <span className="text-foreground">Total Votes</span>
                            </div>
                            <div className="text-2xl font-bold text-info">{totalVotes}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Engagement</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Avg Votes/Suggestion</span>
                            <span className="font-medium">{avgVotesPerSuggestion}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Most Voted</span>
                            <span className="font-medium">{mostVotedSuggestion}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Approval Rate</span>
                            <span className="font-medium">{totalSuggestions > 0 ? Math.round((approvedSuggestions / totalSuggestions) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Categories */}
            {topCategories.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-info" />
                        Top Categories
                    </h3>
                    <div className="space-y-4">
                        {topCategories.map(([category, count], idx) => {
                            const color = ['teal', 'green', 'purple', 'orange', 'blue'][idx % 5];
                            return (
                                <CategoryBar 
                                    key={category} 
                                    category={category} 
                                    count={count} 
                                    totalSuggestions={totalSuggestions} 
                                    color={color} 
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Submitters and Priorities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-info" />
                        Top Submitters
                    </h3>
                    <div className="space-y-3">
                        {topSubmittersList.map(([submitter, count]) => (
                            <div key={submitter} className="flex justify-between items-center">
                                <span className="text-foreground">{submitter}</span>
                                <span className="font-medium">{count} suggestions</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Priority Distribution</h3>
                    <div className="space-y-3">
                        {topPriorities.map(([priority, count]) => (
                            <div key={priority} className="flex justify-between items-center">
                                <span className="text-muted-foreground">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                                <span className="font-medium">{count} suggestions</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature Health Summary */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-info" />
                    Suggestions Health Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                        <div className="text-2xl font-bold text-info">{totalSuggestions}</div>
                        <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success">{approvedSuggestions}</div>
                        <p className="text-sm text-muted-foreground">Approved</p>
                    </div>
                    <div className="text-center p-4 bg-teal-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">{upvotes}</div>
                        <p className="text-sm text-muted-foreground">Upvotes</p>
                    </div>
                    <div className="text-center p-4 bg-purple/10 rounded-lg">
                        <div className="text-2xl font-bold text-purple">{archivedSuggestions}</div>
                        <p className="text-sm text-muted-foreground">Archived</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuggestionsMetrics;