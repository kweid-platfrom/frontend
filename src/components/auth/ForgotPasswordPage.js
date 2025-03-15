"use client";

import React, { useState } from "react";
import { auth } from "../../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../app/globals.css";
import { useAlert } from "../CustomAlert";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleResetPassword = async () => {
        setError("");
        if (!email) {
            setError("Email field cannot be empty.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            showAlert("Password reset link sent! Check your email.", "success");
            setEmail(""); // Clear input field after successful submission
        } catch (error) {
            console.error("Error sending reset email:", error.message);
            let errorMessage = "Failed to send reset email. Please try again.";
            if (error.code === "auth/user-not-found") {
                errorMessage = "No user found with this email.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Invalid email address.";
            }
            showAlert(errorMessage, "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#fff] flex flex-col items-center ">
            <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                <Link href="/" className="font-bold text-2xl text-[#00897B] hover:text-[#00796B] transition-colors">
                    LOGO
                </Link>
                {alertComponent}
            </header>
            <div className="justify-center text-center p-8">
                <h2 className="text-[#2D3142] text-2xl font-bold text-center mb-3">Forgot Password</h2>
                <p>– Forgot your password? Don&apos;t worry—enter your email, <br /> and we&apos;ll send you a reset link. –</p>
            </div>
            <div className="justify-center text-center w-full max-w-sm p-8">
                <input
                    type="email"
                    placeholder="Enter your email"
                    className="p-3 border border-gray-300 rounded w-full mb-3 focus:outline-none focus:border-[#00897B]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                {error && <p className="text-red-600 text-sm mb-2 text-left">{error}</p>}
                
                <button onClick={handleResetPassword} className="bg-[#00897B] text-white px-4 py-3 rounded hover:bg-[#00796B] w-full">
                    Reset Password
                </button>

                <div className="mt-4 text-center">
                    <button onClick={() => router.push("/login")} className="text-[#00897B] hover:underline">
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
