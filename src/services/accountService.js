// services/accountService.js
import { getAuth } from "firebase/auth";
import { getFirestore, setDoc, doc, updateDoc } from "firebase/firestore";
import { app } from "../config/firebase";

const auth = getAuth(app);
const db = getFirestore(app);

export const accountService = {
    // Common public email domains
    publicDomains: [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
        'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com',
        'googlemail.com', 'ymail.com', 'rocketmail.com', 'att.net',
        'verizon.net', 'sbcglobal.net', 'comcast.net', 'cox.net',
        'charter.net', 'earthlink.net', 'juno.com', 'netzero.net',
        'protonmail.com', 'tutanota.com', 'zoho.com', 'fastmail.com'
    ],

    /**
     * Determines if an email is from a public domain
     * @param {string} email - The email address to check
     * @returns {boolean} - True if it's a public domain, false if custom domain
     */
    isPublicDomain(email) {
        if (!email) return true; // Default to public if no email
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return true;
        
        return this.publicDomains.includes(domain);
    },

    /**
     * Determines account type based on email domain
     * @param {string} email - The email address to check
     * @returns {string} - 'individual' or 'organization'
     */
    getAccountType(email) {
        return this.isPublicDomain(email) ? 'individual' : 'organization';
    },

    /**
     * Helper function to safely convert Firestore timestamp to Date
     * @param {any} timestamp - Firestore timestamp or Date object
     * @returns {Date} - JavaScript Date object
     */
    toDate(timestamp) {
        if (!timestamp) return null;
        
        // If it's already a Date object
        if (timestamp instanceof Date) {
            return timestamp;
        }
        
        // If it's a Firestore timestamp with toDate method
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        
        // If it's a timestamp object with seconds and nanoseconds (Firestore format)
        if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined) {
            return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
        }
        
        // If it's a string or number, try to parse it
        if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? null : date;
        }
        
        console.warn('Unable to convert timestamp to Date:', timestamp);
        return null;
    },

    /**
     * Creates subscription details for new users with 30-day freemium trial
     * @param {'individual' | 'organization'} accountType - Account type
     * @returns {object} - Subscription configuration
     */
    createFreemiumSubscription(accountType) {
        const now = new Date();
        // Add 30 days to current date
        const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        console.log('Creating freemium subscription:', {
            accountType,
            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            daysFromNow: 30
        });
        
        return {
            subscriptionType: 'free', // Base subscription is free
            subscriptionStatus: 'trial', // Currently in trial
            subscriptionExpiry: null, // Free tier doesn't expire
            trialStartDate: now,
            trialEndDate: trialEnd,
            isTrialActive: true,
            trialDaysRemaining: 30,
            hasUsedTrial: true, // Mark that user has used their trial
            showTrialBanner: true,
            // Premium features enabled during trial
            features: {
                multipleProjects: true,
                advancedReports: true,
                teamCollaboration: accountType === 'organization',
                apiAccess: true,
                prioritySupport: true,
                customIntegrations: true,
                advancedAutomation: true
            },
            // Limits during trial (generous limits)
            limits: {
                projects: accountType === 'organization' ? 10 : 5,
                testScripts: 1000,
                automatedTests: 500,
                recordings: 100,
                reportExports: 50,
                teamMembers: accountType === 'organization' ? 10 : 1
            }
        };
    },

    /**
     * Gets subscription configuration after trial expires
     * @param {'individual' | 'organization'} accountType - Account type
     * @returns {object} - Free tier configuration
     */
    getFreeTierSubscription(accountType) {
        return {
            subscriptionType: 'free',
            subscriptionStatus: 'active',
            subscriptionExpiry: null,
            isTrialActive: false,
            trialExpired: true,
            trialDaysRemaining: 0,
            showTrialBanner: false,
            // Limited features for free tier
            features: {
                multipleProjects: false,
                advancedReports: false,
                teamCollaboration: false,
                apiAccess: false,
                prioritySupport: false,
                customIntegrations: false,
                advancedAutomation: false
            },
            // Strict limits for free tier
            limits: {
                projects: 1,
                testScripts: accountType === 'organization' ? 15 : 10,
                automatedTests: accountType === 'organization' ? 8 : 5,
                recordings: accountType === 'organization' ? 5 : 3,
                reportExports: accountType === 'organization' ? 3 : 2,
                teamMembers: 1
            }
        };
    },

    async setupAccount({ name, email, company, industry, companySize, password, isGoogleAuth, inviteEmails = [] }) {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User authentication failed. Please log in again.");
        }

        const accountType = this.getAccountType(email);
        const orgId = user.uid;

        // Create freemium subscription with 30-day trial
        const subscriptionConfig = this.createFreemiumSubscription(accountType);

        // Create organization only for organization accounts
        if (accountType === 'organization' && company && industry && companySize) {
            await setDoc(doc(db, "organizations", orgId), {
                name: company,
                industry: industry,
                size: companySize,
                createdAt: new Date(),
                createdBy: user.uid,
                admin: [user.uid],
                members: [user.uid],
                // Add subscription info to organization
                ...subscriptionConfig
            });
        }

        // Set password for non-Google auth users
        if (!isGoogleAuth && password) {
            try {
                const { setUserPassword } = await import('./authService');
                await setUserPassword(password);
                console.log('Password set successfully');
            } catch (error) {
                console.log("Password setting failed, continuing without password:", error.message);
            }
        }

        // Create user document with freemium trial
        const userDoc = {
            name,
            email: user.email,
            accountType: accountType,
            role: accountType === 'organization' ? "admin" : "user",
            createdAt: new Date(),
            // Add subscription configuration
            ...subscriptionConfig,
            // Track onboarding
            onboardingCompleted: true,
            accountCreatedAt: new Date()
        };

        // Add organization info only for organization accounts
        if (accountType === 'organization' && company) {
            userDoc.company = company;
            userDoc.organisationId = orgId;
        }

        await setDoc(doc(db, "users", user.uid), userDoc);

        // Handle invites only for organization accounts
        if (accountType === 'organization' && inviteEmails.length > 0) {
            console.log("Sending invites to:", inviteEmails);
            // The TeamInvite component handles the actual email sending
        }

        // Cleanup localStorage
        this.cleanupLocalStorage();

        return { 
            success: true, 
            accountType,
            subscriptionStatus: 'trial',
            trialDaysRemaining: 30,
            features: subscriptionConfig.features
        };
    },

    /**
     * Check if user's trial has expired and update subscription accordingly
     * @param {object} userProfile - Current user profile
     * @param {boolean} updateFirestore - Whether to update Firestore with new status
     * @returns {object} - Updated subscription status
     */
    async checkAndUpdateTrialStatus(userProfile, updateFirestore = false) {
        if (!userProfile) {
            console.log('No user profile provided');
            return userProfile;
        }

        // If user never had a trial, return as-is
        if (!userProfile.hasUsedTrial && !userProfile.isTrialActive) {
            console.log('User never had a trial');
            return userProfile;
        }

        // If trial is already marked as inactive and expired, return as-is
        if (!userProfile.isTrialActive && userProfile.trialExpired) {
            console.log('Trial already expired and processed');
            return userProfile;
        }

        const now = new Date();
        const trialEnd = this.toDate(userProfile.trialEndDate);
        
        console.log('Checking trial status:', {
            now: now.toISOString(),
            trialEnd: trialEnd ? trialEnd.toISOString() : 'null',
            isTrialActive: userProfile.isTrialActive,
            userId: userProfile.uid || 'unknown'
        });
        
        if (!trialEnd) {
            console.error('Invalid trial end date for user:', userProfile.uid);
            // If we can't parse the trial end date, check trial start date
            const trialStart = this.toDate(userProfile.trialStartDate);
            if (trialStart) {
                const calculatedTrialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000));
                const daysRemaining = Math.ceil((calculatedTrialEnd - now) / (1000 * 60 * 60 * 24));
                
                if (daysRemaining <= 0) {
                    // Trial has expired
                    const updatedProfile = {
                        ...userProfile,
                        ...this.getFreeTierSubscription(userProfile.accountType),
                        trialExpiredAt: now
                    };

                    if (updateFirestore && userProfile.uid) {
                        await this.updateUserSubscriptionStatus(userProfile.uid, updatedProfile);
                    }

                    return updatedProfile;
                }
                
                return {
                    ...userProfile,
                    trialEndDate: calculatedTrialEnd,
                    trialDaysRemaining: Math.max(0, daysRemaining),
                    showTrialBanner: true
                };
            }
            
            // If we can't determine anything, assume trial expired
            const updatedProfile = {
                ...userProfile,
                ...this.getFreeTierSubscription(userProfile.accountType),
                trialExpiredAt: now
            };

            if (updateFirestore && userProfile.uid) {
                await this.updateUserSubscriptionStatus(userProfile.uid, updatedProfile);
            }

            return updatedProfile;
        }

        // Calculate days remaining
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        
        // Check if trial has expired
        if (daysRemaining <= 0) {
            console.log('Trial has expired, updating to free tier');
            // Trial has expired - return free tier configuration
            const updatedProfile = {
                ...userProfile,
                ...this.getFreeTierSubscription(userProfile.accountType),
                trialExpiredAt: now
            };

            if (updateFirestore && userProfile.uid) {
                await this.updateUserSubscriptionStatus(userProfile.uid, updatedProfile);
            }

            return updatedProfile;
        }

        // Trial is still active
        console.log('Trial is still active:', {
            daysRemaining,
            trialEnd: trialEnd.toISOString()
        });
        
        return {
            ...userProfile,
            trialDaysRemaining: Math.max(0, daysRemaining),
            isTrialActive: true,
            showTrialBanner: true,
            subscriptionStatus: 'trial'
        };
    },

    /**
     * Update user subscription status in Firestore
     * @param {string} userId - User ID
     * @param {object} subscriptionData - Updated subscription data
     */
    async updateUserSubscriptionStatus(userId, subscriptionData) {
        try {
            const userRef = doc(db, "users", userId);
            const updateData = {
                subscriptionType: subscriptionData.subscriptionType,
                subscriptionStatus: subscriptionData.subscriptionStatus,
                isTrialActive: subscriptionData.isTrialActive,
                trialDaysRemaining: subscriptionData.trialDaysRemaining,
                showTrialBanner: subscriptionData.showTrialBanner,
                features: subscriptionData.features,
                limits: subscriptionData.limits
            };

            if (subscriptionData.trialExpiredAt) {
                updateData.trialExpiredAt = subscriptionData.trialExpiredAt;
                updateData.trialExpired = true;
            }

            await updateDoc(userRef, updateData);
            console.log('User subscription status updated in Firestore');
        } catch (error) {
            console.error('Error updating user subscription status:', error);
        }
    },

    /**
     * Get user's current subscription capabilities
     * @param {object} userProfile - Current user profile
     * @returns {object} - Current capabilities and limits
     */
    async getUserCapabilities(userProfile) {
        const updatedProfile = await this.checkAndUpdateTrialStatus(userProfile, true);
        
        return {
            canCreateMultipleProjects: updatedProfile.features?.multipleProjects || false,
            canAccessAdvancedReports: updatedProfile.features?.advancedReports || false,
            canInviteTeamMembers: updatedProfile.features?.teamCollaboration || false,
            canUseAPI: updatedProfile.features?.apiAccess || false,
            canUseAutomation: updatedProfile.features?.advancedAutomation || false,
            limits: updatedProfile.limits || this.getFreeTierSubscription(updatedProfile.accountType).limits,
            isTrialActive: updatedProfile.isTrialActive || false,
            trialDaysRemaining: updatedProfile.trialDaysRemaining || 0,
            subscriptionType: updatedProfile.subscriptionType || 'free',
            subscriptionStatus: updatedProfile.subscriptionStatus || 'active',
            showTrialBanner: updatedProfile.showTrialBanner || false,
            profile: updatedProfile
        };
    },

    cleanupLocalStorage() {
        const keysToRemove = [
            "needsAccountSetup",
            "googleUserName",
            "googleUserEmail",
            "googleUserPhoto",
            "userFullName",
            "registeredUserName"
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
};