import { useState } from "react";
import { accountService } from "../services/accountService";

export const useFormValidation = () => {
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        password: ""
    });

    const validateName = (name) => {
        if (!name.trim()) {
            setErrors(prev => ({ ...prev, name: "Full name is required" }));
            return false;
        }
        if (name.trim().length < 2) {
            setErrors(prev => ({ ...prev, name: "Full name must be at least 2 characters" }));
            return false;
        }
        setErrors(prev => ({ ...prev, name: "" }));
        return true;
    };

    const validateEmail = (email) => {
        if (!email) {
            setErrors(prev => ({ ...prev, email: "Email is required" }));
            return false;
        }
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
            return false;
        }
        setErrors(prev => ({ ...prev, email: "" }));
        return true;
    };

    const validatePassword = (password, confirmPassword) => {
        if (!password) {
            setErrors(prev => ({ ...prev, password: "Password is required" }));
            return false;
        }
        if (password.length < 8) {
            setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters long" }));
            return false;
        }
        if (password !== confirmPassword) {
            setErrors(prev => ({ ...prev, password: "Passwords do not match" }));
            return false;
        }
        setErrors(prev => ({ ...prev, password: "" }));
        return true;
    };

    const clearError = (field) => {
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    // New function to get account type based on email
    const getAccountType = (email) => {
        return accountService.getAccountType(email);
    };

    // New function to check if email is from public domain
    const isPublicDomain = (email) => {
        return accountService.isPublicDomain(email);
    };

    return {
        errors,
        validateName,
        validateEmail,
        validatePassword,
        clearError,
        getAccountType,
        isPublicDomain
    };
};