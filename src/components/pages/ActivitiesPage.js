// Enhanced ActivitiesPage.jsx with real-time activity subscription
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppProvider';
import ActivityService from '../../services/ActivityService';
import {
    Plus, Video, Bug, Bot, Activity, CheckCircle, Brain, Edit, Trash, Play,
    AlertCircle, Zap, Filter, Search, Calendar, Download, RefreshCw, FileText,
    Database, FolderOpen, MessageSquare, ThumbsUp, Link, Archive, RotateCcw
} from 'lucide-react';

const ActivitiesPage = () => {
    const { activeSuite, isAuthenticated } = useApp();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    
    const unsubscribeRef = useRef(null);

    // Real-time activity subscription
    useEffect(() => {
        if (!isAuthenticated || !activeSuite?.id) {
            setActivities([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to real-time updates
        const unsubscribe = ActivityService.subscribeToActivities(
            activeSuite.id,
            (newActivities) => {
                console.log(`Received ${newActivities.length} activities from subscription`);
                setActivities(newActivities || []);
                setLoading(false);
            },
            (error) => {
                console.error('Activity subscription error:', error);
                setLoading(false);
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
            if (type.includes('created')) return { Icon: Plus, color: 'success' };
            if (type.includes('updated')) return { Icon: Edit, color: 'info' };
            if (type.includes('deleted')) return { Icon: Trash, color: 'error' };
            if (type.includes('archived')) return { Icon: Archive, color: 'warning' };
            if (type.includes('restored')) return { Icon: RotateCcw, color: 'success' };
            if (type.includes('passed')) return { Icon: CheckCircle, color: 'success' };
            if (type.includes('failed')) return { Icon: AlertCircle, color: 'error' };
            if (type.includes('executed')) return { Icon: Play, color: 'info' };
            return { Icon: CheckCircle, color: 'info' };
        }
        
        if (type.includes('bug')) {
            if (type.includes('created') || type.includes('reported')) return { Icon: Bug, color: 'warning' };
            if (type.includes('resolved') || type.includes('closed')) return { Icon: CheckCircle, color: 'success' };
            if (type.includes('updated')) return { Icon: AlertCircle, color: 'warning' };
            if (type.includes('deleted')) return { Icon: Trash, color: 'error' };
            if (type.includes('archived')) return { Icon: Archive, color: 'warning' };
            return { Icon: Bug, color: 'warning' };
        }
        
        if (type.includes('recording')) {
            if (type.includes('linked')) return { Icon: Link, color: 'info' };
            return { Icon: Video, color: 'error' };
        }
        
        if (type.includes('document')) {
            return { Icon: FileText, color: 'info' };
        }
        
        if (type.includes('test_data') || type.includes('testdata')) {
            return { Icon: Database, color: 'info' };
        }
        
        if (type.includes('sprint')) {
            return { Icon: FolderOpen, color: 'info' };
        }
        
        if (type.includes('recommendation')) {
            if (type.includes('voted')) return { Icon: ThumbsUp, color: 'info' };
            if (type.includes('commented')) return { Icon: MessageSquare, color: 'info' };
            return { Icon: Brain, color: 'info' };
        }
        
        if (type.includes('ai')) {
            return { Icon: Bot, color: 'info' };
        }
        
        if (type.includes('automation')) {
            return { Icon: Zap, color: 'info' };
        }
        
        if (type.includes('linked')) {
            return { Icon: Link, color: 'info' };
        }
        
        return { Icon: Activity, color: 'info' };
    };

    const processedActivities = useMemo(() => {
        return activities.map(activity => {
            const { Icon, color } = getActivityIcon(activity.action || activity.type);
            
            return {
                id: activity.id || `${activity.timestamp}-${Math.random()}`,
                type: activity.action || activity.type || 'unknown',
                title: activity.description || 'Activity',
                description: activity.details || '',
                user: activity.userName || activity.userEmail || activity.user || 'User',
                timestamp: activity.timestamp?.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp || Date.now()),
                icon: Icon,
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
    }, [activities]);

    const uniqueUsers = useMemo(() => {
        const users = new Set(processedActivities.map(a => a.user));
        return Array.from(users).sort();
    }, [processedActivities]);

    const uniqueTypes = useMemo(() => {
        const types = new Set(processedActivities.map(a => a.type));
        return Array.from(types).sort();
    }, [processedActivities]);

    const filteredActivities = useMemo(() => {
        return processedActivities.filter(activity => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = 
                    activity.title.toLowerCase().includes(searchLower) ||
                    activity.description.toLowerCase().includes(searchLower) ||
                    activity.user.toLowerCase().includes(searchLower) ||
                    activity.details?.suiteName?.toLowerCase().includes(searchLower) ||
                    activity.details?.assetName?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Type filter
            if (filterType !== 'all' && activity.type !== filterType) {
                return false;
            }

            // User filter
            if (filterUser !== 'all' && activity.user !== filterUser) {
                return false;
            }

            // Date range filter
            if (dateRange !== 'all') {
                const now = new Date();
                const activityDate = activity.timestamp;
                const hoursDiff = (now - activityDate) / (1000 * 60 * 60);
                
                switch (dateRange) {
                    case 'today':
                        if (hoursDiff > 24) return false;
                        break;
                    case 'week':
                        if (hoursDiff > 168) return false;
                        break;
                    case 'month':
                        if (hoursDiff > 720) return false;
                        break;
                    default:
                        break;
                }
            }

            return true;
        });
    }, [processedActivities, searchTerm, filterType, filterUser, dateRange]);

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

    const formatFullDate = (timestamp) => {
        return timestamp.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                text: 'text-[rgb(var(--color-success))]',
                tagBg: 'bg-[rgb(var(--color-success)/0.15)]',
                tagText: 'text-[rgb(var(--color-success))]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                text: 'text-[rgb(var(--color-info))]',
                tagBg: 'bg-[rgb(var(--color-info)/0.15)]',
                tagText: 'text-[rgb(var(--color-info))]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                text: 'text-[rgb(var(--color-warning))]',
                tagBg: 'bg-[rgb(var(--color-warning)/0.15)]',
                tagText: 'text-[rgb(var(--color-warning))]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                text: 'text-[rgb(var(--color-error))]',
                tagBg: 'bg-[rgb(var(--color-error)/0.15)]',
                tagText: 'text-[rgb(var(--color-error))]'
            },
        };
        return colorMap[color] || colorMap.info;
    };

    const exportActivities = () => {
        const csvContent = [
            ['Timestamp', 'Type', 'Title', 'Description', 'User', 'Suite', 'Asset Type', 'Asset Name'],
            ...filteredActivities.map(a => [
                formatFullDate(a.timestamp),
                a.type,
                a.title,
                a.description,
                a.user,
                a.details?.suiteName || '',
                a.details?.assetType || '',
                a.details?.assetName || ''
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activities-${activeSuite?.name || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleRefresh = async () => {
        if (!activeSuite?.id) return;
        
        setLoading(true);
        try {
            const result = await ActivityService.getActivities(activeSuite.id, {
                limit: 100
            });
            
            if (result.success) {
                setActivities(result.data || []);
            }
        } catch (error) {
            console.error('Failed to refresh activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearOldActivities = async () => {
        if (!activeSuite?.id) return;
        
        if (!window.confirm('This will delete activities older than 90 days. Continue?')) {
            return;
        }
        
        setLoading(true);
        try {
            await ActivityService.clearOldActivities(activeSuite.id, 90);
            await handleRefresh();
        } catch (error) {
            console.error('Failed to clear old activities:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="p-6 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Please sign in to view activities</p>
            </div>
        );
    }

    if (!activeSuite) {
        return (
            <div className="p-6 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Select a test suite to view activities</p>
            </div>
        );
    }

    if (loading && activities.length === 0) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-12 bg-muted rounded"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">All Activities</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeSuite.name} - Complete activity log
                        {autoRefresh && (
                            <span className="ml-2 inline-flex items-center text-[rgb(var(--color-success))]">
                                <span className="w-2 h-2 bg-[rgb(var(--color-success))] rounded-full animate-pulse mr-1"></span>
                                Live
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            autoRefresh
                                ? 'bg-[rgb(var(--color-success)/0.1)] border-[rgb(var(--color-success))] text-[rgb(var(--color-success))]'
                                : 'bg-card border-border hover:bg-muted'
                        }`}
                    >
                        <Activity className="w-4 h-4 mr-2" />
                        {autoRefresh ? 'Live' : 'Paused'}
                    </button>
                    <button
                        onClick={exportActivities}
                        disabled={filteredActivities.length === 0}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[rgb(var(--color-info)/0.1)] text-[rgb(var(--color-info))] hover:bg-[rgb(var(--color-info)/0.2)] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={clearOldActivities}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border hover:bg-muted transition-colors"
                    >
                        <Trash className="w-4 h-4 mr-2" />
                        Cleanup
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-info))] focus:border-transparent"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-info))] focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* User Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-info))] focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="all">All Users</option>
                            {uniqueUsers.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-info))] focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {(searchTerm || filterType !== 'all' || filterUser !== 'all' || dateRange !== 'all') && (
                    <div className="mt-4 flex items-center flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {searchTerm && (
                            <span className="px-2 py-1 rounded-md bg-muted text-xs">
                                Search: {searchTerm}
                            </span>
                        )}
                        {filterType !== 'all' && (
                            <span className="px-2 py-1 rounded-md bg-muted text-xs">
                                Type: {filterType.replace(/_/g, ' ')}
                            </span>
                        )}
                        {filterUser !== 'all' && (
                            <span className="px-2 py-1 rounded-md bg-muted text-xs">
                                User: {filterUser}
                            </span>
                        )}
                        {dateRange !== 'all' && (
                            <span className="px-2 py-1 rounded-md bg-muted text-xs">
                                Period: {dateRange}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterType('all');
                                setFilterUser('all');
                                setDateRange('all');
                            }}
                            className="text-xs text-[rgb(var(--color-info))] hover:text-[rgb(var(--color-info)/0.8)] font-medium"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {filteredActivities.length} of {processedActivities.length} activities
                </p>
                {loading && (
                    <span className="text-xs text-muted-foreground flex items-center">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Updating...
                    </span>
                )}
            </div>

            {/* Activities List */}
            <div className="bg-card rounded-lg border border-border shadow-theme-sm">
                {filteredActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                            {processedActivities.length === 0 
                                ? 'No activities yet' 
                                : 'No activities match your filters'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {processedActivities.length === 0 
                                ? 'Activities will appear here as you work'
                                : 'Try adjusting your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filteredActivities.map((activity, index) => {
                            const colors = getColorClasses(activity.color);
                            const IconComponent = activity.icon;
                            
                            return (
                                <div 
                                    key={activity.id} 
                                    className={`p-4 hover:bg-muted/50 transition-colors ${
                                        index === 0 ? 'rounded-t-lg' : ''
                                    } ${
                                        index === filteredActivities.length - 1 ? 'rounded-b-lg' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2.5 rounded-full ${colors.bg} flex-shrink-0`}>
                                            <IconComponent className={`w-5 h-5 ${colors.text}`} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {activity.title}
                                                    </h3>
                                                    {activity.description && (
                                                        <p className="text-sm text-muted-foreground mt-0.5">
                                                            {activity.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4 flex-shrink-0">
                                                    <div className="text-xs text-muted-foreground font-medium">
                                                        {formatTimeAgo(activity.timestamp)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/80 mt-0.5">
                                                        {formatFullDate(activity.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    by {activity.user}
                                                </span>
                                                
                                                {activity.details?.aiGenerated && (
                                                    <span className={`px-2 py-0.5 ${colors.tagBg} ${colors.tagText} rounded text-xs flex items-center space-x-1`}>
                                                        <Brain className="w-3 h-3" />
                                                        <span>AI</span>
                                                    </span>
                                                )}
                                                
                                                {activity.details?.hasRecording && (
                                                    <span className="px-2 py-0.5 bg-[rgb(var(--color-info)/0.15)] text-[rgb(var(--color-info))] rounded text-xs flex items-center space-x-1">
                                                        <Video className="w-3 h-3" />
                                                        <span>Recording</span>
                                                    </span>
                                                )}
                                                
                                                {activity.details?.assetType && (
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                                        {activity.details.assetType.replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                                
                                                {activity.details?.assetName && (
                                                    <span className="px-2 py-0.5 bg-muted/70 text-muted-foreground rounded text-xs max-w-[200px] truncate" title={activity.details.assetName}>
                                                        {activity.details.assetName}
                                                    </span>
                                                )}
                                                
                                                {activity.details?.feature && (
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                                        {activity.details.feature}
                                                    </span>
                                                )}
                                                
                                                {activity.details?.severity && (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        activity.details.severity === 'critical' 
                                                            ? 'bg-[rgb(var(--color-error)/0.15)] text-[rgb(var(--color-error))]'
                                                            : activity.details.severity === 'high'
                                                            ? 'bg-[rgb(var(--color-warning)/0.15)] text-[rgb(var(--color-warning))]'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {activity.details.severity.toUpperCase()}
                                                    </span>
                                                )}
                                                
                                                {activity.details?.priority && (
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                                        P: {activity.details.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivitiesPage;