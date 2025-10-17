import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppProvider';
import ActivityService from '../../services/ActivityService';
import {
    Plus,
    Video,
    Bug,
    Bot,
    Activity,
    CheckCircle,
    Brain,
    Edit,
    Trash,
    Play,
    AlertCircle,
    Zap,
    ArrowRight,
    FileText,
    Database,
    FolderOpen,
    MessageSquare,
    ThumbsUp,
    Link,
    Archive,
    RotateCcw
} from 'lucide-react';

const QuickActions = ({ metrics, loading }) => {
    const { activeSuite, isAuthenticated } = useApp();
    const [recentActivities, setRecentActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const unsubscribeRef = useRef(null);

    // Real-time activity subscription
    useEffect(() => {
        if (!isAuthenticated || !activeSuite?.id) {
            setRecentActivities([]);
            setActivitiesLoading(false);
            return;
        }

        setActivitiesLoading(true);

        // Subscribe to real-time updates
        const unsubscribe = ActivityService.subscribeToActivities(
            activeSuite.id,
            (newActivities) => {
                console.log(`QuickActions: Received ${newActivities.length} activities`);
                
                // Process and map activities
                const processedActivities = (newActivities || []).map(activity => {
                    const { icon, color } = getActivityIcon(activity.action || activity.type);
                    
                    return {
                        id: activity.id || `${activity.timestamp}-${Math.random()}`,
                        type: activity.action || activity.type || 'unknown',
                        title: activity.description || 'Activity',
                        description: activity.details || '',
                        user: activity.userName || activity.userEmail || activity.user || 'User',
                        timestamp: activity.timestamp?.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp || Date.now()),
                        icon,
                        color,
                        details: {
                            ...activity.metadata,
                            suiteName: activity.suiteName,
                            suiteId: activity.suiteId,
                            aiGenerated: activity.metadata?.aiGenerated || activity.metadata?.isAIGenerated,
                            hasRecording: activity.metadata?.hasRecording,
                            feature: activity.metadata?.feature || activity.metadata?.module,
                            severity: activity.metadata?.severity,
                            priority: activity.metadata?.priority,
                            assetType: activity.metadata?.assetType,
                            assetName: activity.metadata?.assetName
                        }
                    };
                });
                
                // Sort by timestamp (newest first) and take top 10
                const sortedActivities = processedActivities
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10);
                
                setRecentActivities(sortedActivities);
                setActivitiesLoading(false);
            },
            (error) => {
                console.error('QuickActions activity subscription error:', error);
                setActivitiesLoading(false);
            }
        );

        unsubscribeRef.current = unsubscribe;

        return () => {
            if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
                unsubscribeRef.current();
            }
        };
    }, [isAuthenticated, activeSuite?.id]);

    const getActivityIcon = (activityType) => {
        const type = activityType?.toLowerCase() || '';
        
        if (type.includes('test_case') || type.includes('testcase')) {
            if (type.includes('created')) return { icon: Plus, color: 'success' };
            if (type.includes('updated')) return { icon: Edit, color: 'info' };
            if (type.includes('deleted')) return { icon: Trash, color: 'error' };
            if (type.includes('archived')) return { icon: Archive, color: 'warning' };
            if (type.includes('restored')) return { icon: RotateCcw, color: 'success' };
            if (type.includes('passed')) return { icon: CheckCircle, color: 'success' };
            if (type.includes('failed')) return { icon: AlertCircle, color: 'error' };
            if (type.includes('executed')) return { icon: Play, color: 'info' };
            return { icon: CheckCircle, color: 'info' };
        }
        
        if (type.includes('bug')) {
            if (type.includes('created') || type.includes('reported')) return { icon: Bug, color: 'warning' };
            if (type.includes('resolved') || type.includes('closed')) return { icon: CheckCircle, color: 'success' };
            if (type.includes('updated')) return { icon: AlertCircle, color: 'warning' };
            if (type.includes('deleted')) return { icon: Trash, color: 'error' };
            if (type.includes('archived')) return { icon: Archive, color: 'warning' };
            return { icon: Bug, color: 'warning' };
        }
        
        if (type.includes('recording')) {
            if (type.includes('linked')) return { icon: Link, color: 'info' };
            return { icon: Video, color: 'error' };
        }
        
        if (type.includes('document')) {
            return { icon: FileText, color: 'info' };
        }
        
        if (type.includes('test_data') || type.includes('testdata')) {
            return { icon: Database, color: 'info' };
        }
        
        if (type.includes('sprint')) {
            return { icon: FolderOpen, color: 'info' };
        }
        
        if (type.includes('recommendation')) {
            if (type.includes('voted')) return { icon: ThumbsUp, color: 'info' };
            if (type.includes('commented')) return { icon: MessageSquare, color: 'info' };
            return { icon: Brain, color: 'info' };
        }
        
        if (type.includes('ai')) {
            return { icon: Bot, color: 'info' };
        }
        
        if (type.includes('automation')) {
            return { icon: Zap, color: 'info' };
        }
        
        if (type.includes('linked')) {
            return { icon: Link, color: 'info' };
        }
        
        return { icon: Activity, color: 'info' };
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes < 1) return 'Just now';
        return `${minutes}m ago`;
    };

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                hoverBg: 'hover:bg-[rgb(var(--color-success)/0.2)]',
                text: 'text-[rgb(var(--color-success))]',
                hoverText: 'hover:text-[rgb(var(--color-success)/0.8)]',
                border: 'border-[rgb(var(--color-success)/0.2)]',
                hoverBorder: 'hover:border-[rgb(var(--color-success)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-success)/0.15)]',
                tagText: 'text-[rgb(var(--color-success))]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                hoverBg: 'hover:bg-[rgb(var(--color-info)/0.2)]',
                text: 'text-[rgb(var(--color-info))]',
                hoverText: 'hover:text-[rgb(var(--color-info)/0.8)]',
                border: 'border-[rgb(var(--color-info)/0.2)]',
                hoverBorder: 'hover:border-[rgb(var(--color-info)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-info)/0.15)]',
                tagText: 'text-[rgb(var(--color-info))]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                hoverBg: 'hover:bg-[rgb(var(--color-warning)/0.2)]',
                text: 'text-[rgb(var(--color-warning))]',
                hoverText: 'hover:text-[rgb(var(--color-warning)/0.8)]',
                border: 'border-[rgb(var(--color-warning)/0.2)]',
                hoverBorder: 'hover:border-[rgb(var(--color-warning)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-warning)/0.15)]',
                tagText: 'text-[rgb(var(--color-warning))]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                hoverBg: 'hover:bg-[rgb(var(--color-error)/0.2)]',
                text: 'text-[rgb(var(--color-error))]',
                hoverText: 'hover:text-[rgb(var(--color-error)/0.8)]',
                border: 'border-[rgb(var(--color-error)/0.2)]',
                hoverBorder: 'hover:border-[rgb(var(--color-error)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-error)/0.15)]',
                tagText: 'text-[rgb(var(--color-error))]'
            },
            muted: {
                bg: 'bg-muted',
                hoverBg: 'hover:bg-muted/80',
                text: 'text-muted-foreground',
                hoverText: 'hover:text-foreground',
                border: 'border-border',
                hoverBorder: 'hover:border-border/80',
                tagBg: 'bg-muted/50',
                tagText: 'text-muted-foreground'
            }
        };
        return colorMap[color] || colorMap.info;
    };

    const quickStats = [
        { 
            label: "Active Tests", 
            value: metrics?.totalTestCases || 0, 
            change: metrics?.testsCreatedThisWeek ? `+${metrics.testsCreatedThisWeek}` : '0' 
        },
        { 
            label: "Open Bugs", 
            value: metrics?.activeBugs || 0, 
            change: metrics?.bugsReportedThisWeek ? `+${metrics.bugsReportedThisWeek}` : '0' 
        },
        { 
            label: "Automation", 
            value: `${metrics?.automationRate || 0}%`, 
            change: metrics?.automationRate >= 50 ? '+5%' : '0%'
        },
        { 
            label: "AI Generated", 
            value: metrics?.aiGeneratedTestCases || 0, 
            change: metrics?.aiGeneratedTestCases > 0 ? `+${Math.round((metrics?.aiGeneratedTestCases || 0) * 0.2)}` : '0'
        }
    ];

    if (loading) {
        return (
            <div className="bg-card rounded-lg border border-border shadow-theme-sm p-3 sm:p-4 md:p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 sm:h-6 bg-muted rounded w-1/3 sm:w-1/4"></div>
                    <div className="h-3 sm:h-4 bg-muted rounded w-2/3 sm:w-1/2"></div>
                    <div className="space-y-3 mt-4 sm:mt-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 sm:h-16 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border border-border shadow-theme-sm">
            {/* Header Section - Responsive */}
            <div className="p-3 sm:p-4 md:p-6 border-b border-border">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-foreground">Activity Overview</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Recent activities and key metrics
                            {activeSuite && (
                                <span className="ml-2 inline-flex items-center text-[rgb(var(--color-success))]">
                                    <span className="w-2 h-2 bg-[rgb(var(--color-success))] rounded-full animate-pulse mr-1"></span>
                                    <span className="hidden sm:inline">Live</span>
                                </span>
                            )}
                        </p>
                    </div>
                    
                    {/* Quick Stats - Responsive Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:flex lg:space-x-4 lg:gap-0">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-base sm:text-lg font-bold text-foreground">{stat.value}</div>
                                <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
                                <div className={`text-xs ${
                                    stat.change.startsWith('+') && stat.change !== '+0' 
                                        ? 'text-[rgb(var(--color-success))]' 
                                        : stat.change.startsWith('-') 
                                        ? 'text-[rgb(var(--color-error))]' 
                                        : 'text-muted-foreground'
                                }`}>
                                    {stat.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content - Responsive Padding */}
            <div className="p-3 sm:p-4 md:p-6">
                {/* Recent Activities Section */}
                <div className="border-t border-border pt-4 sm:pt-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-sm font-medium text-foreground">Recent Activities</h3>
                        {activitiesLoading && (
                            <span className="text-xs text-muted-foreground flex items-center">
                                <Activity className="w-3 h-3 mr-1 animate-spin" />
                                <span className="hidden sm:inline">Loading...</span>
                            </span>
                        )}
                    </div>
                    
                    {!activeSuite ? (
                        <div className="text-center py-8 sm:py-12">
                            <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">Select a test suite to view activities</p>
                        </div>
                    ) : recentActivities.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">No recent activities yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Activities will appear here as you work</p>
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {recentActivities.map((activity) => {
                                const colors = getColorClasses(activity.color);
                                const IconComponent = activity.icon;
                                
                                return (
                                    <div 
                                        key={activity.id} 
                                        className={`flex items-start sm:items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg ${colors.hoverBg} transition-colors cursor-pointer`}
                                    >
                                        <div className={`p-1.5 sm:p-2 rounded-full ${colors.bg} flex-shrink-0`}>
                                            <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start sm:items-center justify-between gap-2">
                                                <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                                    {activity.title}
                                                </p>
                                                <div className="text-xs text-muted-foreground flex-shrink-0">
                                                    {formatTimeAgo(activity.timestamp)}
                                                </div>
                                            </div>
                                            {activity.description && (
                                                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                                    {activity.description}
                                                </p>
                                            )}
                                            <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    by {activity.user}
                                                </span>
                                                
                                                {activity.details?.aiGenerated && (
                                                    <span className={`px-1 sm:px-1.5 py-0.5 ${colors.tagBg} ${colors.tagText} rounded text-xs flex items-center space-x-0.5 sm:space-x-1`}>
                                                        <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                        <span>AI</span>
                                                    </span>
                                                )}
                                                
                                                {activity.details?.hasRecording && (
                                                    <span className="px-1 sm:px-1.5 py-0.5 bg-[rgb(var(--color-info)/0.15)] text-[rgb(var(--color-info))] rounded text-xs flex items-center space-x-0.5 sm:space-x-1">
                                                        <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                        <span className="hidden sm:inline">Video</span>
                                                    </span>
                                                )}
                                                
                                                {activity.details?.assetType && (
                                                    <span className="px-1 sm:px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs hidden sm:inline-block">
                                                        {activity.details.assetType}
                                                    </span>
                                                )}
                                                
                                                {activity.details?.feature && (
                                                    <span className="px-1 sm:px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs hidden md:inline-block">
                                                        {activity.details.feature}
                                                    </span>
                                                )}
                                                
                                                {activity.details?.severity && (
                                                    <span className={`px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium ${
                                                        activity.details.severity === 'critical' 
                                                            ? 'bg-[rgb(var(--color-error)/0.15)] text-[rgb(var(--color-error))]'
                                                            : activity.details.severity === 'high'
                                                            ? 'bg-[rgb(var(--color-warning)/0.15)] text-[rgb(var(--color-warning))]'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {activity.details.severity.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {recentActivities.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 border-t border-border/50">
                            <a 
                                href="/activities" 
                                className="text-xs sm:text-sm text-[rgb(var(--color-info))] hover:text-[rgb(var(--color-info)/0.8)] font-medium inline-flex items-center space-x-1 transition-colors"
                            >
                                <span>View All Activities</span>
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Quick Links Section - Responsive */}
                <div className="border-t border-border pt-4 sm:pt-6 mt-4 sm:mt-6">
                    <h3 className="text-sm font-medium text-foreground mb-3 sm:mb-4">Quick Links</h3>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                        {[
                            { label: "Documentation", href: "/docs", color: "info" },
                            { label: "API Reference", href: "/api-docs", color: "success" },
                            { label: "Support", href: "/support", color: "info" },
                            { label: "Feedback", href: "/feedback", color: "warning" },
                            { label: "Settings", href: "/settings", color: "muted" }
                        ].map((link, index) => {
                            const colors = getColorClasses(link.color);
                            return (
                                <a
                                    key={index}
                                    href={link.href}
                                    className={`
                                        inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium
                                        ${colors.bg} ${colors.text} ${colors.hoverBg}
                                        transition-colors
                                    `}
                                >
                                    {link.label}
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickActions;