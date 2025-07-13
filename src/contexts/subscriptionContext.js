// contexts/subscriptionContext.js
'use client'
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useUserProfile } from './userProfileContext';
import { useAuth } from './AuthProvider';
import { useAccountCapabilities } from '../hooks/useAccountCapabilities';
import { subscriptionService } from '../services/subscriptionService';
import accountService from '../services/accountService';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

// Helper function to safely get default capabilities
const getDefaultCapabilities = (accountType = 'individual') => {
    try {
        const result = accountService.getDefaultCapabilities(accountType);
        return result.success ? result.data : {
            maxSuites: 5,
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
            supportLevel: 'community'
        };
    } catch (error) {
        console.error('Error getting default capabilities:', error);
        return {
            maxSuites: 5,
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
            supportLevel: 'community'
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
const safeHasFeatureAccess = (capabilities, userProfile, feature) => {
    try {
        if (!capabilities || !userProfile) return false;
        
        const featureMap = {
            'teamCollaboration': 'canInviteTeamMembers',
            'advancedReporting': 'canExportReports',
            'automatedTesting': 'canCreateAutomatedTests',
            'recordings': 'canCreateRecordings',
            'testScripts': 'canCreateTestScripts'
        };
        
        const capabilityKey = featureMap[feature] || feature;
        return capabilities[capabilityKey] === true;
    } catch (error) {
        console.error('Error checking feature access:', error);
        return false;
    }
};

// CENTRALIZED: Get feature limits with trial support
const getFeatureLimitsFromStatus = (subscriptionStatus, userProfile, capabilities) => {
    // Default limits for unauthenticated or missing data
    const defaultLimits = {
        suites: 1,
        testSuites: 1,
        testCases: 10,
        recordings: 5,
        automatedScripts: 0,
        maxSuites: 1,
        maxTestSuites: 1,
        maxTestScripts: 10,
        maxAutomatedTests: 0,
        maxRecordings: 5,
        maxMonthlyExports: 5,
        maxTeamMembers: 1,
        maxStorageGB: 1
    };

    if (!subscriptionStatus || !userProfile) {
        return defaultLimits;
    }

    const isTrialActive = subscriptionStatus.isTrial || 
        subscriptionStatus.subscriptionStatus === 'trial';

    // TRIAL LIMITS: Enhanced limits during trial
    if (isTrialActive) {
        const accountType = userProfile.accountType || 'individual';

        if (accountType === 'organization') {
            const orgType = subscriptionStatus.subscriptionPlan || 'organization_trial';
            if (orgType.includes('enterprise')) {
                return {
                    suites: -1,
                    testSuites: -1,
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1,
                    maxSuites: -1,
                    maxTestSuites: -1,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: -1,
                    maxStorageGB: -1
                };
            } else {
                return {
                    suites: 10,
                    testSuites: 10,
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1,
                    maxSuites: 10,
                    maxTestSuites: 10,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: 10,
                    maxStorageGB: 10
                };
            }
        } else {
            return {
                suites: 5,
                testSuites: 5,
                testCases: -1,
                recordings: -1,
                automatedScripts: -1,
                maxSuites: 5,
                maxTestSuites: 5,
                maxTestScripts: -1,
                maxAutomatedTests: -1,
                maxRecordings: -1,
                maxMonthlyExports: -1,
                maxTeamMembers: 5,
                maxStorageGB: 5
            };
        }
    }

    // PAID SUBSCRIPTION LIMITS: Use capabilities from subscription
    if (capabilities && subscriptionStatus.isValid) {
        return {
            suites: capabilities.maxSuites || capabilities.maxTestSuites || 1,
            testSuites: capabilities.maxTestSuites || capabilities.maxSuites || 1,
            testCases: capabilities.maxTestCases || -1,
            recordings: capabilities.maxRecordings || 5,
            automatedScripts: capabilities.maxAutomatedTests || 0,
            maxSuites: capabilities.maxSuites || capabilities.maxTestSuites || 1,
            maxTestSuites: capabilities.maxTestSuites || capabilities.maxSuites || 1,
            maxTestScripts: capabilities.maxTestScripts || 20,
            maxAutomatedTests: capabilities.maxAutomatedTests || 0,
            maxRecordings: capabilities.maxRecordings || 5,
            maxMonthlyExports: capabilities.maxMonthlyExports || 5,
            maxTeamMembers: capabilities.maxTeamMembers || 1,
            maxStorageGB: capabilities.maxStorageGB || 1
        };
    }

    // FREE PLAN LIMITS: Based on account type
    const accountType = userProfile.accountType || 'individual';
    if (accountType === 'organization') {
        return {
            suites: 5,
            testSuites: 5,
            testCases: 50,
            recordings: 25,
            automatedScripts: 10,
            maxSuites: 5,
            maxTestSuites: 5,
            maxTestScripts: 50,
            maxAutomatedTests: 10,
            maxRecordings: 25,
            maxMonthlyExports: 10,
            maxTeamMembers: 5,
            maxStorageGB: 5
        };
    }

    return defaultLimits;
};

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    const { userProfile, refreshUserProfile } = useUserProfile();
    const { capabilities, loading: capabilitiesLoading, error: capabilitiesError } = useAccountCapabilities(user?.uid);
    const [isLoading, setIsLoading] = useState(false);
    const [, setSubscription] = useState(null);

    // Helper function to calculate trial days remaining
    const calculateTrialDaysRemaining = (trialEndDate) => {
        if (!trialEndDate) return 0;
        
        const endDate = trialEndDate instanceof Date ? trialEndDate : new Date(trialEndDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    };

    // Helper function to check if subscription is active
    const isSubscriptionActive = (profile) => {
        if (!profile) return false;
        
        const { subscriptionStatus, subscriptionEndDate, isTrialActive } = profile;
        
        if (isTrialActive) return true;
        
        if (subscriptionStatus === 'active') {
            if (!subscriptionEndDate) return true;
            
            const endDate = subscriptionEndDate instanceof Date ? subscriptionEndDate : new Date(subscriptionEndDate);
            return endDate.getTime() > Date.now();
        }
        
        return false;
    };

    // MOVED BEFORE subscriptionStatus: Update trial status in database
    const updateTrialStatusInDatabase = useCallback(async () => {
        if (!user || !userProfile) return userProfile;

        try {
            setIsLoading(true);
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                console.error('User document not found');
                return userProfile;
            }

            const currentData = userDoc.data();
            const now = new Date();
            
            let needsUpdate = false;
            const updateData = {};

            if (currentData.isTrialActive && currentData.trialEndDate) {
                const trialEndDate = currentData.trialEndDate instanceof Date 
                    ? currentData.trialEndDate 
                    : new Date(currentData.trialEndDate);
                    
                const trialDaysRemaining = calculateTrialDaysRemaining(trialEndDate);
                
                if (trialDaysRemaining <= 0) {
                    updateData.isTrialActive = false;
                    updateData.trialDaysRemaining = 0;
                    
                    if (currentData.subscriptionStatus !== 'active' || !currentData.subscriptionEndDate || new Date(currentData.subscriptionEndDate) <= now) {
                        const accountType = currentData.accountType || 'individual';
                        updateData.subscriptionPlan = getDefaultPlan(accountType);
                        updateData.subscriptionStatus = 'inactive';
                    }
                    
                    needsUpdate = true;
                } else {
                    updateData.trialDaysRemaining = trialDaysRemaining;
                    needsUpdate = currentData.trialDaysRemaining !== trialDaysRemaining;
                }
            }

            if (currentData.subscriptionStatus === 'active' && currentData.subscriptionEndDate) {
                const subscriptionEndDate = currentData.subscriptionEndDate instanceof Date 
                    ? currentData.subscriptionEndDate 
                    : new Date(currentData.subscriptionEndDate);
                    
                if (subscriptionEndDate <= now && !currentData.isTrialActive) {
                    const accountType = currentData.accountType || 'individual';
                    updateData.subscriptionPlan = getDefaultPlan(accountType);
                    updateData.subscriptionStatus = 'inactive';
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                updateData.updatedAt = serverTimestamp();
                
                console.log('Updating subscription status:', updateData);
                await updateDoc(userDocRef, updateData);
                
                if (refreshUserProfile) {
                    await refreshUserProfile();
                }
            }
            
            return { ...currentData, ...updateData };
            
        } catch (error) {
            console.error('Error updating trial status:', error);
            return userProfile;
        } finally {
            setIsLoading(false);
        }
    }, [user, userProfile, refreshUserProfile]);

    // Load subscription data
    const loadSubscription = useCallback(async (userId) => {
        if (!userId || window.isRegistering) {
            console.log('Skipping subscription load:', { userId, isRegistering: window.isRegistering });
            setIsLoading(false);
            setSubscription(null);
            return;
        }

        setIsLoading(true);
        try {
            console.log('Loading subscription for:', userId);
            const subscriptionResult = await subscriptionService.getSubscription(userId);
            if (subscriptionResult.success) {
                setSubscription(subscriptionResult.data);
            } else {
                console.error('Error fetching subscription:', subscriptionResult.error);
                setSubscription(null);
            }
        } catch (error) {
            console.error('Error in loadSubscription:', error);
            setSubscription(null);
        } finally {
            setIsLoading(false);
        }
    }, [setSubscription]);

    // Memoized subscription status with trial logic
    const subscriptionStatus = useMemo(() => {
        const defaultAccountType = userProfile?.accountType || 'individual';
        const defaultCapabilities = getDefaultCapabilities(defaultAccountType);
        
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
            profile: null
        };

        if (!userProfile || capabilitiesLoading) {
            return defaultStatus;
        }

        const isActive = isSubscriptionActive(userProfile);
        const isTrialActive = userProfile.isTrialActive || false;
        const trialDaysRemaining = isTrialActive ? calculateTrialDaysRemaining(userProfile.trialEndDate) : 0;
        
        const userCapabilities = capabilities || getDefaultCapabilities(userProfile.accountType);
        
        if (isTrialActive && trialDaysRemaining <= 0) {
            updateTrialStatusInDatabase();
        }

        return {
            isValid: isActive || isTrialActive,
            isExpired: !isActive && !isTrialActive,
            isTrial: isTrialActive,
            trialDaysRemaining,
            subscriptionPlan: userProfile.subscriptionPlan || getDefaultPlan(userProfile.accountType),
            subscriptionStatus: userProfile.subscriptionStatus || 'inactive',
            capabilities: userCapabilities,
            showTrialBanner: isTrialActive && trialDaysRemaining <= 7,
            showUpgradePrompt: !isActive && !isTrialActive,
            profile: userProfile,
            billingCycle: userProfile.billingCycle || null,
            nextBillingDate: userProfile.nextBillingDate || null,
            willCancelAt: userProfile.willCancelAt || null
        };
    }, [userProfile, capabilities, capabilitiesLoading, updateTrialStatusInDatabase]);

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

    // Feature access check using accountService structure
    const hasFeatureAccess = useCallback((featureName) => {
        if (!capabilities || capabilitiesLoading) return false;

        try {
            return safeHasFeatureAccess(capabilities, userProfile, featureName);
        } catch (error) {
            console.error(`Error checking feature access for ${featureName}:`, error);
            return false;
        }
    }, [capabilities, userProfile, capabilitiesLoading]);

    // Billing and subscription management methods
    const createCheckoutSession = useCallback(async (planId, billingCycle = 'monthly', successUrl, cancelUrl) => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        setIsLoading(true);
        try {
            const result = await subscriptionService.createCheckoutSession(
                user.uid, 
                planId, 
                billingCycle, 
                successUrl, 
                cancelUrl
            );
            return result;
        } catch (error) {
            console.error('Error creating checkout session:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const cancelSubscription = useCallback(async (immediate = false) => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        setIsLoading(true);
        try {
            const result = await subscriptionService.cancelSubscription(user.uid, immediate);
            
            if (result.success && refreshUserProfile) {
                await refreshUserProfile();
            }
            
            return result;
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user, refreshUserProfile]);

    const reactivateSubscription = useCallback(async () => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        setIsLoading(true);
        try {
            const result = await subscriptionService.reactivateSubscription(user.uid);
            
            if (result.success && refreshUserProfile) {
                await refreshUserProfile();
            }
            
            return result;
        } catch (error) {
            console.error('Error reactivating subscription:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, [user, refreshUserProfile]);

    const getBillingHistory = useCallback(async () => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            return await subscriptionService.getBillingHistory(user.uid);
        } catch (error) {
            console.error('Error getting billing history:', error);
            return { success: false, error: error.message };
        }
    }, [user]);

    const updatePaymentMethod = useCallback(async (paymentMethodData) => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        setIsLoading(true);
        try {
            const result = await subscriptionService.updatePaymentMethod(user.uid, paymentMethodData);
            
            if (result.success && refreshUserProfile) {
                await refreshUserProfile();
            }
            
            return result;
        } catch (error) {
            console.error('Error updating payment method:', error);
            return { success: false, error: error.message };
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
                const trialDaysRemaining = calculateTrialDaysRemaining(userProfile.trialEndDate);
                if (trialDaysRemaining <= 0) {
                    updateTrialStatusInDatabase();
                }
            }
        } else {
            setSubscription(null);
            setIsLoading(false);
        }
    }, [user?.uid, userProfile, loadSubscription, updateTrialStatusInDatabase, setSubscription]);

    const value = {
        // Subscription status and capabilities
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        updateTrialStatusInDatabase,
        isLoading: isLoading || capabilitiesLoading,
        error: capabilitiesError,
        
        // CENTRALIZED: Resource management functions
        canCreateResource,
        getResourceLimit,
        
        // Billing and subscription management
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription,
        getBillingHistory,
        updatePaymentMethod,
        
        // Billing configuration
        billingConfig: subscriptionService.BILLING_CONFIG,
        
        // Expose capabilities for debugging/direct access
        capabilities
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionProvider;