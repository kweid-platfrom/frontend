"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

import {
    createUserIfNotExists,
    fetchUserData,
    completeUserSetup
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
            let authSource = 'auth';
            if (user.providerData?.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider === 'google.com') authSource = 'google';
                else if (provider === 'password') authSource = 'email';
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

            setCurrentUser(user);
            setUserPermissions(result.userData.permissions || {
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            });
            setUserProfile(result.userData);

            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;

                // 1️⃣ EMAIL VERIFICATION GATE
                if (!user.emailVerified) {
                    // If user is not on verify-email page, redirect there
                    if (currentPath !== "/verify-email") {
                        router.push("/verify-email");
                    }
                    return; // stop further routing
                }

                // 2️⃣ ONBOARDING GATE
                // Define onboarding need - either new user or incomplete setup flag from your API
                const needsOnboarding = result.isNewUser || result.needsSetup;

                if (needsOnboarding) {
                    localStorage.setItem("needsOnboarding", "true");

                    // Route to onboarding only if user is on login/register/verify-email pages or at root
                    if (
                        currentPath === "/login" ||
                        currentPath === "/register" ||
                        currentPath === "/verify-email" ||
                        currentPath === "/"
                    ) {
                        // You mentioned onboarding depends on account type in userData:
                        // e.g. userData.accountType = 'individual' or 'organization'
                        const accountType = result.userData.accountType || "individual";

                        // Route onboarding dynamically based on account type
                        if (accountType === "organization") {
                            router.push("/onboarding/organization");
                        } else {
                            router.push("/onboarding/individual");
                        }
                    }
                    return;
                } else {
                    localStorage.removeItem("needsOnboarding");

                    // If user is already on login/register/verify-email/onboarding, redirect to dashboard
                    if (
                        currentPath === "/login" ||
                        currentPath === "/register" ||
                        currentPath === "/verify-email" ||
                        currentPath.startsWith("/onboarding")
                    ) {
                        router.push("/dashboard");
                    }
                }
            }

        } catch (error) {
            console.error("Error processing authentication:", error);

            // Set basic user info even if profile fetch fails
            setCurrentUser(user);
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
            const result = await authRegisterWithEmail(email, password);
            return { success: true, user: result.user };
        } catch (error) {
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
            if (typeof window !== 'undefined') {
                localStorage.removeItem("needsAccountSetup");
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
        completeUserSetup
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;