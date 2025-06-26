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
            plan_type: 'freemium',
            status: 'trial',
            trial_start_date: now,
            trial_end_date: trialEnd,
            is_trial_active: true,
            trial_days_remaining: 30,
            has_used_trial: true,
            show_trial_banner: true,
            // Mark as processed to prevent loops
            _trial_processed: true,
            _last_trial_check: now,

            features: {
                multiple_suites: true,
                advanced_reports: true,
                team_collaboration: accountType === 'organization',
                api_access: true,
                priority_support: true,
                custom_integrations: true,
                advanced_automation: true
            },

            limits: {
                suites: accountType === 'organization' ? 10 : 5,
                test_scripts: 1000,
                automated_tests: 500,
                recordings: 100,
                report_exports: 50,
                team_members: accountType === 'organization' ? 10 : 1
            }
        };
    },

    /**
     * Gets subscription configuration after trial expires
     */
    getFreeTierSubscription(accountType) {
        const now = new Date();

        return {
            plan_type: 'free',
            status: 'active',
            expiry_date: null,
            is_trial_active: false,
            trial_expired: true,
            trial_days_remaining: 0,
            show_trial_banner: false,
            // Mark as processed to prevent loops
            _trial_processed: true,
            _last_trial_check: now,

            features: {
                multiple_suites: false,
                advanced_reports: false,
                team_collaboration: false,
                api_access: false,
                priority_support: false,
                custom_integrations: false,
                advanced_automation: false
            },

            limits: {
                suites: 1,
                test_scripts: accountType === 'organization' ? 15 : 10,
                automated_tests: accountType === 'organization' ? 8 : 5,
                recordings: accountType === 'organization' ? 5 : 3,
                report_exports: accountType === 'organization' ? 3 : 2,
                team_members: 1
            }
        };
    },

    /**
     * Setup account with new architecture-compliant structure
     */
    async setupAccount({ name, email, company, industry, companySize, password, isGoogleAuth, inviteEmails = [] }) {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User authentication failed. Please log in again.");
        }

        const accountType = this.getAccountType(email);
        const userId = user.uid;
        const now = new Date();

        // Create freemium subscription with 30-day trial
        const subscriptionConfig = this.createFreemiumSubscription(accountType);

        // Create user document with new architecture structure
        const userDoc = {
            user_id: userId,
            primary_email: user.email,
            profile_info: {
                name: name,
                avatar: user.photoURL || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                preferences: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                }
            },
            account_memberships: [],
            session_context: {
                current_account_type: accountType,
                current_org_id: accountType === 'organization' ? userId : null
            },
            created_at: now,
            updated_at: now
        };

        // Handle Individual Account
        if (accountType === 'individual') {
            userDoc.account_memberships.push({
                account_type: 'individual',
                subscription_plan: subscriptionConfig,
                billing_info: {
                    payment_method: null,
                    billing_address: null,
                    next_billing_date: null
                },
                owned_test_suites: [],
                created_at: now
            });
        }

        // Handle Organization Account
        if (accountType === 'organization' && company && industry && companySize) {
            const orgId = userId; // Using user ID as org ID for simplicity

            // Create organization document
            await setDoc(doc(db, "organizations", orgId), {
                org_id: orgId,
                organization_profile: {
                    name: company,
                    custom_domain: null, // Can be set later
                    logo: null,
                    industry: industry,
                    size: companySize,
                    settings: {
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        default_permissions: {
                            can_create_test_suites: true,
                            can_invite_members: false,
                            can_export_data: true
                        }
                    }
                },
                subscription: subscriptionConfig,
                created_at: now,
                updated_at: now
            });

            // Create organization membership for the admin
            await setDoc(doc(db, "organizations", orgId, "members", userId), {
                user_id: userId,
                org_email: user.email,
                role: 'Admin',
                join_date: now,
                status: 'active',
                permissions: [
                    'manage_organization',
                    'invite_members',
                    'create_test_suites',
                    'delete_test_suites',
                    'manage_billing'
                ],
                test_suite_access: []
            });

            // Add organization membership to user
            userDoc.account_memberships.push({
                org_id: orgId,
                org_email: user.email,
                role: 'Admin',
                join_date: now,
                status: 'active',
                accessible_test_suites: []
            });

            // Create user membership document for cross-referencing
            await setDoc(doc(db, "userMemberships", userId, "organizations", orgId), {
                org_id: orgId,
                role: 'Admin',
                join_date: now,
                status: 'active',
                permissions: [
                    'manage_organization',
                    'invite_members',
                    'create_test_suites',
                    'delete_test_suites',
                    'manage_billing'
                ]
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

        // Create the user document
        await setDoc(doc(db, "users", userId), userDoc);

        // Cache the processed user to prevent loops
        this._processedUsers.set(userId, userDoc);
        this._lastProcessTime.set(userId, Date.now());

        // Handle invites for organization accounts
        if (accountType === 'organization' && inviteEmails.length > 0) {
            await this.sendOrganizationInvites(userId, inviteEmails, company);
        }

        // Cleanup localStorage
        this.cleanupLocalStorage();

        return {
            success: true,
            accountType,
            subscriptionStatus: 'trial',
            trialDaysRemaining: 30,
            features: subscriptionConfig.features,
            userId: userId,
            orgId: accountType === 'organization' ? userId : null
        };
    },

    /**
     * Send organization invites
     */
    async sendOrganizationInvites(orgId, inviteEmails, companyName) {
        const user = auth.currentUser;
        if (!user) return;

        const invitePromises = inviteEmails.map(async (email) => {
            const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await setDoc(doc(db, "invitations", inviteId), {
                invite_id: inviteId,
                organization_id: orgId,
                invited_email: email.trim(),
                invited_by: user.uid,
                invite_type: 'organization',
                status: 'pending',
                role: 'Member',
                created_date: new Date(),
                expires_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
                organization_name: companyName,
                inviter_name: user.displayName || user.email
            });
        });

        await Promise.all(invitePromises);
        console.log(`Sent ${inviteEmails.length} organization invites`);
    },

    /**
     * CRITICAL FIX: Check if user's trial has expired and update subscription accordingly
     * Updated to work with new architecture
     */
    checkAndUpdateTrialStatus(userProfile) {
        if (!userProfile || !userProfile.account_memberships) {
            console.log('No user profile or account memberships provided');
            return userProfile;
        }

        const userId = userProfile.user_id || userProfile.id;
        if (!userId) {
            console.warn('No user ID found in profile');
            return userProfile;
        }

        // Check cache first
        const now = Date.now();
        const lastProcessTime = this._lastProcessTime.get(userId);
        const cachedUser = this._processedUsers.get(userId);

        if (lastProcessTime && cachedUser && (now - lastProcessTime) < 300000) {
            console.log('Returning cached trial status for user:', userId);
            return cachedUser;
        }

        let updatedProfile = { ...userProfile };
        let hasChanges = false;

        // Process each account membership
        updatedProfile.account_memberships = userProfile.account_memberships.map(membership => {
            // Skip if not individual account or no subscription plan
            if (membership.account_type !== 'individual' || !membership.subscription_plan) {
                return membership;
            }

            const subscription = membership.subscription_plan;
            
            // If trial was already processed recently, skip
            if (subscription._trial_processed && subscription._last_trial_check) {
                const lastCheck = this.toDate(subscription._last_trial_check);
                if (lastCheck && (now - lastCheck.getTime()) < 1800000) { // 30 minutes
                    return membership;
                }
            }

            // Check if trial needs to be set up
            if (!subscription.has_used_trial && !subscription.trial_start_date && !subscription.is_trial_active) {
                console.log('Setting up trial for individual account');
                const trialConfig = this.createFreemiumSubscription('individual');
                hasChanges = true;
                
                return {
                    ...membership,
                    subscription_plan: trialConfig
                };
            }

            // Check if trial has expired
            const trialEnd = this.toDate(subscription.trial_end_date);
            if (trialEnd) {
                const currentTime = new Date();
                const daysRemaining = Math.ceil((trialEnd - currentTime) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 0 && subscription.is_trial_active) {
                    console.log('Trial has expired, updating to free tier');
                    hasChanges = true;
                    
                    return {
                        ...membership,
                        subscription_plan: {
                            ...this.getFreeTierSubscription('individual'),
                            trial_expired_at: currentTime
                        }
                    };
                } else if (daysRemaining > 0) {
                    // Update days remaining
                    const updatedSubscription = {
                        ...subscription,
                        trial_days_remaining: Math.max(0, daysRemaining),
                        is_trial_active: true,
                        show_trial_banner: true,
                        _trial_processed: true,
                        _last_trial_check: currentTime
                    };

                    if (subscription.trial_days_remaining !== daysRemaining) {
                        hasChanges = true;
                    }

                    return {
                        ...membership,
                        subscription_plan: updatedSubscription
                    };
                }
            }

            return membership;
        });

        // Cache the result
        this._processedUsers.set(userId, updatedProfile);
        this._lastProcessTime.set(userId, now);

        // Update Firestore if there were changes
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
     * Update user subscription status in Firestore with new architecture
     */
    async updateUserSubscriptionStatus(userId, userData) {
        try {
            const userRef = doc(db, "users", userId);
            const updateData = {
                account_memberships: userData.account_memberships,
                updated_at: new Date()
            };

            await updateDoc(userRef, updateData);
            console.log('User subscription status updated in Firestore');
        } catch (error) {
            console.error('Error updating user subscription status:', error);
        }
    },

    /**
     * Get user's current subscription capabilities with new architecture
     */
    getUserCapabilities(userProfile) {
        if (!userProfile || !userProfile.account_memberships) {
            return this.getDefaultCapabilities();
        }

        // Create a deep copy to avoid mutations
        const profileCopy = JSON.parse(JSON.stringify(userProfile));
        const updatedProfile = this.checkAndUpdateTrialStatus(profileCopy);

        // Find the most permissive subscription
        let bestSubscription = null;
        let isTrialActive = false;
        let trialDaysRemaining = 0;

        for (const membership of updatedProfile.account_memberships) {
            if (membership.subscription_plan) {
                const subscription = membership.subscription_plan;
                
                if (subscription.is_trial_active) {
                    isTrialActive = true;
                    trialDaysRemaining = Math.max(trialDaysRemaining, subscription.trial_days_remaining || 0);
                }

                if (!bestSubscription || this.compareSubscriptions(subscription, bestSubscription) > 0) {
                    bestSubscription = subscription;
                }
            }
        }

        if (!bestSubscription) {
            return this.getDefaultCapabilities();
        }

        return {
            canCreateMultipleSuites: bestSubscription.features?.multiple_suites || false,
            canAccessAdvancedReports: bestSubscription.features?.advanced_reports || false,
            canInviteTeamMembers: bestSubscription.features?.team_collaboration || false,
            canUseAPI: bestSubscription.features?.api_access || false,
            canUseAutomation: bestSubscription.features?.advanced_automation || false,
            limits: bestSubscription.limits || {},
            isTrialActive: isTrialActive,
            trialDaysRemaining: trialDaysRemaining,
            subscriptionType: bestSubscription.plan_type || 'free',
            subscriptionStatus: bestSubscription.status || 'active',
            showTrialBanner: bestSubscription.show_trial_banner || false,
            profile: updatedProfile
        };
    },

    /**
     * Compare subscriptions to find the most permissive one
     */
    compareSubscriptions(sub1, sub2) {
        const planPriority = { 'enterprise': 4, 'premium': 3, 'freemium': 2, 'free': 1 };
        const priority1 = planPriority[sub1.plan_type] || 0;
        const priority2 = planPriority[sub2.plan_type] || 0;
        
        return priority1 - priority2;
    },

    /**
     * Get default capabilities for users without subscription
     */
    getDefaultCapabilities() {
        return {
            canCreateMultipleSuites: false,
            canAccessAdvancedReports: false,
            canInviteTeamMembers: false,
            canUseAPI: false,
            canUseAutomation: false,
            limits: {
                suites: 1,
                test_scripts: 5,
                automated_tests: 3,
                recordings: 2,
                report_exports: 1,
                team_members: 1
            },
            isTrialActive: false,
            trialDaysRemaining: 0,
            subscriptionType: 'free',
            subscriptionStatus: 'active',
            showTrialBanner: false,
            profile: null
        };
    },

    /**
     * Clear cache for a specific user
     */
    clearUserCache(userId) {
        this._processedUsers.delete(userId);
        this._lastProcessTime.delete(userId);
        this._updateQueue.delete(userId);
    },

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this._processedUsers.clear();
        this._lastProcessTime.clear();
        this._updateQueue.clear();
    },

    /**
     * Clean up localStorage
     */
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
