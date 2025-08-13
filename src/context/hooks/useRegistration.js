/* eslint-disable @typescript-eslint/no-unused-vars */
// context/hooks/useRegistration - AppProvider hook (Simplified)
import { useCallback } from 'react';
import FirestoreService from '../../services';

export const useRegistration = (_authSlice, _uiSlice) => {
    const checkRegistrationStatus = useCallback(async (user) => {
        if (!user?.uid) return 'completed';

        try {
            console.log('🔍 Checking registration status for user:', user.uid);
            
            // Check user profile
            const profileResult = await FirestoreService.user.getUserProfile(user.uid);
            if (!profileResult.success) {
                if (profileResult.error.message === 'Document not found') {
                    console.log('📝 User profile not found - registration incomplete');
                    return 'incomplete';
                }
                throw new Error(profileResult.error.message);
            }

            const profile = profileResult.data;
            console.log('👤 User profile found:', {
                account_type: profile.account_type,
                organizationId: profile.organizationId,
                registrationCompleted: profile.registrationCompleted,
            });

            // Check if registration is marked as completed
            if (profile.registrationCompleted === false) {
                console.log('📋 Registration marked as incomplete');
                return 'incomplete';
            }

            // For organization accounts, verify organization exists
            if (profile.account_type === 'organization' && profile.organizationId) {
                const orgResult = await FirestoreService.organization.getOrganization(profile.organizationId);
                if (!orgResult.success) {
                    console.log('🏢 Organization not found - registration incomplete');
                    return 'incomplete';
                }
            }

            console.log('✅ Registration completed');
            return 'completed';
        } catch (error) {
            console.error('Error checking registration status:', error);
            return 'incomplete';
        }
    }, []);

    // This method is no longer needed but kept for compatibility
    const completePendingRegistration = useCallback(async () => {
        console.log('⚠️ completePendingRegistration called but no longer needed');
        return { success: true, message: 'No pending registration to complete' };
    }, []);

    // This method is no longer needed but kept for compatibility
    const completeOrganizationSetup = useCallback(async () => {
        console.log('⚠️ completeOrganizationSetup called but no longer needed');
        return { success: true, message: 'Organization setup completed during registration' };
    }, []);

    return { 
        checkRegistrationStatus, 
        completePendingRegistration, 
        completeOrganizationSetup 
    };
};