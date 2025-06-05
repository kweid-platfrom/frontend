/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { TeamInvite } from "./TeamInvite";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);

const AccountSetup = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [industry, setIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleAuth, setIsGoogleAuth] = useState(false);
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const router = useRouter();

    const authAttemptedRef = useRef(false);
    const authErrorMessageRef = useRef(null);
    const redirectToRegisterRef = useRef(false);

    const extractNameFromEmail = (email) => {
        if (!email) return "";
        const emailPrefix = email.split('@')[0];
        return emailPrefix
            .replace(/[._0-9]/g, ' ')
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getNameFromSources = (firebaseUser) => {
        const storedName = localStorage.getItem("userFullName") ||
            localStorage.getItem("googleUserName") ||
            localStorage.getItem("registeredUserName");

        if (storedName && storedName.trim()) {
            return storedName.trim();
        }

        if (firebaseUser?.displayName && firebaseUser.displayName.trim()) {
            return firebaseUser.displayName.trim();
        }

        if (firebaseUser?.email) {
            return extractNameFromEmail(firebaseUser.email);
        }

        return "";
    };

    useEffect(() => {
        const googleUserName = localStorage.getItem("googleUserName");
        const googleUserEmail = localStorage.getItem("googleUserEmail");

        if (googleUserName && googleUserEmail) {
            setName(googleUserName);
            setEmail(googleUserEmail);
            setIsGoogleAuth(true);
            authAttemptedRef.current = true;
            return;
        }

        if (authAttemptedRef.current) {
            return;
        }

        authAttemptedRef.current = true;
        const storedEmail = window.localStorage.getItem("emailForSignIn");

        if (!storedEmail) {
            authErrorMessageRef.current = "Invalid or expired link. Please register again.";
            redirectToRegisterRef.current = true;
            return;
        }

        if (isSignInWithEmailLink(auth, window.location.href)) {
            signInWithEmailLink(auth, storedEmail, window.location.href)
                .then((result) => {
                    if (!result.user) {
                        authErrorMessageRef.current = "Authentication failed. Please try again.";
                        redirectToRegisterRef.current = true;
                    } else {
                        setEmail(result.user.email || "");
                        const extractedName = getNameFromSources(result.user);
                        setName(extractedName);

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
    }, []);

    useEffect(() => {
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

    const handleNextStep = () => {
        if (step === 1) {
            const isNameValid = validateName(name);
            const isEmailValid = validateEmail(email);

            let isPasswordValid = true;
            if (!isGoogleAuth) {
                isPasswordValid = validatePassword(password, confirmPassword);
            }

            if (isNameValid && isEmailValid && isPasswordValid) {
                setStep(2);
            }
        } else if (step === 2) {
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSendInvites = async (inviteEmails) => {
        await handleSetupAccount(inviteEmails);
    };

    const handleSkip = async () => {
        await handleSetupAccount([]);
    };

    const handleSetupAccount = async (inviteEmails = []) => {
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
            const orgId = user.uid;

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

            if (!isGoogleAuth && password) {
                await updatePassword(user, password);
            }

            const userDoc = {
                name,
                email: user.email,
                role: "admin",
                createdAt: new Date()
            };

            if (company) {
                userDoc.company = company;
                userDoc.organisationId = orgId;
            }

            await setDoc(doc(db, "users", user.uid), userDoc);

            // Handle invites if any
            if (inviteEmails.length > 0) {
                console.log("Sending invites to:", inviteEmails);
                // The TeamInvite component handles the actual email sending
            }

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
            setTimeout(() => router.push("/dashboard"), 2000);
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

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 border-b border-slate-200 pb-2">
                            Personal Information
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Full name <span className="text-red-500">*</span>
                            </label>
                            <input
                                className={`w-full px-3 sm:px-4 py-3 sm:py-2 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-base ${nameError
                                        ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                                        : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                    } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (nameError) setNameError("");
                                }}
                            />
                            {nameError && (
                                <p className="text-red-600 text-xs mt-2">
                                    {nameError}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Email address <span className="text-red-500">*</span>
                            </label>
                            <input
                                className={`w-full px-3 sm:px-4 py-3 sm:py-2 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-base ${emailError
                                        ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                                        : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                    } focus:outline-none focus:ring- focus:ring-teal-500/10`}
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                            />
                            {emailError && (
                                <p className="text-red-600 text-xs mt-2">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        {!isGoogleAuth && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className={`w-full px-3 sm:px-4 py-3 sm:py-2 pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-base ${passwordError
                                                    ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                                                    : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                                } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter a secure password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) setPasswordError("");
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors min-w-[44px] min-h-[44px] justify-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Confirm password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            className={`w-full px-3 sm:px-4 py-3 sm:py-2 pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-base ${passwordError
                                                    ? "border-red-300 focus:border-red-500 focus:bg-red-50/50"
                                                    : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                                } focus:outline-none focus:ring focus:ring-teal-500/10`}
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (passwordError) setPasswordError("");
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors min-w-[44px] min-h-[44px] justify-center"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    {passwordError && (
                                        <p className="text-red-600 text-xs mt-2">
                                            {passwordError}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 border-b border-slate-200 pb-2">
                            Organization Information <span className="text-sm font-normal text-slate-500">(Optional)</span>
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Company name
                            </label>
                            <input
                                className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring focus:ring-teal-500/10 text-base"
                                type="text"
                                placeholder="Enter your company name"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Industry
                            </label>
                            <select
                                className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-slate-200 rounded text-slate-900 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring focus:ring-teal-500/10 text-base"
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Company size
                            </label>
                            <select
                                className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-slate-200 rounded text-slate-900 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring focus:ring-teal-500/10 text-base"
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
                );

            case 3:
                return (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <TeamInvite
                            onSendInvites={handleSendInvites}
                            onSkip={handleSkip}
                            isLoading={isLoading}
                            userEmail={email}
                            organizationName={company}
                            inviterName={name}
                        />
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            {/* Background decorative elements */}
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

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent transform rotate-12"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent transform -rotate-12"></div>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-0 w-px h-32 bg-gradient-to-b from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute top-40 right-10 w-px h-24 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute bottom-32 left-20 w-16 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute bottom-20 right-0 w-20 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute top-1/3 left-1/4 w-px h-16 bg-gradient-to-b from-transparent via-slate-200 to-transparent transform rotate-45"></div>
                <div className="absolute top-2/3 right-1/4 w-12 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent transform rotate-45"></div>
            </div>

            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10 py-8">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-block mb-4">
                            <div className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Complete your setup</h1>
                        <p className="text-slate-600 text-sm sm:text-base">Complete your account setup to get started</p>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">Step {step} of 3</span>
                            <span className="text-sm text-slate-500">{Math.round((step / 3) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(step / 3) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-200/50 border border-slate-200/50 p-4 sm:p-6">
                        <div className="space-y-5">
                            {renderStepContent()}

                            {step < 3 && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={handlePrevStep}
                                            className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded px-6 py-3 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 min-h-[44px]"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Back
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="w-full sm:flex-1 bg-[#00897B] hover:bg-[#00796B] text-white font-semibold rounded px-6 py-3 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 min-h-[44px]"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSetup;