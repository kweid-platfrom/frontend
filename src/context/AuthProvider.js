// Complete AuthProvider with improved permission handling and consistent role structure
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

import {
    createUserIfNotExists,
    fetchUserData,
    completeUserSetup,
    updateOnboardingStep,
} from "../services/userService";
import { updateUserProfile as updateUserProfileService } from "../services/userService";

import {
    signInWithGoogle as authSignInWithGoogle,
    logInWithEmail as authLoginWithEmail,
    logout as authLogout,
    registerWithEmail as authRegisterWithEmail,
    registerWithEmailLink as authRegisterWithEmailLink,
    completeEmailLinkSignIn as authCompleteEmailLinkSignIn,
    setUserPassword as authSetUserPassword
} from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper function to normalize role structure (handle both string and array formats)
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

// Helper function to get primary role for display/logic purposes
const getPrimaryRole = (roles) => {
    if (!roles || roles.length === 0) return 'member';
    
    // Priority order for roles (highest to lowest)
    const rolePriority = [
        'super_admin',
        'admin', 
        'organization_admin', 
        'project_manager', 
        'lead', 
        'developer', 
        'tester', 
        'member', 
        'viewer'
    ];
    
    for (const role of rolePriority) {
        if (roles.includes(role)) {
            return role;
        }
    }
    
    return roles[0]; // fallback to first role
};

// Comprehensive permission mapping based on roles
const getRoleCapabilities = (roles) => {
    const capabilities = new Set(['read_tests']); // Everyone gets read access
    
    roles.forEach(role => {
        switch (role) {
            case 'super_admin':
            case 'admin':
                capabilities.add('write_tests');
                capabilities.add('admin');
                capabilities.add('manage_projects');
                capabilities.add('manage_users');
                capabilities.add('manage_organizations');
                capabilities.add('view_analytics');
                capabilities.add('manage_bugs');
                capabilities.add('assign_bugs');
                capabilities.add('manage_billing');
                capabilities.add('system_settings');
                break;
                
            case 'organization_admin':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('assign_bugs');
                capabilities.add('manage_projects');
                capabilities.add('manage_users');
                capabilities.add('view_analytics');
                capabilities.add('manage_billing');
                break;
                
            case 'project_manager':
            case 'lead':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('assign_bugs');
                capabilities.add('manage_projects');
                capabilities.add('view_analytics');
                break;
                
            case 'developer':
            case 'tester':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('create_bugs');
                break;
                
            case 'member':
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('create_bugs');
                break;
                
            case 'viewer':
                // Only read permissions (already added above)
                break;
                
            default:
                // Unknown role gets member permissions
                capabilities.add('write_tests');
                capabilities.add('manage_bugs');
                capabilities.add('create_bugs');
                break;
        }
    });
    
    return Array.from(capabilities);
};

// Helper function to determine user permissions based on role and user data
const determineUserPermissions = (userData, explicitAdmin = false) => {
    const normalizedRoles = normalizeRoles(userData.role);
    const primaryRole = getPrimaryRole(normalizedRoles);
    
    // Determine admin status
    const isAdminByRole = normalizedRoles.some(role => 
        ['admin', 'super_admin'].includes(role)
    );
    const isAdmin = explicitAdmin || isAdminByRole || userData.isAdmin === true;
    
    // Get base capabilities from roles
    let capabilities = getRoleCapabilities(normalizedRoles);
    
    // Override capabilities if user is admin
    if (isAdmin) {
        capabilities = [
            'read_tests',
            'write_tests',
            'admin',
            'manage_projects',
            'manage_users',
            'manage_organizations',
            'view_analytics',
            'manage_bugs',
            'assign_bugs',
            'manage_billing',
            'system_settings'
        ];
    }
    
    // Merge with custom permissions from user data
    if (userData.permissions?.capabilities) {
        capabilities = [
            ...new Set([...capabilities, ...userData.permissions.capabilities])
        ];
    }
    
    // Override admin status if explicitly set in permissions
    let finalIsAdmin = isAdmin;
    if (userData.permissions?.isAdmin !== undefined) {
        finalIsAdmin = userData.permissions.isAdmin;
    }
    
    const permissions = {
        isAdmin: finalIsAdmin,
        roles: normalizedRoles,
        primaryRole: primaryRole,
        capabilities: capabilities,
        // Additional computed properties for convenience
        canManageUsers: finalIsAdmin || capabilities.includes('manage_users'),
        canManageProjects: finalIsAdmin || capabilities.includes('manage_projects'),
        canViewAnalytics: finalIsAdmin || capabilities.includes('view_analytics'),
        canManageBilling: finalIsAdmin || capabilities.includes('manage_billing'),
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
        console.log('Processing user authentication:', {
            hasUser: !!user,
            uid: user?.uid,
            email: user?.email,
            emailVerified: user?.emailVerified,
        });

        if (!user) {
            setCurrentUser(null);
            setUserPermissions(null);
            setUserProfile(null);
            return;
        }

        try {
            // Set current user immediately for UI feedback
            setCurrentUser(user);

            // Determine auth source
            let authSource = 'email';
            if (user.providerData?.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider === 'google.com') authSource = 'google';
            }

            // Handle email verification callback early
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                const isVerificationCallback = searchParams.get('mode') === 'verifyEmail';

                if (isVerificationCallback && currentPath !== "/verify-email") {
                    router.push(`/verify-email${window.location.search}`);
                    return;
                }
            }

            // Create/fetch user data
            const result = await createUserIfNotExists(user, {}, authSource);

            if (result.error) {
                console.error('User creation/fetch failed:', result.error);
                setAuthError(result.error);
                
                // Set minimal fallback permissions even on error
                setUserPermissions({
                    isAdmin: false,
                    roles: ["member"],
                    primaryRole: "member",
                    capabilities: ["read_tests"],
                    canManageUsers: false,
                    canManageProjects: false,
                    canViewAnalytics: false,
                    canManageBilling: false
                });
                setUserProfile({});
                return;
            }

            if (!result.userData) {
                console.error('No user data available');
                setAuthError('Failed to load user data');
                
                // Set minimal fallback permissions
                setUserPermissions({
                    isAdmin: false,
                    roles: ["member"],
                    primaryRole: "member",
                    capabilities: ["read_tests"],
                    canManageUsers: false,
                    canManageProjects: false,
                    canViewAnalytics: false,
                    canManageBilling: false
                });
                setUserProfile({});
                return;
            }

            // Normalize user data structure for consistent role handling
            const normalizedUserData = {
                ...result.userData,
                role: normalizeRoles(result.userData.role),
                primaryRole: getPrimaryRole(normalizeRoles(result.userData.role))
            };

            // Set comprehensive permissions
            const permissions = determineUserPermissions(result.userData);
            
            console.log('Setting user permissions:', {
                userData: normalizedUserData,
                calculatedPermissions: permissions,
                userRoles: normalizedUserData.role,
                primaryRole: permissions.primaryRole,
                isAdmin: permissions.isAdmin
            });

            setUserPermissions(permissions);
            setUserProfile(normalizedUserData);

            // Handle routing based on user state
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;

                // Skip routing if user is already on appropriate page OR if we should skip email verification redirect
                if (currentPath === "/verify-email" ||
                    currentPath.startsWith("/onboarding") ||
                    currentPath.startsWith("/handle-email-verification") ||
                    skipEmailVerificationRedirect) {
                    return;
                }

                // 1️⃣ EMAIL VERIFICATION GATE - BUT NOT FOR NEW REGISTRATIONS
                const needsEmailVerification = authSource === 'email' && !user.emailVerified;

                // Only redirect to email verification if user is trying to access protected areas
                // NOT if they just registered or are on register/login pages
                const isOnAuthPage = ["/login", "/register"].includes(currentPath);
                const isNewUser = result.isNewUser;

                if (needsEmailVerification && !isOnAuthPage && !isNewUser) {
                    console.log('User needs email verification, redirecting...');
                    router.push("/verify-email");
                    return;
                }

                // 2️⃣ ONBOARDING GATE
                // Check if user needs onboarding (but not for brand new users on register page)
                const needsOnboarding = !isNewUser && (
                    result.needsSetup ||
                    !result.userData.setupCompleted ||
                    result.userData.setupStep !== 'completed' ||
                    !result.userData.onboardingStatus?.onboardingComplete ||
                    !result.userData.onboardingStatus?.projectCreated
                );

                console.log('Onboarding check:', {
                    needsOnboarding,
                    isNewUser: result.isNewUser,
                    needsSetup: result.needsSetup,
                    setupCompleted: result.userData.setupCompleted,
                    setupStep: result.userData.setupStep,
                    onboardingComplete: result.userData.onboardingStatus?.onboardingComplete,
                    projectCreated: result.userData.onboardingStatus?.projectCreated,
                    currentPath
                });

                if (needsOnboarding) {
                    console.log('User needs onboarding, redirecting...');

                    // Only redirect from auth/landing pages
                    const shouldRedirectToOnboarding = [
                        "/login", "/", "/dashboard"
                    ].includes(currentPath);

                    if (shouldRedirectToOnboarding) {
                        router.push("/onboarding");
                    }
                    return;
                }

                // 3️⃣ SUCCESS - Route to dashboard (but not if user just registered)
                const shouldRedirectToDashboard = [
                    "/login", "/", "/verify-email"
                ].includes(currentPath);

                if (shouldRedirectToDashboard && !isNewUser) {
                    console.log('User setup complete, redirecting to dashboard');
                    router.push("/dashboard");
                }
            }

        } catch (error) {
            console.error("Error processing authentication:", error);

            // Set fallback permissions with more capabilities for error recovery
            setUserPermissions({
                isAdmin: false,
                roles: ["member"],
                primarily: "member",
                capabilities: ["read_tests", "manage_bugs"],
                canManageUsers: false,
                canManageProjects: false,
                canViewAnalytics: false,
                canManageBilling: false
            });
            setUserProfile({});
            setAuthError(error.message);
        }
    }, [router, skipEmailVerificationRedirect]);

    // Handle redirect result
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
                console.error("Error handling redirect result:", error);
                setAuthError(error.message);
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        handleRedirectResult();
    }, [processUserAuthentication, initialized]);

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                await processUserAuthentication(user);
            } catch (error) {
                console.error("Auth state change error:", error);
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

    // Authentication methods
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
            console.error("Google sign-in error:", error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const registerWithEmail = async (email, password) => {
        setAuthError(null);
        try {
            // Set flag to prevent immediate email verification redirect
            setSkipEmailVerificationRedirect(true);

            const result = await authRegisterWithEmail(email, password);

            // Reset the flag after a short delay to allow the register page to handle the success
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

    const signOut = async () => {
        try {
            await authLogout();

            // Clear all localStorage flags
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
            console.error("Sign out error:", error);
            return { success: false, error: error.message };
        }
    };

    // Permission checking methods
    const hasPermission = useCallback((capability) => {
        if (!userPermissions) {
            console.log('No user permissions available for capability check:', capability);
            return false;
        }
        
        if (userPermissions.isAdmin) {
            console.log('User is admin, granting permission for:', capability);
            return true;
        }
        
        const hasCapability = userPermissions.capabilities?.includes(capability) || false;
        console.log('Permission check result:', {
            capability,
            hasCapability,
            userCapabilities: userPermissions.capabilities,
            isAdmin: userPermissions.isAdmin
        });
        
        return hasCapability;
    }, [userPermissions]);

    const hasRole = useCallback((role) => {
        if (!userPermissions) {
            console.log('No user permissions available for role check:', role);
            return false;
        }
        
        const hasUserRole = userPermissions.roles?.includes(role) || false;
        console.log('Role check result:', {
            role,
            hasUserRole,
            userRoles: userPermissions.roles,
            primaryRole: userPermissions.primaryRole
        });
        
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

    // Data management methods
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
        } catch (error) {
            console.error("Error refreshing user data:", error);
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
            console.error("Error updating user profile:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [currentUser, refreshUserData]);

    // Helper method to mark email as verified and update onboarding
    const markEmailVerified = useCallback(async () => {
        if (!currentUser?.uid) return false;

        try {
            // Update Firestore to mark email as verified
            await updateOnboardingStep(currentUser.uid, 'emailVerified', true, {
                setupStep: userProfile?.accountType === 'organization'
                    ? 'organization_info'
                    : 'profile_setup'
            });

            // Refresh user data
            await refreshUserData();
            return true;
        } catch (error) {
            console.error("Error marking email as verified:", error);
            return false;
        }
    }, [currentUser, userProfile, refreshUserData]);

    // Helper to manually trigger email verification redirect (for use by register page after showing success)
    const redirectToEmailVerification = useCallback(() => {
        if (currentUser && !currentUser.emailVerified) {
            setSkipEmailVerificationRedirect(false);
            router.push("/verify-email");
        }
    }, [currentUser, router]);

    const clearAuthError = () => {
        setAuthError(null);
    };

    // Context value
    const value = {
        // User state
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        environment,
        initialized,

        // Authentication methods
        signIn,
        signInWithGoogle,
        registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        signOut,

        // Permission methods
        hasPermission,
        hasRole,
        hasAnyRole,
        isAdmin,
        getPrimaryUserRole,

        // Convenience permission getters
        canManageUsers: userPermissions?.canManageUsers || false,
        canManageProjects: userPermissions?.canManageProjects || false,
        canViewAnalytics: userPermissions?.canViewAnalytics || false,
        canManageBilling: userPermissions?.canManageBilling || false,

        // Data management
        updateUserProfile,
        refreshUserData,
        clearAuthError,

        // Legacy/Service methods
        createUserIfNotExists,
        completeUserSetup,
        markEmailVerified,
        redirectToEmailVerification,
        
        // Aliases for backward compatibility
        user: currentUser, // Some components may use 'user' instead of 'currentUser'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;