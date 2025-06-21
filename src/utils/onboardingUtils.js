
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

        // Project creation is now optional for organizations - they can create from dashboard
        projectCreation: progress.projectCreation || progress.projectCreated || false,

        // Keep original fields for backward compatibility
        ...progress
    };
};

/**
 * Initialize onboarding status structure based on account type
 * Updated: Handle invited users who should bypass onboarding
 */
export const initializeOnboardingStatus = (accountType, isInvitedUser = false) => {
    const baseStatus = {
        onboardingComplete: isInvitedUser, // Invited users complete onboarding immediately
        // Fixed: Use consistent step naming with hyphens
        currentStep: isInvitedUser ? 'complete' : (accountType === 'organization' ? 'organization-info' : 'project-creation'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stepsCompleted: isInvitedUser ? ['invited-user-bypass'] : [],
        joinedViaInvite: isInvitedUser // Track if user joined via invitation
    };

    if (isInvitedUser) {
        // Invited users bypass all onboarding steps
        return {
            ...baseStatus,
            completedAt: new Date().toISOString()
        };
    }

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
            invitedEmails: [],
            teamInvitesSkipped: false
        };
    }

    return baseStatus;
};

/**
 * Initialize onboarding progress structure based on account type
 * Updated: Handle invited users who should bypass onboarding
 */
export const initializeOnboardingProgress = (accountType, isInvitedUser = false) => {
    const baseProgress = {
        emailVerified: false,
        profileSetup: false
    };

    if (isInvitedUser) {
        // Invited users have all progress marked as complete
        if (accountType === 'individual') {
            return {
                ...baseProgress,
                projectCreation: true,
                projectCreated: true,
                joinedViaInvite: true
            };
        } else if (accountType === 'organization') {
            return {
                ...baseProgress,
                organizationInfo: true,
                organizationInfoComplete: true,
                teamInvites: true,
                teamInvitesComplete: true,
                joinedViaInvite: true
            };
        }
    }

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
            teamInvitesComplete: false // Keep both for compatibility
            // Note: Removed projectCreation as it's now optional for organizations
        };
    }

    return baseProgress;
};

/**
 * Check if onboarding is complete based on account type and status
 * Updated: Invited users always have completed onboarding
 */
export const isOnboardingComplete = (accountType, onboardingProgress = {}, onboardingStatus = {}) => {
    // Check if user joined via invite - they bypass onboarding entirely
    if (onboardingStatus.joinedViaInvite || onboardingProgress.joinedViaInvite) {
        return true;
    }

    // Check status first for explicit completion flag
    if (onboardingStatus.onboardingComplete) return true;

    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);

    if (accountType === 'individual') {
        // Individuals still need to create a project to complete onboarding
        return normalizedProgress.projectCreation;
    } else if (accountType === 'organization') {
        // Organizations complete onboarding after organization info and team invites
        // Project creation is now optional and can be done from dashboard
        return normalizedProgress.organizationInfo &&
            (normalizedProgress.teamInvites || onboardingStatus.teamInvitesSkipped);
    }

    return false;
};

/**
 * Check if user should see onboarding flow
 * Updated: Invited users never see onboarding
 */
export const shouldShowOnboarding = (accountType, onboardingProgress = {}, onboardingStatus = {}) => {
    // Users who joined via invite never see onboarding
    if (onboardingStatus.joinedViaInvite || onboardingProgress.joinedViaInvite) {
        return false;
    }

    // Check URL parameters for invite bypass flags
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('fromInvite') || urlParams.has('welcomed')) {
            return false;
        }
    }

    // Standard onboarding completion check
    return !isOnboardingComplete(accountType, onboardingProgress, onboardingStatus);
};

/**
 * Get next onboarding step for account type
 * Updated: Invited users have no next steps
 */
export const getNextOnboardingStep = (accountType, onboardingProgress = {}, onboardingStatus = {}) => {
    // Users who joined via invite don't have onboarding steps
    if (onboardingStatus.joinedViaInvite || onboardingProgress.joinedViaInvite) {
        return null;
    }

    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);

    if (accountType === 'individual') {
        if (!normalizedProgress.projectCreation) return 'project-creation';
        return null; // Onboarding complete
    } else if (accountType === 'organization') {
        if (!normalizedProgress.organizationInfo) return 'organization-info';
        if (!normalizedProgress.teamInvites && !onboardingStatus.teamInvitesSkipped) return 'team-invites';
        return null; // Onboarding complete - no project creation step required
    }

    return null;
};

/**
 * Get onboarding progress percentage for display
 * Updated: Invited users show 100% progress
 */
export const getOnboardingProgress = (accountType, progress = {}, status = {}) => {
    // Users who joined via invite show 100% progress
    if (status.joinedViaInvite || progress.joinedViaInvite) {
        return 100;
    }

    const normalizedProgress = normalizeOnboardingProgress(progress);

    if (accountType === 'individual') {
        const steps = ['projectCreation'];
        const completed = steps.filter(step => normalizedProgress[step]).length;
        return Math.round((completed / steps.length) * 100);
    } else if (accountType === 'organization') {
        // Only 2 steps for organizations: org info and team invites
        const steps = ['organizationInfo', 'teamInvites'];
        let completed = 0;

        if (normalizedProgress.organizationInfo) completed++;
        if (normalizedProgress.teamInvites || status.teamInvitesSkipped) completed++;

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
        'profile-setup': 'Profile Setup',
        'unified-organization': 'Organization Setup',
        'complete': 'Setup Complete',
        'invited-user-bypass': 'Joined via Invitation'
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
 * Updated: Handle invited user bypass
 */
export const createStepUpdateData = (stepName, stepData = {}, accountType = null) => {
    const updateData = {
        updatedAt: new Date().toISOString()
    };

    // Handle invited user bypass
    if (stepName === 'invited-user-bypass' || stepData.joinedViaInvite) {
        updateData['onboardingStatus.onboardingComplete'] = true;
        updateData['onboardingStatus.completedAt'] = new Date().toISOString();
        updateData['onboardingStatus.currentStep'] = 'complete';
        updateData['onboardingStatus.joinedViaInvite'] = true;
        updateData['onboardingStatus.stepsCompleted'] = ['invited-user-bypass'];
        updateData['setupCompleted'] = true;
        updateData['setupStep'] = 'completed';

        // Mark all relevant progress as complete based on account type
        if (accountType === 'individual') {
            updateData['onboardingProgress.projectCreation'] = true;
            updateData['onboardingProgress.projectCreated'] = true;
        } else if (accountType === 'organization') {
            updateData['onboardingProgress.organizationInfo'] = true;
            updateData['onboardingProgress.organizationInfoComplete'] = true;
            updateData['onboardingProgress.teamInvites'] = true;
            updateData['onboardingProgress.teamInvitesComplete'] = true;
        }

        updateData['onboardingProgress.joinedViaInvite'] = true;
        return updateData;
    }

    switch (stepName) {
        case 'organization-info':
            updateData['onboardingProgress.organizationInfo'] = true;
            updateData['onboardingProgress.organizationInfoComplete'] = true;
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

            // For organizations, complete onboarding after team invites
            updateData['onboardingStatus.onboardingComplete'] = true;
            updateData['onboardingStatus.completedAt'] = new Date().toISOString();
            updateData['onboardingStatus.currentStep'] = 'complete';
            updateData['setupCompleted'] = true;
            updateData['setupStep'] = 'completed';

            if (stepData.invitedEmails) {
                updateData['onboardingStatus.invitedEmails'] = stepData.invitedEmails;
                updateData['onboardingStatus.invitedAt'] = new Date().toISOString();
            }
            if (stepData.skipped) {
                updateData['onboardingStatus.teamInvitesSkipped'] = true;
                updateData['onboardingProgress.teamInvitesSkipped'] = true;
            }
            break;

        case 'project-creation':
            // This is now only for individual accounts
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

        // Handle unified organization onboarding completion
        case 'unified-organization':
            updateData['onboardingProgress.organizationInfo'] = true;
            updateData['onboardingProgress.organizationInfoComplete'] = true;
            updateData['onboardingProgress.teamInvites'] = true;
            updateData['onboardingProgress.teamInvitesComplete'] = true;

            // Complete onboarding for organizations
            updateData['onboardingStatus.onboardingComplete'] = true;
            updateData['onboardingStatus.completedAt'] = new Date().toISOString();
            updateData['onboardingStatus.currentStep'] = 'complete';
            updateData['setupCompleted'] = true;
            updateData['setupStep'] = 'completed';

            if (stepData.organizationName) {
                updateData.organizationName = stepData.organizationName;
            }
            if (stepData.organizationId) {
                updateData.organizationId = stepData.organizationId;
            }
            if (stepData.organizationData) {
                updateData.organizationData = stepData.organizationData;
            }
            if (stepData.invitedEmails) {
                updateData['onboardingStatus.invitedEmails'] = stepData.invitedEmails;
                updateData['onboardingStatus.invitedAt'] = new Date().toISOString();
            }
            if (stepData.teamInvitesSkipped) {
                updateData['onboardingStatus.teamInvitesSkipped'] = true;
                updateData['onboardingProgress.teamInvitesSkipped'] = true;
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
 * Updated: Handle invited user bypass
 */
export const getStepComponent = (currentStep) => {
    const stepMapping = {
        'organization-info': 'OrganizationInfoForm',
        'team-invites': 'TeamInviteForm',
        'project-creation': 'ProjectCreationForm',
        'unified-organization': 'UnifiedOrganizationOnboarding',
        'complete': 'OnboardingComplete',
        'invited-user-bypass': 'OnboardingComplete'
    };

    return stepMapping[currentStep] || 'OrganizationInfoForm';
};

/**
 * Check if a step should be shown based on account type and progress
 * Updated: Invited users don't see any onboarding steps
 */
export const shouldShowStep = (stepName, accountType, onboardingProgress = {}, onboardingStatus = {}) => {
    // Users who joined via invite don't see any onboarding steps
    if (onboardingStatus.joinedViaInvite || onboardingProgress.joinedViaInvite) {
        return false;
    }

    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);

    if (accountType === 'individual') {
        return stepName === 'project-creation';
    }

    if (accountType === 'organization') {
        switch (stepName) {
            case 'organization-info':
                return !normalizedProgress.organizationInfo;
            case 'team-invites':
                return normalizedProgress.organizationInfo &&
                    !normalizedProgress.teamInvites &&
                    !onboardingStatus.teamInvitesSkipped;
            case 'unified-organization':
                // Show unified flow if either step is not complete
                return !normalizedProgress.organizationInfo ||
                    (!normalizedProgress.teamInvites && !onboardingStatus.teamInvitesSkipped);
            case 'project-creation':
                // Organizations don't need this step anymore
                return false;
            default:
                return false;
        }
    }

    return false;
};

/**
 * Check if user can create projects (for dashboard display logic)
 * Updated: Invited users can always create projects
 */
export const canCreateProjects = (accountType, onboardingProgress = {}, onboardingStatus = {}) => {
    // Users who joined via invite can always create projects
    if (onboardingStatus.joinedViaInvite || onboardingProgress.joinedViaInvite) {
        return true;
    }

    if (accountType === 'individual') {
        // Individuals must complete onboarding first
        return isOnboardingComplete(accountType, onboardingProgress, onboardingStatus);
    } else if (accountType === 'organization') {
        // Organizations can create projects after completing organization setup
        const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);
        return normalizedProgress.organizationInfo &&
            (normalizedProgress.teamInvites || onboardingStatus.teamInvitesSkipped);
    }

    return false;
};

/**
 * Check if user should see "Create First Project" CTA on dashboard
 * Updated: Invited users see CTA if they don't have projects
 */
export const shouldShowCreateProjectCTA = (accountType, onboardingProgress = {}, onboardingStatus = {}, hasProjects = false) => {
    // Don't show if user already has projects
    if (hasProjects) return false;

    // Show if user can create projects but hasn't created any yet
    return canCreateProjects(accountType, onboardingProgress, onboardingStatus);
};

/**
 * Create user data structure for invited users
 * This ensures invited users have the correct onboarding bypass flags
 */
export const createInvitedUserData = (userData, accountType = 'organization') => {
    return {
        ...userData,
        joinedViaInvite: true,
        onboardingComplete: true,
        setupCompleted: true,
        setupStep: 'completed',
        onboardingStatus: initializeOnboardingStatus(accountType, true),
        onboardingProgress: initializeOnboardingProgress(accountType, true),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};