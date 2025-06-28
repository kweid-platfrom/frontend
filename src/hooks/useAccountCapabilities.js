// hooks/useAccountCapabilities.js - Custom hook for capabilities
import { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscriptionService';
import { userService } from '../services/userService';

export const useAccountCapabilities = (userId) => {
    const [capabilities, setCapabilities] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCapabilities = async () => {
            try {
                const userProfile = await userService.getUserProfile(userId);
                if (!userProfile) return;

                const subscription = userProfile.subscription;
                const isTrialActive = subscriptionService.checkTrialStatus(subscription);
                const trialDaysRemaining = subscriptionService.calculateTrialDaysRemaining(subscription);

                setCapabilities({
                    isTrialActive,
                    trialDaysRemaining,
                    features: subscription.features,
                    limits: subscription.limits,
                    canCreateMultipleSuites: subscription.features?.multiple_suites || false,
                    canInviteTeamMembers: subscription.features?.team_collaboration || false
                });
            } catch (error) {
                console.error('Failed to load capabilities:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadCapabilities();
        }
    }, [userId]);

    return { capabilities, loading };
};