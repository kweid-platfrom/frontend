import firestoreService from './firestoreService';
import { doc, setDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, runTransaction} from 'firebase/firestore';
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

    // Enhanced method to link bugs to a test case with comprehensive error handling
    async linkBugsToTestCase(suiteId, testCaseId, bugIds, activeSuite) {
        if (!suiteId || !testCaseId || !bugIds?.length) {
            return { success: false, error: { message: 'Suite ID, Test Case ID, and Bug IDs are required' } };
        }

        // Validate bugIds format
        if (!Array.isArray(bugIds) || bugIds.some(id => !id || typeof id !== 'string')) {
            return { success: false, error: { message: 'Invalid bug IDs format' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);
                
                // Get current test case data to check for existing links
                const testCaseDoc = await transaction.get(testCaseRef);
                if (!testCaseDoc.exists()) {
                    throw new Error('Test case not found');
                }

                const testCaseData = testCaseDoc.data();
                const existingLinkedBugs = testCaseData.linkedBugs || [];
                
                // Filter out already linked bugs to prevent duplicates
                const newBugIds = bugIds.filter(bugId => !existingLinkedBugs.includes(bugId));
                
                if (newBugIds.length === 0) {
                    return { alreadyLinked: true, skippedCount: bugIds.length };
                }

                // Determine the bugs collection path based on account type
                const getBugsCollectionPath = () => {
                    if (activeSuite?.accountType === 'individual') {
                        return `individualAccounts/${activeSuite.userId}/testSuites/${suiteId}/bugs`;
                    }
                    return `organizations/${activeSuite.org_id}/testSuites/${suiteId}/bugs`;
                };

                const bugsCollectionPath = getBugsCollectionPath();
                
                // Verify all bugs exist before linking
                const bugVerificationPromises = newBugIds.map(async (bugId) => {
                    const bugRef = doc(db, bugsCollectionPath.split('/').slice(0, -1).join('/'), 'bugs', bugId);
                    const bugDoc = await transaction.get(bugRef);
                    return { bugId, exists: bugDoc.exists() };
                });

                const bugVerifications = await Promise.all(bugVerificationPromises);
                const nonExistentBugs = bugVerifications.filter(v => !v.exists).map(v => v.bugId);
                
                if (nonExistentBugs.length > 0) {
                    throw new Error(`Bugs not found: ${nonExistentBugs.join(', ')}`);
                }

                // Update test case's linkedBugs
                transaction.update(testCaseRef, {
                    linkedBugs: arrayUnion(...newBugIds),
                    updated_at: serverTimestamp(),
                });

                // Update each bug's linkedTestCases
                for (const bugId of newBugIds) {
                    const bugRef = doc(db, bugsCollectionPath.split('/').slice(0, -1).join('/'), 'bugs', bugId);
                    transaction.update(bugRef, {
                        linkedTestCases: arrayUnion(testCaseId),
                        updated_at: serverTimestamp(),
                    });
                }

                return { 
                    success: true, 
                    linkedCount: newBugIds.length, 
                    skippedCount: bugIds.length - newBugIds.length,
                    linkedBugIds: newBugIds
                };
            });

            if (result.alreadyLinked) {
                return { 
                    success: true, 
                    message: 'All bugs were already linked to this test case',
                    linkedCount: 0,
                    skippedCount: result.skippedCount
                };
            }

            return { 
                success: true, 
                message: `Successfully linked ${result.linkedCount} bug(s)${result.skippedCount > 0 ? ` (${result.skippedCount} already linked)` : ''}`,
                linkedCount: result.linkedCount,
                skippedCount: result.skippedCount,
                linkedBugIds: result.linkedBugIds
            };
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

    // Enhanced method to unlink bugs from a test case
    async unlinkBugsFromTestCase(suiteId, testCaseId, bugIds, activeSuite) {
        if (!suiteId || !testCaseId || !bugIds?.length) {
            return { success: false, error: { message: 'Suite ID, Test Case ID, and Bug IDs are required' } };
        }

        // Validate bugIds format
        if (!Array.isArray(bugIds) || bugIds.some(id => !id || typeof id !== 'string')) {
            return { success: false, error: { message: 'Invalid bug IDs format' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);
                
                // Get current test case data to check existing links
                const testCaseDoc = await transaction.get(testCaseRef);
                if (!testCaseDoc.exists()) {
                    throw new Error('Test case not found');
                }

                const testCaseData = testCaseDoc.data();
                const existingLinkedBugs = testCaseData.linkedBugs || [];
                
                // Filter to only unlink bugs that are actually linked
                const bugsToUnlink = bugIds.filter(bugId => existingLinkedBugs.includes(bugId));
                
                if (bugsToUnlink.length === 0) {
                    return { nothingToUnlink: true, skippedCount: bugIds.length };
                }

                // Determine the bugs collection path based on account type
                const getBugsCollectionPath = () => {
                    if (activeSuite?.accountType === 'individual') {
                        return `individualAccounts/${activeSuite.userId}/testSuites/${suiteId}/bugs`;
                    }
                    return `organizations/${activeSuite.org_id}/testSuites/${suiteId}/bugs`;
                };

                const bugsCollectionPath = getBugsCollectionPath();

                // Remove bugs from test case's linkedBugs
                transaction.update(testCaseRef, {
                    linkedBugs: arrayRemove(...bugsToUnlink),
                    updated_at: serverTimestamp(),
                });

                // Remove test case from each bug's linkedTestCases
                for (const bugId of bugsToUnlink) {
                    const bugRef = doc(db, bugsCollectionPath.split('/').slice(0, -1).join('/'), 'bugs', bugId);
                    transaction.update(bugRef, {
                        linkedTestCases: arrayRemove(testCaseId),
                        updated_at: serverTimestamp(),
                    });
                }

                return { 
                    success: true, 
                    unlinkedCount: bugsToUnlink.length, 
                    skippedCount: bugIds.length - bugsToUnlink.length,
                    unlinkedBugIds: bugsToUnlink
                };
            });

            if (result.nothingToUnlink) {
                return { 
                    success: true, 
                    message: 'None of the specified bugs were linked to this test case',
                    unlinkedCount: 0,
                    skippedCount: result.skippedCount
                };
            }

            return { 
                success: true, 
                message: `Successfully unlinked ${result.unlinkedCount} bug(s)${result.skippedCount > 0 ? ` (${result.skippedCount} were not linked)` : ''}`,
                unlinkedCount: result.unlinkedCount,
                skippedCount: result.skippedCount,
                unlinkedBugIds: result.unlinkedBugIds
            };
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

    // New method to get available bugs for linking (bugs not already linked to a test case)
    async getAvailableBugsForLinking(suiteId, testCaseId, activeSuite) {
        if (!suiteId || !testCaseId) {
            return { success: false, error: { message: 'Suite ID and Test Case ID are required' } };
        }

        try {
            // Get current test case to see already linked bugs
            const testCaseResult = await firestoreService.getDocument(`testSuites/${suiteId}/testCases`, testCaseId);
            if (!testCaseResult.success) {
                return { success: false, error: { message: 'Test case not found' } };
            }

            const linkedBugs = testCaseResult.data.linkedBugs || [];

            // Get all bugs in the suite
            const getBugsCollectionPath = () => {
                if (activeSuite?.accountType === 'individual') {
                    return `individualAccounts/${activeSuite.userId}/testSuites/${suiteId}/bugs`;
                }
                return `organizations/${activeSuite.org_id}/testSuites/${suiteId}/bugs`;
            };

            const bugsResult = await firestoreService.queryDocuments(getBugsCollectionPath(), []);
            if (!bugsResult.success) {
                return { success: false, error: { message: 'Failed to fetch bugs' } };
            }

            // Filter out already linked bugs
            const availableBugs = bugsResult.data.filter(bug => !linkedBugs.includes(bug.id));

            return { 
                success: true, 
                data: availableBugs,
                totalBugs: bugsResult.data.length,
                availableCount: availableBugs.length,
                linkedCount: linkedBugs.length
            };
        } catch (error) {
            console.error('getAvailableBugsForLinking error:', {
                suiteId,
                testCaseId,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to get available bugs' } };
        }
    },

    // New method to get linked bugs for a test case with full bug details
    async getLinkedBugsForTestCase(suiteId, testCaseId, activeSuite) {
        if (!suiteId || !testCaseId) {
            return { success: false, error: { message: 'Suite ID and Test Case ID are required' } };
        }

        try {
            // Get current test case to see linked bugs
            const testCaseResult = await firestoreService.getDocument(`testSuites/${suiteId}/testCases`, testCaseId);
            if (!testCaseResult.success) {
                return { success: false, error: { message: 'Test case not found' } };
            }

            const linkedBugIds = testCaseResult.data.linkedBugs || [];

            if (linkedBugIds.length === 0) {
                return { success: true, data: [], count: 0 };
            }

            // Get full bug details
            const getBugsCollectionPath = () => {
                if (activeSuite?.accountType === 'individual') {
                    return `individualAccounts/${activeSuite.userId}/testSuites/${suiteId}/bugs`;
                }
                return `organizations/${activeSuite.org_id}/testSuites/${suiteId}/bugs`;
            };

            const bugDetailsPromises = linkedBugIds.map(async (bugId) => {
                const bugResult = await firestoreService.getDocument(getBugsCollectionPath(), bugId);
                if (bugResult.success) {
                    return { ...bugResult.data, id: bugId };
                }
                return null;
            });

            const bugDetails = await Promise.all(bugDetailsPromises);
            const validBugs = bugDetails.filter(bug => bug !== null);

            return { 
                success: true, 
                data: validBugs,
                count: validBugs.length,
                requestedCount: linkedBugIds.length
            };
        } catch (error) {
            console.error('getLinkedBugsForTestCase error:', {
                suiteId,
                testCaseId,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to get linked bugs' } };
        }
    },

    // Bulk operations for professional use
    async bulkLinkBugsToTestCases(suiteId, testCaseIds, bugIds, activeSuite) {
        if (!suiteId || !testCaseIds?.length || !bugIds?.length) {
            return { success: false, error: { message: 'Suite ID, Test Case IDs, and Bug IDs are required' } };
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const testCaseId of testCaseIds) {
            try {
                const result = await this.linkBugsToTestCase(suiteId, testCaseId, bugIds, activeSuite);
                results.push({ testCaseId, result });
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({ testCaseId, result: { success: false, error: { message: error.message } } });
                failureCount++;
            }
        }

        return {
            success: successCount > 0,
            results,
            summary: {
                successCount,
                failureCount,
                totalProcessed: testCaseIds.length
            }
        };
    },

    async bulkUnlinkBugsFromTestCases(suiteId, testCaseIds, bugIds, activeSuite) {
        if (!suiteId || !testCaseIds?.length || !bugIds?.length) {
            return { success: false, error: { message: 'Suite ID, Test Case IDs, and Bug IDs are required' } };
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const testCaseId of testCaseIds) {
            try {
                const result = await this.unlinkBugsFromTestCase(suiteId, testCaseId, bugIds, activeSuite);
                results.push({ testCaseId, result });
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({ testCaseId, result: { success: false, error: { message: error.message } } });
                failureCount++;
            }
        }

        return {
            success: successCount > 0,
            results,
            summary: {
                successCount,
                failureCount,
                totalProcessed: testCaseIds.length
            }
        };
    }
};

export default testCaseService;