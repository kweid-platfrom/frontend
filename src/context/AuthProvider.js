// Fixed AuthProvider with improved permission handling
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

// Helper function to determine user permissions based on role and user data
const determineUserPermissions = (userData, isAdmin) => {
    const basePermissions = {
        isAdmin: isAdmin,
        roles: userData.role || ['member'],
        capabilities: []
    };

    // Set capabilities based on role
    if (isAdmin) {
        basePermissions.capabilities = [
            "read_tests", 
            "write_tests", 
            "admin", 
            "manage_projects", 
            "manage_users",
            "manage_organizations",
            "view_analytics",
            "manage_bugs",
            "assign_bugs"
        ];
    } else {
        // Base capabilities for all users
        basePermissions.capabilities = ["read_tests"];
        
        // Add capabilities based on specific roles
        const userRoles = userData.role || ['member'];
        
        if (userRoles.includes('developer') || userRoles.includes('tester')) {
            basePermissions.capabilities.push("write_tests", "manage_bugs");
        }
        
        if (userRoles.includes('project_manager') || userRoles.includes('lead')) {
            basePermissions.capabilities.push(
                "write_tests", 
                "manage_bugs", 
                "assign_bugs", 
                "manage_projects",
                "view_analytics"
            );
        }
        
        if (userRoles.includes('organization_admin')) {
            basePermissions.capabilities.push(
                "write_tests", 
                "manage_bugs", 
                "assign_bugs", 
                "manage_projects",
                "manage_users",
                "view_analytics"
            );
        }
    }

    // Merge with any custom permissions from user data
    if (userData.permissions) {
        basePermissions.capabilities = [
            ...new Set([...basePermissions.capabilities, ...(userData.permissions.capabilities || [])])
        ];
        
        // Override admin status if explicitly set
        if (userData.permissions.isAdmin !== undefined) {
            basePermissions.isAdmin = userData.permissions.isAdmin;
        }
    }

    // Ensure user always has basic read permissions
    if (!basePermissions.capabilities.includes("read_tests")) {
        basePermissions.capabilities.unshift("read_tests");
    }

    return basePermissions;
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
                    capabilities: ["read_tests"]
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
                    capabilities: ["read_tests"]
                });
                setUserProfile({});
                return;
            }

            // Determine if user is admin
            const userRole = result.userData.role || ['member'];
            const isAdmin = userRole.includes('admin') || 
                           userRole.includes('super_admin') || 
                           result.userData.isAdmin === true;

            // Set comprehensive permissions
            const permissions = determineUserPermissions(result.userData, isAdmin);
            
            console.log('Setting user permissions:', {
                userData: result.userData,
                calculatedPermissions: permissions,
                userRoles: userRole,
                isAdmin
            });

            setUserPermissions(permissions);
            setUserProfile(result.userData);

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
                capabilities: ["read_tests", "manage_bugs"] // Give basic bug management on error
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
        
        if (userPermissions.isAdmin) {
            console.log('User is admin, granting role:', role);
            return true;
        }
        
        const hasUserRole = userPermissions.roles?.includes(role) || false;
        console.log('Role check result:', {
            role,
            hasUserRole,
            userRoles: userPermissions.roles,
            isAdmin: userPermissions.isAdmin
        });
        
        return hasUserRole;
    }, [userPermissions]);

    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return false;

        try {
            setLoading(true);
            const userData = await fetchUserData(currentUser.uid);

            if (userData) {
                const userRole = userData.role || ['member'];
                const isAdmin = userRole.includes('admin') || 
                               userRole.includes('super_admin') || 
                               userData.isAdmin === true;

                const permissions = determineUserPermissions(userData, isAdmin);
                
                setUserPermissions(permissions);
                setUserProfile(userData);
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

    const clearAuthError = () => {
        setAuthError(null);
    };

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

    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        environment,
        initialized,
        updateUserProfile,
        signIn,
        signInWithGoogle,
        registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        signOut,
        hasPermission,
        hasRole,
        clearAuthError,
        refreshUserData,
        createUserIfNotExists,
        completeUserSetup,
        markEmailVerified,
        redirectToEmailVerification
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;