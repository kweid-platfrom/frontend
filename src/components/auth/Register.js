"use client";

import { useState, useEffect } from "react";
import { sendSignInLinkToEmail, signInWithPopup, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAlert } from "../../components/CustomAlert";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import "../../app/globals.css";
import { doc, setDoc, getFirestore } from "firebase/firestore";

const db = getFirestore();

const Register = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [appUrl, setAppUrl] = useState("");
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    // Determine current app URL
    useEffect(() => {
        // Get URL from environment variable or dynamically build it
        let dynamicUrl = process.env.NEXT_PUBLIC_APP_URL;
        
        // If not available (or in development), use window.location
        if (!dynamicUrl || dynamicUrl === "undefined" || process.env.NODE_ENV === "development") {
            const protocol = window.location.protocol;
            const host = window.location.host;
            dynamicUrl = `${protocol}//${host}`;
        }
        
        setAppUrl(dynamicUrl);
        console.log("Current environment:", process.env.NODE_ENV);
        console.log("Using app URL:", dynamicUrl);
    }, []);

    const validateEmail = (email) => {
        if (!email) {
            setEmailError("Email is required");
            return false;
        }
        
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            setEmailError("Please enter a valid email address");
            return false;
        }
        
        setEmailError("");
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            return;
        }

        setLoading(true);

        try {
            // Check if email already exists
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            if (signInMethods.length > 0) {
                setEmailError("This email is already registered. Please login instead.");
                setLoading(false);
                return;
            }

            // Get the current timestamp in seconds
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Set expiration to current time + 7 days (maximum allowed by Firebase)
            const expirationTime = currentTime + 604800; // 7 days in seconds
            
            console.log(`Using continuation URL: ${appUrl}/account-setup`);
            console.log(`Current time (seconds): ${currentTime}`);
            console.log(`Expiration time (seconds): ${expirationTime}`);
            
            const actionCodeSettings = {
                url: `${appUrl}/account-setup`,
                handleCodeInApp: true,
                // Maximum expiration time - 7 days
                expires: expirationTime
            };

            // Clear any existing emailForSignIn to avoid conflicts
            window.localStorage.removeItem("emailForSignIn");
            
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            
            // Store email in localStorage
            window.localStorage.setItem("emailForSignIn", email);
            window.localStorage.setItem("emailSentTimestamp", Date.now().toString());
            window.localStorage.setItem("isRegistering", "true");
            
            // Also store the expected expiration time for client-side validation
            window.localStorage.setItem("emailLinkExpiration", (Date.now() + 604800 * 1000).toString());
            
            showAlert("Verification email sent. Please check your inbox. The link will be valid for 7 days.", "success");
        } catch (error) {
            console.error("Firebase error:", error.code, error.message);
            
            // Provide more specific error message for common issues
            let errorMessage = error.message;
            if (error.code === "auth/invalid-continue-uri") {
                errorMessage = `Invalid URL format. Please check your environment configuration. (URL attempted: ${appUrl}/account-setup)`;
            } else if (error.code === "auth/missing-continue-uri") {
                errorMessage = "Missing URL. Please check your environment configuration.";
            } else if (error.code === "auth/unauthorized-continue-uri") {
                errorMessage = "This domain is not authorized in your Firebase console.";
            } else if (error.code === "auth/argument-error" && error.message.includes("expires")) {
                errorMessage = "Invalid expiration time format. Using default expiration.";
                
                // Try again without explicit expiration
                try {
                    const simpleActionCodeSettings = {
                        url: `${appUrl}/account-setup`,
                        handleCodeInApp: true
                    };
                    
                    await sendSignInLinkToEmail(auth, email, simpleActionCodeSettings);
                    window.localStorage.setItem("emailForSignIn", email);
                    window.localStorage.setItem("emailSentTimestamp", Date.now().toString());
                    window.localStorage.setItem("isRegistering", "true");
                    showAlert("Verification email sent. Please check your inbox.", "success");
                    setLoading(false);
                    return;
                } catch (retryError) {
                    errorMessage = `Retry failed: ${retryError.message}`;
                }
            }
            
            showAlert(`Registration failed: ${errorMessage}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // Generate a user-friendly ID
    const generateFriendlyUserId = () => {
        // Format: PREFIX-RANDOM-NUMBERS
        const prefix = "USER";
        const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        return `${prefix}-${randomPart}`;
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);
        try {
            // Check if the user already exists
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Check if this is a new user
            // Firebase doesn't directly tell us if this is a new user with Google SSO
            // But we can check metadata or make a Firestore query
            
            const isNewUser = result.additionalUserInfo?.isNewUser;
            
            if (isNewUser) {
                // Generate a friendly user ID for new users
                const friendlyUserId = generateFriendlyUserId();
                
                // Store the friendly ID in localStorage for the account setup page
                window.localStorage.setItem("friendlyUserId", friendlyUserId);
                window.localStorage.setItem("isGoogleSignUp", "true");
                
                // Create initial user document
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    friendlyUserId: friendlyUserId,
                    googleAuth: true,
                    createdAt: new Date(),
                    setupCompleted: false
                });
                
                showAlert("Account created! Please complete your profile setup.", "success");
                router.push("/account-setup");
            } else {
                // Existing user - redirect to dashboard
                showAlert("Welcome back! Redirecting to dashboard...", "success");
                router.push("/dashboard");
            }
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fff] flex flex-col items-center">
            <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                <Link href="/" className="font-bold text-2xl text-[#00897B] hover:text-[#00796B] transition-colors">
                    LOGO
                </Link>
            </header>
            
            {alertComponent}
            
            <div className="justify-center text-center p-5">
                <h2 className="text-[#2D3142] text-2xl font-bold text-center mb-3">Sign Up for QAID</h2>
                <p>– Streamline Your Testing Workflow –</p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-lg p-8 flex flex-col gap-6">
                <button 
                    onClick={handleGoogleRegister}
                    className="flex items-center justify-center gap-2 w-full bg-white text-[#4A4B53] border border-[#E1E2E6] rounded px-4 py-3 text-base hover:bg-gray-50 hover:border-[#9EA0A5] transition-colors"
                    disabled={googleLoading}
                >
                    <FcGoogle className="w-5 h-5 fill-[#4285F4]" />
                    Sign Up with Google
                    {googleLoading && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                </button>

                <div className="flex items-center text-[#9EA0A5] my-2">
                    <div className="flex-grow border-t border-[#E1E2E6]"></div>
                    <span className="px-3 text-sm">or Register with Email</span>
                    <div className="flex-grow border-t border-[#E1E2E6]"></div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleRegister} noValidate>
                    <div className="flex flex-col gap-1">
                        <input
                            className={`px-4 py-3 border ${
                                emailError ? "border-red-500" : "border-[#E1E2E6]"
                            } rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]`}
                            type="email"
                            placeholder="Company email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError("");
                            }}
                        />
                        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                    </div>

                    <button
                        className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors flex items-center justify-center gap-2"
                        type="submit"
                        disabled={loading}
                    >
                        Sign Up
                        {loading && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        Verification link will be valid for 7 days
                    </p>
                </form>

                <p className="text-sm text-[#4A4B53] text-center">
                    By registering, you agree to our{" "}
                    <Link href="/terms" className="text-[#00897B] font-medium hover:underline">
                        Terms and Conditions
                    </Link>
                </p>

                <p className="text-md text-[#4A4B53] text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#00897B] font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;