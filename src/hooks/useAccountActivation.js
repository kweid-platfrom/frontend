// hooks/useAccountActivation.js - SEPARATE HOOK FOR ACTIVATION
import { useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AccountRegistrationService } from '../services/AccountRegistrationService';

export const useAccountActivation = () => {
    const [activationLoading, setActivationLoading] = useState(false);
    const [activationError, setActivationError] = useState(null);
    
    const registrationService = new AccountRegistrationService();

    const activateAccount = async (userId) => {
        setActivationLoading(true);
        setActivationError(null);

        try {
            const result = await registrationService.activateAccount(userId);
            
            if (result.success) {
                console.log('✅ Account activated successfully');
                return result;
            } else {
                throw new Error(result.error?.message || 'Account activation failed');
            }
        } catch (error) {
            console.error('❌ Account activation failed:', error);
            setActivationError(error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setActivationLoading(false);
        }
    };

    const checkAndActivateEmailVerification = async () => {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user && user.emailVerified) {
                    console.log('📧 Email verified, activating account...');
                    const result = await activateAccount(user.uid);
                    unsubscribe();
                    resolve(result);
                } else if (user && !user.emailVerified) {
                    console.log('⏳ Waiting for email verification...');
                    // Continue listening
                } else {
                    console.log('❌ No authenticated user found');
                    unsubscribe();
                    resolve({ success: false, error: 'No authenticated user' });
                }
            });
        });
    };

    return {
        activationLoading,
        activationError,
        activateAccount,
        checkAndActivateEmailVerification,
        clearActivationError: () => setActivationError(null)
    };
};