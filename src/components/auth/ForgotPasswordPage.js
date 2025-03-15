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
    const [message, setMessage] = useState("");
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset link sent to your email.");
        } catch (error) {
            console.error(error.message);
            showAlert(`Failed to send reset email: ${error.message}`);
        } 
    };

    return (
        <div className="min-h-screen bg-[#fff] flex flex-col items-center ">
            <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                <Link href="/" className="font-bold text-2xl text-[#00897B] hover:text-[#00796B] transition-colors">
                    LOGO
                </Link>
                {/* The Alert Component */}
                {alertComponent}
            </header>
            <div className="justify-center text-center p-8">
                <h2 className="text-[#2D3142] text-2xl font-bold text-center mb-3">Forget Password </h2>
                <p>– Forgot your password? Don&apos;t worry—enter your email, <br /> and we&apos;ll send you a reset link. – </p>
            </div>
            <div className="justify-center text-center w-full max-w-sm p-8">
                <input
                    type="email"
                    placeholder="Enter your email"
                    className="p-3 border border-gray-300 rounded w-full mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button onClick={handleResetPassword} className="bg-[#00897B] text-white px-4 py-3 rounded hover:bg-[#00796B] w-full">
                    Reset Password
                </button>

                {message && <p className="text-green-600 mt-4 text-center">{message}</p>}

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
