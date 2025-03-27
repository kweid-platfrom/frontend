"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
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
    const fetchUserData = async (userId) => {
        try {
            const userRef = doc(db, "users", userId)
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
    };

        // Check if user exists in Firestore
        const checkUserExists = async (email) => {
            try {
                // Query Firestore to find a user with this email
                const q = doc(db, "users", email);
                const userSnap = await getDoc(q);
                return userSnap.exists();
            } catch (error) {
                console.error("Error checking user existence:", error);
                return false;
            }
        };

    // Update last login timestamp
    const updateUserLastLogin = async (userId) => {
        try {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, {
                lastLogin: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error updating last login:", error);
        }
    };
    // Handle redirect result (for redirect sign-in)
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    // Check if existing user before allowing login
                    const userExists = await checkUserExists(result.user.email);
                    if (!userExists) {
                        // If not an existing user, sign out and prevent access
                        await firebaseSignOut(auth);
                        setAuthError("Google SSO is only available for existing users.");
                        return;
                    }
                    
                    // Update last login for existing users
                    await updateUserLastLogin(result.user.uid);
                }
            } catch (error) {
                console.error("Error handling redirect result:", error);
                setAuthError(error.message);
            }
        };
        
        handleRedirectResult();
    }, []);

    // Set up auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // User is signed in
                    const userData = await fetchUserData(user.uid);
                    if (userData) {
                        setCurrentUser(user);
                        setUserPermissions(userData.permissions || { isAdmin: false, roles: [], capabilities: [] });
                        setUserProfile(userData.profile || {});
                    } else {
                        // First time sign-in, user data might not be available yet
                        setCurrentUser(user);
                        setUserPermissions({ isAdmin: false, roles: ["user"], capabilities: ["read_tests"] });
                        setUserProfile({});
                    }
                } else {
                    // User is signed out
                    setCurrentUser(null);
                    setUserPermissions(null);
                    setUserProfile(null);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
            } finally {
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Sign in with email and password
    const signIn = async (email, password) => {
        setAuthError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document if it doesn't exist
            await createUserIfNotExists(user);

            // Update last login timestamp
            await updateUserLastLogin(user.uid);

            return { success: true };
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
            const user = result.user;

            // Check if user exists in Firestore before allowing login
            const userExists = await checkUserExists(user.email);
            if (!userExists) {
                // If not an existing user, sign out and prevent access
                await firebaseSignOut(auth);
                return { 
                    success: false, 
                    error: "Google SSO is only available for existing users. Please register first." 
                };
            }

            // Update last login timestamp for existing users
            await updateUserLastLogin(user.uid);

            return { success: true, isExistingUser: true };
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
            router.push("/login");
            return { success: true };
        } catch (error) {
            console.error("Sign out error:", error);
            return { success: false, error: error.message };
        }
    };

    // Check if user has specific permission
    const hasPermission = (capability) => {
        if (!userPermissions) return false;
        if (userPermissions.isAdmin) return true;
        return userPermissions.capabilities?.includes(capability) || false;
    };

    // Check if user has specific role
    const hasRole = (role) => {
        if (!userPermissions) return false;
        if (userPermissions.isAdmin) return true;
        return userPermissions.roles?.includes(role) || false;
    };

    const clearAuthError = () => {
        setAuthError(null);
    };

    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        authError,
        signIn,
        signInWithGoogle,
        signInWithGoogleRedirect,
        signOut,
        hasPermission,
        hasRole,
        clearAuthError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;