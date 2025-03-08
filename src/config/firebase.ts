import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDnijsnCLYFNrJ8DhvT2bhohgjb7bSr3as",
    authDomain: "kweidorigin.firebaseapp.com",
    projectId: "kweidorigin",
    storageBucket: "kweidorigin.firebasestorage.app",
    messagingSenderId: "404106955543",
    appId: "1:404106955543:web:741b7eb7f2dd07ee7ac552"
};

//initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, googleProvider, db}
