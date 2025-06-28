// Fixed services/accountService.js - Resolves trial status issues

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    Timestamp
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
    if (!userProfile) {
        console.log('No user profile provided to checkAndUpdateTrialStatus');
        return null;
    }

    const now = new Date();
    let trialEndDate;
    
    // Initialize default values if missing
    const subscriptionStatus = userProfile.subscriptionStatus || 'inactive';
    const subscriptionType = userProfile.subscriptionType || 'free';

    console.log('Starting trial check with:', {
        subscriptionStatus,
        subscriptionType,
        hasSubscriptionEndDate: !!userProfile.subscriptionEndDate
    });

    // Handle different date formats properly
    if (userProfile.subscriptionEndDate) {
        if (userProfile.subscriptionEndDate.toDate) {
            // Firestore Timestamp
            trialEndDate = userProfile.subscriptionEndDate.toDate();
        } else if (userProfile.subscriptionEndDate.seconds) {
            // Firestore Timestamp object format
            trialEndDate = new Date(userProfile.subscriptionEndDate.seconds * 1000);
        } else if (typeof userProfile.subscriptionEndDate === 'string') {
            // ISO string
            trialEndDate = new Date(userProfile.subscriptionEndDate);
        } else if (userProfile.subscriptionEndDate instanceof Date) {
            // Already a Date object
            trialEndDate = userProfile.subscriptionEndDate;
        } else {
            // Fallback - calculate from creation date if available
            const createdAt = userProfile.createdAt?.toDate?.() || 
                             userProfile.subscriptionStartDate?.toDate?.() || 
                             new Date();
            trialEndDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
    } else {
        // No end date - calculate from creation/start date
        const createdAt = userProfile.createdAt?.toDate?.() || 
                         userProfile.subscriptionStartDate?.toDate?.() || 
                         new Date();
        trialEndDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const trialDaysRemaining = Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)));
    
    // A trial is active if:
    // 1. Status is explicitly 'trial', OR
    // 2. Subscription type includes 'trial', OR  
    // 3. User has trial days remaining and no paid subscription
    const isTrialSubscription = subscriptionStatus === 'trial' || subscriptionType.includes('trial');
    const hasPaidSubscription = subscriptionStatus === 'active' && !subscriptionType.includes('trial') && subscriptionType !== 'free';
    const isTrialActive = (isTrialSubscription || (!hasPaidSubscription && trialDaysRemaining > 0)) && trialDaysRemaining > 0;

    console.log('Trial Status Check:', {
        now: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        trialDaysRemaining,
        subscriptionStatus,
        subscriptionType,
        isTrialSubscription,
        hasPaidSubscription,
        isTrialActive
    });

    // Determine final subscription status
    let finalSubscriptionStatus = subscriptionStatus;
    if (isTrialActive && subscriptionStatus !== 'trial') {
        finalSubscriptionStatus = 'trial';
    } else if (!isTrialActive && subscriptionStatus === 'trial') {
        finalSubscriptionStatus = subscriptionType === 'free' ? 'active' : 'expired';
    }

    return {
        ...userProfile,
        isTrialActive,
        trialDaysRemaining,
        subscriptionStatus: finalSubscriptionStatus,
        subscriptionType: subscriptionType // Ensure this is always set
    };
};

/**
 * Get user capabilities based on subscription
 * @param {Object} userProfile 
 * @returns {Object} User capabilities
 */
const getUserCapabilities = (userProfile) => {
    console.log('getUserCapabilities called with:', {
        hasProfile: !!userProfile,
        subscriptionStatus: userProfile?.subscriptionStatus,
        subscriptionType: userProfile?.subscriptionType
    });

    if (!userProfile) {
        console.log('No user profile, returning default capabilities');
        return {
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
    }

    const updatedProfile = checkAndUpdateTrialStatus(userProfile);
    if (!updatedProfile) {
        console.log('Failed to update profile, returning default capabilities');
        return getUserCapabilities(null);
    }

    const { isTrialActive, subscriptionType, subscriptionStatus } = updatedProfile;

    // Define capabilities based on subscription type
    const isPaidSubscription = subscriptionType !== 'free' && subscriptionStatus === 'active';
    const hasAccess = isTrialActive || isPaidSubscription;

    console.log('User Capabilities Check:', {
        subscriptionType,
        subscriptionStatus,
        isTrialActive,
        isPaidSubscription,
        hasAccess
    });

    const capabilities = {
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

    console.log('Final capabilities:', capabilities);
    return capabilities;
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
            console.log('User already exists, returning existing profile');
            const existingData = existingUser.data();
            
            // Ensure the existing user has proper trial setup
            if (!existingData.subscriptionStatus || !existingData.subscriptionType) {
                console.log('Updating existing user with missing trial data');
                const accountType = profileData.accountType || getAccountType(existingData.email);
                const trialEndDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                
                const updates = {
                    subscriptionStatus: 'trial',
                    subscriptionType: accountType === 'organization' ? 'organization_trial' : 'individual_trial',
                    subscriptionEndDate: trialEndDate,
                    updatedAt: serverTimestamp()
                };
                
                await setDoc(userRef, updates, { merge: true });
                
                return {
                    ...existingData,
                    ...updates,
                    subscriptionEndDate: trialEndDate.toDate()
                };
            }
            
            return existingData;
        }

        // Create trial end date - 30 days from now
        const trialEndDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const accountType = profileData.accountType || getAccountType(profileData.email);

        const userProfile = {
            uid: userId,
            email: profileData.email.toLowerCase().trim(),
            firstName: profileData.firstName?.trim() || '',
            lastName: profileData.lastName?.trim() || '',
            fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
            avatar: profileData.avatar || null,
            accountType: accountType,
            userType: accountType, // For backward compatibility
            role: ['member'], // Default role
            organizationId: profileData.organizationId || null,
            organizationName: profileData.organizationName || null,
            subscriptionStatus: 'trial', // Explicitly set to trial
            subscriptionType: accountType === 'organization' ? 'organization_trial' : 'individual_trial',
            subscriptionStartDate: serverTimestamp(),
            subscriptionEndDate: trialEndDate, // Using Firestore Timestamp
            emailVerified: profileData.emailVerified || false,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            profileComplete: true,
            preferences: {
                notifications: true,
                theme: 'light',
                language: 'en'
            }
        };

        console.log('Creating user profile with trial:', {
            subscriptionStatus: userProfile.subscriptionStatus,
            subscriptionType: userProfile.subscriptionType,
            subscriptionEndDate: trialEndDate.toDate().toISOString()
        });

        await setDoc(userRef, userProfile);

        // Return the profile with properly formatted dates for immediate use
        return {
            ...userProfile,
            subscriptionEndDate: trialEndDate.toDate() // Convert to Date for consistency
        };

    } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
    }
};

/**
 * Get user profile and ensure trial data is properly set
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
const getUserProfile = async (userId) => {
    try {
        if (!userId) return null;

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        const userData = userSnap.data();
        
        // Check if user profile needs trial data migration
        if (!userData.subscriptionStatus || !userData.subscriptionType) {
            console.log('User profile missing trial data, updating...');
            
            const accountType = userData.accountType || userData.userType || getAccountType(userData.email);
            const trialEndDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            
            const updates = {
                subscriptionStatus: 'trial',
                subscriptionType: accountType === 'organization' ? 'organization_trial' : 'individual_trial',
                subscriptionEndDate: trialEndDate,
                accountType: accountType, // Ensure this is set
                updatedAt: serverTimestamp()
            };
            
            await setDoc(userRef, updates, { merge: true });
            
            return {
                ...userData,
                ...updates,
                subscriptionEndDate: trialEndDate.toDate()
            };
        }

        return userData;

    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

/**
 * Create organization and set user as admin
 * @returns {Promise<string>} Organization ID
 */
const createOrganization = async () => {
    try {
        const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

        // Check if user profile already exists to prevent refresh loops
        const existingProfile = await getUserProfile(user.uid);
        if (existingProfile) {
            console.log('Account already exists, returning existing profile');
            return {
                success: true,
                accountType: existingProfile.accountType,
                organizationId: existingProfile.organizationId,
                userId: user.uid,
                userProfile: existingProfile,
                alreadyExists: true
            };
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
 * Get account setup status
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
const getAccountSetupStatus = async (userId) => {
    try {
        if (!userId) {
            return {
                exists: false,
                setupComplete: false,
                canAccessDashboard: false
            };
        }

        const userProfile = await getUserProfile(userId);
        
        if (!userProfile) {
            return {
                exists: false,
                setupComplete: false,
                canAccessDashboard: false
            };
        }

        return {
            exists: true,
            setupComplete: true,
            canAccessDashboard: userProfile.emailVerified || false,
            accountType: userProfile.accountType,
            hasOrganization: !!userProfile.organizationId,
            emailVerified: userProfile.emailVerified || false,
            subscriptionStatus: userProfile.subscriptionStatus,
            userProfile: userProfile
        };

    } catch (error) {
        console.error('Error getting account setup status:', error);
        return {
            exists: false,
            setupComplete: false,
            canAccessDashboard: false,
            error: error.message
        };
    }
};

/**
 * Update user profile when email is verified
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
const updateEmailVerificationStatus = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            emailVerified: true,
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error updating email verification status:', error);
        throw new Error(`Failed to update email verification: ${error.message}`);
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
    getAccountSetupStatus,
    updateEmailVerificationStatus,
    checkPendingInvitation,
    getAccountType,
    checkAndUpdateTrialStatus,
    getUserCapabilities,
    getUserProfile // Added this method
};

// Also export individual functions for backward compatibility
export {
    setupAccount,
    createUserProfile,
    createOrganization,
    acceptInvitationAndSetupAccount,
    getAccountSetupStatus,
    updateEmailVerificationStatus,
    checkPendingInvitation,
    getAccountType,
    getUserProfile
};