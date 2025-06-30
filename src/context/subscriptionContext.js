/* eslint-disable react-hooks/exhaustive-deps */
// contexts/SubscriptionContext.js
'use client'
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useUserProfile } from './userProfileContext';
import { useAuth } from './AuthProvider';
import { subscriptionService } from '../services/subscriptionService';
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

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    const { userProfile, refreshUserProfile } = useUserProfile();
    const [isLoading, setIsLoading] = useState(false);

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
        
        // If trial is active, subscription is considered active
        if (isTrialActive) return true;
        
        // If status is active and not expired
        if (subscriptionStatus === 'active') {
            if (!subscriptionEndDate) return true; // Assume active if no end date
            
            const endDate = subscriptionEndDate instanceof Date ? subscriptionEndDate : new Date(subscriptionEndDate);
            return endDate.getTime() > Date.now();
        }
        
        return false;
    };

    // Helper function to get subscription plan capabilities
    const getSubscriptionCapabilities = (profile) => {
        if (!profile) return getDefaultCapabilities();
        
        const plan = profile.subscriptionPlan || 'individual_free';
        const isActive = isSubscriptionActive(profile);
        const isTrialActive = profile.isTrialActive || false;
        
        // Define capabilities based on plan
        const planCapabilities = {
            individual_free: {
                canCreateMultipleSuites: false,
                canAccessAdvancedReports: false,
                canInviteTeamMembers: false,
                canUseAPI: false,
                canUseAutomation: false,
                limits: {
                    maxSuites: 1,
                    maxTeamMembers: 1,
                    maxReports: 3,
                    maxApiCalls: 0,
                    maxAutomations: 0
                }
            },
            individual_pro: {
                canCreateMultipleSuites: true,
                canAccessAdvancedReports: true,
                canInviteTeamMembers: false,
                canUseAPI: true,
                canUseAutomation: true,
                limits: {
                    maxSuites: 10,
                    maxTeamMembers: 1,
                    maxReports: -1, // unlimited
                    maxApiCalls: 10000,
                    maxAutomations: 50
                }
            },
            organization_free: {
                canCreateMultipleSuites: false,
                canAccessAdvancedReports: false,
                canInviteTeamMembers: true,
                canUseAPI: false,
                canUseAutomation: false,
                limits: {
                    maxSuites: 1,
                    maxTeamMembers: 3,
                    maxReports: 5,
                    maxApiCalls: 0,
                    maxAutomations: 0
                }
            },
            organization_starter: {
                canCreateMultipleSuites: true,
                canAccessAdvancedReports: true,
                canInviteTeamMembers: true,
                canUseAPI: false,
                canUseAutomation: false,
                limits: {
                    maxSuites: 5,
                    maxTeamMembers: 10,
                    maxReports: 50,
                    maxApiCalls: 0,
                    maxAutomations: 0
                }
            },
            organization_professional: {
                canCreateMultipleSuites: true,
                canAccessAdvancedReports: true,
                canInviteTeamMembers: true,
                canUseAPI: true,
                canUseAutomation: true,
                limits: {
                    maxSuites: 25,
                    maxTeamMembers: 50,
                    maxReports: -1, // unlimited
                    maxApiCalls: 50000,
                    maxAutomations: 200
                }
            },
            organization_enterprise: {
                canCreateMultipleSuites: true,
                canAccessAdvancedReports: true,
                canInviteTeamMembers: true,
                canUseAPI: true,
                canUseAutomation: true,
                limits: {
                    maxSuites: -1, // unlimited
                    maxTeamMembers: -1, // unlimited
                    maxReports: -1, // unlimited
                    maxApiCalls: -1, // unlimited
                    maxAutomations: -1 // unlimited
                }
            }
        };

        const capabilities = planCapabilities[plan] || planCapabilities.individual_free;
        
        // If subscription is not active and not on trial, limit to free capabilities
        if (!isActive && !isTrialActive) {
            const accountType = profile.accountType || 'individual';
            const freePlan = accountType === 'organization' ? 'organization_free' : 'individual_free';
            return planCapabilities[freePlan];
        }
        
        return capabilities;
    };

    const getDefaultCapabilities = () => ({
        canCreateMultipleSuites: false,
        canAccessAdvancedReports: false,
        canInviteTeamMembers: false,
        canUseAPI: false,
        canUseAutomation: false,
        limits: {
            maxSuites: 1,
            maxTeamMembers: 1,
            maxReports: 3,
            maxApiCalls: 0,
            maxAutomations: 0
        }
    });

    // Memoized subscription status with trial logic
    const subscriptionStatus = useMemo(() => {
        if (!userProfile) return {
            isValid: false,
            isExpired: true,
            isTrial: false,
            trialDaysRemaining: 0,
            subscriptionPlan: 'individual_free',
            subscriptionStatus: 'inactive',
            capabilities: getDefaultCapabilities(),
            showTrialBanner: false,
            showUpgradePrompt: true,
            profile: null
        };

        const isActive = isSubscriptionActive(userProfile);
        const isTrialActive = userProfile.isTrialActive || false;
        const trialDaysRemaining = isTrialActive ? calculateTrialDaysRemaining(userProfile.trialEndDate) : 0;
        const capabilities = getSubscriptionCapabilities(userProfile);
        
        // Update trial status if trial has expired
        if (isTrialActive && trialDaysRemaining <= 0) {
            updateTrialStatusInDatabase();
        }

        return {
            isValid: isActive || isTrialActive,
            isExpired: !isActive && !isTrialActive,
            isTrial: isTrialActive,
            trialDaysRemaining,
            subscriptionPlan: userProfile.subscriptionPlan || 'individual_free',
            subscriptionStatus: userProfile.subscriptionStatus || 'inactive',
            capabilities,
            showTrialBanner: isTrialActive && trialDaysRemaining <= 7,
            showUpgradePrompt: !isActive && !isTrialActive,
            profile: userProfile,
            billingCycle: userProfile.billingCycle || null,
            nextBillingDate: userProfile.nextBillingDate || null,
            willCancelAt: userProfile.willCancelAt || null
        };
    }, [userProfile]);

    const hasFeatureAccess = useCallback((featureName) => {
        if (!userProfile) return false;

        try {
            const capabilities = getSubscriptionCapabilities(userProfile);
            if (!capabilities) return false;

            switch (featureName) {
                case 'multipleSuites':
                    return capabilities.canCreateMultipleSuites;
                case 'advancedReports':
                    return capabilities.canAccessAdvancedReports;
                case 'teamCollaboration':
                    return capabilities.canInviteTeamMembers;
                case 'apiAccess':
                    return capabilities.canUseAPI;
                case 'automation':
                    return capabilities.canUseAutomation;
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error checking feature access for ${featureName}:`, error);
            return false;
        }
    }, [userProfile]);

    const getFeatureLimits = useCallback(() => {
        if (!userProfile) return getDefaultCapabilities().limits;

        try {
            const capabilities = getSubscriptionCapabilities(userProfile);
            return capabilities?.limits || getDefaultCapabilities().limits;
        } catch (error) {
            console.error('Error getting feature limits:', error);
            return getDefaultCapabilities().limits;
        }
    }, [userProfile]);

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

            // Check if trial has expired
            if (currentData.isTrialActive && currentData.trialEndDate) {
                const trialEndDate = currentData.trialEndDate instanceof Date 
                    ? currentData.trialEndDate 
                    : new Date(currentData.trialEndDate);
                    
                const trialDaysRemaining = calculateTrialDaysRemaining(trialEndDate);
                
                if (trialDaysRemaining <= 0) {
                    // Trial has expired
                    updateData.isTrialActive = false;
                    updateData.trialDaysRemaining = 0;
                    
                    // If no active paid subscription, set to free plan
                    if (currentData.subscriptionStatus !== 'active' || !currentData.subscriptionEndDate || new Date(currentData.subscriptionEndDate) <= now) {
                        const accountType = currentData.accountType || 'individual';
                        updateData.subscriptionPlan = accountType === 'organization' ? 'organization_free' : 'individual_free';
                        updateData.subscriptionStatus = 'inactive';
                    }
                    
                    needsUpdate = true;
                } else {
                    // Update remaining days
                    updateData.trialDaysRemaining = trialDaysRemaining;
                    needsUpdate = currentData.trialDaysRemaining !== trialDaysRemaining;
                }
            }

            // Check if paid subscription has expired
            if (currentData.subscriptionStatus === 'active' && currentData.subscriptionEndDate) {
                const subscriptionEndDate = currentData.subscriptionEndDate instanceof Date 
                    ? currentData.subscriptionEndDate 
                    : new Date(currentData.subscriptionEndDate);
                    
                if (subscriptionEndDate <= now && !currentData.isTrialActive) {
                    // Subscription has expired and no active trial
                    const accountType = currentData.accountType || 'individual';
                    updateData.subscriptionPlan = accountType === 'organization' ? 'organization_free' : 'individual_free';
                    updateData.subscriptionStatus = 'inactive';
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                updateData.updatedAt = serverTimestamp();
                
                console.log('Updating subscription status:', updateData);
                await updateDoc(userDocRef, updateData);
                
                // Refresh user profile to get updated data
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

    // Auto-update trial status when profile changes
    useEffect(() => {
        if (userProfile && userProfile.isTrialActive) {
            const trialDaysRemaining = calculateTrialDaysRemaining(userProfile.trialEndDate);
            if (trialDaysRemaining <= 0) {
                updateTrialStatusInDatabase();
            }
        }
    }, [userProfile, updateTrialStatusInDatabase]);

    const value = {
        // Subscription status and capabilities
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        updateTrialStatusInDatabase,
        isLoading,
        
        // Billing and subscription management
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription,
        getBillingHistory,
        updatePaymentMethod,
        
        // Billing configuration (for components to use)
        billingConfig: subscriptionService.BILLING_CONFIG
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};