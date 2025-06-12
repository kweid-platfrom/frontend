/* eslint-disable @typescript-eslint/no-unused-vars */
// utils/onboardingUtils.js

/**
 * Normalize onboarding progress field names to handle different naming conventions
 * This ensures backward compatibility and consistent field access
 */
export const normalizeOnboardingProgress = (progress = {}) => {
    return {
        // Standard fields
        emailVerified: progress.emailVerified || false,
        profileSetup: progress.profileSetup || false,

        // Organization-specific fields (normalize different naming conventions)
        organizationInfo: progress.organizationInfo || progress.organizationInfoComplete || false,
        teamInvites: progress.teamInvites || progress.teamInvitesComplete || false,
        projectCreation: progress.projectCreation || progress.projectCreated || false,

        // Keep original fields for backward compatibility
        ...progress
    };
};

/**
 * Initialize onboarding status structure based on account type
 */
export const initializeOnboardingStatus = (accountType) => {
    const baseStatus = {
        onboardingComplete: false,
        // Fixed: Use consistent step naming with hyphens
        currentStep: accountType === 'organization' ? 'organization-info' : 'project-creation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stepsCompleted: []
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
            invitedEmails: [],
            teamInvitesSkipped: false
        };
    }

    return baseStatus;
};

/**
 * Initialize onboarding progress structure based on account type
 */
export const initializeOnboardingProgress = (accountType) => {
    const baseProgress = {
        emailVerified: false,
        profileSetup: false
    };

    if (accountType === 'individual') {
        return {
            ...baseProgress,
            projectCreation: false,
            projectCreated: false // Keep both for compatibility
        };
    } else if (accountType === 'organization') {
        return {
            ...baseProgress,
            organizationInfo: false,
            organizationInfoComplete: false, // Keep both for compatibility
            teamInvites: false,
            teamInvitesComplete: false, // Keep both for compatibility
            projectCreation: false,
            projectCreated: false // Keep both for compatibility
        };
    }

    return baseProgress;
};

/**
 * Check if onboarding is complete based on account type and status
 */
export const isOnboardingComplete = (accountType, onboardingProgress = {}, onboardingStatus = {}) => {
    // Check status first for explicit completion flag
    if (onboardingStatus.onboardingComplete) return true;

    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);

    if (accountType === 'individual') {
        return normalizedProgress.projectCreation;
    } else if (accountType === 'organization') {
        return normalizedProgress.organizationInfo &&
            normalizedProgress.teamInvites &&
            normalizedProgress.projectCreation;
    }

    return false;
};

/**
 * Get next onboarding step for account type
 */
export const getNextOnboardingStep = (accountType, onboardingProgress = {}) => {
    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);

    if (accountType === 'individual') {
        if (!normalizedProgress.projectCreation) return 'project-creation';
        return null; // Onboarding complete
    } else if (accountType === 'organization') {
        if (!normalizedProgress.organizationInfo) return 'organization-info';
        if (!normalizedProgress.teamInvites) return 'team-invites';
        if (!normalizedProgress.projectCreation) return 'project-creation';
        return null; // Onboarding complete
    }

    return null;
};

/**
 * Get onboarding progress percentage for display
 */
export const getOnboardingProgress = (accountType, progress = {}) => {
    const normalizedProgress = normalizeOnboardingProgress(progress);

    if (accountType === 'individual') {
        const steps = ['projectCreation'];
        const completed = steps.filter(step => normalizedProgress[step]).length;
        return Math.round((completed / steps.length) * 100);
    } else if (accountType === 'organization') {
        const steps = ['organizationInfo', 'teamInvites', 'projectCreation'];
        const completed = steps.filter(step => normalizedProgress[step]).length;
        return Math.round((completed / steps.length) * 100);
    }

    return 0;
};

/**
 * Get human-readable step names
 */
export const getStepDisplayName = (stepKey) => {
    const stepNames = {
        'organization-info': 'Organization Information',
        'team-invites': 'Team Invitations',
        'project-creation': 'Project Creation',
        'email-verification': 'Email Verification',
        'profile-setup': 'Profile Setup'
    };

    return stepNames[stepKey] || stepKey.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Validate project name and check for duplicates
 */
export const validateProjectName = (name) => {
    const errors = [];

    if (!name || !name.trim()) {
        errors.push('Project name is required');
        return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
        errors.push('Project name must be at least 3 characters long');
    }

    if (trimmedName.length > 50) {
        errors.push('Project name must be less than 50 characters');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
        errors.push('Project name contains invalid characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
        normalizedName: trimmedName.toLowerCase()
    };
};

/**
 * Validate organization name
 */
export const validateOrganizationName = (name) => {
    const errors = [];

    if (!name || !name.trim()) {
        errors.push('Organization name is required');
        return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
        errors.push('Organization name must be at least 2 characters long');
    }

    if (trimmedName.length > 100) {
        errors.push('Organization name must be less than 100 characters');
    }

    return {
        isValid: errors.length === 0,
        errors,
        normalizedName: trimmedName
    };
};

/**
 * Validate email addresses for team invites
 */
export const validateEmailList = (emails = []) => {
    const errors = [];
    const validEmails = [];
    const invalidEmails = [];

    if (!Array.isArray(emails)) {
        return { isValid: false, errors: ['Invalid email list format'], validEmails: [], invalidEmails: [] };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    emails.forEach((email, index) => {
        const trimmedEmail = email?.trim().toLowerCase();

        if (!trimmedEmail) {
            errors.push(`Email ${index + 1} is empty`);
            invalidEmails.push(email);
        } else if (!emailRegex.test(trimmedEmail)) {
            errors.push(`Email ${index + 1} is not valid: ${trimmedEmail}`);
            invalidEmails.push(email);
        } else if (validEmails.includes(trimmedEmail)) {
            errors.push(`Duplicate email: ${trimmedEmail}`);
            invalidEmails.push(email);
        } else {
            validEmails.push(trimmedEmail);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        validEmails,
        invalidEmails
    };
};

/**
 * Create update data for completing an onboarding step
 */
export const createStepUpdateData = (stepName, stepData = {}, _accountType = null) => {
    const updateData = {
        updatedAt: new Date().toISOString()
    };

    switch (stepName) {
        case 'organization-info':
            updateData['onboardingProgress.organizationInfo'] = true;
            updateData['onboardingProgress.organizationInfoComplete'] = true;
            // Fixed: Use consistent step naming with hyphens
            updateData['onboardingStatus.currentStep'] = 'team-invites';

            if (stepData.organizationName) {
                updateData.organizationName = stepData.organizationName;
            }
            if (stepData.organizationId) {
                updateData.organizationId = stepData.organizationId;
            }
            if (stepData.organizationData) {
                updateData.organizationData = stepData.organizationData;
            }
            break;

        case 'team-invites':
            updateData['onboardingProgress.teamInvites'] = true;
            updateData['onboardingProgress.teamInvitesComplete'] = true;
            // Fixed: Use consistent step naming with hyphens
            updateData['onboardingStatus.currentStep'] = 'project-creation';

            if (stepData.invitedEmails) {
                updateData['onboardingStatus.invitedEmails'] = stepData.invitedEmails;
                updateData['onboardingStatus.invitedAt'] = new Date().toISOString();
            }
            if (stepData.skipped) {
                updateData['onboardingStatus.teamInvitesSkipped'] = true;
            }
            break;

        case 'project-creation':
            updateData['onboardingProgress.projectCreation'] = true;
            updateData['onboardingProgress.projectCreated'] = true;
            updateData['onboardingStatus.onboardingComplete'] = true;
            updateData['onboardingStatus.completedAt'] = new Date().toISOString();
            updateData['onboardingStatus.currentStep'] = 'complete';
            updateData['setupCompleted'] = true;
            updateData['setupStep'] = 'completed';

            if (stepData.projectName) {
                updateData.defaultProjectName = stepData.projectName;
            }
            if (stepData.projectId) {
                updateData.defaultProjectId = stepData.projectId;
            }
            if (stepData.projectData) {
                updateData.projectData = stepData.projectData;
            }
            break;

        default:
            console.warn('Unknown onboarding step:', stepName);
    }

    return updateData;
};

/**
 * Log onboarding step completion for debugging
 */
export const logStepCompletion = (stepName, stepData, accountType, userUid) => {
    console.log('Onboarding step completed:', {
        step: stepName,
        accountType,
        userUid,
        stepData: stepData ? Object.keys(stepData) : 'none',
        timestamp: new Date().toISOString()
    });
};

/**
 * Get the step component that should be rendered based on current step
 * This helps with navigation between onboarding steps
 */
export const getStepComponent = (currentStep) => {
    const stepMapping = {
        'organization-info': 'OrganizationInfoForm',
        'team-invites': 'TeamInviteForm',
        'project-creation': 'ProjectCreationForm',
        'complete': 'OnboardingComplete'
    };
    
    return stepMapping[currentStep] || 'OrganizationInfoForm';
};

/**
 * Check if a step should be shown based on account type and progress
 */
export const shouldShowStep = (stepName, accountType, onboardingProgress = {}) => {
    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);
    
    if (accountType === 'individual') {
        return stepName === 'project-creation';
    }
    
    if (accountType === 'organization') {
        switch (stepName) {
            case 'organization-info':
                return !normalizedProgress.organizationInfo;
            case 'team-invites':
                return normalizedProgress.organizationInfo && !normalizedProgress.teamInvites;
            case 'project-creation':
                return normalizedProgress.organizationInfo && normalizedProgress.teamInvites && !normalizedProgress.projectCreation;
            default:
                return false;
        }
    }
    
    return false;
};