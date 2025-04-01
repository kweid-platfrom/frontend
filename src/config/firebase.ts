import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const getEnvironment = () => {
    const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");
    return isLocalhost ? "development" : "production";
};

// Your web app's Firebase configuration
const firebaseConfig = {
    development: {
        apiKey: process.env.NEXT_PUBLIC_DEV_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_DEV_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_DEV_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_DEV_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_DEV_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_DEV_FIREBASE_APP_ID,
    },
    production: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
};

const environment = getEnvironment();
const currentConfig = firebaseConfig[environment];

// Initialize Firebase
const app = initializeApp(currentConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Ensure session persists across refresh
setPersistence(auth, browserLocalPersistence);

export { app, auth, googleProvider, db, storage, environment }; // Export storage
