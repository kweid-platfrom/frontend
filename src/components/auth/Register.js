"use client";

import { useState, useEffect } from "react";
import { sendSignInLinkToEmail, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAlert } from "../../components/CustomAlert";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import "../../app/globals.css";

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
            // Log the URL being used (helpful for debugging)
            console.log(`Using continuation URL: ${appUrl}/account-setup`);
            
            const actionCodeSettings = {
                // Use the dynamically set app URL
                url: `${appUrl}/account-setup`,
                handleCodeInApp: true,
                // Extended expiration time (3 days)
                expires: 259200
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            
            // Store email and timestamp in localStorage
            window.localStorage.setItem("emailForSignIn", email);
            window.localStorage.setItem("emailSentTimestamp", Date.now().toString());
            
            showAlert("Verification email sent. Please check your inbox. The link will be valid for 3 days.", "success");
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
            }
            
            showAlert(`Registration failed: ${errorMessage}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            showAlert("Registration successful!", "success");
            router.push("/dashboard");
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
                    Continue with Google
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
                        Verification link will be valid for 3 days
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