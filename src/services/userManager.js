// userManager.js - Orchestrates multiple services
import { fetchUserData, updateUserProfile } from './userService.js'
import {
    createUserIfNotExists,
    completeUserSetup,
    updateOnboardingStep,
    completeOnboarding,
    getUserOnboardingStatus
} from './onboardingService.js'
import { getUserPermissions, checkPermission } from './permissionService.js'
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

    return { ...userData, permissions, onboardingStatus }
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
    const canUpdate = currentUserUid === userId || checkPermission(currentUserProfile, 'canManageUsers')

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
    if (userWithPermissions.permissions.canViewTeamMembers) {
        try {
            organizationMembers = await getOrganizationMembers(userWithPermissions)
        } catch (error) {
            console.error('Error fetching organization members:', error)
        }
    }

    return {
        user: userWithPermissions,
        organizationMembers,
        hasTeamAccess: userWithPermissions.permissions.canViewTeamMembers,
        hasAdminAccess: userWithPermissions.permissions.isAdmin
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
    return await updateUserRole(adminUserId, targetUserId, newRole, currentAdminProfile)
}