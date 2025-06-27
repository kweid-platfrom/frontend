"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

import {
    fetchUserData,
    updateOnboardingStep
} from "../services/userService";
import { updateUserProfile as updateUserProfileService } from "../services/userService";

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

const normalizeRoles = (roleData) => {
    if (!roleData) return ['member'];
    if (typeof roleData === 'string') {
        return [roleData];
    }
    if (Array.isArray(roleData)) {
        return roleData.length > 0 ? roleData : ['member'];
    }
    return ['member'];
};

const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0) return 'member';
    const rolePriority = [
        'super_admin',
        'admin', 
        'organization_admin', 
        'suite_manager', 
        'lead', 
        'tester', 
        'developer', 
        'member', 
        'viewer'
    ];
    for (const role of rolePriority) {
        if (roles.includes(role)) {
            return role;
        }
    }
    return roles[0];
};

const getRoleCapabilities = (roles) => {
    const capabilities = new Set(['read_tests']);
    roles.forEach(role => {
        switch (role) {
            case 'super_admin':
            case 'admin':
                capabilities.add('write_tests');
                capabilities.add('admin');
                capabilities.add('manage_test_suites');
                capabilities.add('manage_users');
                capabilities.add('manage_organizations');
                capabilities.add('view_analytics');
                capabilities.add('manage_bugs');
                capabilities.add('assign_bugs');
                capabilities.add('manage_billing');
                capabilities.add('system_settings');
                capabilities.add('create_test_suites');
                capabilities.add('delete_test_suites');
                break;
            case 'organization_admin':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('assign_bugs');
                capabilities.add('manage_test_suites');
                capabilities.add('manage_users');
                capabilities.add('view_analytics');
                capabilities.add('manage_billing');
                capabilities.add('create_test_suites');
                capabilities.add('delete_test_suites');
                break;
            case 'suite_manager':
            case 'lead':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('assign_bugs');
                capabilities.add('manage_test_suites');
                capabilities.add('view_analytics');
                capabilities.add('create_test_suites');
                break;
            case 'developer':
            case 'tester':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('create_bugs');
                capabilities.add('create_test_cases');
                capabilities.add('run_tests');
                break;
            case 'member':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('create_bugs');
                capabilities.add('create_test_cases');
                capabilities.add('run_tests');
                break;
            case 'viewer':
                // Only has read_tests from default
                break;
            default:
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('create_bugs');
                capabilities.add('create_test_cases');
                break;
        }
    });
    return Array.from(capabilities);
};

const determineUserPermissions = (userData, explicitAdmin = false) => {
    const normalizedRoles = normalizeRoles(userData.role);
    const primaryRole = getPrimaryRole(normalizedRoles);
    const isAdminByRole = normalizedRoles.some(role => 
        ['admin', 'super_admin', 'organization_admin'].includes(role)
    );
    const isAdmin = explicitAdmin || isAdminByRole || userData.isAdmin === true;
    let capabilities = getRoleCapabilities(normalizedRoles);
    
    if (isAdmin) {
        capabilities = [
            'read_tests',
            'write_tests',
            'admin',
            'manage_test_suites',
            'manage_users',
            'manage_organizations',
            'view_analytics',
            'manage_bugs',
            'assign_bugs',
            'manage_billing',
            'system_settings',
            'create_test_suites',
            'delete_test_suites',
            'create_test_cases',
            'run_tests'
        ];
    }
    
    if (userData.permissions?.capabilities) {
        capabilities = [
            ...new Set([...capabilities, ...userData.permissions.capabilities])
        ];
    }
    
    let finalIsAdmin = isAdmin;
    if (userData.permissions?.isAdmin !== undefined) {
        finalIsAdmin = userData.permissions.isAdmin;
    }
    
    const permissions = {
        isAdmin: finalIsAdmin,
        roles: normalizedRoles,
        primaryRole: primaryRole,
        capabilities: capabilities,
        canManageUsers: finalIsAdmin || capabilities.includes('manage_users'),
        canManageTestSuites: finalIsAdmin || capabilities.includes('manage_test_suites'),
        canCreateTestSuites: finalIsAdmin || capabilities.includes('create_test_suites'),
        canDeleteTestSuites: finalIsAdmin || capabilities.includes('delete_test_suites'),
        canViewAnalytics: finalIsAdmin || capabilities.includes('view_analytics'),
        canManageBilling: finalIsAdmin || capabilities.includes('manage_billing'),
        canManageBugs: capabilities.includes('manage_bugs'),
        canAssignBugs: capabilities.includes('assign_bugs'),
        canCreateBugs: capabilities.includes('create_bugs'),
        canCreateTestCases: capabilities.includes('create_test_cases'),
        canRunTests: capabilities.includes('run_tests'),
    };
    
    return permissions;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [skipEmailVerificationRedirect, setSkipEmailVerificationRedirect] = useState(false);
    const router = useRouter();

    const processUserAuthentication = useCallback(async (user) => {
        if (!user) {
            setCurrentUser(null);
            setUserPermissions(null);
            setUserProfile(null);
            return;
        }
        
        try {
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

            if (result.error) {
                setAuthError(result.error);
                setUserPermissions({
                    isAdmin: false,
                    roles: ["member"],
                    primaryRole: "member",
                    capabilities: ["read_tests"],
                    canManageUsers: false,
                    canManageTestSuites: false,
                    canCreateTestSuites: false,
                    canDeleteTestSuites: false,
                    canViewAnalytics: false,
                    canManageBilling: false,
                    canManageBugs: false,
                    canAssignBugs: false,
                    canCreateBugs: false,
                    canCreateTestCases: false,
                    canRunTests: false
                });
                setUserProfile({});
                return;
            }
            
            if (!result.userData) {
                setAuthError('Failed to load user data');
                setUserPermissions({
                    isAdmin: false,
                    roles: ["member"],
                    primaryRole: "member",
                    capabilities: ["read_tests"],
                    canManageUsers: false,
                    canManageTestSuites: false,
                    canCreateTestSuites: false,
                    canDeleteTestSuites: false,
                    canViewAnalytics: false,
                    canManageBilling: false,
                    canManageBugs: false,
                    canAssignBugs: false,
                    canCreateBugs: false,
                    canCreateTestCases: false,
                    canRunTests: false
                });
                setUserProfile({});
                return;
            }
            
            const normalizedUserData = {
                ...result.userData,
                role: normalizeRoles(result.userData.role),
                primaryRole: getPrimaryRole(normalizeRoles(result.userData.role))
            };
            
            const permissions = determineUserPermissions(result.userData);
            setUserPermissions(permissions);
            setUserProfile(normalizedUserData);
            
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                
                if (currentPath === "/verify-email" ||
                    currentPath.startsWith("/onboarding") ||
                    currentPath.startsWith("/handle-email-verification") ||
                    skipEmailVerificationRedirect) {
                    return;
                }
                
                const needsEmailVerification = authSource === 'email' && !user.emailVerified;
                const isOnAuthPage = ["/login", "/register"].includes(currentPath);
                const isNewUser = result.isNewUser;
                
                if (needsEmailVerification && !isOnAuthPage && !isNewUser) {
                    router.push("/verify-email");
                    return;
                }
                
                const needsOnboarding = !isNewUser && (
                    result.needsSetup ||
                    !result.userData.setupCompleted ||
                    result.userData.setupStep !== 'completed' ||
                    !result.userData.onboardingStatus?.onboardingComplete ||
                    !result.userData.onboardingStatus?.testSuiteCreated
                );
                
                if (needsOnboarding) {
                    const shouldRedirectToOnboarding = [
                        "/login", "/", "/dashboard"
                    ].includes(currentPath);
                    
                    if (shouldRedirectToOnboarding) {
                        router.push("/onboarding");
                    }
                    return;
                }
                
                const shouldRedirectToDashboard = [
                    "/login", "/", "/verify-email"
                ].includes(currentPath);
                
                if (shouldRedirectToDashboard && !isNewUser) {
                    router.push("/dashboard");
                }
            }
        } catch (error) {
            setUserPermissions({
                isAdmin: false,
                roles: ["member"],
                primaryRole: "member",
                capabilities: ["read_tests", "manage_bugs"],
                canManageUsers: false,
                canManageTestSuites: false,
                canCreateTestSuites: false,
                canDeleteTestSuites: false,
                canViewAnalytics: false,
                canManageBilling: false,
                canManageBugs: true,
                canAssignBugs: false,
                canCreateBugs: true,
                canCreateTestCases: true,
                canRunTests: true
            });
            setUserProfile({});
            setAuthError(error.message);
        }
    }, [router, skipEmailVerificationRedirect]);

    useEffect(() => {
        const handleRedirectResult = async () => {
            if (initialized) return;
            
            try {
                setLoading(true);
                const result = await getRedirectResult(auth);
                
                if (result?.user) {
                    await processUserAuthentication(result.user);
                }
            } catch (error) {
                setAuthError(error.message);
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };
        
        handleRedirectResult();
    }, [processUserAuthentication, initialized]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                await processUserAuthentication(user);
            } catch (error) {
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

    // NEW: Password Reset Functions
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

    // NEW: Email Verification Functions
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

    // NEW: Account Management Functions
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

    // NEW: Provider Linking Functions
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

    // NEW: Session Management
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
            await authLogout();
            
            if (typeof window !== 'undefined') {
                localStorage.removeItem("needsAccountSetup");
                localStorage.removeItem("awaitingEmailVerification");
                localStorage.removeItem("emailVerificationComplete");
                localStorage.removeItem("needsOnboarding");
                localStorage.removeItem("registrationData");
                localStorage.removeItem("emailForVerification");
            }
            
            router.push("/login");
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const hasPermission = useCallback((capability) => {
        if (!userPermissions) {
            return false;
        }
        
        if (userPermissions.isAdmin) {
            return true;
        }
        
        const hasCapability = userPermissions.capabilities?.includes(capability) || false;
        return hasCapability;
    }, [userPermissions]);

    const hasRole = useCallback((role) => {
        if (!userPermissions) {
            return false;
        }
        
        const hasUserRole = userPermissions.roles?.includes(role) || false;
        return hasUserRole;
    }, [userPermissions]);

    const hasAnyRole = useCallback((roles) => {
        if (!userPermissions || !Array.isArray(roles)) return false;
        return roles.some(role => userPermissions.roles?.includes(role));
    }, [userPermissions]);

    const isAdmin = useCallback(() => {
        return userPermissions?.isAdmin || false;
    }, [userPermissions]);

    const getPrimaryUserRole = useCallback(() => {
        return userPermissions?.primaryRole || 'member';
    }, [userPermissions]);

    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return false;
        
        try {
            setLoading(true);
            const userData = await fetchUserData(currentUser.uid);
            
            if (userData) {
                const normalizedUserData = {
                    ...userData,
                    role: normalizeRoles(userData.role),
                    primaryRole: getPrimaryRole(normalizeRoles(userData.role))
                };
                
                const permissions = determineUserPermissions(userData);
                setUserPermissions(permissions);
                setUserProfile(normalizedUserData);
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

    const markEmailVerified = useCallback(async () => {
        if (!currentUser?.uid) return false;
        
        try {
            await updateOnboardingStep(currentUser.uid, 'emailVerified', true, {
                setupStep: userProfile?.accountType === 'organization'
                    ? 'organization_info'
                    : 'profile_setup'
            });
            await refreshUserData();
            return true;
        } catch {
            return false;
        }
    }, [currentUser, userProfile, refreshUserData]);

    const redirectToEmailVerification = useCallback(() => {
        if (currentUser && !currentUser.emailVerified) {
            setSkipEmailVerificationRedirect(false);
            router.push("/verify-email");
        }
    }, [currentUser, router]);

    const clearAuthError = () => {
        setAuthError(null);
    };

    // NEW: Helper function to get linked providers
    const getLinkedProviders = useCallback(() => {
        if (!currentUser?.providerData) return [];
        return currentUser.providerData.map(provider => provider.providerId);
    }, [currentUser]);

    // NEW: Check if specific provider is linked
    const isProviderLinked = useCallback((providerId) => {
        const linkedProviders = getLinkedProviders();
        return linkedProviders.includes(providerId);
    }, [getLinkedProviders]);

    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        environment,
        initialized,
        signIn,
        signInWithGoogle,
        registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        // NEW: Password Reset
        resetPassword,
        confirmPasswordReset,
        // NEW: Email Verification
        resendVerificationEmail,
        // NEW: Account Management
        deleteAccount,
        // NEW: Provider Management
        linkProvider,
        unlinkProvider,
        getLinkedProviders,
        isProviderLinked,
        // NEW: Session Management
        refreshSession,
        signOut,
        hasPermission,
        hasRole,
        hasAnyRole,
        isAdmin,
        getPrimaryUserRole,
        // Test Suite specific permissions
        canManageUsers: userPermissions?.canManageUsers || false,
        canManageTestSuites: userPermissions?.canManageTestSuites || false,
        canCreateTestSuites: userPermissions?.canCreateTestSuites || false,
        canDeleteTestSuites: userPermissions?.canDeleteTestSuites || false,
        canViewAnalytics: userPermissions?.canViewAnalytics || false,
        canManageBilling: userPermissions?.canManageBilling || false,
        canManageBugs: userPermissions?.canManageBugs || false,
        canAssignBugs: userPermissions?.canAssignBugs || false,
        canCreateBugs: userPermissions?.canCreateBugs || false,
        canCreateTestCases: userPermissions?.canCreateTestCases || false,
        canRunTests: userPermissions?.canRunTests || false,
        updateUserProfile,
        refreshUserData,
        clearAuthError,
        markEmailVerified,
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