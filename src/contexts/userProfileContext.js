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

            if (window.isRegistering) {
                console.log('Skipping profile fetch due to registration in progress:', userId);
                setUserProfile(null);
                setIsLoading(false);
                return null;
            }

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
                    if (fetchError.includes('Permission denied')) {
                        setError('Permission denied. Please check your authentication.');
                        setUserProfile(null);
                        return null;
                    }
                    if (fetchError.includes('timed out') && retryCount < maxRetries) {
                        console.log(`Retrying fetch due to timeout (${retryCount + 1}/${maxRetries})`);
                        setRetryCount((prev) => prev + 1);
                        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                        retryTimeoutRef.current = setTimeout(() => {
                            fetchUserProfile(userId, forceRefresh);
                        }, delay);
                        return null;
                    }
                    setError(fetchError);
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
                    setError('User profile not found. Please complete registration.');
                    return null;
                }

                return null;
            } catch (error) {
                console.error('Error in fetchUserProfile:', error);
                if (
                    retryCount < maxRetries &&
                    (error.message.includes('network') ||
                        error.message.includes('timeout') ||
                        error.code === 'unavailable')
                ) {
                    console.log(`Retrying fetch due to network error (${retryCount + 1}/${maxRetries})`);
                    setRetryCount((prev) => prev + 1);
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
                const newProfile = await createUserDocument(firebaseUser, userData, source);
                setUserProfile(newProfile);
                setRetryCount(0);
                console.log('New user profile created successfully:', newProfile);
                return newProfile;
            } catch (error) {
                console.error('Error setting up new user profile:', error);
                setError(error.message);
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
                const currentProfile = userProfile;
                if (currentProfile) {
                    const optimisticProfile = { ...currentProfile, ...updateData };
                    setUserProfile(optimisticProfile);
                }
                console.log('Updating user profile with:', updateData);
                const updatedProfile = await updateUserProfile(user.uid, updateData, user.uid);
                setUserProfile(updatedProfile);
                console.log('User profile updated successfully:', updatedProfile);
                return updatedProfile;
            } catch (error) {
                console.error('Error updating user profile:', error);
                if (userProfile) {
                    setUserProfile(userProfile);
                }
                setError(error.message);
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
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        const userId = user?.uid;
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
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

    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    const displayName = useMemo(() => {
        if (!userProfile) return '';
        const name = getUserDisplayName(userProfile);
        return name || user?.email || '';
    }, [userProfile, user]);

    const avatarInitials = useMemo(() => {
        if (!userProfile) return user?.email?.slice(0, 2).toUpperCase() || '';
        const { firstName, lastName, email } = userProfile;
        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`.toUpperCase();
        } else if (firstName) {
            return firstName.slice(0, 2).toUpperCase();
        } else if (lastName) {
            return lastName.slice(0, 2).toUpperCase();
        }
        return email?.slice(0, 2).toUpperCase() || '';
    }, [userProfile, user]);

    const value = useMemo(
        () => ({
            userProfile,
            isLoading,
            isUpdating,
            error,
            retryCount,
            fetchUserProfile,
            updateProfile,
            updateProfileField,
            setupNewUserProfile,
            refreshProfile,
            clearProfile,
            displayName,
            avatarInitials,
            email: userProfile ? getUserEmail(userProfile) : user?.email || '',
            accountType: userProfile ? getUserAccountType(userProfile) : 'individual',
            isAdmin: userProfile ? isUserAdmin(userProfile) : false,
            currentAccount: userProfile ? getCurrentAccountInfo(userProfile) : null,
            hasAdminPermission: userProfile ? hasPermission(userProfile) : false,
            isNewUser: !userProfile && !isLoading && !error,
            isProfileLoaded: !!userProfile,
            canRetry: retryCount < maxRetries && !!error,
            updateUserProfile: updateProfile,
        }),
        [userProfile, isLoading, isUpdating, error, retryCount, fetchUserProfile, updateProfile, updateProfileField, setupNewUserProfile, refreshProfile, clearProfile, displayName, avatarInitials, user],
    );

    return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};