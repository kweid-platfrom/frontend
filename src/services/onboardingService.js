// onboardingService.js - Onboarding flow management
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { createUserDocument, fetchUserData } from "./userService.js";
import {
    normalizeOnboardingProgress,
    isOnboardingComplete,
    getNextOnboardingStep,
    createStepUpdateData,
    logStepCompletion
} from "../utils/onboardingUtils";

/**
 * Create user if not exists - main onboarding entry point
 */
export const createUserIfNotExists = async (firebaseUser, additionalData = {}, source = 'auth') => {
    if (!firebaseUser?.uid) {
        return {
            isNewUser: false,
            userData: null,
            needsSetup: false,
            error: 'Invalid user provided'
        };
    }

    try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await Promise.race([
            getDoc(userRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database read timeout')), 5000))
        ]);

        if (userSnap.exists()) {
            const existingData = userSnap.data();

            // Update last login and email verification status
            const updateData = {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Update email verification status if it changed
            if (existingData.emailVerified !== firebaseUser.emailVerified) {
                updateData.emailVerified = firebaseUser.emailVerified;

                // If email just got verified, update onboarding progress consistently
                if (firebaseUser.emailVerified && !existingData.emailVerified) {
                    updateData['onboardingProgress.emailVerified'] = true;

                    // Update setup step if still on email verification
                    if (existingData.setupStep === 'email_verification') {
                        const nextStep = getNextOnboardingStep(existingData.accountType, existingData.onboardingProgress);
                        if (nextStep) {
                            updateData.setupStep = nextStep.replace('-', '_');
                        }
                    }
                }
            }

            // Update without failing if error
            setDoc(userRef, updateData, { merge: true }).catch(() => { });

            // Normalize onboarding progress for consistent access
            const normalizedData = {
                ...existingData,
                ...updateData,
                onboardingProgress: normalizeOnboardingProgress(existingData.onboardingProgress)
            };

            return {
                isNewUser: false,
                userData: normalizedData,
                needsSetup: !isOnboardingComplete(
                    existingData.accountType,
                    existingData.onboardingProgress,
                    existingData.onboardingStatus
                ),
                error: null
            };
        }

        const userData = await createUserDocument(firebaseUser, additionalData, source);

        return {
            isNewUser: true,
            userData,
            needsSetup: !isOnboardingComplete(
                userData.accountType,
                userData.onboardingProgress,
                userData.onboardingStatus
            ),
            error: null
        };

    } catch (error) {
        return {
            isNewUser: false,
            userData: null,
            needsSetup: false,
            error: error.message
        };
    }
};

/**
 * Complete user setup - only mark as complete when actually complete
 */
export const completeUserSetup = async (userId, setupData) => {
    if (!userId) throw new Error('User ID is required');

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const updateData = {
            ...(setupData.displayName && { displayName: setupData.displayName.trim() }),
            ...(setupData.firstName && { firstName: setupData.firstName.trim() }),
            ...(setupData.lastName && { lastName: setupData.lastName.trim() }),
            ...(setupData.email && { email: setupData.email.toLowerCase().trim() }),
            ...(typeof setupData.emailVerified === 'boolean' && { emailVerified: setupData.emailVerified }),
            ...(setupData.avatarURL !== undefined && { avatarURL: setupData.avatarURL }),
            ...(setupData.accountType && {
                accountType: setupData.accountType,
                userType: setupData.accountType
            }),
            ...(setupData.organizationId !== undefined && { organizationId: setupData.organizationId }),
            ...(setupData.phone && { phone: setupData.phone.trim() }),
            ...(setupData.bio && { bio: setupData.bio.trim() }),
            ...(setupData.location && { location: setupData.location.trim() }),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };

        // Handle onboarding progress updates with consistent field naming
        if (setupData.onboardingProgress) {
            Object.keys(setupData.onboardingProgress).forEach(key => {
                updateData[`onboardingProgress.${key}`] = setupData.onboardingProgress[key];
            });
        }

        // Handle onboarding status updates
        if (setupData.onboardingStatus) {
            Object.keys(setupData.onboardingStatus).forEach(key => {
                updateData[`onboardingStatus.${key}`] = setupData.onboardingStatus[key];
            });
        }

        // Handle direct field updates (for backward compatibility)
        Object.keys(setupData).forEach(key => {
            if (key.startsWith('onboardingProgress.') || key.startsWith('onboardingStatus.')) {
                updateData[key] = setupData[key];
            }
        });

        // Only set setupCompleted if explicitly provided and true
        if (setupData.setupCompleted === true) {
            updateData.setupCompleted = true;
            updateData.setupStep = 'completed';
            updateData['onboardingStatus.onboardingComplete'] = true;
            updateData['onboardingStatus.completedAt'] = serverTimestamp();
        } else if (setupData.setupStep) {
            updateData.setupStep = setupData.setupStep;
        }

        await setDoc(userRef, updateData, { merge: true });

        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to update this user profile.');
        }
        throw new Error(`Failed to complete user setup: ${error.message}`);
    }
};

/**
 * Update specific onboarding step with consistent field naming
 */
export const updateOnboardingStep = async (userId, stepName, stepData = {}) => {
    if (!userId) throw new Error('User ID is required');

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const accountType = userSnap.data().accountType;

        // Use utility function to create consistent update data
        const updateData = createStepUpdateData(stepName, stepData, accountType);

        // Log the step completion for debugging
        logStepCompletion(stepName, stepData, accountType, userId);

        await setDoc(userRef, updateData, { merge: true });

        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        throw new Error(`Failed to update onboarding step: ${error.message}`);
    }
};

/**
 * Complete onboarding with consistent field updates
 */
export const completeOnboarding = async (userId, completionData = {}) => {
    try {
        const userRef = doc(db, 'users', userId);
        const updateData = {
            'onboardingStatus.onboardingComplete': true,
            'onboardingStatus.completedAt': serverTimestamp(),
            'onboardingProgress.projectCreation': true, // Use consistent field name
            setupCompleted: true,
            setupStep: 'completed',
            updatedAt: serverTimestamp(),
            ...completionData
        };

        await updateDoc(userRef, updateData);
        return true;
    } catch (error) {
        console.error('Error completing onboarding:', error);
        throw error;
    }
};

/**
 * Get user onboarding status with consistent field access
 */
export const getUserOnboardingStatus = async (userId) => {
    if (!userId) return null;

    try {
        const userData = await fetchUserData(userId);
        if (!userData) return null;

        const { accountType, onboardingProgress, onboardingStatus } = userData;

        return {
            accountType,
            isComplete: isOnboardingComplete(accountType, onboardingProgress, onboardingStatus),
            nextStep: getNextOnboardingStep(accountType, onboardingProgress),
            progress: normalizeOnboardingProgress(onboardingProgress),
            status: onboardingStatus || {}
        };
    } catch (error) {
        console.error('Error getting onboarding status:', error);
        return null;
    }
};