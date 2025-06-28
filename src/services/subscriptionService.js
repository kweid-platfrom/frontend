// services/subscriptionService.js - Handle ONLY subscription logic
export const subscriptionService = {
    createTrialSubscription(accountType = 'individual') {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        return {
            plan_type: 'freemium',
            subscriptionType: 'trial', // Use consistent field name
            status: 'trial',
            subscriptionStatus: 'active', // Use consistent field name
            trial_start_date: now,
            trial_end_date: trialEnd,
            is_trial_active: true,
            isTrialActive: true, // Use consistent field name
            trial_days_remaining: 30,
            trialDaysRemaining: 30, // Use consistent field name
            features: this.getTrialFeatures(),
            limits: this.getTrialLimits(accountType),
            createdAt: now,
            updatedAt: now
        };
    },

    createFreeSubscription(accountType = 'individual') {
        const now = new Date();
        
        return {
            plan_type: 'free',
            subscriptionType: 'free',
            status: 'active',
            subscriptionStatus: 'active',
            is_trial_active: false,
            isTrialActive: false,
            trial_days_remaining: 0,
            trialDaysRemaining: 0,
            features: this.getFreeFeatures(),
            limits: this.getFreeTierLimits(accountType),
            createdAt: now,
            updatedAt: now
        };
    },

    getTrialFeatures() {
        return {
            multiple_suites: true,
            advanced_reports: true,
            team_collaboration: true,
            api_access: true,
            priority_support: true,
            custom_integrations: true,
            advanced_automation: true
        };
    },

    getFreeFeatures() {
        return {
            multiple_suites: false,
            advanced_reports: false,
            team_collaboration: false,
            api_access: false,
            priority_support: false,
            custom_integrations: false,
            advanced_automation: false
        };
    },

    getTrialLimits(accountType = 'individual') {
        return {
            suites: accountType === 'organization' ? 15 : 5,
            test_scripts: 1000,
            automated_tests: 500,
            recordings: 100,
            report_exports: 50,
            team_members: accountType === 'organization' ? 25 : 5
        };
    },

    getFreeTierLimits(accountType = 'individual') {
        return {
            suites: accountType === 'organization' ? 5 : 1,
            test_scripts: accountType === 'organization' ? 50 : 25,
            automated_tests: accountType === 'organization' ? 25 : 10,
            recordings: accountType === 'organization' ? 10 : 5,
            report_exports: accountType === 'organization' ? 5 : 2,
            team_members: 1
        };
    },

    checkTrialStatus(subscription) {
        if (!subscription) return false;
        
        // Handle both field name variations
        const trialEndDate = subscription.trial_end_date || subscription.trialEndDate;
        const isTrialActive = subscription.is_trial_active ?? subscription.isTrialActive;
        
        if (!trialEndDate || isTrialActive === false) return false;
        
        const trialEnd = new Date(trialEndDate);
        const now = new Date();
        return now < trialEnd;
    },

    calculateTrialDaysRemaining(subscription) {
        if (!subscription) return 0;
        
        const trialEndDate = subscription.trial_end_date || subscription.trialEndDate;
        if (!trialEndDate) return 0;
        
        const trialEnd = new Date(trialEndDate);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysRemaining);
    },

    updateTrialStatus(subscription) {
        if (!subscription) return this.createFreeSubscription();

        const isTrialStillActive = this.checkTrialStatus(subscription);
        const daysRemaining = this.calculateTrialDaysRemaining(subscription);

        return {
            ...subscription,
            is_trial_active: isTrialStillActive,
            isTrialActive: isTrialStillActive,
            trial_days_remaining: daysRemaining,
            trialDaysRemaining: daysRemaining,
            subscriptionType: isTrialStillActive ? 'trial' : 'free',
            subscriptionStatus: 'active',
            status: isTrialStillActive ? 'trial' : 'active',
            updatedAt: new Date()
        };
    },

    getUserCapabilities(userProfile) {
        if (!userProfile) {
            return {
                subscriptionType: 'free',
                subscriptionStatus: 'active',
                isTrialActive: false,
                trialDaysRemaining: 0,
                canCreateMultipleSuites: false,
                canAccessAdvancedReports: false,
                canInviteTeamMembers: false,
                canUseAPI: false,
                canUseAutomation: false,
                limits: this.getFreeTierLimits('individual')
            };
        }

        // Handle both subscription object and direct profile properties
        const subscription = userProfile.subscription || userProfile;
        const updatedSubscription = this.updateTrialStatus(subscription);

        const subscriptionType = updatedSubscription.subscriptionType || 'free';
        const isTrialActive = updatedSubscription.isTrialActive || false;
        const isPaidPlan = subscriptionType === 'premium' || subscriptionType === 'pro';

        return {
            subscriptionType,
            subscriptionStatus: updatedSubscription.subscriptionStatus || 'active',
            isTrialActive,
            trialDaysRemaining: updatedSubscription.trialDaysRemaining || 0,
            canCreateMultipleSuites: isTrialActive || isPaidPlan,
            canAccessAdvancedReports: isTrialActive || isPaidPlan,
            canInviteTeamMembers: isTrialActive || isPaidPlan,
            canUseAPI: isTrialActive || isPaidPlan,
            canUseAutomation: isTrialActive || isPaidPlan,
            limits: isTrialActive || isPaidPlan 
                ? this.getTrialLimits(userProfile.accountType)
                : this.getFreeTierLimits(userProfile.accountType)
        };
    }
};