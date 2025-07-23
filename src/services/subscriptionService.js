import firestoreService from './firestoreService';

class SubscriptionError extends Error {
    constructor(message, code = 'SUBSCRIPTION_ERROR') {
        super(message);
        this.name = 'SubscriptionError';
        this.code = code;
    }
}

export class SubscriptionService {
    constructor() {
        this.firestoreService = firestoreService;
        
        this.PLANS = {
            INDIVIDUAL_TRIAL: 'individual_trial',
            INDIVIDUAL_FREE: 'individual_free',
            INDIVIDUAL_PRO: 'individual_pro',
            ORGANIZATION_TRIAL: 'organization_trial',
            ORGANIZATION_FREE: 'organization_free',
            ORGANIZATION_PRO: 'organization_pro',
            ORGANIZATION_ENTERPRISE: 'organization_enterprise',
        };

        this.TRIAL_DURATION_DAYS = 30;
        
        this.BILLING_CYCLES = {
            MONTHLY: 'monthly',
            YEARLY: 'yearly',
        };

        this.PRICE_IDS = {
            [this.PLANS.INDIVIDUAL_PRO]: {
                [this.BILLING_CYCLES.MONTHLY]: 'price_individual_pro_monthly',
                [this.BILLING_CYCLES.YEARLY]: 'price_individual_pro_yearly',
            },
            [this.PLANS.ORGANIZATION_PRO]: {
                [this.BILLING_CYCLES.MONTHLY]: 'price_org_pro_monthly',
                [this.BILLING_CYCLES.YEARLY]: 'price_org_pro_yearly',
            },
            [this.PLANS.ORGANIZATION_ENTERPRISE]: {
                [this.BILLING_CYCLES.MONTHLY]: 'price_org_enterprise_monthly',
                [this.BILLING_CYCLES.YEARLY]: 'price_org_enterprise_yearly',
            },
        };

        this.SUBSCRIPTION_STATUS = {
            ACTIVE: 'active',
            TRIAL: 'trial',
            EXPIRED: 'expired',
            CANCELLED: 'cancelled',
            PAST_DUE: 'past_due',
        };
    }

    _validateUserId(userId) {
        if (!userId) {
            throw new SubscriptionError('User ID is required', 'INVALID_USER_ID');
        }
        return userId;
    }

    _calculateTrialEndDate() {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + this.TRIAL_DURATION_DAYS);
        return endDate;
    }

    _calculateSubscriptionEndDate(billingCycle) {
        const endDate = new Date();
        if (billingCycle === this.BILLING_CYCLES.YEARLY) {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        return endDate;
    }

    _getFreePlanForAccountType(accountType) {
        return accountType === 'organization' ? this.PLANS.ORGANIZATION_FREE : this.PLANS.INDIVIDUAL_FREE;
    }

    _getTrialPlanForAccountType(accountType) {
        return accountType === 'organization' ? this.PLANS.ORGANIZATION_TRIAL : this.PLANS.INDIVIDUAL_TRIAL;
    }

    _isPaidPlan(plan) {
        return plan && !plan.includes('free') && !plan.includes('trial');
    }

    _isTrialPlan(plan) {
        return plan && plan.includes('trial');
    }

    async initializeTrialSubscription(userId, accountType = 'individual') {
        try {
            this._validateUserId(userId);
            
            const trialPlan = this._getTrialPlanForAccountType(accountType);
            const trialEndDate = this._calculateTrialEndDate();
            
            const subscriptionData = {
                subscriptionPlan: trialPlan,
                subscriptionStatus: this.SUBSCRIPTION_STATUS.TRIAL,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: trialEndDate,
                trialEndDate,
                isTrialActive: true,
                trialDaysRemaining: this.TRIAL_DURATION_DAYS,
                billingCycle: this.BILLING_CYCLES.MONTHLY,
                accountType,
            };

            const result = await this.firestoreService.updateDocument('users', userId, subscriptionData);
            return result.success ? { success: true, data: subscriptionData } : result;
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'initialize trial subscription');
        }
    }

    async getSubscription(userId) {
        try {
            this._validateUserId(userId);
            
            const userResult = await this.firestoreService.getUserProfile(userId);
            if (!userResult.success) return userResult;

            const userData = userResult.data;
            
            let trialDaysRemaining = 0;
            if (userData.isTrialActive && userData.trialEndDate) {
                const trialEnd = new Date(userData.trialEndDate);
                const now = new Date();
                const diffTime = trialEnd.getTime() - now.getTime();
                trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            const subscriptionData = {
                subscriptionPlan: userData.subscriptionPlan || this.PLANS.INDIVIDUAL_FREE,
                subscriptionStatus: userData.subscriptionStatus || this.SUBSCRIPTION_STATUS.ACTIVE,
                subscriptionStartDate: userData.subscriptionStartDate,
                subscriptionEndDate: userData.subscriptionEndDate,
                billingCycle: userData.billingCycle || this.BILLING_CYCLES.MONTHLY,
                isTrialActive: userData.isTrialActive || false,
                trialDaysRemaining,
                trialEndDate: userData.trialEndDate,
                accountType: userData.accountType || 'individual',
                stripeCustomerId: userData.stripeCustomerId,
                stripeSubscriptionId: userData.stripeSubscriptionId,
                lastPaymentDate: userData.lastPaymentDate,
                nextBillingDate: userData.nextBillingDate,
                isActive: userData.subscriptionStatus === this.SUBSCRIPTION_STATUS.ACTIVE || 
                         userData.subscriptionStatus === this.SUBSCRIPTION_STATUS.TRIAL,
                isPaidPlan: this._isPaidPlan(userData.subscriptionPlan),
                isTrialPlan: this._isTrialPlan(userData.subscriptionPlan),
                willCancelAt: userData.willCancelAt,
                cancelledAt: userData.cancelledAt,
            };

            return { success: true, data: subscriptionData };
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'get subscription');
        }
    }

    async updateSubscriptionStatus(userId) {
        try {
            this._validateUserId(userId);
            
            const subscriptionResult = await this.getSubscription(userId);
            if (!subscriptionResult.success) return subscriptionResult;

            const subscription = subscriptionResult.data;
            const now = new Date();
            let updateData = {};

            if (subscription.isTrialActive && subscription.trialEndDate) {
                const trialEnd = new Date(subscription.trialEndDate);
                if (trialEnd <= now) {
                    const freePlan = this._getFreePlanForAccountType(subscription.accountType);
                    updateData = {
                        subscriptionPlan: freePlan,
                        subscriptionStatus: this.SUBSCRIPTION_STATUS.ACTIVE,
                        isTrialActive: false,
                        trialDaysRemaining: 0,
                        subscriptionStartDate: now,
                    };
                }
            }

            if (subscription.isPaidPlan && subscription.subscriptionEndDate) {
                const subEnd = new Date(subscription.subscriptionEndDate);
                if (subEnd <= now && subscription.subscriptionStatus === this.SUBSCRIPTION_STATUS.ACTIVE) {
                    const freePlan = this._getFreePlanForAccountType(subscription.accountType);
                    updateData = {
                        ...updateData,
                        subscriptionPlan: freePlan,
                        subscriptionStatus: this.SUBSCRIPTION_STATUS.EXPIRED,
                    };
                }
            }

            if (Object.keys(updateData).length > 0) {
                const result = await this.firestoreService.updateDocument('users', userId, updateData);
                if (result.success) {
                    return { success: true, data: { ...subscription, ...updateData } };
                }
                return result;
            }

            return { success: true, data: subscription };
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'update subscription status');
        }
    }

    async createCheckoutSession(userId, planId, billingCycle = this.BILLING_CYCLES.MONTHLY, urls = {}) {
        try {
            this._validateUserId(userId);
            
            const priceId = this.PRICE_IDS[planId]?.[billingCycle];
            if (!priceId) {
                throw new SubscriptionError(`Invalid plan or billing cycle: ${planId}_${billingCycle}`, 'INVALID_PLAN');
            }

            const sessionData = {
                userId,
                planId,
                billingCycle,
                priceId,
                status: 'pending',
                successUrl: urls.successUrl,
                cancelUrl: urls.cancelUrl,
                checkoutUrl: `https://checkout.stripe.com/pay/cs_${Date.now()}_${userId}`,
            };

            const result = await this.firestoreService.createDocument('checkout_sessions', sessionData);
            
            return result.success ? {
                success: true,
                checkoutUrl: sessionData.checkoutUrl,
                sessionId: result.docId,
            } : result;
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'create checkout session');
        }
    }

    async processSuccessfulPayment(sessionId, paymentData) {
        try {
            if (!sessionId || !paymentData) {
                throw new SubscriptionError('Session ID and payment data required', 'INVALID_INPUT');
            }

            const sessionResult = await this.firestoreService.getDocument('checkout_sessions', sessionId);
            if (!sessionResult.success) return sessionResult;

            const session = sessionResult.data;
            const { userId, planId, billingCycle } = session;

            const subscriptionEnd = this._calculateSubscriptionEndDate(billingCycle);
            const subscriptionData = {
                subscriptionPlan: planId,
                subscriptionStatus: this.SUBSCRIPTION_STATUS.ACTIVE,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: subscriptionEnd,
                billingCycle,
                isTrialActive: false,
                trialDaysRemaining: 0,
                stripeCustomerId: paymentData.customerId,
                stripeSubscriptionId: paymentData.subscriptionId,
                lastPaymentDate: new Date(),
                nextBillingDate: subscriptionEnd,
            };

            const updateResult = await this.firestoreService.updateDocument('users', userId, subscriptionData);
            if (!updateResult.success) return updateResult;

            const transactionData = {
                userId,
                sessionId,
                planId,
                billingCycle,
                amount: paymentData.amount,
                currency: paymentData.currency || 'usd',
                stripePaymentIntentId: paymentData.paymentIntentId,
                status: 'completed',
                transactionType: 'subscription_payment',
            };

            await this.firestoreService.createDocument('payment_transactions', transactionData);
            await this.firestoreService.updateDocument('checkout_sessions', sessionId, { status: 'completed' });

            return { success: true, data: subscriptionData };
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'process successful payment');
        }
    }

    async cancelSubscription(userId, immediate = false) {
        try {
            this._validateUserId(userId);
            
            const subscriptionResult = await this.getSubscription(userId);
            if (!subscriptionResult.success) return subscriptionResult;

            const subscription = subscriptionResult.data;
            const now = new Date();
            
            let updateData = {
                cancelledAt: now,
            };

            if (immediate) {
                const freePlan = this._getFreePlanForAccountType(subscription.accountType);
                updateData = {
                    ...updateData,
                    subscriptionPlan: freePlan,
                    subscriptionStatus: this.SUBSCRIPTION_STATUS.CANCELLED,
                    subscriptionEndDate: now,
                    nextBillingDate: null,
                };
            } else {
                updateData = {
                    ...updateData,
                    subscriptionStatus: this.SUBSCRIPTION_STATUS.ACTIVE,
                    willCancelAt: subscription.subscriptionEndDate || subscription.nextBillingDate,
                };
            }

            const result = await this.firestoreService.updateDocument('users', userId, updateData);
            
            if (result.success) {
                await this.firestoreService.createDocument('subscription_cancellations', {
                    userId,
                    immediate,
                    reason: 'user_requested',
                    cancelledAt: now,
                    willCancelAt: updateData.willCancelAt,
                });
            }

            return result;
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'cancel subscription');
        }
    }

    async reactivateSubscription(userId) {
        try {
            this._validateUserId(userId);
            
            const subscriptionResult = await this.getSubscription(userId);
            if (!subscriptionResult.success) return subscriptionResult;

            const subscription = subscriptionResult.data;
            
            if (subscription.subscriptionStatus !== this.SUBSCRIPTION_STATUS.CANCELLED && !subscription.willCancelAt) {
                throw new SubscriptionError('Subscription is not cancelled', 'INVALID_STATE');
            }

            const updateData = {
                subscriptionStatus: this.SUBSCRIPTION_STATUS.ACTIVE,
                cancelledAt: null,
                willCancelAt: null,
            };

            return await this.firestoreService.updateDocument('users', userId, updateData);
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'reactivate subscription');
        }
    }

    async getBillingHistory(userId, limit = 50) {
        try {
            this._validateUserId(userId);
            
            const result = await this.firestoreService.queryDocuments(
                'payment_transactions',
                [{ field: 'userId', operator: '==', value: userId }],
                'transactionDate',
                limit
            );

            if (!result.success) return result;

            const transactions = result.data;
            const totalSpent = transactions
                .filter(t => t.status === 'completed' && t.amount)
                .reduce((sum, t) => sum + t.amount, 0);

            const subscriptionResult = await this.getSubscription(userId);
            const nextBillingDate = subscriptionResult.success ? subscriptionResult.data.nextBillingDate : null;

            return {
                success: true,
                data: {
                    transactions: transactions.sort((a, b) => 
                        new Date(b.transactionDate) - new Date(a.transactionDate)
                    ),
                    totalSpent,
                    nextBillingDate,
                },
            };
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'get billing history');
        }
    }

    async updatePaymentMethod(userId, paymentMethodData) {
        try {
            this._validateUserId(userId);
            
            const updateData = {
                paymentMethod: paymentMethodData,
                paymentMethodUpdatedAt: new Date(),
            };

            return await this.firestoreService.updateDocument('users', userId, updateData);
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'update payment method');
        }
    }

    hasFeatureAccess(subscription, feature) {
        const { subscriptionPlan, isActive, isTrialActive } = subscription;
        
        if (!isActive) return false;
        
        if (isTrialActive) return true;
        
        if (subscriptionPlan.includes('free')) {
            const restrictedFeatures = ['test_cases', 'reports', 'automation', 'team_management'];
            return !restrictedFeatures.includes(feature);
        }
        
        return this._isPaidPlan(subscriptionPlan);
    }

    getAvailablePlans(accountType = 'individual') {
        const basePlans = accountType === 'organization' ? 
            [this.PLANS.ORGANIZATION_PRO, this.PLANS.ORGANIZATION_ENTERPRISE] :
            [this.PLANS.INDIVIDUAL_PRO];
            
        return basePlans.map(plan => ({
            id: plan,
            name: plan.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            priceIds: this.PRICE_IDS[plan] || {},
        }));
    }

    async updateTrialStatus(userId) {
        try {
            this._validateUserId(userId);
            
            const subscriptionResult = await this.getSubscription(userId);
            if (!subscriptionResult.success) return subscriptionResult;

            const subscription = subscriptionResult.data;
            
            if (!subscription.isTrialActive || !subscription.trialEndDate) {
                return { success: true, data: subscription };
            }

            const now = new Date();
            const trialEnd = new Date(subscription.trialEndDate);
            
            const diffTime = trialEnd.getTime() - now.getTime();
            const trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            let updateData = {
                trialDaysRemaining,
            };

            if (trialEnd <= now) {
                const freePlan = this._getFreePlanForAccountType(subscription.accountType);
                updateData = {
                    ...updateData,
                    subscriptionPlan: freePlan,
                    subscriptionStatus: this.SUBSCRIPTION_STATUS.ACTIVE,
                    isTrialActive: false,
                    trialDaysRemaining: 0,
                    subscriptionStartDate: now,
                };
            }

            const result = await this.firestoreService.updateDocument('users', userId, updateData);
            
            return result.success ? {
                success: true,
                data: { ...subscription, ...updateData },
            } : result;
        } catch (error) {
            return this.firestoreService.handleFirestoreError(error, 'update trial status');
        }
    }

    isPaidPlan(plan) {
        return this._isPaidPlan(plan);
    }

    isTrialPlan(plan) {
        return this._isTrialPlan(plan);
    }

    getPlanLimits(planId, accountType = 'individual') {
        const baseLimits = {
            maxTestSuites: 1,
            maxTestScripts: 10,
            maxAutomatedTests: 0,
            maxRecordings: 5,
            maxMonthlyExports: 5,
            maxTeamMembers: 1,
            maxStorageGB: 1,
        };

        if (this._isTrialPlan(planId)) {
            return {
                maxTestSuites: -1,
                maxTestScripts: -1,
                maxAutomatedTests: -1,
                maxRecordings: -1,
                maxMonthlyExports: -1,
                maxTeamMembers: accountType === 'organization' ? 10 : 1,
                maxStorageGB: accountType === 'organization' ? 10 : 5,
            };
        }

        if (this._isPaidPlan(planId)) {
            if (planId === this.PLANS.ORGANIZATION_ENTERPRISE) {
                return {
                    maxTestSuites: -1,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: -1,
                    maxStorageGB: -1,
                };
            } else if (planId === this.PLANS.ORGANIZATION_PRO) {
                return {
                    maxTestSuites: 10,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: 25,
                    maxStorageGB: 50,
                };
            } else if (planId === this.PLANS.INDIVIDUAL_PRO) {
                return {
                    maxTestSuites: 5,
                    maxTestScripts: -1,
                    maxAutomatedTests: -1,
                    maxRecordings: -1,
                    maxMonthlyExports: -1,
                    maxTeamMembers: 1,
                    maxStorageGB: 10,
                };
            }
        }

        if (accountType === 'organization' && planId === this.PLANS.ORGANIZATION_FREE) {
            return {
                maxTestSuites: 3,
                maxTestScripts: 50,
                maxAutomatedTests: 0,
                maxRecordings: 25,
                maxMonthlyExports: 0,
                maxTeamMembers: 5,
                maxStorageGB: 5,
            };
        }

        return baseLimits;
    }

    cleanup() {
        this.firestoreService.cleanup();
    }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;