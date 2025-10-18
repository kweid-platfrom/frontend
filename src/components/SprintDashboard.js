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

const SprintDashboard = ({ sprintId }) => {
    const { state } = useApp();
    const { sprints = [], activeSprint } = state?.sprints || {};

    const [loading, setLoading] = useState(true);

    // Get sprint data
    const sprint = sprintId 
        ? sprints.find(s => s.id === sprintId)
        : activeSprint;

    // ✅ FIXED: Filter assets from global state by sprint_id
    const assets = useMemo(() => {
        if (!sprint?.id) {
            return {
                testCases: [],
                bugs: [],
                recommendations: []
            };
        }

        const allTestCases = state?.testCases?.testCases || [];
        const allBugs = state?.bugs?.bugs || [];
        const allRecommendations = state?.recommendations?.recommendations || [];

        const filteredTestCases = allTestCases.filter(tc => 
            (tc.sprint_id === sprint.id || tc.sprintId === sprint.id) &&
            tc.status !== 'deleted' && tc.status !== 'archived'
        );

        const filteredBugs = allBugs.filter(bug => 
            (bug.sprint_id === sprint.id || bug.sprintId === sprint.id) &&
            bug.status !== 'deleted' && bug.status !== 'archived'
        );

        const filteredRecommendations = allRecommendations.filter(rec => 
            (rec.sprint_id === sprint.id || rec.sprintId === sprint.id) &&
            rec.status !== 'deleted' && rec.status !== 'archived'
        );

        console.log('📊 Sprint assets filtered from global state:', {
            sprintId: sprint.id,
            testCases: filteredTestCases.length,
            bugs: filteredBugs.length,
            recommendations: filteredRecommendations.length
        });

        return {
            testCases: filteredTestCases,
            bugs: filteredBugs,
            recommendations: filteredRecommendations
        };
    }, [sprint?.id, state?.testCases?.testCases, state?.bugs?.bugs, state?.recommendations?.recommendations]);

    useEffect(() => {
        // Simulate loading for smoother UX
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, [sprint?.id]);

    // ✅ FIXED: Case-insensitive status checks with accurate completion logic
    const isTestCaseCompleted = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        return normalizedStatus === 'passed' || 
               normalizedStatus === 'completed' || 
               normalizedStatus === 'success';
    };

    const isBugResolved = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        return normalizedStatus === 'resolved' || 
               normalizedStatus === 'closed' || 
               normalizedStatus === 'fixed';
    };

    const isRecommendationImplemented = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        return normalizedStatus === 'implemented' || 
               normalizedStatus === 'completed' || 
               normalizedStatus === 'done';
    };

    // ✅ FIXED: Real-time metrics calculation with accurate status checks
    const getSprintMetrics = () => {
        const totalTestCases = assets.testCases.length;
        const completedTestCases = assets.testCases.filter(tc => 
            isTestCaseCompleted(tc.status)
        ).length;

        const totalBugs = assets.bugs.length;
        const resolvedBugs = assets.bugs.filter(bug => 
            isBugResolved(bug.status)
        ).length;

        const totalRecommendations = assets.recommendations.length;
        const implementedRecommendations = assets.recommendations.filter(rec =>
            isRecommendationImplemented(rec.status)
        ).length;

        const totalAssets = totalTestCases + totalBugs + totalRecommendations;
        const completedAssets = completedTestCases + resolvedBugs + implementedRecommendations;

        return {
            totalAssets,
            completedAssets,
            completionRate: totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 0,
            testCases: {
                total: totalTestCases,
                completed: completedTestCases,
                rate: totalTestCases > 0 ? Math.round((completedTestCases / totalTestCases) * 100) : 0
            },
            bugs: {
                total: totalBugs,
                resolved: resolvedBugs,
                rate: totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0
            },
            recommendations: {
                total: totalRecommendations,
                implemented: implementedRecommendations,
                rate: totalRecommendations > 0 ? Math.round((implementedRecommendations / totalRecommendations) * 100) : 0
            }
        };
    };

    // ✅ FIXED: Accurate status badge function with case-insensitive checks
    const getTestCaseStatusBadge = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        
        if (normalizedStatus === 'passed' || normalizedStatus === 'completed' || normalizedStatus === 'success') {
            return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300';
        } else if (normalizedStatus === 'failed' || normalizedStatus === 'failure') {
            return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300';
        } else if (normalizedStatus === 'in-progress' || normalizedStatus === 'in progress' || normalizedStatus === 'running') {
            return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
        } else if (normalizedStatus === 'blocked') {
            return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300';
        } else {
            return 'bg-muted text-muted-foreground';
        }
    };

    const getBugStatusBadge = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        
        if (normalizedStatus === 'resolved' || normalizedStatus === 'closed' || normalizedStatus === 'fixed') {
            return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300';
        } else if (normalizedStatus === 'in-progress' || normalizedStatus === 'in progress') {
            return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
        } else if (normalizedStatus === 'open' || normalizedStatus === 'new') {
            return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300';
        } else if (normalizedStatus === 'on-hold' || normalizedStatus === 'blocked') {
            return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300';
        } else {
            return 'bg-muted text-muted-foreground';
        }
    };

    const getRecommendationStatusBadge = (status) => {
        const normalizedStatus = (status || '').toLowerCase();
        
        if (normalizedStatus === 'implemented' || normalizedStatus === 'completed' || normalizedStatus === 'done') {
            return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300';
        } else if (normalizedStatus === 'rejected' || normalizedStatus === 'declined') {
            return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300';
        } else if (normalizedStatus === 'in-progress' || normalizedStatus === 'in progress') {
            return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
        } else if (normalizedStatus === 'pending' || normalizedStatus === 'new') {
            return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300';
        } else {
            return 'bg-muted text-muted-foreground';
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
                return { 
                    icon: Play, 
                    color: 'text-success', 
                    bgColor: 'bg-green-100 dark:bg-green-950', 
                    label: 'Active' 
                };
            case 'completed':
                return { 
                    icon: CheckCircle, 
                    color: 'text-info', 
                    bgColor: 'bg-blue-100 dark:bg-blue-950', 
                    label: 'Completed' 
                };
            case 'on-hold':
                return { 
                    icon: Pause, 
                    color: 'text-warning', 
                    bgColor: 'bg-yellow-100 dark:bg-yellow-950', 
                    label: 'On Hold' 
                };
            case 'planning':
            default:
                return { 
                    icon: Clock, 
                    color: 'text-muted-foreground', 
                    bgColor: 'bg-muted', 
                    label: 'Planning' 
                };
        }
    };

    const getDaysRemaining = () => {
        if (!sprint?.endDate) return null;
        const end = typeof sprint.endDate === 'string' ? new Date(sprint.endDate) : sprint.endDate;
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
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
    const metrics = getSprintMetrics();
    const daysRemaining = getDaysRemaining();

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
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTestCaseStatusBadge(testCase.status)}`}>
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
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBugStatusBadge(bug.status)}`}>
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
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRecommendationStatusBadge(rec.status)}`}>
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