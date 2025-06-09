"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import { toast, Toaster } from "sonner";
import { createUserDocument } from "../../services/userService";
import { validateRegistration } from "../../utils/validation";
import RegistrationForm from "./reg/RegistrationForm";
import GoogleSignUp from "./reg/GoogleSignUp";
import BackgroundDecorations from "../BackgroundDecorations";
import '../../app/globals.css';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        userType: "individual",
        password: "",
        confirmPassword: "",
        termsAccepted: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // Google account type selection states
    const [showGoogleAccountType, setShowGoogleAccountType] = useState(false);
    const [googleUserData, setGoogleUserData] = useState(null);
    const [googleAccountType, setGoogleAccountType] = useState("individual");

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    // Store registration data for onboarding flow
    const storeRegistrationData = (userData, method, accountType) => {
        const registrationData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            userType: accountType,
            accountType: accountType === "organization" ? "business" : "personal",
            registrationMethod: method,
            needsOnboarding: true,
            needsEmailVerification: method === 'email', // Track if email verification is needed
            registrationTimestamp: Date.now(),
            ...(method === 'google' && {
                photoURL: userData.photoURL,
                isGoogleUser: true
            })
        };

        localStorage.setItem("registrationData", JSON.stringify(registrationData));
        localStorage.setItem("emailForVerification", userData.email);
        
        // Set flag to prevent automatic routing to setup
        if (method === 'email') {
            localStorage.setItem("awaitingEmailVerification", "true");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Use your validation function
        const validationErrors = validateRegistration(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            console.log('Starting email registration...');

            // Step 1: Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;
            console.log('Firebase Auth user created:', user.uid);

            // Step 2: Send email verification IMMEDIATELY after user creation
            try {
                await sendEmailVerification(user, {
                    url: process.env.NEXT_PUBLIC_APP_URL
                        ? `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
                        : "https://your-domain.com/verify-email",
                    handleCodeInApp: true
                });
                console.log('Verification email sent successfully');
            } catch (emailError) {
                console.error('Email verification failed:', emailError);
                // Don't fail registration if email fails, but show warning
                toast.error("Account created but verification email failed to send. You can resend it later.", {
                    duration: 6000,
                    position: "top-center"
                });
            }

            // Step 3: Prepare user data that matches security rules
            const userData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                userType: formData.userType,
                setupCompleted: false,
                setupStep: "email_verification" // Set to email verification step
            };

            // Step 4: Create user document using userService
            try {
                await createUserDocument(user, userData, 'email');
                console.log('User document created successfully');
            } catch (firestoreError) {
                console.error('Firestore document creation failed:', firestoreError);

                // Clean up auth user if Firestore fails
                try {
                    await user.delete();
                    console.log('Auth user deleted due to Firestore failure');
                } catch (deleteError) {
                    console.error('Failed to delete auth user:', deleteError);
                }

                throw new Error(`Database error: ${firestoreError.message}`);
            }

            // Step 5: Store registration data for onboarding
            storeRegistrationData({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email
            }, 'email', formData.userType);

            // Step 6: Sign out user until they verify email
            await auth.signOut();
            console.log('User signed out - email verification required');

            // Step 7: Show success message and hide form
            setRegistrationSuccess(true);
            toast.success(
                "Account created successfully! Please check your email and click the verification link to complete your registration.",
                {
                    duration: 10000,
                    position: "top-center"
                }
            );

            // Clear form
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                userType: "individual",
                password: "",
                confirmPassword: "",
                termsAccepted: false
            });

        } catch (error) {
            console.error("Registration error:", error);

            let errorMessage;
            if (error.message.includes('Database error:')) {
                errorMessage = "Failed to create user profile. Please check your internet connection and try again.";
            } else {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = "An account with this email already exists. Please try signing in instead.";
                        break;
                    case 'auth/weak-password':
                        errorMessage = "Password is too weak. Please choose a stronger password.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "Please enter a valid email address.";
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = "Email/password registration is not enabled. Please contact support.";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "Network error. Please check your internet connection and try again.";
                        break;
                    case 'permission-denied':
                        errorMessage = "Database permission denied. Please check your Firestore security rules.";
                        break;
                    default:
                        errorMessage = getFirebaseErrorMessage(error) || `Registration failed: ${error.message}`;
                }
            }

            toast.error(errorMessage, {
                duration: 6000,
                position: "top-center"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);

        try {
            console.log('Starting Google registration...');

            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log('Google sign-in successful:', user.uid);

            // Check if this is a new user
            const isNewUser = result._tokenResponse?.isNewUser || false;

            if (!isNewUser) {
                toast.success("Welcome back! Signed in with Google.", {
                    duration: 4000,
                    position: "top-center"
                });
                return;
            }

            // New user - need account type selection
            const userData = {
                firstName: user.displayName?.split(' ')[0] || "",
                lastName: user.displayName?.split(' ').slice(1).join(' ') || "",
                email: user.email,
                photoURL: user.photoURL || ""
            };

            setGoogleUserData({ user, userData });
            setShowGoogleAccountType(true);

        } catch (error) {
            console.error("Google registration error:", error);

            let errorMessage;
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = "Sign-in was cancelled. Please try again.";
                    break;
                case 'auth/popup-blocked':
                    errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups and try again.";
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = "An account already exists with this email using a different sign-in method.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your connection and try again.";
                    break;
                default:
                    errorMessage = getFirebaseErrorMessage(error) || "Google sign-in failed. Please try again.";
            }

            toast.error(errorMessage, {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleAccountTypeSelection = async () => {
        if (!googleUserData) return;

        setGoogleLoading(true);

        try {
            console.log('Completing Google account setup...');
            const { user, userData } = googleUserData;

            // Prepare user data that matches security rules
            const userDocData = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                avatarURL: userData.photoURL,
                userType: googleAccountType,
                setupCompleted: false,
                setupStep: googleAccountType === "organization" ? "organization_info" : "project_creation"
            };

            // Create user document using userService
            await createUserDocument(user, userDocData, 'google');
            console.log('Google user document created successfully');

            // Store registration data for onboarding (Google users don't need email verification)
            storeRegistrationData(userData, 'google', googleAccountType);
            localStorage.setItem("needsOnboarding", "true");
            // Clear email verification flag for Google users
            localStorage.removeItem("awaitingEmailVerification");

            toast.success("Google registration successful! Redirecting to setup...", {
                duration: 3000,
                position: "top-center"
            });

            // Reset states
            setShowGoogleAccountType(false);
            setGoogleUserData(null);
            setGoogleAccountType("individual");

            // Redirect to setup after short delay
            setTimeout(() => {
                window.location.href = '/setup';
            }, 1500);

        } catch (error) {
            console.error("Google account setup error:", error);
            toast.error(`Failed to complete Google registration: ${error.message}`, {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    // Email Verification Success Component
    const EmailVerificationSuccess = () => (
        <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-4">
                    We&apos;ve sent a verification link to <strong>{formData.email || "your email"}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Click the link in the email to verify your account and complete registration.
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Go to Sign In
                </button>
                
                <button
                    onClick={() => {
                        setRegistrationSuccess(false);
                        // Clear stored data to allow re-registration if needed
                        localStorage.removeItem("awaitingEmailVerification");
                    }}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Register Another Account
                </button>
            </div>
            
            <div className="text-xs text-gray-500">
                <p>Didn&apos;t receive the email?</p>
                <p>Check your spam folder or contact support</p>
            </div>
        </div>
    );

    // Google Account Type Selection Modal
    const GoogleAccountTypeModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Complete Your Google Registration
                </h3>
                <p className="text-gray-600 mb-6">
                    Please select your account type to continue:
                </p>

                <div className="space-y-3 mb-6">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                            type="radio"
                            name="googleAccountType"
                            value="individual"
                            checked={googleAccountType === "individual"}
                            onChange={(e) => setGoogleAccountType(e.target.value)}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium text-gray-900">Individual</div>
                            <div className="text-sm text-gray-500">Personal QA testing and projects</div>
                        </div>
                    </label>

                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                            type="radio"
                            name="googleAccountType"
                            value="organization"
                            checked={googleAccountType === "organization"}
                            onChange={(e) => setGoogleAccountType(e.target.value)}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium text-gray-900">Organization</div>
                            <div className="text-sm text-gray-500">Team collaboration and management</div>
                        </div>
                    </label>
                </div>

                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => {
                            setShowGoogleAccountType(false);
                            setGoogleUserData(null);
                            auth.signOut();
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={googleLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleGoogleAccountTypeSelection}
                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                        disabled={googleLoading}
                    >
                        {googleLoading ? "Setting up..." : "Continue"}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            <Toaster
                richColors
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '12px'
                    }
                }}
            />

            <BackgroundDecorations />

            {showGoogleAccountType && <GoogleAccountTypeModal />}

            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>

                    {/* Registration Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>

                        {registrationSuccess ? (
                            <EmailVerificationSuccess />
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
                                    <p className="text-base sm:text-lg text-slate-600">Streamline your testing workflow</p>
                                </div>

                                <div className="space-y-6">
                                    <GoogleSignUp
                                        onGoogleRegister={handleGoogleRegister}
                                        loading={googleLoading}
                                    />

                                    {/* Divider */}
                                    <div className="flex items-center my-8">
                                        <div className="flex-grow border-t border-slate-300"></div>
                                        <span className="px-4 text-sm text-slate-500 font-medium bg-white">or register with email</span>
                                        <div className="flex-grow border-t border-slate-300"></div>
                                    </div>

                                    <RegistrationForm
                                        formData={formData}
                                        errors={errors}
                                        loading={loading}
                                        onInputChange={handleInputChange}
                                        onSubmit={handleRegister}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;