"use client"; 

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/dashboard");
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <div>

            <h2>Login</h2>
            <form action="form" onSubmit={handleLogin}>
                <input type="email" placeholder="Company email" on onChange={(e) => setEmail(e.target.value)} required />
                <input type="passsword" placeholder="Password" on onChange={(e) => setPassword(e.target.value)} required />
            </form>
            <span>or Login with </span>
            <button onClick={handleGoogleLogin}>Google</button>
        </div>
    );


};

export default Login;
