import React, { useMemo } from 'react';
import { 
    FileText, 
    Archive, 
    Download, 
    AlertCircle,
    Clock, 
    TrendingUp, 
    Users,
    Tag,
    Share2,
    Trash2,
    CheckCircle,
    BarChart3,
    Activity,
    TrendingDown
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor';

const DocumentMetrics = ({ filters = {} }) => {
    const { metrics: rawMetrics, loading, error } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);

    const totalDocuments = metrics.totalDocuments ?? 0;
    const activeDocuments = metrics.activeDocuments ?? 0;
    const archivedDocuments = metrics.archivedDocuments ?? 0;
    const recentlyModified = metrics.recentlyModified ?? 0;
    const taggedDocuments = metrics.taggedDocuments ?? 0;
    const sharedDocuments = metrics.sharedDocuments ?? 0;
    const exportedDocuments = metrics.exportedDocuments ?? 0;
    const deletedDocuments = metrics.deletedDocuments ?? 0;
    const topTags = metrics.topTags ?? [];
    const collaborators = metrics.collaborators ?? 0;
    const documentTrend = metrics.documentTrend ?? [];

    const computeTrend = (trendData, key = 'count') => {
        if (!Array.isArray(trendData) || trendData.length < 2) return null;
        const first = trendData[0]?.[key] ?? 0;
        const last = trendData[trendData.length - 1]?.[key] ?? 0;
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };
    const documentTrendPercent = computeTrend(documentTrend);

    // Calculate derived metrics
    const derivedMetrics = useMemo(() => {
        const archiveRate = totalDocuments > 0
            ? ((archivedDocuments / totalDocuments) * 100).toFixed(1)
            : 0;

        const taggingRate = totalDocuments > 0
            ? ((taggedDocuments / totalDocuments) * 100).toFixed(1)
            : 0;

        const activityRate = totalDocuments > 0
            ? ((recentlyModified / totalDocuments) * 100).toFixed(1)
            : 0;

        return {
            archiveRate,
            taggingRate,
            activityRate
        };
    }, [totalDocuments, archivedDocuments, taggedDocuments, recentlyModified]);

    // Get document type stats - Move documentsByType inside useMemo
    const typeStats = useMemo(() => {
        const documentsByType = metrics.documentsByType ?? {};
        return Object.entries(documentsByType).map(([type, count]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
            count,
            percentage: totalDocuments > 0 ? ((count / totalDocuments) * 100).toFixed(1) : 0
        })).sort((a, b) => b.count - a.count);
    }, [metrics.documentsByType, totalDocuments]);

    // Debug log
    console.log('Processed Document Metrics:', metrics);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading metrics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error loading metrics</span>
                </div>
                <p className="text-sm text-destructive/80 mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Document Management Metrics</h2>
                {filters?.timeRange && filters.timeRange !== 'all' && (
                    <span className="ml-2 px-2 py-1 bg-info/10 text-info rounded text-xs">
                        {filters.timeRange === '7d' ? 'Last 7 days' :
                            filters.timeRange === '30d' ? 'Last 30 days' :
                                filters.timeRange === '90d' ? 'Last 90 days' :
                                    filters.timeRange}
                    </span>
                )}
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={FileText}
                    label="Total Documents"
                    value={totalDocuments}
                    color="primary"
                    trend={documentTrendPercent}
                />
                <MetricCard
                    icon={CheckCircle}
                    label="Active"
                    value={activeDocuments}
                    color="success"
                    subtitle={`${((activeDocuments / Math.max(totalDocuments, 1)) * 100).toFixed(0)}% of total`}
                />
                <MetricCard
                    icon={Clock}
                    label="Recently Modified"
                    value={recentlyModified}
                    color="warning"
                    subtitle={`${derivedMetrics.activityRate}% of total`}
                />
                <MetricCard
                    icon={Archive}
                    label="Archived"
                    value={archivedDocuments}
                    color="muted"
                    subtitle={`${derivedMetrics.archiveRate}% of total`}
                />
            </div>

            {/* Status Overview */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Document Status Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusCard
                        label="Active"
                        value={activeDocuments}
                        total={totalDocuments}
                        color="teal"
                        icon={CheckCircle}
                    />
                    <StatusCard
                        label="Recently Modified"
                        value={recentlyModified}
                        total={totalDocuments}
                        color="blue"
                        icon={Clock}
                    />
                    <StatusCard
                        label="Tagged"
                        value={taggedDocuments}
                        total={totalDocuments}
                        color="purple"
                        icon={Tag}
                    />
                </div>
            </div>

            {/* Document Types */}
            {typeStats.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Documents by Type
                    </h3>
                    <div className="space-y-3">
                        {typeStats.map((stat, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-foreground">{stat.type}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {stat.count} ({stat.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-primary h-full rounded-full transition-all duration-300"
                                            style={{ width: `${stat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity and Collaboration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Collaboration</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-teal-500/10 rounded-lg border border-teal-500/20">
                            <div className="flex items-center space-x-2">
                                <Share2 className="w-5 h-5 text-teal-600" />
                                <span className="text-foreground">Shared Documents</span>
                            </div>
                            <div className="text-2xl font-bold text-teal-600">{sharedDocuments}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex items-center space-x-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                <span className="text-foreground">Collaborators</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{collaborators}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <div className="flex items-center space-x-2">
                                <Download className="w-5 h-5 text-purple-600" />
                                <span className="text-foreground">Exported</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-600">{exportedDocuments}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <span className="text-foreground">Activity Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-green-600">{derivedMetrics.activityRate}%</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <div className="flex items-center space-x-2">
                                <Tag className="w-5 h-5 text-amber-600" />
                                <span className="text-foreground">Tagging Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-600">{derivedMetrics.taggingRate}%</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="flex items-center space-x-2">
                                <Trash2 className="w-5 h-5 text-red-600" />
                                <span className="text-foreground">Deleted</span>
                            </div>
                            <div className="text-2xl font-bold text-red-600">{deletedDocuments}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Tags */}
            {topTags && topTags.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        Most Used Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {topTags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium flex items-center gap-2"
                            >
                                {tag.name}
                                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                                    {tag.count}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{totalDocuments}</div>
                        <div className="text-sm text-muted-foreground">Total Docs</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">{activeDocuments}</div>
                        <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{sharedDocuments}</div>
                        <div className="text-sm text-muted-foreground">Shared</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{exportedDocuments}</div>
                        <div className="text-sm text-muted-foreground">Exported</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component: Metric Card
const MetricCard = ({ icon: Icon, label, value, color, subtitle, trend }) => {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        success: 'bg-green-500/10 text-green-600 border-green-500/20',
        warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        muted: 'bg-secondary text-muted-foreground border-border',
    };

    return (
        <div className={`rounded-lg border p-4 ${colorClasses[color] || colorClasses.primary}`}>
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                {trend !== null && (
                    <div className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm opacity-80">{label}</div>
            {subtitle && (
                <div className="text-xs opacity-60 mt-1">{subtitle}</div>
            )}
        </div>
    );
};

// Helper Component: Status Card
const StatusCard = ({ label, value, total, color, icon: Icon }) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    
    const colorClasses = {
        teal: 'bg-teal-500/10 border-teal-500/20 text-teal-600',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-600',
    };

    return (
        <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium text-foreground">{label}</span>
            </div>
            <div className="text-3xl font-bold mb-2">{value}</div>
            <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                        width: `${percentage}%`,
                        backgroundColor: 'currentColor'
                    }}
                />
            </div>
            <div className="text-sm mt-2 opacity-80">{percentage}% of total</div>
        </div>
    );
};

export default DocumentMetrics;