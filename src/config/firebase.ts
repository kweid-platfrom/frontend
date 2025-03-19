import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import storage

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDnijsnCLYFNrJ8DhvT2bhohgjb7bSr3as",
    authDomain: "kweidorigin.firebaseapp.com",
    projectId: "kweidorigin",
    storageBucket: "kweidorigin.firebasestorage.app",
    messagingSenderId: "404106955543",
    appId: "1:404106955543:web:741b7eb7f2dd07ee7ac552"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app); 




// Ensure session persists across refresh
setPersistence(auth, browserLocalPersistence);

export { app, auth, googleProvider, db, storage }; // Export storage
