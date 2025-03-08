"use client";

import React, { useState } from "react";
import { auth } from "../../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset link sent to your email.");
        } catch (error) {
            setMessage(`Failed to send reset email: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">Forgot Password</h2>

                <input
                    type="email"
                    placeholder="Enter your email"
                    className="p-3 border border-gray-300 rounded-lg mb-4 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button onClick={handleResetPassword} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full">
                    Reset Password
                </button>

                {message && <p className="text-green-600 mt-4 text-center">{message}</p>}

                <div className="mt-4 text-center">
                    <button onClick={() => router.push("/login")} className="text-blue-600 hover:underline">
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
