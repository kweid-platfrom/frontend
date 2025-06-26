// services/accountService.js
import { getAuth } from "firebase/auth";
import { getFirestore, setDoc, doc, updateDoc, getDoc } from "firebase/firestore";
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
     * FIXED: Gives full access during trial period without restrictions
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

            // FIXED: All features enabled during trial
            features: {
                multiple_suites: true,
                advanced_reports: true,
                team_collaboration: true, // Always true during trial
                api_access: true,
                priority_support: true,
                custom_integrations: true,
                advanced_automation: true
            },

            // FIXED: Generous limits during trial period
            limits: {
                suites: accountType === 'organization' ? 15 : 5, // Full trial limits
                test_scripts: 1000,
                automated_tests: 500,
                recordings: 100,
                report_exports: 50,
                team_members: accountType === 'organization' ? 25 : 5 // Generous team limits
            }
        };
    },

    /**
     * Gets subscription configuration after trial expires
     * FIXED: Proper post-trial limits based on account type
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

            // FIXED: Limited features after trial expires
            features: {
                multiple_suites: false,
                advanced_reports: false,
                team_collaboration: false,
                api_access: false,
                priority_support: false,
                custom_integrations: false,
                advanced_automation: false
            },

            // FIXED: Proper post-trial limits
            limits: {
                suites: accountType === 'organization' ? 5 : 1, // Org gets 5, individual gets 1
                test_scripts: accountType === 'organization' ? 50 : 25, // More reasonable limits
                automated_tests: accountType === 'organization' ? 25 : 10,
                recordings: accountType === 'organization' ? 10 : 5,
                report_exports: accountType === 'organization' ? 5 : 2,
                team_members: 1 // Both limited to 1 after trial
            }
        };
    },

    /**
     * Setup account with new architecture-compliant structure
     * FIXED: No restrictions during registration - full trial access
     */
    async setupAccount({ name, email, company, industry, companySize, password, isGoogleAuth, inviteEmails = [] }) {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User authentication failed. Please log in again.");
        }

        const accountType = this.getAccountType(email);
        const userId = user.uid;
        const now = new Date();

        // FIXED: Create freemium subscription with full trial access (no restrictions)
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
                            can_invite_members: true, // FIXED: Enable during trial
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
            limits: subscriptionConfig.limits, // FIXED: Return actual trial limits
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
     * FIXED: Check if user's trial has expired and update subscription accordingly
     * Properly handles trial expiration and applies correct limits
     */
    checkAndUpdateTrialStatus(userProfile) {
        try {
            if (!userProfile || !userProfile.account_memberships) {
                console.log('No user profile or account memberships provided');
                return this.createDefaultProfile();
            }

            const userId = userProfile.user_id || userProfile.id;
            if (!userId) {
                console.warn('No user ID found in profile');
                return this.createDefaultProfile();
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

            // Ensure account_memberships is an array
            if (!Array.isArray(updatedProfile.account_memberships)) {
                updatedProfile.account_memberships = [];
            }

            // Process each account membership
            updatedProfile.account_memberships = userProfile.account_memberships.map(membership => {
                if (!membership || typeof membership !== 'object') {
                    return membership;
                }

                // Handle individual accounts with subscription plans
                if (membership.account_type === 'individual' && membership.subscription_plan) {
                    const subscription = membership.subscription_plan;
                    
                    // If trial was already processed recently, skip
                    if (subscription._trial_processed && subscription._last_trial_check) {
                        const lastCheck = this.toDate(subscription._last_trial_check);
                        if (lastCheck && (now - lastCheck.getTime()) < 1800000) { // 30 minutes
                            return membership;
                        }
                    }

                    // Check if trial needs to be set up (new user without trial setup)
                    if (!subscription.has_used_trial && !subscription.trial_start_date && !subscription.is_trial_active) {
                        console.log('Setting up trial for individual account');
                        const trialConfig = this.createFreemiumSubscription('individual');
                        hasChanges = true;
                        
                        return {
                            ...membership,
                            subscription_plan: trialConfig
                        };
                    }

                    // FIXED: Check if trial has expired and apply proper restrictions
                    const trialEnd = this.toDate(subscription.trial_end_date);
                    if (trialEnd) {
                        const currentTime = new Date();
                        const daysRemaining = Math.ceil((trialEnd - currentTime) / (1000 * 60 * 60 * 24));

                        if (daysRemaining <= 0 && subscription.is_trial_active) {
                            console.log('Trial has expired, updating to free tier with restrictions');
                            hasChanges = true;
                            
                            return {
                                ...membership,
                                subscription_plan: {
                                    ...this.getFreeTierSubscription('individual'),
                                    trial_expired_at: currentTime,
                                    // Keep trial history
                                    trial_start_date: subscription.trial_start_date,
                                    trial_end_date: subscription.trial_end_date,
                                    has_used_trial: true
                                }
                            };
                        } else if (daysRemaining > 0) {
                            // FIXED: During trial, maintain full access
                            const updatedSubscription = {
                                ...subscription,
                                trial_days_remaining: Math.max(0, daysRemaining),
                                is_trial_active: true,
                                show_trial_banner: true,
                                _trial_processed: true,
                                _last_trial_check: currentTime,
                                // Ensure trial features and limits are maintained
                                features: {
                                    multiple_suites: true,
                                    advanced_reports: true,
                                    team_collaboration: true,
                                    api_access: true,
                                    priority_support: true,
                                    custom_integrations: true,
                                    advanced_automation: true
                                },
                                limits: {
                                    suites: 5, // Full individual trial limit
                                    test_scripts: 1000,
                                    automated_tests: 500,
                                    recordings: 100,
                                    report_exports: 50,
                                    team_members: 5
                                }
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
                }

                // FIXED: Handle organization accounts similarly
                if (membership.org_id && membership.subscription_plan) {
                    const subscription = membership.subscription_plan;
                    
                    const trialEnd = this.toDate(subscription.trial_end_date);
                    if (trialEnd) {
                        const currentTime = new Date();
                        const daysRemaining = Math.ceil((trialEnd - currentTime) / (1000 * 60 * 60 * 24));

                        if (daysRemaining <= 0 && subscription.is_trial_active) {
                            console.log('Organization trial has expired, updating to free tier');
                            hasChanges = true;
                            
                            return {
                                ...membership,
                                subscription_plan: {
                                    ...this.getFreeTierSubscription('organization'),
                                    trial_expired_at: currentTime
                                }
                            };
                        } else if (daysRemaining > 0) {
                            // Maintain org trial benefits
                            const updatedSubscription = {
                                ...subscription,
                                trial_days_remaining: Math.max(0, daysRemaining),
                                is_trial_active: true,
                                limits: {
                                    suites: 15, // Full org trial limit
                                    test_scripts: 1000,
                                    automated_tests: 500,
                                    recordings: 100,
                                    report_exports: 50,
                                    team_members: 25
                                }
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
        } catch (error) {
            console.error('Error in checkAndUpdateTrialStatus:', error);
            return this.createDefaultProfile();
        }
    },

    /**
     * FIXED: Create a default profile with proper trial setup for new users
     */
    createDefaultProfile() {
        const user = auth.currentUser;
        if (!user) return null;

        const accountType = this.getAccountType(user.email);

        return {
            user_id: user.uid,
            primary_email: user.email,
            profile_info: {
                name: user.displayName || 'User',
                avatar: user.photoURL || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                preferences: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                }
            },
            account_memberships: [{
                account_type: 'individual',
                subscription_plan: this.createFreemiumSubscription(accountType), // FIXED: Start with trial
                billing_info: {
                    payment_method: null,
                    billing_address: null,
                    next_billing_date: null
                },
                owned_test_suites: [],
                created_at: new Date()
            }],
            session_context: {
                current_account_type: accountType,
                current_org_id: null
            },
            created_at: new Date(),
            updated_at: new Date()
        };
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
     * FIXED: Get user's current subscription capabilities with proper validation
     * Returns unrestricted access during trial, restricted access after expiration
     */
    getUserCapabilities(userProfile) {
        try {
            if (!userProfile) {
                console.warn('AccountService: No user profile provided, using defaults');
                return this.getDefaultCapabilities();
            }

            // Validate and process the profile
            const processedProfile = this.checkAndUpdateTrialStatus(userProfile);
            
            if (!processedProfile || !processedProfile.account_memberships || !Array.isArray(processedProfile.account_memberships)) {
                console.warn('AccountService: Invalid profile structure, using defaults');
                return this.getDefaultCapabilities();
            }

            // Find the most permissive subscription
            let bestSubscription = null;
            let isTrialActive = false;
            let trialDaysRemaining = 0;
            let accountType = 'individual';

            for (const membership of processedProfile.account_memberships) {
                if (!membership || typeof membership !== 'object') continue;

                // Determine account type
                if (membership.org_id) {
                    accountType = 'organization';
                } else if (membership.account_type) {
                    accountType = membership.account_type;
                }

                // Check subscription plan
                if (membership.subscription_plan && typeof membership.subscription_plan === 'object') {
                    const subscription = membership.subscription_plan;
                    
                    // Validate subscription structure
                    if (!this.validateSubscriptionStructure(subscription)) {
                        console.warn('AccountService: Invalid subscription structure detected');
                        continue;
                    }
                    
                    if (subscription.is_trial_active) {
                        isTrialActive = true;
                        trialDaysRemaining = Math.max(trialDaysRemaining, subscription.trial_days_remaining || 0);
                    }

                    if (!bestSubscription || this.compareSubscriptions(subscription, bestSubscription) > 0) {
                        bestSubscription = subscription;
                    }
                }
            }

            // If no valid subscription found, create a default trial one for new users
            if (!bestSubscription) {
                console.warn('AccountService: No valid subscription found, creating default trial');
                bestSubscription = this.createFreemiumSubscription(accountType);
                isTrialActive = true;
                trialDaysRemaining = 30;
            }

            const capabilities = {
                canCreateMultipleSuites: bestSubscription.features?.multiple_suites || false,
                canAccessAdvancedReports: bestSubscription.features?.advanced_reports || false,
                canInviteTeamMembers: bestSubscription.features?.team_collaboration || false,
                canUseAPI: bestSubscription.features?.api_access || false,
                canUseAutomation: bestSubscription.features?.advanced_automation || false,
                limits: this.validateLimits(bestSubscription.limits) || this.getDefaultLimits(accountType),
                isTrialActive: isTrialActive,
                trialDaysRemaining: trialDaysRemaining,
                subscriptionType: bestSubscription.plan_type || 'free',
                subscriptionStatus: bestSubscription.status || 'active',
                showTrialBanner: bestSubscription.show_trial_banner || false,
                profile: processedProfile,
                accountType: accountType
            };

            console.log('AccountService capabilities configured:', {
                subscriptionType: capabilities.subscriptionType,
                isTrialActive: capabilities.isTrialActive,
                trialDaysRemaining: capabilities.trialDaysRemaining,
                limits: capabilities.limits,
                accountType: capabilities.accountType
            });

            return capabilities;
        } catch (error) {
            console.error('AccountService: Error in getUserCapabilities:', error);
            return this.getDefaultCapabilities();
        }
    },

    /**
     * Validate subscription structure to prevent errors
     */
    validateSubscriptionStructure(subscription) {
        if (!subscription || typeof subscription !== 'object') return false;
        
        // Check required fields
        const requiredFields = ['plan_type', 'status'];
        for (const field of requiredFields) {
            if (!subscription.hasOwnProperty(field)) {
                console.warn(`AccountService: Missing required field ${field} in subscription`);
                return false;
            }
        }
        
        // Validate features object
        if (subscription.features && typeof subscription.features !== 'object') {
            console.warn('AccountService: Invalid features object in subscription');
            return false;
        }
        
        // Validate limits object
        if (subscription.limits && typeof subscription.limits !== 'object') {
            console.warn('AccountService: Invalid limits object in subscription');
            return false;
        }
        
        return true;
    },

    /**
     * Validate and sanitize limits object
     */
    validateLimits(limits) {
        if (!limits || typeof limits !== 'object') return null;
        
        const defaultLimits = this.getDefaultLimits('individual');
        const validatedLimits = {};
        
        for (const [key, value] of Object.entries(defaultLimits)) {
            if (limits.hasOwnProperty(key) && typeof limits[key] === 'number' && limits[key] >= 0) {
                validatedLimits[key] = limits[key];
            } else {
                validatedLimits[key] = value;
            }
        }
        
        return validatedLimits;
    },

    /**
     * FIXED: Get default limits based on account type and trial status
     */
    getDefaultLimits(accountType, isTrialActive = false) {
        if (isTrialActive) {
            // During trial - generous limits
            return {
                suites: accountType === 'organization' ? 15 : 5,
                test_scripts: 1000,
                automated_tests: 500,
                recordings: 100,
                report_exports: 50,
                team_members: accountType === 'organization' ? 25 : 5
            };
        } else {
            // After trial expires - restricted limits
            return {
                suites: accountType === 'organization' ? 5 : 1,
                test_scripts: accountType === 'organization' ? 50 : 25,
                automated_tests: accountType === 'organization' ? 25 : 10,
                recordings: accountType === 'organization' ? 10 : 5,
                report_exports: accountType === 'organization' ? 5 : 2,
                team_members: 1
            };
        }
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
     * FIXED: Get default capabilities - start with trial for new users
     */
    getDefaultCapabilities() {
        const user = auth.currentUser;
        const accountType = user && user.email ? this.getAccountType(user.email) : 'individual';
        
        // FIXED: New users should start with trial capabilities
        const trialSubscription = this.createFreemiumSubscription(accountType);
        
        return {
            canCreateMultipleSuites: trialSubscription.features.multiple_suites,
            canAccessAdvancedReports: trialSubscription.features.advanced_reports,
            canInviteTeamMembers: trialSubscription.features.team_collaboration,
            canUseAPI: trialSubscription.features.api_access,
            canUseAutomation: trialSubscription.features.advanced_automation,
            limits: trialSubscription.limits,
            isTrialActive: true,
            trialDaysRemaining: 30,
            subscriptionType: 'freemium',
            subscriptionStatus: 'trial',
            showTrialBanner: true,
            profile: this.createDefaultProfile(),
            accountType: accountType
        };
    },

    /**
     * Get fresh user data from Firestore and process it
     */
    async refreshUserCapabilities(userId = null) {
        try {
            const user = auth.currentUser;
            const targetUserId = userId || user?.uid;
            
            if (!targetUserId) {
                console.warn('AccountService: No user ID available for refresh');
                return this.getDefaultCapabilities();
            }

            // Clear cache for this user
            this.clearUserCache(targetUserId);

            // Fetch fresh data from Firestore
            const userDoc = await getDoc(doc(db, "users", targetUserId));
            
            if (!userDoc.exists()) {
                console.warn('AccountService: User document does not exist');
                return this.getDefaultCapabilities();
            }

            const userData = userDoc.data();
            return this.getUserCapabilities(userData);
        } catch (error) {
            console.error('AccountService: Error refreshing user capabilities:', error);
            return this.getDefaultCapabilities();
        }
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
     * FIXED: Enhanced method to check if user can create new projects based on current usage
     */
    async canCreateNewProject(userProfile = null) {
        try {
            const capabilities = userProfile ? 
                this.getUserCapabilities(userProfile) : 
                await this.refreshUserCapabilities();

            const maxSuites = capabilities.limits.suites;
            
            // Get current suite count from user's profile or Firestore
            let currentSuiteCount = 0;
            
            if (capabilities.profile && capabilities.profile.account_memberships) {
                for (const membership of capabilities.profile.account_memberships) {
                    if (membership.owned_test_suites && Array.isArray(membership.owned_test_suites)) {
                        currentSuiteCount += membership.owned_test_suites.length;
                    }
                }
            }

            const canCreate = currentSuiteCount < maxSuites;
            
            console.log('Project creation check:', {
                currentSuites: currentSuiteCount,
                maxSuites: maxSuites,
                canCreate: canCreate,
                isTrialActive: capabilities.isTrialActive,
                accountType: capabilities.accountType
            });

            return {
                canCreate: canCreate,
                currentCount: currentSuiteCount,
                maxAllowed: maxSuites,
                remaining: Math.max(0, maxSuites - currentSuiteCount),
                isTrialActive: capabilities.isTrialActive,
                subscriptionType: capabilities.subscriptionType
            };
        } catch (error) {
            console.error('Error checking project creation capability:', error);
            // Default to allowing at least 1 project
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: 1,
                remaining: 1,
                isTrialActive: false,
                subscriptionType: 'free'
            };
        }
    },

    /**
     * FIXED: Helper method to get readable subscription status
     */
    getSubscriptionDisplayInfo(userProfile) {
        const capabilities = this.getUserCapabilities(userProfile);
        
        if (capabilities.isTrialActive) {
            return {
                status: 'Trial Active',
                message: `${capabilities.trialDaysRemaining} days remaining`,
                type: 'trial',
                color: 'blue',
                canUpgrade: true,
                features: 'All features included'
            };
        }
        
        if (capabilities.subscriptionType === 'free') {
            return {
                status: 'Free Plan',
                message: capabilities.accountType === 'organization' ? 
                    `${capabilities.limits.suites} projects limit` : 
                    `${capabilities.limits.suites} project limit`,
                type: 'free',
                color: 'gray',
                canUpgrade: true,
                features: 'Limited features'
            };
        }
        
        return {
            status: 'Premium Plan',
            message: 'Full access',
            type: 'premium',
            color: 'green',
            canUpgrade: false,
            features: 'All features included'
        };
    },

    /**
     * FIXED: Method to handle subscription upgrades
     */
    async upgradeSubscription(userId, newPlan = 'premium') {
        try {
            const user = auth.currentUser;
            if (!user || user.uid !== userId) {
                throw new Error('Unauthorized upgrade attempt');
            }

            const userDoc = await getDoc(doc(db, "users", userId));
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            const accountType = this.getAccountType(user.email);
            
            // Create premium subscription config
            const premiumConfig = {
                plan_type: newPlan,
                status: 'active',
                trial_start_date: null,
                trial_end_date: null,
                is_trial_active: false,
                trial_days_remaining: 0,
                has_used_trial: true,
                show_trial_banner: false,
                expiry_date: null, // Set based on billing cycle
                
                features: {
                    multiple_suites: true,
                    advanced_reports: true,
                    team_collaboration: true,
                    api_access: true,
                    priority_support: true,
                    custom_integrations: true,
                    advanced_automation: true
                },

                limits: {
                    suites: accountType === 'organization' ? 
                        (newPlan === 'enterprise' ? -1 : 50) : // -1 = unlimited for enterprise
                        (newPlan === 'enterprise' ? -1 : 25),
                    test_scripts: -1, // Unlimited for premium+
                    automated_tests: -1,
                    recordings: -1,
                    report_exports: -1,
                    team_members: accountType === 'organization' ? -1 : 10
                }
            };

            // Update user's subscription
            const updatedMemberships = userData.account_memberships.map(membership => {
                if (membership.subscription_plan) {
                    return {
                        ...membership,
                        subscription_plan: {
                            ...premiumConfig,
                            upgraded_at: new Date(),
                            previous_plan: membership.subscription_plan.plan_type
                        }
                    };
                }
                return membership;
            });

            await updateDoc(doc(db, "users", userId), {
                account_memberships: updatedMemberships,
                updated_at: new Date()
            });

            // Clear cache to force refresh
            this.clearUserCache(userId);

            console.log(`Successfully upgraded user ${userId} to ${newPlan} plan`);
            
            return {
                success: true,
                newPlan: newPlan,
                capabilities: await this.refreshUserCapabilities(userId)
            };
        } catch (error) {
            console.error('Error upgrading subscription:', error);
            throw error;
        }
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