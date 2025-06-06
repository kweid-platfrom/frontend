"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

// Import unified user service
import { 
    createUserIfNotExists, 
    fetchUserData, 
    completeUserSetup 
} from "../services/userService";

// Import AuthService functions
import { 
    signInWithGoogle as authSignInWithGoogle,
    logInWithEmail as authLoginWithEmail,
    logout as authLogout,
    registerWithEmail as authRegisterWithEmail,
    registerWithEmailLink as authRegisterWithEmailLink,
    completeEmailLinkSignIn as authCompleteEmailLinkSignIn,
    setUserPassword as authSetUserPassword
} from "../services/authService";

// Create context
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

    // Process user authentication with unified user service
    const processUserAuthentication = useCallback(async (user) => {
        console.log('🔐 Processing user authentication:', {
            hasUser: !!user,
            uid: user?.uid,
            email: user?.email
        });

        if (!user) {
            console.log('👋 No user - clearing auth state');
            setCurrentUser(null);
            setUserPermissions(null);
            setUserProfile(null);
            return;
        }
    
        try {
            // Determine the source of authentication
            let authSource = 'auth';  // default
            if (user.providerData?.length > 0) {
                const provider = user.providerData[0].providerId;
                if (provider === 'google.com') authSource = 'google';
                else if (provider === 'password') authSource = 'email';
            }

            console.log('🔍 Authentication source:', authSource);
            
            // Use unified user service to handle user creation/fetching
            const { userData, isNewUser, needsSetup, error } = await createUserIfNotExists(
                user, 
                {}, // No additional data at this stage
                authSource
            );

            if (error) {
                console.error('❌ User creation/fetch failed:', error);
                setAuthError(error);
                return;
            }

            if (!userData) {
                console.error('❌ No user data available after creation/fetch');
                setAuthError('Failed to load user data');
                return;
            }
    
            // Set user state
            console.log('✅ Setting user state:', {
                uid: user.uid,
                isNewUser,
                needsSetup,
                setupCompleted: userData.setupCompleted
            });

            setCurrentUser(user);
            setUserPermissions(userData.permissions || {
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            });
            setUserProfile(userData);
            
            // Handle routing based on user state and current location
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                console.log('🧭 Current path:', currentPath);
                
                // Check if user needs account setup
                const needsAccountSetup = isNewUser || needsSetup || !userData.setupCompleted;
                
                if (needsAccountSetup) {
                    console.log('🆕 User needs account setup - redirecting to account-setup');
                    localStorage.setItem("needsAccountSetup", "true");
                    if (currentPath === "/login" || currentPath === "/register") {
                        router.push("/account-setup");
                    }
                } else {
                    console.log('👤 User setup complete - handling redirect');
                    // Existing user with completed setup
                    if (currentPath === "/login" || currentPath === "/register" || currentPath === "/account-setup") {
                        router.push("/dashboard");
                    }
                    // Clear any setup flags
                    localStorage.removeItem("needsAccountSetup");
                }
            }
        } catch (error) {
            console.error("💥 Error processing authentication:", {
                code: error.code,
                message: error.message,
                uid: user?.uid
            });
            
            // Set basic user info even if profile fetch fails
            setCurrentUser(user);
            setUserPermissions({ isAdmin: false, roles: ["user"], capabilities: ["read_tests"] });
            setUserProfile({});
            setAuthError(error.message);
        }
    }, [router]);

    // Handle redirect result (for redirect sign-in)
    useEffect(() => {
        const handleRedirectResult = async () => {
            if (initialized) return;
            
            try {
                console.log('🔄 Handling redirect result...');
                setLoading(true);
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log('✅ User signed in via redirect:', result.user.uid);
                    await processUserAuthentication(result.user);
                } else {
                    console.log('ℹ️ No redirect result found');
                }
            } catch (error) {
                console.error("❌ Error handling redirect result:", error);
                setAuthError(error.message);
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        handleRedirectResult();
    }, [processUserAuthentication, initialized]);

    // Set up auth state listener
    useEffect(() => {
        console.log('👂 Setting up auth state listener...');
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('🔔 Auth state changed:', {
                hasUser: !!user,
                uid: user?.uid,
                email: user?.email
            });

            try {
                await processUserAuthentication(user);
            } catch (error) {
                console.error("❌ Auth state change error:", error);
                setAuthError(error.message);
            } finally {
                if (!initialized) {
                    setLoading(false);
                    setInitialized(true);
                }
            }
        });

        // Cleanup subscription on unmount
        return () => {
            console.log('🧹 Cleaning up auth listener');
            unsubscribe();
        };
    }, [processUserAuthentication, initialized]);

    // AuthContext methods that use AuthService internally
    const signIn = async (email, password) => {
        console.log('📧 Attempting sign in with email:', email);
        setAuthError(null);
        try {
            const result = await authLoginWithEmail(email, password);
            console.log('✅ Sign in successful:', result.user.uid);
            // Auth state change listener will handle the rest
            return { success: true, user: result.user };
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const signInWithGoogle = async () => {
        console.log('🔍 Attempting Google sign in...');
        setAuthError(null);
        try {
            const result = await authSignInWithGoogle();
            console.log('✅ Google sign in successful:', result.user.uid);
            // Auth state change listener will handle the rest
            return { 
                success: true, 
                user: result.user,
                isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime
            };
        } catch (error) {
            console.error("❌ Google sign-in error:", error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const registerWithEmail = async (email, password) => {
        console.log('📝 Attempting email registration:', email);
        setAuthError(null);
        try {
            const result = await authRegisterWithEmail(email, password);
            console.log('✅ Email registration successful:', result.user.uid);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('❌ Email registration failed:', error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const registerWithEmailLink = async (email, name) => {
        console.log('🔗 Attempting email link registration:', email);
        setAuthError(null);
        try {
            await authRegisterWithEmailLink(email, name);
            console.log('✅ Email link sent successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Email link registration failed:', error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const completeEmailLinkSignIn = async (email, url, password = null) => {
        console.log('🔗 Completing email link sign in:', email);
        setAuthError(null);
        try {
            const result = await authCompleteEmailLinkSignIn(email, url, password);
            console.log('✅ Email link sign in completed:', result.user.uid);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('❌ Email link sign in failed:', error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const setUserPassword = async (password) => {
        console.log('🔑 Setting user password...');
        setAuthError(null);
        try {
            await authSetUserPassword(password);
            console.log('✅ Password set successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Password setting failed:', error);
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    const signOut = async () => {
        console.log('👋 Signing out...');
        try {
            await authLogout();
            // Clear localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem("needsAccountSetup");
            }
            console.log('✅ Sign out successful');
            router.push("/login");
            return { success: true };
        } catch (error) {
            console.error("❌ Sign out error:", error);
            return { success: false, error: error.message };
        }
    };

    // Check if user has specific permission
    const hasPermission = useCallback((capability) => {
        if (!userPermissions) return false;
        if (userPermissions.isAdmin) return true;
        return userPermissions.capabilities?.includes(capability) || false;
    }, [userPermissions]);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        if (!userPermissions) return false;
        if (userPermissions.isAdmin) return true;
        return userPermissions.roles?.includes(role) || false;
    }, [userPermissions]);

    // Refresh user data using unified service
    const refreshUserData = useCallback(async () => {
        if (!currentUser?.uid) return false;

        console.log('🔄 Refreshing user data...');
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
                console.log('✅ User data refreshed successfully');
                return true;
            }
            console.log('⚠️ No user data found during refresh');
            return false;
        } catch (error) {
            console.error("❌ Error refreshing user data:", error);
            return false;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const clearAuthError = () => {
        setAuthError(null);
    };

    // Export context value
    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        environment,
        initialized,
        // Authentication methods (using AuthService internally)
        signIn,
        signInWithGoogle,
        registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        signOut,
        // Utility methods
        hasPermission,
        hasRole,
        clearAuthError,
        refreshUserData,
        // Unified user service methods
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