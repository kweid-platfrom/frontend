import { getAccountSetupStatus, setupAccount } from "./accountSetup";
import firestoreService from "./firestoreService";
import { suiteService } from "./suiteService"; // Import suiteService

/**
 * Get complete account information
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<Object>} Complete account info result
 */
export const getCompleteAccountInfo = async (userId = null) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const result = await firestoreService.getUserProfile(targetUserId);
        if (!result.success) {
            return result;
        }

        const userProfile = result.data;
        
        let organizations = [];
        if (userProfile.accountType === 'organization' && userProfile.organizationId) {
            const orgResult = await firestoreService.getDocument('organizations', userProfile.organizationId);
            if (orgResult.success) {
                organizations = [{ id: userProfile.organizationId, ...orgResult.data }];
            }
        }

        return {
            success: true,
            data: {
                userProfile,
                organizations,
                accountType: userProfile.accountType || 'individual'
            }
        };
    } catch (error) {
        console.error('Error getting complete account info:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update result
 */
export const updateUserProfile = async (userId, updateData) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const result = await firestoreService.updateUserProfile(targetUserId, updateData);
        return result;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Delete user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteUserAccount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return { success: false, error: { message: 'Account deletion not implemented yet' } };
    } catch (error) {
        console.error('Error deleting user account:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Determine account type based on email domain
 * @param {string} email - User email
 * @returns {string} Account type ('individual' or 'organization')
 */
export const determineAccountType = (email) => {
    if (!email) return 'individual';
    
    const domain = email.split('@')[1];
    const commonPersonalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'icloud.com', 'aol.com', 'protonmail.com'
    ];
    
    return commonPersonalDomains.includes(domain.toLowerCase()) ? 'individual' : 'organization';
};

/**
 * Get account type from user profile
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<Object>} Account type result
 */
export const getAccountType = async (userId = null) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const result = await firestoreService.getUserProfile(targetUserId);
        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: {
                accountType: result.data.accountType || 'individual',
                userId: targetUserId
            }
        };
    } catch (error) {
        console.error('Error getting account type:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Check if user can create new suite
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canCreateNewSuite = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const capabilitiesResult = await getUserCapabilities(targetUserId);
        if (!capabilitiesResult.success) {
            return { success: false, error: { message: 'Unable to fetch capabilities' } };
        }

        const { maxTestSuites, remaining } = capabilitiesResult.data;
        const canCreate = remaining.testSuites !== 0;

        return {
            success: true,
            data: {
                canCreate,
                message: canCreate ? 
                    `You can create ${remaining.testSuites === -1 ? 'unlimited' : remaining.testSuites} more suites` : 
                    `Suite limit of ${maxTestSuites} reached`
            }
        };
    } catch (error) {
        console.error('Error checking suite creation permission:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Alias for canCreateNewSuite
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canCreateNewTestSuite = async (userId) => {
    return await canCreateNewSuite(userId);
};

/**
 * Check if user can invite team members
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canInviteTeamMembers = async (userId) => {
    try {
        const accountInfo = await getCompleteAccountInfo(userId);
        if (!accountInfo.success) {
            return accountInfo;
        }

        const canInvite = accountInfo.data.accountType === 'organization';

        return {
            success: true,
            data: {
                canInvite,
                message: canInvite ? 'Team member invitation allowed' : 'Team invitations only available for organization accounts'
            }
        };
    } catch (error) {
        console.error('Error checking team invitation permission:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get organization member count
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Member count result
 */
export const getOrganizationMemberCount = async (organizationId) => {
    try {
        if (!organizationId) {
            return { success: false, error: { message: 'Organization ID required' } };
        }

        const result = await firestoreService.queryDocuments(`organizations/${organizationId}/members`);
        if (!result.success) {
            return result;
        }

        return {
            success: true,
            data: {
                count: result.data.length,
                members: result.data
            }
        };
    } catch (error) {
        console.error('Error getting organization member count:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get user's suite count
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Suite count result
 */
export const getUserSuiteCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const result = await suiteService.getUserSuites(targetUserId); // Use suiteService
        return {
            success: true,
            data: {
                count: result.suites.length,
                suites: result.suites,
                message: 'Suite count retrieved'
            }
        };
    } catch (error) {
        console.error('Error getting user suite count:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Alias for getUserSuiteCount
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Test suite count result
 */
export const getUserTestSuiteCount = async (userId) => {
    return await getUserSuiteCount(userId);
};

/**
 * Get user's usage statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Usage stats result
 */
export const getUserUsageStats = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const accountInfo = await getCompleteAccountInfo(targetUserId);
        if (!accountInfo.success) {
            return accountInfo;
        }

        const suitesResult = await getUserSuiteCount(targetUserId);
        const suitesCount = suitesResult.success ? suitesResult.data.count : 0;

        let totalMembersCount = 0;
        if (accountInfo.data.organizations && accountInfo.data.organizations.length > 0) {
            for (const org of accountInfo.data.organizations) {
                const memberResult = await getOrganizationMemberCount(org.id);
                if (memberResult.success) {
                    totalMembersCount += memberResult.data.count;
                }
            }
        }

        return {
            success: true,
            data: {
                accountType: accountInfo.data.accountType,
                organizationCount: accountInfo.data.organizations.length,
                totalMembersCount,
                testSuitesCount: suitesCount,
                isActive: accountInfo.data.userProfile.isActive,
                emailVerified: accountInfo.data.userProfile.emailVerified,
                createdAt: accountInfo.data.userProfile.created_at,
                lastUpdated: accountInfo.data.userProfile.updated_at,
                message: 'Usage statistics retrieved'
            }
        };
    } catch (error) {
        console.error('Error getting user usage stats:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get user's test script count from suite assets
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Test script count result
 */
export const getUserTestScriptCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const suitesResult = await suiteService.getUserSuites(targetUserId);
        if (!suitesResult.success) {
            return suitesResult;
        }

        let totalScriptCount = 0;
        const suites = suitesResult.suites;

        for (const suite of suites) {
            const scriptsResult = await firestoreService.getSuiteAssets(suite.suite_id, 'automatedScripts');
            if (scriptsResult.success) {
                totalScriptCount += scriptsResult.data.length;
            }
        }

        return {
            success: true,
            data: {
                count: totalScriptCount,
                message: 'Test script count retrieved'
            }
        };
    } catch (error) {
        console.error('Error getting user test script count:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get user's automated test count from suite assets
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Automated test count result
 */
export const getUserAutomatedTestCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const suitesResult = await suiteService.getUserSuites(targetUserId);
        if (!suitesResult.success) {
            return suitesResult;
        }

        let totalAutomatedTestCount = 0;
        const suites = suitesResult.suites;

        for (const suite of suites) {
            const testCasesResult = await firestoreService.getSuiteAssets(suite.suite_id, 'testCases');
            if (testCasesResult.success) {
                const automatedTests = testCasesResult.data.filter(testCase => testCase.isAutomated === true);
                totalAutomatedTestCount += automatedTests.length;
            }
        }

        return {
            success: true,
            data: {
                count: totalAutomatedTestCount,
                message: 'Automated test count retrieved'
            }
        };
    } catch (error) {
        console.error('Error getting user automated test count:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get user's recording count from suite assets
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Recording count result
 */
export const getUserRecordingCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const suitesResult = await suiteService.getUserSuites(targetUserId);
        if (!suitesResult.success) {
            return suitesResult;
        }

        let totalRecordingCount = 0;
        const suites = suitesResult.suites;

        for (const suite of suites) {
            const recordingsResult = await firestoreService.getSuiteAssets(suite.suite_id, 'recordings');
            if (recordingsResult.success) {
                totalRecordingCount += recordingsResult.data.length;
            }
        }

        return {
            success: true,
            data: {
                count: totalRecordingCount,
                message: 'Recording count retrieved'
            }
        };
    } catch (error) {
        console.error('Error getting user recording count:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Check if user can create new test script
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canCreateNewTestScript = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const user = firestoreService.getCurrentUser();
        if (!user) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return {
            success: true,
            data: {
                canCreate: true,
                message: 'Test script creation allowed'
            }
        };
    } catch (error) {
        console.error('Error checking test script creation permission:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Check if user can create new automated test
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canCreateNewAutomatedTest = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const user = firestoreService.getCurrentUser();
        if (!user) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return {
            success: true,
            data: {
                canCreate: true,
                message: 'Automated test creation allowed'
            }
        };
    } catch (error) {
        console.error('Error checking automated test creation permission:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Check if user can create new recording
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canCreateNewRecording = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const user = firestoreService.getCurrentUser();
        if (!user) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return {
            success: true,
            data: {
                canCreate: true,
                message: 'Recording creation allowed'
            }
        };
    } catch (error) {
        console.error('Error checking recording creation permission:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Check if user can export report
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Permission result
 */
export const canExportReport = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const user = firestoreService.getCurrentUser();
        if (!user) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return {
            success: true,
            data: {
                canExport: true,
                message: 'Report export allowed'
            }
        };
    } catch (error) {
        console.error('Error checking report export permission:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get user's monthly export count (placeholder)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Monthly export count result
 */
export const getUserMonthlyExportCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return {
            success: true,
            data: {
                count: 0,
                message: 'Monthly export count retrieved (placeholder)'
            }
        };
    } catch (error) {
        console.error('Error getting user monthly export count:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get user capabilities based on account type and current usage
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User capabilities result
 */
export const getUserCapabilities = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const accountInfo = await getCompleteAccountInfo(targetUserId);
        if (!accountInfo.success) {
            return accountInfo;
        }

        const accountType = accountInfo.data.accountType || 'individual';
        const defaultCapabilities = getDefaultCapabilities(accountType).data;

        const usageStats = await getUserUsageStats(targetUserId);
        const currentUsage = usageStats.success ? usageStats.data : {};

        const capabilities = {
            ...defaultCapabilities,
            currentUsage: {
                testSuites: currentUsage.testSuitesCount || 0,
                testScripts: 0,
                automatedTests: 0,
                recordings: 0,
                monthlyExports: 0,
                teamMembers: currentUsage.totalMembersCount || 0,
                organizations: currentUsage.organizationCount || 0
            }
        };

        const [scriptsResult, automatedTestsResult, recordingsResult, exportsResult] = await Promise.all([
            getUserTestScriptCount(targetUserId),
            getUserAutomatedTestCount(targetUserId),
            getUserRecordingCount(targetUserId),
            getUserMonthlyExportCount(targetUserId)
        ]);

        if (scriptsResult.success) {
            capabilities.currentUsage.testScripts = scriptsResult.data.count;
        }
        if (automatedTestsResult.success) {
            capabilities.currentUsage.automatedTests = automatedTestsResult.data.count;
        }
        if (recordingsResult.success) {
            capabilities.currentUsage.recordings = recordingsResult.data.count;
        }
        if (exportsResult.success) {
            capabilities.currentUsage.monthlyExports = exportsResult.data.count;
        }

        capabilities.remaining = {
            testSuites: Math.max(0, capabilities.maxTestSuites - capabilities.currentUsage.testSuites),
            testScripts: Math.max(0, capabilities.maxTestScripts - capabilities.currentUsage.testScripts),
            automatedTests: Math.max(0, capabilities.maxAutomatedTests - capabilities.currentUsage.automatedTests),
            recordings: Math.max(0, capabilities.maxRecordings - capabilities.currentUsage.recordings),
            monthlyExports: Math.max(0, capabilities.maxMonthlyExports - capabilities.currentUsage.monthlyExports),
            teamMembers: Math.max(0, capabilities.maxTeamMembers - capabilities.currentUsage.teamMembers)
        };

        capabilities.usagePercentage = {
            testSuites: Math.round((capabilities.currentUsage.testSuites / capabilities.maxTestSuites) * 100),
            testScripts: Math.round((capabilities.currentUsage.testScripts / capabilities.maxTestScripts) * 100),
            automatedTests: Math.round((capabilities.currentUsage.automatedTests / capabilities.maxAutomatedTests) * 100),
            recordings: Math.round((capabilities.currentUsage.recordings / capabilities.maxRecordings) * 100),
            monthlyExports: Math.round((capabilities.currentUsage.monthlyExports / capabilities.maxMonthlyExports) * 100),
            teamMembers: Math.round((capabilities.currentUsage.teamMembers / capabilities.maxTeamMembers) * 100)
        };

        return { success: true, data: capabilities };
    } catch (error) {
        console.error('Error getting user capabilities:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Get default capabilities based on account type
 * @param {string} accountType - Account type ('individual' or 'organization')
 * @returns {Object} Default capabilities object
 */
export const getDefaultCapabilities = (accountType = 'individual') => {
    const baseCapabilities = {
        maxSuites: accountType === 'individual' ? 5 : 50,
        maxTestSuites: accountType === 'individual' ? 5 : 50,
        maxTestScripts: accountType === 'individual' ? 20 : 500,
        maxAutomatedTests: accountType === 'individual' ? 10 : 200,
        maxRecordings: accountType === 'individual' ? 10 : 100,
        maxMonthlyExports: accountType === 'individual' ? 5 : 50,
        canInviteTeamMembers: accountType === 'organization',
        maxTeamMembers: accountType === 'individual' ? 1 : 25,
        canExportReports: true,
        canCreateAutomatedTests: true,
        canCreateRecordings: true,
        canCreateTestScripts: true,
        maxStorageGB: accountType === 'individual' ? 1 : 10,
        supportLevel: accountType === 'individual' ? 'community' : 'email'
    };

    return { success: true, data: baseCapabilities };
};

const accountService = {
    getAccountSetupStatus,
    getAccountType,
    setupAccount,
    getCompleteAccountInfo,
    updateUserProfile,
    deleteUserAccount,
    determineAccountType,
    canCreateNewSuite,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    getUserSuiteCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount,
    getUserTestScriptCount,
    getUserAutomatedTestCount,
    getUserRecordingCount,
    getUserMonthlyExportCount,
    getUserUsageStats,
    getUserCapabilities,
    getDefaultCapabilities
};

export default accountService;

export {
    getAccountSetupStatus,
    setupAccount,
    getCompleteAccountInfo,
    updateUserProfile,
    deleteUserAccount,
    getAccountType,
    determineAccountType,
    canCreateNewSuite,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    getUserSuiteCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount,
    getUserTestScriptCount,
    getUserAutomatedTestCount,
    getUserRecordingCount,
    getUserMonthlyExportCount,
    getUserUsageStats,
    getUserCapabilities,
    getDefaultCapabilities
};