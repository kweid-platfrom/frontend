import React from 'react';
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const GoogleSSO = ({ loading, onGoogleAuth, className = "" }) => {
    const handleGoogleSignUp = async () => {
        try {
            // Check if Google Identity Services is available
            if (typeof window !== 'undefined' && window.google) {
                // Initialize Google Sign-In
                window.google.accounts.id.initialize({
                    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id',
                    callback: handleGoogleCallback,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                // Prompt for Google sign-in
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Fallback to popup if prompt is not displayed
                        window.google.accounts.id.renderButton(
                            document.createElement('div'),
                            {
                                type: 'standard',
                                theme: 'outline',
                                size: 'large',
                                text: 'signin_with',
                                shape: 'rectangular',
                            }
                        );
                    }
                });
            } else {
                // Fallback for development or when Google SDK is not loaded
                toast.info('Google sign-up will be available soon!');
                console.log('Google SDK not loaded or not in browser environment');
            }
        } catch (error) {
            console.error('Google sign-up error:', error);
            toast.error('Google sign-up failed. Please try again.');
        }
    };

    const handleGoogleCallback = async (response) => {
        try {
            if (response.credential) {
                // Decode the JWT token to get user info
                const payload = JSON.parse(atob(response.credential.split('.')[1]));
                
                const googleUserData = {
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    googleId: payload.sub,
                    emailVerified: payload.email_verified
                };

                // Call the parent component's Google auth handler
                if (onGoogleAuth) {
                    await onGoogleAuth(googleUserData, response.credential);
                }
            }
        } catch (error) {
            console.error('Google callback error:', error);
            toast.error('Google authentication failed. Please try again.');
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className={`w-full bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 font-medium sm:font-semibold border-2 border-slate-200 rounded-lg px-3 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${className}`}
            >
                <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Continue with Google</span>
                {loading && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
            </button>
        </>
    );
};

export default GoogleSSO;