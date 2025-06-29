// utils/suiteValidation.js
/**
 * Suite validation utilities for ensuring a suite is selected before allowing suite-specific actions
 */

/**
 * Validates if a suite is properly selected and accessible
 * @param {Object} suite - The suite object to validate
 * @param {Object} user - Current authenticated user
 * @param {Object} userProfile - User profile information
 * @returns {Object} Validation result with isValid boolean and error message
 */
export const validateSuiteAccess = (suite, user, userProfile) => {
    // Check if suite exists
    if (!suite) {
        return {
            isValid: false,
            error: 'No suite selected',
            code: 'NO_SUITE_SELECTED'
        };
    }

    // Check if user is authenticated
    if (!user) {
        return {
            isValid: false,
            error: 'User not authenticated',
            code: 'USER_NOT_AUTHENTICATED'
        };
    }

    // Check if suite has required properties
    if (!suite.suite_id) {
        return {
            isValid: false,
            error: 'Invalid suite - missing ID',
            code: 'INVALID_SUITE_ID'
        };
    }

    // Check if user has access to this suite
    const hasAccess = checkSuitePermissions(suite, user.uid, userProfile);
    if (!hasAccess.isValid) {
        return hasAccess;
    }

    return {
        isValid: true,
        error: null,
        code: 'VALID'
    };
};

/**
 * Checks if user has specific permissions for a suite
 * @param {Object} suite - The suite object
 * @param {string} userId - User ID
 * @param {Object} userProfile - User profile
 * @param {string} requiredPermission - Required permission level ('read', 'write', 'admin')
 * @returns {Object} Permission check result
 */
export const checkSuitePermissions = (suite, userId, userProfile, requiredPermission = 'read') => {
    if (!suite || !userId) {
        return {
            isValid: false,
            error: 'Missing suite or user information',
            code: 'MISSING_PARAMETERS'
        };
    }

    // Check if user is the owner
    if (suite.ownerId === userId || suite.access_control?.owner_id === userId) {
        return {
            isValid: true,
            permission: 'admin',
            code: 'OWNER_ACCESS'
        };
    }

    // Check if user is in admins list
    if (suite.access_control?.admins?.includes(userId)) {
        return {
            isValid: true,
            permission: 'admin',
            code: 'ADMIN_ACCESS'
        };
    }

    // Check permissions matrix
    const userPermission = suite.access_control?.permissions_matrix?.[userId];
    if (userPermission) {
        const hasRequiredLevel = checkPermissionLevel(userPermission, requiredPermission);
        return {
            isValid: hasRequiredLevel,
            permission: userPermission,
            code: hasRequiredLevel ? 'PERMISSION_GRANTED' : 'INSUFFICIENT_PERMISSION'
        };
    }

    // Check organization membership for org suites
    if (suite.accountType === 'organization' && suite.organizationId && userProfile?.account_memberships) {
        const orgMembership = userProfile.account_memberships.find(
            membership => membership.org_id === suite.organizationId && membership.status === 'active'
        );

        if (orgMembership) {
            const orgPermission = mapOrgRoleToPermission(orgMembership.role);
            const hasRequiredLevel = checkPermissionLevel(orgPermission, requiredPermission);
            return {
                isValid: hasRequiredLevel,
                permission: orgPermission,
                code: hasRequiredLevel ? 'ORG_MEMBER_ACCESS' : 'INSUFFICIENT_ORG_PERMISSION'
            };
        }
    }

    // Check if user is in members list (basic read access)
    if (suite.access_control?.members?.includes(userId)) {
        const hasRequiredLevel = checkPermissionLevel('read', requiredPermission);
        return {
            isValid: hasRequiredLevel,
            permission: 'read',
            code: hasRequiredLevel ? 'MEMBER_ACCESS' : 'MEMBER_READ_ONLY'
        };
    }

    return {
        isValid: false,
        error: 'Access denied - user not authorized for this suite',
        code: 'ACCESS_DENIED'
    };
};

/**
 * Maps organization role to permission level
 * @param {string} orgRole - Organization role
 * @returns {string} Permission level
 */
const mapOrgRoleToPermission = (orgRole) => {
    switch (orgRole?.toLowerCase()) {
        case 'admin':
        case 'owner':
            return 'admin';
        case 'member':
        case 'editor':
            return 'write';
        case 'viewer':
            return 'read';
        default:
            return 'read';
    }
};

/**
 * Checks if user permission level meets required level
 * @param {string} userLevel - User's permission level
 * @param {string} requiredLevel - Required permission level
 * @returns {boolean} Whether user has sufficient permissions
 */
const checkPermissionLevel = (userLevel, requiredLevel) => {
    const levels = {
        'read': 1,
        'write': 2,
        'admin': 3
    };

    const userLevelNum = levels[userLevel?.toLowerCase()] || 0;
    const requiredLevelNum = levels[requiredLevel?.toLowerCase()] || 0;

    return userLevelNum >= requiredLevelNum;
};

/**
 * Validates suite before performing specific actions
 * @param {Object} suite - Suite to validate
 * @param {Object} user - Current user
 * @param {Object} userProfile - User profile
 * @param {string} action - Action being performed
 * @returns {Object} Validation result
 */
export const validateSuiteForAction = (suite, user, userProfile, action) => {
    // First validate basic suite access
    const basicValidation = validateSuiteAccess(suite, user, userProfile);
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    // Define action requirements
    const actionRequirements = {
        'view': 'read',
        'read': 'read',
        'create': 'write',
        'edit': 'write',
        'update': 'write',
        'delete': 'admin',
        'manage': 'admin',
        'invite': 'admin',
        'settings': 'admin'
    };

    const requiredPermission = actionRequirements[action?.toLowerCase()] || 'read';

    // Check specific permission for action
    const permissionCheck = checkSuitePermissions(suite, user.uid, userProfile, requiredPermission);
    
    if (!permissionCheck.isValid) {
        return {
            isValid: false,
            error: `Insufficient permissions to ${action} in this suite`,
            code: 'INSUFFICIENT_PERMISSION_FOR_ACTION',
            requiredPermission,
            userPermission: permissionCheck.permission
        };
    }

    return {
        isValid: true,
        error: null,
        code: 'ACTION_AUTHORIZED',
        permission: permissionCheck.permission
    };
};

/**
 * React hook for suite validation
 * @param {Object} suite - Current suite
 * @param {Object} user - Current user
 * @param {Object} userProfile - User profile
 * @returns {Object} Validation utilities
 */
export const useSuiteValidation = (suite, user, userProfile) => {
    const validateAccess = () => validateSuiteAccess(suite, user, userProfile);
    
    const validateAction = (action) => validateSuiteForAction(suite, user, userProfile, action);
    
    const hasPermission = (permission = 'read') => {
        const check = checkSuitePermissions(suite, user?.uid, userProfile, permission);
        return check.isValid;
    };

    const canPerformAction = (action) => {
        const validation = validateAction(action);
        return validation.isValid;
    };

    return {
        isValid: validateAccess().isValid,
        validateAccess,
        validateAction,
        hasPermission,
        canPerformAction,
        suite,
        user,
        userProfile
    };
};