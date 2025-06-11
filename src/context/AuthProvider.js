"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

import {
    createUserIfNotExists,
    fetchUserData,
    completeUserSetup,
    updateUserProfile as updateUserProfileService
} from "../services/userService";

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

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const router = useRouter();

    // Get user profile from Firestore
    const getUserProfile = async (uid) => {
        try {
            if (!uid) {
                console.error('getUserProfile: No UID provided');
                return null;
            }
            
            const profile = await fetchUserData(uid);
            
            if (profile) {
                setUserProfile(profile);
                setUserPermissions(profile.permissions || {
                    isAdmin: false,
                    roles: ["user"],
                    capabilities: ["read_tests"]
                });
                return profile;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    // Update user profile in Firestore
    const updateUserProfile = async (uid, updateData) => {
        try {
            if (!uid) {
                throw new Error('No UID provided for profile update');
            }

            // Use the current user's UID for security
            const currentUserUid = currentUser?.uid;
            if (!currentUserUid) {
                throw new Error('No authenticated user');
            }

            const updatedProfile = await updateUserProfileService(uid, updateData, currentUserUid);
            
            if (updatedProfile) {
                setUserProfile(updatedProfile);
                setUserPermissions(updatedProfile.permissions || {
                    isAdmin: false,
                    roles: ["user"],
                    capabilities: ["read_tests"]
                });
                return updatedProfile;
            }
            
            return null;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    };

    // Create or get existing user profile
    const createOrGetUserProfile = async (firebaseUser, additionalData = {}, source = 'auth') => {
        try {
            const result = await createUserIfNotExists(firebaseUser, additionalData, source);
            
            if (result.userData) {
                setUserProfile(result.userData);
                setUserPermissions(result.userData.permissions || {
                    isAdmin: false,
                    roles: ["user"],
                    capabilities: ["read_tests"]
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error creating/getting user profile:', error);
            throw error;
        }
    };

    // Complete user setup
    const completeSetup = async (setupData) => {
        try {
            if (!currentUser?.uid) {
                throw new Error('No authenticated user');
            }

            const updatedProfile = await completeUserSetup(currentUser.uid, setupData);
            
            if (updatedProfile) {
                setUserProfile(updatedProfile);
                setUserPermissions(updatedProfile.permissions || {
                    isAdmin: false,
                    roles: ["user"],
                    capabilities: ["read_tests"]
                });
                return updatedProfile;
            }
            
            return null;
        } catch (error) {
            console.error('Error completing user setup:', error);
            throw error;
        }
    };

    // Refresh user profile
    const refreshUserProfile = async () => {
        if (currentUser?.uid) {
            await getUserProfile(currentUser.uid);
        }
    };

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

            let authSource = 'auth';
            if (user.providerData?.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider === 'google.com') authSource = 'google';
                else if (provider === 'password') authSource = 'email';
            }

            // Check if we're in an email verification flow
            const justVerified = localStorage.getItem('emailVerificationComplete') === 'true';

            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                const isVerificationCallback = searchParams.get('mode') === 'verifyEmail';

                // If this is a verification callback, let the verify-email page handle it
                if (isVerificationCallback) {
                    if (currentPath !== "/verify-email") {
                        router.push(`/verify-email${window.location.search}`);
                    }
                    return;
                }
            }

            const result = await createUserIfNotExists(user, {}, authSource);

            if (result.error) {
                console.error('User creation/fetch failed:', result.error);
                setAuthError(result.error);
                return;
            }

            if (!result.userData) {
                console.error('No user data available');
                setAuthError('Failed to load user data');
                return;
            }

            setUserPermissions(result.userData.permissions || {
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            });
            setUserProfile(result.userData);

            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;

                // 1️⃣ EMAIL VERIFICATION GATE
                if (!user.emailVerified && !justVerified) {
                    // Skip verification check if user is already on verify-email page
                    if (currentPath !== "/verify-email") {
                        localStorage.setItem('awaitingEmailVerification', 'true');
                        router.push("/verify-email");
                    }
                    return; // stop further routing
                } else {
                    // Email is verified, clear any verification flags
                    localStorage.removeItem('awaitingEmailVerification');
                    if (justVerified) {
                        localStorage.removeItem('emailVerificationComplete');
                    }
                }

                // 2️⃣ ONBOARDING GATE
                const needsOnboarding = result.isNewUser || result.needsSetup ||
                    !result.userData.onboardingStatus?.onboardingComplete;

                console.log('Onboarding check:', {
                    needsOnboarding,
                    isNewUser: result.isNewUser,
                    needsSetup: result.needsSetup,
                    onboardingComplete: result.userData.onboardingStatus?.onboardingComplete,
                    currentPath
                });

                if (needsOnboarding) {
                    localStorage.setItem("needsOnboarding", "true");

                    // Route to onboarding only if user is on auth pages or at root
                    if (
                        currentPath === "/login" ||
                        currentPath === "/register" ||
                        currentPath === "/verify-email" ||
                        currentPath === "/" ||
                        currentPath === "/dashboard" ||
                        currentPath.startsWith("/handle-email-verification")
                    ) {
                        console.log('Routing to onboarding from:', currentPath);

                        // Just route to /onboarding - let OnboardingRouter handle the account type logic
                        router.push("/onboarding");
                    }
                    return;
                } else {
                    localStorage.removeItem("needsOnboarding");

                    // If user is on auth pages, redirect to dashboard
                    if (
                        currentPath === "/login" ||
                        currentPath === "/register" ||
                        currentPath === "/verify-email" ||
                        currentPath.startsWith("/onboarding") ||
                        currentPath.startsWith("/handle-email-verification")
                    ) {
                        console.log('Routing to dashboard from:', currentPath);
                        router.push("/dashboard");
                    }
                }
            }

        } catch (error) {
            console.error("Error processing authentication:", error);

            // Set basic user info even if profile fetch fails
            setUserPermissions({
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            });
            setUserProfile({});
            setAuthError(error.message);
        }
    }, [router]);

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
            // Set flag that we expect email verification
            localStorage.setItem('awaitingEmailVerification', 'true');

            const result = await authRegisterWithEmail(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            localStorage.removeItem('awaitingEmailVerification');
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const registerWithEmailLink = async (email, name) => {
        setAuthError(null);
        try {
            localStorage.setItem('awaitingEmailVerification', 'true');
            await authRegisterWithEmailLink(email, name);
            return { success: true };
        } catch (error) {
            localStorage.removeItem('awaitingEmailVerification');
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
            if (typeof window !== 'undefined') {
                localStorage.removeItem("needsAccountSetup");
                localStorage.removeItem("awaitingEmailVerification");
                localStorage.removeItem("emailVerificationComplete");
                localStorage.removeItem("needsOnboarding");
            }
            router.push("/login");
            return { success: true };
        } catch (error) {
            console.error("Sign out error:", error);
            return { success: false, error: error.message };
        }
    };

    const hasPermission = useCallback((capability) => {
        if (!userPermissions) return false;
        if (userPermissions.isAdmin) return true;
        return userPermissions.capabilities?.includes(capability) || false;
    }, [userPermissions]);

    const hasRole = useCallback((role) => {
        if (!userPermissions) return false;
        if (userPermissions.isAdmin) return true;
        return userPermissions.roles?.includes(role) || false;
    }, [userPermissions]);

    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return false;

        try {
            setLoading(true);
            const userData = await fetchUserData(currentUser.uid);

            if (userData) {
                setUserPermissions(userData.permissions || {
                    isAdmin: false,
                    roles: ["user"],
                    capabilities: ["read_tests"]
                });
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

    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        environment,
        initialized,
        // Auth methods
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
        clearAuthError,
        refreshUserData,
        // Profile methods - these were missing!
        getUserProfile,
        updateUserProfile,
        createOrGetUserProfile,
        completeSetup,
        refreshUserProfile,
        // Legacy methods for backward compatibility
        createUserIfNotExists,
        completeUserSetup
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;