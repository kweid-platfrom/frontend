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

    // Cache to prevent repeated processing
    _processedUsers: new Map(),
    _lastProcessTime: new Map(),
    _updateQueue: new Set(), // Prevent multiple simultaneous updates

    /**
     * Determines if an email is from a public domain
     */
    isPublicDomain(email) {
        if (!email) return true;
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return true;
        return this.publicDomains.includes(domain);
    },

    /**
     * Determines account type based on email domain
     */
    getAccountType(email) {
        return this.isPublicDomain(email) ? 'individual' : 'organization';
    },

    /**
     * Helper function to safely convert Firestore timestamp to Date
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
     */
    createFreemiumSubscription(accountType) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        console.log('Creating freemium subscription:', {
            accountType,
            trialStart: now.toISOString(),
            trialEnd: trialEnd.toISOString(),
            daysFromNow: 30
        });

        return {
            subscriptionType: 'free',
            subscriptionStatus: 'trial',
            subscriptionExpiry: null,
            trialStartDate: now,
            trialEndDate: trialEnd,
            isTrialActive: true,
            trialDaysRemaining: 30,
            hasUsedTrial: true,
            showTrialBanner: true,
            // Mark as processed to prevent loops
            _trialProcessed: true,
            _lastTrialCheck: now,

            features: {
                multipleProjects: true,
                advancedReports: true,
                teamCollaboration: accountType === 'organization',
                apiAccess: true,
                prioritySupport: true,
                customIntegrations: true,
                advancedAutomation: true
            },

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
     */
    getFreeTierSubscription(accountType) {
        const now = new Date();

        return {
            subscriptionType: 'free',
            subscriptionStatus: 'active',
            subscriptionExpiry: null,
            isTrialActive: false,
            trialExpired: true,
            trialDaysRemaining: 0,
            showTrialBanner: false,
            // Mark as processed to prevent loops
            _trialProcessed: true,
            _lastTrialCheck: now,

            features: {
                multipleProjects: false,
                advancedReports: false,
                teamCollaboration: false,
                apiAccess: false,
                prioritySupport: false,
                customIntegrations: false,
                advancedAutomation: false
            },

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

        // Cache the processed user to prevent loops
        this._processedUsers.set(user.uid, { ...userDoc });
        this._lastProcessTime.set(user.uid, Date.now());

        // Handle invites only for organization accounts
        if (accountType === 'organization' && inviteEmails.length > 0) {
            console.log("Sending invites to:", inviteEmails);
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
     * CRITICAL FIX: Check if user's trial has expired and update subscription accordingly
     * Now with improved caching and loop prevention
     */
    checkAndUpdateTrialStatus(userProfile) {
        if (!userProfile) {
            console.log('No user profile provided');
            return userProfile;
        }

        const userId = userProfile.uid || userProfile.id;
        if (!userId) {
            console.warn('No user ID found in profile');
            return userProfile;
        }

        // CRITICAL: Check cache first - prevent processing same user repeatedly
        const now = Date.now();
        const lastProcessTime = this._lastProcessTime.get(userId);
        const cachedUser = this._processedUsers.get(userId);

        // Increased cache time to 5 minutes to prevent frequent recalculations
        if (lastProcessTime && cachedUser && (now - lastProcessTime) < 300000) {
            console.log('Returning cached trial status for user:', userId);
            return cachedUser;
        }

        // If trial was already processed and marked, don't reprocess unless absolutely necessary
        if (userProfile._trialProcessed && userProfile._lastTrialCheck) {
            const lastCheck = this.toDate(userProfile._lastTrialCheck);
            // Increased to 30 minutes for processed trials
            if (lastCheck && (now - lastCheck.getTime()) < 1800000) {
                console.log('Trial already processed recently, skipping check');
                const profileWithTimestamp = {
                    ...userProfile,
                    _lastTrialCheck: new Date(now)
                };
                this._processedUsers.set(userId, profileWithTimestamp);
                this._lastProcessTime.set(userId, now);
                return profileWithTimestamp;
            }
        }

        console.log('Processing trial status for user:', userId, 'accountType:', userProfile.accountType);

        let updatedProfile = { ...userProfile };

        // If user has never had trial fields set, they might be a new user
        if (!userProfile.hasUsedTrial && !userProfile.trialStartDate && !userProfile.isTrialActive) {
            console.log('User has no trial data - setting up trial');
            const accountType = userProfile.accountType || 'individual';
            const trialConfig = this.createFreemiumSubscription(accountType);

            updatedProfile = {
                ...userProfile,
                ...trialConfig
            };

            // Update in Firestore asynchronously with error handling
            this.updateUserSubscriptionStatus(userId, updatedProfile).catch(error => {
                console.error('Failed to update trial in Firestore:', error);
            });

            // Cache the result
            this._processedUsers.set(userId, updatedProfile);
            this._lastProcessTime.set(userId, now);

            return updatedProfile;
        }

        // If trial is already marked as inactive and expired, return as-is
        if (!userProfile.isTrialActive && userProfile.trialExpired) {
            console.log('Trial already expired and processed');
            updatedProfile = {
                ...userProfile,
                _trialProcessed: true,
                _lastTrialCheck: new Date()
            };

            this._processedUsers.set(userId, updatedProfile);
            this._lastProcessTime.set(userId, now);

            return updatedProfile;
        }

        const currentTime = new Date();
        const trialEnd = this.toDate(userProfile.trialEndDate);

        console.log('Checking trial status:', {
            now: currentTime.toISOString(),
            trialEnd: trialEnd ? trialEnd.toISOString() : 'null',
            isTrialActive: userProfile.isTrialActive,
            userId: userId
        });

        if (!trialEnd) {
            console.error('Invalid trial end date for user:', userId);

            // Try to calculate from trial start date
            const trialStart = this.toDate(userProfile.trialStartDate);
            if (trialStart) {
                const calculatedTrialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000));
                const daysRemaining = Math.ceil((calculatedTrialEnd - currentTime) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 0) {
                    // Trial has expired
                    updatedProfile = {
                        ...userProfile,
                        ...this.getFreeTierSubscription(userProfile.accountType || 'individual'),
                        trialExpiredAt: currentTime
                    };
                } else {
                    updatedProfile = {
                        ...userProfile,
                        trialEndDate: calculatedTrialEnd,
                        trialDaysRemaining: Math.max(0, daysRemaining),
                        showTrialBanner: true,
                        isTrialActive: true,
                        subscriptionStatus: 'trial',
                        _trialProcessed: true,
                        _lastTrialCheck: currentTime
                    };
                }
            } else {
                // If we can't determine anything, set up a trial ONLY if user doesn't have basic trial fields
                if (!userProfile.subscriptionType) {
                    console.log('Cannot determine trial status, setting up new trial');
                    const accountType = userProfile.accountType || 'individual';
                    const trialConfig = this.createFreemiumSubscription(accountType);

                    updatedProfile = {
                        ...userProfile,
                        ...trialConfig
                    };
                } else {
                    // Keep existing subscription status but mark as processed
                    updatedProfile = {
                        ...userProfile,
                        _trialProcessed: true,
                        _lastTrialCheck: currentTime
                    };
                }
            }
        } else {
            // Calculate days remaining
            const daysRemaining = Math.ceil((trialEnd - currentTime) / (1000 * 60 * 60 * 24));

            // Check if trial has expired
            if (daysRemaining <= 0) {
                console.log('Trial has expired, updating to free tier');
                updatedProfile = {
                    ...userProfile,
                    ...this.getFreeTierSubscription(userProfile.accountType || 'individual'),
                    trialExpiredAt: currentTime
                };
            } else {
                // Trial is still active
                console.log('Trial is still active:', {
                    daysRemaining,
                    trialEnd: trialEnd.toISOString()
                });

                updatedProfile = {
                    ...userProfile,
                    trialDaysRemaining: Math.max(0, daysRemaining),
                    isTrialActive: true,
                    showTrialBanner: true,
                    subscriptionStatus: 'trial',
                    _trialProcessed: true,
                    _lastTrialCheck: currentTime
                };
            }
        }

        // Cache the result BEFORE any async operations
        this._processedUsers.set(userId, updatedProfile);
        this._lastProcessTime.set(userId, now);

        // Only update Firestore if there were actual changes AND we're not already updating
        const hasChanges = this.hasSubscriptionChanges(userProfile, updatedProfile);
        if (hasChanges && !this._updateQueue.has(userId)) {
            this._updateQueue.add(userId);
            this.updateUserSubscriptionStatus(userId, updatedProfile)
                .catch(error => {
                    console.error('Failed to update subscription status in Firestore:', error);
                })
                .finally(() => {
                    this._updateQueue.delete(userId);
                });
        }

        return updatedProfile;
    },

    /**
     * Helper to check if subscription data has actually changed
     */
    hasSubscriptionChanges(oldProfile, newProfile) {
        const fieldsToCheck = [
            'subscriptionType', 'subscriptionStatus', 'isTrialActive', 
            'trialDaysRemaining', 'showTrialBanner', 'trialExpired'
        ];
        
        return fieldsToCheck.some(field => oldProfile[field] !== newProfile[field]);
    },

    /**
     * Update user subscription status in Firestore with better error handling
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
                limits: subscriptionData.limits,
                _trialProcessed: subscriptionData._trialProcessed || true,
                _lastTrialCheck: subscriptionData._lastTrialCheck || new Date()
            };

            if (subscriptionData.trialExpiredAt) {
                updateData.trialExpiredAt = subscriptionData.trialExpiredAt;
                updateData.trialExpired = true;
            }

            // Add trial dates if they exist
            if (subscriptionData.trialStartDate) {
                updateData.trialStartDate = subscriptionData.trialStartDate;
            }
            if (subscriptionData.trialEndDate) {
                updateData.trialEndDate = subscriptionData.trialEndDate;
            }
            if (subscriptionData.hasUsedTrial !== undefined) {
                updateData.hasUsedTrial = subscriptionData.hasUsedTrial;
            }

            await updateDoc(userRef, updateData);
            console.log('User subscription status updated in Firestore');
        } catch (error) {
            console.error('Error updating user subscription status:', error);
            // Don't throw the error to prevent breaking the UI
        }
    },

    /**
     * Get user's current subscription capabilities
     * CRITICAL FIX: Make this method pure and non-mutating for React
     */
    getUserCapabilities(userProfile) {
        // Create a deep copy to avoid mutations
        const profileCopy = JSON.parse(JSON.stringify(userProfile));
        
        // This is now safe from loops due to improved caching
        const updatedProfile = this.checkAndUpdateTrialStatus(profileCopy);

        // Ensure we have features and limits
        const features = updatedProfile.features || this.getFreeTierSubscription(updatedProfile.accountType || 'individual').features;
        const limits = updatedProfile.limits || this.getFreeTierSubscription(updatedProfile.accountType || 'individual').limits;

        return {
            canCreateMultipleProjects: features.multipleProjects || false,
            canAccessAdvancedReports: features.advancedReports || false,
            canInviteTeamMembers: features.teamCollaboration || false,
            canUseAPI: features.apiAccess || false,
            canUseAutomation: features.advancedAutomation || false,
            limits: limits,
            isTrialActive: updatedProfile.isTrialActive || false,
            trialDaysRemaining: updatedProfile.trialDaysRemaining || 0,
            subscriptionType: updatedProfile.subscriptionType || 'free',
            subscriptionStatus: updatedProfile.subscriptionStatus || 'active',
            showTrialBanner: updatedProfile.showTrialBanner || false,
            profile: updatedProfile
        };
    },

    /**
     * Clear cache for a specific user (useful for forced refresh)
     */
    clearUserCache(userId) {
        this._processedUsers.delete(userId);
        this._lastProcessTime.delete(userId);
        this._updateQueue.delete(userId);
    },

    /**
     * Clear all caches (useful for logout)
     */
    clearAllCaches() {
        this._processedUsers.clear();
        this._lastProcessTime.clear();
        this._updateQueue.clear();
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