import FirestoreService from '../../services';
import { handleFirebaseOperation } from '../../utils/firebaseErrorHandler';
import { format } from 'date-fns';

export const useReports = () => {
    const initialState = {
        reports: [],
        loading: false,
        error: null,
        scheduledReportsEnabled: false,
    };

    const reportTypes = [
        'AI Insight Report',
        'Bug Summary Report',
        'Test Case Coverage Report',
        'Sprint Report',
        'Release Gate Report',
        'Regression Insights',
        'Automation Report',
    ];


    const reportActions = {
        getReports: (appState) => async () => {
            const { auth } = appState;
            if (!auth.isAuthenticated || !hasPermission(auth.currentUser)) {
                return { success: false, error: 'Permission denied' };
            }
            try {
                const result = await handleFirebaseOperation(
                    () => FirestoreService.reports.getReports(auth.currentUser.organizationId),
                    'Reports loaded successfully'
                );
                return result;
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        saveReport: (appState) => async (reportData) => {
            const { auth } = appState;
            if (!auth.isAuthenticated || !hasPermission(auth.currentUser)) {
                return { success: false, error: 'Permission denied' };
            }
            try {
                const result = await handleFirebaseOperation(
                    () => FirestoreService.reports.saveReport(reportData),
                    'Report saved successfully'
                );
                return result;
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        generateReport: (appState, appActions) => async (reportConfig) => {
            const { auth, suites, testCases, bugs, sprints, automation, ai } = appState;
            const { ai: aiActions } = appActions;
            if (!auth.isAuthenticated || !hasPermission(auth.currentUser)) {
                return { success: false, error: 'Permission denied' };
            }
            if (!ai.isInitialized) {
                return { success: false, error: 'AI service not initialized' };
            }
            try {
                const { reportType, suiteId, sprintId, dateRange } = reportConfig;
                const suiteData = suites.testSuites.find((suite) => suite.id === suiteId);
                const sprintData = sprintId ? sprints.sprints.find((sprint) => sprint.id === sprintId) : null;
                const testCaseData = testCases.testCases.filter((tc) => tc.suiteId === suiteId);
                const bugData = bugs.bugs.filter((bug) => bug.suiteId === suiteId);
                const automationData = automation.logs.filter((log) => log.suiteId === suiteId);

                const aiResult = await aiActions.generateReport({
                    reportType,
                    suiteData,
                    sprintData,
                    testCaseData,
                    bugData,
                    automationData,
                    dateRange,
                    created_by: auth.currentUser.email,
                    organizationId: auth.currentUser.organizationId,
                });

                if (aiResult.success) {
                    const reportDoc = {
                        name: `${reportType} - ${format(new Date(), 'yyyy-MM-dd')}`,
                        type: reportType,
                        suiteId,
                        sprintId: sprintId || null,
                        created_by: auth.currentUser.email,
                        created_at: new Date().toISOString(),
                        status: 'Generated',
                        organizationId: auth.currentUser.organizationId,
                        summary: aiResult.data.summary || 'No summary available',
                        insights: aiResult.data.insights || 'No insights available',
                        riskScores: aiResult.data.riskScores || {
                            overallRisk: 'Unknown',
                            criticalIssues: 0,
                            coverageGaps: 0,
                            automationStability: 'Unknown',
                        },
                        recommendations: aiResult.data.recommendations || [],
                    };

                    const saveResult = await handleFirebaseOperation(
                        () => FirestoreService.reports.saveReport(reportDoc),
                        'Report generated and saved'
                    );
                    if (saveResult.success) {
                        return { success: true, data: { id: saveResult.id, ...reportDoc } };
                    }
                    return { success: false, error: 'Failed to save report' };
                }
                return { success: false, error: aiResult.error };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        deleteReport: (appState) => async (reportId) => {
            const { auth } = appState;
            if (!auth.isAuthenticated || !hasPermission(auth.currentUser)) {
                return { success: false, error: 'Permission denied' };
            }
            try {
                const result = await handleFirebaseOperation(
                    () => FirestoreService.reports.deleteReport(reportId),
                    'Report deleted successfully'
                );
                return result;
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        toggleSchedule: (appState) => async (enabled) => {
            const { auth } = appState;
            if (!auth.isAuthenticated || !hasPermission(auth.currentUser)) {
                return { success: false, error: 'Permission denied' };
            }
            try {
                const result = await handleFirebaseOperation(
                    () => FirestoreService.reports.toggleSchedule({
                        organizationId: auth.currentUser.organizationId,
                        enabled,
                    }),
                    `Scheduled reports ${enabled ? 'enabled' : 'disabled'}`
                );
                return result;
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        subscribeToTriggers: (appState, appActions) => (callback) => {
            const { auth, suites, bugs, sprints, automation } = appState;
            if (!auth.isAuthenticated || !hasPermission(auth.currentUser)) {
                callback({ success: false, error: 'Permission denied' });
                return () => {};
            }
            return FirestoreService.reports.subscribeToTriggers(
                auth.currentUser.organizationId,
                async (trigger) => {
                    try {
                        const generateReport = appActions.reports.generateReport(appState, appActions);
                        if (trigger.type === 'bug_spike' && bugs.bugs.filter((b) => b.severity === 'critical').length > 5) {
                            await generateReport({
                                reportType: 'Bug Summary Report',
                                suiteId: suites.activeSuite?.id,
                                status: 'Generated',
                                created_by: 'system',
                            });
                        } else if (trigger.type === 'sprint_end' && sprints.sprints.some((s) => s.status === 'ended')) {
                            await generateReport({
                                reportType: 'Sprint Report',
                                suiteId: suites.activeSuite?.id,
                                sprintId: sprints.sprints.find((s) => s.status === 'ended')?.id,
                                status: 'Generated',
                                created_by: 'system',
                            });
                        } else if (
                            trigger.type === 'automation_failure' &&
                            automation.logs.filter((log) => log.status === 'failed').length > 10
                        ) {
                            await generateReport({
                                reportType: 'Automation Report',
                                suiteId: suites.activeSuite?.id,
                                status: 'Generated',
                                created_by: 'system',
                            });
                        }
                    } catch (error) {
                        callback({ success: false, error: error.message });
                    }
                }
            );
        },
    };

    const hasPermission = (user) => {
        const roles = ['qa_lead', 'admin', 'org_admin'];
        return user?.role && roles.includes(user.role);
    };

    return {
        state: initialState,
        actions: reportActions,
        reportTypes, // Explicitly return reportTypes
    };
};