"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config/firebase";
import BackgroundDecorations from "@/components/BackgroundDecorations";
import Image from "next/image";
import { toast } from "sonner";
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

    const router = useRouter();
    const hasNavigated = useRef(false);

    // Handle URL parameters for feedback messages
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get("verified");

        if (verified === "true") {
            toast.success("Email verified successfully! You can now sign in.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", { user, emailVerified: user?.emailVerified });
            if (user?.emailVerified && !hasNavigated.current) {
                hasNavigated.current = true;
                toast.success("Welcome back! You have successfully signed in.");
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
            toast.success("Verification email sent. Please check your inbox and spam folder.");
            setShowVerificationHelper(false);
            setUnverifiedUser(null);
        } catch (error) {
            const errorMessages = {
                'auth/too-many-requests': "Too many attempts. Please try again later.",
                'auth/user-not-found': "User not found.",
            };
            toast.error(errorMessages[error.code] || "Failed to send verification email.");
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
                toast.warning("Please verify your email before signing in. Check your inbox for the verification link.");
                setUnverifiedUser(user);
                setShowVerificationHelper(true);
                await auth.signOut();
                return;
            }
            toast.success("Login successful!");
        } catch (error) {
            const errorMessages = {
                'auth/user-not-found': "No account found with this email.",
                'auth/wrong-password': "Incorrect password.",
                'auth/invalid-email': "Invalid email format.",
                'auth/too-many-requests': "Too many attempts. Please try again later.",
            };
            toast.error(errorMessages[error.code] || error.message || "Login failed.");
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
                toast.info("Please complete your registration first.");
                router.push("/register");
                return;
            }
            toast.success("Login successful!");
        } catch (error) {
            const errorMessages = {
                'auth/popup-closed-by-user': "Google sign-in was cancelled.",
                'auth/too-many-requests': "Too many attempts. Please try again later.",
            };
            toast.error(errorMessages[error.code] || error.message || "Google login failed.");
        }

        setLoadingGoogleLogin(false);
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push("/forgot-password");
    };

    const VerificationHelper = () => (
        <div className="mt-4 p-3 sm:p-4 bg-warning/10 border border-warning rounded-lg">
            <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-warning mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-foreground mb-1">Email Verification Required</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 leading-relaxed">
                        Your account exists but your email address hasn&apos;t been verified yet.
                        Please check your inbox for the verification link, or we can send you a new one.
                    </p>
                    <div className="flex flex-col xs:flex-row gap-2">
                        <button
                            onClick={handleResendVerification}
                            disabled={loadingResendVerification}
                            className="flex items-center justify-center gap-1 sm:gap-2 bg-warning text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loadingResendVerification ? (
                                <>
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                    <span className="hidden xs:inline">Sending...</span>
                                    <span className="xs:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">Resend Verification</span>
                                    <span className="xs:hidden">Resend</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setShowVerificationHelper(false);
                                setUnverifiedUser(null);
                            }}
                            className="text-warning text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-warning hover:bg-warning/10 transition-colors"
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
            <div className="min-h-screen flex justify-center items-center bg-background">
                <div className="text-center">
                    <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">Signing you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-teal-50 relative overflow-hidden">
            <BackgroundDecorations />
            <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 lg:px-6 relative z-10 py-6 sm:py-8">
                <div className="w-full max-w-[320px] xs:max-w-[360px] sm:max-w-md">
                    <div className="bg-card rounded-xl shadow-theme-xl border border-border p-4 xs:p-5 sm:p-6 md:p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-teal-500/10 rounded-2xl blur-xl -z-10"></div>
                        <div className="text-center mb-4 sm:mb-6">
                            <div className="text-center">
                                <div className="inline-block">
                                    <div className="flex items-center justify-center">
                                        <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center">
                                            <Image
                                                src="/logo.svg"
                                                alt="Assura Logo"
                                                width={50}
                                                height={50}
                                                className="w-full h-full object-contain"
                                                priority
                                            />
                                        </div>
                                    </div>
                                    <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground mb-2">Welcome Back</h1>
                                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6">Your testing hub awaits</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-card-foreground block">Email address</label>
                                <input
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded bg-background text-foreground placeholder-muted-foreground transition-all duration-200 text-sm sm:text-base ${errors.email
                                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                        : "border-input focus:border-primary focus:ring-ring/20"
                                        } focus:outline-none focus:ring-2`}
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({ ...errors, email: "" });
                                    }}
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p className="text-destructive text-xs font-medium mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs sm:text-sm font-medium text-card-foreground block">Password</label>
                                <div className="relative">
                                    <input
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded bg-background text-foreground placeholder-muted-foreground transition-all duration-200 text-sm sm:text-base ${errors.password
                                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                            : "border-input focus:border-primary focus:ring-ring/20"
                                            } focus:outline-none focus:ring-2`}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: "" });
                                        }}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-destructive text-xs font-medium mt-1">{errors.password}</p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-primary text-xs sm:text-sm font-medium hover:text-primary/80 hover:underline transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <button
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 flex justify-center items-center gap-2 shadow-theme-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                                onClick={handleLogin}
                                disabled={loadingEmailLogin}
                            >
                                Sign In
                                {loadingEmailLogin && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                            </button>
                        </div>
                        {showVerificationHelper && <VerificationHelper />}
                        <div className="flex items-center my-4 sm:my-6">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground font-medium bg-card">or continue with</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium sm:font-semibold border-2 border-border rounded px-3 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 flex justify-center items-center gap-2 sm:gap-3 shadow-theme-sm hover:shadow-theme disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            disabled={loadingGoogleLogin}
                        >
                            <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span className="truncate">Google</span>
                            {loadingGoogleLogin && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                        </button>
                        <p className="text-center text-muted-foreground mt-4 sm:mt-6 text-xs sm:text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-primary font-medium sm:font-semibold hover:text-primary/80 hover:underline transition-colors">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;