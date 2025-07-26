// context/slices/authSlice.js

import { useReducer, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    currentUser: null,
    userProfile: null, // Complete user profile from Firestore
    isAuthenticated: false,
    accountType: null,
    loading: true,
    error: null,
    isInitialized: false,
    profileLoaded: false,
    pendingRegistration: false,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'AUTH_LOADING':
            return { ...state, loading: true, error: null };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                currentUser: action.payload.user,
                userProfile: action.payload.profile,
                accountType: action.payload.accountType,
                isAuthenticated: true,
                loading: false,
                error: null,
                isInitialized: true,
                profileLoaded: true,
                pendingRegistration: false,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                currentUser: null,
                userProfile: null,
                isAuthenticated: false,
                accountType: null,
                loading: false,
                error: action.payload,
                isInitialized: true,
                profileLoaded: false,
                pendingRegistration: false,
            };
        case 'AUTH_LOGOUT':
            return {
                ...initialState,
                loading: false,
                isInitialized: true,
                profileLoaded: false,
                pendingRegistration: false,
            };
        case 'CLEAR_AUTH_STATE':
            return {
                ...initialState,
                loading: false,
                isInitialized: true,
                profileLoaded: false,
                pendingRegistration: false,
            };
        case 'RESTORE_AUTH':
            return {
                ...state,
                currentUser: action.payload.user,
                userProfile: action.payload.profile,
                accountType: action.payload.accountType,
                isAuthenticated: true,
                loading: false,
                error: null,
                isInitialized: true,
                profileLoaded: true,
                pendingRegistration: false,
            };
        case 'AUTH_PARTIAL':
            return {
                ...state,
                currentUser: action.payload.user,
                userProfile: null,
                accountType: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                isInitialized: true,
                profileLoaded: false,
                pendingRegistration: true,
            };
        case 'PROFILE_REFRESH_START':
            return {
                ...state,
                loading: true,
                error: null,
            };
        case 'PROFILE_REFRESH_SUCCESS':
            return {
                ...state,
                userProfile: action.payload.profile,
                accountType: action.payload.accountType,
                currentUser: action.payload.user || state.currentUser,
                loading: false,
                error: null,
                profileLoaded: true,
            };
        case 'PROFILE_REFRESH_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
};

export const useAuth = () => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        console.log('🔐 Setting up auth state listener');
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                dispatch({ type: 'AUTH_LOADING' });
                try {
                    if (user) {
                        console.log('👤 User detected:', {
                            uid: user.uid,
                            email: user.email,
                            emailVerified: user.emailVerified
                        });

                        // Check if email is verified
                        if (!user.emailVerified) {
                            console.log('📧 User email not verified, setting partial auth state');
                            dispatch({
                                type: 'AUTH_PARTIAL',
                                payload: {
                                    user: { 
                                        uid: user.uid, 
                                        email: user.email, 
                                        displayName: user.displayName,
                                        emailVerified: false
                                    }
                                }
                            });
                            return;
                        }

                        // Email is verified, proceed with full authentication
                        console.log('✅ User email verified, proceeding with full auth');
                        
                        const profileResult = await firestoreService.getUserProfile(user.uid);
                        if (profileResult.success) {
                            console.log('📋 User profile loaded:', profileResult.data);
                            
                            // Create enhanced user object with profile data
                            const enhancedUser = {
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName || profileResult.data.displayName || profileResult.data.name,
                                emailVerified: true,
                                // Add profile fields to user object for easy access
                                firstName: profileResult.data.firstName,
                                lastName: profileResult.data.lastName,
                                name: profileResult.data.name || profileResult.data.displayName || user.displayName,
                                organizationName: profileResult.data.organizationName,
                                organizationId: profileResult.data.organizationId,
                                role: profileResult.data.role,
                            };

                            dispatch({
                                type: 'AUTH_SUCCESS',
                                payload: {
                                    user: enhancedUser,
                                    profile: profileResult.data,
                                    accountType: profileResult.data.accountType || 'individual',
                                },
                            });
                        } else {
                            console.log('📝 Creating user profile...');
                            const profileData = {
                                user_id: user.uid,
                                email: user.email,
                                displayName: user.displayName,
                                name: user.displayName,
                                accountType: 'individual',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            };

                            const createProfileResult = await firestoreService.createOrUpdateUserProfile(profileData);
                            if (createProfileResult.success) {
                                const enhancedUser = {
                                    uid: user.uid,
                                    email: user.email,
                                    displayName: user.displayName,
                                    emailVerified: true,
                                    name: user.displayName,
                                };

                                dispatch({
                                    type: 'AUTH_SUCCESS',
                                    payload: {
                                        user: enhancedUser,
                                        profile: createProfileResult.data,
                                        accountType: createProfileResult.data.accountType || 'individual',
                                    },
                                });
                            } else {
                                throw new Error('Failed to create user profile: ' + createProfileResult.error.message);
                            }
                        }
                    } else {
                        console.log('🚪 No user detected, setting logout state');
                        dispatch({ type: 'AUTH_LOGOUT' });
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Authentication failed' });
                    toast.error(error.message || 'Authentication failed', { duration: 6000 });
                }
            },
            (error) => {
                console.error('Auth state listener error:', error);
                dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Authentication failed' });
                toast.error(error.message || 'Authentication failed', { duration: 6000 });
            }
        );

        return () => {
            console.log('🧹 Cleaning up auth state listener');
            unsubscribe();
        };
    }, []);

    const actions = {
        initializeAuth: () => {
            if (state.isInitialized) {
                console.log('🔄 Auth already initialized, skipping');
                return;
            }
            dispatch({ type: 'AUTH_LOADING' });
        },
        signOut: async () => {
            try {
                console.log('🚪 Signing out user');
                await signOut(auth);
                dispatch({ type: 'AUTH_LOGOUT' });
                firestoreService.cleanup();
                console.log('✅ Sign-out successful');
            } catch (error) {
                console.error('Sign-out error:', error);
                dispatch({ type: 'AUTH_ERROR', payload: error.message || 'Failed to sign out' });
                toast.error(error.message || 'Failed to sign out', { duration: 6000 });
                throw error;
            }
        },
        clearAuthState: () => {
            console.log('🧹 Clearing auth state');
            dispatch({ type: 'CLEAR_AUTH_STATE' });
            firestoreService.cleanup();
        },
        restoreAuth: (payload) => {
            console.log('🔄 Restoring auth state', payload);
            dispatch({ type: 'RESTORE_AUTH', payload });
        },
        completeEmailVerification: async () => {
            try {
                console.log('📧 Completing email verification...');
                if (auth.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                        console.log('✅ Email verification completed, auth state will update automatically');
                        return { success: true };
                    } else {
                        throw new Error('Email verification not detected');
                    }
                } else {
                    throw new Error('No current user found');
                }
            } catch (error) {
                console.error('Email verification completion error:', error);
                dispatch({ type: 'AUTH_ERROR', payload: error.message });
                return { success: false, error: error.message };
            }
        },
        refreshUserProfile: async () => {
            try {
                console.log('🔄 Refreshing user profile...');
                dispatch({ type: 'PROFILE_REFRESH_START' });
                
                if (!auth.currentUser?.uid) {
                    throw new Error('No authenticated user found');
                }

                const profileResult = await firestoreService.getUserProfile(auth.currentUser.uid);
                if (profileResult.success) {
                    console.log('✅ User profile refreshed:', profileResult.data);
                    
                    // Create enhanced user object with updated profile data
                    const enhancedUser = {
                        uid: auth.currentUser.uid,
                        email: auth.currentUser.email,
                        displayName: auth.currentUser.displayName || profileResult.data.displayName || profileResult.data.name,
                        emailVerified: auth.currentUser.emailVerified,
                        firstName: profileResult.data.firstName,
                        lastName: profileResult.data.lastName,
                        name: profileResult.data.name || profileResult.data.displayName || auth.currentUser.displayName,
                        organizationName: profileResult.data.organizationName,
                        organizationId: profileResult.data.organizationId,
                        role: profileResult.data.role,
                    };
                    
                    dispatch({
                        type: 'PROFILE_REFRESH_SUCCESS',
                        payload: {
                            user: enhancedUser,
                            profile: profileResult.data,
                            accountType: profileResult.data.accountType || 'individual',
                        },
                    });
                    return { success: true, data: profileResult.data };
                } else {
                    throw new Error(profileResult.error?.message || 'Failed to fetch user profile');
                }
            } catch (error) {
                console.error('Profile refresh error:', error);
                dispatch({ type: 'PROFILE_REFRESH_ERROR', payload: error.message });
                throw error;
            }
        }
    };

    return { state, actions };
};