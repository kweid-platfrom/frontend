"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, environment } from "../config/firebase";
import { useRouter } from "next/navigation";

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const router = useRouter();

    // Create Google provider instance
    const googleProvider = new GoogleAuthProvider();

    // Fetch user data from Firestore
    const fetchUserData = useCallback(async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data();
            } else {
                console.log("No user data found");
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    }, []);

    // Create default user document structure
    const createDefaultUserDocument = (user) => ({
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        firstName: user.displayName ? user.displayName.split(' ')[0] : "",
        lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : "",
        phone: "",
        location: "",
        jobRole: "",
        avatarUrl: user.photoURL || "",
        permissions: {
            isAdmin: false,
            roles: ["user"],
            capabilities: ["read_tests"]
        },
        organizationId: null,
        role: "user",
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        environment: environment // Record which environment the user was created in
    });

    // Create user document if it doesn't exist
    const createUserIfNotExists = useCallback(async (user) => {
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new user document with default structure
                const userData = createDefaultUserDocument(user);
                await setDoc(userRef, userData);
                return { isNewUser: true, userData };
            }

            // User exists, just return the data
            return { isNewUser: false, userData: userSnap.data() };
        } catch (error) {
            console.error("Error creating/checking user:", error);
            return { isNewUser: false, userData: null, error };
        }
    }, []);

    // Update last login timestamp
    const updateUserLastLogin = useCallback(async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
    
            // Fetch the updated user data
            return await fetchUserData(userId);
        } catch (error) {
            console.error("Error updating last login:", error);
            // Don't fail the authentication process due to last login update failure
            return await fetchUserData(userId);
        }
    }, [fetchUserData]);

    // Process user authentication
    const processUserAuthentication = useCallback(async (user) => {
        if (!user) {
            setCurrentUser(null);
            setUserPermissions(null);
            setUserProfile(null);
            return;
        }
    
        try {
            // Check if user needs to complete account setup (from localStorage)
            const needsAccountSetup = typeof window !== 'undefined' ? localStorage.getItem("needsAccountSetup") : null;
            
            // Check if user exists and create if needed
            const { userData, isNewUser } = await createUserIfNotExists(user);
    
            // Update last login for existing users
            let updatedUserData = userData;
            if (!isNewUser) {
                updatedUserData = await updateUserLastLogin(user.uid) || userData;
            }
    
            // Set user state
            setCurrentUser(user);
            setUserPermissions(updatedUserData?.permissions || {
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            });
            setUserProfile(updatedUserData?.profile || {});
            
            // Handle routing based on user state and current location
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                
                if (isNewUser || needsAccountSetup === "true") {
                    // New user or needs account setup
                    localStorage.setItem("needsAccountSetup", "true");
                    if (currentPath === "/login" || currentPath === "/register") {
                        router.push("/account-setup");
                    }
                } else {
                    // Existing user - redirect from login/register pages to dashboard
                    if (currentPath === "/login" || currentPath === "/register") {
                        router.push("/dashboard");
                    }
                    // Clear any setup flags
                    localStorage.removeItem("needsAccountSetup");
                }
            }
        } catch (error) {
            console.error("Error processing authentication:", error);
            // Set basic user info even if profile fetch fails
            setCurrentUser(user);
            setUserPermissions({ isAdmin: false, roles: ["user"], capabilities: ["read_tests"] });
            setUserProfile({});
        }
    }, [createUserIfNotExists, updateUserLastLogin, router]);

    // Handle redirect result (for redirect sign-in)
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                setLoading(true);
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    // User signed in via redirect
                    await processUserAuthentication(result.user);
                }
            } catch (error) {
                console.error("Error handling redirect result:", error);
                setAuthError(error.message);
            } finally {
                setLoading(false);
            }
        };

        handleRedirectResult();
    }, [processUserAuthentication]);

    // Set up auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                await processUserAuthentication(user);
            } catch (error) {
                console.error("Auth state change error:", error);
            } finally {
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [processUserAuthentication]);

    // Sign in with email and password
    const signIn = async (email, password) => {
        setAuthError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Auth state change listener will handle the rest
            return { success: true, user: userCredential.user };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    // Sign in with Google (popup method)
    const signInWithGoogle = async () => {
        setAuthError(null);

        try {
            // Configure Google provider
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, googleProvider);
            // Auth state change listener will handle the rest
            return { 
                success: true, 
                user: result.user,
                isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime
            };
        } catch (error) {
            console.error("Google sign-in error:", error);

            // If popup is blocked or fails, try redirect method
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
                return signInWithGoogleRedirect();
            }

            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    // Sign in with Google (redirect method - fallback)
    const signInWithGoogleRedirect = async () => {
        setAuthError(null);

        try {
            // Configure Google provider
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            await signInWithRedirect(auth, googleProvider);
            // The result will be handled in useEffect with getRedirectResult
            return { success: true, isRedirect: true };
        } catch (error) {
            setAuthError(error.message);
            return { success: false, error: error.message };
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            // Clear localStorage
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

    // Refresh user data
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
                setUserProfile(userData.profile || {});
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error refreshing user data:", error);
            return false;
        } finally {
            setLoading(false);
        }
    }, [currentUser, fetchUserData]);

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
        environment, // Directly use the imported environment value
        signIn,
        signInWithGoogle,
        signInWithGoogleRedirect,
        signOut,
        hasPermission,
        hasRole,
        clearAuthError,
        refreshUserData
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;