// services/accountService.js - Main account service that aggregates all account-related functions
import {
    SUBSCRIPTION_PLANS,
    getAccountType,
    determineAccountType,
    getDefaultPlan,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    calculateTrialStatus,
    getUserCapabilities,
    getDefaultCapabilities,
    hasFeatureAccess
} from "../config/subscriptionPlans";

import {
    getAccountSetupStatus,
    setupAccount,
    checkAndUpdateTrialStatus
} from "./accountSetup";

import {
    canCreateNewSuite,
    getUserSuiteCount,
    canCreateNewTestSuite,
    getUserTestSuiteCount,
    canInviteTeamMembers,
    getOrganizationMemberCount,
    canCreateNewTestScript,
    getUserTestScriptCount,
    canCreateNewAutomatedTest,
    getUserAutomatedTestCount,
    canCreateNewRecording,
    getUserRecordingCount,
    canExportReport,
    getUserMonthlyExportCount,
    getUserUsageStats
} from "./accountLimits";

// Export the main accountService object that aggregates all functions
export const accountService = {
    // Account setup functions
    getAccountSetupStatus,
    getAccountType,
    setupAccount,
    checkAndUpdateTrialStatus,

    // Subscription and capabilities functions
    getUserCapabilities,
    getDefaultCapabilities,
    determineAccountType,
    calculateTrialStatus,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    hasFeatureAccess,

    // Limit checking functions
    canCreateNewSuite,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    canCreateNewTestScript,
    canCreateNewAutomatedTest,
    canCreateNewRecording,
    canExportReport,

    // Usage counting functions
    getUserSuiteCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount,
    getUserTestScriptCount,
    getUserAutomatedTestCount,
    getUserRecordingCount,
    getUserMonthlyExportCount,
    getUserUsageStats,

    // Direct access to subscription plans
    SUBSCRIPTION_PLANS
};

// Export individual functions for backward compatibility and direct imports
export {
    // From subscriptionPlans.js
    SUBSCRIPTION_PLANS,
    getAccountType,
    determineAccountType,
    getDefaultPlan,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    calculateTrialStatus,
    getUserCapabilities,
    getDefaultCapabilities,
    hasFeatureAccess,

    // From accountSetup.js
    getAccountSetupStatus,
    setupAccount,
    checkAndUpdateTrialStatus,

    // From accountLimits.js
    canCreateNewSuite,
    getUserSuiteCount,
    canCreateNewTestSuite,
    getUserTestSuiteCount,
    canInviteTeamMembers,
    getOrganizationMemberCount,
    canCreateNewTestScript,
    getUserTestScriptCount,
    canCreateNewAutomatedTest,
    getUserAutomatedTestCount,
    canCreateNewRecording,
    getUserRecordingCount,
    canExportReport,
    getUserMonthlyExportCount,
    getUserUsageStats
};