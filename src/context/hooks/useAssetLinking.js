import { handleFirebaseOperation } from '../../utils/firebaseErrorHandler';

export const useAssetLinking = (slices) => {
    const linkTestCasesToBug = async (bugId, testCaseIds) => {
        return handleFirebaseOperation(
            () => FirestoreService.batchLinkTestCasesToBug(bugId, testCaseIds),
            'Test cases linked to bug',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `link-testcases-bug-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.bugs.actions.updateBug(bugId, result.data.bug);
                result.data.testCases.forEach((tc) => {
                    slices.testCases.actions.updateTestCase(tc.id, tc);
                });
            }
            return result;
        });
    };

    const unlinkTestCaseFromBug = async (bugId, testCaseId) => {
        return handleFirebaseOperation(
            () => FirestoreService.batchUnlinkTestCaseFromBug(bugId, testCaseId),
            'Test case unlinked from bug',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `unlink-testcase-bug-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.bugs.actions.updateBug(bugId, result.data.bug);
                slices.testCases.actions.updateTestCase(testCaseId, result.data.testCase);
            }
            return result;
        });
    };

    const linkBugsToTestCase = async (testCaseId, bugIds) => {
        return handleFirebaseOperation(
            () => FirestoreService.batchLinkBugsToTestCase(testCaseId, bugIds),
            'Bugs linked to test case',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `link-bugs-testcase-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                result.data.bugs.forEach((bug) => {
                    slices.bugs.actions.updateBug(bug.id, bug);
                });
            }
            return result;
        });
    };

    const unlinkBugFromTestCase = async (testCaseId, bugId) => {
        return handleFirebaseOperation(
            () => FirestoreService.batchUnlinkBugFromTestCase(testCaseId, bugId),
            'Bug unlinked from test case',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `unlink-bug-testcase-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                slices.bugs.actions.updateBug(bugId, result.data.bug);
            }
            return result;
        });
    };

    const addTestCasesToSprint = async (sprintId, testCaseIds) => {
        return handleFirebaseOperation(
            () => FirestoreService.addTestCasesToSprint(sprintId, testCaseIds),
            'Test cases added to sprint',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `add-testcases-sprint-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.sprints.actions.updateSprint(sprintId, result.data);
            }
            return result;
        });
    };

    const addBugsToSprint = async (sprintId, bugIds) => {
        return handleFirebaseOperation(
            () => FirestoreService.addBugsToSprint(sprintId, bugIds),
            'Bugs added to sprint',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `add-bugs-sprint-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.sprints.actions.updateSprint(sprintId, result.data);
            }
            return result;
        });
    };

    return {
        linkTestCasesToBug,
        unlinkTestCaseFromBug,
        linkBugsToTestCase,
        unlinkBugFromTestCase,
        addTestCasesToSprint,
        addBugsToSprint,
    };
};