// contexts/UserProfileContext.js - Enhanced with better error handling
'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
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
    const [retryCount, setRetryCount] = useState(0);
    
    // Ref to track the current user ID and prevent unnecessary fetches
    const currentUserIdRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const maxRetries = 3;

    // Enhanced fetch with retry logic and better error handling
    const fetchUserProfile = useCallback(async (userId, forceRefresh = false) => {
        if (!userId) {
            setUserProfile(null);
            setError('No user ID provided');
            setIsLoading(false);
            return null;
        }

        // CRITICAL: Skip fetch during registration
        if (window.isRegistering) {
            console.log('Skipping profile fetch due to registration in progress:', userId);
            setUserProfile(null);
            setIsLoading(false);
            return null;
        }

        // Don't refetch if we already have data and not forcing refresh
        if (userProfile && userProfile.user_id === userId && !forceRefresh) {
            console.log('Using cached user profile for:', userId);
            return userProfile;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            console.log('Fetching user profile for:', userId, 'Attempt:', retryCount + 1);
            const { userData, error: fetchError, isNewUser } = await fetchUserData(userId);
            
            if (fetchError) {
                console.error('Fetch error:', fetchError);
                
                // Handle specific error types
                if (fetchError.includes('Permission denied')) {
                    setError('Permission denied. Please check your authentication.');
                    setUserProfile(null);
                    return null;
                }
                
                if (fetchError.includes('timed out')) {
                    if (retryCount < maxRetries) {
                        console.log(`Retrying fetch due to timeout (${retryCount + 1}/${maxRetries})`);
                        setRetryCount(prev => prev + 1);
                        
                        // Exponential backoff
                        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                        retryTimeoutRef.current = setTimeout(() => {
                            fetchUserProfile(userId, forceRefresh);
                        }, delay);
                        
                        return null;
                    }
                }
                
                setError(fetchError);
                setUserProfile(null);
                return null;
            }

            if (userData) {
                setUserProfile(userData);
                setRetryCount(0); // Reset retry count on success
                console.log('User profile loaded successfully');
                return userData;
            }

            // Handle new user case - but don't create profile here
            if (isNewUser) {
                console.log('New user detected, profile not found');
                setUserProfile(null);
                setError('User profile not found. Please complete registration.');
                return null;
            }

            return null;
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            
            // Retry on network errors
            if (retryCount < maxRetries && (
                error.message.includes('network') || 
                error.message.includes('timeout') ||
                error.code === 'unavailable'
            )) {
                console.log(`Retrying fetch due to network error (${retryCount + 1}/${maxRetries})`);
                setRetryCount(prev => prev + 1);
                
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                retryTimeoutRef.current = setTimeout(() => {
                    fetchUserProfile(userId, forceRefresh);
                }, delay);
                
                return null;
            }
            
            setError(error.message);
            setUserProfile(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userProfile, retryCount]);

    // Enhanced setup with better error handling
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
            setRetryCount(0);
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

    // Enhanced update with optimistic updates
    const updateProfile = useCallback(async (updateData) => {
        if (!user?.uid) {
            throw new Error('User not authenticated');
        }

        try {
            setIsUpdating(true);
            setError(null);
            
            // Optimistic update
            const currentProfile = userProfile;
            if (currentProfile) {
                const optimisticProfile = { ...currentProfile, ...updateData };
                setUserProfile(optimisticProfile);
            }
            
            console.log('Updating user profile with:', updateData);
            const updatedProfile = await updateUserProfile(user.uid, updateData, user.uid);
            
            setUserProfile(updatedProfile);
            console.log('User profile updated successfully');
            return updatedProfile;
        } catch (error) {
            console.error('Error updating user profile:', error);
            
            // Revert optimistic update on error
            if (userProfile) {
                setUserProfile(userProfile);
            }
            
            setError(error.message);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, [user, userProfile]);

    // Update a specific profile field
    const updateProfileField = useCallback(async (fieldName, fieldValue) => {
        return updateProfile({ [fieldName]: fieldValue });
    }, [updateProfile]);

    // Refresh current user profile
    const refreshProfile = useCallback(async () => {
        if (user?.uid) {
            setRetryCount(0);
            return fetchUserProfile(user.uid, true);
        }
        return null;
    }, [user, fetchUserProfile]);

    // Clear profile state and cleanup
    const clearProfile = useCallback(() => {
        setUserProfile(null);
        setError(null);
        setIsLoading(false);
        setIsUpdating(false);
        setRetryCount(0);
        
        // Clear any pending timeouts
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }, []);

    // Enhanced effect with better user change detection
    useEffect(() => {
        const userId = user?.uid;
        
        // Clear any pending timeouts when user changes
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        
        // Only fetch if user ID actually changed and not registering
        if (userId && userId !== currentUserIdRef.current && !window.isRegistering) {
            console.log('User changed, loading profile for:', userId);
            currentUserIdRef.current = userId;
            setRetryCount(0);
            fetchUserProfile(userId);
        } else if (!userId && currentUserIdRef.current) {
            console.log('No user, clearing profile');
            currentUserIdRef.current = null;
            clearProfile();
        } else if (window.isRegistering) {
            console.log('Registration in progress, skipping profile fetch');
            setUserProfile(null);
            setIsLoading(false);
            setError(null);
        }
    }, [user?.uid, fetchUserProfile, clearProfile]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

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
        retryCount,
        
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
        canRetry: retryCount < maxRetries && !!error,
        
        // Legacy compatibility
        updateUserProfile: updateProfile,
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
};