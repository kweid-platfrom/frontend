"use client";

import { useState, useEffect } from "react";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { useAlert } from "../../components/CustomAlert";
import { Eye, EyeOff } from "lucide-react";
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
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    useEffect(() => {
        const storedEmail = window.localStorage.getItem("emailForSignIn");

        if (!storedEmail) {
            showAlert("Invalid or expired link. Please register again.", "error");
            router.push("/register");
            return;
        }

        if (isSignInWithEmailLink(auth, window.location.href)) {
            signInWithEmailLink(auth, storedEmail, window.location.href)
                .then((result) => {
                    // Ensure the user is properly signed in
                    if (!result.user) {
                        throw new Error("Authentication failed. Please try again.");
                    }

                    // Store the user credential
                    window.localStorage.removeItem("emailForSignIn");
                })
                .catch((error) => {
                    console.error("Firebase sign-in error:", error);  // Log error for debugging
                    showAlert(error.message || "Invalid or expired link. Please register again.", "error");
                    router.push("/register");
                });
        }
    }, [router, showAlert]);


    const handleSetPassword = async () => {
        if (!name || !company || !password || !confirmPassword) {
            showAlert("All fields are required.", "error");
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

        const user = auth.currentUser;
        if (!user) {
            showAlert("User authentication failed. Please log in again.", "error");
            router.push("/login");
            return;
        }

        setIsLoading(true);

        try {
            await updatePassword(user, password);
            await setDoc(doc(db, "users", user.uid), {
                name,
                company,
                email: user.email,
            });

            showAlert("Account setup complete. Redirecting...", "success");
            setTimeout(() => router.push("/add-users"), 2000);
        } catch (error) {
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

                    {/* Password Input with Toggle Icon */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
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
                            className="px-4 py-3 w-full border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Continue Button */}
                    <button
                        onClick={handleSetPassword}
                        className={`bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#00796B] transition-colors"
                            }`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : "Continue"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AccountSetup;
