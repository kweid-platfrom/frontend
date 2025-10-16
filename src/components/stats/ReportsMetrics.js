import React, { useMemo } from 'react';
import { 
    FileText, 
    Calendar, 
    Users, 
    Download, 
    AlertCircle,
    Clock, 
    TrendingUp,
    TrendingDown, 
    CheckCircle,
    Eye,
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard'; // Adjust path as needed
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor'; // Adjust path as needed

const reportTypes = ['Test Summary', 'Bug Report', 'Performance', 'Security Audit', 'Sprint Review'];

const ReportsMetrics = ({ filters = {} }) => {
    const { metrics: rawMetrics, loading, error } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);

    const processedMetrics = useMemo(() => {
        const totalReports = metrics.totalReports ?? 0;
        const reviewedReports = metrics.reviewedReports ?? 0;
        const publishedReports = metrics.publishedReports ?? 0;
        const avgGenerationTime = metrics.avgGenerationTime ?? 0;

        const reportsByType = metrics.reportsByType ?? {};
        const mostCommonType = Object.entries(reportsByType).reduce((max, [type, count]) => 
            count > (reportsByType[max] || 0) ? type : max, reportTypes[0] || 'None'
        );

        const storageUsedMB = metrics.storageUsedMB ?? 0;

        return {
            totalReports,
            generatedToday: metrics.generatedToday ?? 0,
            generatedThisWeek: metrics.generatedThisWeek ?? 0,
            generatedThisMonth: metrics.generatedThisMonth ?? 0,
            reviewedReports,
            publishedReports,
            avgGenerationTime,
            mostCommonType,
            storageUsedMB,
            reportsByType,
            reportsByAuthor: metrics.reportsByAuthor ?? {},
            scheduledReports: metrics.scheduledReports ?? 0,
            viewedReports: metrics.viewedReports ?? 0,
            deletedReports: metrics.deletedReports ?? 0,
            reportsTrend: metrics.reportsTrend ?? []
        };
    }, [metrics]);

    const computeTrend = (trendData, key = 'count') => {
        if (!Array.isArray(trendData) || trendData.length < 2) return null;
        const first = trendData[0]?.[key] ?? 0;
        const last = trendData[trendData.length - 1]?.[key] ?? 0;
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };
    const reportsTrendPercent = computeTrend(processedMetrics.reportsTrend);

    // Debug
    console.log('Processed Reports Metrics:', processedMetrics);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-foreground">Loading reports metrics...</span>
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

    const TypeBar = ({ type, count, totalReports, color }) => {
        const percentage = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
        const colors = getColorClasses(color);

        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                    <FileText className={`w-5 h-5 ${colors.text}`} />
                    <span className="font-medium text-foreground">{type}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right text-xs text-muted-foreground">
                        {count} reports
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
        totalReports, generatedToday, generatedThisWeek, generatedThisMonth,
        reviewedReports, publishedReports, avgGenerationTime, mostCommonType,
        storageUsedMB, reportsByType, reportsByAuthor,
        scheduledReports, viewedReports, deletedReports
    } = processedMetrics;

    const topTypes = Object.entries(reportsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const topAuthors = Object.entries(reportsByAuthor)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Reports Metrics</h2>
                <div className="text-sm text-muted-foreground">
                    Total: {totalReports.toLocaleString()} reports generated
                    {filters?.timeRange && filters.timeRange !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-info/10 text-info rounded text-xs">
                            {filters.timeRange === '7d' ? 'Last 7 days' : filters.timeRange === '30d' ? 'Last 30 days' : filters.timeRange === '90d' ? 'Last 90 days' : filters.timeRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Reports" value={totalReports} icon={FileText} color="blue" trend={reportsTrendPercent} />
                <MetricCard title="Generated Today" value={generatedToday} icon={Clock} color="green" />
                <MetricCard title="This Week" value={generatedThisWeek} icon={Calendar} color="orange" />
                <MetricCard title="This Month" value={generatedThisMonth} icon={Calendar} color="purple" />
                <MetricCard title="Reviewed" value={reviewedReports} icon={CheckCircle} color="green" />
                <MetricCard title="Published" value={publishedReports} icon={Eye} color="blue" />
                <MetricCard title="Scheduled" value={scheduledReports} icon={Calendar} color="purple" />
                <MetricCard title="Storage Used" value={`${storageUsedMB} MB`} icon={FileText} color="orange" />
            </div>

            {/* Generation and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Report Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span>Reviewed</span>
                            </div>
                            <div className="text-2xl font-bold text-success">{reviewedReports}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Eye className="w-5 h-5 text-info" />
                                <span>Published</span>
                            </div>
                            <div className="text-2xl font-bold text-info">{publishedReports}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-orange/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Download className="w-5 h-5 text-warning" />
                                <span>Viewed</span>
                            </div>
                            <div className="text-2xl font-bold text-warning">{viewedReports}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Performance</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Avg Generation Time</span>
                            <span className="font-medium">{avgGenerationTime} min</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Most Common Type</span>
                            <span className="font-medium">{mostCommonType}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Deleted Reports</span>
                            <span className="font-medium text-destructive">{deletedReports}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Report Types */}
            {topTypes.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-info" />
                        Top Report Types
                    </h3>
                    <div className="space-y-4">
                        {topTypes.map(([type, count], idx) => {
                            const color = ['blue', 'green', 'purple', 'orange', 'red'][idx % 5];
                            return (
                                <TypeBar 
                                    key={type} 
                                    type={type} 
                                    count={count} 
                                    totalReports={totalReports} 
                                    color={color} 
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Authors and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-info" />
                        Top Authors
                    </h3>
                    <div className="space-y-3">
                        {topAuthors.map(([author, count]) => (
                            <div key={author} className="flex justify-between items-center">
                                <span className="text-foreground">{author}</span>
                                <span className="font-medium">{count} reports</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Generated Today</span>
                            <span className="font-medium">{generatedToday}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Scheduled</span>
                            <span className="font-medium">{scheduledReports}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Viewed Rate</span>
                            <span className="font-medium">{totalReports > 0 ? Math.round((viewedReports / totalReports) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Health Summary */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-info" />
                    Reports Health Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                        <div className="text-2xl font-bold text-info">{totalReports}</div>
                        <p className="text-sm text-muted-foreground">Total Reports</p>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success">{publishedReports}</div>
                        <p className="text-sm text-muted-foreground">Published</p>
                    </div>
                    <div className="text-center p-4 bg-purple/10 rounded-lg">
                        <div className="text-2xl font-bold text-purple">{scheduledReports}</div>
                        <p className="text-sm text-muted-foreground">Scheduled</p>
                    </div>
                    <div className="text-center p-4 bg-orange/10 rounded-lg">
                        <div className="text-2xl font-bold text-orange">{storageUsedMB} MB</div>
                        <p className="text-sm text-muted-foreground">Storage</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsMetrics;