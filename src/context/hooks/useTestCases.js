/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import { getAppState, getAppActions } from './useSlices';

export const useTestCases = (slices) => {
    const wrappedCreateTestCase = useCallback(
        async (testCaseData) => {
            const appState = getAppState(slices);
            const appActions = getAppActions(slices);
            return await slices.testCases.actions.createTestCase(appState, appActions)(testCaseData);
        },
        [slices.testCases.actions]
    );

    const wrappedUpdateTestCase = useCallback(
        async (testCaseId, updateData) => {
            const appState = getAppState(slices);
            return await slices.testCases.actions.updateTestCase(appState)(testCaseId, updateData);
        },
        [slices.testCases.actions]
    );

    const wrappedDeleteTestCase = useCallback(
        async (testCaseId) => {
            const appState = getAppState(slices);
            return await slices.testCases.actions.deleteTestCase(appState)(testCaseId);
        },
        [slices.testCases.actions]
    );

    return { wrappedCreateTestCase, wrappedUpdateTestCase, wrappedDeleteTestCase };
};