/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { TestSuiteService } from '../services/TestSuiteService';
import { useApp } from '../context/AppProvider';

export const useDashboard = () => {
    const { state: { auth, subscription }, activeSuite } = useApp();
    const testSuiteServiceRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const isRefreshingRef = useRef(false);
    const mountRef = useRef(false); // Track if component is mounted

    // Initialize TestSuiteService once
    if (!testSuiteServiceRef.current) {
        testSuiteServiceRef.current = new TestSuiteService(null);
    }

    const defaultMetrics = {
        totalTestCases: 0,
        manualTestCases: 0,
        automatedTestCases: 0,
        aiGeneratedTestCases: 0,
        activeBugs: 0,
        criticalBugs: 0,
        passRate: 0,
        executionCount: 0,
        avgExecutionTime: 0,
        automationRate: 0,
        aiContributionRate: 0,
        bugResolutionRate: 0,
        avgResolutionTime: 0,
        recordings: 0,
        recentActivity: [],
        testCases: 0,
        bugs: 0,
    };

    const [metrics, setMetrics] = useState(defaultMetrics);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dataStatus, setDataStatus] = useState({
        testCases: 'pending',
        bugs: 'pending',
        recordings: 'pending',
        activity: 'pending',
    });

    const clearSubscription = useCallback(() => {
        if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
            try {
                unsubscribeRef.current();
                console.log('Subscription cleared successfully');
            } catch (err) {
                console.warn('Error clearing subscription:', err);
            }
            unsubscribeRef.current = null;
        }
    }, []);

    const resetState = useCallback(() => {
        setMetrics(defaultMetrics);
        setError(null);
        setDataStatus({
            testCases: 'pending',
            bugs: 'pending',
            recordings: 'pending',
            activity: 'pending',
        });
    }, []);

    const updateMetricsPartially = useCallback((partialUpdate, section) => {
        setMetrics((prevMetrics) => ({
            ...prevMetrics,
            ...partialUpdate,
        }));
        setDataStatus((prev) => ({
            ...prev,
            [section]: 'loaded',
        }));
    }, []);

    const fetchDashboardData = useCallback(
        async (forceRefresh = false) => {
            const testSuiteService = testSuiteServiceRef.current;

            if (isRefreshingRef.current && !forceRefresh) {
                console.log('Refresh already in progress, skipping...');
                return () => { };
            }

            if (!auth.isAuthenticated || !auth.currentUser) {
                console.log('User not authenticated, setting not-authenticated status');
                resetState();
                setDataStatus({
                    testCases: 'not-authenticated',
                    bugs: 'not-authenticated',
                    recordings: 'not-authenticated',
                    activity: 'not-authenticated',
                });
                return () => { };
            }

            if (!testSuiteService || typeof testSuiteService.subscribeToUserTestSuites !== 'function') {
                const errorMsg = 'TestSuiteService.subscribeToUserTestSuites is not available';
                console.error(errorMsg, {
                    testSuiteService: !!testSuiteService,
                    subscribeToUserTestSuites: testSuiteService ? typeof testSuiteService.subscribeToUserTestSuites : 'N/A',
                });
                setError(errorMsg);
                setDataStatus({
                    testCases: 'error',
                    bugs: 'error',
                    recordings: 'error',
                    activity: 'error',
                });
                setLoading(false);
                return () => { };
            }

            if (forceRefresh) {
                clearSubscription();
            }

            isRefreshingRef.current = true;
            setLoading(true);
            setError(null);
            setDataStatus({
                testCases: 'pending',
                bugs: 'pending',
                recordings: 'pending',
                activity: 'pending',
            });

            const planLimits = subscription?.planLimits || {
                maxSuites: 999,
                maxTestCasesPerSuite: 999,
                canCreateTestCases: true,
                canUseRecordings: true,
                canUseAutomation: true,
                canInviteTeam: true,
                canExportReports: true,
                canCreateOrganizations: true,
                advancedAnalytics: true,
                prioritySupport: true,
            };

            try {
                // Debounce subscription setup to avoid race conditions
                await new Promise((resolve) => setTimeout(resolve, 100));

                if (!mountRef.current) {
                    console.log('Component unmounted before subscription setup, aborting...');
                    return () => { };
                }

                const unsubscribe = testSuiteService.subscribeToUserTestSuites(
                    async (suites) => {
                        try {
                            console.log(`Processing ${suites?.length || 0} test suites for dashboard`);

                            let totalTestCases = 0;
                            let manualTestCases = 0;
                            let automatedTestCases = 0;
                            let aiGeneratedTestCases = 0;
                            let activeBugs = 0;
                            let criticalBugs = 0;
                            let recordingsCount = 0;
                            let passCount = 0;
                            let executionCount = 0;
                            let totalExecutionTime = 0;
                            let resolvedBugs = 0;
                            let totalResolutionTime = 0;
                            const recentActivity = [];

                            if (!suites || suites.length === 0) {
                                console.log('No test suites found for user');
                                setMetrics(defaultMetrics);
                                setDataStatus({
                                    testCases: 'loaded',
                                    bugs: 'loaded',
                                    recordings: 'loaded',
                                    activity: 'loaded',
                                });
                                setLoading(false);
                                isRefreshingRef.current = false;
                                return;
                            }

                            const suitesToProcess = activeSuite
                                ? suites.filter((suite) => suite.id === activeSuite.id)
                                : suites;

                            console.log(`Processing ${suitesToProcess.length} filtered suites`);

                            const suitePromises = suitesToProcess.map(async (suite) => {
                                if (totalTestCases >= planLimits.maxTestCasesPerSuite) return;

                                console.log(`Processing suite: ${suite.name} (${suite.id})`);

                                // Fetch test cases
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const testCasesResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/testCases`,
                                            [],
                                            'created_at',
                                            planLimits.maxTestCasesPerSuite
                                        );

                                        if (testCasesResult && testCasesResult.success) {
                                            const testCases = testCasesResult.data || [];
                                            console.log(`Found ${testCases.length} test cases in suite ${suite.name}`);

                                            let suiteTotalTests = testCases.length;
                                            let suiteManualTests = 0;
                                            let suiteAutomatedTests = 0;
                                            let suiteAiTests = 0;
                                            let suitePassCount = 0;
                                            let suiteExecutionCount = 0;
                                            let suiteExecutionTime = 0;

                                            testCases.forEach((tc) => {
                                                if (tc.isAutomated || tc.automated || tc.type === 'automated') {
                                                    suiteAutomatedTests++;
                                                } else {
                                                    suiteManualTests++;
                                                }

                                                if (tc.isAIGenerated || tc.aiGenerated || tc.source === 'ai' || tc.generatedBy === 'ai') {
                                                    suiteAiTests++;
                                                }

                                                if (tc.lastExecutionResult || tc.executionResult || tc.status) {
                                                    suiteExecutionCount++;
                                                    const result = tc.lastExecutionResult || tc.executionResult || tc.status;
                                                    if (result === 'pass' || result === 'passed' || result === 'success') {
                                                        suitePassCount++;
                                                    }
                                                    const execTime = tc.lastExecutionTime || tc.executionTime || tc.duration;
                                                    if (execTime && typeof execTime === 'number') {
                                                        suiteExecutionTime += execTime;
                                                    }
                                                }
                                            });

                                            totalTestCases += suiteTotalTests;
                                            manualTestCases += suiteManualTests;
                                            automatedTestCases += suiteAutomatedTests;
                                            aiGeneratedTestCases += suiteAiTests;
                                            passCount += suitePassCount;
                                            executionCount += suiteExecutionCount;
                                            totalExecutionTime += suiteExecutionTime;

                                            const currentPassRate = executionCount > 0 ? Math.round((passCount / executionCount) * 100) : 0;
                                            const currentAutomationRate = totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0;
                                            const currentAiContributionRate = totalTestCases > 0 ? Math.round((aiGeneratedTestCases / totalTestCases) * 100) : 0;
                                            const currentAvgExecutionTime = executionCount > 0 ? Math.round(totalExecutionTime / executionCount) : 0;

                                            updateMetricsPartially(
                                                {
                                                    totalTestCases,
                                                    manualTestCases,
                                                    automatedTestCases,
                                                    aiGeneratedTestCases,
                                                    passRate: currentPassRate,
                                                    executionCount,
                                                    avgExecutionTime: currentAvgExecutionTime,
                                                    automationRate: currentAutomationRate,
                                                    aiContributionRate: currentAiContributionRate,
                                                    testCases: totalTestCases,
                                                },
                                                'testCases'
                                            );
                                        } else {
                                            console.warn(`Failed to fetch test cases for suite ${suite.id}:`, testCasesResult);
                                        }
                                    } else {
                                        console.warn('testSuiteService.queryDocuments not available');
                                        setDataStatus((prev) => ({ ...prev, testCases: 'error' }));
                                    }
                                } catch (tcError) {
                                    console.warn(`Error fetching test cases for suite ${suite.id}:`, tcError);
                                    setDataStatus((prev) => ({ ...prev, testCases: 'error' }));
                                }

                                // Fetch bugs
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const bugsResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/bugs`,
                                            [],
                                            'created_at'
                                        );

                                        if (bugsResult && bugsResult.success) {
                                            const bugs = bugsResult.data || [];
                                            console.log(`Found ${bugs.length} bugs in suite ${suite.name}`);

                                            let suiteActiveBugs = 0;
                                            let suiteCriticalBugs = 0;
                                            let suiteResolvedBugs = 0;
                                            let suiteResolutionTime = 0;

                                            bugs.forEach((bug) => {
                                                const status = bug.status?.toLowerCase() || 'open';
                                                const priority = bug.priority?.toLowerCase() || 'medium';
                                                const severity = bug.severity?.toLowerCase() || 'medium';

                                                if (status !== 'resolved' && status !== 'closed' && status !== 'fixed') {
                                                    suiteActiveBugs++;
                                                    if (priority === 'critical' || severity === 'critical' || priority === 'high') {
                                                        suiteCriticalBugs++;
                                                    }
                                                } else if (status === 'resolved' || status === 'closed' || status === 'fixed') {
                                                    suiteResolvedBugs++;
                                                    const resTime = bug.resolutionTime || bug.timeToResolve;
                                                    if (resTime && typeof resTime === 'number') {
                                                        suiteResolutionTime += resTime;
                                                    } else if (bug.resolvedAt && bug.createdAt) {
                                                        const created = bug.createdAt.toDate ? bug.createdAt.toDate() : new Date(bug.createdAt);
                                                        const resolved = bug.resolvedAt.toDate ? bug.resolvedAt.toDate() : new Date(bug.resolvedAt);
                                                        const diffHours = Math.abs(resolved - created) / 36e5;
                                                        suiteResolutionTime += diffHours;
                                                    }
                                                }
                                            });

                                            activeBugs += suiteActiveBugs;
                                            criticalBugs += suiteCriticalBugs;
                                            resolvedBugs += suiteResolvedBugs;
                                            totalResolutionTime += suiteResolutionTime;

                                            const totalBugsNow = activeBugs + resolvedBugs;
                                            const currentBugResolutionRate = totalBugsNow > 0 ? Math.round((resolvedBugs / totalBugsNow) * 100) : 0;
                                            const currentAvgResolutionTime = resolvedBugs > 0 ? Math.round(totalResolutionTime / resolvedBugs) : 0;

                                            updateMetricsPartially(
                                                {
                                                    activeBugs,
                                                    criticalBugs,
                                                    bugResolutionRate: currentBugResolutionRate,
                                                    avgResolutionTime: currentAvgResolutionTime,
                                                    bugs: activeBugs,
                                                },
                                                'bugs'
                                            );
                                        }
                                    } else {
                                        console.warn('testSuiteService.queryDocuments not available for bugs');
                                        setDataStatus((prev) => ({ ...prev, bugs: 'error' }));
                                    }
                                } catch (bugError) {
                                    console.warn(`Error fetching bugs for suite ${suite.id}:`, bugError);
                                    setDataStatus((prev) => ({ ...prev, bugs: 'error' }));
                                }

                                // Fetch recordings if allowed
                                if (planLimits.canUseRecordings) {
                                    try {
                                        if (testSuiteService.queryDocuments) {
                                            const recordingsResult = await testSuiteService.queryDocuments(
                                                `testSuites/${suite.id}/recordings`,
                                                [],
                                                'created_at'
                                            );
                                            if (recordingsResult && recordingsResult.success) {
                                                const recordings = recordingsResult.data || [];
                                                recordingsCount += recordings.length;
                                                console.log(`Found ${recordings.length} recordings in suite ${suite.name}`);

                                                updateMetricsPartially(
                                                    {
                                                        recordings: recordingsCount,
                                                    },
                                                    'recordings'
                                                );
                                            }
                                        } else {
                                            setDataStatus((prev) => ({ ...prev, recordings: 'error' }));
                                        }
                                    } catch (recError) {
                                        console.warn(`Error fetching recordings for suite ${suite.id}:`, recError);
                                        setDataStatus((prev) => ({ ...prev, recordings: 'error' }));
                                    }
                                } else {
                                    updateMetricsPartially({ recordings: 0 }, 'recordings');
                                }

                                // Fetch activity
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const activityResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/activityLogs`,
                                            [],
                                            'timestamp',
                                            10
                                        );
                                        if (activityResult && activityResult.success) {
                                            const suiteActivity = (activityResult.data || []).map((activity) => ({
                                                ...activity,
                                                suiteId: suite.id,
                                                suiteName: suite.name,
                                            }));
                                            recentActivity.push(...suiteActivity);

                                            const sortedActivity = recentActivity
                                                .sort((a, b) => {
                                                    const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                                                    const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                                                    return bTime - aTime;
                                                })
                                                .slice(0, 10);

                                            updateMetricsPartially(
                                                {
                                                    recentActivity: sortedActivity,
                                                },
                                                'activity'
                                            );
                                        }
                                    } else {
                                        setDataStatus((prev) => ({ ...prev, activity: 'error' }));
                                    }
                                } catch (actError) {
                                    console.warn(`Error fetching activity for suite ${suite.id}:`, actError);
                                    setDataStatus((prev) => ({ ...prev, activity: 'error' }));
                                }
                            });

                            await Promise.allSettled(suitePromises);

                            setLoading(false);
                            isRefreshingRef.current = false;
                            console.log('Dashboard data fetch completed successfully');
                        } catch (err) {
                            console.error('Dashboard data processing error:', err);
                            setError(err.message || 'Failed to process dashboard data');
                            setDataStatus((prev) => ({
                                testCases: prev.testCases === 'loaded' ? 'loaded' : 'error',
                                bugs: prev.bugs === 'loaded' ? 'loaded' : 'error',
                                recordings: prev.recordings === 'loaded' ? 'loaded' : 'error',
                                activity: prev.activity === 'loaded' ? 'loaded' : 'error',
                            }));
                            setLoading(false);
                            isRefreshingRef.current = false;
                        }
                    },
                    (err) => {
                        console.error('Dashboard data fetch error:', err);
                        setError(err.message || 'Failed to load dashboard data');
                        setDataStatus((prev) => ({
                            testCases: prev.testCases === 'loaded' ? 'loaded' : 'error',
                            bugs: prev.bugs === 'loaded' ? 'loaded' : 'error',
                            recordings: prev.recordings === 'loaded' ? 'loaded' : 'error',
                            activity: prev.activity === 'loaded' ? 'loaded' : 'error',
                        }));
                        setLoading(false);
                        isRefreshingRef.current = false;
                    }
                );

                unsubscribeRef.current = unsubscribe;
                return unsubscribe;
            } catch (subscribeError) {
                console.error('Error setting up subscription:', subscribeError);
                setError(subscribeError.message || 'Failed to setup data subscription');
                setDataStatus({
                    testCases: 'error',
                    bugs: 'error',
                    recordings: 'error',
                    activity: 'error',
                });
                setLoading(false);
                isRefreshingRef.current = false;
                return () => { };
            }
        },
        [auth.isAuthenticated, auth.currentUser, subscription?.planLimits, activeSuite?.id]
    );

    // Setup subscription on mount with forced refresh
    useEffect(() => {
        console.log('Setting up dashboard data subscription...');
        mountRef.current = true;
        fetchDashboardData(true); // Force refresh to ensure clean subscription

        return () => {
            console.log('Cleaning up dashboard subscription...');
            mountRef.current = false;
            clearSubscription();
            isRefreshingRef.current = false;
        };
    }, [fetchDashboardData]);

    // Manual refresh function with retry logic
    const refresh = useCallback(async () => {
        console.log('Manual refresh triggered...');
        try {
            await fetchDashboardData(true);
            console.log('Manual refresh completed');
        } catch (error) {
            console.error('Manual refresh failed:', error);
            // Retry once after a delay
            setTimeout(async () => {
                if (!mountRef.current) return; // Skip retry if unmounted
                console.log('Retrying dashboard data fetch...');
                try {
                    await fetchDashboardData(true);
                    console.log('Retry successful');
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                }
            }, 1000);
            throw error;
        }
    }, [fetchDashboardData]);

    return {
        metrics,
        loading,
        error,
        refresh,
        dataStatus,
    };
};