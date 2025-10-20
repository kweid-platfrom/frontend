// components/testRuns/TestRunsListView.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Play, Plus, Calendar, CheckCircle, XCircle, Clock,
    AlertCircle, Shield, Search, BarChart3,
    FileText, TrendingUp, Edit2, Trash2, Eye, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TestRunsListView = ({
    testRuns,
    sprints,
    onViewDetails,
    onStartRun,
    onCompleteRun,
    onDeleteRun,
    onExecuteRun,
    onCreateRun,
    selectedRunId
}) => {
    const [filteredRuns, setFilteredRuns] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        sprint: 'all',
        status: 'all',
        environment: 'all',
    });

    // Apply filters
    useEffect(() => {
        let filtered = testRuns || [];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(run =>
                run.name?.toLowerCase().includes(searchLower) ||
                run.build_version?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.sprint !== 'all') {
            filtered = filtered.filter(run => run.sprint_id === filters.sprint);
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(run => run.status === filters.status);
        }

        if (filters.environment !== 'all') {
            filtered = filtered.filter(run => run.environment === filters.environment);
        }

        setFilteredRuns(filtered);
    }, [testRuns, filters]);

    // Calculate statistics
    const stats = useMemo(() => {
        const runs = testRuns || [];
        const total = runs.length;
        const active = runs.filter(r => r.status === 'in_progress').length;
        const completed = runs.filter(r => r.status === 'completed').length;
        const notStarted = runs.filter(r => r.status === 'not_started').length;

        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;

        runs.forEach(run => {
            if (run.summary) {
                totalTests += run.summary.total || 0;
                totalPassed += run.summary.passed || 0;
                totalFailed += run.summary.failed || 0;
            }
        });

        const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

        return { total, active, completed, notStarted, totalTests, totalPassed, totalFailed, passRate };
    }, [testRuns]);

    const getStatusBadge = (status) => {
        const config = {
            not_started: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock },
            in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Play },
            completed: { bg: 'bg-teal-50', text: 'text-teal-800', icon: CheckCircle },
            archived: { bg: 'bg-muted', text: 'text-muted-foreground', icon: FileText },
        };
        const { bg, text, icon: Icon } = config[status] || config.not_started;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                <Icon className="w-3 h-3" />
                {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
            </span>
        );
    };

    const getProgressBar = (summary) => {
        if (!summary || summary.total === 0) return null;
        const passedPercent = (summary.passed / summary.total) * 100;
        const failedPercent = (summary.failed / summary.total) * 100;
        const blockedPercent = (summary.blocked / summary.total) * 100;
        const skippedPercent = (summary.skipped / summary.total) * 100;

        return (
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                {passedPercent > 0 && (
                    <div className="bg-teal-500" style={{ width: `${passedPercent}%` }} title={`${summary.passed} Passed`} />
                )}
                {failedPercent > 0 && (
                    <div className="bg-destructive" style={{ width: `${failedPercent}%` }} title={`${summary.failed} Failed`} />
                )}
                {blockedPercent > 0 && (
                    <div className="bg-warning" style={{ width: `${blockedPercent}%` }} title={`${summary.blocked} Blocked`} />
                )}
                {skippedPercent > 0 && (
                    <div className="bg-muted-foreground" style={{ width: `${skippedPercent}%` }} title={`${summary.skipped} Skipped`} />
                )}
            </div>
        );
    };

    return (
        <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-4 mb-1">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back</span>
                        </button>
                        <div className="h-6 w-px bg-border"></div>
                        <h1 className="text-2xl font-bold text-foreground">Test Runs</h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Execute and track test case runs across builds and environments
                    </p>
                </div>
                <button
                    onClick={onCreateRun}
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Test Run
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                            <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-primary opacity-20" />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Runs</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.active}</p>
                        </div>
                        <Play className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Completed</p>
                            <p className="text-3xl font-bold text-teal-600 mt-2">{stats.completed}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-teal-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                            <p className="text-3xl font-bold text-foreground mt-2">{stats.passRate}%</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-success opacity-20" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-theme-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search test runs..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <select
                        value={filters.sprint}
                        onChange={(e) => setFilters({ ...filters, sprint: e.target.value })}
                        className="px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Sprints</option>
                        {sprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Status</option>
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>

                    <select
                        value={filters.environment}
                        onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
                        className="px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All Environments</option>
                        <option value="development">Development</option>
                        <option value="testing">Testing</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                    </select>
                </div>
            </div>

            {/* Test Runs List */}
            <div className="space-y-4">
                {filteredRuns.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center shadow-theme-sm">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium text-foreground mb-2">No test runs found</p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Create your first test run to start executing test cases
                        </p>
                        <button
                            onClick={onCreateRun}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Test Run
                        </button>
                    </div>
                ) : (
                    filteredRuns.map(run => (
                        <div
                            key={run.id}
                            className={`bg-card border rounded-lg shadow-theme-sm hover:shadow-theme-md transition-all ${selectedRunId === run.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-foreground">{run.name}</h3>
                                            {getStatusBadge(run.status)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                Build: {run.build_version || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Shield className="w-4 h-4" />
                                                {run.environment || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {run.created_at && !isNaN(new Date(run.created_at).getTime())
                                                    ? formatDistanceToNow(new Date(run.created_at), { addSuffix: true })
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {run.status === 'not_started' && (
                                            <button
                                                onClick={() => onStartRun(run.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Start Run"
                                            >
                                                <Play className="w-5 h-5" />
                                            </button>
                                        )}
                                        {run.status === 'in_progress' && (
                                            <>
                                                <button
                                                    onClick={() => onExecuteRun(run)}
                                                    className="p-2 text-primary hover:bg-accent rounded-lg transition-colors"
                                                    title="Execute Tests"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => onCompleteRun(run.id)}
                                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                    title="Complete Run"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => onViewDetails(run)}
                                            className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteRun(run.id)}
                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                            title="Delete Run"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {run.summary && (
                                    <div className="space-y-2">
                                        {getProgressBar(run.summary)}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{run.summary.total} Total Tests</span>
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3 text-teal-600" />
                                                    {run.summary.passed} Passed
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <XCircle className="w-3 h-3 text-destructive" />
                                                    {run.summary.failed} Failed
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Shield className="w-3 h-3 text-warning" />
                                                    {run.summary.blocked} Blocked
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3 text-muted-foreground" />
                                                    {run.summary.not_executed} Not Executed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TestRunsListView;