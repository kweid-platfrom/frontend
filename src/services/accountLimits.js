import { where } from "firebase/firestore";
import firestoreService from "./firestoreService";
import subscriptionService from "./subscriptionService";

/**
 * Check if user can create a new suite
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewSuite = async (userProfile) => {
    try {
        const userId = userProfile.uid || userProfile.user_id;
        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const suiteLimit = limits.maxTestSuites;

        // Unlimited suites
        if (suiteLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: userProfile.isTrialActive || false,
                unlimited: true,
            };
        }

        // Count user's current suites
        const currentCount = await getUserSuiteCount(userId);

        return {
            canCreate: currentCount < suiteLimit,
            currentCount,
            maxAllowed: suiteLimit,
            isTrialActive: userProfile.isTrialActive || false,
            unlimited: false,
        };
    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message,
        };
    }
};

/**
 * Get current suite count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserSuiteCount = async (userId) => {
    try {
        if (!userId) return 0;

        const result = await firestoreService.queryDocuments(
            'testSuites',
            [
                where('ownerId', '==', userId),
                where('isDeleted', '!=', true),
            ]
        );

        return result.success ? result.data.length : 0;
    } catch (error) {
        console.error('Error getting user suite count:', error);
        return 0;
    }
};

/**
 * Check if user can create a new test script
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewTestScript = async (userProfile) => {
    try {
        const userId = userProfile.uid || userProfile.user_id;
        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const scriptLimit = limits.maxTestScripts;

        // Unlimited test scripts
        if (scriptLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: userProfile.isTrialActive || false,
                unlimited: true,
            };
        }

        // Count user's current test scripts
        const currentCount = await getUserTestScriptCount(userId);

        return {
            canCreate: currentCount < scriptLimit,
            currentCount,
            maxAllowed: scriptLimit,
            isTrialActive: userProfile.isTrialActive || false,
            unlimited: false,
        };
    } catch (error) {
        console.error('Error checking test script creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 25,
            isTrialActive: false,
            unlimited: false,
            error: error.message,
        };
    }
};

/**
 * Get current test script count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserTestScriptCount = async (userId) => {
    try {
        if (!userId) return 0;

        const result = await firestoreService.queryDocuments(
            'testScripts',
            [
                where('ownerId', '==', userId),
                where('isDeleted', '!=', true),
            ]
        );

        return result.success ? result.data.length : 0;
    } catch (error) {
        console.error('Error getting user test script count:', error);
        return 0;
    }
};

/**
 * Check if user can create a new automated test
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewAutomatedTest = async (userProfile) => {
    try {
        const userId = userProfile.uid || userProfile.user_id;
        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const testLimit = limits.maxAutomatedTests;

        // Unlimited automated tests
        if (testLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: userProfile.isTrialActive || false,
                unlimited: true,
            };
        }

        // Count user's current automated tests
        const currentCount = await getUserAutomatedTestCount(userId);

        return {
            canCreate: currentCount < testLimit,
            currentCount,
            maxAllowed: testLimit,
            isTrialActive: userProfile.isTrialActive || false,
            unlimited: false,
        };
    } catch (error) {
        console.error('Error checking automated test creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 10,
            isTrialActive: false,
            unlimited: false,
            error: error.message,
        };
    }
};

/**
 * Get current automated test count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserAutomatedTestCount = async (userId) => {
    try {
        if (!userId) return 0;

        const result = await firestoreService.queryDocuments(
            'automatedTests',
            [
                where('ownerId', '==', userId),
                where('isDeleted', '!=', true),
            ]
        );

        return result.success ? result.data.length : 0;
    } catch (error) {
        console.error('Error getting user automated test count:', error);
        return 0;
    }
};

/**
 * Check if user can create a new recording
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewRecording = async (userProfile) => {
    try {
        const userId = userProfile.uid || userProfile.user_id;
        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const recordingLimit = limits.maxRecordings;

        // Unlimited recordings
        if (recordingLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: userProfile.isTrialActive || false,
                unlimited: true,
            };
        }

        // Count user's current recordings
        const currentCount = await getUserRecordingCount(userId);

        return {
            canCreate: currentCount < recordingLimit,
            currentCount,
            maxAllowed: recordingLimit,
            isTrialActive: userProfile.isTrialActive || false,
            unlimited: false,
        };
    } catch (error) {
        console.error('Error checking recording creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 5,
            isTrialActive: false,
            unlimited: false,
            error: error.message,
        };
    }
};

/**
 * Get current recording count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserRecordingCount = async (userId) => {
    try {
        if (!userId) return 0;

        const result = await firestoreService.queryDocuments(
            'recordings',
            [
                where('ownerId', '==', userId),
                where('isDeleted', '!=', true),
            ]
        );

        return result.success ? result.data.length : 0;
    } catch (error) {
        console.error('Error getting user recording count:', error);
        return 0;
    }
};

/**
 * Check if user can export reports
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can export status and current count
 */
export const canExportReport = async (userProfile) => {
    try {
        const userId = userProfile.uid || userProfile.user_id;
        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const exportLimit = limits.maxMonthlyExports;

        // Unlimited exports
        if (exportLimit === -1) {
            return {
                canExport: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: userProfile.isTrialActive || false,
                unlimited: true,
            };
        }

        // Count user's current monthly exports
        const currentCount = await getUserMonthlyExportCount(userId);

        return {
            canExport: currentCount < exportLimit,
            currentCount,
            maxAllowed: exportLimit,
            isTrialActive: userProfile.isTrialActive || false,
            unlimited: false,
        };
    } catch (error) {
        console.error('Error checking report export capability:', error);
        return {
            canExport: false,
            currentCount: 0,
            maxAllowed: 2,
            isTrialActive: false,
            unlimited: false,
            error: error.message,
        };
    }
};

/**
 * Get current monthly export count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserMonthlyExportCount = async (userId) => {
    try {
        if (!userId) return 0;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const result = await firestoreService.queryDocuments(
            'reportExports',
            [
                where('ownerId', '==', userId),
                where('createdAt', '>=', monthStart),
            ]
        );

        return result.success ? result.data.length : 0;
    } catch (error) {
        console.error('Error getting user monthly export count:', error);
        return 0;
    }
};

/**
 * Check if user can invite team members
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can invite status and current count
 */
export const canInviteTeamMembers = async (userProfile) => {
    try {
        // Individual accounts cannot invite team members
        if (userProfile.accountType === 'individual') {
            return {
                canInvite: false,
                reason: 'individual_account',
                currentCount: 1,
                maxAllowed: 1,
            };
        }

        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const memberLimit = limits.maxTeamMembers;

        // Unlimited team members
        if (memberLimit === -1) {
            return {
                canInvite: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: userProfile.isTrialActive || false,
                unlimited: true,
            };
        }

        // Count current team members
        const currentCount = await getOrganizationMemberCount(userProfile.organizationId);

        return {
            canInvite: currentCount < memberLimit,
            currentCount,
            maxAllowed: memberLimit,
            isTrialActive: userProfile.isTrialActive || false,
            unlimited: false,
        };
    } catch (error) {
        console.error('Error checking team invitation capability:', error);
        return {
            canInvite: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message,
        };
    }
};

/**
 * Get current organization member count
 * @param {string} organizationId 
 * @returns {Promise<number>}
 */
export const getOrganizationMemberCount = async (organizationId) => {
    try {
        if (!organizationId) return 1;

        const result = await firestoreService.queryDocuments(
            'users',
            [
                where('organizationId', '==', organizationId),
                where('isActive', '==', true),
            ]
        );

        return result.success ? result.data.length : 1;
    } catch (error) {
        console.error('Error getting organization member count:', error);
        return 1;
    }
};

/**
 * Get comprehensive usage statistics for user
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Usage statistics
 */
export const getUserUsageStats = async (userProfile) => {
    try {
        const userId = userProfile.uid || userProfile.user_id;
        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);

        // Get all counts in parallel
        const [
            suiteCount,
            testScriptCount,
            automatedTestCount,
            recordingCount,
            monthlyExportCount,
            organizationMemberCount,
        ] = await Promise.all([
            getUserSuiteCount(userId),
            getUserTestScriptCount(userId),
            getUserAutomatedTestCount(userId),
            getUserRecordingCount(userId),
            getUserMonthlyExportCount(userId),
            userProfile.accountType === 'organization' ? getOrganizationMemberCount(userProfile.organizationId) : Promise.resolve(1),
        ]);

        return {
            success: true,
            limits,
            usage: {
                suites: {
                    current: suiteCount,
                    limit: limits.maxTestSuites,
                    unlimited: limits.maxTestSuites === -1,
                    percentage: limits.maxTestSuites === -1 ? 0 : (suiteCount / limits.maxTestSuites) * 100,
                },
                testScripts: {
                    current: testScriptCount,
                    limit: limits.maxTestScripts,
                    unlimited: limits.maxTestScripts === -1,
                    percentage: limits.maxTestScripts === -1 ? 0 : (testScriptCount / limits.maxTestScripts) * 100,
                },
                automatedTests: {
                    current: automatedTestCount,
                    limit: limits.maxAutomatedTests,
                    unlimited: limits.maxAutomatedTests === -1,
                    percentage: limits.maxAutomatedTests === -1 ? 0 : (automatedTestCount / limits.maxAutomatedTests) * 100,
                },
                recordings: {
                    current: recordingCount,
                    limit: limits.maxRecordings,
                    unlimited: limits.maxRecordings === -1,
                    percentage: limits.maxRecordings === -1 ? 0 : (recordingCount / limits.maxRecordings) * 100,
                },
                reportExports: {
                    current: monthlyExportCount,
                    limit: limits.maxMonthlyExports,
                    unlimited: limits.maxMonthlyExports === -1,
                    percentage: limits.maxMonthlyExports === -1 ? 0 : (monthlyExportCount / limits.maxMonthlyExports) * 100,
                    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
                },
                teamMembers: {
                    current: organizationMemberCount,
                    limit: limits.maxTeamMembers,
                    unlimited: limits.maxTeamMembers === -1,
                    percentage: limits.maxTeamMembers === -1 ? 0 : (organizationMemberCount / limits.maxTeamMembers) * 100,
                },
            },
        };
    } catch (error) {
        console.error('Error getting user usage stats:', error);
        return {
            success: false,
            limits: subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType),
            usage: {},
            error: error.message,
        };
    }
};

/**
 * Check multiple limits at once
 * @param {Object} userProfile 
 * @param {Array} checkTypes 
 * @returns {Promise<Object>} Comprehensive limits check result
 */
export const checkMultipleLimits = async (userProfile, checkTypes = ['suites', 'testScripts', 'automatedTests', 'recordings', 'reportExports', 'teamMembers']) => {
    try {
        const results = {};

        if (checkTypes.includes('suites')) {
            results.suites = await canCreateNewSuite(userProfile);
        }
        if (checkTypes.includes('testScripts')) {
            results.testScripts = await canCreateNewTestScript(userProfile);
        }
        if (checkTypes.includes('automatedTests')) {
            results.automatedTests = await canCreateNewAutomatedTest(userProfile);
        }
        if (checkTypes.includes('recordings')) {
            results.recordings = await canCreateNewRecording(userProfile);
        }
        if (checkTypes.includes('reportExports')) {
            results.reportExports = await canExportReport(userProfile);
        }
        if (checkTypes.includes('teamMembers')) {
            results.teamMembers = await canInviteTeamMembers(userProfile);
        }

        return {
            success: true,
            data: results,
            hasAnyLimit: Object.values(results).some(result => !result.canCreate && !result.canExport && !result.canInvite),
        };
    } catch (error) {
        console.error('Error checking multiple limits:', error);
        return {
            success: false,
            error: error.message,
            data: {},
        };
    }
};