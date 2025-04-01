"use client";

import { useState, useEffect } from "react";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { useAlert } from "../../components/CustomAlert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);

const AccountSetup = () => {
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [friendlyUserId, setFriendlyUserId] = useState("");
    const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    // Generate a user-friendly ID
    const generateFriendlyUserId = () => {
        // Format: PREFIX-RANDOM-NUMBERS
        const prefix = "USER";
        const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        return `${prefix}-${randomPart}`;
    };

    useEffect(() => {
        // Check if this is a Google sign-up or email link
        const storedGoogleSignUp = window.localStorage.getItem("isGoogleSignUp");
        const storedEmail = window.localStorage.getItem("emailForSignIn");
        const storedFriendlyId = window.localStorage.getItem("friendlyUserId");
        
        if (storedGoogleSignUp === "true") {
            // This is a Google sign-up flow
            setIsGoogleSignUp(true);
            
            // Use the stored friendly ID or generate a new one
            if (storedFriendlyId) {
                setFriendlyUserId(storedFriendlyId);
            } else {
                const newFriendlyId = generateFriendlyUserId();
                setFriendlyUserId(newFriendlyId);
                window.localStorage.setItem("friendlyUserId", newFriendlyId);
            }
            
            // Check if the user is authenticated
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showAlert("Authentication failed. Please sign up again.", "error");
                router.push("/register");
                return;
            }
            
        } else if (isSignInWithEmailLink(auth, window.location.href) && storedEmail) {
            // This is an email link sign-up flow
            signInWithEmailLink(auth, storedEmail, window.location.href)
                .then((result) => {
                    // Ensure the user is properly signed in
                    if (!result.user) {
                        throw new Error("Authentication failed. Please try again.");
                    }

                    // Generate a friendly user ID for email sign-ups
                    const newFriendlyId = generateFriendlyUserId();
                    setFriendlyUserId(newFriendlyId);
                    window.localStorage.setItem("friendlyUserId", newFriendlyId);
                    
                    // Store the user credential
                    window.localStorage.removeItem("emailForSignIn");
                })
                .catch((error) => {
                    console.error("Firebase sign-in error:", error);
                    showAlert(error.message || "Invalid or expired link. Please register again.", "error");
                    router.push("/register");
                });
        } else {
            // Neither Google sign-up nor valid email link
            showAlert("Invalid access. Please sign up first.", "error");
            router.push("/register");
        }
    }, [router, showAlert]);

    const handleSetPassword = async () => {
        if (!name || !company) {
            showAlert("Name and company fields are required.", "error");
            return;
        }

        // For email sign-ups, validate password
        if (!isGoogleSignUp) {
            if (!password || !confirmPassword) {
                showAlert("Password fields are required.", "error");
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
            // Only update password for email sign-ups
            if (!isGoogleSignUp && password) {
                await updatePassword(user, password);
            }
            
            // Get existing user data if available
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            // Prepare user data
            const userData = {
                name,
                company,
                email: user.email,
                friendlyUserId: friendlyUserId || generateFriendlyUserId(),
                updatedAt: new Date(),
                setupCompleted: true
            };
            
            // If user doc exists, merge with existing data
            if (userDoc.exists()) {
                await setDoc(userDocRef, userData, { merge: true });
            } else {
                // Create new user document
                await setDoc(userDocRef, {
                    ...userData,
                    createdAt: new Date(),
                    authProvider: isGoogleSignUp ? "google" : "email"
                });
            }

            showAlert("Account setup complete. Redirecting...", "success");
            
            // Clear setup-related localStorage items
            window.localStorage.removeItem("isGoogleSignUp");
            window.localStorage.removeItem("friendlyUserId");
            
            setTimeout(() => router.push("/add-users"), 2000);
        } catch (error) {
            console.error("Setup error:", error);
            showAlert(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Alert Component */}
            {alertComponent}

            <div className="min-h-screen bg-[#fff] flex flex-col items-center">
                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                    <span className="font-bold text-2xl text-[#00897B]">LOGO</span>
                </header>

                <div className="w-full max-w-sm mt-[10vh] bg-white rounded-lg p-8 flex flex-col gap-6 shadow-md">
                    <h2 className="text-[#2D3142] text-2xl font-bold text-center">
                        Set Up Your Account
                    </h2>
                    
                    {friendlyUserId && (
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                            <p className="text-sm text-gray-500">Your User ID</p>
                            <p className="font-medium text-[#2D3142]">{friendlyUserId}</p>
                        </div>
                    )}

                    {/* Full Name Input */}
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                    />

                    {/* Company Name Input */}
                    <input
                        type="text"
                        placeholder="Company Name"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
                        className="px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                    />

                    {/* Password fields only for email sign-ups */}
                    {!isGoogleSignUp && (
                        <>
                            {/* Password Input with Toggle Icon */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="px-4 py-3 pr-10 border border-[#E1E2E6] rounded text-[#2D3142] w-full focus:outline-none focus:border-[#00897B]"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Confirm Password Input with Toggle Icon */}
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="px-4 py-3 pr-10 border border-[#E1E2E6] rounded text-[#2D3142] w-full focus:outline-none focus:border-[#00897B]"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500">
                                Password must be at least 8 characters long
                            </p>
                        </>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSetPassword}
                        disabled={isLoading}
                        className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                Setting Up...
                            </>
                        ) : (
                            "Complete Setup"
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AccountSetup;