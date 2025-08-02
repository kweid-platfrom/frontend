/**
 * Suite validation utilities
 */

/**
 * Validates suite access and permissions
 * @param {Object} suite - Suite object
 * @param {Object} user - Authenticated user
 * @param {Object} userProfile - User profile
 * @param {string} requiredPermission - Required permission level
 * @returns {Object} Validation result
 */
export const validateSuiteAccess = (suite, user, userProfile, requiredPermission = 'read') => {
    if (!suite) return { isValid: false, error: 'No suite selected', code: 'NO_SUITE_SELECTED' };
    if (!user) return { isValid: false, error: 'User not authenticated', code: 'USER_NOT_AUTHENTICATED' };
    if (!suite.suite_id) return { isValid: false, error: 'Invalid suite - missing ID', code: 'INVALID_SUITE_ID' };

    const permissionCheck = checkSuitePermissions(suite, user.uid, userProfile, requiredPermission);
    return permissionCheck.isValid
        ? { isValid: true, error: null, code: 'VALID', permission: permissionCheck.permission }
        : permissionCheck;
};

const permissionHierarchy = {
    admin: ['read', 'write', 'admin'],
    write: ['read', 'write'],
    read: ['read']
};

/**
 * Checks user permissions for a suite
 * @param {Object} suite - Suite object
 * @param {string} userId - User ID
 * @param {Object} userProfile - User profile
 * @param {string} requiredPermission - Required permission
 * @returns {Object} Permission check result
 */
export const checkSuitePermissions = (suite, userId, userProfile, requiredPermission = 'read') => {
    if (!suite || !userId) return { isValid: false, error: 'Missing suite or user', code: 'MISSING_PARAMETERS' };

    let userPermission = 'none';
    if (suite.ownerId === userId || suite.access_control?.owner_id === userId) userPermission = 'admin';
    else if (suite.access_control?.admins?.includes(userId)) userPermission = 'admin';
    else if (suite.access_control?.permissions_matrix?.[userId]) userPermission = suite.access_control.permissions_matrix[userId];
    else if (suite.access_control?.members?.includes(userId)) userPermission = 'read';
    else if (suite.accountType === 'organization' && suite.organizationId && userProfile?.account_memberships) {
        const membership = userProfile.account_memberships.find(m => m.org_id === suite.organizationId && m.status === 'active');
        if (membership) userPermission = mapOrgRoleToPermission(membership.role);
    }

    const hasAccess = permissionHierarchy[userPermission]?.includes(requiredPermission);
    return {
        isValid: hasAccess,
        permission: userPermission,
        code: hasAccess ? 'PERMISSION_GRANTED' : 'INSUFFICIENT_PERMISSION',
        error: hasAccess ? null : 'Access denied'
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
 * Validates suite for specific actions
 * @param {Object} suite - Suite to validate
 * @param {Object} user - Current user
 * @param {Object} userProfile - User profile
 * @param {string} action - Action being performed
 * @returns {Object} Validation result
 */
export const validateSuiteForAction = (suite, user, userProfile, action) => {
    const actionRequirements = {
        view: 'read',
        read: 'read',
        create: 'write',
        edit: 'write',
        update: 'write',
        delete: 'admin',
        manage: 'admin',
        invite: 'admin',
        settings: 'admin'
    };

    const requiredPermission = actionRequirements[action?.toLowerCase()] || 'read';
    const validation = validateSuiteAccess(suite, user, userProfile, requiredPermission);
    
    if (!validation.isValid) {
        return {
            isValid: false,
            error: `Insufficient permissions to ${action} in this suite`,
            code: 'INSUFFICIENT_PERMISSION_FOR_ACTION',
            requiredPermission,
            userPermission: validation.permission
        };
    }

    return {
        isValid: true,
        error: null,
        code: 'ACTION_AUTHORIZED',
        permission: validation.permission
    };
};