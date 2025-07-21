'use client';
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useUserProfile } from './userProfileContext';
import { useAuth } from './AuthProvider';
import { useAccountCapabilities } from '../hooks/useAccountCapabilities';
import { subscriptionService } from '../services/subscriptionService';
import accountService from '../services/accountService';
import firestoreService from '../services/firestoreService';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

// Helper function to safely get default capabilities
const getDefaultCapabilities = (accountType = 'individual', hasSuiteAccess = false) => {
    try {
        const result = accountService.getDefaultCapabilities(accountType);
        const baseCapabilities = result.success ? result.data : {
            maxTestSuites: 5,
            maxTestScripts: 20,
            maxAutomatedTests: 10,
            maxRecordings: 10,
            maxMonthlyExports: 5,
            canInviteTeamMembers: false,
            maxTeamMembers: 1,
            canExportReports: true,
            canCreateAutomatedTests: true,
            canCreateRecordings: true,
            canCreateTestScripts: true,
            maxStorageGB: 1,
            supportLevel: 'community',
            canAccessBugs: true,
            canViewSuite: true,
        };
        return {
            ...baseCapabilities,
            canAccessBugs: hasSuiteAccess ? true : baseCapabilities.canAccessBugs,
            canViewSuite: hasSuiteAccess ? true : baseCapabilities.canViewSuite,
        };
    } catch (error) {
        console.error('Error getting default capabilities:', error);
        return {
            maxTestSuites: 5,
            maxTestScripts: 20,
            maxAutomatedTests: 10,
            maxRecordings: 10,
            maxMonthlyExports: 5,
            canInviteTeamMembers: false,
            maxTeamMembers: 1,
            canExportReports: true,
            canCreateAutomatedTests: true,
            canCreateRecordings: true,
            canCreateTestScripts: true,
            maxStorageGB: 1,
            supportLevel: 'community',
            canAccessBugs: hasSuiteAccess,
            canViewSuite: hasSuiteAccess,
        };
    }
};

// Helper function to safely get default plan
const getDefaultPlan = (accountType = 'individual') => {
    try {
        return accountType === 'organization' ? 'organization_free' : 'individual_free';
    } catch (error) {
        console.error('Error getting default plan:', error);
        return 'individual_free';
    }
};

// Helper function to safely check feature access
const safeHasFeatureAccess = (capabilities, userProfile, feature, hasSuiteAccess = false) => {
    try {
        if (!capabilities || !userProfile) return false;

        const featureMap = {
            'teamCollaboration': 'canInviteTeamMembers',
            'advancedReporting': 'canExportReports',
            'automatedTesting': 'canCreateAutomatedTests',
            'recordings': 'canCreateRecordings',
            'testScripts': 'canCreateTestScripts',
            'canAccessBugs': 'canAccessBugs',
            'canViewSuite': 'canViewSuite',
        };

        const capabilityKey = featureMap[feature] || feature;

        if (capabilityKey === 'canAccessBugs' && hasSuiteAccess) {
            if (userProfile.account_memberships?.some(m => m.account_type === 'organization')) {
                const orgMembership = userProfile.account_memberships.find(m => m.account_type === 'organization');
                const restrictiveRoles = ['viewer'];
                return !restrictiveRoles.includes(orgMembership?.role);
            }
            return true;
        }

        return capabilities[capabilityKey] === true;
    } catch (error) {
        console.error('Error checking feature access:', error);
        return false;
    }
};

// CENTRALIZED: Get feature limits with trial support
const getFeatureLimitsFromStatus = (subscriptionStatus, userProfile, capabilities) => {
    const defaultLimits = {
        suites: 1,
        testSuites: 1,
        testCases: 10,
        recordings: 5,
        automatedScripts: 0,
        maxTestSuites: 1,
        maxTestScripts: 10,
        maxAutomatedTests: 0,
        maxRecordings: 5,
        maxMonthlyExports: 5,
        maxTeamMembers: 1,
        maxStorageGB: 1,
    };

    if (!subscriptionStatus || !userProfile || !capabilities) {
        return defaultLimits;
    }

    const isTrialActive = subscriptionStatus.isTrial || subscriptionStatus.subscriptionStatus === 'trial';

    if (isTrialActive) {
        const accountType = userProfile.account_memberships?.[0]?.account_type || 'individual';
        if (accountType === 'organization') {
            const orgType = subscriptionStatus.subscriptionPlan || 'organization_trial';
            if (orgType.includes('enterprise')) {
                return {
                    suites: -1,
                    testSuites: -1,
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1,
                    maxTestSuites: -1,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: -1,
                    maxStorageGB: -1,
                };
            } else {
                return {
                    suites: 10,
                    testSuites: 10,
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1,
                    maxTestSuites: 10,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: 10,
                    maxStorageGB: 10,
                };
            }
        } else {
            return {
                suites: 5,
                testSuites: 5,
                testCases: -1,
                recordings: -1,
                automatedScripts: -1,
                maxTestSuites: 5,
                maxTestScripts: -1,
                maxAutomatedTests: -1,
                maxRecordings: -1,
                maxMonthlyExports: -1,
                maxTeamMembers: 5,
                maxStorageGB: 5,
            };
        }
    }

    if (subscriptionStatus.isValid) {
        return {
            suites: capabilities.maxTestSuites || 1,
            testSuites: capabilities.maxTestSuites || 1,
            testCases: capabilities.maxTestCases || -1,
            recordings: capabilities.maxRecordings || 5,
            automatedScripts: capabilities.maxAutomatedTests || 0,
            maxTestSuites: capabilities.maxTestSuites || 1,
            maxTestScripts: capabilities.maxTestScripts || 20,
            maxAutomatedTests: capabilities.maxAutomatedTests || 0,
            maxRecordings: capabilities.maxRecordings || 5,
            maxMonthlyExports: capabilities.maxMonthlyExports || 5,
            maxTeamMembers: capabilities.maxTeamMembers || 1,
            maxStorageGB: capabilities.maxStorageGB || 1,
        };
    }

    const accountType = userProfile.account_memberships?.[0]?.account_type || 'individual';
    if (accountType === 'organization') {
        return {
            suites: 5,
            testSuites: 5,
            testCases: 50,
            recordings: 25,
            automatedScripts: 10,
            maxTestSuites: 5,
            maxTestScripts: 50,
            maxAutomatedTests: 10,
            maxRecordings: 25,
            maxMonthlyExports: 10,
            maxTeamMembers: 5,
            maxStorageGB: 5,
        };
    }

    return defaultLimits;
};

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    const { userProfile, refreshUserProfile } = useUserProfile();
    const { capabilities, loading: capabilitiesLoading, error: capabilitiesError } = useAccountCapabilities(user?.uid);
    const [isLoading, setIsLoading] = useState(false);

    // Check suite access
    const checkSuiteAccess = useCallback(async (userId, suiteId) => {
        if (!userId || !suiteId) return false;
        try {
            const suitesResult = await accountService.getUserSuiteCount(userId);
            if (!suitesResult.success) {
                console.error('Error fetching user suites:', suitesResult.error);
                return false;
            }
            const hasSuite = suitesResult.data.suites.some(suite => suite.suite_id === suiteId);
            if (!hasSuite) return false;

            const userProfileResult = await firestoreService.getUserProfile(userId);
            if (!userProfileResult.success) {
                console.error('Error fetching user profile:', userProfileResult.error);
                return false;
            }
            const profile = userProfileResult.data;
            if (profile.account_memberships?.some(m => m.account_type === 'organization')) {
                const orgMembership = profile.account_memberships.find(m => m.account_type === 'organization');
                const restrictiveRoles = ['viewer'];
                return !restrictiveRoles.includes(orgMembership?.role);
            }
            return true;
        } catch (error) {
            console.error('Error checking suite access:', firestoreService.handleFirestoreError(error));
            return false;
        }
    }, []);

    // Load subscription data
    const loadSubscription = useCallback(async (userId) => {
        if (!userId || window.isRegistering) {
            console.log('Skipping subscription load:', { userId, isRegistering: window.isRegistering });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            console.log('Loading subscription for:', userId);
            const subscriptionResult = await subscriptionService.getSubscription(userId);
            if (!subscriptionResult.success) {
                console.error('Error fetching subscription:', subscriptionResult.error);
            }
        } catch (error) {
            console.error('Error in loadSubscription:', firestoreService.handleFirestoreError(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Memoized subscription status with trial logic
    const subscriptionStatus = useMemo(() => {
        const defaultAccountType = userProfile?.account_memberships?.[0]?.account_type || 'individual';
        const defaultCapabilities = getDefaultCapabilities(defaultAccountType, userProfile?.suiteAccess || false);
        const defaultStatus = {
            isValid: false,
            isExpired: true,
            isTrial: false,
            trialDaysRemaining: 0,
            subscriptionPlan: getDefaultPlan(defaultAccountType),
            subscriptionStatus: 'inactive',
            capabilities: defaultCapabilities,
            showTrialBanner: false,
            showUpgradePrompt: true,
            profile: null,
            billingCycle: null,
            nextBillingDate: null,
            willCancelAt: null,
        };
        if (!userProfile || capabilitiesLoading) {
            return defaultStatus;
        }
        const isTrialActive = userProfile.isTrialActive || false;
        const trialDaysRemaining = isTrialActive ? userProfile.trialDaysRemaining || 0 : 0;
        const isActive = userProfile.subscriptionStatus === 'active' && (!userProfile.subscriptionEndDate || new Date(userProfile.subscriptionEndDate) > new Date());
        const userCapabilities = capabilities || defaultCapabilities;

        return {
            isValid: isActive || isTrialActive,
            isExpired: !isActive && !isTrialActive,
            isTrial: isTrialActive,
            trialDaysRemaining,
            subscriptionPlan: userProfile.subscriptionPlan || getDefaultPlan(defaultAccountType),
            subscriptionStatus: userProfile.subscriptionStatus || 'inactive',
            capabilities: userCapabilities,
            showTrialBanner: isTrialActive && trialDaysRemaining <= 7,
            showUpgradePrompt: !isActive && !isTrialActive,
            profile: userProfile,
            billingCycle: userProfile.billingCycle || null,
            nextBillingDate: userProfile.nextBillingDate || null,
            willCancelAt: userProfile.willCancelAt || null,
        };
    }, [userProfile, capabilities, capabilitiesLoading]);

    // CENTRALIZED: Single source of truth for feature limits
    const getFeatureLimits = useCallback(() => {
        return getFeatureLimitsFromStatus(subscriptionStatus, userProfile, capabilities);
    }, [subscriptionStatus, userProfile, capabilities]);

    // CENTRALIZED: Check if user can create more of a specific resource
    const canCreateResource = useCallback((resourceType, currentCount = 0) => {
        const limits = getFeatureLimits();
        const limit = limits[resourceType] || limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`];
        if (limit === -1) return true; // Unlimited
        return currentCount < limit;
    }, [getFeatureLimits]);

    // CENTRALIZED: Get resource limits for a specific type
    const getResourceLimit = useCallback((resourceType) => {
        const limits = getFeatureLimits();
        return limits[resourceType] || limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`] || 0;
    }, [getFeatureLimits]);

    // Feature access check
    const hasFeatureAccess = useCallback(
        (featureName) => {
            if (!capabilities || capabilitiesLoading) return false;
            return safeHasFeatureAccess(capabilities, userProfile, featureName, userProfile?.suiteAccess || false);
        },
        [capabilities, userProfile, capabilitiesLoading],
    );

    // Billing and subscription management methods
    const createCheckoutSession = useCallback(async (planId, billingCycle = 'monthly', successUrl, cancelUrl) => {
        if (!user) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }
        setIsLoading(true);
        try {
            const result = await subscriptionService.createCheckoutSession(
                user.uid,
                planId,
                billingCycle,
                successUrl,
                cancelUrl,
            );
            return result;
        } catch (error) {
            console.error('Error creating checkout session:', firestoreService.handleFirestoreError(error));
            return { success: false, error: firestoreService.handleFirestoreError(error) };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const cancelSubscription = useCallback(async (immediate = false) => {
        if (!user) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }
        setIsLoading(true);
        try {
            const result = await subscriptionService.cancelSubscription(user.uid, immediate);
            if (result.success && refreshUserProfile) {
                await refreshUserProfile();
            }
            return result;
        } catch (error) {
            console.error('Error cancelling subscription:', firestoreService.handleFirestoreError(error));
            return { success: false, error: firestoreService.handleFirestoreError(error) };
        } finally {
            setIsLoading(false);
        }
    }, [user, refreshUserProfile]);

    const reactivateSubscription = useCallback(async () => {
        if (!user) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }
        setIsLoading(true);
        try {
            const result = await subscriptionService.reactivateSubscription(user.uid);
            if (result.success && refreshUserProfile) {
                await refreshUserProfile();
            }
            return result;
        } catch (error) {
            console.error('Error reactivating subscription:', firestoreService.handleFirestoreError(error));
            return { success: false, error: firestoreService.handleFirestoreError(error) };
        } finally {
            setIsLoading(false);
        }
    }, [user, refreshUserProfile]);

    const getBillingHistory = useCallback(async () => {
        if (!user) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' }, transactions: [] };
        }
        try {
            const result = await subscriptionService.getBillingHistory(user.uid);
            return result;
        } catch (error) {
            console.error('Error getting billing history:', firestoreService.handleFirestoreError(error));
            return { success: false, error: firestoreService.handleFirestoreError(error), transactions: [] };
        }
    }, [user]);

    const updatePaymentMethod = useCallback(async (paymentMethodData) => {
        if (!user) {
            return { success: false, error: { message: 'User not authenticated', code: 'NO_AUTHENTICATED_USER' } };
        }
        setIsLoading(true);
        try {
            const result = await subscriptionService.updatePaymentMethod(user.uid, paymentMethodData);
            if (result.success && refreshUserProfile) {
                await refreshUserProfile();
            }
            return result;
        } catch (error) {
            console.error('Error updating payment method:', firestoreService.handleFirestoreError(error));
            return { success: false, error: firestoreService.handleFirestoreError(error) };
        } finally {
            setIsLoading(false);
        }
    }, [user, refreshUserProfile]);

    // Auto-update trial status and load subscription when user changes
    useEffect(() => {
        const userId = user?.uid;
        if (userId && !window.isRegistering) {
            loadSubscription(userId);
            if (userProfile && userProfile.isTrialActive) {
                subscriptionService.updateTrialStatus(userId);
            }
        } else {
            setIsLoading(false);
        }
    }, [user?.uid, userProfile, loadSubscription]);

    const value = {
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        isLoading: isLoading || capabilitiesLoading,
        error: capabilitiesError,
        canCreateResource,
        getResourceLimit,
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription,
        getBillingHistory,
        updatePaymentMethod,
        billingConfig: subscriptionService.BILLING_CONFIG,
        capabilities,
        checkSuiteAccess,
    };

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export default SubscriptionProvider;