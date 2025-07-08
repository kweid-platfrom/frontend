/* eslint-disable react-hooks/exhaustive-deps */
// hooks/useUserProfile.js - FIXED: Works with new data structure
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { getUserDisplayName, getUserEmail } from '../services/userService';

export const useUserProfile = () => {
    const { 
        userProfile, 
        updateUserProfile,
        currentUser,
        loading
    } = useAuth();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
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
        if (!updateUserProfile || !currentUser?.uid) {
            const errorMsg = 'Unable to update profile - user not authenticated';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        setIsUpdating(true);
        setError(null);

        try {
            await updateUserProfile(currentUser.uid, editForm);
            setIsEditing(false);
            console.log('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, [editForm, updateUserProfile, currentUser]);

    const updateFormField = useCallback((field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Direct update function that bypasses the form
    const updateProfile = useCallback(async (updates) => {
        if (!updateUserProfile || !currentUser?.uid) {
            throw new Error('Unable to update profile - user not authenticated');
        }

        setIsUpdating(true);
        setError(null);

        try {
            await updateUserProfile(currentUser.uid, updates);
            console.log('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, [updateUserProfile, currentUser]);

    return {
        // Profile data
        userProfile,
        
        // Loading states
        isLoading: loading,
        isSaving: isUpdating,
        error,
        
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
        updateProfile,
        
        // Helper computed values
        hasProfile: !!userProfile,
        displayName: getUserDisplayName(userProfile),
        email: getUserEmail(userProfile),
        isNewUser: !userProfile && !loading && !error,
        
        // Helper function to get any field value
        getFieldValue
    };
};