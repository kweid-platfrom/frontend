// hooks/useAccountCapabilities.js - Custom hook for capabilities
import { useState, useEffect } from 'react';
import { fetchUserData } from '../services/userService';
import accountService from '../services/accountService';

export const useAccountCapabilities = (userId) => {
    const [capabilities, setCapabilities] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCapabilities = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch user data using userService
                const { userData, error: fetchError } = await fetchUserData(userId);

                if (fetchError) {
                    console.error('Failed to fetch user data:', fetchError);
                    setError(fetchError);
                    return;
                }

                if (!userData) {
                    console.warn('No user data found');
                    setError('User data not found');
                    return;
                }

                // Transform userData to format expected by accountService
                const transformedUserProfile = transformUserDataForAccountService(userData);


                // Get capabilities using accountService
                const userCapabilities = accountService.getUserCapabilities(transformedUserProfile);


                setCapabilities(userCapabilities);

            } catch (error) {
                console.error('Failed to load capabilities:', error);
                setError(error.message || 'Failed to load account capabilities');
            } finally {
                setLoading(false);
            }
        };

        loadCapabilities();
    }, [userId]);

    return { capabilities, loading, error };
};

/**
 * Transform user data from userService format to accountService expected format
 */
const transformUserDataForAccountService = (userData) => {
    // Handle both new format and legacy format
    const isNewFormat = userData.user_id && userData.profile_info;

    if (isNewFormat) {
        // Transform new format to accountService expected format
        return {
            uid: userData.user_id,
            user_id: userData.user_id,
            email: userData.primary_email,

            // Extract names
            firstName: userData.profile_info?.name?.first || '',
            lastName: userData.profile_info?.name?.last || '',
            displayName: userData.profile_info?.name?.display || '',

            // Account type information
            accountType: userData.session_context?.current_account_type || 'individual',
            userType: userData.session_context?.current_account_type || 'individual',
            organizationId: userData.session_context?.current_account_id,

            // Account memberships
            account_memberships: userData.account_memberships || [],

            // Subscription information (you may need to adjust these based on your data structure)
            subscriptionPlan: userData.subscription?.plan_id ||
                userData.session_context?.subscription?.plan_id ||
                getDefaultSubscriptionPlan(userData.session_context?.current_account_type),
            subscriptionStatus: userData.subscription?.status ||
                userData.session_context?.subscription?.status ||
                'inactive',
            subscriptionStartDate: userData.subscription?.started_at ||
                userData.profile_info?.created_at,
            subscriptionEndDate: userData.subscription?.trial_end ||
                userData.subscription?.end_date,

            // Timestamps
            createdAt: userData.profile_info?.created_at,
            updatedAt: userData.profile_info?.updated_at,

            // Additional fields that might be needed
            isActive: true,
            emailVerified: userData.auth_metadata?.email_verified || false,
        };
    } else {
        // Legacy format - pass through with minimal transformation
        return {
            ...userData,
            uid: userData.uid || userData.user_id,
            user_id: userData.uid || userData.user_id,
            subscriptionPlan: userData.subscriptionPlan || getDefaultSubscriptionPlan(userData.accountType || userData.userType),
        };
    }
};

/**
 * Get default subscription plan based on account type
 */
const getDefaultSubscriptionPlan = (accountType) => {
    if (accountType === 'organization') {
        return 'organization_free';
    }
    return 'individual_free';
};