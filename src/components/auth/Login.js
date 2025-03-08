// Login.jsx
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAlert } from "../../components/CustomAlert";
import '../../app/globals.css';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert("Login successful!", "success");
            router.push("/dashboard");
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showAlert("Login successful!", "success");
            router.push("/dashboard");
        } catch (error) {
            console.error(error.message);
            showAlert(error.message, "error");
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        router.push("/forgot-password");
    };

    return (
        <>
            {/* The Alert Component */}
            {alertComponent}
            <div className="min-h-screen bg-[#fff] flex flex-col items-center">

                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                    <Link href="/" className="font-bold text-2xl text-[#00897B] hover:text-[#00796B] transition-colors">LOGO</Link>
                </header>

                <div className="w-full max-w-md mt-[5vh] bg-white rounded-lg p-8 flex flex-col gap-6">
                    <h2 className="text-[#2D3142] mb-15 text-2xl font-bold text-center">Log in to your Suite</h2>

                    <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                        <input
                            className="px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className="px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div className="text-right">
                            <button
                                onClick={handleForgotPassword}
                                className="text-[#00897B] text-sm hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <button
                            className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors disabled:bg-[#9EA0A5] disabled:cursor-not-allowed"
                            type="submit"
                            disabled={!email || !password}
                        >
                            Login
                        </button>
                    </form>

                    <div className="flex items-center text-[#9EA0A5] my-2">
                        <div className="flex-grow border-t border-[#E1E2E6]"></div>
                        <span className="px-3 text-sm">or Login with Email</span>
                        <div className="flex-grow border-t border-[#E1E2E6]"></div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2 w-[50%] bg-white text-[#4A4B53] border border-[#E1E2E6] rounded px-4 py-3 text-base hover:bg-gray-50 hover:border-[#9EA0A5] transition-colors"
                        >
                            <svg className="w-5 h-5 fill-[#4285F4]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                            </svg>
                            Google
                        </button>
                    </div>

                    <p className="text-sm text-[#4A4B53] mt-30 text-center">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-[#00897B] font-medium hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Login;