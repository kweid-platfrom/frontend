// components/testRuns/TestRunDetailsView.js
'use client';

import React, { useMemo } from 'react';
import { 
    CheckCircle, XCircle, Shield, Clock, Calendar, 
    User, FileText, BarChart3, TrendingUp, AlertCircle,
    Download, Play, Edit2, Trash2, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TestRunDetailsView = ({ 
    run, 
    testCases, 
    onBack, 
    onDelete, 
    onExecute,
    onExport,
    onStartRun,
    onCompleteRun
}) => {
    // Get test cases for this run
    const runTestCases = useMemo(() => {
        return run.test_cases
            .map(tcId => {
                const tc = testCases.find(t => t.id === tcId);
                if (!tc) return null;
                return {
                    ...tc,
                    result: run.results?.[tcId] || { status: 'not_executed' }
                };
            })
            .filter(Boolean);
    }, [run.test_cases, run.results, testCases]);

    // Calculate detailed statistics
    const stats = useMemo(() => {
        const { summary } = run;
        const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
        const failRate = summary.total > 0 ? Math.round((summary.failed / summary.total) * 100) : 0;
        const completionRate = summary.total > 0 ? Math.round(((summary.total - summary.not_executed) / summary.total) * 100) : 0;
        
        const totalDuration = Object.values(run.results || {}).reduce((sum, r) => sum + (r.duration || 0), 0);
        
        return {
            passRate,
            failRate,
            completionRate,
            totalDuration
        };
    }, [run]);

    const getStatusBadge = (status) => {
        const config = {
            passed: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', icon: CheckCircle },
            failed: { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive', icon: XCircle },
            blocked: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning', icon: Shield },
            skipped: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', icon: Clock },
            not_executed: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', icon: Clock }
        };
        const { bg, text, border, icon: Icon } = config[status] || config.not_executed;
        return { bg, text, border, Icon };
    };

    // Helper function to safely format dates
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        return formatDistanceToNow(date, { addSuffix: true });
    };

    return (
        <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header with Back Button */}
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="h-6 w-px bg-border"></div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {run.name}
                    </h1>
                </div>
                
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                Build: {run.build_version || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                {run.environment || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                Created by: {run.created_by}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {run.status === 'not_started' && (
                            <button
                                onClick={() => onStartRun(run.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                                title="Start Run"
                            >
                                <Play className="w-4 h-4" />
                                Start Run
                            </button>
                        )}
                        {run.status === 'in_progress' && (
                            <>
                                <button
                                    onClick={() => onExecute(run)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                                    title="Execute Tests"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Execute
                                </button>
                                <button
                                    onClick={() => onCompleteRun(run.id)}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
                                    title="Complete Run"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Complete
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => onExport(run)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Export Report"
                        >
                            <Download className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <button
                            onClick={() => onDelete(run.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete Run"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-teal-600" />
                            <span className="text-2xl font-bold text-teal-900">
                                {run.summary.passed}
                            </span>
                        </div>
                        <p className="text-sm text-teal-800 font-medium">Passed</p>
                        <p className="text-xs text-teal-600 mt-1">{stats.passRate}% pass rate</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-8 h-8 text-red-600" />
                            <span className="text-2xl font-bold text-red-900">
                                {run.summary.failed}
                            </span>
                        </div>
                        <p className="text-sm text-red-800 font-medium">Failed</p>
                        <p className="text-xs text-red-600 mt-1">{stats.failRate}% fail rate</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8 text-yellow-600" />
                            <span className="text-2xl font-bold text-yellow-900">
                                {run.summary.blocked}
                            </span>
                        </div>
                        <p className="text-sm text-yellow-800 font-medium">Blocked</p>
                        <p className="text-xs text-yellow-600 mt-1">
                            {run.summary.skipped} skipped
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            <span className="text-2xl font-bold text-blue-900">
                                {stats.completionRate}%
                            </span>
                        </div>
                        <p className="text-sm text-blue-800 font-medium">Completed</p>
                        <p className="text-xs text-blue-600 mt-1">
                            {run.summary.total - run.summary.not_executed}/{run.summary.total} tests
                        </p>
                    </div>
                </div>

                {/* Timeline Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Created</span>
                        </div>
                        <p className="text-foreground font-semibold">
                            {formatDate(run.created_at)}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Duration</span>
                        </div>
                        <p className="text-foreground font-semibold">
                            {stats.totalDuration > 0 ? `${stats.totalDuration} minutes` : 'N/A'}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Status</span>
                        </div>
                        <p className="text-foreground font-semibold capitalize">
                            {run.status?.replace('_', ' ')}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {run.description && (
                    <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm">
                        <h3 className="font-semibold text-foreground mb-2">Description</h3>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                            {run.description}
                        </p>
                    </div>
                )}

                {/* Test Cases Results */}
                <div>
                    <h3 className="font-semibold text-foreground mb-4">Test Cases Results</h3>
                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-theme-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Test Case
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Component
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Executed By
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Notes
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {runTestCases.map((tc) => {
                                        const { bg, text, border, Icon } = getStatusBadge(tc.result.status);
                                        return (
                                            <tr key={tc.id} className="hover:bg-accent">
                                                <td className="px-4 py-3 text-sm text-foreground">
                                                    {tc.title}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {tc.component || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}>
                                                        <Icon className="w-3 h-3" />
                                                        {tc.result.status?.replace('_', ' ').charAt(0).toUpperCase() + tc.result.status?.replace('_', ' ').slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {tc.result.duration ? `${tc.result.duration} min` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {tc.result.executed_by || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    <div className="max-w-xs truncate" title={tc.result.notes}>
                                                        {tc.result.notes || '-'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Failed Tests Details */}
                {run.summary.failed > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-2">
                                    Failed Tests ({run.summary.failed})
                                </h4>
                                <div className="space-y-2">
                                    {runTestCases
                                        .filter(tc => tc.result.status === 'failed')
                                        .map(tc => (
                                            <div key={tc.id} className="bg-card rounded p-3 border border-border">
                                                <p className="font-medium text-foreground mb-1">{tc.title}</p>
                                                {tc.result.notes && (
                                                    <p className="text-sm text-muted-foreground">{tc.result.notes}</p>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestRunDetailsView;