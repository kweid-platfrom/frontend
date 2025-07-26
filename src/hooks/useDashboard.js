import { useState, useEffect } from 'react';
import firestoreService from '../services/firestoreService';
import { useApp } from '../context/AppProvider';

export const useDashboard = () => {
    const { state: { auth, subscription } } = useApp();
    const [metrics, setMetrics] = useState({
        testCases: 0,
        bugs: 0,
        recordings: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!auth.isAuthenticated || !auth.currentUser) {
                setMetrics({
                    testCases: 0,
                    bugs: 0,
                    recordings: 0,
                    recentActivity: [],
                });
                return;
            }

            setLoading(true);
            try {
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

                // Fetch test suites for the current user
                const suitesResult = await firestoreService.getUserTestSuites();
                const suites = suitesResult.success ? suitesResult.data : [];

                // Fetch metrics for test cases, bugs, and recordings
                let testCasesCount = 0;
                let bugsCount = 0;
                let recordingsCount = 0;
                const recentActivity = [];

                for (const suite of suites) {
                    if (testCasesCount >= planLimits.maxTestCasesPerSuite) break;

                    // Fetch test cases
                    const testCasesResult = await firestoreService.queryDocuments(
                        `testSuites/${suite.id}/testCases`,
                        [],
                        'created_at',
                        planLimits.maxTestCasesPerSuite
                    );
                    if (testCasesResult.success) {
                        testCasesCount += testCasesResult.data.length;
                    }

                    // Fetch bugs
                    const bugsResult = await firestoreService.queryDocuments(
                        `testSuites/${suite.id}/bugs`,
                        [],
                        'created_at'
                    );
                    if (bugsResult.success) {
                        bugsCount += bugsResult.data.length;
                    }

                    // Fetch recordings
                    if (planLimits.canUseRecordings) {
                        const recordingsResult = await firestoreService.queryDocuments(
                            `testSuites/${suite.id}/recordings`,
                            [],
                            'created_at'
                        );
                        if (recordingsResult.success) {
                            recordingsCount += recordingsResult.data.length;
                        }
                    }

                    // Fetch recent activity
                    const activityResult = await firestoreService.queryDocuments(
                        `testSuites/${suite.id}/activityLogs`,
                        [],
                        'timestamp',
                        10 // Limit to 10 recent activities
                    );
                    if (activityResult.success) {
                        recentActivity.push(...activityResult.data);
                    }
                }

                setMetrics({
                    testCases: testCasesCount,
                    bugs: bugsCount,
                    recordings: recordingsCount,
                    recentActivity: recentActivity.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0)).slice(0, 10),
                });
            } catch (err) {
                setError(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [auth.isAuthenticated, auth.currentUser, subscription.planLimits]);

    return { metrics, loading, error };
};

