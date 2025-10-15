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
    // First, check NODE_ENV (most reliable)
    if (process.env.NODE_ENV === "development") {
        return "development";
    }
    
    // If NODE_ENV is production, check if we're explicitly overriding
    if (process.env.NEXT_PUBLIC_ENV === "development") {
        return "development";
    }
    
    // For client-side, also check hostname as fallback
    if (typeof window !== "undefined") {
        const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname.startsWith("192.168.") ||
            window.location.hostname.endsWith(".local");
        
        if (isLocalhost) {
            return "development";
        }
    }
    
    // Default to production
    return "production";
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

// Enhanced debugging
console.log('Environment Detection:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    hostname: typeof window !== "undefined" ? window.location.hostname : "server-side",
    detectedEnvironment: environment,
});

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
    storageBucket: currentConfig.storageBucket || 'Missing',
    messagingSenderId: currentConfig.messagingSenderId || 'Missing',
    appId: currentConfig.appId || 'Missing',
});

// Check if any config values are actually undefined
const configEntries = Object.entries(currentConfig);
const missingValues = configEntries.filter(([, value]) => !value);

if (missingValues.length > 0) {
    const missingKeys = missingValues.map(([key]) => key);
    console.warn(
        `⚠️ Missing Firebase configuration for ${environment}:`,
        missingKeys
    );
    console.warn(
        `Expected environment variables: ${environment === "development" 
            ? "NEXT_PUBLIC_DEV_FIREBASE_*" 
            : "NEXT_PUBLIC_FIREBASE_*"}`
    );
} else {
    console.log(`✅ All Firebase configuration loaded for ${environment}`);
}

// Initialize Firebase
const app = initializeApp(currentConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Ensure session persists across refresh (only on client-side)
if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error('Error setting persistence:', error);
    });
}

export { app, auth, googleProvider, db, storage, environment };