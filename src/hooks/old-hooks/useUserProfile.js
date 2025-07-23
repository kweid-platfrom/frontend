/* eslint-disable react-hooks/exhaustive-deps */
// hooks/useUserProfile.js - Aligned with UserProfileContext
import { useState, useCallback } from 'react';
import { useUserProfile as useUserProfileContext } from '../contexts/userProfileContext';
import { getUserDisplayName, getUserEmail } from '../../services/userService';

export const useUserProfile = () => {
    const { 
        userProfile, 
        updateProfile,
        isLoading,
        isUpdating,
        error: contextError,
        refreshProfile,
        displayName: contextDisplayName,
        email: contextEmail,
        isNewUser,
        isProfileLoaded
    } = useUserProfileContext();
    
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        bio: '',
        location: '',
        timezone: ''
    });

    // Helper function to get field values from both new and legacy formats
    const getFieldValue = (field) => {
        if (!userProfile) return '';
        
        switch (field) {
            case 'firstName':
                return userProfile.profile_info?.name?.first || userProfile.firstName || '';
            case 'lastName':
                return userProfile.profile_info?.name?.last || userProfile.lastName || '';
            case 'displayName':
                return getUserDisplayName(userProfile);
            case 'email':
                return getUserEmail(userProfile);
            case 'phone':
                return userProfile.profile_info?.phone || userProfile.phone || '';
            case 'bio':
                return userProfile.profile_info?.bio || userProfile.bio || '';
            case 'location':
                return userProfile.profile_info?.location || userProfile.location || '';
            case 'timezone':
                return userProfile.profile_info?.timezone || userProfile.timezone || 'UTC';
            default:
                return '';
        }
    };

    const startEditing = useCallback(() => {
        setEditForm({
            firstName: getFieldValue('firstName'),
            lastName: getFieldValue('lastName'),
            displayName: getFieldValue('displayName'),
            email: getFieldValue('email'),
            phone: getFieldValue('phone'),
            bio: getFieldValue('bio'),
            location: getFieldValue('location'),
            timezone: getFieldValue('timezone')
        });
        setIsEditing(true);
        setError(null);
    }, [userProfile]);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        setError(null);
        setEditForm({
            firstName: '',
            lastName: '',
            displayName: '',
            email: '',
            phone: '',
            bio: '',
            location: '',
            timezone: ''
        });
    }, []);

    const saveProfile = useCallback(async () => {
        if (!updateProfile) {
            const errorMsg = 'Unable to update profile - update function not available';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        setError(null);

        try {
            await updateProfile(editForm);
            setIsEditing(false);
            console.log('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
            setError(error.message);
            throw error;
        }
    }, [editForm, updateProfile]);

    const updateFormField = useCallback((field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Direct update function that uses context's updateProfile
    const updateProfileDirect = useCallback(async (updates) => {
        if (!updateProfile) {
            throw new Error('Unable to update profile - update function not available');
        }

        setError(null);

        try {
            await updateProfile(updates);
            console.log('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
            setError(error.message);
            throw error;
        }
    }, [updateProfile]);

    // Refresh profile using context method
    const refresh = useCallback(async () => {
        if (refreshProfile) {
            try {
                await refreshProfile();
            } catch (error) {
                console.error('Failed to refresh profile:', error);
                setError(error.message);
            }
        }
    }, [refreshProfile]);

    return {
        // Profile data
        userProfile,
        
        // Loading states - prioritize context states
        isLoading,
        isSaving: isUpdating,
        error: error || contextError, // Local error takes precedence
        
        // Edit state
        isEditing,
        editForm,
        
        // Actions
        startEditing,
        cancelEditing,
        saveProfile,
        updateFormField,
        setEditForm,
        
        // Direct update function
        updateProfile: updateProfileDirect,
        
        // Profile management
        refreshProfile: refresh,
        
        // Helper computed values - use context values when available
        hasProfile: isProfileLoaded,
        displayName: contextDisplayName || getUserDisplayName(userProfile),
        email: contextEmail || getUserEmail(userProfile),
        isNewUser,
        
        // Helper function to get any field value
        getFieldValue
    };
};