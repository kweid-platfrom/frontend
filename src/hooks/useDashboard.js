/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { TestSuiteService } from '../services/TestSuiteService'; // Import TestSuiteService instead
import { useApp } from '../context/AppProvider';

export const useDashboard = () => {
    const { state: { auth, subscription } } = useApp();
    
    // Initialize TestSuiteService (you'll need to pass organizationService if required)
    // For now, assuming organizationService is available or can be null
    const testSuiteService = new TestSuiteService(null); // Adjust based on your setup
    
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
        activity: 'pending'
    });

    const updateMetricsPartially = useCallback((partialUpdate, section) => {
        setMetrics(prevMetrics => ({
            ...prevMetrics,
            ...partialUpdate
        }));
        
        setDataStatus(prev => ({
            ...prev,
            [section]: 'loaded'
        }));
    }, []);

    const fetchDashboardData = useCallback(() => {
        if (!auth.isAuthenticated || !auth.currentUser) {
            setMetrics(defaultMetrics);
            setDataStatus({
                testCases: 'not-authenticated',
                bugs: 'not-authenticated',
                recordings: 'not-authenticated',
                activity: 'not-authenticated'
            });
            return () => {};
        }

        // Check if TestSuiteService and the required method exist
        if (!testSuiteService || typeof testSuiteService.subscribeToUserTestSuites !== 'function') {
            const errorMsg = 'TestSuiteService.subscribeToUserTestSuites is not available';
            console.error(errorMsg, {
                testSuiteService: !!testSuiteService,
                subscribeToUserTestSuites: testSuiteService ? typeof testSuiteService.subscribeToUserTestSuites : 'N/A'
            });
            
            setError(errorMsg);
            setDataStatus({
                testCases: 'error',
                bugs: 'error',
                recordings: 'error',
                activity: 'error'
            });
            setLoading(false);
            return () => {};
        }

        setLoading(true);
        setError(null);
        setDataStatus({
            testCases: 'pending',
            bugs: 'pending',
            recordings: 'pending',
            activity: 'pending'
        });

        const planLimits = subscription.planLimits || {
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
            const unsubscribe = testSuiteService.subscribeToUserTestSuites(
                async (suites) => {
                    try {
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

                        // Handle empty suites array
                        if (!suites || suites.length === 0) {
                            console.log('No test suites found for user');
                            setMetrics(defaultMetrics);
                            setDataStatus({
                                testCases: 'loaded',
                                bugs: 'loaded',
                                recordings: 'loaded',
                                activity: 'loaded'
                            });
                            setLoading(false);
                            return;
                        }

                        const suitePromises = suites.map(async (suite) => {
                            if (totalTestCases >= planLimits.maxTestCasesPerSuite) return;

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
                                        let suiteTotalTests = testCases.length;
                                        let suiteManualTests = 0;
                                        let suiteAutomatedTests = 0;
                                        let suiteAiTests = 0;
                                        let suitePassCount = 0;
                                        let suiteExecutionCount = 0;
                                        let suiteExecutionTime = 0;
                                        
                                        testCases.forEach(tc => {
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

                                        updateMetricsPartially({
                                            totalTestCases,
                                            manualTestCases,
                                            automatedTestCases,
                                            aiGeneratedTestCases,
                                            passRate: currentPassRate,
                                            executionCount,
                                            avgExecutionTime: currentAvgExecutionTime,
                                            automationRate: currentAutomationRate,
                                            aiContributionRate: currentAiContributionRate,
                                            testCases: totalTestCases
                                        }, 'testCases');
                                    }
                                } else {
                                    console.warn('testSuiteService.queryDocuments not available');
                                    setDataStatus(prev => ({ ...prev, testCases: 'error' }));
                                }
                            } catch (tcError) {
                                console.warn(`Error fetching test cases for suite ${suite.id}:`, tcError);
                                setDataStatus(prev => ({ ...prev, testCases: 'error' }));
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
                                        let suiteActiveBugs = 0;
                                        let suiteCriticalBugs = 0;
                                        let suiteResolvedBugs = 0;
                                        let suiteResolutionTime = 0;
                                        
                                        bugs.forEach(bug => {
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

                                        updateMetricsPartially({
                                            activeBugs,
                                            criticalBugs,
                                            bugResolutionRate: currentBugResolutionRate,
                                            avgResolutionTime: currentAvgResolutionTime,
                                            bugs: activeBugs
                                        }, 'bugs');
                                    }
                                } else {
                                    console.warn('testSuiteService.queryDocuments not available for bugs');
                                    setDataStatus(prev => ({ ...prev, bugs: 'error' }));
                                }
                            } catch (bugError) {
                                console.warn(`Error fetching bugs for suite ${suite.id}:`, bugError);
                                setDataStatus(prev => ({ ...prev, bugs: 'error' }));
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
                                            recordingsCount += (recordingsResult.data || []).length;
                                            updateMetricsPartially({
                                                recordings: recordingsCount
                                            }, 'recordings');
                                        }
                                    } else {
                                        setDataStatus(prev => ({ ...prev, recordings: 'error' }));
                                    }
                                } catch (recError) {
                                    console.warn(`Error fetching recordings for suite ${suite.id}:`, recError);
                                    setDataStatus(prev => ({ ...prev, recordings: 'error' }));
                                }
                            } else {
                                // User doesn't have recording permissions, but that's not an error
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
                                        const suiteActivity = (activityResult.data || []).map(activity => ({
                                            ...activity,
                                            suiteId: suite.id,
                                            suiteName: suite.name
                                        }));
                                        recentActivity.push(...suiteActivity);
                                        
                                        const sortedActivity = recentActivity
                                            .sort((a, b) => {
                                                const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                                                const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                                                return bTime - aTime;
                                            })
                                            .slice(0, 10);

                                        updateMetricsPartially({
                                            recentActivity: sortedActivity
                                        }, 'activity');
                                    }
                                } else {
                                    setDataStatus(prev => ({ ...prev, activity: 'error' }));
                                }
                            } catch (actError) {
                                console.warn(`Error fetching activity for suite ${suite.id}:`, actError);
                                setDataStatus(prev => ({ ...prev, activity: 'error' }));
                            }
                        });

                        await Promise.allSettled(suitePromises);

                        setLoading(false);
                        console.log('Dashboard data fetch completed');
                    } catch (err) {
                        console.error('Dashboard data processing error:', err);
                        setError(err.message || 'Failed to process dashboard data');
                        setDataStatus(prev => ({
                            testCases: prev.testCases === 'loaded' ? 'loaded' : 'error',
                            bugs: prev.bugs === 'loaded' ? 'loaded' : 'error',
                            recordings: prev.recordings === 'loaded' ? 'loaded' : 'error',
                            activity: prev.activity === 'loaded' ? 'loaded' : 'error'
                        }));
                        setLoading(false);
                    }
                },
                (err) => {
                    console.error('Dashboard data fetch error:', err);
                    setError(err.message || 'Failed to load dashboard data');
                    setDataStatus(prev => ({
                        testCases: prev.testCases === 'loaded' ? 'loaded' : 'error',
                        bugs: prev.bugs === 'loaded' ? 'loaded' : 'error',
                        recordings: prev.recordings === 'loaded' ? 'loaded' : 'error',
                        activity: prev.activity === 'loaded' ? 'loaded' : 'error'
                    }));
                    setLoading(false);
                }
            );

            return unsubscribe;
        } catch (subscribeError) {
            console.error('Error setting up subscription:', subscribeError);
            setError(subscribeError.message || 'Failed to setup data subscription');
            setDataStatus({
                testCases: 'error',
                bugs: 'error',
                recordings: 'error',
                activity: 'error'
            });
            setLoading(false);
            return () => {};
        }
    }, [auth.isAuthenticated, auth.currentUser, subscription.planLimits, updateMetricsPartially]);

    useEffect(() => {
        const unsubscribe = fetchDashboardData();
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [fetchDashboardData]);

    const refresh = useCallback(async () => {
        console.log('Refreshing dashboard data...');
        const unsubscribe = fetchDashboardData();
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [fetchDashboardData]);

    return { 
        metrics, 
        loading, 
        error, 
        refresh,
        dataStatus
    };
};