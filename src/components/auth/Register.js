// Register.jsx
"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import '../../app/globals.css';

const Register = () => {
    const [email, setEmail] = useState("");
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const actionCodeSettings = {
                url: "http://localhost:3000/set-password",
                handleCodeInApp: true,
            };
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem("emailForSignIn", email);
            alert("Verification email sent. Please check your inbox.");
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleGoogleRegister = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            router.push("/dashboard");
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center">
            <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                <div className="font-bold text-2xl text-[#00897B]">LOGO</div>
            </header>
            
            <div className="w-full max-w-md mt-[10vh] bg-white rounded-lg shadow-md p-8 flex flex-col gap-6">
                <h2 className="text-[#2D3142] text-2xl font-bold text-center">Register</h2>
                
                <button 
                    onClick={handleGoogleRegister}
                    className="flex items-center justify-center gap-2 w-full bg-white text-[#4A4B53] border border-[#E1E2E6] rounded px-4 py-3 text-base hover:bg-gray-50 hover:border-[#9EA0A5] transition-colors"
                >
                    <svg className="w-5 h-5 fill-[#4285F4]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Continue with Google
                </button>
                
                <div className="flex items-center text-[#9EA0A5] my-2">
                    <div className="flex-grow border-t border-[#E1E2E6]"></div>
                    <span className="px-3 text-sm">or Register with Email</span>
                    <div className="flex-grow border-t border-[#E1E2E6]"></div>
                </div>
                
                <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    <input 
                        className="px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                        type="email" 
                        placeholder="Company email" 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <button 
                        className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors"
                        type="submit"
                    >
                        Register
                    </button>
                </form>
                
                <p className="text-sm text-[#4A4B53] text-center">
                    By registering, you agree to our{' '}
                    <Link href="/terms" className="text-[#00897B] font-medium hover:underline">
                        Terms and Conditions
                    </Link>
                </p>
                
                <p className="text-sm text-[#4A4B53] text-center">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#00897B] font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;