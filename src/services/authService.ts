import { 
    sendEmailVerification, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    signOut,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    updatePassword,
    EmailAuthProvider,
    linkWithCredential,
    UserCredential
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

/**
 * Sign in with Google using popup
 * @returns {Promise<UserCredential>}
 */
const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
        // Configure Google provider
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await signInWithPopup(auth, googleProvider);
        return result;
    } catch (error) {
        console.error("Google Sign-In Error", error);
        throw error;
    }
};

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
};

/**
 * Register user with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
const registerWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        console.log("Verification email sent!");
        return userCredential;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

/**
 * Register user with email link (passwordless)
 * @param {string} email 
 * @param {string} name 
 * @returns {Promise<{success: boolean}>}
 */
const registerWithEmailLink = async (email: string, name: string): Promise<{ success: boolean }> => {
    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/account-setup`,
            handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        
        // Store data for account setup
        localStorage.setItem('emailForSignIn', email);
        localStorage.setItem('registeredUserName', name);
        localStorage.setItem('emailSentTimestamp', Date.now().toString());
        
        return { success: true };
    } catch (error) {
        console.error("Email link registration error:", error);
        throw error;
    }
};

/**
 * Complete email link sign-in and optionally set password
 * @param {string} email 
 * @param {string} url 
 * @param {string|null} password 
 * @returns {Promise<UserCredential>}
 */
const completeEmailLinkSignIn = async (email: string, url: string, password: string | null = null): Promise<UserCredential> => {
    try {
        if (!isSignInWithEmailLink(auth, url)) {
            throw new Error('Invalid sign-in link');
        }

        const result = await signInWithEmailLink(auth, email, url);
        
        // If password is provided, link it to the account
        if (password && result.user) {
            try {
                const credential = EmailAuthProvider.credential(email, password);
                await linkWithCredential(result.user, credential);
                console.log('Password linked to account');
            } catch (linkError) {
                console.log('Password linking failed, continuing without password:', 
                    linkError instanceof Error ? linkError.message : 'Unknown error');
                // Continue without password - user can set it later
            }
        }

        return result;
    } catch (error) {
        console.error("Email link sign-in error:", error);
        throw error;
    }
};

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<UserCredential>}
 */
const logInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in successfully!");
        return result;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

/**
 * Set password for existing user (useful after email link auth)
 * @param {string} password 
 * @returns {Promise<{success: boolean}>}
 */
const setUserPassword = async (password: string): Promise<{ success: boolean }> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No authenticated user');
        }

        // Try to update password directly
        await updatePassword(user, password);
        return { success: true };
    } catch (error) {
        // If direct update fails, try linking email/password credential
        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                throw new Error('No authenticated user or email');
            }
            const credential = EmailAuthProvider.credential(user.email, password);
            await linkWithCredential(user, credential);
            return { success: true };
        } catch (linkError) {
            console.error("Password setting failed:", error, linkError);
            throw new Error('Failed to set password');
        }
    }
};

/**
 * Check if current URL is a sign-in link
 * @param {string} url 
 * @returns {boolean}
 */
const isEmailSignInLink = (url: string): boolean => {
    return isSignInWithEmailLink(auth, url);
};

export {
    signInWithGoogle,
    logInWithEmail,
    logout,
    registerWithEmail,
    registerWithEmailLink,
    completeEmailLinkSignIn,
    setUserPassword,
    isEmailSignInLink
};