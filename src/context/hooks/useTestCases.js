/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import { getAppState, getAppActions } from './useSlices';

export const useTestCases = (slices) => {
    const appState = getAppState(slices);
    const appActions = getAppActions(slices);

    // Debug to verify available actions
    console.log('🔍 useTestCases slices:', {
        testCasesActions: Object.keys(slices.testCases.actions),
        linkBugToTestCase: typeof slices.testCases.actions.linkBugToTestCase,
        unlinkBugFromTestCase: typeof slices.testCases.actions.unlinkBugFromTestCase,
    });

    const wrappedCreateTestCase = useCallback(
        async (testCaseData) => {
            return await slices.testCases.actions.createTestCase(appState, appActions)(testCaseData);
        },
        [slices.testCases.actions]
    );

    const wrappedUpdateTestCase = useCallback(
        async (testCaseId, updateData) => {
            return await slices.testCases.actions.updateTestCase(appState)(testCaseId, updateData);
        },
        [slices.testCases.actions]
    );

    const wrappedDeleteTestCase = useCallback(
        async (testCaseId) => {
            return await slices.testCases.actions.deleteTestCase(appState)(testCaseId);
        },
        [slices.testCases.actions]
    );

    const wrappedLinkBugToTestCase = useCallback(
        async (testCaseId, bugIds) => {
            // Check if the action exists, provide fallback if not
            if (!slices.testCases.actions.linkBugToTestCase) {
                console.warn('linkBugToTestCase not implemented in slices');
                throw new Error('Linking bugs to test cases is not supported in this configuration');
            }
            return await slices.testCases.actions.linkBugToTestCase(appState, appActions)(testCaseId, bugIds);
        },
        [slices.testCases.actions]
    );

    const wrappedUnlinkBugFromTestCase = useCallback(
        async (testCaseId, bugId) => {
            if (!slices.testCases.actions.unlinkBugFromTestCase) {
                console.warn('unlinkBugFromTestCase not implemented in slices');
                throw new Error('Unlinking bugs from test cases is not supported in this configuration');
            }
            return await slices.testCases.actions.unlinkBugFromTestCase(appState, appActions)(testCaseId, bugId);
        },
        [slices.testCases.actions]
    );

    const wrappedSelectTestCases = useCallback(
        (testCases) => {
            if (appActions.ui?.updateSelection) {
                appActions.ui.updateSelection('testCases', testCases);
            }
        },
        [appActions.ui]
    );

    const wrappedClearTestCaseSelection = useCallback(() => {
        if (appActions.ui?.updateSelection) {
            appActions.ui.updateSelection('testCases', []);
        }
    }, [appActions.ui]);

    return {
        testCases: appState.testCases?.testCases || [],
        bugs: appState.bugs?.bugs || [],
        relationships: appState.testCases?.relationships || { testCaseToBugs: {} },
        loading: appState.testCases?.loading || false,
        currentUser: appState.auth?.currentUser || null,
        activeSuite: appState.suites?.activeSuite || null,
        selectedTestCases: appState.ui?.selectedItems?.testCases || [],
        canCreateTestCases: appState.subscription?.planLimits?.canCreateTestCases !== false,
        testCasesLocked: appState.ui?.featureLocks?.testCasesLocked || false,
        createTestCase: wrappedCreateTestCase,
        updateTestCase: wrappedUpdateTestCase,
        deleteTestCase: wrappedDeleteTestCase,
        linkBugToTestCase: wrappedLinkBugToTestCase,
        unlinkBugFromTestCase: wrappedUnlinkBugFromTestCase,
        selectTestCases: wrappedSelectTestCases,
        clearTestCaseSelection: wrappedClearTestCaseSelection,
    };
};