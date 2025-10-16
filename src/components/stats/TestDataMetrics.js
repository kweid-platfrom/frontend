import React, { useMemo } from 'react';
import { 
    Database, 
    Sparkles, 
    Download, 
    Plus, 
    AlertCircle,
    Clock, 
    TrendingUp,
    TrendingDown,
    FileText,
    Zap,
    Mail,
    User,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    Lock,
    Globe,
    Palette,
    Hash
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard'; // Adjust path as needed
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor'; // Adjust path as needed

const ICON_MAP = { 
    User, Mail, Phone, MapPin, CreditCard, Database, Calendar, Lock, Globe, Palette, FileText, Hash 
};

const predefinedTypes = [
    { id: 'names', icon: 'User' },
    { id: 'emails', icon: 'Mail' },
    { id: 'phone-numbers', icon: 'Phone' },
    { id: 'addresses', icon: 'MapPin' },
    { id: 'credit-cards', icon: 'CreditCard' },
    { id: 'personal-data', icon: 'Database' },
    { id: 'dates', icon: 'Calendar' },
    { id: 'passwords', icon: 'Lock' },
    { id: 'usernames', icon: 'User' },
    { id: 'urls', icon: 'Globe' },
    { id: 'colors', icon: 'Palette' },
    { id: 'lorem-ipsum', icon: 'FileText' },
    { id: 'ssn', icon: 'Hash' },
];

const TestDataMetrics = ({ filters = {} }) => {
    const { metrics: rawMetrics, loading, error } = useDashboard();
    const metrics = useMetricsProcessor(rawMetrics);

    const processedMetrics = useMemo(() => {
        const totalTypes = metrics.totalTypes ?? predefinedTypes.length + (metrics.customTypes ?? 0);
        const totalItems = metrics.totalItems ?? 0;
        const customTypes = metrics.customTypes ?? 0;
        const avgItemsPerType = totalTypes > 0 ? Math.round(totalItems / totalTypes) : 0;

        const typeUsage = metrics.typeUsage ?? {};
        const mostGeneratedType = Object.entries(typeUsage).reduce((max, [id, count]) => 
            count > (typeUsage[max] || 0) ? id : max, 'names'
        );

        return {
            totalTypes,
            totalItems,
            customTypes,
            generatedToday: metrics.generatedToday ?? 0,
            generatedThisWeek: metrics.generatedThisWeek ?? 0,
            generatedThisMonth: metrics.generatedThisMonth ?? 0,
            aiGenerations: metrics.aiGenerations ?? 0,
            randomGenerations: metrics.randomGenerations ?? 0,
            exportedFiles: metrics.exportedFiles ?? 0,
            avgItemsPerType,
            mostGeneratedType,
            storageUsedKB: metrics.storageUsedKB ?? 0,
            typeUsage,
            testDataTrend: metrics.testDataTrend ?? []
        };
    }, [metrics]);

    const computeTrend = (trendData, key = 'count') => {
        if (!Array.isArray(trendData) || trendData.length < 2) return null;
        const first = trendData[0]?.[key] ?? 0;
        const last = trendData[trendData.length - 1]?.[key] ?? 0;
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    };
    const testDataTrendPercent = computeTrend(processedMetrics.testDataTrend);

    // Debug
    console.log('Processed Test Data Metrics:', processedMetrics);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-foreground">Loading test data metrics...</span>
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

    const TypeUsageBar = ({ typeId, count, totalItems, color }) => {
        const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
        const TypeIcon = ICON_MAP[predefinedTypes.find(t => t.id === typeId)?.icon] || Database;
        const colors = getColorClasses(color);

        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center space-x-3">
                        <TypeIcon className={`w-5 h-5 ${colors.text}`} />
                    <span className="font-medium text-foreground">{typeId.charAt(0).toUpperCase() + typeId.slice(1).replace('-', ' ')}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-right text-xs text-muted-foreground">
                        {count} items
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
        totalTypes, totalItems, customTypes, generatedToday, generatedThisWeek, generatedThisMonth,
        aiGenerations, randomGenerations, exportedFiles, avgItemsPerType, mostGeneratedType,
        storageUsedKB, typeUsage
    } = processedMetrics;

    const topTypes = Object.entries(typeUsage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Test Data Metrics</h2>
                <div className="text-sm text-muted-foreground">
                    Total: {totalItems.toLocaleString()} items across {totalTypes} types
                    {filters?.timeRange && filters.timeRange !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-info/10 text-info rounded text-xs">
                            {filters.timeRange === '7d' ? 'Last 7 days' : filters.timeRange === '30d' ? 'Last 30 days' : filters.timeRange === '90d' ? 'Last 90 days' : filters.timeRange}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Types" value={totalTypes} icon={Database} color="blue" />
                <MetricCard title="Total Items" value={totalItems} icon={FileText} color="green" trend={testDataTrendPercent} />
                <MetricCard title="Custom Types" value={customTypes} icon={Plus} color="purple" />
                <MetricCard title="Avg Items/Type" value={avgItemsPerType} icon={TrendingUp} color="orange" />
                <MetricCard title="Generated Today" value={generatedToday} icon={Clock} color="blue" />
                <MetricCard title="This Week" value={generatedThisWeek} icon={Calendar} color="green" />
                <MetricCard title="This Month" value={generatedThisMonth} icon={Calendar} color="purple" />
                <MetricCard title="Storage Used" value={`${storageUsedKB} KB`} icon={Database} color="orange" />
            </div>

            {/* Generation Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Generation Methods</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Zap className="w-5 h-5 text-success" />
                                <span>Random Generations</span>
                            </div>
                            <div className="text-2xl font-bold text-success">{randomGenerations}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-5 h-5 text-purple" />
                                <span>AI Generations</span>
                            </div>
                            <div className="text-2xl font-bold text-purple">{aiGenerations}</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-orange/10 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Download className="w-5 h-5 text-orange" />
                                <span>Exported Files</span>
                            </div>
                            <div className="text-2xl font-bold text-orange">{exportedFiles}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Usage Highlights</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Most Generated</span>
                            <span className="font-medium">{mostGeneratedType.charAt(0).toUpperCase() + mostGeneratedType.slice(1).replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">AI Usage Rate</span>
                            <span className="font-medium">{totalItems > 0 ? Math.round((aiGenerations / totalItems) * 100) : 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Export Rate</span>
                            <span className="font-medium">{generatedThisMonth > 0 ? Math.round((exportedFiles / generatedThisMonth) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Data Types Usage */}
            {topTypes.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-info" />
                        Top Data Types Usage
                    </h3>
                    <div className="space-y-4">
                        {topTypes.map(([typeId, count], idx) => {
                            const color = ['blue', 'green', 'purple', 'orange', 'red'][idx % 5];
                            return (
                                <TypeUsageBar 
                                    key={typeId} 
                                    typeId={typeId} 
                                    count={count} 
                                    totalItems={totalItems} 
                                    color={color} 
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Test Data Health Summary */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Database className="w-5 h-5 mr-2 text-info" />
                    Test Data Health Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                        <div className="text-2xl font-bold text-info">{totalTypes}</div>
                        <p className="text-sm text-muted-foreground">Total Types</p>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                        <div className="text-2xl font-bold text-success">{totalItems}</div>
                        <p className="text-sm text-muted-foreground">Total Items</p>
                    </div>
                    <div className="text-center p-4 bg-purple/10 rounded-lg">
                        <div className="text-2xl font-bold text-purple">{aiGenerations + randomGenerations}</div>
                        <p className="text-sm text-muted-foreground">Total Generated</p>
                    </div>
                    <div className="text-center p-4 bg-orange/10 rounded-lg">
                        <div className="text-2xl font-bold text-orange">{customTypes}</div>
                        <p className="text-sm text-muted-foreground">Custom Types</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestDataMetrics;