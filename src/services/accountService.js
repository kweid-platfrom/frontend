import firestoreService from './firestoreService';
import { canCreateNewSuite, canInviteTeamMembers, getUserUsageStats } from './accountLimits';
import subscriptionService from './subscriptionService';

export const getCompleteAccountInfo = async (userId = null) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const result = await firestoreService.getUserProfile(targetUserId);
        if (!result.success) {
            return { success: false, error: { message: result.error.message, code: result.error.code } };
        }

        const userProfile = result.data;
        let organizations = [];
        if (userProfile.account_memberships?.some(m => m.account_type === 'organization')) {
            const orgId = userProfile.account_memberships.find(m => m.account_type === 'organization')?.account_id;
            if (orgId) {
                const orgResult = await firestoreService.getDocument('organizations', orgId);
                if (orgResult.success) {
                    organizations = [{ id: orgId, ...orgResult.data }];
                }
            }
        }

        return {
            success: true,
            data: {
                userProfile,
                organizations,
                accountType: userProfile.account_memberships?.[0]?.account_type || 'individual',
            },
        };
    } catch (error) {
        console.error('Error getting complete account info:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const updateUserProfile = async (userId, updateData) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const result = await firestoreService.updateUserProfile(targetUserId, updateData);
        if (!result.success) {
            return { success: false, error: { message: result.error.message, code: result.error.code } };
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error updating user profile:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const deleteUserAccount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        return { success: false, error: { message: 'Account deletion not implemented yet', code: 'NOT_IMPLEMENTED' } };
    } catch (error) {
        console.error('Error deleting user account:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const determineAccountType = (email) => {
    if (!email) return 'individual';
    const domain = email.split('@')[1];
    const commonPersonalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com',
    ];
    return commonPersonalDomains.includes(domain.toLowerCase()) ? 'individual' : 'organization';
};

export const getAccountType = async (userId = null) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const result = await firestoreService.getUserProfile(targetUserId);
        if (!result.success) {
            return { success: false, error: { message: result.error.message, code: result.error.code } };
        }

        return {
            success: true,
            data: {
                accountType: result.data.account_memberships?.[0]?.account_type || 'individual',
                userId: targetUserId,
            },
        };
    } catch (error) {
        console.error('Error getting account type:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserCapabilities = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const accountInfo = await getCompleteAccountInfo(targetUserId);
        if (!accountInfo.success) {
            return { success: false, error: { message: accountInfo.error.message, code: accountInfo.error.code } };
        }

        const { userProfile } = accountInfo.data;
        const subscription = await subscriptionService.getSubscription(targetUserId);
        if (!subscription.success) {
            return { success: false, error: { message: subscription.error.message, code: subscription.error.code } };
        }

        const usageStats = await getUserUsageStats(userProfile);
        if (!usageStats.success) {
            return { success: false, error: { message: usageStats.error.message, code: usageStats.error.code } };
        }

        const limits = subscriptionService.getPlanLimits(userProfile.subscriptionPlan, userProfile.accountType);
        const { usage } = usageStats;

        const capabilities = {
            ...limits,
            canCreateSuites: usage.suites.current < limits.maxTestSuites || limits.maxTestSuites === -1,
            canCreateTestScripts: usage.testScripts.current < limits.maxTestScripts || limits.maxTestScripts === -1,
            canCreateAutomatedTests: usage.automatedTests.current < limits.maxAutomatedTests || limits.maxAutomatedTests === -1,
            canCreateRecordings: usage.recordings.current < limits.maxRecordings || limits.maxRecordings === -1,
            canExportReports: usage.reportExports.current < limits.maxMonthlyExports || limits.maxMonthlyExports === -1,
            canInviteTeamMembers: userProfile.accountType === 'organization' && 
                                 (usage.teamMembers.current < limits.maxTeamMembers || limits.maxTeamMembers === -1),
            currentUsage: {
                testSuites: usage.suites.current,
                testScripts: usage.testScripts.current,
                automatedTests: usage.automatedTests.current,
                recordings: usage.recordings.current,
                monthlyExports: usage.reportExports.current,
                teamMembers: usage.teamMembers.current,
            },
            remaining: {
                testSuites: limits.maxTestSuites === -1 ? -1 : Math.max(0, limits.maxTestSuites - usage.suites.current),
                testScripts: limits.maxTestScripts === -1 ? -1 : Math.max(0, limits.maxTestScripts - usage.testScripts.current),
                automatedTests: limits.maxAutomatedTests === -1 ? -1 : Math.max(0, limits.maxAutomatedTests - usage.automatedTests.current),
                recordings: limits.maxRecordings === -1 ? -1 : Math.max(0, limits.maxRecordings - usage.recordings.current),
                monthlyExports: limits.maxMonthlyExports === -1 ? -1 : Math.max(0, limits.maxMonthlyExports - usage.reportExports.current),
                teamMembers: limits.maxTeamMembers === -1 ? -1 : Math.max(0, limits.maxTeamMembers - usage.teamMembers.current),
            },
            usagePercentage: {
                testSuites: limits.maxTestSuites > 0 ? Math.round((usage.suites.current / limits.maxTestSuites) * 100) : 0,
                testScripts: limits.maxTestScripts > 0 ? Math.round((usage.testScripts.current / limits.maxTestScripts) * 100) : 0,
                automatedTests: limits.maxAutomatedTests > 0 ? Math.round((usage.automatedTests.current / limits.maxAutomatedTests) * 100) : 0,
                recordings: limits.maxRecordings > 0 ? Math.round((usage.recordings.current / limits.maxRecordings) * 100) : 0,
                monthlyExports: limits.maxMonthlyExports > 0 ? Math.round((usage.reportExports.current / limits.maxMonthlyExports) * 100) : 0,
                teamMembers: limits.maxTeamMembers > 0 ? Math.round((usage.teamMembers.current / limits.maxTeamMembers) * 100) : 0,
            },
            subscriptionStatus: subscription.data.subscriptionStatus,
            isTrialActive: subscription.data.isTrialActive,
            accountType: userProfile.accountType,
        };

        return { success: true, data: capabilities };
    } catch (error) {
        console.error('Error getting user capabilities:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

const accountService = {
    getCompleteAccountInfo,
    updateUserProfile,
    deleteUserAccount,
    determineAccountType,
    getAccountType,
    getUserCapabilities,
    canCreateNewSuite,
    canInviteTeamMembers,
    getUserUsageStats,
};

export default accountService;