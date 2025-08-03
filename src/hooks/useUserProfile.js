/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import firestoreService from '../services/firestoreService';

/**
 * Custom hook for managing user profile data
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to automatically fetch profile on mount
 * @param {boolean} options.realtime - Whether to use real-time subscriptions
 * @param {string} options.userId - Specific user ID to fetch (defaults to current user)
 * @returns {Object} - User profile state and methods
 */
export const useUserProfile = (options = {}) => {
    const {
        autoFetch = true,
        realtime = true,
        userId = null
    } = options;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    
    const unsubscribeRef = useRef(null);
    const mountedRef = useRef(true);

    // Handle authentication state changes
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (mountedRef.current) {
                setIsAuthenticated(!!user);
                setAuthLoading(false);
                
                if (!user) {
                    setProfile(null);
                    setError(null);
                }
            }
        });

        return () => {
            unsubscribeAuth();
        };
    }, []);

    // Fetch user profile (one-time)
    const fetchProfile = useCallback(async (targetUserId = null) => {
        if (!isAuthenticated && !targetUserId) {
            setError({ message: 'User must be authenticated' });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await firestoreService.getUserProfile(targetUserId || userId);
            
            if (mountedRef.current) {
                if (result.success) {
                    setProfile(result.data);
                    setError(null);
                } else {
                    setError(result.error);
                    setProfile(null);
                }
            }
        } catch (err) {
            if (mountedRef.current) {
                setError({ message: 'Failed to fetch user profile' });
                setProfile(null);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated, userId]);

    // Subscribe to real-time profile updates
    const subscribeToProfile = useCallback((targetUserId = null) => {
        if (!isAuthenticated && !targetUserId) {
            setError({ message: 'User must be authenticated' });
            return;
        }

        setLoading(true);
        setError(null);

        // Clean up previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        const unsubscribe = firestoreService.subscribeToUserProfile(
            targetUserId || userId,
            (profileData) => {
                if (mountedRef.current) {
                    setProfile(profileData);
                    setError(null);
                    setLoading(false);
                }
            },
            (error) => {
                if (mountedRef.current) {
                    setError(error.error || error);
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        unsubscribeRef.current = unsubscribe;
    }, [isAuthenticated, userId]);

    // Update profile
    const updateProfile = useCallback(async (updates) => {
        if (!isAuthenticated) {
            setError({ message: 'User must be authenticated' });
            return { success: false, error: { message: 'User must be authenticated' } };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await firestoreService.createOrUpdateUserProfile(updates);
            
            if (mountedRef.current) {
                if (result.success) {
                    // If not using real-time updates, manually update the profile
                    if (!realtime) {
                        setProfile(result.data);
                    }
                    setError(null);
                } else {
                    setError(result.error);
                }
            }
            
            return result;
        } catch (err) {
            const error = { message: 'Failed to update user profile' };
            if (mountedRef.current) {
                setError(error);
            }
            return { success: false, error };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated, realtime]);

    // Update specific profile fields
    const updateProfileFields = useCallback(async (fields) => {
        if (!isAuthenticated) {
            setError({ message: 'User must be authenticated' });
            return { success: false, error: { message: 'User must be authenticated' } };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await firestoreService.updateUserProfileFields(fields);
            
            if (mountedRef.current) {
                if (result.success) {
                    // If not using real-time updates, refresh the profile
                    if (!realtime) {
                        await fetchProfile();
                    }
                    setError(null);
                } else {
                    setError(result.error);
                }
            }
            
            return result;
        } catch (err) {
            const error = { message: 'Failed to update profile fields' };
            if (mountedRef.current) {
                setError(error);
            }
            return { success: false, error };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated, realtime, fetchProfile]);

    // Get full profile with memberships
    const getFullProfile = useCallback(async () => {
        if (!isAuthenticated) {
            setError({ message: 'User must be authenticated' });
            return { success: false, error: { message: 'User must be authenticated' } };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await firestoreService.getCurrentUserFullProfile();
            
            if (mountedRef.current) {
                if (result.success) {
                    setProfile(result.data);
                    setError(null);
                } else {
                    setError(result.error);
                }
            }
            
            return result;
        } catch (err) {
            const error = { message: 'Failed to fetch full user profile' };
            if (mountedRef.current) {
                setError(error);
            }
            return { success: false, error };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [isAuthenticated]);

    // Refresh profile data
    const refreshProfile = useCallback(() => {
        if (realtime) {
            subscribeToProfile();
        } else {
            fetchProfile();
        }
    }, [realtime, subscribeToProfile, fetchProfile]);

    // Initialize profile fetching
    useEffect(() => {
        if (!authLoading && autoFetch) {
            if (realtime) {
                subscribeToProfile();
            } else {
                fetchProfile();
            }
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [authLoading, autoFetch, realtime, subscribeToProfile, fetchProfile]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    return {
        // State
        profile,
        loading: loading || authLoading,
        error,
        isAuthenticated,
        
        // Methods
        fetchProfile,
        updateProfile,
        updateProfileFields,
        getFullProfile,
        refreshProfile,
        
        // Utility
        clearError: () => setError(null)
    };
};

/**
 * Hook for managing user profile display data with formatting
 * @param {Object} options - Configuration options
 * @returns {Object} - Formatted profile data and state
 */
export const useUserProfileDisplay = (options = {}) => {
    const profileHook = useUserProfile(options);
    const { profile, ...rest } = profileHook;

    // Format profile data for display
    const displayProfile = profile ? {
        id: profile.id,
        displayName: profile.display_name || profile.email?.split('@')[0] || 'Unknown User',
        email: profile.email || '',
        profilePicture: profile.profile_picture || null,
        initials: getInitials(profile.display_name || profile.email || ''),
        accountType: profile.account_type || 'individual',
        preferences: profile.preferences || {},
        contactInfo: profile.contact_info || {},
        joinDate: profile.created_at ? new Date(profile.created_at.seconds * 1000) : null,
        lastUpdated: profile.updated_at ? new Date(profile.updated_at.seconds * 1000) : null,
        isComplete: isProfileComplete(profile),
        memberships: profile.memberships || { organizations: [] }
    } : null;

    return {
        ...rest,
        profile: displayProfile,
        rawProfile: profile
    };
};

// Helper functions
function getInitials(name) {
    if (!name) return '?';
    
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

function isProfileComplete(profile) {
    if (!profile) return false;
    
    const requiredFields = ['display_name', 'email'];
    return requiredFields.every(field => profile[field] && profile[field].trim() !== '');
}

export default useUserProfile;