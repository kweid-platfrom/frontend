// services/accountLimits.js - Account limits and usage checking operations
import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getUserCapabilities } from "../config/subscriptionPlans";

/**
 * Check if user can create a new suite with proper trial support
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewSuite = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const suiteLimit = capabilities.limits.suites;

        console.log('Suite creation check:', {
            userId: capabilities.userId,
            suiteLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName
        });

        // Unlimited suites
        if (suiteLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current suites - FIXED: Use correct collection name from security rules
        const currentCount = await getUserSuiteCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < suiteLimit,
            currentCount,
            maxAllowed: suiteLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message
        };
    }
};

/**
 * Get current suite count for user - FIXED: Use correct collection name
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserSuiteCount = async (userId) => {
    try {
        if (!userId) return 0;

        // FIXED: Use 'testSuites' collection name as expected by security rules
        const suitesRef = collection(db, 'testSuites');
        const q = query(
            suitesRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user suite count:', error);
        return 0;
    }
};

/**
 * Check if user can create a new test suite with proper trial support
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewTestSuite = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const suiteLimit = capabilities.limits.suites;

        // Unlimited test suites
        if (suiteLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current test suites
        const currentCount = await getUserTestSuiteCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < suiteLimit,
            currentCount,
            maxAllowed: suiteLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking test suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message
        };
    }
};

/**
 * Get current test suite count for user - FIXED: Use correct collection name
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUserTestSuiteCount = async (userId) => {
    try {
        if (!userId) return 0;

        // FIXED: Use 'testSuites' collection name as expected by security rules
        const suitesRef = collection(db, 'testSuites');
        const q = query(
            suitesRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user test suite count:', error);
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
        const capabilities = getUserCapabilities(userProfile);

        // Individual accounts cannot invite team members
        if (capabilities.accountType === 'individual') {
            return {
                canInvite: false,
                reason: 'individual_account',
                currentCount: 1,
                maxAllowed: 1
            };
        }

        const memberLimit = capabilities.limits.team_members;

        // Unlimited team members
        if (memberLimit === -1) {
            return {
                canInvite: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count current team members
        const currentCount = await getOrganizationMemberCount(userProfile.organizationId);

        return {
            canInvite: currentCount < memberLimit,
            currentCount,
            maxAllowed: memberLimit,
            isTrialActive: capabilities.isTrialActive,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking team invitation capability:', error);
        return {
            canInvite: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message
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

        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('organizationId', '==', organizationId),
            where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting organization member count:', error);
        return 1;
    }
};

/**
 * Check if user can create new test scripts
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewTestScript = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const scriptLimit = capabilities.limits.test_scripts;

        // Unlimited test scripts
        if (scriptLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current test scripts
        const currentCount = await getUserTestScriptCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < scriptLimit,
            currentCount,
            maxAllowed: scriptLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking test script creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 25,
            isTrialActive: false,
            unlimited: false,
            error: error.message
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

        const scriptsRef = collection(db, 'testScripts');
        const q = query(
            scriptsRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user test script count:', error);
        return 0;
    }
};

/**
 * Check if user can create new automated tests
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewAutomatedTest = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const testLimit = capabilities.limits.automated_tests;

        // Unlimited automated tests
        if (testLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current automated tests
        const currentCount = await getUserAutomatedTestCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < testLimit,
            currentCount,
            maxAllowed: testLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking automated test creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 10,
            isTrialActive: false,
            unlimited: false,
            error: error.message
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

        const testsRef = collection(db, 'automatedTests');
        const q = query(
            testsRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user automated test count:', error);
        return 0;
    }
};

/**
 * Check if user can create new recordings
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
export const canCreateNewRecording = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const recordingLimit = capabilities.limits.recordings;

        // Unlimited recordings
        if (recordingLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current recordings
        const currentCount = await getUserRecordingCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < recordingLimit,
            currentCount,
            maxAllowed: recordingLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking recording creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 5,
            isTrialActive: false,
            unlimited: false,
            error: error.message
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

        const recordingsRef = collection(db, 'recordings');
        const q = query(
            recordingsRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

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
        const capabilities = getUserCapabilities(userProfile);
        const exportLimit = capabilities.limits.report_exports;

        // Unlimited exports
        if (exportLimit === -1) {
            return {
                canExport: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current monthly exports
        const currentCount = await getUserMonthlyExportCount(userProfile.uid || userProfile.user_id);

        return {
            canExport: currentCount < exportLimit,
            currentCount,
            maxAllowed: exportLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking report export capability:', error);
        return {
            canExport: false,
            currentCount: 0,
            maxAllowed: 2,
            isTrialActive: false,
            unlimited: false,
            error: error.message
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

        // Get start of current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const exportsRef = collection(db, 'reportExports');
        const q = query(
            exportsRef,
            where('ownerId', '==', userId),
            where('createdAt', '>=', monthStart)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user monthly export count:', error);
        return 0;
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
        const capabilities = getUserCapabilities(userProfile);

        // Get all counts in parallel
        const [
            suiteCount,
            testScriptCount,
            automatedTestCount,
            recordingCount,
            monthlyExportCount
        ] = await Promise.all([
            getUserSuiteCount(userId),
            getUserTestScriptCount(userId),
            getUserAutomatedTestCount(userId),
            getUserRecordingCount(userId),
            getUserMonthlyExportCount(userId)
        ]);

        const organizationMemberCount = capabilities.accountType === 'organization' ? 
            await getOrganizationMemberCount(userProfile.organizationId) : 1;

        return {
            capabilities,
            usage: {
                suites: {
                    current: suiteCount,
                    limit: capabilities.limits.suites,
                    unlimited: capabilities.limits.suites === -1,
                    percentage: capabilities.limits.suites === -1 ? 0 : (suiteCount / capabilities.limits.suites) * 100
                },
                testScripts: {
                    current: testScriptCount,
                    limit: capabilities.limits.test_scripts,
                    unlimited: capabilities.limits.test_scripts === -1,
                    percentage: capabilities.limits.test_scripts === -1 ? 0 : (testScriptCount / capabilities.limits.test_scripts) * 100
                },
                automatedTests: {
                    current: automatedTestCount,
                    limit: capabilities.limits.automated_tests,
                    unlimited: capabilities.limits.automated_tests === -1,
                    percentage: capabilities.limits.automated_tests === -1 ? 0 : (automatedTestCount / capabilities.limits.automated_tests) * 100
                },
                recordings: {
                    current: recordingCount,
                    limit: capabilities.limits.recordings,
                    unlimited: capabilities.limits.recordings === -1,
                    percentage: capabilities.limits.recordings === -1 ? 0 : (recordingCount / capabilities.limits.recordings) * 100
                },
                reportExports: {
                    current: monthlyExportCount,
                    limit: capabilities.limits.report_exports,
                    unlimited: capabilities.limits.report_exports === -1,
                    percentage: capabilities.limits.report_exports === -1 ? 0 : (monthlyExportCount / capabilities.limits.report_exports) * 100,
                    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) // Next month
                },
                teamMembers: {
                    current: organizationMemberCount,
                    limit: capabilities.limits.team_members,
                    unlimited: capabilities.limits.team_members === -1,
                    percentage: capabilities.limits.team_members === -1 ? 0 : (organizationMemberCount / capabilities.limits.team_members) * 100
                }
            }
        };

    } catch (error) {
        console.error('Error getting user usage stats:', error);
        return {
            capabilities: getUserCapabilities(userProfile),
            usage: {},
            error: error.message
        };
    }
};