"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { useAlert } from "../../components/CustomAlert";
import { Loader2 } from "lucide-react";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);

const AccountSetup = () => {
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [industry, setIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleAuth, setIsGoogleAuth] = useState(false);
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    // Use refs to prevent the infinite loop
    const authAttemptedRef = useRef(false);
    const authErrorMessageRef = useRef(null);
    const redirectToRegisterRef = useRef(false);

    useEffect(() => {
        // Check if user is coming from Google SSO first
        const googleUserName = localStorage.getItem("googleUserName");
        const googleUserEmail = localStorage.getItem("googleUserEmail");

        if (googleUserName && googleUserEmail) {
            // User is coming from Google SSO
            setName(googleUserName);
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
                        // Store the user credential
                        window.localStorage.removeItem("emailForSignIn");
                    }
                })
                .catch((error) => {
                    console.error("Firebase sign-in error:", error);  // Log error for debugging
                    authErrorMessageRef.current = error.message || "Invalid or expired link. Please register again.";
                    redirectToRegisterRef.current = true;
                });
        }
    }, []);

    // Separate effect for handling errors and redirects
    useEffect(() => {
        // Only execute once the initial auth check is complete
        if (authAttemptedRef.current && authErrorMessageRef.current) {
            showAlert(authErrorMessageRef.current, "error");
            authErrorMessageRef.current = null; // Clear the message to prevent re-showing

            if (redirectToRegisterRef.current) {
                // Use a small timeout to avoid state updates during render
                const timeoutId = setTimeout(() => {
                    router.push("/register");
                }, 100);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [router, showAlert]);

    const handleSetupAccount = async () => {
        if (!name || !company || !industry || !companySize) {
            showAlert("Please fill in all required fields.", "error");
            return;
        }

        // Password validation only for email link users, not for Google SSO
        if (!isGoogleAuth) {
            if (!password || !confirmPassword) {
                showAlert("Password is required.", "error");
                return;
            }

            if (password.length < 8) {
                showAlert("Password must be at least 8 characters long.", "error");
                return;
            }

            if (password !== confirmPassword) {
                showAlert("Passwords do not match.", "error");
                return;
            }
        }

        const user = auth.currentUser;
        if (!user) {
            showAlert("User authentication failed. Please log in again.", "error");
            router.push("/login");
            return;
        }

        setIsLoading(true);

        try {
            // Generate a unique organization ID (using the user's UID for simplicity)
            const orgId = user.uid;

            // Create the organization document first
            await setDoc(doc(db, "organisations", orgId), {
                name: company,
                industry: industry,
                size: companySize,
                createdAt: new Date(),
                createdBy: user.uid,
                admin: [user.uid],
                members: [user.uid]
            });

            // Update password only for email link users, not for Google SSO
            if (!isGoogleAuth && password) {
                await updatePassword(user, password);
            }

            // Create the user document with reference to the organization
            await setDoc(doc(db, "users", user.uid), {
                name,
                company,
                email: user.email,
                organisationId: orgId,
                role: "admin",
                createdAt: new Date()
            });

            // Clear Google data from localStorage if it exists
            localStorage.removeItem("needsAccountSetup");
            localStorage.removeItem("googleUserName");
            localStorage.removeItem("googleUserEmail");
            localStorage.removeItem("googleUserPhoto");

            showAlert("Account setup complete. Redirecting...", "success");
            setTimeout(() => router.push("/add-users"), 2000);
        } catch (error) {
            console.error("Setup error:", error);
            showAlert(error.message || "An error occurred during account setup.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Alert Component */}
            {alertComponent}

            <div className="min-h-screen bg-[#fff] flex flex-col items-center">
                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm sticky top-0 z-10">
                    <span className="font-bold text-2xl text-[#00897B]">LOGO</span>
                </header>

                <div className="w-full max-w-md mt-[10vh] bg-white rounded-lg p-8 flex flex-col gap-6 shadow-md">
                    <h2 className="text-[#2D3142] text-2xl font-bold text-center">
                        Set Up Your Account
                    </h2>

                    {/* Organization Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-[#2D3142]">Profile Information</h3>

                        {/* Full Name Input */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-[#4A4B53] mb-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                            />
                        </div>

                        {/* Company Name Input */}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-[#4A4B53] mb-1">
                                Company Name
                            </label>
                            <input
                                id="company"
                                type="text"
                                placeholder="Enter your company name"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                required
                                className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                            />
                        </div>

                        {/* Industry Selection */}
                        <div>
                            <label htmlFor="industry" className="block text-sm font-medium text-[#4A4B53] mb-1">
                                Industry
                            </label>
                            <select
                                id="industry"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                required
                                className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
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
                        <div>
                            <label htmlFor="companySize" className="block text-sm font-medium text-[#4A4B53] mb-1">
                                Company Size
                            </label>
                            <select
                                id="companySize"
                                value={companySize}
                                onChange={(e) => setCompanySize(e.target.value)}
                                required
                                className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
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

                    {/* Password Section - Only shown for email link authentication */}
                    {!isGoogleAuth && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-[#2D3142]">Set Password</h3>

                            {/* Password Input with Toggle Icon */}
                            <div className="relative">
                                <label htmlFor="password" className="block text-sm font-medium text-[#4A4B53] mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Enter a secure password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B] pr-10"
                                />
                            </div>




                            {/* Confirm Password Input with Toggle Icon */}
                            <div className="relative">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#4A4B53] mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B] pr-10"
                                />
                            </div>


                        </div>
                    )}

                    {/* Continue Button */}
                    <button
                        onClick={handleSetupAccount}
                        className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                Processing...
                            </>
                        ) : (
                            "Continue to Add Team Members"
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AccountSetup;