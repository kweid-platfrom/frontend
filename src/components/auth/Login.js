"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthProvider";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import '../../app/globals.css';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loadingEmailLogin, setLoadingEmailLogin] = useState(false);
    const [loadingGoogleLogin, setLoadingGoogleLogin] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });
    const router = useRouter();
    const { signIn, signInWithGoogle, currentUser, loading } = useAuth();

    // ADD BACK THE REDIRECT LOGIC - This was missing in Paste-1
    useEffect(() => {
        if (currentUser && !loading) {
            router.push("/dashboard");
        }
    }, [currentUser, loading, router]);

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

    const handleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        if (!validateForm()) {
            return;
        }
        
        setLoadingEmailLogin(true);
        try {
            const result = await signIn(email, password);
            if (result.success) {
                toast.success("Login successful!");
                // Manual redirect as backup if useEffect doesn't trigger
                router.push("/dashboard");
            } else {
                const friendlyError = getFirebaseErrorMessage(result.error || result);
                toast.error(friendlyError);
            }
        } catch (error) {
            console.error('Login error:', error);
            const friendlyError = getFirebaseErrorMessage(error);
            toast.error(friendlyError);
        } finally {
            setLoadingEmailLogin(false);
        }
    };

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        setLoadingGoogleLogin(true);
        try {
            const result = await signInWithGoogle();
            if (result.success) {
                // If the user doesn't exist, redirect to register
                if (result.isNewUser) {
                    toast.info("Please complete your registration first.");
                    router.push("/register");
                    return;
                }
                
                // Otherwise, show success and redirect to dashboard
                toast.success("Login successful!");
                router.push("/dashboard");
            } else {
                const friendlyError = getFirebaseErrorMessage(result.error || result);
                toast.error(friendlyError);
            }
        } catch (error) {
            console.error('Google login error:', error);
            const friendlyError = getFirebaseErrorMessage(error);
            toast.error(friendlyError);
        } finally {
            setLoadingGoogleLogin(false);
        }
    };
    
    const handleForgotPassword = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        router.push("/forgot-password");
    };

    // Show loading spinner during auth check
    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
            </div>
        );
    }

    // If already logged in, don't render the login form
    if (currentUser) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
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
            <div className="flex items-center justify-center min-h-screen px-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Welcome Section */}
                    <div className="text-center mb-6">
                        <div className="inline-block mb-4">
                            <div className="font-bold text-3xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
                        <p className="text-slate-600">Your testing hub awaits</p>
                    </div>

                    {/* Login Form Card */}
                    <div className="bg-white/90 backdrop-blur-sm rounded shadow-sm shadow-slate-200/50 border border-slate-200/50 p-6">
                        <form className="space-y-5" onSubmit={handleLogin} noValidate>
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">
                                    Email address
                                </label>
                                <input
                                    className={`w-full px-4 py-2 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 ${
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
                                        className={`w-full px-4 py-2 pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 ${
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
                                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                                    className="text-teal-600 text-sm font-medium hover:text-teal-700 hover:underline transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Sign In Button */}
                            <button
                                className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
                                type="submit"
                                disabled={loadingEmailLogin}
                            >
                                Sign In
                                {loadingEmailLogin && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center my-6">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="px-3 text-sm text-slate-500 font-medium">or continue with</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* Google Sign In */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 font-semibold border-2 border-slate-200 rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loadingGoogleLogin}
                        >
                            <FcGoogle className="w-5 h-5" />
                            Google
                            {loadingGoogleLogin && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                        </button>

                        {/* Register Link */}
                        <p className="text-center text-slate-600 mt-6">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors">
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