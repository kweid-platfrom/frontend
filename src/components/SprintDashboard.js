'use client'
import React, { useState, useEffect } from 'react';
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
    Video,
    Lightbulb,
    BarChart3
} from 'lucide-react';
import { useApp } from '../context/AppProvider';

const SprintDashboard = ({ sprintId, suiteId }) => {
    const { state, actions } = useApp();
    const { sprints = [], activeSprint } = state.sprints || {};

    const [assets, setAssets] = useState({
        testCases: [],
        bugs: [],
        recordings: [],
        recommendations: []
    });
    const [loading, setLoading] = useState(true);

    // Get sprint data
    const sprint = sprintId 
        ? sprints.find(s => s.id === sprintId)
        : activeSprint;

    // Load sprint assets
    useEffect(() => {
    const loadSprintAssets = async () => {
        if (!sprint || !suiteId) return;

        setLoading(true);
        try {
            const [testCases, bugs, recordings, recommendations] = await Promise.all([
                actions.assets?.getTestCases?.(suiteId, sprint.id) || { success: true, data: [] },
                actions.assets?.getBugs?.(suiteId, sprint.id) || { success: true, data: [] },
                actions.assets?.getRecordings?.(suiteId, sprint.id) || { success: true, data: [] },
                actions.assets?.getRecommendations?.(suiteId, sprint.id) || { success: true, data: [] }
            ]);

            setAssets({
                testCases: testCases.success ? testCases.data || [] : [],
                bugs: bugs.success ? bugs.data || [] : [],
                recordings: recordings.success ? recordings.data || [] : [],
                recommendations: recommendations.success ? recommendations.data || [] : []
            });
        } catch (error) {
            console.error('Error loading sprint assets:', error);
        } finally {
            setLoading(false);
        }
    };

    loadSprintAssets();
}, [sprint, suiteId, actions.assets]); // Added sprint to dependencies

    // Calculate sprint metrics
    const getSprintMetrics = () => {
        const totalTestCases = assets.testCases.length;
        const completedTestCases = assets.testCases.filter(tc => 
            tc.status === 'passed' || tc.status === 'completed'
        ).length;

        const totalBugs = assets.bugs.length;
        const resolvedBugs = assets.bugs.filter(bug => 
            bug.status === 'resolved' || bug.status === 'closed'
        ).length;

        const totalAssets = totalTestCases + totalBugs + assets.recordings.length + assets.recommendations.length;
        const completedAssets = completedTestCases + resolvedBugs;

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
            }
        };
    };

    // Get sprint status info
    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
                return { icon: Play, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Active' };
            case 'completed':
                return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Completed' };
            case 'on-hold':
                return { icon: Pause, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'On Hold' };
            case 'planning':
            default:
                return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Planning' };
        }
    };

    // Get days remaining
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
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted" />
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
                                    daysRemaining < 0 ? 'text-red-600' : 
                                    daysRemaining <= 7 ? 'text-yellow-600' : 'text-muted-foreground'
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
                    <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="flex items-start space-x-2">
                            <Target className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-teal-800 mb-1">Sprint Goals</h3>
                                <p className="text-sm text-teal-700">{sprint.goals}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
                        <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{metrics.testCases.rate}%</span>
                            <span className="text-sm text-muted-foreground">
                                {metrics.testCases.completed} of {metrics.testCases.total}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${metrics.testCases.rate}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bugs Progress */}
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">Bugs Resolved</h3>
                        <Bug className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{metrics.bugs.rate}%</span>
                            <span className="text-sm text-muted-foreground">
                                {metrics.bugs.resolved} of {metrics.bugs.total}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 rounded-full transition-all duration-300"
                                style={{ width: `${metrics.bugs.rate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{assets.testCases.length}</div>
                    <div className="text-sm text-muted-foreground">Test Cases</div>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <Bug className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{assets.bugs.length}</div>
                    <div className="text-sm text-muted-foreground">Bugs</div>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <Video className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{assets.recordings.length}</div>
                    <div className="text-sm text-muted-foreground">Recordings</div>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <Lightbulb className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
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
                        <div className="space-y-4">
                            {/* Test Cases */}
                            {assets.testCases.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span>Test Cases ({assets.testCases.length})</span>
                                    </h4>
                                    <div className="space-y-1">
                                        {assets.testCases.slice(0, 3).map((testCase) => (
                                            <div key={testCase.id} className="flex items-center justify-between py-2 px-3 bg-secondary rounded">
                                                <span className="text-sm text-foreground truncate flex-1">{testCase.title || testCase.name}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    testCase.status === 'passed' || testCase.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : testCase.status === 'failed'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {testCase.status || 'pending'}
                                                </span>
                                            </div>
                                        ))}
                                        {assets.testCases.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center py-1">
                                                +{assets.testCases.length - 3} more test cases
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bugs */}
                            {assets.bugs.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                                        <Bug className="h-4 w-4 text-red-500" />
                                        <span>Bugs ({assets.bugs.length})</span>
                                    </h4>
                                    <div className="space-y-1">
                                        {assets.bugs.slice(0, 3).map((bug) => (
                                            <div key={bug.id} className="flex items-center justify-between py-2 px-3 bg-secondary rounded">
                                                <span className="text-sm text-foreground truncate flex-1">{bug.title || bug.name}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    bug.status === 'resolved' || bug.status === 'closed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : bug.priority === 'high'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {bug.status || 'open'}
                                                </span>
                                            </div>
                                        ))}
                                        {assets.bugs.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center py-1">
                                                +{assets.bugs.length - 3} more bugs
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {Object.values(assets).every(assetArray => assetArray.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-3 text-muted" />
                                    <h4 className="font-medium mb-2">No Assets Yet</h4>
                                    <p className="text-sm">Start adding test cases, bugs, and other assets to this sprint</p>
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