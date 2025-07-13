// services/subscriptionService.js - Handle ONLY billing and payment logic
import { doc, updateDoc, getDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Billing and payment-focused subscription service
 * This service handles only billing, payments, and plan upgrades/downgrades
 * All subscription plan logic, features, and capabilities are handled by accountService
 */
export const subscriptionService = {
    
    /**
     * Payment and billing configuration
     */
    BILLING_CONFIG: {
        // Stripe price IDs (these would be actual Stripe price IDs in production)
        priceIds: {
            individual_pro_monthly: 'price_individual_pro_monthly',
            individual_pro_yearly: 'price_individual_pro_yearly',
            organization_starter_monthly: 'price_org_starter_monthly',
            organization_starter_yearly: 'price_org_starter_yearly',
            organization_professional_monthly: 'price_org_pro_monthly',
            organization_professional_yearly: 'price_org_pro_yearly',
            organization_enterprise_monthly: 'price_org_enterprise_monthly',
            organization_enterprise_yearly: 'price_org_enterprise_yearly'
        },
        
        // Billing cycles
        billingCycles: {
            monthly: 'monthly',
            yearly: 'yearly'
        },
        
        // Payment methods
        paymentMethods: {
            stripe: 'stripe',
            paypal: 'paypal'
        }
    },

    /**
     * Get user's current subscription details
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Subscription details
     */
    async getSubscription(userId) {
        try {
            if (!userId) {
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            const userData = userDoc.data();
            
            // Extract subscription-related fields
            const subscriptionData = {
                subscriptionPlan: userData.subscriptionPlan || 'individual_free',
                subscriptionStatus: userData.subscriptionStatus || 'active',
                subscriptionStartDate: userData.subscriptionStartDate,
                subscriptionEndDate: userData.subscriptionEndDate,
                billingCycle: userData.billingCycle || 'monthly',
                isTrialActive: userData.isTrialActive || false,
                trialDaysRemaining: userData.trialDaysRemaining || 0,
                
                // Billing information
                stripeCustomerId: userData.stripeCustomerId,
                stripeSubscriptionId: userData.stripeSubscriptionId,
                lastPaymentDate: userData.lastPaymentDate,
                nextBillingDate: userData.nextBillingDate,
                
                // Calculated fields
                isActive: userData.subscriptionStatus === 'active',
                isPaidPlan: userData.subscriptionPlan && !userData.subscriptionPlan.includes('free'),
                willCancelAt: userData.willCancelAt,
                cancelledAt: userData.cancelledAt
            };

            return {
                success: true,
                data: subscriptionData
            };

        } catch (error) {
            console.error('Error getting subscription:', error);
            return {
                success: false,
                error: error.message || 'Failed to get subscription'
            };
        }
    },

    /**
     * Check if user has access to a specific feature based on subscription
     * @param {string} userId - User ID
     * @param {string} feature - Feature to check
     * @returns {Promise<boolean>} Has access
     */
    async hasFeatureAccess(userId, feature) {
        try {
            const subscriptionResult = await this.getSubscription(userId);
            
            if (!subscriptionResult.success) {
                return false;
            }

            const { subscriptionPlan, subscriptionStatus } = subscriptionResult.data;
            
            // If subscription is not active, only free features are available
            if (subscriptionStatus !== 'active') {
                return this.isFeatureInFreePlan(feature);
            }

            // Check feature access based on plan
            return this.isFeatureInPlan(subscriptionPlan, feature);

        } catch (error) {
            console.error('Error checking feature access:', error);
            return false;
        }
    },

    /**
     * Check if feature is available in free plan
     * @param {string} feature - Feature to check
     * @returns {boolean} Is available in free plan
     */
    isFeatureInFreePlan(feature) {
        const freeFeatures = [
            'basic_projects',
            'basic_export',
            'community_support'
        ];
        return freeFeatures.includes(feature);
    },

    /**
     * Check if feature is available in specific plan
     * @param {string} plan - Subscription plan
     * @param {string} feature - Feature to check
     * @returns {boolean} Is available in plan
     */
    isFeatureInPlan(plan, feature) {
        const planFeatures = {
            individual_free: [
                'basic_projects',
                'basic_export',
                'community_support'
            ],
            individual_pro: [
                'basic_projects',
                'basic_export',
                'community_support',
                'advanced_projects',
                'premium_export',
                'priority_support',
                'advanced_analytics'
            ],
            organization_free: [
                'basic_projects',
                'basic_export',
                'community_support',
                'team_collaboration'
            ],
            organization_starter: [
                'basic_projects',
                'basic_export',
                'community_support',
                'team_collaboration',
                'advanced_projects',
                'premium_export',
                'basic_admin_tools'
            ],
            organization_professional: [
                'basic_projects',
                'basic_export',
                'community_support',
                'team_collaboration',
                'advanced_projects',
                'premium_export',
                'basic_admin_tools',
                'advanced_admin_tools',
                'priority_support',
                'advanced_analytics'
            ],
            organization_enterprise: [
                'basic_projects',
                'basic_export',
                'community_support',
                'team_collaboration',
                'advanced_projects',
                'premium_export',
                'basic_admin_tools',
                'advanced_admin_tools',
                'priority_support',
                'advanced_analytics',
                'custom_integrations',
                'dedicated_support',
                'sso_integration'
            ]
        };

        return planFeatures[plan]?.includes(feature) || false;
    },

    /**
     * Create a Stripe checkout session for plan upgrade
     * @param {string} userId - User ID
     * @param {string} planId - Target subscription plan
     * @param {string} billingCycle - 'monthly' or 'yearly'
     * @param {string} successUrl - Redirect URL on success
     * @param {string} cancelUrl - Redirect URL on cancel
     * @returns {Promise<Object>} Stripe checkout session
     */
    async createCheckoutSession(userId, planId, billingCycle = 'monthly', successUrl, cancelUrl) {
        try {
            // This would integrate with Stripe API in production
            const priceId = this.BILLING_CONFIG.priceIds[`${planId}_${billingCycle}`];
            
            if (!priceId) {
                throw new Error(`No price ID found for plan: ${planId}_${billingCycle}`);
            }

            // In production, this would call Stripe API
            const checkoutSession = {
                id: `cs_${Date.now()}_${userId}`,
                url: `https://checkout.stripe.com/pay/${Date.now()}`, // Mock URL
                priceId,
                planId,
                billingCycle,
                userId,
                successUrl,
                cancelUrl,
                createdAt: new Date()
            };

            // Save checkout session to database for tracking
            await this.saveCheckoutSession(checkoutSession);

            return {
                success: true,
                checkoutUrl: checkoutSession.url,
                sessionId: checkoutSession.id
            };

        } catch (error) {
            console.error('Error creating checkout session:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Handle successful payment and upgrade user subscription
     * @param {string} sessionId - Stripe session ID
     * @param {Object} paymentData - Payment completion data
     * @returns {Promise<Object>} Upgrade result
     */
    async handleSuccessfulPayment(sessionId, paymentData) {
        try {
            // Get checkout session data
            const session = await this.getCheckoutSession(sessionId);
            if (!session) {
                throw new Error('Checkout session not found');
            }

            const { userId, planId, billingCycle } = session;

            // Calculate subscription dates
            const now = new Date();
            const subscriptionEnd = new Date();
            
            if (billingCycle === 'yearly') {
                subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
            } else {
                subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
            }

            // Update user subscription in database
            const userDocRef = doc(db, 'users', userId);
            const subscriptionUpdate = {
                subscriptionPlan: planId,
                subscriptionStatus: 'active',
                subscriptionStartDate: now,
                subscriptionEndDate: subscriptionEnd,
                billingCycle: billingCycle,
                isTrialActive: false,
                trialDaysRemaining: 0,
                
                // Billing information
                stripeCustomerId: paymentData.customerId,
                stripeSubscriptionId: paymentData.subscriptionId,
                lastPaymentDate: now,
                nextBillingDate: subscriptionEnd,
                
                updatedAt: now
            };

            await updateDoc(userDocRef, subscriptionUpdate);

            // Record payment transaction
            await this.recordPaymentTransaction({
                userId,
                sessionId,
                planId,
                billingCycle,
                amount: paymentData.amount,
                currency: paymentData.currency,
                stripePaymentIntentId: paymentData.paymentIntentId,
                status: 'completed',
                transactionDate: now
            });

            return {
                success: true,
                userId,
                planId,
                subscriptionEnd,
                billingCycle,
                nextBillingDate: subscriptionEnd
            };

        } catch (error) {
            console.error('Error handling successful payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Handle subscription renewal billing
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Renewal result
     */
    async handleSubscriptionRenewal(userId) {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            const { billingCycle, subscriptionPlan } = userData;

            // Calculate next billing period
            const now = new Date();
            const nextBillingDate = new Date();
            
            if (billingCycle === 'yearly') {
                nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            } else {
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            }

            // Update subscription dates
            await updateDoc(userDocRef, {
                subscriptionStartDate: now,
                subscriptionEndDate: nextBillingDate,
                lastPaymentDate: now,
                nextBillingDate: nextBillingDate,
                updatedAt: now
            });

            return {
                success: true,
                nextBillingDate,
                subscriptionPlan
            };

        } catch (error) {
            console.error('Error handling subscription renewal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Cancel user subscription (immediate or at period end)
     * @param {string} userId - User ID
     * @param {boolean} immediate - Cancel immediately or at period end
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelSubscription(userId, immediate = false) {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            const now = new Date();

            let updateData = {
                subscriptionStatus: immediate ? 'cancelled' : 'active',
                cancelledAt: now,
                updatedAt: now
            };

            if (immediate) {
                // Immediate cancellation - downgrade to free plan
                const accountType = userData.accountType || 'individual';
                const freePlan = accountType === 'organization' ? 'organization_free' : 'individual_free';
                
                updateData = {
                    ...updateData,
                    subscriptionPlan: freePlan,
                    subscriptionEndDate: now,
                    nextBillingDate: null
                };
            } else {
                // Cancel at period end
                updateData.willCancelAt = userData.subscriptionEndDate || userData.nextBillingDate;
            }

            await updateDoc(userDocRef, updateData);

            // Record cancellation
            await this.recordCancellation({
                userId,
                reason: 'user_requested',
                immediate,
                cancelledAt: now,
                willCancelAt: updateData.willCancelAt
            });

            return {
                success: true,
                immediate,
                cancelledAt: now,
                willCancelAt: updateData.willCancelAt
            };

        } catch (error) {
            console.error('Error cancelling subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Reactivate a cancelled subscription
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Reactivation result
     */
    async reactivateSubscription(userId) {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            
            if (userData.subscriptionStatus !== 'cancelled' && !userData.willCancelAt) {
                throw new Error('Subscription is not cancelled');
            }

            const now = new Date();
            const updateData = {
                subscriptionStatus: 'active',
                cancelledAt: null,
                willCancelAt: null,
                updatedAt: now
            };

            await updateDoc(userDocRef, updateData);

            return {
                success: true,
                reactivatedAt: now
            };

        } catch (error) {
            console.error('Error reactivating subscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Get billing history for user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Billing history
     */
    async getBillingHistory(userId) {
        try {
            if (!userId) {
                return {
                    success: false,
                    error: 'User ID is required',
                    transactions: []
                };
            }

            // Query payment transactions for this user
            const transactionsRef = collection(db, 'payment_transactions');
            const q = query(transactionsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            const transactions = [];
            let totalSpent = 0;

            querySnapshot.forEach((doc) => {
                const transaction = doc.data();
                transactions.push({
                    id: doc.id,
                    ...transaction
                });
                
                if (transaction.status === 'completed' && transaction.amount) {
                    totalSpent += transaction.amount;
                }
            });

            // Get next billing date from user profile
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            const nextBillingDate = userDoc.exists() ? userDoc.data().nextBillingDate : null;

            return {
                success: true,
                transactions: transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)),
                totalSpent,
                nextBillingDate
            };

        } catch (error) {
            console.error('Error getting billing history:', error);
            return {
                success: false,
                error: error.message,
                transactions: []
            };
        }
    },

    /**
     * Update payment method
     * @param {string} userId - User ID
     * @param {Object} paymentMethodData - New payment method data
     * @returns {Promise<Object>} Update result
     */
    async updatePaymentMethod(userId, paymentMethodData) {
        try {
            const userDocRef = doc(db, 'users', userId);
            
            await updateDoc(userDocRef, {
                paymentMethod: paymentMethodData,
                updatedAt: new Date()
            });

            return {
                success: true,
                paymentMethod: paymentMethodData
            };

        } catch (error) {
            console.error('Error updating payment method:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Private helper methods for database operations
     */

    async saveCheckoutSession(session) {
        try {
            const sessionsRef = collection(db, 'checkout_sessions');
            await addDoc(sessionsRef, session);
        } catch (error) {
            console.error('Error saving checkout session:', error);
        }
    },

    async getCheckoutSession(sessionId) {
        try {
            const sessionsRef = collection(db, 'checkout_sessions');
            const q = query(sessionsRef, where('id', '==', sessionId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }

            return querySnapshot.docs[0].data();
        } catch (error) {
            console.error('Error getting checkout session:', error);
            return null;
        }
    },

    async recordPaymentTransaction(transaction) {
        try {
            const transactionsRef = collection(db, 'payment_transactions');
            await addDoc(transactionsRef, {
                ...transaction,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Error recording payment transaction:', error);
        }
    },

    async recordCancellation(cancellation) {
        try {
            const cancellationsRef = collection(db, 'subscription_cancellations');
            await addDoc(cancellationsRef, {
                ...cancellation,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Error recording cancellation:', error);
        }
    }
};