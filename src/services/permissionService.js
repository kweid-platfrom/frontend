import firestoreService from './firestoreService';
import { getCompleteAccountInfo, getUserCapabilities, canInviteTeamMembers as accountCanInviteTeamMembers } from './accountService';

/**
 * Check if the user has an individual account
 * @param {Object} userProfile - User profile object
 * @returns {boolean} Whether the account is individual
 */
export function isIndividualAccount(userProfile) {
    return userProfile?.accountType === 'individual';
}

/**
 * Check if the user has an organization account
 * @param {Object} userProfile - User profile object
 * @returns {boolean} Whether the account is organization
 */
export function isOrganizationAccount(userProfile) {
    return userProfile?.accountType === 'organization';
}

const PermissionService = {
    /**
     * Check if a user has a specific permission
     * @param {string} userId - User ID
     * @param {string} permission - Permission to check
     * @param {Object} context - Context object containing suiteId or organizationId
     * @returns {Promise<boolean>} Whether the user has the permission
     */
    async hasPermission(userId, permission, context = {}) {
        try {
            const { suiteId, organizationId } = context;
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) {
                return false;
            }

            const { userProfile } = accountInfo.data;

            if (!userProfile || !userProfile.isActive) {
                return false;
            }

            switch (permission) {
                case 'create_suite':
                    const capabilitiesResult = await getUserCapabilities(userId);
                    if (!capabilitiesResult.success) {
                        return false;
                    }
                    return capabilitiesResult.data.remaining.testSuites !== 0;

                case 'view_suite':
                case 'edit_suite':
                case 'delete_suite':
                    if (!suiteId) {
                        return false;
                    }
                    const suite = await firestoreService.getDocument('testSuites', suiteId);
                    if (!suite.success || !suite.data) {
                        return false;
                    }
                    return (
                        suite.data.createdBy === userId ||
                        suite.data.permissions?.[userId] === 'admin' ||
                        (suite.data.ownerType === 'organization' &&
                            userProfile.account_memberships?.some(
                                (m) => m.org_id === suite.data.ownerId && m.status === 'active'
                            ))
                    );

                case 'invite_team_members':
                    const inviteResult = await accountCanInviteTeamMembers(userId);
                    return inviteResult.success && inviteResult.data.canInvite;

                case 'manage_organization':
                    if (!organizationId) {
                        return false;
                    }
                    return userProfile.account_memberships?.some(
                        (m) => m.org_id === organizationId && m.role === 'Admin' && m.status === 'active'
                    );

                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error checking permission ${permission}:`, error);
            return false;
        }
    },

    /**
     * Check if a user has a specific role in an organization
     * @param {string} userId - User ID
     * @param {string} role - Role to check
     * @param {string} organizationId - Organization ID
     * @returns {Promise<boolean>} Whether the user has the role
     */
    async hasRole(userId, role, organizationId) {
        try {
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) {
                return false;
            }

            const { userProfile } = accountInfo.data;
            return userProfile.account_memberships?.some(
                (m) => m.org_id === organizationId && m.role === role && m.status === 'active'
            );
        } catch (error) {
            console.error(`Error checking role ${role}:`, error);
            return false;
        }
    },

    /**
     * Get all permissions for a user
     * @param {string} userId - User ID
     * @param {Object} context - Context object containing suiteId or organizationId
     * @returns {Promise<Object>} User's permissions
     */
    async getUserPermissions(userId, context = {}) {
        try {
            const permissions = {
                canCreateSuite: false,
                canViewSuite: false,
                canEditSuite: false,
                canDeleteSuite: false,
                canInviteTeamMembers: false,
                canManageOrganization: false,
            };

            const { suiteId, organizationId } = context;

            permissions.canCreateSuite = await this.hasPermission(userId, 'create_suite', { suiteId, organizationId });
            permissions.canViewSuite = suiteId
                ? await this.hasPermission(userId, 'view_suite', { suiteId, organizationId })
                : true;
            permissions.canEditSuite = suiteId
                ? await this.hasPermission(userId, 'edit_suite', { suiteId, organizationId })
                : false;
            permissions.canDeleteSuite = suiteId
                ? await this.hasPermission(userId, 'delete_suite', { suiteId, organizationId })
                : false;
            permissions.canInviteTeamMembers = await this.hasPermission(userId, 'invite_team_members', {
                organizationId,
            });
            permissions.canManageOrganization = organizationId
                ? await this.hasPermission(userId, 'manage_organization', { organizationId })
                : false;

            return permissions;
        } catch (error) {
            console.error('Error getting user permissions:', error);
            return {
                canCreateSuite: false,
                canViewSuite: false,
                canEditSuite: false,
                canDeleteSuite: false,
                canInviteTeamMembers: false,
                canManageOrganization: false,
            };
        }
    },

    /**
     * Check if a user can create a new suite
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Whether the user can create a suite
     */
    async canCreateSuite(userId) {
        return this.hasPermission(userId, 'create_suite');
    },

    /**
     * Check if a user can view a suite
     * @param {string} userId - User ID
     * @param {string} suiteId - Suite ID
     * @returns {Promise<boolean>} Whether the user can view the suite
     */
    async canViewSuite(userId, suiteId) {
        return this.hasPermission(userId, 'view_suite', { suiteId });
    },

    /**
     * Check if a user can edit a suite
     * @param {string} userId - User ID
     * @param {string} suiteId - Suite ID
     * @returns {Promise<boolean>} Whether the user can edit the suite
     */
    async canEditSuite(userId, suiteId) {
        return this.hasPermission(userId, 'edit_suite', { suiteId });
    },

    /**
     * Check if a user can delete a suite
     * @param {string} userId - User ID
     * @param {string} suiteId - Suite ID
     * @returns {Promise<boolean>} Whether the user can delete the suite
     */
    async canDeleteSuite(userId, suiteId) {
        return this.hasPermission(userId, 'delete_suite', { suiteId });
    },

    /**
     * Check if a user can invite team members
     * @param {string} userId - User ID
     * @param {string} organizationId - Organization ID
     * @returns {Promise<boolean>} Whether the user can invite team members
     */
    async canInviteTeamMembers(userId, organizationId) {
        return this.hasPermission(userId, 'invite_team_members', { organizationId });
    },

    /**
     * Check if a user can manage an organization
     * @param {string} userId - User ID
     * @param {string} organizationId - Organization ID
     * @returns {Promise<boolean>} Whether the user can manage the organization
     */
    async canManageOrganization(userId, organizationId) {
        return this.hasPermission(userId, 'manage_organization', { organizationId });
    },

    /**
     * Assign a role to a user in an organization
     * @param {string} userId - User ID
     * @param {string} organizationId - Organization ID
     * @param {string} role - Role to assign
     * @returns {Promise<boolean>} Whether the role was assigned successfully
     */
    async assignRole(userId, organizationId, role) {
        try {
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) {
                return false;
            }

            const { userProfile } = accountInfo.data;
            const membership = userProfile.account_memberships?.find(
                (m) => m.org_id === organizationId
            );

            if (!membership) {
                return false;
            }

            const updatedMembership = { ...membership, role, status: 'active' };
            const updatedMemberships = userProfile.account_memberships.map((m) =>
                m.org_id === organizationId ? updatedMembership : m
            );

            const result = await firestoreService.updateUserProfile(userId, {
                account_memberships: updatedMemberships,
            });

            return result.success;
        } catch (error) {
            console.error('Error assigning role:', error);
            return false;
        }
    },

    /**
     * Remove a role from a user in an organization
     * @param {string} userId - User ID
     * @param {string} organizationId - Organization ID
     * @returns {Promise<boolean>} Whether the role was removed successfully
     */
    async removeRole(userId, organizationId) {
        try {
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) {
                return false;
            }

            const { userProfile } = accountInfo.data;
            const updatedMemberships = userProfile.account_memberships?.filter(
                (m) => m.org_id !== organizationId
            );

            const result = await firestoreService.updateUserProfile(userId, {
                account_memberships: updatedMemberships,
            });

            return result.success;
        } catch (error) {
            console.error('Error removing role:', error);
            return false;
        }
    },
};

export default PermissionService;
export { isIndividualAccount, isOrganizationAccount };