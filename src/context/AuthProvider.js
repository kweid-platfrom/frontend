/* eslint-disable react-hooks/exhaustive-deps */
// Fixed AuthProvider.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

import {
    fetchUserData
} from "../services/userService";
import { updateUserProfile as updateUserProfileService } from "../services/userService";

// Import permissions service
import { 
    getUserPermissions, 
    createPermissionChecker,
    isOrganizationAccount,
    isIndividualAccount
} from "../services/permissionService";

import {
    signInWithGoogle as authSignInWithGoogle,
    logInWithEmail as authLoginWithEmail,
    logout as authLogout,
    registerWithEmail as authRegisterWithEmail,
    registerWithEmailLink as authRegisterWithEmailLink,
    completeEmailLinkSignIn as authCompleteEmailLinkSignIn,
    setUserPassword as authSetUserPassword,
    resetPassword as authResetPassword,
    confirmPasswordReset as authConfirmPasswordReset,
    resendVerificationEmail as authResendVerificationEmail,
    deleteUserAccount as authDeleteUserAccount,
    linkAuthProvider as authLinkProvider,
    unlinkAuthProvider as authUnlinkProvider,
    refreshAuthSession as authRefreshSession
} from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [skipEmailVerificationRedirect, setSkipEmailVerificationRedirect] = useState(false);
    const [permissionChecker, setPermissionChecker] = useState(null);
    
    // Add ref to track if we're already processing authentication
    const processingAuth = useRef(false);
    const lastProcessedUserId = useRef(null);
    
    const router = useRouter();

    const processUserAuthentication = useCallback(async (user) => {
        // Prevent multiple simultaneous processing
        if (processingAuth.current) {
            return;
        }
        
        // Skip if we just processed this user
        if (user?.uid === lastProcessedUserId.current) {
            return;
        }
        
        processingAuth.current = true;
        
        try {
            if (!user) {
                setCurrentUser(null);
                setUserPermissions(null);
                setUserProfile(null);
                setPermissionChecker(null);
                lastProcessedUserId.current = null;
                return;
            }
            
            lastProcessedUserId.current = user.uid;
            setCurrentUser(user);
            let authSource = 'email';
            
            if (user.providerData?.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider === 'google.com') authSource = 'google';
            }
            
            // Handle verification callback early
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                const isVerificationCallback = searchParams.get('mode') === 'verifyEmail';
                
                if (isVerificationCallback && currentPath !== "/verify-email") {
                    router.push(`/verify-email${window.location.search}`);
                    return;
                }
            }

            const result = await fetchUserData(user.uid);

            if (result.error) {
                setAuthError(result.error);
                setUserPermissions(null);
                setUserProfile({});
                setPermissionChecker(null);
                return;
            }
            
            if (!result.userData) {
                setAuthError('Failed to load user data');
                setUserPermissions(null);
                setUserProfile({});
                setPermissionChecker(null);
                return;
            }
            
            // Get comprehensive user permissions using the permissions service
            const permissions = getUserPermissions(result.userData);
            setUserPermissions(permissions);
            
            // Create permission checker utility
            const checker = createPermissionChecker(result.userData);
            setPermissionChecker(checker);
            
            setUserProfile(result.userData);
            
            // Handle redirects with better logic
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                
                // Paths that should never redirect
                const noRedirectPaths = [
                    "/verify-email",
                    "/handle-email-verification",
                    "/dashboard", // IMPORTANT: Don't redirect if already on dashboard
                    "/settings",
                    "/profile",
                    "/suites",
                    "/bugs",
                    "/admin"
                ];
                
                // Skip redirects for these paths or if flag is set
                if (noRedirectPaths.some(path => currentPath.startsWith(path)) || 
                    skipEmailVerificationRedirect) {
                    return;
                }
                
                const needsEmailVerification = authSource === 'email' && !user.emailVerified;
                const isOnAuthPage = ["/login", "/register"].includes(currentPath);
                
                // Only redirect to email verification if needed and not already handled
                if (needsEmailVerification && !isOnAuthPage) {
                    router.push("/verify-email");
                    return;
                }
                
                // Only redirect to dashboard from specific entry points
                const shouldRedirectToDashboard = [
                    "/login", 
                    "/", 
                    "/register"
                ].includes(currentPath);
                
                if (shouldRedirectToDashboard && user.emailVerified) {
                    router.push("/dashboard");
                }
            }
        } catch (error) {
            console.error('Error in processUserAuthentication:', error);
            setUserPermissions(null);
            setUserProfile({});
            setPermissionChecker(null);
            setAuthError(error.message);
        } finally {
            processingAuth.current = false;
        }
    }, [router, skipEmailVerificationRedirect]);

    // Handle redirect result - only once
    useEffect(() => {
        let mounted = true;
        
        const handleRedirectResult = async () => {
            if (initialized) return;
            
            try {
                setLoading(true);
                const result = await getRedirectResult(auth);
                
                if (result?.user && mounted) {
                    await processUserAuthentication(result.user);
                }
            } catch (error) {
                if (mounted) {
                    console.error('Redirect result error:', error);
                    setAuthError(error.message);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    setInitialized(true);
                }
            }
        };
        
        handleRedirectResult();
        
        return () => {
            mounted = false;
        };
    }, []); // Remove dependencies to prevent re-runs

    // Handle auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                await processUserAuthentication(user);
            } catch (error) {
                console.error('Auth state change error:', error);
                setAuthError(error.message);
            } finally {
                if (!initialized) {
                    setLoading(false);
                    setInitialized(true);
                }
            }
        });
        
        return () => unsubscribe();
    }, [processUserAuthentication, initialized]);

    const signIn = async (email, password) => {
        setAuthError(null);
        try {
            const result = await authLoginWithEmail(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const signInWithGoogle = async () => {
        setAuthError(null);
        try {
            const result = await authSignInWithGoogle();
            return {
                success: true,
                user: result.user,
                isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime
            };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const registerWithEmail = async (email, password) => {
        setAuthError(null);
        try {
            setSkipEmailVerificationRedirect(true);
            const result = await authRegisterWithEmail(email, password);
            
            setTimeout(() => {
                setSkipEmailVerificationRedirect(false);
            }, 1000);
            
            return { success: true, user: result.user };
        } catch (error) {
            setSkipEmailVerificationRedirect(false);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const registerWithEmailLink = async (email, name) => {
        setAuthError(null);
        try {
            await authRegisterWithEmailLink(email, name);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const completeEmailLinkSignIn = async (email, url, password = null) => {
        setAuthError(null);
        try {
            const result = await authCompleteEmailLinkSignIn(email, url, password);
            return { success: true, user: result.user };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const setUserPassword = async (password) => {
        setAuthError(null);
        try {
            await authSetUserPassword(password);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const resetPassword = async (email) => {
        setAuthError(null);
        try {
            await authResetPassword(email);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const confirmPasswordReset = async (code, newPassword) => {
        setAuthError(null);
        try {
            await authConfirmPasswordReset(code, newPassword);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const resendVerificationEmail = async () => {
        setAuthError(null);
        try {
            if (!currentUser) {
                throw new Error('No user is currently signed in');
            }
            await authResendVerificationEmail(currentUser);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const deleteAccount = async () => {
        setAuthError(null);
        try {
            if (!currentUser) {
                throw new Error('No user is currently signed in');
            }
            await authDeleteUserAccount(currentUser);
            
            // Clear local storage
            if (typeof window !== 'undefined') {
                localStorage.clear();
            }
            
            router.push("/login");
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const linkProvider = async (provider) => {
        setAuthError(null);
        try {
            if (!currentUser) {
                throw new Error('No user is currently signed in');
            }
            await authLinkProvider(currentUser, provider);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const unlinkProvider = async (providerId) => {
        setAuthError(null);
        try {
            if (!currentUser) {
                throw new Error('No user is currently signed in');
            }
            await authUnlinkProvider(currentUser, providerId);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const refreshSession = async () => {
        setAuthError(null);
        try {
            if (!currentUser) {
                throw new Error('No user is currently signed in');
            }
            await authRefreshSession(currentUser);
            return { success: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const signOut = async () => {
        try {
            // Reset tracking variables
            processingAuth.current = false;
            lastProcessedUserId.current = null;
            
            await authLogout();
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem("emailForVerification");
                localStorage.removeItem("registrationData");
                localStorage.removeItem("emailForSignIn");
                localStorage.removeItem("registeredUserName");
                localStorage.removeItem("emailSentTimestamp");
            }
            
            router.push("/login");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Permission checking methods using the permissions service
    const hasPermission = useCallback((capability) => {
        return permissionChecker ? permissionChecker.can(capability) : false;
    }, [permissionChecker]);

    const hasRole = useCallback((role) => {
        if (!userProfile) return false;
        // Check if user has specific role
        const userRoles = Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role];
        return userRoles.includes(role);
    }, [userProfile]);

    const hasAnyRole = useCallback((roles) => {
        if (!userProfile) return false;
        const userRoles = Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role];
        return roles.some(role => userRoles.includes(role));
    }, [userProfile]);

    const isUserAdmin = useCallback(() => {
        return permissionChecker ? permissionChecker.isAdmin() : false;
    }, [permissionChecker]);

    const getPrimaryUserRole = useCallback(() => {
        if (!userProfile) return 'member';
        
        // Get primary role from user profile
        const roles = Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role];
        
        // Priority order for roles
        const rolePriority = ['Admin', 'Manager', 'QA_Tester', 'Developer', 'Member', 'Viewer'];
        
        for (const role of rolePriority) {
            if (roles.includes(role)) {
                return role;
            }
        }
        
        return 'Member';
    }, [userProfile]);

    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return false;
        
        try {
            setLoading(true);
            const result = await fetchUserData(currentUser.uid);
            
            if (result.userData) {
                setUserProfile(result.userData);
                
                // Update permissions with fresh data
                const permissions = getUserPermissions(result.userData);
                setUserPermissions(permissions);
                
                // Update permission checker
                const checker = createPermissionChecker(result.userData);
                setPermissionChecker(checker);
                
                return true;
            }
            
            return false;
        } catch {
            return false;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const updateUserProfile = useCallback(async (userId, updates) => {
        try {
            setLoading(true);
            const result = await updateUserProfileService(userId, updates, currentUser?.uid);
            
            if (result) {
                await refreshUserData();
                return true;
            }
            
            return false;
        } catch {
            throw new Error('Failed to update user profile');
        } finally {
            setLoading(false);
        }
    }, [currentUser, refreshUserData]);

    const redirectToEmailVerification = useCallback(() => {
        if (currentUser && !currentUser.emailVerified) {
            setSkipEmailVerificationRedirect(false);
            router.push("/verify-email");
        }
    }, [currentUser, router]);

    const clearAuthError = () => {
        setAuthError(null);
    };

    const getLinkedProviders = useCallback(() => {
        if (!currentUser?.providerData) return [];
        return currentUser.providerData.map(provider => provider.providerId);
    }, [currentUser]);

    const isProviderLinked = useCallback((providerId) => {
        const linkedProviders = getLinkedProviders();
        return linkedProviders.includes(providerId);
    }, [getLinkedProviders]);

    // Enhanced permission checking methods
    const canAccessProject = useCallback(async (action = 'read', suiteContext = {}) => {
        if (!userProfile) return { allowed: false, reason: 'no_user' };
        return await canAccessProject(userProfile, action, suiteContext);
    }, [userProfile]);

    const canAccessBugs = useCallback((action = 'read', context = {}) => {
        if (!userProfile) return { allowed: false, reason: 'no_user' };
        return canAccessBugs(userProfile, action, context);
    }, [userProfile]);

    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        environment,
        initialized,
        permissionChecker,
        signIn,
        signInWithGoogle,
        registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        resetPassword,
        confirmPasswordReset,
        resendVerificationEmail,
        deleteAccount,
        linkProvider,
        unlinkProvider,
        getLinkedProviders,
        isProviderLinked,
        refreshSession,
        signOut,
        hasPermission,
        hasRole,
        hasAnyRole,
        isAdmin: isUserAdmin,
        getPrimaryUserRole,
        canAccessProject,
        canAccessBugs,
        
        // Convenience flags from permissions service
        canManageUsers: userPermissions?.canManageUsers || false,
        canManageTestSuites: userPermissions?.canCreateTestSuites || false,
        canCreateTestSuites: userPermissions?.canCreateTestSuites || false,
        canDeleteTestSuites: userPermissions?.canDeleteTestSuites || false,
        canViewAnalytics: userPermissions?.canViewAnalytics || false,
        canManageBilling: userPermissions?.canViewBilling || false,
        canManageBugs: userPermissions?.canWriteBugs || false,
        canAssignBugs: userPermissions?.canAssignBugs || false,
        canCreateBugs: userPermissions?.canCreateBugs || false,
        canCreateTestCases: userPermissions?.canCreateContent || false,
        canRunTests: userPermissions?.canReadProjects || false,
        canViewSubscription: userPermissions?.canViewSubscription || false,
        canViewDashboard: userPermissions?.canViewDashboard || false,
        canViewSettings: userPermissions?.canViewSettings || false,
        canViewAdminPanel: userPermissions?.canViewAdminPanel || false,
        canViewReports: userPermissions?.canViewReports || false,
        canInviteUsers: userPermissions?.canInviteUsers || false,
        canViewTeamMembers: userPermissions?.canViewTeamMembers || false,
        canManageOrganization: userPermissions?.canManageOrganization || false,
        canViewOrganizationSettings: userPermissions?.canViewOrganizationSettings || false,
        canUseAdvancedReports: userPermissions?.canUseAdvancedReports || false,
        canUseAPIAccess: userPermissions?.canUseAPIAccess || false,
        canUseAutomation: userPermissions?.canUseAutomation || false,
        canExportData: userPermissions?.canExportData || false,
        
        // Account type helpers
        isOrganizationAccount: userProfile ? isOrganizationAccount(userProfile) : false,
        isIndividualAccount: userProfile ? isIndividualAccount(userProfile) : false,
        
        // Subscription information
        subscriptionType: userPermissions?.subscriptionType || 'free',
        subscriptionStatus: userPermissions?.subscriptionStatus || 'inactive',
        isTrialActive: userPermissions?.isTrialActive || false,
        trialDaysRemaining: userPermissions?.trialDaysRemaining || 0,
        showTrialBanner: userPermissions?.showTrialBanner || false,
        limits: userPermissions?.limits || {},
        shouldShowUpgradePrompts: userPermissions?.shouldShowUpgradePrompts || {},
        
        updateUserProfile,
        refreshUserData,
        clearAuthError,
        redirectToEmailVerification,
        user: currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;