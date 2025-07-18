import firestoreService from './firestoreService';
import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';

const testCaseService = {
    async getTestCases(suiteId) {
        if (!suiteId) {
            console.warn('getTestCases: Suite ID is required');
            return { success: false, error: { message: 'Suite ID is required' } };
        }
        const collectionPath = `testSuites/${suiteId}/testCases`;
        const result = await firestoreService.queryDocuments(collectionPath, [], 'created_at');
        if (!result.success) {
            console.error('getTestCases error:', {
                suiteId,
                errorCode: result.error.code,
                errorMessage: result.error.message,
                originalError: result.error.originalError,
            });
            if (result.error.code === 'permission-denied') {
                return { success: false, error: { message: 'Failed to load test cases' } };
            }
            return result;
        }
        return result;
    },

    async createTestCase(suiteId, testCaseData, user, userProfile) {
        if (!suiteId) {
            return { success: false, error: { message: 'Suite ID is required' } };
        }
        if (!user?.uid) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const testCaseId = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);

            const userDisplayName =
                userProfile?.displayName ||
                `${userProfile?.firstName} ${userProfile?.lastName}`.trim() ||
                user.email ||
                'Unknown User';

            const firestoreData = {
                ...testCaseData,
                id: testCaseId,
                suite_id: suiteId,
                created_by: user.uid,
                createdByName: userDisplayName,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                updated_by: user.uid,
                updatedByName: userDisplayName,
                version: 1,
                executionHistory: [],
                lastExecuted: null,
                executionCount: 0,
                linkedBugs: [], // Initialize linkedBugs array
            };

            await setDoc(testCaseRef, firestoreData);
            return { success: true, data: firestoreData };
        } catch (error) {
            console.error('createTestCase error:', {
                suiteId,
                testCaseId: testCaseData.id,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to create test case' } };
        }
    },

    async updateTestCase(suiteId, testCaseId, testCaseData) {
        if (!suiteId || !testCaseId) {
            return { success: false, error: { message: 'Suite ID and Test Case ID are required' } };
        }

        try {
            const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);
            const updateData = {
                ...testCaseData,
                updated_at: serverTimestamp(),
                version: (testCaseData.version || 0) + 1,
            };

            await updateDoc(testCaseRef, updateData);
            return { success: true, data: { ...updateData, id: testCaseId, suite_id: suiteId } };
        } catch (error) {
            console.error('updateTestCase error:', {
                suiteId,
                testCaseId,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to update test case' } };
        }
    },

    // New method to link bugs to a test case
    async linkBugsToTestCase(suiteId, testCaseId, bugIds) {
        if (!suiteId || !testCaseId || !bugIds?.length) {
            return { success: false, error: { message: 'Suite ID, Test Case ID, and Bug IDs are required' } };
        }

        try {
            await runTransaction(db, async (transaction) => {
                const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);
                // Update test case's linkedBugs
                transaction.update(testCaseRef, {
                    linkedBugs: arrayUnion(...bugIds),
                    updated_at: serverTimestamp(),
                });
                // Update each bug's linkedTestCases
                for (const bugId of bugIds) {
                    const bugRef = doc(db, 'testSuites', suiteId, 'bugs', bugId);
                    transaction.update(bugRef, {
                        linkedTestCases: arrayUnion(testCaseId),
                        updated_at: serverTimestamp(),
                    });
                }
            });
            return { success: true };
        } catch (error) {
            console.error('linkBugsToTestCase error:', {
                suiteId,
                testCaseId,
                bugIds,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to link bugs' } };
        }
    },

    // New method to unlink bugs from a test case
    async unlinkBugsFromTestCase(suiteId, testCaseId, bugIds) {
        if (!suiteId || !testCaseId || !bugIds?.length) {
            return { success: false, error: { message: 'Suite ID, Test Case ID, and Bug IDs are required' } };
        }

        try {
            await runTransaction(db, async (transaction) => {
                const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);
                // Remove bugs from test case's linkedBugs
                transaction.update(testCaseRef, {
                    linkedBugs: arrayRemove(...bugIds),
                    updated_at: serverTimestamp(),
                });
                // Remove test case from each bug's linkedTestCases
                for (const bugId of bugIds) {
                    const bugRef = doc(db, 'testSuites', suiteId, 'bugs', bugId);
                    transaction.update(bugRef, {
                        linkedTestCases: arrayRemove(testCaseId),
                        updated_at: serverTimestamp(),
                    });
                }
            });
            return { success: true };
        } catch (error) {
            console.error('unlinkBugsFromTestCase error:', {
                suiteId,
                testCaseId,
                bugIds,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to unlink bugs' } };
        }
    },
};

export default testCaseService;