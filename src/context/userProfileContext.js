// contexts/UserProfileContext.js
'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
    fetchUserData, 
    updateUserProfile, 
    createUserDocument,
    getUserDisplayName,
    getUserEmail,
    getUserAccountType,
    isUserAdmin,
    getCurrentAccountInfo,
    hasPermission
} from '../services/userService';

const UserProfileContext = createContext();

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

export const UserProfileProvider = ({ children }) => {
    const { user } = useAuth();
    
    // State management
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user profile using the service
    const fetchUserProfile = useCallback(async (userId, forceRefresh = false) => {
        if (!userId) {
            setUserProfile(null);
            setError('No user ID provided');
            return null;
        }

        // Don't refetch if we already have data and not forcing refresh
        if (userProfile && userProfile.user_id === userId && !forceRefresh) {
            return userProfile;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            console.log('Fetching user profile for:', userId);
            const { userData, error: fetchError, isNewUser } = await fetchUserData(userId);
            
            if (fetchError) {
                setError(fetchError);
                setUserProfile(null);
                return null;
            }

            if (userData) {
                setUserProfile(userData);
                console.log('User profile loaded successfully');
                return userData;
            }

            // Handle new user case
            if (isNewUser) {
                console.log('New user detected, profile will be created on first update');
                setUserProfile(null);
                return null;
            }

            return null;
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            setError(error.message);
            setUserProfile(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userProfile]);

    // Setup new user profile using the service
    const setupNewUserProfile = useCallback(async (firebaseUser, userData = {}, source = 'unknown') => {
        if (!firebaseUser?.uid) {
            throw new Error('Invalid Firebase user provided');
        }

        try {
            setIsLoading(true);
            setError(null);
            
            console.log('Setting up new user profile');
            const newProfile = await createUserDocument(firebaseUser, userData, source);
            
            setUserProfile(newProfile);
            console.log('New user profile created successfully');
            return newProfile;
        } catch (error) {
            console.error('Error setting up new user profile:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update user profile using the service
    const updateProfile = useCallback(async (updateData) => {
        if (!user?.uid) {
            throw new Error('User not authenticated');
        }

        try {
            setIsUpdating(true);
            setError(null);
            
            console.log('Updating user profile with:', updateData);
            const updatedProfile = await updateUserProfile(user.uid, updateData, user.uid);
            
            setUserProfile(updatedProfile);
            console.log('User profile updated successfully');
            return updatedProfile;
        } catch (error) {
            console.error('Error updating user profile:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, [user]);

    // Update a specific profile field
    const updateProfileField = useCallback(async (fieldName, fieldValue) => {
        return updateProfile({ [fieldName]: fieldValue });
    }, [updateProfile]);

    // Refresh current user profile
    const refreshProfile = useCallback(async () => {
        if (user?.uid) {
            return fetchUserProfile(user.uid, true);
        }
        return null;
    }, [user, fetchUserProfile]);

    // Clear profile state
    const clearProfile = useCallback(() => {
        setUserProfile(null);
        setError(null);
        setIsLoading(false);
        setIsUpdating(false);
    }, []);

    // Load profile when user changes
    useEffect(() => {
        if (user?.uid) {
            console.log('User changed, loading profile for:', user.uid);
            fetchUserProfile(user.uid);
        } else {
            console.log('No user, clearing profile');
            clearProfile();
        }
    }, [user, fetchUserProfile, clearProfile]);

    // Computed values using helper functions from service
    const displayName = userProfile ? getUserDisplayName(userProfile) : '';
    const email = userProfile ? getUserEmail(userProfile) : '';
    const accountType = userProfile ? getUserAccountType(userProfile) : 'individual';
    const isAdmin = userProfile ? isUserAdmin(userProfile) : false;
    const currentAccount = userProfile ? getCurrentAccountInfo(userProfile) : null;
    const hasAdminPermission = userProfile ? hasPermission(userProfile) : false;

    const value = {
        // State
        userProfile,
        isLoading,
        isUpdating,
        error,
        
        // Actions
        fetchUserProfile,
        updateProfile,
        updateProfileField,
        setupNewUserProfile,
        refreshProfile,
        clearProfile,
        
        // Computed values
        displayName,
        email,
        accountType,
        isAdmin,
        currentAccount,
        hasAdminPermission,
        
        // Utility methods
        isNewUser: !userProfile && !isLoading && !error,
        isProfileLoaded: !!userProfile,
        
        // Legacy compatibility (if needed)
        updateUserProfile: updateProfile, // alias for backward compatibility
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
};