// utils/onboardingUtils.js

/**
 * Initialize onboarding status structure based on account type
 */
export const initializeOnboardingStatus = (accountType) => {
    const baseStatus = {
        onboardingComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    if (accountType === 'individual') {
        return {
            ...baseStatus,
            projectCreated: false
        };
    } else if (accountType === 'organization') {
        return {
            ...baseStatus,
            organizationInfoComplete: false,
            teamInvitesComplete: false,
            projectCreated: false,
            invitedEmails: []
        };
    }

    return baseStatus;
};

/**
 * Check if onboarding is complete based on account type and status
 */
export const isOnboardingComplete = (accountType, onboardingStatus) => {
    if (!onboardingStatus) return false;

    if (accountType === 'individual') {
        return onboardingStatus.projectCreated && onboardingStatus.onboardingComplete;
    } else if (accountType === 'organization') {
        return (
            onboardingStatus.organizationInfoComplete &&
            onboardingStatus.teamInvitesComplete &&
            onboardingStatus.projectCreated &&
            onboardingStatus.onboardingComplete
        );
    }

    return false;
};

/**
 * Get next onboarding step for account type
 */
export const getNextOnboardingStep = (accountType, onboardingStatus = {}) => {
    if (accountType === 'individual') {
        if (!onboardingStatus.projectCreated) {
            return 'project-creation';
        }
        return null; // Onboarding complete
    } else if (accountType === 'organization') {
        if (!onboardingStatus.organizationInfoComplete) {
            return 'organization-info';
        }
        if (!onboardingStatus.teamInvitesComplete) {
            return 'team-invites';
        }
        if (!onboardingStatus.projectCreated) {
            return 'project-creation';
        }
        return null; // Onboarding complete
    }

    return null;
};