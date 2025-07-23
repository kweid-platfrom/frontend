/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './slices/authSlice';
import { useSuites } from './slices/suiteSlice';
import { useTestCases } from './slices/testCaseSlice';
import { useBugs } from './slices/bugSlice';
import { useRecordings } from './slices/recordingSlice';
import { useSprints } from './slices/sprintSlice';
import { useSubscription } from './slices/subscriptionSlice';
import { useTeam } from './slices/teamSlice';
import { useAutomation } from './slices/automationSlice';
import { useUI } from './slices/uiSlice';
import { toast } from 'sonner';
import firestoreService from '../services/firestoreService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const auth = useAuth();
    const suites = useSuites();
    const testCases = useTestCases();
    const bugs = useBugs();
    const recordings = useRecordings();
    const sprints = useSprints();
    const subscription = useSubscription();
    const team = useTeam();
    const automation = useAutomation();
    const ui = useUI();

    const linkTestCasesToBug = async (bugId, testCaseIds) => {
        try {
            const result = await firestoreService.batchLinkTestCasesToBug(bugId, testCaseIds);
            if (result.success) {
                bugs.actions.updateBug(bugId, result.data.bug);
                result.data.testCases.forEach((tc) => {
                    testCases.actions.updateTestCase(tc.id, tc);
                });
                toast.success('Test cases linked to bug', { duration: 5000 });
                return result;
            } else {
                toast.error(result.error.message, { duration: 5000 });
                return result;
            }
        } catch (error) {
            toast.error(error.message, { duration: 5000 });
            return { success: false, error: error.message };
        }
    };

    const unlinkTestCaseFromBug = async (bugId, testCaseId) => {
        try {
            const result = await firestoreService.batchUnlinkTestCaseFromBug(bugId, testCaseId);
            if (result.success) {
                bugs.actions.updateBug(bugId, result.data.bug);
                testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                toast.success('Test case unlinked from bug', { duration: 5000 });
                return result;
            } else {
                toast.error(result.error.message, { duration: 5000 });
                return result;
            }
        } catch (error) {
            toast.error(error.message, { duration: 5000 });
            return { success: false, error: error.message };
        }
    };

    const linkBugsToTestCase = async (testCaseId, bugIds) => {
        try {
            const result = await firestoreService.batchLinkBugsToTestCase(testCaseId, bugIds);
            if (result.success) {
                testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                result.data.bugs.forEach((bug) => {
                    bugs.actions.updateBug(bug.id, bug);
                });
                toast.success('Bugs linked to test case', { duration: 5000 });
                return result;
            } else {
                toast.error(result.error.message, { duration: 5000 });
                return result;
            }
        } catch (error) {
            toast.error(error.message, { duration: 5000 });
            return { success: false, error: error.message };
        }
    };

    const unlinkBugFromTestCase = async (testCaseId, bugId) => {
        try {
            const result = await firestoreService.batchUnlinkBugFromTestCase(testCaseId, bugId);
            if (result.success) {
                testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                bugs.actions.updateBug(bugId, result.data.bug);
                toast.success('Bug unlinked from test case', { duration: 5000 });
                return result;
            } else {
                toast.error(result.error.message, { duration: 5000 });
                return result;
            }
        } catch (error) {
            toast.error(error.message, { duration: 5000 });
            return { success: false, error: error.message };
        }
    };

    const addTestCasesToSprint = async (sprintId, testCaseIds) => {
        try {
            const result = await firestoreService.addTestCasesToSprint(sprintId, testCaseIds);
            if (result.success) {
                sprints.actions.updateSprint(sprintId, result.data);
                toast.success('Test cases added to sprint', { duration: 5000 });
                return result;
            } else {
                toast.error(result.error.message, { duration: 5000 });
                return result;
            }
        } catch (error) {
            toast.error(error.message, { duration: 5000 });
            return { success: false, error: error.message };
        }
    };

    const addBugsToSprint = async (sprintId, bugIds) => {
        try {
            const result = await firestoreService.addBugsToSprint(sprintId, bugIds);
            if (result.success) {
                sprints.actions.updateSprint(sprintId, result.data);
                toast.success('Bugs added to sprint', { duration: 5000 });
                return result;
            } else {
                toast.error(result.error.message, { duration: 5000 });
                return result;
            }
        } catch (error) {
            toast.error(error.message, { duration: 5000 });
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        auth.actions.initializeAuth();
    }, []);

    useEffect(() => {
        if (auth.state.isAuthenticated && auth.state.currentUser) {
            const unsubscribeSuites = firestoreService.subscribeToUserTestSuites(
                (suites) => suites.actions.loadSuitesSuccess(suites),
                (error) => {
                    suites.actions.loadSuitesError(error.message);
                    toast.error(error.message, { duration: 5000 });
                }
            );
            return () => {
                if (unsubscribeSuites) unsubscribeSuites();
            };
        }
    }, [auth.state.isAuthenticated, auth.state.currentUser]);

    useEffect(() => {
        if (auth.state.isAuthenticated && suites.state.activeSuite?.id) {
            const suiteId = suites.state.activeSuite.id;
            const unsubscribeTestCases = firestoreService.subscribeToTestCases(
                suiteId,
                (testCases) => testCases.actions.loadTestCasesSuccess(testCases),
                (error) => {
                    testCases.actions.loadTestCasesError(error.message);
                    toast.error(error.message, { duration: 5000 });
                }
            );
            const unsubscribeBugs = firestoreService.subscribeToBugs(
                suiteId,
                (bugs) => bugs.actions.loadBugsSuccess(bugs),
                (error) => {
                    bugs.actions.loadBugsError(error.message);
                    toast.error(error.message, { duration: 5000 });
                }
            );
            const unsubscribeRecordings = firestoreService.subscribeToRecordings(
                suiteId,
                (recordings) => recordings.actions.loadRecordingsSuccess(recordings),
                (error) => {
                    recordings.actions.loadRecordingsError(error.message);
                    toast.error(error.message, { duration: 5000 });
                }
            );
            const unsubscribeSprints = firestoreService.subscribeToSprints(
                suiteId,
                (sprints) => sprints.actions.loadSprintsSuccess(sprints),
                (error) => {
                    sprints.actions.loadSprintsError(error.message);
                    toast.error(error.message, { duration: 5000 });
                }
            );
            return () => {
                if (unsubscribeTestCases) unsubscribeTestCases();
                if (unsubscribeBugs) unsubscribeBugs();
                if (unsubscribeRecordings) unsubscribeRecordings();
                if (unsubscribeSprints) unsubscribeSprints();
            };
        }
    }, [auth.state.isAuthenticated, suites.state.activeSuite?.id]);

    useEffect(() => {
        if (!auth.state.isAuthenticated || !subscription.state.isTrialActive) return;
        const checkTrialExpiry = () => {
            const { trialEndsAt } = subscription.state;
            if (trialEndsAt && new Date() > new Date(trialEndsAt)) {
                subscription.actions.handleTrialExpiry(suites.state, suites.actions);
            } else if (trialEndsAt) {
                const daysRemaining = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 7) {
                    ui.actions.showNotification(
                        'warning',
                        `Your trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade to continue using all features!`,
                        10000
                    );
                }
            }
        };
        checkTrialExpiry();
        const interval = setInterval(checkTrialExpiry, 60000);
        return () => clearInterval(interval);
    }, [auth.state.isAuthenticated, subscription.state.isTrialActive, subscription.state.trialEndsAt]);

    const value = {
        state: {
            auth: auth.state,
            suites: suites.state,
            testCases: testCases.state,
            bugs: bugs.state,
            recordings: recordings.state,
            sprints: sprints.state,
            subscription: subscription.state,
            team: team.state,
            automation: automation.state,
            ui: ui.state,
        },
        actions: {
            auth: auth.actions,
            suites: suites.actions,
            testCases: testCases.actions,
            bugs: bugs.actions,
            recordings: recordings.actions,
            sprints: sprints.actions,
            subscription: subscription.actions,
            team: team.actions,
            automation: automation.actions,
            ui: ui.actions,
            linkTestCasesToBug,
            unlinkTestCaseFromBug,
            linkBugsToTestCase,
            unlinkBugFromTestCase,
            addTestCasesToSprint,
            addBugsToSprint,
        },
        isAuthenticated: auth.state.isAuthenticated,
        currentUser: auth.state.currentUser,
        activeSuite: suites.state.activeSuite,
        hasCreatedSuite: suites.state.hasCreatedSuite,
        suiteCreationBlocked: suites.state.suiteCreationBlocked,
        isTrialActive: subscription.state.isTrialActive,
        planLimits: subscription.state.planLimits,
        isLoading:
            auth.state.loading ||
            suites.state.loading ||
            testCases.state.loading ||
            bugs.state.loading ||
            recordings.state.loading ||
            sprints.state.loading ||
            subscription.state.loading ||
            team.state.loading ||
            automation.state.loading ||
            ui.state.loading,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppProvider;