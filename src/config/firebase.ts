// config/firebase.js
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

type Environment = "development" | "production";

const getEnvironment = (): Environment => {
    if (typeof window === "undefined") {
        // Server-side rendering, default to production or use env variable
        return (process.env.NEXT_PUBLIC_ENV as Environment) || "production";
    }
    const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
    return isLocalhost ? "development" : "production";
};

const firebaseConfig: Record<Environment, {
    apiKey: string | undefined;
    authDomain: string | undefined;
    projectId: string | undefined;
    storageBucket: string | undefined;
    messagingSenderId: string | undefined;
    appId: string | undefined;
}> = {
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

const environment: Environment = getEnvironment();
const currentConfig = firebaseConfig[environment];

// Validate configuration
if (!currentConfig.projectId) {
    console.error(
        `Firebase configuration error: projectId is undefined for ${environment} environment. ` +
        `Check .env.local for ${environment === "development" ? "NEXT_PUBLIC_DEV_FIREBASE_PROJECT_ID" : "NEXT_PUBLIC_FIREBASE_PROJECT_ID"}`
    );
    throw new Error("Firebase projectId is undefined. Please check environment variables.");
}

// Log config for debugging
console.log('Firebase Config:', {
    environment,
    apiKey: currentConfig.apiKey ? 'Set' : 'Missing',
    projectId: currentConfig.projectId || 'Missing',
    authDomain: currentConfig.authDomain || 'Missing',
});

// Initialize Firebase
const app = initializeApp(currentConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Ensure session persists across refresh
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting persistence:', error);
});

export { app, auth, googleProvider, db, storage, environment };