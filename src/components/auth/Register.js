"use client"; 

import { useState } from "react";
import { sendSignInLinkToEmail, signInWithPopup, } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useRouter } from "next/navigation";

const Register = () => {
    const [email, setEmail] = useState("");
    const router = useRouter();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const actionCodeSettings = {
                url: "http://localhost:3000/set-password", handleCodeInApp: true,
            };
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem("emailForSignIn", email)
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
        <div>

            <h2>Register</h2>
            <button onClick={handleGoogleRegister}>Google</button>
            <span>or Register with </span>
            <form action="form" onSubmit={handleRegister}>
                <input type="email" placeholder="Company email" on onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit">Register</button>
            </form>

        </div>
    );


};

export default Register;
