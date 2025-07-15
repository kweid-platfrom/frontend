'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";
import {
    fetchUserData,
    updateUserProfile as updateUserProfileService,
    getUserDisplayName,
    getUserEmail,
    getUserAccountType,
    getCurrentAccountInfo,
} from "../services/userService";
import PermissionService, { isOrganizationAccount, isIndividualAccount } from "../services/permissionService";
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
    refreshAuthSession as authRefreshSession,
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
    const processingAuth = useRef(false);
    const lastProcessedUserId = useRef(null);
    const router = useRouter();

    const processUserAuthentication = useCallback(async (user) => {
        if (processingAuth.current || window.isRegistering) {
            console.log('Skipping auth processing due to:', { processingAuth: processingAuth.current, isRegistering: window.isRegistering });
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
                setLoading(false);
                return;
            }

            lastProcessedUserId.current = user.uid;
            setCurrentUser(user);
            let authSource = 'email';

            if (user.providerData?.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider === 'google.com') authSource = 'google';
            }

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
            console.log('fetchUserData result:', result);

            if (result.error) {
                console.error('fetchUserData error:', result.error);
                setAuthError(result.error);
                setUserPermissions(null);
                setUserProfile({});
                setPermissionChecker(null);
                return;
            }

            if (!result.userData && !result.isNewUser) {
                setAuthError('Failed to load user data');
                setUserPermissions(null);
                setUserProfile({});
                setPermissionChecker(null);
                return;
            }

            setUserProfile(result.userData || {});
            const permissions = await PermissionService.getUserPermissions(user.uid);
            setUserPermissions(permissions);
            const checker = {
                can: async (capability) => await PermissionService.hasPermission(user.uid, capability),
                isAdmin: async (orgId) => await PermissionService.hasRole(user.uid, 'Admin', orgId),
            };
            setPermissionChecker(checker);

            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const noRedirectPaths = [
                    "/verify-email",
                    "/handle-email-verification",
                    "/dashboard",
                    "/settings",
                    "/profile",
                    "/suites",
                    "/bugs",
                    "/admin",
                ];

                if (noRedirectPaths.some(path => currentPath.startsWith(path)) || skipEmailVerificationRedirect) {
                    return;
                }

                const needsEmailVerification = authSource === 'email' && !user.emailVerified;
                const isOnAuthPage = ["/login", "/register"].includes(currentPath);

                if (needsEmailVerification && !isOnAuthPage) {
                    router.push("/verify-email");
                    return;
                }

                const shouldRedirectToDashboard = ["/login", "/", "/register"].includes(currentPath);
                if (shouldRedirectToDashboard && user.emailVerified) {
                    router.push("/dashboard");
                }
            }
        } catch (error) {
            console.error('Error in processUserAuthentication:', error);
            setAuthError(error.message);
        } finally {
            processingAuth.current = false;
            setLoading(false);
        }
    }, [router, skipEmailVerificationRedirect]);

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
                    setInitialized(true);
                }
            }
        };

        handleRedirectResult();

        return () => {
            mounted = false;
        };
    }, [initialized, processUserAuthentication]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? user.uid : null, 'isRegistering:', window.isRegistering);
            await processUserAuthentication(user);
        });

        return () => unsubscribe();
    }, [processUserAuthentication]);

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
                isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime,
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
            return { success: true, user: result.user };
        } catch (error) {
            setSkipEmailVerificationRedirect(false);
            setAuthError(error.message);
            return { success: false, error: error.message };
        } finally {
            setTimeout(() => setSkipEmailVerificationRedirect(false), 1000);
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

    // ===== PERMISSION CHECKING METHODS =====
    const hasPermission = useCallback((capability) => {
        return permissionChecker ? permissionChecker.can(capability) : false;
    }, [permissionChecker]);

    const hasRole = useCallback((role, organizationId) => {
        return permissionChecker ? permissionChecker.isAdmin(organizationId) : false;
    }, [permissionChecker]);

    const hasAnyRole = useCallback((roles, organizationId) => {
        return roles.some(role => hasRole(role, organizationId));
    }, [hasRole]);

    const isAdmin = useCallback((organizationId) => {
        return permissionChecker ? permissionChecker.isAdmin(organizationId) : false;
    }, [permissionChecker]);

    const getPrimaryUserRole = useCallback((organizationId) => {
        if (!userProfile || !organizationId) return 'member';
        return PermissionService.hasRole(userProfile.user_id, 'Admin', organizationId) ? 'Admin' : 'Member';
    }, [userProfile]);

    // ===== DATA MANAGEMENT METHODS =====
    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return false;

        try {
            setLoading(true);
            const result = await fetchUserData(currentUser.uid);

            if (result.userData) {
                setUserProfile(result.userData);
                const permissions = await PermissionService.getUserPermissions(currentUser.uid);
                setUserPermissions(permissions);
                const checker = {
                    can: async (capability) => await PermissionService.hasPermission(currentUser.uid, capability),
                    isAdmin: async (orgId) => await PermissionService.hasRole(currentUser.uid, 'Admin', orgId),
                };
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
        } catch (error) {
            throw new Error('Failed to update user profile', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser, refreshUserData]);

    // ===== UTILITY METHODS =====
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

    // ===== COMPUTED VALUES =====
    const displayName = getUserDisplayName(userProfile);
    const email = getUserEmail(userProfile);
    const accountType = getUserAccountType(userProfile);
    const currentAccountInfo = getCurrentAccountInfo(userProfile);

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
        unlinkProvider,
        refreshSession,
        signOut,
        hasPermission,
        hasRole,
        hasAnyRole,
        isAdmin,
        getPrimaryUserRole,
        canCreateSuite: userPermissions?.canCreateSuite || false,
        canViewSuite: userPermissions?.canViewSuite || false,
        canEditSuite: userPermissions?.canEditSuite || false,
        canDeleteSuite: userPermissions?.canDeleteSuite || false,
        canInviteTeamMembers: userPermissions?.canInviteTeamMembers || false,
        canManageOrganization: userPermissions?.canManageOrganization || false,
        isOrganizationAccount: userProfile ? isOrganizationAccount(userProfile) : false,
        isIndividualAccount: userProfile ? isIndividualAccount(userProfile) : false,
        subscriptionType: userPermissions?.subscriptionType || 'free',
        subscriptionStatus: userPermissions?.subscriptionStatus || 'inactive',
        isTrialActive: userPermissions?.isTrialActive || false,
        trialDaysRemaining: userPermissions?.trialDaysRemaining || 0,
        showTrialBanner: userPermissions?.showTrialBanner || false,
        updateUserProfile,
        refreshUserData,
        clearAuthError,
        redirectToEmailVerification,
        displayName,
        email,
        accountType,
        currentAccountInfo,
        user: currentUser,
        isProviderLinked,
        linkProvider,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;