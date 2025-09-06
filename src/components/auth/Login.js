"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebase";
import BackgroundDecorations from "@/components/BackgroundDecorations";
import "../../app/globals.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loadingEmailLogin, setLoadingEmailLogin] = useState(false);
    const [loadingGoogleLogin, setLoadingGoogleLogin] = useState(false);
    const [loadingResendVerification, setLoadingResendVerification] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [showVerificationHelper, setShowVerificationHelper] = useState(false);
    const [unverifiedUser, setUnverifiedUser] = useState(null);
    const [toast, setToast] = useState({ type: "", message: "", duration: 3000 });

    const router = useRouter();
    const hasNavigated = useRef(false);

    // Handle URL parameters for feedback messages
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get("verified");

        if (verified === "true") {
            setToast({ type: "success", message: "Email verified successfully! You can now sign in.", duration: 3000 });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", { user, emailVerified: user?.emailVerified });
            if (user?.emailVerified && !hasNavigated.current) {
                hasNavigated.current = true;
                setToast({ type: "success", message: "Welcome back! You have successfully signed in.", duration: 3000 });
                router.push("/dashboard");
            } else if (!user) {
                hasNavigated.current = false;
            }
        });

        return () => unsubscribe();
    }, [router]);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: "", password: "" };

        if (!email) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        if (!password) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleResendVerification = async () => {
        if (!unverifiedUser) return;

        setLoadingResendVerification(true);

        try {
            await sendEmailVerification(unverifiedUser);
            setToast({ type: "success", message: "Verification email sent. Please check your inbox and spam folder.", duration: 5000 });
            setShowVerificationHelper(false);
            setUnverifiedUser(null);
        } catch (error) {
            const errorMessages = {
                'auth/too-many-requests': "Too many attempts. Please try again later.",
                'auth/user-not-found': "User not found.",
            };
            setToast({ type: "error", message: errorMessages[error.code] || "Failed to send verification email.", duration: 5000 });
        }

        setLoadingResendVerification(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        setLoadingEmailLogin(true);
        setShowVerificationHelper(false);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (!user.emailVerified) {
                setToast({ type: "warning", message: "Please verify your email before signing in. Check your inbox for the verification link.", duration: 5000 });
                setUnverifiedUser(user);
                setShowVerificationHelper(true);
                await auth.signOut();
                return;
            }
            setToast({ type: "success", message: "Login successful!", duration: 3000 });
        } catch (error) {
            const errorMessages = {
                'auth/user-not-found': "No account found with this email.",
                'auth/wrong-password': "Incorrect password.",
                'auth/invalid-email': "Invalid email format.",
                'auth/too-many-requests': "Too many attempts. Please try again later.",
            };
            setToast({ type: "error", message: errorMessages[error.code] || error.message || "Login failed.", duration: 5000 });
        }

        setLoadingEmailLogin(false);
    };

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setLoadingGoogleLogin(true);

        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const isNewUser = userCredential._tokenResponse?.isNewUser;
            if (isNewUser) {
                setToast({ type: "info", message: "Please complete your registration first.", duration: 3000 });
                router.push("/register");
                return;
            }
            setToast({ type: "success", message: "Login successful!", duration: 3000 });
        } catch (error) {
            const errorMessages = {
                'auth/popup-closed-by-user': "Google sign-in was cancelled.",
                'auth/too-many-requests': "Too many attempts. Please try again later.",
            };
            setToast({ type: "error", message: errorMessages[error.code] || error.message || "Google login failed.", duration: 5000 });
        }

        setLoadingGoogleLogin(false);
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push("/forgot-password");
    };

    const VerificationHelper = () => (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-amber-800 mb-1">Email Verification Required</h3>
                    <p className="text-sm text-amber-700 mb-3">
                        Your account exists but your email address hasn&apos;t been verified yet.
                        Please check your inbox for the verification link, or we can send you a new one.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleResendVerification}
                            disabled={loadingResendVerification}
                            className="flex items-center justify-center gap-2 bg-amber-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loadingResendVerification ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4" />
                                    Resend Verification
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setShowVerificationHelper(false);
                                setUnverifiedUser(null);
                            }}
                            className="text-amber-600 text-sm px-4 py-2 rounded-lg border border-amber-600 hover:bg-amber-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (auth.currentUser?.emailVerified && hasNavigated.current) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600">Signing you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            <BackgroundDecorations />
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-4">
                        <div className="inline-block">
                             <div className="flex items-center space-x-2 mb-2">
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <img src="/logo.png" alt="Assura Logo" className="w-16 h-16 object-contain" />
                                </div>
                                <span className="text-2xl font-bold text-slate-900">Assura</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
                            <p className="text-base sm:text-lg text-slate-600">Your testing hub awaits</p>
                        </div>
                        <form className="space-y-6" onSubmit={handleLogin} noValidate>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">Email address</label>
                                <input
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${errors.email ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                                        } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({ ...errors, email: "" });
                                    }}
                                />
                                {errors.email && (
                                    <p className="text-red-600 text-xs font-medium mt-2">{errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">Password</label>
                                <div className="relative">
                                    <input
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${errors.password ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                                            } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: "" });
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-600 text-xs font-medium mt-2">{errors.password}</p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-teal-600 text-xs sm:text-sm font-medium hover:text-teal-700 hover:underline transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <button
                                className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                                type="submit"
                                disabled={loadingEmailLogin}
                            >
                                Sign In
                                {loadingEmailLogin && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                            </button>
                        </form>
                        {showVerificationHelper && <VerificationHelper />}
                        <div className="flex items-center my-8">
                            <div className="flex-grow border-t border-slate-300"></div>
                            <span className="px-4 text-sm text-slate-500 font-medium bg-white">or continue with</span>
                            <div className="flex-grow border-t border-slate-300"></div>
                        </div>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 font-medium sm:font-semibold border-2 border-slate-200 rounded px-3 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            disabled={loadingGoogleLogin}
                        >
                            <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span className="truncate">Google</span>
                            {loadingGoogleLogin && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                        </button>
                        <p className="text-center text-slate-600 mt-4 sm:mt-6 text-xs sm:text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-teal-600 font-medium sm:font-semibold hover:text-teal-700 hover:underline transition-colors">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            {toast.message && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-yellow-600"}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default Login;