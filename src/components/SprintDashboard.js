'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, 
    Target, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    Play, 
    Pause, 
    TrendingUp,
    FileText,
    Bug,
    Lightbulb,
    BarChart3
} from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { 
    getSprintMetrics,
    filterAssetsBySprint,
    formatDate,
    getDaysRemaining,
    getSprintStatusInfo,
    getStatusBadgeClasses
} from '../utils/sprintUtils';

const SprintDashboard = ({ sprintId }) => {
    const { state } = useApp();
    const { sprints = [], activeSprint } = state?.sprints || {};

    const [loading, setLoading] = useState(true);

    // Get sprint data
    const sprint = sprintId 
        ? sprints.find(s => s.id === sprintId)
        : activeSprint;

    // Get all assets from global state
    const allTestCases = state?.testCases?.testCases || [];
    const allBugs = state?.bugs?.bugs || [];
    const allRecommendations = state?.recommendations?.recommendations || [];

    // Filter assets by sprint using utility
    const assets = useMemo(() => {
        if (!sprint?.id) {
            return {
                testCases: [],
                bugs: [],
                recommendations: []
            };
        }

        return filterAssetsBySprint(sprint.id, allTestCases, allBugs, allRecommendations);
    }, [sprint?.id, allTestCases, allBugs, allRecommendations]);

    // Calculate metrics using utility
    const metrics = useMemo(() => {
        return getSprintMetrics(sprint, allTestCases, allBugs, allRecommendations);
    }, [sprint, allTestCases, allBugs, allRecommendations]);

    useEffect(() => {
        // Simulate loading for smoother UX
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, [sprint?.id]);

    const getStatusInfo = (status) => {
        const info = getSprintStatusInfo(status);
        let icon;
        switch (status) {
            case 'active':
                icon = Play;
                break;
            case 'completed':
                icon = CheckCircle;
                break;
            case 'on-hold':
                icon = Pause;
                break;
            case 'planning':
            default:
                icon = Clock;
                break;
        }
        return { ...info, icon };
    };

    if (!sprint) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Sprint Selected</h3>
                <p className="text-sm">Select a sprint to view its dashboard</p>
            </div>
        );
    }

    const statusInfo = getStatusInfo(sprint.status);
    const StatusIcon = statusInfo.icon;
    const daysRemaining = getDaysRemaining(sprint.endDate);

    return (
        <div className="space-y-6">
            {/* Sprint Header */}
            <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-2xl font-bold text-foreground">{sprint.name}</h1>
                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor}`}>
                                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                                <span className={statusInfo.color}>{statusInfo.label}</span>
                            </div>
                        </div>
                        {sprint.description && (
                            <p className="text-muted-foreground mb-3">{sprint.description}</p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            {sprint.startDate && (
                                <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Started: {formatDate(sprint.startDate)}</span>
                                </div>
                            )}
                            {sprint.endDate && (
                                <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Due: {formatDate(sprint.endDate)}</span>
                                </div>
                            )}
                            {daysRemaining !== null && (
                                <div className={`flex items-center space-x-1 ${
                                    daysRemaining < 0 ? 'text-error' : 
                                    daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'
                                }`}>
                                    <AlertCircle className="h-4 w-4" />
                                    <span>
                                        {daysRemaining < 0 
                                            ? `${Math.abs(daysRemaining)} days overdue`
                                            : daysRemaining === 0 
                                                ? 'Due today'
                                                : `${daysRemaining} days remaining`
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sprint Goals */}
                {sprint.goals && (
                    <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-800/20 rounded-lg border border-teal-300 dark:border-teal-600">
                        <div className="flex items-start space-x-2">
                            <Target className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-teal-800 dark:text-teal-300 mb-1">Sprint Goals</h3>
                                <p className="text-sm text-teal-700 dark:text-teal-400">{sprint.goals}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Overall Progress */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">Overall Progress</h3>
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{metrics.completionRate}%</span>
                            <span className="text-sm text-muted-foreground">
                                {metrics.completedAssets} of {metrics.totalAssets}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${metrics.completionRate}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Test Cases Progress */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">Test Cases</h3>
                        <FileText className="h-5 w-5 text-info" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{metrics.testCases.rate}%</span>
                            <span className="text-sm text-muted-foreground">
                                {metrics.testCases.completed} of {metrics.testCases.total}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-info rounded-full transition-all duration-300"
                                style={{ width: `${metrics.testCases.rate}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bugs Progress */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">Bugs Resolved</h3>
                        <Bug className="h-5 w-5 text-error" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{metrics.bugs.rate}%</span>
                            <span className="text-sm text-muted-foreground">
                                {metrics.bugs.resolved} of {metrics.bugs.total}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-error rounded-full transition-all duration-300"
                                style={{ width: `${metrics.bugs.rate}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Recommendations Progress */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">Recommendations</h3>
                        <Lightbulb className="h-5 w-5 text-warning" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{metrics.recommendations.rate}%</span>
                            <span className="text-sm text-muted-foreground">
                                {metrics.recommendations.implemented} of {metrics.recommendations.total}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-warning rounded-full transition-all duration-300"
                                style={{ width: `${metrics.recommendations.rate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <FileText className="h-8 w-8 text-info mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{assets.testCases.length}</div>
                    <div className="text-sm text-muted-foreground">Test Cases</div>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <Bug className="h-8 w-8 text-error mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{assets.bugs.length}</div>
                    <div className="text-sm text-muted-foreground">Bugs</div>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <Lightbulb className="h-8 w-8 text-warning mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{assets.recommendations.length}</div>
                    <div className="text-sm text-muted-foreground">Recommendations</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                    <h3 className="font-medium text-foreground flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Sprint Assets</span>
                    </h3>
                </div>
                
                <div className="p-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p>Loading assets...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Test Cases */}
                            {assets.testCases.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-foreground flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-info" />
                                            <span>Test Cases ({assets.testCases.length})</span>
                                        </h4>
                                        <a 
                                            href={`/test-cases?sprint=${sprint.id}`}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            View all →
                                        </a>
                                    </div>
                                    <div className="space-y-2">
                                        {assets.testCases.slice(0, 5).map((testCase) => (
                                            <div
                                                key={testCase.id}
                                                className="flex items-center gap-3 py-2.5 px-4 bg-secondary rounded-lg border border-border"
                                            >
                                                <div className="shrink-0">
                                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-info/10 text-info text-xs font-mono font-semibold">
                                                        {testCase.id?.slice(0, 4).toUpperCase() || '????'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-medium text-foreground truncate mb-0.5">
                                                        {testCase.title || testCase.name || `Test Case ${testCase.id?.slice(0, 8)}`}
                                                    </h5>
                                                    {testCase.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {testCase.description}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="shrink-0">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses.testCase(testCase.status)}`}>
                                                        {testCase.status || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {assets.testCases.length > 5 && (
                                            <div className="text-center pt-2">
                                                <a 
                                                    href={`/test-cases?sprint=${sprint.id}`}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    +{assets.testCases.length - 5} more test cases
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bugs */}
                            {assets.bugs.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-foreground flex items-center space-x-2">
                                            <Bug className="h-4 w-4 text-error" />
                                            <span>Bugs ({assets.bugs.length})</span>
                                        </h4>
                                        <a 
                                            href={`/bugs?sprint=${sprint.id}`}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            View all →
                                        </a>
                                    </div>
                                    <div className="space-y-2">
                                        {assets.bugs.slice(0, 5).map((bug) => (
                                            <div
                                                key={bug.id}
                                                className="flex items-center gap-3 py-2.5 px-4 bg-secondary rounded-lg border border-border"
                                            >
                                                <div className="shrink-0">
                                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-error/10 text-error text-xs font-mono font-semibold">
                                                        {bug.id?.slice(0, 4).toUpperCase() || '????'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-medium text-foreground truncate mb-0.5">
                                                        {bug.title || bug.name || `Bug ${bug.id?.slice(0, 8)}`}
                                                    </h5>
                                                    {bug.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {bug.description}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="shrink-0">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses.bug(bug.status)}`}>
                                                        {bug.status || 'open'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {assets.bugs.length > 5 && (
                                            <div className="text-center pt-2">
                                                <a 
                                                    href={`/bugs?sprint=${sprint.id}`}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    +{assets.bugs.length - 5} more bugs
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {assets.recommendations.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-foreground flex items-center space-x-2">
                                            <Lightbulb className="h-4 w-4 text-warning" />
                                            <span>Recommendations ({assets.recommendations.length})</span>
                                        </h4>
                                        <a 
                                            href={`/bugs?sprint=${sprint.id}&tab=recommendations`}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            View all →
                                        </a>
                                    </div>
                                    <div className="space-y-2">
                                        {assets.recommendations.slice(0, 5).map((rec) => (
                                            <div
                                                key={rec.id}
                                                className="flex items-center gap-3 py-2.5 px-4 bg-secondary rounded-lg border border-border"
                                            >
                                                <div className="shrink-0">
                                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-warning/10 text-warning text-xs font-mono font-semibold">
                                                        {rec.id?.slice(0, 4).toUpperCase() || '????'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-medium text-foreground truncate mb-0.5">
                                                        {rec.title || rec.name || `Recommendation ${rec.id?.slice(0, 8)}`}
                                                    </h5>
                                                    {rec.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {rec.description}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="shrink-0">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses.recommendation(rec.status)}`}>
                                                        {rec.status || 'pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {assets.recommendations.length > 5 && (
                                            <div className="text-center pt-2">
                                                <a 
                                                    href={`/bugs?sprint=${sprint.id}&tab=recommendations`}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    +{assets.recommendations.length - 5} more recommendations
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {assets.testCases.length === 0 && assets.bugs.length === 0 && assets.recommendations.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                    <h4 className="font-medium mb-2">No Assets Yet</h4>
                                    <p className="text-sm">Start adding test cases, bugs, and recommendations to this sprint</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SprintDashboard;