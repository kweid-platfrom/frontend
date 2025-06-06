"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import '../../app/globals.css';

const Register = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [fullNameError, setFullNameError] = useState("");
    const [emailError, setEmailError] = useState("");

    const validateFullName = (name) => {
        if (!name.trim()) {
            setFullNameError("Full name is required");
            return false;
        }
        if (name.trim().length < 2) {
            setFullNameError("Full name must be at least 2 characters");
            return false;
        }
        setFullNameError("");
        return true;
    };

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

        const isNameValid = validateFullName(fullName);
        const isEmailValid = validateEmail(email);

        if (!isNameValid || !isEmailValid) {
            return;
        }

        setLoading(true);

        try {
            const actionCodeSettings = {
                url: process.env.NEXT_PUBLIC_APP_URL
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/account-setup`
                    : "https://your-domain.com/account-setup",
                handleCodeInApp: true,
                expires: 259200
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);

            // Store user info for account setup
            window.localStorage.setItem("emailForSignIn", email);
            window.localStorage.setItem("registeredUserName", fullName.trim());
            window.localStorage.setItem("emailSentTimestamp", Date.now().toString());

            toast.success("Verification email sent! Please check your inbox. The link will be valid for 3 days.", {
                duration: 5000,
                position: "top-center"
            });

            // Clear form fields after successful email sending
            setFullName("");
            setEmail("");
        } catch (error) {
            console.error("Firebase error:", error.code, error.message);
            const errorMessage = getFirebaseErrorMessage(error);
            toast.error(errorMessage, {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);

        // Set flag BEFORE authentication
        localStorage.setItem("needsAccountSetup", "true");

        try {
            const result = await signInWithPopup(auth, googleProvider);

            // Get user details from Google authentication
            const user = result.user;
            const displayName = user.displayName || "";
            const email = user.email || "";
            const photoURL = user.photoURL || "";

            // Store user details in localStorage for the account setup page
            localStorage.setItem("googleUserName", displayName);
            localStorage.setItem("googleUserEmail", email);
            localStorage.setItem("googleUserPhoto", photoURL);

            toast.success("Google authentication successful!", {
                duration: 4000,
                position: "top-center"
            });

            // The redirect will be handled by processUserAuthentication in the AuthProvider
        } catch (error) {
            console.error(error.message);
            const errorMessage = getFirebaseErrorMessage(error);
            toast.error(errorMessage, {
                duration: 5000,
                position: "top-center"
            });
            // Clear the flag if authentication fails
            localStorage.removeItem("needsAccountSetup");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            {/* Toast Container */}
            <Toaster
                richColors
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '12px'
                    }
                }}
            />

            {/* Diagonal Zigzag Background Decoration */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="zigzagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#0891b2" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                <path
                    d="M-10,10 L20,40 L50,10 L80,40 L110,10 L110,25 L80,55 L50,25 L20,55 L-10,25 Z"
                    fill="url(#zigzagGradient)"
                />
                <path
                    d="M-10,50 L20,80 L50,50 L80,80 L110,50 L110,65 L80,95 L50,65 L20,95 L-10,65 Z"
                    fill="url(#zigzagGradient)"
                />
            </svg>

            {/* Additional Subtle Zigzag Lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent transform rotate-12"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent transform -rotate-12"></div>
            </div>

            {/* Existing Decorative Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-0 w-px h-32 bg-gradient-to-b from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute top-40 right-10 w-px h-24 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute bottom-32 left-20 w-16 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute bottom-20 right-0 w-20 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute top-1/3 left-1/4 w-px h-16 bg-gradient-to-b from-transparent via-slate-200 to-transparent transform rotate-45"></div>
                <div className="absolute top-2/3 right-1/4 w-12 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent transform rotate-45"></div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Welcome Section */}
                    <div className="text-center mb-6">
                        <div className="inline-block mb-4">
                            <div className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
                        <p className="text-sm sm:text-base text-slate-600">Streamline your testing workflow</p>
                    </div>

                    {/* Register Form Card */}
                    <div className="bg-white/90 backdrop-blur-sm rounded shadow-sm shadow-slate-200/50 border border-slate-200/50 p-4 sm:p-6">
                        <div className="space-y-4 sm:space-y-5">
                            {/* Google Sign Up */}
                            <button
                                onClick={handleGoogleRegister}
                                className="w-full bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 font-medium sm:font-semibold border-2 border-slate-200 rounded px-3 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                                ) : (
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                <span className="truncate">
                                    {googleLoading ? 'Signing up...' : 'Continue with Google'}
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="flex items-center my-4 sm:my-6">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="px-3 text-xs sm:text-sm text-slate-500 font-medium">or register with email</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            {/* Form Fields */}
                            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                                {/* Full Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Full name
                                    </label>
                                    <input
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${fullNameError
                                                ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                                                : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                            } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(e.target.value);
                                            if (fullNameError) setFullNameError("");
                                        }}
                                    />
                                    {fullNameError && (
                                        <p className="text-red-600 text-xs font-medium mt-1">
                                            {fullNameError}
                                        </p>
                                    )}
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Company email
                                    </label>
                                    <input
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${emailError
                                                ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                                                : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                            } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError("");
                                        }}
                                    />
                                    {emailError && (
                                        <p className="text-red-600 text-xs font-medium mt-1">
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                {/* Sign Up Button */}
                                <button
                                    type="submit"
                                    className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>Sending verification...</span>
                                        </>
                                    ) : (
                                        'Sign up'
                                    )}
                                </button>
                            </form>

                            {/* Terms */}
                            <p className="text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
                                By registering, you agree to our{" "}
                                <Link href="/terms" className="text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors">
                                    Terms and Conditions
                                </Link>
                            </p>

                            {/* Login Link */}
                            <p className="text-center text-slate-600 mt-4 sm:mt-6 text-xs sm:text-sm">
                                Already have an account?{" "}
                                <Link href="/login" className="text-teal-600 font-medium sm:font-semibold hover:text-teal-700 hover:underline transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;