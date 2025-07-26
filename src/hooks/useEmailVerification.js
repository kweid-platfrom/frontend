// hooks/useEmailVerification.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useEmailVerification = () => {
    const [isVerified, setIsVerified] = useState(false);
    const [loading] = useState(false);
    const [error, setError] = useState(null);
    const [checkingVerification, setCheckingVerification] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsVerified(user.emailVerified);
            } else {
                setIsVerified(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const checkVerificationStatus = async () => {
        setCheckingVerification(true);
        setError(null);

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No authenticated user found');
            }

            // Reload user to get latest verification status
            await reload(user);
            setIsVerified(user.emailVerified);

            return {
                success: true,
                isVerified: user.emailVerified
            };

        } catch (error) {
            console.error('Verification check error:', error);
            setError(error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setCheckingVerification(false);
        }
    };

    const clearError = () => setError(null);

    return {
        isVerified,
        loading,
        error,
        checkingVerification,
        checkVerificationStatus,
        clearError
    };
};