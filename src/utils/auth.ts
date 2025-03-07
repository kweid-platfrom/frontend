import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

const signInWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Google Sign-In Error", error)
    }
};

const logout = async () => {
    await signOut(auth);
}

export {
    signInWithGoogle, logout
};