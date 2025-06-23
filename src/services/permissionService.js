// permissionService.js - Role-based access control

/**
 * Check if user has admin role
 */
export const isAdmin = (userProfile) => {
    if (!userProfile) return false;

    // Check if user has admin role
    const roles = userProfile.role || [];
    return Array.isArray(roles)
        ? roles.includes('admin')
        : roles === 'admin';
};

/**
 * Check if user is a member (non-admin)
 */
export const isMember = (userProfile) => {
    if (!userProfile) return false;

    const roles = userProfile.role || [];
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes('member') && !roleArray.includes('admin');
};

/**
 * Check if user has organization account
 */
export const isOrganizationAccount = (userProfile) => {
    return userProfile?.accountType === 'organization' || userProfile?.userType === 'organization';
};

/**
 * Check if user has individual account
 */
export const isIndividualAccount = (userProfile) => {
    return userProfile?.accountType === 'individual' || userProfile?.userType === 'individual';
};

/**
 * Get user permissions based on role and account type
 * This is the main function to check before rendering components
 */
export const getUserPermissions = (userProfile) => {
    if (!userProfile) {
        return {
            canViewSubscription: false,
            canManageUsers: false,
            canAssignPermissions: false,
            canViewUserManagement: false,
            canViewTeamMembers: false,
            canModifyOrganization: false,
            canInviteUsers: false,
            isAdmin: false,
            isMember: false,
            isOrganization: false,
            isIndividual: false
        };
    }

    const userIsAdmin = isAdmin(userProfile);
    const userIsMember = isMember(userProfile);
    const isOrgAccount = isOrganizationAccount(userProfile);
    const isIndAccount = isIndividualAccount(userProfile);

    return {
        // Subscription page access - only admins
        canViewSubscription: userIsAdmin,

        // User management - only organization admins
        canManageUsers: userIsAdmin && isOrgAccount,

        // Permission assignment - only organization admins
        canAssignPermissions: userIsAdmin && isOrgAccount,

        // User management page access - only organization accounts
        canViewUserManagement: isOrgAccount,

        // Team members viewing - organization accounts only
        canViewTeamMembers: isOrgAccount,

        // Organization modification - only organization admins
        canModifyOrganization: userIsAdmin && isOrgAccount,

        // User invitation - only organization admins
        canInviteUsers: userIsAdmin && isOrgAccount,

        // Role information
        isAdmin: userIsAdmin,
        isMember: userIsMember,
        isOrganization: isOrgAccount,
        isIndividual: isIndAccount,

        // Account info
        accountType: userProfile.accountType || userProfile.userType || 'individual',
        organizationId: userProfile.organizationId || null
    };
};

/**
 * Check specific permission before allowing action
 */
export const checkPermission = (userProfile, permissionKey) => {
    const permissions = getUserPermissions(userProfile);
    return permissions[permissionKey] || false;
};

/**
 * Middleware function to check permissions before component render
 * Use this in your components to conditionally render based on permissions
 */
export const withPermissionCheck = (userProfile, requiredPermissions = []) => {
    if (!userProfile) return { hasAccess: false, permissions: null };

    const permissions = getUserPermissions(userProfile);

    // If no specific permissions required, just return the permissions
    if (requiredPermissions.length === 0) {
        return { hasAccess: true, permissions };
    }

    // Check if user has all required permissions
    const hasAccess = requiredPermissions.every(permission => permissions[permission]);

    return { hasAccess, permissions };
};