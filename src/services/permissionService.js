import firestoreService from './firestoreService';
import { getCompleteAccountInfo, getUserCapabilities } from './accountService';
import subscriptionService from './subscriptionService';

export function isIndividualAccount(userProfile) {
    return userProfile?.accountType === 'individual';
}

export function isOrganizationAccount(userProfile) {
    return userProfile?.accountType === 'organization';
}

const PermissionService = {
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

            const subscription = await subscriptionService.getSubscription(userId);
            if (!subscription.success) {
                return false;
            }

            // Check feature access for free tier
            const restrictedFeatures = ['test_cases', 'reports', 'automation', 'team_management'];
            if (subscription.data.isTrialActive || subscriptionService.isPaidPlan(userProfile.subscriptionPlan)) {
                // Trial or paid plans have full access
            } else {
                // Free tier restrictions
                if (restrictedFeatures.includes(permission)) {
                    return false;
                }
                if (permission === 'invite_team_members' && isOrganizationAccount(userProfile)) {
                    return false;
                }
            }

            switch (permission) {
                case 'create_suite':
                    const suiteCheck = await getUserCapabilities(userId);
                    if (!suiteCheck.success) return false;
                    return suiteCheck.data.remaining.testSuites !== 0;

                case 'view_suite':
                case 'edit_suite':
                case 'delete_suite':
                    if (!suiteId) return false;
                    const suite = await firestoreService.getDocument('testSuites', suiteId);
                    if (!suite.success || !suite.data) return false;
                    return (
                        suite.data.createdBy === userId ||
                        suite.data.permissions?.[userId] === 'admin' ||
                        (suite.data.ownerType === 'organization' &&
                            userProfile.account_memberships?.some(
                                (m) => m.org_id === suite.data.ownerId && m.status === 'active'
                            ))
                    );

                case 'invite_team_members':
                    if (isIndividualAccount(userProfile)) return false;
                    const inviteCheck = await getUserCapabilities(userId);
                    if (!inviteCheck.success) return false;
                    return inviteCheck.data.canInviteTeamMembers;

                case 'manage_organization':
                    if (!organizationId || isIndividualAccount(userProfile)) return false;
                    return userProfile.account_memberships?.some(
                        (m) => m.org_id === organizationId && m.role === 'Admin' && m.status === 'active'
                    );

                case 'test_cases':
                case 'reports':
                case 'automation':
                    return subscriptionService.hasFeatureAccess(subscription.data, permission);

                case 'team_management':
                    if (isIndividualAccount(userProfile)) return false;
                    return subscriptionService.hasFeatureAccess(subscription.data, permission);

                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error checking permission ${permission}:`, error);
            return false;
        }
    },

    async hasRole(userId, role, organizationId) {
        try {
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) return false;

            const { userProfile } = accountInfo.data;
            return userProfile.account_memberships?.some(
                (m) => m.org_id === organizationId && m.role === role && m.status === 'active'
            );
        } catch (error) {
            console.error(`Error checking role ${role}:`, error);
            return false;
        }
    },

    async getUserPermissions(userId, context = {}) {
        try {
            const permissions = {
                canCreateSuite: false,
                canViewSuite: false,
                canEditSuite: false,
                canDeleteSuite: false,
                canInviteTeamMembers: false,
                canManageOrganization: false,
                canAccessTestCases: false,
                canAccessReports: false,
                canAccessAutomation: false,
                canAccessTeamManagement: false,
            };

            const { suiteId, organizationId } = context;

            permissions.canCreateSuite = await this.hasPermission(userId, 'create_suite', { suiteId, organizationId });
            permissions.canViewSuite = suiteId ? await this.hasPermission(userId, 'view_suite', { suiteId, organizationId }) : true;
            permissions.canEditSuite = suiteId ? await this.hasPermission(userId, 'edit_suite', { suiteId, organizationId }) : false;
            permissions.canDeleteSuite = suiteId ? await this.hasPermission(userId, 'delete_suite', { suiteId, organizationId }) : false;
            permissions.canInviteTeamMembers = await this.hasPermission(userId, 'invite_team_members', { organizationId });
            permissions.canManageOrganization = organizationId ? await this.hasPermission(userId, 'manage_organization', { organizationId }) : false;
            permissions.canAccessTestCases = await this.hasPermission(userId, 'test_cases', { suiteId, organizationId });
            permissions.canAccessReports = await this.hasPermission(userId, 'reports', { suiteId, organizationId });
            permissions.canAccessAutomation = await this.hasPermission(userId, 'automation', { suiteId, organizationId });
            permissions.canAccessTeamManagement = await this.hasPermission(userId, 'team_management', { organizationId });

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
                canAccessTestCases: false,
                canAccessReports: false,
                canAccessAutomation: false,
                canAccessTeamManagement: false,
            };
        }
    },

    async canCreateSuite(userId) {
        return this.hasPermission(userId, 'create_suite');
    },

    async canViewSuite(userId, suiteId) {
        return this.hasPermission(userId, 'view_suite', { suiteId });
    },

    async canEditSuite(userId, suiteId) {
        return this.hasPermission(userId, 'edit_suite', { suiteId });
    },

    async canDeleteSuite(userId, suiteId) {
        return this.hasPermission(userId, 'delete_suite', { suiteId });
    },

    async canInviteTeamMembers(userId, organizationId) {
        return this.hasPermission(userId, 'invite_team_members', { organizationId });
    },

    async canManageOrganization(userId, organizationId) {
        return this.hasPermission(userId, 'manage_organization', { organizationId });
    },

    async assignRole(userId, organizationId, role) {
        try {
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) return false;

            const { userProfile } = accountInfo.data;
            const membership = userProfile.account_memberships?.find(
                (m) => m.org_id === organizationId
            );

            if (!membership) return false;

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

    async removeRole(userId, organizationId) {
        try {
            const accountInfo = await getCompleteAccountInfo(userId);
            if (!accountInfo.success) return false;

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