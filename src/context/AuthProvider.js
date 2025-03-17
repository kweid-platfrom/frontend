    
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../config/firebase";
import { useRouter } from "next/navigation";

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch user data from Firestore
    const fetchUserData = async (userId) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            console.log("No user data found");
            return null;
        }
    };

    // Create user document if it doesn't exist
    const createUserIfNotExists = async (user) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create new user document with default permissions
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
                permissions: {
                    isAdmin: false,
                    roles: ["user"],
                    capabilities: ["read_tests"]
                },
                profile: {
                    firstName: "",
                    lastName: "",
                    company: "",
                    position: "",
                    createdAt: new Date().toISOString()
                },
                lastLogin: new Date().toISOString()
            });
            return true;
        }
        return false;
    };

    // Update last login timestamp
    const updateUserLastLogin = async (userId) => {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, {
            lastLogin: new Date().toISOString()
        }, { merge: true });
    };

    // Set up auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                try {
                    const userData = await fetchUserData(user.uid);
                    if (userData) {
                        setCurrentUser(user);
                        setUserPermissions(userData.permissions || { isAdmin: false, roles: [], capabilities: [] });
                        setUserProfile(userData.profile || {});
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                // User is signed out
                setCurrentUser(null);
                setUserPermissions(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Sign in with email and password
    const signIn = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document if it doesn't exist
            await createUserIfNotExists(user);

            // Update last login timestamp
            await updateUserLastLogin(user.uid);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if this is a new user
            const isNewUser = await createUserIfNotExists(user);

            // Update last login timestamp
            await updateUserLastLogin(user.uid);

            return { success: true, isNewUser };
        } catch (error) {
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

    const value = {
        currentUser,
        userPermissions,
        userProfile,
        loading,
        signIn,
        signInWithGoogle,
        signOut,
        hasPermission,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};