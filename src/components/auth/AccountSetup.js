"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);

const AccountSetup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [industry, setIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleAuth, setIsGoogleAuth] = useState(false);
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const router = useRouter();

    // Use refs to prevent the infinite loop
    const authAttemptedRef = useRef(false);
    const authErrorMessageRef = useRef(null);
    const redirectToRegisterRef = useRef(false);

    // Helper function to extract and format name from email
    const extractNameFromEmail = (email) => {
        if (!email) return "";
        const emailPrefix = email.split('@')[0];
        // Replace dots, underscores, and numbers with spaces, then capitalize each word
        return emailPrefix
            .replace(/[._0-9]/g, ' ')
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Helper function to get name from various sources
    const getNameFromSources = (firebaseUser) => {
        // Priority 1: localStorage (from registration form or previous sessions)
        const storedName = localStorage.getItem("userFullName") || 
                          localStorage.getItem("googleUserName") ||
                          localStorage.getItem("registeredUserName");
        
        if (storedName && storedName.trim()) {
            return storedName.trim();
        }

        // Priority 2: Firebase user displayName
        if (firebaseUser?.displayName && firebaseUser.displayName.trim()) {
            return firebaseUser.displayName.trim();
        }

        // Priority 3: Extract from email
        if (firebaseUser?.email) {
            return extractNameFromEmail(firebaseUser.email);
        }

        return "";
    };

    useEffect(() => {
        // Check if user is coming from Google SSO first
        const googleUserName = localStorage.getItem("googleUserName");
        const googleUserEmail = localStorage.getItem("googleUserEmail");

        if (googleUserName && googleUserEmail) {
            // User is coming from Google SSO
            setName(googleUserName);
            setEmail(googleUserEmail);
            setIsGoogleAuth(true);
            authAttemptedRef.current = true;
            return;
        }

        // If not from Google SSO, proceed with email link verification
        if (authAttemptedRef.current) {
            return;
        }

        authAttemptedRef.current = true;
        const storedEmail = window.localStorage.getItem("emailForSignIn");

        // Handle missing email outside the auth process
        if (!storedEmail) {
            authErrorMessageRef.current = "Invalid or expired link. Please register again.";
            redirectToRegisterRef.current = true;
            return;
        }

        // Check if this is a sign-in link
        if (isSignInWithEmailLink(auth, window.location.href)) {
            signInWithEmailLink(auth, storedEmail, window.location.href)
                .then((result) => {
                    // Ensure the user is properly signed in
                    if (!result.user) {
                        authErrorMessageRef.current = "Authentication failed. Please try again.";
                        redirectToRegisterRef.current = true;
                    } else {
                        // Pre-fill with user's email from Firebase Auth
                        setEmail(result.user.email || "");
                        
                        // Get name using priority system
                        const extractedName = getNameFromSources(result.user);
                        setName(extractedName);
                        
                        // Store the user credential and clean up
                        window.localStorage.removeItem("emailForSignIn");
                        window.localStorage.removeItem("emailSentTimestamp");
                    }
                })
                .catch((error) => {
                    console.error("Firebase sign-in error:", error);
                    authErrorMessageRef.current = error.message || "Invalid or expired link. Please register again.";
                    redirectToRegisterRef.current = true;
                });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Separate effect for handling errors and redirects
    useEffect(() => {
        // Only execute once the initial auth check is complete
        if (authAttemptedRef.current && authErrorMessageRef.current) {
            toast.error(authErrorMessageRef.current, {
                duration: 5000,
                position: "top-center"
            });
            authErrorMessageRef.current = null;

            if (redirectToRegisterRef.current) {
                const timeoutId = setTimeout(() => {
                    router.push("/register");
                }, 2000);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [router]);

    const validateName = (name) => {
        if (!name.trim()) {
            setNameError("Full name is required");
            return false;
        }
        if (name.trim().length < 2) {
            setNameError("Full name must be at least 2 characters");
            return false;
        }
        setNameError("");
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

    const validatePassword = (password, confirmPassword) => {
        if (!password) {
            setPasswordError("Password is required");
            return false;
        }
        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters long");
            return false;
        }
        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return false;
        }
        setPasswordError("");
        return true;
    };

    const handleSetupAccount = async () => {
        const isNameValid = validateName(name);
        const isEmailValid = validateEmail(email);
        
        let isPasswordValid = true;
        if (!isGoogleAuth) {
            isPasswordValid = validatePassword(password, confirmPassword);
        }

        if (!isNameValid || !isEmailValid || !isPasswordValid) {
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            toast.error("User authentication failed. Please log in again.", {
                duration: 4000,
                position: "top-center"
            });
            router.push("/login");
            return;
        }

        setIsLoading(true);

        try {
            // Generate a unique organization ID (using the user's UID for simplicity)
            const orgId = user.uid;

            // Only create organization if company details are provided
            if (company && industry && companySize) {
                await setDoc(doc(db, "organizations", orgId), {
                    name: company,
                    industry: industry,
                    size: companySize,
                    createdAt: new Date(),
                    createdBy: user.uid,
                    admin: [user.uid],
                    members: [user.uid]
                });
            }

            // Update password only for email link users, not for Google SSO
            if (!isGoogleAuth && password) {
                await updatePassword(user, password);
            }

            // Create the user document
            const userDoc = {
                name,
                email: user.email,
                role: "admin",
                createdAt: new Date()
            };

            // Add organization details only if provided
            if (company) {
                userDoc.company = company;
                userDoc.organisationId = orgId;
            }

            await setDoc(doc(db, "users", user.uid), userDoc);

            // Clear localStorage data
            localStorage.removeItem("needsAccountSetup");
            localStorage.removeItem("googleUserName");
            localStorage.removeItem("googleUserEmail");
            localStorage.removeItem("googleUserPhoto");
            localStorage.removeItem("userFullName");
            localStorage.removeItem("registeredUserName");

            toast.success("Account setup complete. Redirecting...", {
                duration: 3000,
                position: "top-center"
            });
            setTimeout(() => router.push("/add-users"), 2000);
        } catch (error) {
            console.error("Setup error:", error);
            toast.error(error.message || "An error occurred during account setup.", {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setIsLoading(false);
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
            <div className="flex items-center justify-center min-h-screen px-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Welcome Section */}
                    <div className="text-center mb-6">
                        <div className="inline-block mb-4">
                            <div className="font-bold text-3xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Complete your setup</h1>
                        <p className="text-slate-600">Complete your account setup to get started</p>
                    </div>

                    {/* Setup Form Card */}
                    <div className="bg-white/90 backdrop-blur-sm rounded shadow-sm shadow-slate-200/50 border border-slate-200/50 p-6">
                        <div className="space-y-5">
                            {/* Required Information Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                                    Required Information
                                </h3>

                                {/* Full Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Full name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                            nameError 
                                                ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                                : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                        } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (nameError) setNameError("");
                                        }}
                                    />
                                    {nameError && (
                                        <p className="text-red-600 text-sm font-medium flex items-center mt-2">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {nameError}
                                        </p>
                                    )}
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Email address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                            emailError 
                                                ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                                : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                        } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError("");
                                        }}
                                    />
                                    {emailError && (
                                        <p className="text-red-600 text-sm font-medium flex items-center mt-2">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {emailError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password Section - Only shown for email link authentication */}
                            {!isGoogleAuth && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                                        Set Password
                                    </h3>

                                    {/* Password Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 block">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                                passwordError 
                                                    ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                                    : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                            } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                                            type="password"
                                            placeholder="Enter a secure password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) setPasswordError("");
                                            }}
                                        />
                                    </div>

                                    {/* Confirm Password Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 block">
                                            Confirm password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                                passwordError 
                                                    ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                                    : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                            } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (passwordError) setPasswordError("");
                                            }}
                                        />
                                        {passwordError && (
                                            <p className="text-red-600 text-sm font-medium flex items-center mt-2">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {passwordError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Optional Organization Information Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                                    Organization Information <span className="text-sm font-normal text-slate-500">(Optional)</span>
                                </h3>

                                {/* Company Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Company name
                                    </label>
                                    <input
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                                        type="text"
                                        placeholder="Enter your company name"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                    />
                                </div>

                                {/* Industry Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Industry
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded text-slate-900 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                    >
                                        <option value="">Select your industry</option>
                                        <option value="technology">Technology</option>
                                        <option value="healthcare">Healthcare</option>
                                        <option value="finance">Finance</option>
                                        <option value="education">Education</option>
                                        <option value="retail">Retail</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Company Size Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Company size
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded text-slate-900 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                                        value={companySize}
                                        onChange={(e) => setCompanySize(e.target.value)}
                                    >
                                        <option value="">Select company size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="500+">500+ employees</option>
                                    </select>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={handleSetupAccount}
                                className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" />
                                        Processing...
                                    </>
                                ) : (
                                    'Complete Setup'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSetup;