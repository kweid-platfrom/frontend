"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAlert } from "../../components/CustomAlert";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import "../../app/globals.css";

const Register = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

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
        
        // You can add additional work email validation if needed
        // For example, check for certain domains or patterns
        
        setEmailError("");
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            return;
        }

        setLoading(true);

        try {
            const actionCodeSettings = {
                url: `${process.env.NEXT_PUBLIC_APP_URL}/account-setup`,
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem("emailForSignIn", email);
            showAlert("Verification email sent. Please check your inbox.", "success");
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            showAlert("Registration successful!", "success");
            router.push("/dashboard");
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fff] flex flex-col items-center">
            <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                <Link href="/" className="font-bold text-2xl text-[#00897B] hover:text-[#00796B] transition-colors">
                    LOGO
                </Link>
            </header>
            
            {alertComponent}
            
            <div className="justify-center text-center p-5">
                <h2 className="text-[#2D3142] text-2xl font-bold text-center mb-3">Sign Up for QAID</h2>
                <p>– Streamline Your Testing Workflow –</p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-lg p-8 flex flex-col gap-6">
                <button 
                    onClick={handleGoogleRegister}
                    className="flex items-center justify-center gap-2 w-full bg-white text-[#4A4B53] border border-[#E1E2E6] rounded px-4 py-3 text-base hover:bg-gray-50 hover:border-[#9EA0A5] transition-colors"
                    disabled={googleLoading}
                >
                    <FcGoogle className="w-5 h-5 fill-[#4285F4]" />
                    Continue with Google
                    {googleLoading && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                </button>

                <div className="flex items-center text-[#9EA0A5] my-2">
                    <div className="flex-grow border-t border-[#E1E2E6]"></div>
                    <span className="px-3 text-sm">or Register with Email</span>
                    <div className="flex-grow border-t border-[#E1E2E6]"></div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleRegister} noValidate>
                    <div className="flex flex-col gap-1">
                        <input
                            className={`px-4 py-3 border ${
                                emailError ? "border-red-500" : "border-[#E1E2E6]"
                            } rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]`}
                            type="email"
                            placeholder="Company email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError("");
                            }}
                        />
                        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                    </div>

                    <button
                        className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors flex items-center justify-center gap-2"
                        type="submit"
                        disabled={loading}
                    >
                        Sign Up
                        {loading && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                    </button>
                </form>

                <p className="text-sm text-[#4A4B53] text-center">
                    By registering, you agree to our{" "}
                    <Link href="/terms" className="text-[#00897B] font-medium hover:underline">
                        Terms and Conditions
                    </Link>
                </p>

                <p className="text-md text-[#4A4B53] text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#00897B] font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;