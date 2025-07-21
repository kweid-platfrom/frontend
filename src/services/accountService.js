import firestoreService from './firestoreService';
import { getAccountSetupStatus, setupAccount } from './accountSetup';

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

export const canCreateNewSuite = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const { suiteService } = await import('./suiteService');
        const capabilitiesResult = await suiteService.canCreateNewSuite(targetUserId);
        if (!capabilitiesResult.success) {
            return { success: false, error: { message: capabilitiesResult.error.message, code: capabilitiesResult.error.code } };
        }

        return {
            success: true,
            data: {
                canCreate: capabilitiesResult.canCreate,
                message: capabilitiesResult.message,
            },
        };
    } catch (error) {
        console.error('Error checking suite creation permission:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const canCreateNewTestSuite = async (userId) => {
    return await canCreateNewSuite(userId);
};

export const canInviteTeamMembers = async (userId) => {
    try {
        const accountInfo = await getCompleteAccountInfo(userId);
        if (!accountInfo.success) {
            return { success: false, error: { message: accountInfo.error.message, code: accountInfo.error.code } };
        }

        const canInvite = accountInfo.data.accountType === 'organization';

        return {
            success: true,
            data: {
                canInvite,
                message: canInvite ? 'Team member invitation allowed' : 'Team invitations only available for organization accounts',
            },
        };
    } catch (error) {
        console.error('Error checking team invitation permission:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getOrganizationMemberCount = async (organizationId) => {
    try {
        if (!organizationId) {
            return { success: false, error: { message: 'Organization ID required', code: 'INVALID_ORG_ID' } };
        }

        const result = await firestoreService.queryDocuments(`organizations/${organizationId}/members`);
        if (!result.success) {
            return { success: false, error: { message: result.error.message, code: result.error.code } };
        }

        return {
            success: true,
            data: {
                count: result.data.length,
                members: result.data,
            },
        };
    } catch (error) {
        console.error('Error getting organization member count:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserSuiteCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const { suiteService } = await import('./suiteService');
        const result = await suiteService.getUserSuites(targetUserId);
        if (!result.success) {
            return { success: false, error: { message: result.error.message, code: result.error.code } };
        }

        return {
            success: true,
            data: {
                count: result.suites.length,
                suites: result.suites,
                message: 'Suite count retrieved',
            },
        };
    } catch (error) {
        console.error('Error getting user suite count:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserTestSuiteCount = async (userId) => {
    return await getUserSuiteCount(userId);
};

export const getUserUsageStats = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const accountInfo = await getCompleteAccountInfo(targetUserId);
        if (!accountInfo.success) {
            return { success: false, error: { message: accountInfo.error.message, code: accountInfo.error.code } };
        }

        const organizationCount = accountInfo.data.organizations?.length || 0;

        const suiteCountResult = await getUserSuiteCount(targetUserId);
        const testSuitesCount = suiteCountResult.success ? suiteCountResult.data.count : 0;

        const orgMemberCountResult = await getOrganizationMemberCount(accountInfo.data.organizations?.[0]?.id);
        const totalMembersCount = orgMemberCountResult.success ? orgMemberCountResult.data.count : 0;

        return {
            success: true,
            data: {
                organizationCount,
                testSuitesCount,
                totalMembersCount,
                suites: suiteCountResult.success ? suiteCountResult.data.suites : [],
            },
        };
    } catch (error) {
        console.error('Error getting user usage stats:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserTestScriptCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const { suiteService } = await import('./suiteService');
        const suitesResult = await suiteService.getUserSuites(targetUserId);
        if (!suitesResult.success) {
            return { success: false, error: { message: suitesResult.error.message, code: suitesResult.error.code } };
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
                message: 'Test script count retrieved',
            },
        };
    } catch (error) {
        console.error('Error getting user test script count:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserAutomatedTestCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const { suiteService } = await import('./suiteService');
        const suitesResult = await suiteService.getUserSuites(targetUserId);
        if (!suitesResult.success) {
            return { success: false, error: { message: suitesResult.error.message, code: suitesResult.error.code } };
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
                message: 'Automated test count retrieved',
            },
        };
    } catch (error) {
        console.error('Error getting user automated test count:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserRecordingCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        const { suiteService } = await import('./suiteService');
        const suitesResult = await suiteService.getUserSuites(targetUserId);
        if (!suitesResult.success) {
            return { success: false, error: { message: suitesResult.error.message, code: suitesResult.error.code } };
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
                message: 'Recording count retrieved',
            },
        };
    } catch (error) {
        console.error('Error getting user recording count:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const canCreateNewTestScript = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        return {
            success: true,
            data: {
                canCreate: true,
                message: 'Test script creation allowed',
            },
        };
    } catch (error) {
        console.error('Error checking test script creation permission:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const canCreateNewAutomatedTest = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        return {
            success: true,
            data: {
                canCreate: true,
                message: 'Automated test creation allowed',
            },
        };
    } catch (error) {
        console.error('Error checking automated test creation permission:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const canCreateNewRecording = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        return {
            success: true,
            data: {
                canCreate: true,
                message: 'Recording creation allowed',
            },
        };
    } catch (error) {
        console.error('Error checking recording creation permission:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const canExportReport = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        return {
            success: true,
            data: {
                canExport: true,
                message: 'Report export allowed',
            },
        };
    } catch (error) {
        console.error('Error checking report export permission:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getUserMonthlyExportCount = async (userId) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }

        return {
            success: true,
            data: {
                count: 0,
                message: 'Monthly export count retrieved (placeholder)',
            },
        };
    } catch (error) {
        console.error('Error getting user monthly export count:', firestoreService.handleFirestoreError(error));
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

        const accountType = accountInfo.data.accountType || 'individual';
        const defaultCapabilities = getDefaultCapabilities(accountType).data;

        const usageStats = await getUserUsageStats(targetUserId);
        const currentUsage = usageStats.success ? usageStats.data : {};

        const { suiteService } = await import('./suiteService');
        const suiteCapabilities = await suiteService.canCreateNewSuite(targetUserId);

        const capabilities = {
            ...defaultCapabilities,
            maxTestSuites: suiteCapabilities.maxAllowed || defaultCapabilities.maxTestSuites,
            currentUsage: {
                testSuites: currentUsage.testSuitesCount || 0,
                testScripts: 0,
                automatedTests: 0,
                recordings: 0,
                monthlyExports: 0,
                teamMembers: currentUsage.totalMembersCount || 0,
                organizations: currentUsage.organizationCount || 0,
            },
        };

        const [scriptsResult, automatedTestsResult, recordingsResult, exportsResult] = await Promise.all([
            getUserTestScriptCount(targetUserId),
            getUserAutomatedTestCount(targetUserId),
            getUserRecordingCount(targetUserId),
            getUserMonthlyExportCount(targetUserId),
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
            teamMembers: Math.max(0, capabilities.maxTeamMembers - capabilities.currentUsage.teamMembers),
        };

        capabilities.usagePercentage = {
            testSuites: capabilities.maxTestSuites > 0 ? Math.round((capabilities.currentUsage.testSuites / capabilities.maxTestSuites) * 100) : 0,
            testScripts: capabilities.maxTestScripts > 0 ? Math.round((capabilities.currentUsage.testScripts / capabilities.maxTestScripts) * 100) : 0,
            automatedTests: capabilities.maxAutomatedTests > 0 ? Math.round((capabilities.currentUsage.automatedTests / capabilities.maxAutomatedTests) * 100) : 0,
            recordings: capabilities.maxRecordings > 0 ? Math.round((capabilities.currentUsage.recordings / capabilities.maxRecordings) * 100) : 0,
            monthlyExports: capabilities.maxMonthlyExports > 0 ? Math.round((capabilities.currentUsage.monthlyExports / capabilities.maxMonthlyExports) * 100) : 0,
            teamMembers: capabilities.maxTeamMembers > 0 ? Math.round((capabilities.currentUsage.teamMembers / capabilities.maxTeamMembers) * 100) : 0,
        };

        return { success: true, data: capabilities };
    } catch (error) {
        console.error('Error getting user capabilities:', firestoreService.handleFirestoreError(error));
        return { success: false, error: firestoreService.handleFirestoreError(error) };
    }
};

export const getDefaultCapabilities = (accountType = 'individual') => {
    const baseCapabilities = {
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
        supportLevel: accountType === 'individual' ? 'community' : 'email',
    };

    return { success: true, data: baseCapabilities };
};

export const cleanup = () => {
    firestoreService.cleanup();
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
    getDefaultCapabilities,
    cleanup,
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
    getDefaultCapabilities,
    cleanup,
};