import firestoreService from './firestoreService';

class SubscriptionError extends Error {
    constructor(message, code = 'SUBSCRIPTION_ERROR') {
        super(message);
        this.name = 'SubscriptionError';
        this.code = code;
    }
}

/**
 * Billing and payment-focused subscription service
 * This service handles only billing, payments, and plan upgrades/downgrades
 * Feature access and capabilities are handled by accountService
 */
export const subscriptionService = {
    /**
     * Payment and billing configuration
     */
    BILLING_CONFIG: {
        priceIds: {
            individual_pro_monthly: 'price_individual_pro_monthly',
            individual_pro_yearly: 'price_individual_pro_yearly',
            organization_starter_monthly: 'price_org_starter_monthly',
            organization_starter_yearly: 'price_org_starter_yearly',
            organization_professional_monthly: 'price_org_pro_monthly',
            organization_professional_yearly: 'price_org_pro_yearly',
            organization_enterprise_monthly: 'price_org_enterprise_monthly',
            organization_enterprise_yearly: 'price_org_enterprise_yearly',
        },
        billingCycles: {
            monthly: 'monthly',
            yearly: 'yearly',
        },
        paymentMethods: {
            stripe: 'stripe',
            paypal: 'paypal',
        },
    },

    /**
     * Get user's current subscription details
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Subscription details
     */
    async getSubscription(userId) {
        try {
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const userResult = await firestoreService.getUserProfile(userId);
            if (!userResult.success) {
                throw new SubscriptionError(userResult.error.message, userResult.error.code);
            }

            const userData = userResult.data;
            const subscriptionData = {
                subscriptionPlan: userData.subscriptionPlan || 'individual_free',
                subscriptionStatus: userData.subscriptionStatus || 'active',
                subscriptionStartDate: userData.subscriptionStartDate,
                subscriptionEndDate: userData.subscriptionEndDate,
                billingCycle: userData.billingCycle || 'monthly',
                isTrialActive: userData.isTrialActive || false,
                trialDaysRemaining: userData.trialDaysRemaining || 0,
                stripeCustomerId: userData.stripeCustomerId,
                stripeSubscriptionId: userData.stripeSubscriptionId,
                lastPaymentDate: userData.lastPaymentDate,
                nextBillingDate: userData.nextBillingDate,
                isActive: userData.subscriptionStatus === 'active',
                isPaidPlan: userData.subscriptionPlan && !userData.subscriptionPlan.includes('free'),
                willCancelAt: userData.willCancelAt,
                cancelledAt: userData.cancelledAt,
            };

            return {
                success: true,
                data: subscriptionData,
            };
        } catch (error) {
            console.error('Error getting subscription:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
            };
        }
    },

    /**
     * Update trial status for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated user profile
     */
    async updateTrialStatus(userId) {
        try {
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const userResult = await firestoreService.getUserProfile(userId);
            if (!userResult.success) {
                throw new SubscriptionError(userResult.error.message, userResult.error.code);
            }

            const userData = userResult.data;
            const now = new Date();
            let updateData = {};

            if (userData.isTrialActive && userData.trialEndDate) {
                const trialEndDate = userData.trialEndDate instanceof Date
                    ? userData.trialEndDate
                    : new Date(userData.trialEndDate);
                const diffTime = trialEndDate.getTime() - now.getTime();
                const trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                if (trialDaysRemaining <= 0) {
                    const accountType = userData.account_memberships?.[0]?.account_type || 'individual';
                    updateData = {
                        isTrialActive: false,
                        trialDaysRemaining: 0,
                        subscriptionPlan: accountType === 'organization' ? 'organization_free' : 'individual_free',
                        subscriptionStatus: 'inactive',
                    };
                } else {
                    updateData.trialDaysRemaining = trialDaysRemaining;
                }
            }

            if (userData.subscriptionStatus === 'active' && userData.subscriptionEndDate) {
                const subscriptionEndDate = userData.subscriptionEndDate instanceof Date
                    ? userData.subscriptionEndDate
                    : new Date(userData.subscriptionEndDate);
                if (subscriptionEndDate <= now && !userData.isTrialActive) {
                    const accountType = userData.account_memberships?.[0]?.account_type || 'individual';
                    updateData.subscriptionPlan = accountType === 'organization' ? 'organization_free' : 'individual_free';
                    updateData.subscriptionStatus = 'inactive';
                }
            }

            if (Object.keys(updateData).length > 0) {
                updateData.updated_at = firestoreService.serverTimestamp();
                const updateResult = await firestoreService.updateDocument('users', userId, updateData);
                if (!updateResult.success) {
                    throw new SubscriptionError(updateResult.error.message, updateResult.error.code);
                }
                return { success: true, data: { ...userData, ...updateData } };
            }

            return { success: true, data: userData };
        } catch (error) {
            console.error('Error updating trial status:', firestoreService.handleFirestoreError(error));
            return { success: false, error: firestoreService.handleFirestoreError(error) };
        }
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
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }
            const priceId = this.BILLING_CONFIG.priceIds[`${planId}_${billingCycle}`];
            if (!priceId) {
                throw new SubscriptionError(`No price ID found for plan: ${planId}_${billingCycle}`, 'INVALID_PLAN');
            }

            const checkoutSession = {
                id: `cs_${Date.now()}_${userId}`,
                url: `https://checkout.stripe.com/pay/${Date.now()}`,
                priceId,
                planId,
                billingCycle,
                userId,
                successUrl,
                cancelUrl,
                created_at: firestoreService.serverTimestamp(),
            };

            const sessionResult = await firestoreService.createDocument('checkout_sessions', checkoutSession);
            if (!sessionResult.success) {
                throw new SubscriptionError(sessionResult.error.message, sessionResult.error.code);
            }

            return {
                success: true,
                checkoutUrl: checkoutSession.url,
                sessionId: checkoutSession.id,
            };
        } catch (error) {
            console.error('Error creating checkout session:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
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
            if (!sessionId || !paymentData) {
                throw new SubscriptionError('Session ID and payment data are required', 'INVALID_INPUT');
            }

            const sessionResult = await firestoreService.queryDocuments('checkout_sessions', { id: sessionId });
            if (!sessionResult.success || sessionResult.data.length === 0) {
                throw new SubscriptionError('Checkout session not found', 'SESSION_NOT_FOUND');
            }

            const session = sessionResult.data[0];
            const { userId, planId, billingCycle } = session;

            const now = new Date();
            const subscriptionEnd = new Date();
            if (billingCycle === 'yearly') {
                subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
            } else {
                subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
            }

            const subscriptionUpdate = {
                subscriptionPlan: planId,
                subscriptionStatus: 'active',
                subscriptionStartDate: now,
                subscriptionEndDate: subscriptionEnd,
                billingCycle,
                isTrialActive: false,
                trialDaysRemaining: 0,
                stripeCustomerId: paymentData.customerId,
                stripeSubscriptionId: paymentData.subscriptionId,
                lastPaymentDate: now,
                nextBillingDate: subscriptionEnd,
                updated_at: firestoreService.serverTimestamp(),
            };

            const updateResult = await firestoreService.updateDocument('users', userId, subscriptionUpdate);
            if (!updateResult.success) {
                throw new SubscriptionError(updateResult.error.message, updateResult.error.code);
            }

            const transaction = {
                userId,
                sessionId,
                planId,
                billingCycle,
                amount: paymentData.amount,
                currency: paymentData.currency,
                stripePaymentIntentId: paymentData.paymentIntentId,
                status: 'completed',
                transactionDate: now,
                created_at: firestoreService.serverTimestamp(),
            };

            const transactionResult = await firestoreService.createDocument('payment_transactions', transaction);
            if (!transactionResult.success) {
                console.warn('Failed to record payment transaction:', transactionResult.error);
            }

            return {
                success: true,
                userId,
                planId,
                subscriptionEnd,
                billingCycle,
                nextBillingDate: subscriptionEnd,
            };
        } catch (error) {
            console.error('Error handling successful payment:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
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
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const userResult = await firestoreService.getUserProfile(userId);
            if (!userResult.success) {
                throw new SubscriptionError(userResult.error.message, userResult.error.code);
            }

            const userData = userResult.data;
            const { billingCycle, subscriptionPlan } = userData;

            const now = new Date();
            const nextBillingDate = new Date();
            if (billingCycle === 'yearly') {
                nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            } else {
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            }

            const updateData = {
                subscriptionStartDate: now,
                subscriptionEndDate: nextBillingDate,
                lastPaymentDate: now,
                nextBillingDate,
                updated_at: firestoreService.serverTimestamp(),
            };

            const updateResult = await firestoreService.updateDocument('users', userId, updateData);
            if (!updateResult.success) {
                throw new SubscriptionError(updateResult.error.message, updateResult.error.code);
            }

            return {
                success: true,
                nextBillingDate,
                subscriptionPlan,
            };
        } catch (error) {
            console.error('Error handling subscription renewal:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
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
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const userResult = await firestoreService.getUserProfile(userId);
            if (!userResult.success) {
                throw new SubscriptionError(userResult.error.message, userResult.error.code);
            }

            const userData = userResult.data;
            const now = new Date();
            let updateData = {
                subscriptionStatus: immediate ? 'cancelled' : 'active',
                cancelledAt: now,
                updated_at: firestoreService.serverTimestamp(),
            };

            if (immediate) {
                const accountType = userData.account_memberships?.[0]?.account_type || 'individual';
                const freePlan = accountType === 'organization' ? 'organization_free' : 'individual_free';
                updateData = {
                    ...updateData,
                    subscriptionPlan: freePlan,
                    subscriptionEndDate: now,
                    nextBillingDate: null,
                };
            } else {
                updateData.willCancelAt = userData.subscriptionEndDate || userData.nextBillingDate;
            }

            const updateResult = await firestoreService.updateDocument('users', userId, updateData);
            if (!updateResult.success) {
                throw new SubscriptionError(updateResult.error.message, updateResult.error.code);
            }

            const cancellation = {
                userId,
                reason: 'user_requested',
                immediate,
                cancelledAt: now,
                willCancelAt: updateData.willCancelAt,
                created_at: firestoreService.serverTimestamp(),
            };

            const cancellationResult = await firestoreService.createDocument('subscription_cancellations', cancellation);
            if (!cancellationResult.success) {
                console.warn('Failed to record cancellation:', cancellationResult.error);
            }

            return {
                success: true,
                immediate,
                cancelledAt: now,
                willCancelAt: updateData.willCancelAt,
            };
        } catch (error) {
            console.error('Error cancelling subscription:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
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
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const userResult = await firestoreService.getUserProfile(userId);
            if (!userResult.success) {
                throw new SubscriptionError(userResult.error.message, userResult.error.code);
            }

            const userData = userResult.data;
            if (userData.subscriptionStatus !== 'cancelled' && !userData.willCancelAt) {
                throw new SubscriptionError('Subscription is not cancelled', 'INVALID_STATE');
            }

            const now = new Date();
            const updateData = {
                subscriptionStatus: 'active',
                cancelledAt: null,
                willCancelAt: null,
                updated_at: firestoreService.serverTimestamp(),
            };

            const updateResult = await firestoreService.updateDocument('users', userId, updateData);
            if (!updateResult.success) {
                throw new SubscriptionError(updateResult.error.message, updateResult.error.code);
            }

            return {
                success: true,
                reactivatedAt: now,
            };
        } catch (error) {
            console.error('Error reactivating subscription:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
            };
        }
    },

    /**
     * Get billing history for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Billing history
     */
    async getBillingHistory(userId) {
        try {
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const transactionsResult = await firestoreService.queryDocuments('payment_transactions', { userId });
            if (!transactionsResult.success) {
                throw new SubscriptionError(transactionsResult.error.message, transactionsResult.error.code);
            }

            const transactions = transactionsResult.data.map(doc => ({
                id: doc.id,
                ...doc,
            }));

            const totalSpent = transactions
                .filter(t => t.status === 'completed' && t.amount)
                .reduce((sum, t) => sum + t.amount, 0);

            const userResult = await firestoreService.getUserProfile(userId);
            const nextBillingDate = userResult.success ? userResult.data.nextBillingDate : null;

            return {
                success: true,
                transactions: transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)),
                totalSpent,
                nextBillingDate,
            };
        } catch (error) {
            console.error('Error getting billing history:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
                transactions: [],
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
            if (!userId) {
                throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
            }

            const updateData = {
                paymentMethod: paymentMethodData,
                updated_at: firestoreService.serverTimestamp(),
            };

            const updateResult = await firestoreService.updateDocument('users', userId, updateData);
            if (!updateResult.success) {
                throw new SubscriptionError(updateResult.error.message, updateResult.error.code);
            }

            return {
                success: true,
                paymentMethod: paymentMethodData,
            };
        } catch (error) {
            console.error('Error updating payment method:', firestoreService.handleFirestoreError(error));
            return {
                success: false,
                error: firestoreService.handleFirestoreError(error),
            };
        }
    },

    /**
     * Cleanup Firestore subscriptions
     */
    cleanup() {
        firestoreService.cleanup();
    },
};