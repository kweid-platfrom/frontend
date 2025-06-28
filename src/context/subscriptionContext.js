// contexts/SubscriptionContext.js
'use client'
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useUserProfile } from './userProfileContext';
import { useAuth } from './AuthProvider';
import { accountService } from '../services/accountService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
    const { userProfile } = useUserProfile();
    const [trialStatusUpdated, setTrialStatusUpdated] = useState(false);

    // Helper function to validate values before database update
    const validateValue = (value, defaultValue = null) => {
        if (value === undefined || value === null || (typeof value === 'number' && isNaN(value))) {
            return defaultValue;
        }
        return value;
    };

    // Memoized subscription status with trial logic
    const subscriptionStatus = useMemo(() => {
        if (!userProfile) return {
            isValid: false,
            isExpired: true,
            isTrial: false,
            trialDaysRemaining: 0,
            subscriptionType: 'free',
            subscriptionStatus: 'active'
        };

        const updatedProfile = accountService.checkAndUpdateTrialStatus(userProfile);
        const capabilities = accountService.getUserCapabilities(updatedProfile);

        return {
            isValid: capabilities.isTrialActive || updatedProfile.subscriptionType !== 'free',
            isExpired: !capabilities.isTrialActive && updatedProfile.subscriptionType === 'free',
            isTrial: capabilities.isTrialActive,
            trialDaysRemaining: capabilities.trialDaysRemaining || 0,
            subscriptionType: capabilities.subscriptionType,
            subscriptionStatus: capabilities.subscriptionStatus,
            capabilities: capabilities,
            showTrialBanner: capabilities.isTrialActive && capabilities.trialDaysRemaining <= 7,
            showUpgradePrompt: !capabilities.isTrialActive && updatedProfile.subscriptionType === 'free',
            profile: updatedProfile
        };
    }, [userProfile]);

    const hasFeatureAccess = useCallback((featureName) => {
        if (!userProfile) return false;

        try {
            const capabilities = accountService.getUserCapabilities(userProfile);
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
        if (!userProfile) return null;

        try {
            const capabilities = accountService.getUserCapabilities(userProfile);
            return capabilities?.limits || null;
        } catch (error) {
            console.error('Error getting feature limits:', error);
            return null;
        }
    }, [userProfile]);

    const updateTrialStatusInDatabase = useCallback(async () => {
        if (!user || !userProfile || trialStatusUpdated) return userProfile;

        try {
            const originalProfile = userProfile;
            const updatedProfile = accountService.checkAndUpdateTrialStatus(originalProfile);

            // Check if profile actually needs updating
            const needsUpdate = (
                originalProfile.isTrialActive !== updatedProfile.isTrialActive ||
                originalProfile.subscriptionStatus !== updatedProfile.subscriptionStatus ||
                originalProfile.trialDaysRemaining !== updatedProfile.trialDaysRemaining ||
                originalProfile.subscriptionType !== updatedProfile.subscriptionType
            );

            if (!needsUpdate) {
                setTrialStatusUpdated(true);
                return updatedProfile;
            }

            // Validate and prepare update data
            const updateData = {};
            
            // Validate subscription type
            const subscriptionType = validateValue(updatedProfile.subscriptionType, 'free');
            if (['free', 'trial', 'premium', 'pro'].includes(subscriptionType)) {
                updateData.subscriptionType = subscriptionType;
            }
            
            // Validate subscription status
            const subscriptionStatus = validateValue(updatedProfile.subscriptionStatus, 'active');
            if (['active', 'inactive', 'cancelled', 'trial'].includes(subscriptionStatus)) {
                updateData.subscriptionStatus = subscriptionStatus;
            }
            
            // Validate isTrialActive (boolean)
            const isTrialActive = validateValue(updatedProfile.isTrialActive, false);
            if (typeof isTrialActive === 'boolean') {
                updateData.isTrialActive = isTrialActive;
            }
            
            // Validate trialDaysRemaining (number, not NaN)
            const trialDaysRemaining = validateValue(updatedProfile.trialDaysRemaining, 0);
            if (typeof trialDaysRemaining === 'number' && !isNaN(trialDaysRemaining) && trialDaysRemaining >= 0) {
                updateData.trialDaysRemaining = Math.floor(trialDaysRemaining); // Ensure integer
            } else {
                updateData.trialDaysRemaining = 0; // Default to 0 if invalid
            }

            // Add trial dates if they exist and are valid
            if (updatedProfile.trialStartDate) {
                const trialStartDate = new Date(updatedProfile.trialStartDate);
                if (!isNaN(trialStartDate.getTime())) {
                    updateData.trialStartDate = trialStartDate;
                }
            }

            if (updatedProfile.trialEndDate) {
                const trialEndDate = new Date(updatedProfile.trialEndDate);
                if (!isNaN(trialEndDate.getTime())) {
                    updateData.trialEndDate = trialEndDate;
                }
            }

            // Always add timestamp
            updateData.updatedAt = serverTimestamp();

            // Only proceed with update if we have meaningful data to update
            if (Object.keys(updateData).length > 1) { // More than just updatedAt
                console.log('Updating user document with validated data:', updateData);
                await updateDoc(doc(db, 'users', user.uid), updateData);
            }
            
            setTrialStatusUpdated(true);
            return updatedProfile;
            
        } catch (error) {
            console.error('Error updating trial status:', error);
            
            // Log the specific error for debugging
            if (error.code === 'invalid-argument') {
                console.error('Invalid data provided to updateDoc. Original error:', error);
                console.error('User profile data:', {
                    userProfileKeys: userProfile ? Object.keys(userProfile) : 'undefined',
                    userProfile: userProfile
                });
            }
            
            return userProfile;
        }
    }, [user, userProfile, trialStatusUpdated]);

    // Auto-update trial status when profile changes
    useEffect(() => {
        if (userProfile && !trialStatusUpdated) {
            updateTrialStatusInDatabase();
        }
    }, [userProfile, updateTrialStatusInDatabase, trialStatusUpdated]);

    // Reset trialStatusUpdated when user changes
    useEffect(() => {
        setTrialStatusUpdated(false);
    }, [user?.uid]);

    const value = {
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        updateTrialStatusInDatabase
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};