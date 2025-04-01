"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthProvider";
import { useAlert } from "../../components/CustomAlert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import "../../app/globals.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loadingEmailLogin, setLoadingEmailLogin] = useState(false);
    const [loadingGoogleLogin, setLoadingGoogleLogin] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });
    const router = useRouter();
    const { signIn, signInWithGoogle, currentUser, loading } = useAuth();
    const { showAlert, alertComponent } = useAlert();

    // Redirect if already logged in
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
        
        if (!validateForm()) {
            return;
        }
        
        setLoadingEmailLogin(true);
        try {
            const result = await signIn(email, password);
            if (result.success) {
                showAlert("Login successful!", "success");
                router.push("/dashboard");
            } else {
                showAlert(result.error, "error");
            }
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        } finally {
            setLoadingEmailLogin(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoadingGoogleLogin(true);
        try {
            const result = await signInWithGoogle();
            if (result.success) {
                // If the user doesn't exist, redirect to register
                if (result.isNewUser) {
                    showAlert("Please complete your registration first.", "info");
                    router.push("/register");
                    return;
                }
                
                // Otherwise, show success and redirect to dashboard
                showAlert("Login successful!", "success");
                router.push("/dashboard");
            } else {
                showAlert(result.error, "error");
            }
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        } finally {
            setLoadingGoogleLogin(false);
        }
    };
    
    const handleForgotPassword = (e) => {
        e.preventDefault();
        router.push("/forgot-password");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <Loader2 className="animate-spin h-8 w-8 text-[#00897B]" />
            </div>
        );
    }

    // If already logged in, don't render the login form
    if (currentUser) {
        return null;
    }

    return (
        <>
            {alertComponent}
            <div className="min-h-screen bg-[#fff] flex flex-col items-center">
                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                    <Link href="/" className="font-bold text-2xl text-[#00897B] hover:text-[#00796B] transition-colors">
                        LOGO
                    </Link>
                </header>
                <div className="justify-center text-center p-5">
                    <h2 className="text-[#2D3142] text-2xl font-bold text-center mb-3">Welcome Back to QAID</h2>
                    <p>– Your Testing Hub Awaits –</p>
                </div>

                <div className="w-full max-w-sm bg-white rounded-lg p-8 flex flex-col gap-6">
                    <form className="flex flex-col gap-4" onSubmit={handleLogin} noValidate>
                        <div className="flex flex-col gap-1">
                            <input
                                className={`px-4 py-3 border ${
                                    errors.email ? "border-red-500" : "border-[#E1E2E6]"
                                } rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]`}
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors({...errors, email: ""});
                                }}
                            />
                            {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <input
                                    className={`px-4 py-3 pr-10 border ${
                                        errors.password ? "border-red-500" : "border-[#E1E2E6]"
                                    } rounded text-[#2D3142] w-full focus:outline-none focus:border-[#00897B]`}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors({...errors, password: ""});
                                    }}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
                        </div>

                        <div className="text-right">
                            <button onClick={handleForgotPassword} className="text-[#00897B] text-sm hover:underline">
                                Forgot password?
                            </button>
                        </div>

                        <button
                            className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors flex justify-center items-center gap-2"
                            type="submit"
                            disabled={loadingEmailLogin}
                        >
                            Sign In
                            {loadingEmailLogin && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                        </button>
                    </form>

                    <div className="flex items-center text-[#9EA0A5] my-2">
                        <div className="flex-grow border-t border-[#E1E2E6]"></div>
                        <span className="px-3 text-sm">or Sign in with</span>
                        <div className="flex-grow border-t border-[#E1E2E6]"></div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2 w-[50%] bg-white text-[#4A4B53] border border-[#E1E2E6] rounded px-4 py-3 text-base hover:bg-gray-50 hover:border-[#9EA0A5] transition-colors"
                            disabled={loadingGoogleLogin}
                        >
                            <FcGoogle className="w-5 h-5 fill-[#4285F4]" />
                            Google
                            {loadingGoogleLogin && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                        </button>
                    </div>

                    <p className="text-md text-[#4A4B53] text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-[#00897B] font-medium hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Login;