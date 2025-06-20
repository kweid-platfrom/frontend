export const validateRegistration = (formData) => {
    const errors = {};

    // First Name validation
    if (!formData.firstName?.trim()) {
        errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
        errors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName?.trim()) {
        errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
        errors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email) {
        errors.email = "Email is required";
    } else if (!emailPattern.test(formData.email)) {
        errors.email = "Enter a valid email address";
    } else if (formData.userType === "organization") {
        const personalDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
            'icloud.com', 'protonmail.com', 'yandex.com', 'mail.com', 'live.com',
            'msn.com', 'comcast.net', 'sbcglobal.net', 'verizon.net'
        ];
        const domain = formData.email.split("@")[1]?.toLowerCase();
        if (personalDomains.includes(domain)) {
            errors.email = "Organization email must be from a custom domain";
        }
    }

    // Password validation
    if (!formData.password) {
        errors.password = "Password is required";
    } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!formData.termsAccepted) {
        errors.termsAccepted = "You must accept the terms";
    }

    return errors;
};