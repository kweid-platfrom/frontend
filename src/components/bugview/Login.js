/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, useAppAuth, useAppNotifications } from "../../contexts/AppProvider";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { sendEmailVerification } from "firebase/auth";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import BackgroundDecorations from "../BackgroundDecorations";
import '../../app/globals.css';

// Simple registration state cleanup - only clear what's needed
const clearRegistrationState = () => {
    try {
        const keysToRemove = [
            'qaid_registration_state',
            'pendingRegistration',
            'needsOnboarding',
            'awaitingEmailVerification',
            'verificationComplete',
            'startOnboarding',
            'needsSuiteCreation',
            'registrationData'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Clear the problematic window.isRegistering
        if (typeof window !== 'undefined') {
            delete window.isRegistering;
        }
    } catch (error) {
        console.error('Error clearing registration state:', error);
    }
};

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
    
    // Use new unified App Provider hooks
    const { isAuthenticated, isInitialized } = useApp();
    const { user, signIn, signInWithGoogle } = useAppAuth();
    const { addNotification } = useAppNotifications();
    
    // Simplified navigation tracking
    const hasNavigated = useRef(false);

    // Handle email verification success and other URL parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get('verified');
        const message = urlParams.get('message');
        
        if (verified === 'true') {
            toast.success("Email verified successfully! You can now sign in.", {
                duration: 5000,
                position: "top-center"
            });
        }
        
        if (message) {
            // Handle other messages from redirects
            switch (message) {
                case 'password-reset':
                    toast.success("Password reset email sent! Check your inbox.", {
                        duration: 5000,
                        position: "top-center"
                    });
                    break;
                case 'registration-complete':
                    toast.success("Registration completed! Please sign in.", {
                        duration: 5000,
                        position: "top-center"
                    });
                    break;
                case 'verification-sent':
                    toast.success("Verification email sent! Check your inbox.", {
                        duration: 5000,
                        position: "top-center"
                    });
                    break;
                default:
                    break;
            }
        }
        
        // Clear URL parameters
        if (verified || message) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Simplified routing logic
    const routeUserAfterLogin = async (user) => {
        try {
            // Only check if user is email verified
            if (!user.emailVerified) {
                console.log("User email not verified, staying on login page");
                return;
            }

            // Clear any stale registration state for returning users
            clearRegistrationState();

            // Check if user document exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            let targetRoute = '/dashboard';
            
            // Only check onboarding if user doesn't exist in database
            if (!userDoc.exists()) {
                targetRoute = '/dashboard?onboarding=true';
            }

            // Add success notification
            addNotification({
                type: 'success',
                title: 'Welcome back!',
                message: 'You have successfully signed in.',
                persistent: false
            });

            // Navigate to appropriate destination
            router.push(targetRoute);

        } catch (error) {
            console.error("Error routing user after login:", error);
            
            addNotification({
                type: 'error',
                title: 'Login Error',
                message: 'Failed to load account information. Please try again.',
                persistent: true
            });
            
            // Fallback to dashboard on error since user is verified
            router.push("/dashboard");
        }
    };

    // SIMPLIFIED: Handle authenticated user routing
    useEffect(() => {
        // Only proceed if app is initialized
        if (!isInitialized) return;

        // If user is authenticated, verified, and we haven't navigated yet
        if (isAuthenticated && user?.emailVerified && !hasNavigated.current) {
            console.log("User is authenticated and verified, navigating to dashboard");
            hasNavigated.current = true;
            routeUserAfterLogin(user);
        }
        
        // Reset navigation flag when user logs out
        if (!isAuthenticated) {
            hasNavigated.current = false;
        }
    }, [isAuthenticated, isInitialized, user?.emailVerified]);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: "", password: "" };
        
        // Email validation
        if (!email) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }
        
        // Password validation
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
            
            toast.success("Verification email sent! Please check your inbox and spam folder.", {
                duration: 6000,
                position: "top-center"
            });
            
            addNotification({
                type: 'success',
                title: 'Verification Email Sent',
                message: 'Please check your inbox and spam folder.',
                persistent: false
            });
            
            setShowVerificationHelper(false);
            setUnverifiedUser(null);
            
        } catch (error) {
            console.error("Error sending verification email:", error);
            let errorMessage = "Failed to send verification email. ";
            
            switch (error.code) {
                case 'auth/too-many-requests':
                    errorMessage += "Too many requests. Please wait a few minutes before trying again.";
                    break;
                case 'auth/user-token-expired':
                    errorMessage += "Your session has expired. Please try logging in again.";
                    break;
                default:
                    errorMessage += "Please try again or contact support if the problem persists.";
            }
            
            toast.error(errorMessage, {
                duration: 6000,
                position: "top-center"
            });

            addNotification({
                type: 'error',
                title: 'Verification Error',
                message: errorMessage,
                persistent: true
            });
        } finally {
            setLoadingResendVerification(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!validateForm()) {
            return;
        }
        
        setLoadingEmailLogin(true);
        setShowVerificationHelper(false);
        
        try {
            // Clear any existing registration state before login
            clearRegistrationState();
            
            const result = await signIn(email, password);
            if (result.success) {
                // Check if email is verified
                if (result.user && !result.user.emailVerified) {
                    const errorMessage = "Please verify your email before signing in. Check your inbox for the verification link.";
                    
                    toast.error(errorMessage, {
                        duration: 6000,
                        position: "top-center"
                    });
                    
                    addNotification({
                        type: 'warning',
                        title: 'Email Verification Required',
                        message: errorMessage,
                        persistent: true
                    });
                    
                    // Store the unverified user for resend functionality
                    setUnverifiedUser(result.user);
                    setShowVerificationHelper(true);
                    
                    // Sign out the user since email is not verified
                    await result.user.auth.signOut();
                    return;
                }
                
                toast.success("Login successful!");
                // Navigation will be handled by useEffect
                
            } else {
                // Handle specific Firebase auth errors
                const error = result.error || result;
                let friendlyError = getFirebaseErrorMessage(error);
                
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    friendlyError = "Invalid email or password. Please check your credentials and try again.";
                } else if (error.code === 'auth/too-many-requests') {
                    friendlyError = "Too many failed login attempts. Please wait a few minutes before trying again.";
                } else if (error.code === 'auth/user-disabled') {
                    friendlyError = "This account has been disabled. Please contact support.";
                }
                
                toast.error(friendlyError);
                
                addNotification({
                    type: 'error',
                    title: 'Login Failed',
                    message: friendlyError,
                    persistent: true
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            const friendlyError = getFirebaseErrorMessage(error);
            toast.error(friendlyError);
            
            addNotification({
                type: 'error',
                title: 'Login Error',
                message: friendlyError,
                persistent: true
            });
        } finally {
            setLoadingEmailLogin(false);
        }
    };

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setLoadingGoogleLogin(true);
        try {
            // Clear any existing registration state before login
            clearRegistrationState();
            
            const result = await signInWithGoogle();
            if (result.success) {
                // If this is a completely new user, send to register
                if (result.isNewUser) {
                    toast.info("Please complete your registration first.");
                    
                    addNotification({
                        type: 'info',
                        title: 'Registration Required',
                        message: 'Please complete your registration first.',
                        persistent: false
                    });
                    
                    router.push("/register");
                    return;
                }
                
                toast.success("Login successful!");
                // Navigation will be handled by useEffect
                
            } else {
                const friendlyError = getFirebaseErrorMessage(result.error || result);
                toast.error(friendlyError);
                
                addNotification({
                    type: 'error',
                    title: 'Google Login Failed',
                    message: friendlyError,
                    persistent: true
                });
            }
        } catch (error) {
            console.error('Google login error:', error);
            const friendlyError = getFirebaseErrorMessage(error);
            toast.error(friendlyError);
            
            addNotification({
                type: 'error',
                title: 'Google Login Error',
                message: friendlyError,
                persistent: true
            });
        } finally {
            setLoadingGoogleLogin(false);
        }
    };
    
    const handleForgotPassword = (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push("/forgot-password");
    };

    // Email Verification Helper Component
    const VerificationHelper = () => (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-amber-800 mb-1">
                        Email Verification Required
                    </h3>
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

    // Show loading only during app initialization
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    // Show signing in only when actually navigating
    if (isAuthenticated && user?.emailVerified && hasNavigated.current) {
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

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo - Outside the card */}
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>

                    {/* Login Form Card */}
                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        
                        <div className="text-center mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
                            <p className="text-base sm:text-lg text-slate-600">Your testing hub awaits</p>
                        </div>
                        
                        <form className="space-y-6" onSubmit={handleLogin} noValidate>
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">
                                    Email address
                                </label>
                                <input
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${
                                        errors.email 
                                            ? "border-red-300 focus:border-red-500" 
                                            : "border-slate-200 focus:border-teal-500"
                                    } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors({...errors, email: ""});
                                    }}
                                />
                                {errors.email && (
                                    <p className="text-red-600 text-xs font-medium mt-2">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${
                                            errors.password 
                                                ? "border-red-300 focus:border-red-500" 
                                                : "border-slate-200 focus:border-teal-500"
                                        } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({...errors, password: ""});
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
                                    <p className="text-red-600 text-xs font-medium mt-2">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <button 
                                    type="button"
                                    onClick={handleForgotPassword} 
                                    className="text-teal-600 text-xs sm:text-sm font-medium hover:text-teal-700 hover:underline transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Sign In Button */}
                            <button
                                className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                                type="submit"
                                disabled={loadingEmailLogin}
                            >
                                Sign In
                                {loadingEmailLogin && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                            </button>
                        </form>

                        {/* Email Verification Helper */}
                        {showVerificationHelper && <VerificationHelper />}

                        {/* Divider */}
                        <div className="flex items-center my-8">
                            <div className="flex-grow border-t border-slate-300"></div>
                            <span className="px-4 text-sm text-slate-500 font-medium bg-white">or continue with</span>
                            <div className="flex-grow border-t border-slate-300"></div>
                        </div>

                        {/* Google Sign In */}
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

                        {/* Register Link */}
                        <p className="text-center text-slate-600 mt-4 sm:mt-6 text-xs sm:text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-teal-600 font-medium sm:font-semibold hover:text-teal-700 hover:underline transition-colors">
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