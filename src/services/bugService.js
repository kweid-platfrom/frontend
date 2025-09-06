import { AssetService } from './assetService';
import { doc, runTransaction, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export class BugService {
    constructor(assetService, testSuiteService) {
        this.assetService = assetService;
        this.testSuiteService = testSuiteService;
    }

    // ========================
    // BASIC CRUD OPERATIONS (delegated to AssetService)
    // ========================

    async createBug(suiteId, bugData, sprintId = null) {
        const enhancedBugData = {
            ...bugData,
            linkedTestCases: [],
            linkedRecommendations: [],
            status: bugData.status || 'open',
            priority: bugData.priority || 'medium',
            severity: bugData.severity || 'medium',
            type: 'bug'
        };
        return await this.assetService.createBug(suiteId, enhancedBugData, sprintId);
    }

    async updateBug(bugId, updates, suiteId, sprintId = null) {
        return await this.assetService.updateBug(bugId, updates, suiteId, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        return await this.assetService.deleteBug(bugId, suiteId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.assetService.getBug(bugId, suiteId, sprintId);
    }

    async getBugs(suiteId, sprintId = null) {
        return await this.assetService.getBugs(suiteId, sprintId);
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.assetService.subscribeToBugs(suiteId, callback, errorCallback, sprintId);
    }

    // ========================
    // RECOMMENDATION OPERATIONS
    // ========================

    async createRecommendation(suiteId, recommendationData, sprintId = null) {
        const enhancedRecommendationData = {
            ...recommendationData,
            linkedTestCases: [],
            linkedBugs: [],
            status: recommendationData.status || 'open',
            priority: recommendationData.priority || 'medium',
            impact: recommendationData.impact || 'medium',
            type: 'recommendation',
            category: recommendationData.category || 'improvement'
        };
        return await this.assetService.createRecommendation(suiteId, enhancedRecommendationData, sprintId);
    }

    async updateRecommendation(recommendationId, updates, suiteId, sprintId = null) {
        return await this.assetService.updateRecommendation(recommendationId, updates, suiteId, sprintId);
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.assetService.deleteRecommendation(recommendationId, suiteId, sprintId);
    }

    async getRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.assetService.getRecommendation(recommendationId, suiteId, sprintId);
    }

    async getRecommendations(suiteId, sprintId = null) {
        return await this.assetService.getRecommendations(suiteId, sprintId);
    }

    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.assetService.subscribeToRecommendations(suiteId, callback, errorCallback, sprintId);
    }

    // ========================
    // LINKING OPERATIONS - BUGS TO TEST CASES
    // ========================

    async linkTestCasesToBug(suiteId, bugId, testCaseIds, sprintId = null) {
        const userId = this.assetService.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate access
        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to link test cases' } };
        }

        if (!testCaseIds?.length) {
            return { success: false, error: { message: 'Test case IDs are required' } };
        }

        // Validate testCaseIds format - porting from TestCaseService
        if (!Array.isArray(testCaseIds) || testCaseIds.some(id => !id || typeof id !== 'string')) {
            return { success: false, error: { message: 'Invalid test case IDs format' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                const bugPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/bugs/${bugId}`
                    : `testSuites/${suiteId}/bugs/${bugId}`;
                
                const bugRef = doc(db, bugPath);
                const bugDoc = await transaction.get(bugRef);
                
                if (!bugDoc.exists()) {
                    throw new Error('Bug not found');
                }

                const bugData = bugDoc.data();
                const existingLinks = bugData.linkedTestCases || [];
                const newTestCaseIds = testCaseIds.filter(tcId => !existingLinks.includes(tcId));

                if (newTestCaseIds.length === 0) {
                    return { alreadyLinked: true, skippedCount: testCaseIds.length };
                }

                // Verify all test cases exist before linking - porting validation logic
                const testCaseVerificationPromises = newTestCaseIds.map(async (testCaseId) => {
                    const testCasePath = sprintId
                        ? `testSuites/${suiteId}/sprints/${sprintId}/testCases/${testCaseId}`
                        : `testSuites/${suiteId}/testCases/${testCaseId}`;
                    
                    const testCaseRef = doc(db, testCasePath);
                    const testCaseDoc = await transaction.get(testCaseRef);
                    return { testCaseId, exists: testCaseDoc.exists() };
                });

                const testCaseVerifications = await Promise.all(testCaseVerificationPromises);
                const nonExistentTestCases = testCaseVerifications.filter(v => !v.exists).map(v => v.testCaseId);
                
                if (nonExistentTestCases.length > 0) {
                    throw new Error(`Test cases not found: ${nonExistentTestCases.join(', ')}`);
                }

                // Update bug's linkedTestCases
                transaction.update(bugRef, {
                    linkedTestCases: arrayUnion(...newTestCaseIds),
                    updated_at: serverTimestamp(),
                    updated_by: userId
                });

                // Update each test case's linkedBugs
                for (const testCaseId of newTestCaseIds) {
                    const testCasePath = sprintId
                        ? `testSuites/${suiteId}/sprints/${sprintId}/testCases/${testCaseId}`
                        : `testSuites/${suiteId}/testCases/${testCaseId}`;
                    
                    const testCaseRef = doc(db, testCasePath);
                    transaction.update(testCaseRef, {
                        linkedBugs: arrayUnion(bugId),
                        updated_at: serverTimestamp(),
                        updated_by: userId
                    });
                }

                return {
                    success: true,
                    linkedCount: newTestCaseIds.length,
                    skippedCount: testCaseIds.length - newTestCaseIds.length,
                    linkedTestCaseIds: newTestCaseIds
                };
            });

            if (result.alreadyLinked) {
                return {
                    success: true,
                    message: 'All test cases were already linked to this bug',
                    linkedCount: 0,
                    skippedCount: result.skippedCount
                };
            }

            return {
                success: true,
                message: `Successfully linked ${result.linkedCount} test case(s)${result.skippedCount > 0 ? ` (${result.skippedCount} already linked)` : ''}`,
                linkedCount: result.linkedCount,
                skippedCount: result.skippedCount,
                linkedTestCaseIds: result.linkedTestCaseIds
            };
        } catch (error) {
            console.error('linkTestCasesToBug error:', {
                suiteId,
                bugId,
                testCaseIds,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to link test cases' } };
        }
    }

    async unlinkTestCasesFromBug(suiteId, bugId, testCaseIds, sprintId = null) {
        const userId = this.assetService.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unlink test cases' } };
        }

        if (!testCaseIds?.length) {
            return { success: false, error: { message: 'Test case IDs are required' } };
        }

        // Validate testCaseIds format
        if (!Array.isArray(testCaseIds) || testCaseIds.some(id => !id || typeof id !== 'string')) {
            return { success: false, error: { message: 'Invalid test case IDs format' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                const bugPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/bugs/${bugId}`
                    : `testSuites/${suiteId}/bugs/${bugId}`;
                
                const bugRef = doc(db, bugPath);
                const bugDoc = await transaction.get(bugRef);
                
                if (!bugDoc.exists()) {
                    throw new Error('Bug not found');
                }

                const bugData = bugDoc.data();
                const existingLinks = bugData.linkedTestCases || [];
                const testCasesToUnlink = testCaseIds.filter(tcId => existingLinks.includes(tcId));

                if (testCasesToUnlink.length === 0) {
                    return { nothingToUnlink: true, skippedCount: testCaseIds.length };
                }

                // Update bug's linkedTestCases
                transaction.update(bugRef, {
                    linkedTestCases: arrayRemove(...testCasesToUnlink),
                    updated_at: serverTimestamp(),
                    updated_by: userId
                });

                // Update each test case's linkedBugs
                for (const testCaseId of testCasesToUnlink) {
                    const testCasePath = sprintId
                        ? `testSuites/${suiteId}/sprints/${sprintId}/testCases/${testCaseId}`
                        : `testSuites/${suiteId}/testCases/${testCaseId}`;
                    
                    const testCaseRef = doc(db, testCasePath);
                    transaction.update(testCaseRef, {
                        linkedBugs: arrayRemove(bugId),
                        updated_at: serverTimestamp(),
                        updated_by: userId
                    });
                }

                return {
                    success: true,
                    unlinkedCount: testCasesToUnlink.length,
                    skippedCount: testCaseIds.length - testCasesToUnlink.length,
                    unlinkedTestCaseIds: testCasesToUnlink
                };
            });

            if (result.nothingToUnlink) {
                return {
                    success: true,
                    message: 'None of the specified test cases were linked to this bug',
                    unlinkedCount: 0,
                    skippedCount: result.skippedCount
                };
            }

            return {
                success: true,
                message: `Successfully unlinked ${result.unlinkedCount} test case(s)${result.skippedCount > 0 ? ` (${result.skippedCount} were not linked)` : ''}`,
                unlinkedCount: result.unlinkedCount,
                skippedCount: result.skippedCount,
                unlinkedTestCaseIds: result.unlinkedTestCaseIds
            };
        } catch (error) {
            console.error('unlinkTestCasesFromBug error:', {
                suiteId,
                bugId,
                testCaseIds,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to unlink test cases' } };
        }
    }

    // ========================
    // LINKING OPERATIONS - BUGS TO TEST CASES (Reverse Direction)
    // ========================

    async linkBugsToTestCase(suiteId, testCaseId, bugIds, sprintId = null) {
        const userId = this.assetService.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to link bugs' } };
        }

        if (!bugIds?.length) {
            return { success: false, error: { message: 'Bug IDs are required' } };
        }

        // Validate bugIds format
        if (!Array.isArray(bugIds) || bugIds.some(id => !id || typeof id !== 'string')) {
            return { success: false, error: { message: 'Invalid bug IDs format' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                const testCasePath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/testCases/${testCaseId}`
                    : `testSuites/${suiteId}/testCases/${testCaseId}`;
                
                const testCaseRef = doc(db, testCasePath);
                const testCaseDoc = await transaction.get(testCaseRef);
                
                if (!testCaseDoc.exists()) {
                    throw new Error('Test case not found');
                }

                const testCaseData = testCaseDoc.data();
                const existingLinks = testCaseData.linkedBugs || [];
                const newBugIds = bugIds.filter(bugId => !existingLinks.includes(bugId));

                if (newBugIds.length === 0) {
                    return { alreadyLinked: true, skippedCount: bugIds.length };
                }

                // Verify all bugs exist before linking
                const bugVerificationPromises = newBugIds.map(async (bugId) => {
                    const bugPath = sprintId
                        ? `testSuites/${suiteId}/sprints/${sprintId}/bugs/${bugId}`
                        : `testSuites/${suiteId}/bugs/${bugId}`;
                    
                    const bugRef = doc(db, bugPath);
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
                    updated_by: userId
                });

                // Update each bug's linkedTestCases
                for (const bugId of newBugIds) {
                    const bugPath = sprintId
                        ? `testSuites/${suiteId}/sprints/${sprintId}/bugs/${bugId}`
                        : `testSuites/${suiteId}/bugs/${bugId}`;
                    
                    const bugRef = doc(db, bugPath);
                    transaction.update(bugRef, {
                        linkedTestCases: arrayUnion(testCaseId),
                        updated_at: serverTimestamp(),
                        updated_by: userId
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
    }

    // ========================
    // RETRIEVAL METHODS FOR CROSS-REFERENCES
    // ========================

    async getLinkedTestCasesForBug(suiteId, bugId, sprintId = null) {
        const bugResult = await this.getBug(bugId, suiteId, sprintId);
        if (!bugResult.success) {
            return { success: false, error: { message: 'Bug not found' } };
        }

        const linkedTestCaseIds = bugResult.data.linkedTestCases || [];
        if (linkedTestCaseIds.length === 0) {
            return { success: true, data: [], count: 0 };
        }

        try {
            const testCaseDetails = await Promise.all(
                linkedTestCaseIds.map(async (testCaseId) => {
                    const testCaseResult = await this.assetService.getTestCase(testCaseId, suiteId, sprintId);
                    return testCaseResult.success ? { ...testCaseResult.data, id: testCaseId } : null;
                })
            );

            const validTestCases = testCaseDetails.filter(tc => tc !== null);
            return {
                success: true,
                data: validTestCases,
                count: validTestCases.length,
                requestedCount: linkedTestCaseIds.length
            };
        } catch (error) {
            console.error('getLinkedTestCasesForBug error:', {
                suiteId,
                bugId,
                errorCode: error.code,
                errorMessage: error.message,
            });
            return { success: false, error: { message: error.message || 'Failed to get linked test cases' } };
        }
    }

    async getLinkedBugsForTestCase(suiteId, testCaseId, sprintId = null) {
        const testCaseResult = await this.assetService.getTestCase(testCaseId, suiteId, sprintId);
        if (!testCaseResult.success) {
            return { success: false, error: { message: 'Test case not found' } };
        }

        const linkedBugIds = testCaseResult.data.linkedBugs || [];
        if (linkedBugIds.length === 0) {
            return { success: true, data: [], count: 0 };
        }

        try {
            const bugDetails = await Promise.all(
                linkedBugIds.map(async (bugId) => {
                    const bugResult = await this.getBug(bugId, suiteId, sprintId);
                    return bugResult.success ? { ...bugResult.data, id: bugId } : null;
                })
            );

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
    }

    // ========================
    // UTILITY METHODS
    // ========================

    async getAvailableTestCasesForLinking(suiteId, bugId, sprintId = null) {
        const bugResult = await this.getBug(bugId, suiteId, sprintId);
        if (!bugResult.success) {
            return { success: false, error: { message: 'Bug not found' } };
        }

        const linkedTestCases = bugResult.data.linkedTestCases || [];
        const testCasesResult = await this.assetService.getTestCases(suiteId, sprintId);
        
        if (!testCasesResult.success) {
            return { success: false, error: { message: 'Failed to fetch test cases' } };
        }

        const availableTestCases = testCasesResult.data.filter(tc => !linkedTestCases.includes(tc.id));
        
        return {
            success: true,
            data: availableTestCases,
            totalTestCases: testCasesResult.data.length,
            availableCount: availableTestCases.length,
            linkedCount: linkedTestCases.length
        };
    }

    async getAvailableBugsForLinking(suiteId, testCaseId, sprintId = null) {
        const testCaseResult = await this.assetService.getTestCase(testCaseId, suiteId, sprintId);
        if (!testCaseResult.success) {
            return { success: false, error: { message: 'Test case not found' } };
        }

        const linkedBugs = testCaseResult.data.linkedBugs || [];
        const bugsResult = await this.getBugs(suiteId, sprintId);
        
        if (!bugsResult.success) {
            return { success: false, error: { message: 'Failed to fetch bugs' } };
        }

        const availableBugs = bugsResult.data.filter(bug => !linkedBugs.includes(bug.id));
        
        return {
            success: true,
            data: availableBugs,
            totalBugs: bugsResult.data.length,
            availableCount: availableBugs.length,
            linkedCount: linkedBugs.length
        };
    }

    // ========================
    // BULK OPERATIONS
    // ========================

    async bulkLinkTestCasesToBugs(suiteId, bugIds, testCaseIds, sprintId = null) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const bugId of bugIds) {
            try {
                const result = await this.linkTestCasesToBug(suiteId, bugId, testCaseIds, sprintId);
                results.push({ bugId, result });
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({ bugId, result: { success: false, error: { message: error.message } } });
                failureCount++;
            }
        }

        return {
            success: successCount > 0,
            results,
            summary: {
                successCount,
                failureCount,
                totalProcessed: bugIds.length
            }
        };
    }

    async bulkLinkBugsToTestCases(suiteId, testCaseIds, bugIds, sprintId = null) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const testCaseId of testCaseIds) {
            try {
                const result = await this.linkBugsToTestCase(suiteId, testCaseId, bugIds, sprintId);
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

export default bugService;