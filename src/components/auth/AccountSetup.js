"use client"; 

import { useState, useEffect } from "react";
import { isSignInWithEmailLink, signInWithEmailLink, updatePassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useNavigate } from "react-router-dom";

const AccountSetup = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");

    const navigaten = useNavigate();
    const email = window.localStorage.getItem("emailForSignIn")

    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            signInWithEmailLink(auth, email, window.location.href).then(() => {
                window.localStorage.removeItem("emailForSignIn");
            })
                .catch((error) => console.error(error.message));
        }
    }, [email]);

    const handleSetpassword = async () => {
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            await updatePassword(auth.currentUser, password);
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                name, company, email: auth.currentUser.eamil,
            });
            alert("Account setup complete.");
            navigaten("/add-users")
        } catch (error) {
            console.error(error.message)
        }
    };

    return (
        <div>
            <h2>Set Up Your Acoount</h2>
            <input type="text" placeholder="Full name" onChange={(e) => setName(e.target.value)} required />
            <input type="text" placeholder="Company name" onChange={(e) => setCompany(e.target.value)} required />
            <input type="password" placeholder="New Password" onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" placeholder="Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button onClick={handleSetpassword}>Continue</button>
        </div>
    )


}

export default AccountSetup;