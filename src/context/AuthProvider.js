import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebase"; // Ensure this is your Firebase auth instance
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    const login = async (email, password) => {
        setAuthError(null); // Reset error state before attempting login
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setAuthError(error.message);
            throw error; // Re-throw error so components using `login` can handle it
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, authError }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom Hook for easy usage
export const useAuth = () => {
    return useContext(AuthContext);
};
