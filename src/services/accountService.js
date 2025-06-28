// services/accountService.js
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "../config/firebase";
import { auth } from "../config/firebase";

/**
 * Determine account type based on email domain
 * @param {string} email 
 * @returns {string} 'individual' or 'organization'
 */
const getAccountType = (email) => {
    const publicDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com', 'yandex.com',
        'mail.com', 'zoho.com', 'fastmail.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return publicDomains.includes(domain) ? 'individual' : 'organization';
};

/**
 * Check and update trial status for a user profile
 * @param {Object} userProfile 
 * @returns {Object} Updated user profile
 */
const checkAndUpdateTrialStatus = (userProfile) => {
    if (!userProfile) return null;

    const now = new Date();
    const trialEndDate = userProfile.subscriptionEndDate?.toDate ? 
        userProfile.subscriptionEndDate.toDate() : 
        new Date(userProfile.subscriptionEndDate);
    
    const trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)));
    const isTrialActive = trialDaysRemaining > 0 && userProfile.subscriptionStatus === 'trial';

    return {
        ...userProfile,
        isTrialActive,
        trialDaysRemaining,
        subscriptionStatus: isTrialActive ? 'trial' : 
            (userProfile.subscriptionType === 'free' ? 'active' : userProfile.subscriptionStatus)
    };
};

/**
 * Get user capabilities based on subscription
 * @param {Object} userProfile 
 * @returns {Object} User capabilities
 */
const getUserCapabilities = (userProfile) => {
    if (!userProfile) return {
        isTrialActive: false,
        trialDaysRemaining: 0,
        subscriptionType: 'free',
        subscriptionStatus: 'active',
        canCreateMultipleSuites: false,
        canAccessAdvancedReports: false,
        canInviteTeamMembers: false,
        canUseAPI: false,
        canUseAutomation: false,
        limits: {
            maxSuites: 1,
            maxReports: 5,
            maxTeamMembers: 1
        }
    };

    const updatedProfile = checkAndUpdateTrialStatus(userProfile);
    const { isTrialActive, subscriptionType, subscriptionStatus } = updatedProfile;

    // Define capabilities based on subscription type
    const isPaidSubscription = subscriptionType !== 'free' && subscriptionStatus === 'active';
    const hasAccess = isTrialActive || isPaidSubscription;

    return {
        isTrialActive,
        trialDaysRemaining: updatedProfile.trialDaysRemaining,
        subscriptionType,
        subscriptionStatus,
        canCreateMultipleSuites: hasAccess,
        canAccessAdvancedReports: hasAccess,
        canInviteTeamMembers: hasAccess && (subscriptionType.includes('team') || subscriptionType.includes('organization')),
        canUseAPI: hasAccess && (subscriptionType.includes('pro') || subscriptionType.includes('organization')),
        canUseAutomation: hasAccess,
        limits: {
            maxSuites: hasAccess ? (subscriptionType.includes('organization') ? 100 : 10) : 1,
            maxReports: hasAccess ? (subscriptionType.includes('organization') ? 1000 : 100) : 5,
            maxTeamMembers: hasAccess ? (subscriptionType.includes('organization') ? 50 : 5) : 1
        }
    };
};

/**
 * Create initial user profile in Firestore
 * @param {string} userId 
 * @param {Object} profileData 
 * @returns {Promise<Object>}
 */
const createUserProfile = async (userId, profileData) => {
    try {
        const userRef = doc(db, 'users', userId);
        
        // Check if user already exists
        const existingUser = await getDoc(userRef);
        if (existingUser.exists()) {
            throw new Error('User profile already exists');
        }

        const userProfile = {
            uid: userId,
            email: profileData.email.toLowerCase().trim(),
            firstName: profileData.firstName?.trim() || '',
            lastName: profileData.lastName?.trim() || '',
            fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
            avatar: profileData.avatar || null,
            accountType: profileData.accountType || 'individual',
            userType: profileData.accountType || 'individual',
            role: ['member'], // Default role
            organizationId: profileData.organizationId || null,
            organizationName: profileData.organizationName || null,
            subscriptionStatus: 'trial',
            subscriptionType: profileData.accountType === 'organization' ? 'organization_trial' : 'individual_trial',
            subscriptionStartDate: serverTimestamp(),
            subscriptionEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
            emailVerified: profileData.emailVerified || false,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            onboardingCompleted: false,
            preferences: {
                notifications: true,
                theme: 'light',
                language: 'en'
            }
        };

        await setDoc(userRef, userProfile);
        return userProfile;

    } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
    }
};

/**
 * Create organization and set user as admin
 * @param {string} userId 
 * @param {Object} orgData 
 * @returns {Promise<string>} Organization ID
 */
const createOrganization = async () => {
    try {
        const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Based on your existing code structure, organization data is stored
        // in the user profile rather than a separate collection
        // The organizationId is returned to be stored in the user profile
        
        return organizationId;

    } catch (error) {
        console.error('Error creating organization:', error);
        throw new Error(`Failed to create organization: ${error.message}`);
    }
};

/**
 * Handle invitation acceptance and account setup
 * @param {string} inviteId 
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
const acceptInvitationAndSetupAccount = async (inviteId, userData) => {
    try {
        // Get invitation details
        const inviteRef = doc(db, 'invitations', inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            throw new Error('Invitation not found');
        }

        const inviteData = inviteSnap.data();

        // Check if invitation is still valid
        const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(0);
        if (expiresAt < new Date()) {
            throw new Error('Invitation has expired');
        }

        if (inviteData.status !== 'pending') {
            throw new Error('Invitation is no longer valid');
        }

        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify email matches invitation
        if (user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
            throw new Error('Email does not match invitation');
        }

        // Create user profile with organization details
        const userProfile = await createUserProfile(user.uid, {
            email: user.email,
            firstName: userData.firstName || inviteData.firstName,
            lastName: userData.lastName || inviteData.lastName,
            avatar: user.photoURL,
            accountType: 'organization',
            organizationId: inviteData.organizationId,
            organizationName: inviteData.organizationName,
            emailVerified: user.emailVerified
        });

        // Update user role based on invitation
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            role: [inviteData.role],
            invitedBy: inviteData.invitedBy,
            joinedAt: serverTimestamp()
        }, { merge: true });

        // Mark invitation as accepted
        await setDoc(inviteRef, {
            status: 'accepted',
            acceptedBy: user.uid,
            acceptedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        return {
            success: true,
            userProfile,
            organizationId: inviteData.organizationId,
            role: inviteData.role
        };

    } catch (error) {
        console.error('Error accepting invitation:', error);
        throw new Error(`Failed to accept invitation: ${error.message}`);
    }
};

/**
 * Complete account setup for new users
 * @param {Object} accountData 
 * @returns {Promise<Object>}
 */
const setupAccount = async (accountData) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not authenticated");
        }

        // If this is an invitation acceptance, handle it separately
        if (accountData.inviteId) {
            return await acceptInvitationAndSetupAccount(accountData.inviteId, accountData);
        }

        // Determine account type
        const accountType = getAccountType(user.email);
        let organizationId = null;

        // Create organization if needed
        if (accountType === 'organization' && accountData.organizationName) {
            organizationId = await createOrganization();
        }

        // Create user profile
        const userProfile = await createUserProfile(user.uid, {
            email: user.email,
            firstName: accountData.firstName,
            lastName: accountData.lastName,
            avatar: user.photoURL,
            accountType,
            organizationId,
            organizationName: accountData.organizationName,
            emailVerified: user.emailVerified
        });

        // If organization account, set user as admin
        if (accountType === 'organization' && organizationId) {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                role: ['admin'],
                organizationName: accountData.organizationName
            }, { merge: true });
        }

        return {
            success: true,
            accountType,
            organizationId,
            userId: user.uid,
            userProfile
        };

    } catch (error) {
        console.error('Account setup failed:', error);
        throw new Error(`Account setup failed: ${error.message}`);
    }
};

/**
 * Complete onboarding process
 * @param {string} userId 
 * @param {Object} onboardingData 
 * @returns {Promise<Object>}
 */
const completeOnboarding = async (userId, onboardingData) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const updateData = {
            onboardingCompleted: true,
            onboardingCompletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...(onboardingData.preferences && { 
                preferences: {
                    ...userSnap.data().preferences,
                    ...onboardingData.preferences
                }
            }),
            ...(onboardingData.profile && onboardingData.profile)
        };

        await setDoc(userRef, updateData, { merge: true });

        return { success: true, message: 'Onboarding completed successfully' };

    } catch (error) {
        console.error('Error completing onboarding:', error);
        throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
};

/**
 * Get account setup status
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
const getAccountSetupStatus = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return {
                exists: false,
                setupComplete: false,
                onboardingComplete: false
            };
        }

        const userData = userSnap.data();

        return {
            exists: true,
            setupComplete: true,
            onboardingComplete: userData.onboardingCompleted || false,
            accountType: userData.accountType,
            hasOrganization: !!userData.organizationId,
            emailVerified: userData.emailVerified || false,
            subscriptionStatus: userData.subscriptionStatus
        };

    } catch (error) {
        console.error('Error getting account setup status:', error);
        throw new Error('Failed to get account setup status');
    }
};

/**
 * Check if invitation exists and is valid
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
const checkPendingInvitation = async (email) => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(
            invitationsRef,
            where('email', '==', email.toLowerCase().trim()),
            where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        // Find the most recent valid invitation
        let validInvitation = null;
        querySnapshot.forEach((doc) => {
            const inviteData = doc.data();
            const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(0);
            
            if (expiresAt > new Date()) {
                if (!validInvitation || inviteData.createdAt?.toDate?.() > validInvitation.createdAt?.toDate?.()) {
                    validInvitation = inviteData;
                }
            }
        });

        return validInvitation;

    } catch (error) {
        console.error('Error checking pending invitation:', error);
        return null;
    }
};

// Create the accountService object with all the methods
export const accountService = {
    setupAccount,
    createUserProfile,
    createOrganization,
    acceptInvitationAndSetupAccount,
    completeOnboarding,
    getAccountSetupStatus,
    checkPendingInvitation,
    getAccountType,
    checkAndUpdateTrialStatus,
    getUserCapabilities
};

// Also export individual functions for backward compatibility
export {
    setupAccount,
    createUserProfile,
    createOrganization,
    acceptInvitationAndSetupAccount,
    completeOnboarding,
    getAccountSetupStatus,
    checkPendingInvitation,
    getAccountType
};