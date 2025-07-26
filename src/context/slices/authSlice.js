// Enhanced authSlice.js with organization support

import { useReducer, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    currentUser: null,
    isAuthenticated: false,
    accountType: null,
    loading: true,
    error: null,
    isInitialized: false,
    profileLoaded: false,
    // Enhanced user profile data
    userProfile: null,
    displayInfo: {
        name: null,
        email: null,
        profilePicture: null,
        accountType: null
    },
    // Organization data
    organizations: [],
    activeOrganization: null,
    organizationMemberships: [],
    isOrganizationOwner: false,
    organizationLoading: false,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'AUTH_LOADING':
            return { ...state, loading: true, error: null };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                currentUser: action.payload.user,
                accountType: action.payload.accountType,
                isAuthenticated: true,
                loading: false,
                error: null,
                isInitialized: true,
                profileLoaded: true,
                userProfile: action.payload.userProfile || null,
                displayInfo: action.payload.displayInfo || state.displayInfo,
                organizations: action.payload.organizations || [],
                activeOrganization: action.payload.activeOrganization || null,
                organizationMemberships: action.payload.organizationMemberships || [],
                isOrganizationOwner: action.payload.isOrganizationOwner || false,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                currentUser: null,
                isAuthenticated: false,
                accountType: null,
                loading: false,
                error: action.payload,
                isInitialized: true,
                profileLoaded: false,
                userProfile: null,
                displayInfo: initialState.displayInfo,
                organizations: [],
                activeOrganization: null,
                organizationMemberships: [],
                isOrganizationOwner: false,
            };
        case 'AUTH_LOGOUT':
            return {
                ...initialState,
                loading: false,
                isInitialized: true,
            };
        case 'CLEAR_AUTH_STATE':
            return {
                ...initialState,
                loading: false,
                isInitialized: true,
            };
        case 'RESTORE_AUTH':
            return {
                ...state,
                currentUser: action.payload.user,
                accountType: action.payload.accountType,
                isAuthenticated: true,
                loading: false,
                error: null,
                isInitialized: true,
                profileLoaded: true,
                userProfile: action.payload.userProfile || state.userProfile,
                displayInfo: action.payload.displayInfo || state.displayInfo,
                organizations: action.payload.organizations || state.organizations,
                activeOrganization: action.payload.activeOrganization || state.activeOrganization,
                organizationMemberships: action.payload.organizationMemberships || state.organizationMemberships,
                isOrganizationOwner: action.payload.isOrganizationOwner || state.isOrganizationOwner,
            };
        case 'AUTH_PARTIAL':
            return {
                ...state,
                currentUser: action.payload.user,
                accountType: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                isInitialized: true,
                profileLoaded: false,
                userProfile: null,
                displayInfo: {
                    name: action.payload.user?.email?.split('@')[0] || 'User',
                    email: action.payload.user?.email || null,
                    profilePicture: null,
                    accountType: null
                },
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
                accountType: action.payload.accountType,
                loading: false,
                error: null,
                profileLoaded: true,
                userProfile: action.payload.userProfile || state.userProfile,
                displayInfo: action.payload.displayInfo || state.displayInfo,
                organizations: action.payload.organizations !== undefined ? action.payload.organizations : state.organizations,
                activeOrganization: action.payload.activeOrganization !== undefined ? action.payload.activeOrganization : state.activeOrganization,
                organizationMemberships: action.payload.organizationMemberships !== undefined ? action.payload.organizationMemberships : state.organizationMemberships,
                isOrganizationOwner: action.payload.isOrganizationOwner !== undefined ? action.payload.isOrganizationOwner : state.isOrganizationOwner,
            };
        case 'PROFILE_REFRESH_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case 'ORGANIZATION_LOADING':
            return {
                ...state,
                organizationLoading: true,
            };
        case 'ORGANIZATION_SUCCESS':
            return {
                ...state,
                organizations: action.payload.organizations || state.organizations,
                activeOrganization: action.payload.activeOrganization !== undefined ? action.payload.activeOrganization : state.activeOrganization,
                organizationMemberships: action.payload.organizationMemberships || state.organizationMemberships,
                isOrganizationOwner: action.payload.isOrganizationOwner !== undefined ? action.payload.isOrganizationOwner : state.isOrganizationOwner,
                organizationLoading: false,
                displayInfo: {
                    ...state.displayInfo,
                    organizationName: action.payload.activeOrganization?.name || state.displayInfo.organizationName
                },
            };
        case 'ORGANIZATION_ERROR':
            return {
                ...state,
                organizationLoading: false,
                error: action.payload,
            };
        case 'UPDATE_DISPLAY_INFO':
            return {
                ...state,
                displayInfo: {
                    ...state.displayInfo,
                    ...action.payload
                },
                userProfile: action.payload.userProfile || state.userProfile,
            };
        case 'SET_ACTIVE_ORGANIZATION':
            return {
                ...state,
                activeOrganization: action.payload.organization,
                isOrganizationOwner: action.payload.isOwner || false,
                displayInfo: {
                    ...state.displayInfo,
                    organizationName: action.payload.organization?.name || null
                },
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
                        
                        // Get comprehensive user profile with organizations
                        const profileResult = await firestoreService.getUserProfileWithOrganizations(user.uid);
                        
                        if (profileResult.success) {
                            const userData = profileResult.data;
                            
                            dispatch({
                                type: 'AUTH_SUCCESS',
                                payload: {
                                    user: { 
                                        uid: user.uid, 
                                        email: user.email, 
                                        displayName: user.displayName,
                                        emailVerified: true
                                    },
                                    accountType: userData.account_type || 'individual',
                                    userProfile: userData,
                                    displayInfo: {
                                        name: userData.displayInfo.name,
                                        email: userData.displayInfo.email,
                                        profilePicture: userData.profile_picture || null,
                                        accountType: userData.displayInfo.accountType,
                                        organizationName: userData.displayInfo.organizationName
                                    },
                                    organizations: userData.organizations || [],
                                    activeOrganization: userData.activeOrganization,
                                    organizationMemberships: userData.organizationMemberships || [],
                                    isOrganizationOwner: userData.displayInfo.isOrganizationOwner || false,
                                },
                            });
                        } else {
                            console.log('📝 Creating user profile...');
                            const createProfileResult = await firestoreService.createOrUpdateUserProfile({
                                user_id: user.uid,
                                email: user.email,
                                display_name: user.displayName || user.email?.split('@')[0] || 'User',
                                account_type: 'individual',
                            });
                            
                            if (createProfileResult.success) {
                                dispatch({
                                    type: 'AUTH_SUCCESS',
                                    payload: {
                                        user: { 
                                            uid: user.uid, 
                                            email: user.email, 
                                            displayName: user.displayName,
                                            emailVerified: true
                                        },
                                        accountType: createProfileResult.data.account_type || 'individual',
                                        userProfile: createProfileResult.data,
                                        displayInfo: {
                                            name: createProfileResult.data.display_name || user.email?.split('@')[0] || 'User',
                                            email: user.email,
                                            profilePicture: createProfileResult.data.profile_picture || null,
                                            accountType: createProfileResult.data.account_type || 'individual',
                                            organizationName: null
                                        },
                                        organizations: [],
                                        activeOrganization: null,
                                        organizationMemberships: [],
                                        isOrganizationOwner: false,
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
            console.log('🔄 Restoring auth state');
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

                const profileResult = await firestoreService.getUserProfileWithOrganizations(auth.currentUser.uid);
                if (profileResult.success) {
                    const userData = profileResult.data;
                    
                    dispatch({
                        type: 'PROFILE_REFRESH_SUCCESS',
                        payload: {
                            accountType: userData.account_type || 'individual',
                            userProfile: userData,
                            displayInfo: {
                                name: userData.displayInfo.name,
                                email: userData.displayInfo.email,
                                profilePicture: userData.profile_picture || null,
                                accountType: userData.displayInfo.accountType,
                                organizationName: userData.displayInfo.organizationName
                            },
                            organizations: userData.organizations || [],
                            activeOrganization: userData.activeOrganization,
                            organizationMemberships: userData.organizationMemberships || [],
                            isOrganizationOwner: userData.displayInfo.isOrganizationOwner || false,
                        },
                    });
                    console.log('✅ User profile refreshed successfully');
                    return { success: true, data: userData };
                } else {
                    throw new Error(profileResult.error?.message || 'Failed to fetch user profile');
                }
            } catch (error) {
                console.error('Profile refresh error:', error);
                dispatch({ type: 'PROFILE_REFRESH_ERROR', payload: error.message });
                throw error;
            }
        },

        loadOrganizations: async () => {
            try {
                console.log('🏢 Loading user organizations...');
                dispatch({ type: 'ORGANIZATION_LOADING' });
                
                if (!auth.currentUser?.uid) {
                    throw new Error('No authenticated user found');
                }

                const profileResult = await firestoreService.getUserProfileWithOrganizations(auth.currentUser.uid);
                if (profileResult.success) {
                    const userData = profileResult.data;
                    
                    dispatch({
                        type: 'ORGANIZATION_SUCCESS',
                        payload: {
                            organizations: userData.organizations || [],
                            activeOrganization: userData.activeOrganization,
                            organizationMemberships: userData.organizationMemberships || [],
                            isOrganizationOwner: userData.displayInfo.isOrganizationOwner || false,
                        },
                    });
                    console.log('✅ Organizations loaded successfully');
                    return { success: true, data: userData };
                } else {
                    throw new Error(profileResult.error?.message || 'Failed to load organizations');
                }
            } catch (error) {
                console.error('Load organizations error:', error);
                dispatch({ type: 'ORGANIZATION_ERROR', payload: error.message });
                throw error;
            }
        },

        setActiveOrganization: async (orgId) => {
            try {
                console.log('🏢 Setting active organization:', orgId);
                dispatch({ type: 'ORGANIZATION_LOADING' });
                
                const result = await firestoreService.setActiveOrganization(orgId);
                if (result.success) {
                    const organization = result.data;
                    const isOwner = organization.ownerId === auth.currentUser?.uid;
                    
                    dispatch({
                        type: 'SET_ACTIVE_ORGANIZATION',
                        payload: {
                            organization,
                            isOwner
                        }
                    });
                    
                    console.log('✅ Active organization set successfully');
                    return { success: true, data: organization };
                } else {
                    throw new Error(result.error?.message || 'Failed to set active organization');
                }
            } catch (error) {
                console.error('Set active organization error:', error);
                dispatch({ type: 'ORGANIZATION_ERROR', payload: error.message });
                throw error;
            }
        },

        updateDisplayInfo: async (displayData) => {
            try {
                console.log('👤 Updating display info...');
                
                const result = await firestoreService.updateUserDisplayInfo(displayData);
                if (result.success) {
                    dispatch({
                        type: 'UPDATE_DISPLAY_INFO',
                        payload: {
                            name: displayData.display_name || state.displayInfo.name,
                            profilePicture: displayData.profile_picture || state.displayInfo.profilePicture,
                            userProfile: result.data
                        }
                    });
                    
                    console.log('✅ Display info updated successfully');
                    return { success: true, data: result.data };
                } else {
                    throw new Error(result.error?.message || 'Failed to update display info');
                }
            } catch (error) {
                console.error('Update display info error:', error);
                toast.error(error.message || 'Failed to update display info', { duration: 6000 });
                throw error;
            }
        }
    };

    return { state, actions };
};