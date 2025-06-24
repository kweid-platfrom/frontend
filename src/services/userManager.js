// userManager.js - Orchestrates multiple services
import { fetchUserData, updateUserProfile } from './userService.js'
import {
    createUserIfNotExists,
    completeUserSetup,
    updateOnboardingStep,
    completeOnboarding,
    getUserOnboardingStatus
} from './onboardingService.js'
import {
    getUserPermissions,
    checkPermission,
    hasPermission,
    PERMISSIONS,
    getVisibleTabs,
    createPermissionChecker
} from './permissionService.js'
import { updateUserRole, getOrganizationMembers } from './organizationService.js'

/**
 * Fetch user data with permissions and onboarding status
 * @param {string} userId - User ID to fetch
 * @returns {Object|null} - User data with permissions and onboarding status
 */
export const fetchUserDataWithPermissions = async (userId) => {
    const userData = await fetchUserData(userId)
    if (!userData) return null

    const permissions = getUserPermissions(userData)
    const onboardingStatus = await getUserOnboardingStatus(userId)
    const visibleTabs = getVisibleTabs(userData)

    return {
        ...userData,
        permissions,
        onboardingStatus,
        visibleTabs,
        // Add permission checker for easy component use
        permissionChecker: createPermissionChecker(userData)
    }
}

/**
 * Create user if not exists - orchestrates user creation and onboarding setup
 * @param {Object} firebaseUser - Firebase auth user
 * @param {Object} additionalData - Additional user data
 * @param {string} source - Registration source
 * @returns {Object} - Result with user data and setup status
 */
export const createUserIfNotExists = async (firebaseUser, additionalData = {}, source = 'auth') => {
    return await createUserIfNotExists(firebaseUser, additionalData, source)
}

/**
 * Complete user setup - orchestrates profile completion and onboarding
 * @param {string} userId - User ID
 * @param {Object} setupData - Setup data
 * @returns {Object} - Updated user data
 */
export const completeUserSetup = async (userId, setupData) => {
    return await completeUserSetup(userId, setupData)
}

/**
 * Update onboarding step - coordinates user service with onboarding progress
 * @param {string} userId - User ID
 * @param {string} stepName - Step name
 * @param {boolean} completed - Whether step is completed
 * @param {Object} stepData - Step data
 * @returns {Object} - Updated user data
 */
export const updateOnboardingStep = async (userId, stepName, completed = true, stepData = {}) => {
    return await updateOnboardingStep(userId, stepName, completed, stepData)
}

/**
 * Complete onboarding - final orchestration of setup completion
 * @param {string} userId - User ID
 * @param {Object} completionData - Completion data
 * @returns {boolean} - Success status
 */
export const completeOnboarding = async (userId, completionData = {}) => {
    return await completeOnboarding(userId, completionData)
}

/**
 * Update user with permission check
 * @param {string} userId - User ID to update
 * @param {Object} updateData - Data to update
 * @param {string} currentUserUid - Current user's UID
 * @param {Object} currentUserProfile - Current user's profile for permission check
 * @returns {Object} - Updated user data
 */
export const updateUserWithPermissionCheck = async (userId, updateData, currentUserUid, currentUserProfile) => {
    // Check if user can update this profile
    // Support both legacy permission checking and new permission constants
    const canUpdate = currentUserUid === userId ||
        checkPermission(currentUserProfile, 'canManageUsers') ||
        hasPermission(currentUserProfile, PERMISSIONS.MANAGE_USERS)

    if (!canUpdate) {
        throw new Error('You do not have permission to update this profile')
    }

    return await updateUserProfile(userId, updateData, currentUserUid)
}

/**
 * Get user dashboard data - orchestrates multiple data sources
 * @param {string} userId - User ID
 * @returns {Object} - Complete dashboard data
 */
export const getUserDashboardData = async (userId) => {
    const userWithPermissions = await fetchUserDataWithPermissions(userId)
    if (!userWithPermissions) return null

    let organizationMembers = null
    // Use both legacy and new permission checking for backward compatibility
    const canViewTeam = userWithPermissions.permissions.canViewTeamMembers ||
        hasPermission(userWithPermissions, PERMISSIONS.VIEW_TEAM_MEMBERS)

    if (canViewTeam) {
        try {
            organizationMembers = await getOrganizationMembers(userWithPermissions)
        } catch (error) {
            console.error('Error fetching organization members:', error)
        }
    }

    return {
        user: userWithPermissions,
        organizationMembers,
        hasTeamAccess: canViewTeam,
        hasAdminAccess: userWithPermissions.permissions.isAdmin,
        // Additional dashboard permissions
        canViewAnalytics: hasPermission(userWithPermissions, PERMISSIONS.VIEW_ANALYTICS),
        canViewReports: hasPermission(userWithPermissions, PERMISSIONS.VIEW_REPORTS),
        canViewBilling: hasPermission(userWithPermissions, PERMISSIONS.VIEW_BILLING),
        canManageOrganization: hasPermission(userWithPermissions, PERMISSIONS.MANAGE_ORGANIZATION)
    }
}

/**
 * Handle role update with full validation
 * @param {string} adminUserId - Admin user ID
 * @param {string} targetUserId - Target user ID
 * @param {string} newRole - New role to assign
 * @param {Object} currentAdminProfile - Admin's profile
 * @returns {Object} - Updated user data
 */
export const handleRoleUpdate = async (adminUserId, targetUserId, newRole, currentAdminProfile) => {
    // Enhanced permission check for role updates
    const canManageRoles = checkPermission(currentAdminProfile, 'canAssignPermissions') ||
        hasPermission(currentAdminProfile, PERMISSIONS.MANAGE_ROLES)

    if (!canManageRoles) {
        throw new Error('You do not have permission to manage user roles')
    }

    return await updateUserRole(adminUserId, targetUserId, newRole, currentAdminProfile)
}

/**
 * Get user navigation data - determines what navigation items user can see
 * @param {Object} userProfile - User profile
 * @returns {Object} - Navigation configuration
 */
export const getUserNavigationData = (userProfile) => {
    if (!userProfile) return { visibleTabs: {}, permissions: {} }

    const visibleTabs = getVisibleTabs(userProfile)
    const permissions = getUserPermissions(userProfile)

    return {
        visibleTabs,
        permissions,
        navigationItems: {
            showDashboard: visibleTabs.dashboard,
            showAnalytics: visibleTabs.analytics,
            showSettings: visibleTabs.settings,
            showAdmin: visibleTabs.admin,
            showBilling: visibleTabs.billing,
            showReports: visibleTabs.reports,
            showUsers: visibleTabs.users,
            showSubscription: visibleTabs.subscription,
            showUserManagement: visibleTabs.userManagement
        }
    }
}

/**
 * Validate user action permissions
 * @param {Object} userProfile - User profile
 * @param {string} action - Action to validate
 * @param {Object} context - Additional context for validation
 * @returns {boolean} - Whether action is permitted
 */
export const validateUserAction = (userProfile, action = {}) => {
    if (!userProfile) return false

    switch (action) {
        case 'invite_user':
            return checkPermission(userProfile, 'canInviteUsers') ||
                hasPermission(userProfile, PERMISSIONS.INVITE_USERS)

        case 'remove_user':
            return checkPermission(userProfile, 'canManageUsers') ||
                hasPermission(userProfile, PERMISSIONS.REMOVE_USERS)

        case 'modify_organization':
            return checkPermission(userProfile, 'canModifyOrganization') ||
                hasPermission(userProfile, PERMISSIONS.MODIFY_ORGANIZATION)

        case 'view_billing':
            return checkPermission(userProfile, 'canViewSubscription') ||
                hasPermission(userProfile, PERMISSIONS.VIEW_BILLING)

        case 'manage_subscriptions':
            return hasPermission(userProfile, PERMISSIONS.MANAGE_SUBSCRIPTIONS)

        case 'create_content':
            return hasPermission(userProfile, PERMISSIONS.CREATE_CONTENT)

        case 'edit_content':
            return hasPermission(userProfile, PERMISSIONS.EDIT_CONTENT)

        case 'publish_content':
            return hasPermission(userProfile, PERMISSIONS.PUBLISH_CONTENT)

        case 'delete_content':
            return hasPermission(userProfile, PERMISSIONS.DELETE_CONTENT)

        default:
            return false
    }
}

/**
 * Get comprehensive user context for components
 * @param {string} userId - User ID
 * @returns {Object} - Complete user context
 */
export const getUserContext = async (userId) => {
    const userWithPermissions = await fetchUserDataWithPermissions(userId)
    if (!userWithPermissions) return null

    const navigationData = getUserNavigationData(userWithPermissions)

    return {
        ...userWithPermissions,
        ...navigationData,
        // Helper functions for components
        canPerform: (action, context) => validateUserAction(userWithPermissions, action, context),
        hasAccess: (permission) => checkPermission(userWithPermissions, permission) ||
            hasPermission(userWithPermissions, permission)
    }
}