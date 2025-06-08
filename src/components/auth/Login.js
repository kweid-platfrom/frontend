"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthProvider";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import BackgroundDecorations from "../BackgroundDecorations";
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

                    {/* Login Form Card - More prominent */}
                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        {/* Card glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        
                        {/* Header - Inside the card */}
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