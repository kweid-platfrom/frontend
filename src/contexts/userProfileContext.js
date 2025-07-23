'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    hasPermission,
    getAvatarInitials,
    subscribeToUserData,
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
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const currentUserIdRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const subscriptionRef = useRef(null);
    const maxRetries = 3;

    const fetchUserProfile = useCallback(
        async (userId, forceRefresh = false) => {
            if (!userId) {
                console.warn('No user ID provided for profile fetch');
                setUserProfile(null);
                setError('No user ID provided');
                setIsLoading(false);
                return null;
            }

            // Skip if registration is in progress
            if (window.isRegistering) {
                console.log('Skipping profile fetch due to registration in progress:', userId);
                setUserProfile(null);
                setIsLoading(false);
                return null;
            }

            // Return cached profile if available and not forcing refresh
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
                    
                    // Handle permission errors
                    if (fetchError.code === 'PERMISSION_DENIED' || fetchError.message.includes('Permission denied')) {
                        setError('Permission denied. Please check your authentication.');
                        setUserProfile(null);
                        return null;
                    }
                    
                    // Handle timeout and network errors with retry logic
                    if ((fetchError.code === 'FETCH_ERROR' || 
                         fetchError.message.includes('network') || 
                         fetchError.message.includes('unavailable')) && 
                         retryCount < maxRetries) {
                        console.log(`Retrying fetch due to network issue (${retryCount + 1}/${maxRetries})`);
                        setRetryCount((prev) => prev + 1);
                        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                        retryTimeoutRef.current = setTimeout(() => {
                            fetchUserProfile(userId, forceRefresh);
                        }, delay);
                        return null;
                    }
                    
                    setError(fetchError.message || 'Failed to fetch user profile');
                    setUserProfile(null);
                    return null;
                }

                if (userData) {
                    setUserProfile(userData);
                    setRetryCount(0);
                    console.log('User profile loaded successfully:', userData);
                    return userData;
                }

                if (isNewUser) {
                    console.log('New user detected, profile not found');
                    setUserProfile(null);
                    setError(null); // Don't set error for new users
                    return null;
                }

                return null;
            } catch (error) {
                console.error('Error in fetchUserProfile:', error);
                
                // Retry logic for network/service errors
                if (retryCount < maxRetries &&
                    (error.message.includes('network') ||
                     error.message.includes('timeout') ||
                     error.code === 'unavailable' ||
                     error.code === 'FETCH_ERROR')) {
                    console.log(`Retrying fetch due to service error (${retryCount + 1}/${maxRetries})`);
                    setRetryCount((prev) => prev + 1);
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                    retryTimeoutRef.current = setTimeout(() => {
                        fetchUserProfile(userId, forceRefresh);
                    }, delay);
                    return null;
                }
                
                setError(error.message || 'Failed to fetch user profile');
                setUserProfile(null);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [userProfile, retryCount],
    );

    const setupNewUserProfile = useCallback(
        async (firebaseUser, userData = {}, source = 'unknown') => {
            if (!firebaseUser?.uid) {
                throw new Error('Invalid Firebase user provided');
            }

            try {
                setIsLoading(true);
                setError(null);
                console.log('Setting up new user profile with data:', userData);
                
                const newProfile = await createUserDocument(firebaseUser, {
                    ...userData,
                    display_name: userData.displayName || firebaseUser.displayName || '',
                    profile_picture: userData.avatarURL || firebaseUser.photoURL || null,
                    environment: userData.environment || 'development',
                }, source);
                setUserProfile(newProfile);
                setRetryCount(0);
                console.log('New user profile created successfully:', newProfile);
                return newProfile;
            } catch (error) {
                console.error('Error setting up new user profile:', error);
                setError(error.message || 'Failed to create user profile');
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    const updateProfile = useCallback(
        async (updateData) => {
            if (!user?.uid) {
                throw new Error('User not authenticated');
            }

            try {
                setIsUpdating(true);
                setError(null);
                
                // Optimistic update
                const currentProfile = userProfile;
                if (currentProfile) {
                    const optimisticProfile = { ...currentProfile };
                    
                    // Apply optimistic updates to match userService schema
                    if (updateData.firstName || updateData.lastName || updateData.display_name) {
                        optimisticProfile.contact_info = {
                            ...optimisticProfile.contact_info,
                            ...(updateData.firstName && { firstName: updateData.firstName }),
                            ...(updateData.lastName && { lastName: updateData.lastName }),
                        };
                        if (updateData.display_name) {
                            optimisticProfile.display_name = updateData.display_name;
                        }
                    }
                    
                    if (updateData.email) {
                        optimisticProfile.email = updateData.email;
                    }
                    
                    if (updateData.profile_picture) {
                        optimisticProfile.profile_picture = updateData.profile_picture;
                    }
                    
                    if (updateData.bio || updateData.location || updateData.phone || updateData.timezone) {
                        optimisticProfile.contact_info = {
                            ...optimisticProfile.contact_info,
                            ...(updateData.bio && { bio: updateData.bio }),
                            ...(updateData.location && { location: updateData.location }),
                            ...(updateData.phone && { phone: updateData.phone }),
                            ...(updateData.timezone && { timezone: updateData.timezone }),
                        };
                    }
                    
                    if (updateData.email_verified !== undefined) {
                        optimisticProfile.preferences = {
                            ...optimisticProfile.preferences,
                            email_verified: updateData.email_verified,
                        };
                    }
                    
                    if (updateData.environment) {
                        optimisticProfile.preferences = {
                            ...optimisticProfile.preferences,
                            environment: updateData.environment,
                        };
                    }
                    
                    if (updateData.organizationId) {
                        optimisticProfile.preferences = {
                            ...optimisticProfile.preferences,
                            organizationId: updateData.organizationId,
                        };
                    }
                    
                    if (updateData.account_memberships) {
                        optimisticProfile.account_memberships = updateData.account_memberships;
                    }
                    
                    setUserProfile(optimisticProfile);
                }
                
                console.log('Updating user profile with:', updateData);
                const updatedProfile = await updateUserProfile(user.uid, updateData, user.uid);
                setUserProfile(updatedProfile);
                console.log('User profile updated successfully:', updatedProfile);
                return updatedProfile;
            } catch (error) {
                console.error('Error updating user profile:', error);
                
                // Revert optimistic update on error
                if (userProfile) {
                    setUserProfile(userProfile);
                }
                
                setError(error.message || 'Failed to update user profile');
                throw error;
            } finally {
                setIsUpdating(false);
            }
        },
        [user, userProfile],
    );

    const updateProfileField = useCallback(
        async (fieldName, fieldValue) => {
            return updateProfile({ [fieldName]: fieldValue });
        },
        [updateProfile],
    );

    const refreshProfile = useCallback(
        async () => {
            if (user?.uid) {
                setRetryCount(0);
                return fetchUserProfile(user.uid, true);
            }
            return null;
        },
        [user, fetchUserProfile],
    );

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
        
        // Unsubscribe from real-time updates
        if (subscriptionRef.current) {
            subscriptionRef.current();
            subscriptionRef.current = null;
        }
    }, []);

    // Set up real-time subscription when user changes
    useEffect(() => {
        const userId = user?.uid;
        
        // Clear existing timeout and subscription
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        
        if (subscriptionRef.current) {
            subscriptionRef.current();
            subscriptionRef.current = null;
        }

        if (userId && userId !== currentUserIdRef.current && !window.isRegistering) {
            console.log('User changed, setting up real-time subscription for:', userId);
            currentUserIdRef.current = userId;
            setRetryCount(0);
            
            // Set up real-time subscription
            subscriptionRef.current = subscribeToUserData(
                userId,
                ({ userData }) => {
                    if (userData) {
                        console.log('Real-time user data update received:', userData);
                        setUserProfile(userData);
                        setError(null);
                        setIsLoading(false);
                    } else {
                        console.log('User document not found in real-time subscription');
                        setUserProfile(null);
                        setError(null);
                    }
                },
                (error) => {
                    console.error('Real-time subscription error:', error);
                    setError(error.message || 'Subscription failed');
                    
                    // Fall back to regular fetch if subscription fails
                    fetchUserProfile(userId);
                }
            );
            
            // Also do an initial fetch to populate data immediately
            fetchUserProfile(userId);
        } else if (!userId && currentUserIdRef.current) {
            console.log('No user, clearing profile');
            currentUserIdRef.current = null;
            clearProfile();
        } else if (window.isRegistering) {
            console.log('Registration in progress, skipping profile setup');
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
            if (subscriptionRef.current) {
                subscriptionRef.current();
            }
        };
    }, []);

    // Computed values with proper fallbacks
    const displayName = useMemo(() => {
        if (!userProfile) return user?.displayName || user?.email || '';
        const name = getUserDisplayName(userProfile);
        return name || user?.displayName || user?.email || '';
    }, [userProfile, user]);

    const avatarInitials = useMemo(() => {
        if (!userProfile) {
            return user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                   user?.email?.slice(0, 2).toUpperCase() || '';
        }
        return getAvatarInitials(userProfile);
    }, [userProfile, user]);

    const value = useMemo(
        () => ({
            // Core state
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
            avatarInitials,
            email: userProfile ? getUserEmail(userProfile) : user?.email || '',
            accountType: userProfile ? getUserAccountType(userProfile) : 'individual',
            isAdmin: userProfile ? isUserAdmin(userProfile) : false,
            currentAccount: userProfile ? getCurrentAccountInfo(userProfile) : null,
            hasAdminPermission: userProfile ? hasPermission(userProfile) : false,
            
            // Status flags
            isNewUser: !userProfile && !isLoading && !error && !!user?.uid,
            isProfileLoaded: !!userProfile,
            canRetry: retryCount < maxRetries && !!error,
            
            // Backward compatibility
            updateUserProfile: updateProfile,
        }),
        [
            userProfile, isLoading, isUpdating, error, retryCount,
            fetchUserProfile, updateProfile, updateProfileField, setupNewUserProfile, 
            refreshProfile, clearProfile, displayName, avatarInitials, user
        ],
    );

    return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};