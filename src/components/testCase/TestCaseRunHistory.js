// components/testCase/TestCaseRunHistory.js
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CheckCircle, XCircle, Shield, Clock, ExternalLink, Play, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const TestCaseRunHistory = ({ testCaseId }) => {
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchRuns = async () => {
            if (!testCaseId) {
                setLoading(false);
                return;
            }

            try {
                const runsRef = collection(db, 'testRuns');
                const q = query(
                    runsRef,
                    where('test_cases', 'array-contains', testCaseId)
                );
                
                const snapshot = await getDocs(q);
                const runsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate(),
                }));
                
                setRuns(runsData.sort((a, b) => (b.created_at || 0) - (a.created_at || 0)));
            } catch (error) {
                console.error('Error fetching test runs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRuns();
    }, [testCaseId]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed': return <CheckCircle className="w-4 h-4 text-teal-600" />;
            case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
            case 'blocked': return <Shield className="w-4 h-4 text-warning" />;
            case 'skipped': return <Clock className="w-4 h-4 text-muted-foreground" />;
            default: return <Clock className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            passed: 'bg-teal-50 text-teal-800 border-teal-300',
            failed: 'bg-destructive/20 text-destructive border-destructive',
            blocked: 'bg-warning/20 text-warning border-warning',
            skipped: 'bg-muted text-muted-foreground border-border',
            not_executed: 'bg-muted text-muted-foreground border-border'
        };
        return config[status] || config.not_executed;
    };

    if (loading) {
        return (
            <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading test runs...</p>
            </div>
        );
    }

    if (runs.length === 0) {
        return (
            <div className="text-center py-12">
                <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-foreground mb-2">No Test Runs Yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                    This test case hasn't been executed in any test run
                </p>
                <button
                    onClick={() => router.push('/testruns')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Play className="w-4 h-4" />
                    Create Test Run
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground">
                    Execution History ({runs.length} run{runs.length > 1 ? 's' : ''})
                </h4>
                <button
                    onClick={() => router.push('/testruns')}
                    className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
                >
                    View All Runs
                    <ExternalLink className="w-3 h-3" />
                </button>
            </div>

            <div className="space-y-3">
                {runs.map(run => {
                    const result = run.results?.[testCaseId] || { status: 'not_executed' };
                    return (
                        <div
                            key={run.id}
                            onClick={() => router.push(`/testruns?runId=${run.id}`)}
                            className="bg-muted hover:bg-accent rounded-lg p-4 cursor-pointer transition-colors border border-border hover:border-primary/50"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(result.status)}
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {run.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDistanceToNow(run.created_at, { addSuffix: true })}
                                        </span>
                                        {run.build_version && (
                                            <>
                                                <span>•</span>
                                                <span>Build: {run.build_version}</span>
                                            </>
                                        )}
                                        {run.environment && (
                                            <>
                                                <span>•</span>
                                                <span className="capitalize">{run.environment}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(result.status)} flex-shrink-0 ml-2`}>
                                    {result.status?.replace('_', ' ').charAt(0).toUpperCase() + result.status?.replace('_', ' ').slice(1)}
                                </span>
                            </div>

                            {/* Execution Details */}
                            {result.status !== 'not_executed' && (
                                <div className="pt-3 border-t border-border space-y-2">
                                    {result.executed_by && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                Executed by:
                                            </span>
                                            <span className="text-foreground font-medium">{result.executed_by}</span>
                                        </div>
                                    )}
                                    {result.duration && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Duration:
                                            </span>
                                            <span className="text-foreground font-medium">{result.duration} min</span>
                                        </div>
                                    )}
                                    {result.notes && (
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">Notes:</span>
                                            <p className="text-foreground mt-1 bg-background p-2 rounded border border-border line-clamp-2">
                                                {result.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {runs.length > 3 && (
                <button
                    onClick={() => router.push('/testruns')}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 font-medium"
                >
                    View All Test Runs →
                </button>
            )}
        </div>
    );
};

export default TestCaseRunHistory;