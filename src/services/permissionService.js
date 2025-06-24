// Enhanced permissionService.js - Aligned with Project Service

// Permission constants - centralized permission definitions
export const PERMISSIONS = {
    // Navigation & UI
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_ANALYTICS: 'view_analytics',
    VIEW_SETTINGS: 'view_settings',
    VIEW_ADMIN_PANEL: 'view_admin_panel',
    VIEW_BILLING: 'view_billing',
    VIEW_REPORTS: 'view_reports',
    VIEW_SUBSCRIPTION: 'view_subscription',

    // User Management - ORGANIZATION ONLY
    MANAGE_USERS: 'manage_users',
    INVITE_USERS: 'invite_users',
    REMOVE_USERS: 'remove_users',
    VIEW_USER_PROFILES: 'view_user_profiles',
    VIEW_USER_MANAGEMENT: 'view_user_management',
    VIEW_TEAM_MEMBERS: 'view_team_members',
    ASSIGN_PERMISSIONS: 'assign_permissions',

    // Organization
    MANAGE_ORGANIZATION: 'manage_organization',
    VIEW_ORGANIZATION_SETTINGS: 'view_org_settings',
    MANAGE_ROLES: 'manage_roles',
    MODIFY_ORGANIZATION: 'modify_organization',

    // Content & Data
    CREATE_CONTENT: 'create_content',
    EDIT_CONTENT: 'edit_content',
    DELETE_CONTENT: 'delete_content',
    PUBLISH_CONTENT: 'publish_content',
    VIEW_PRIVATE_CONTENT: 'view_private_content',

    // Bug Tracking Permissions
    READ_BUGS: 'read_bugs',
    WRITE_BUGS: 'write_bugs',
    CREATE_BUGS: 'create_bugs',
    UPDATE_BUGS: 'update_bugs',
    DELETE_BUGS: 'delete_bugs',
    ASSIGN_BUGS: 'assign_bugs', // ORGANIZATION ONLY
    RESOLVE_BUGS: 'resolve_bugs',
    VIEW_BUG_ANALYTICS: 'view_bug_analytics',
    EXPORT_BUG_REPORTS: 'export_bug_reports',
    MANAGE_BUG_WORKFLOW: 'manage_bug_workflow', // ORGANIZATION ONLY

    // Project Permissions
    READ_PROJECTS: 'read_projects',
    WRITE_PROJECTS: 'write_projects',
    CREATE_PROJECTS: 'create_projects',
    DELETE_PROJECTS: 'delete_projects',
    MANAGE_PROJECT_SETTINGS: 'manage_project_settings',

    // System
    SYSTEM_ADMIN: 'system_admin',
    MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    VIEW_SYSTEM_LOGS: 'view_system_logs'
};

// Define which permissions are ORGANIZATION ONLY (user invite/management features)
const ORGANIZATION_ONLY_PERMISSIONS = [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.REMOVE_USERS,
    PERMISSIONS.VIEW_USER_MANAGEMENT,
    PERMISSIONS.VIEW_TEAM_MEMBERS,
    PERMISSIONS.ASSIGN_PERMISSIONS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MODIFY_ORGANIZATION,
    PERMISSIONS.ASSIGN_BUGS,
    PERMISSIONS.MANAGE_BUG_WORKFLOW
];

// INDIVIDUAL ADMIN PERMISSIONS - All permissions except organization-only ones
const INDIVIDUAL_ADMIN_PERMISSIONS = [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_SUBSCRIPTION,
    PERMISSIONS.VIEW_ORGANIZATION_SETTINGS,
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.VIEW_PRIVATE_CONTENT,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS,
    PERMISSIONS.READ_BUGS,
    PERMISSIONS.WRITE_BUGS,
    PERMISSIONS.CREATE_BUGS,
    PERMISSIONS.UPDATE_BUGS,
    PERMISSIONS.DELETE_BUGS,
    PERMISSIONS.RESOLVE_BUGS,
    PERMISSIONS.VIEW_BUG_ANALYTICS,
    PERMISSIONS.EXPORT_BUG_REPORTS,
    PERMISSIONS.READ_PROJECTS,
    PERMISSIONS.WRITE_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.MANAGE_PROJECT_SETTINGS
];

// Role-based permission matrix (only applies to organization accounts with multiple users)
const ROLE_PERMISSIONS = {
    admin: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.VIEW_ADMIN_PANEL,
        PERMISSIONS.VIEW_BILLING,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_SUBSCRIPTION,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.INVITE_USERS,
        PERMISSIONS.REMOVE_USERS,
        PERMISSIONS.VIEW_USER_PROFILES,
        PERMISSIONS.VIEW_USER_MANAGEMENT,
        PERMISSIONS.VIEW_TEAM_MEMBERS,
        PERMISSIONS.ASSIGN_PERMISSIONS,
        PERMISSIONS.MANAGE_ORGANIZATION,
        PERMISSIONS.VIEW_ORGANIZATION_SETTINGS,
        PERMISSIONS.MANAGE_ROLES,
        PERMISSIONS.MODIFY_ORGANIZATION,
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
        PERMISSIONS.DELETE_CONTENT,
        PERMISSIONS.PUBLISH_CONTENT,
        PERMISSIONS.VIEW_PRIVATE_CONTENT,
        PERMISSIONS.MANAGE_SUBSCRIPTIONS,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.WRITE_BUGS,
        PERMISSIONS.CREATE_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.DELETE_BUGS,
        PERMISSIONS.ASSIGN_BUGS,
        PERMISSIONS.RESOLVE_BUGS,
        PERMISSIONS.VIEW_BUG_ANALYTICS,
        PERMISSIONS.EXPORT_BUG_REPORTS,
        PERMISSIONS.MANAGE_BUG_WORKFLOW,
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.WRITE_PROJECTS,
        PERMISSIONS.CREATE_PROJECTS,
        PERMISSIONS.DELETE_PROJECTS,
        PERMISSIONS.MANAGE_PROJECT_SETTINGS
    ],

    manager: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.INVITE_USERS,
        PERMISSIONS.VIEW_USER_PROFILES,
        PERMISSIONS.VIEW_TEAM_MEMBERS,
        PERMISSIONS.VIEW_ORGANIZATION_SETTINGS,
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
        PERMISSIONS.PUBLISH_CONTENT,
        PERMISSIONS.VIEW_PRIVATE_CONTENT,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.WRITE_BUGS,
        PERMISSIONS.CREATE_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.ASSIGN_BUGS,
        PERMISSIONS.RESOLVE_BUGS,
        PERMISSIONS.VIEW_BUG_ANALYTICS,
        PERMISSIONS.EXPORT_BUG_REPORTS,
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.WRITE_PROJECTS,
        PERMISSIONS.CREATE_PROJECTS
    ],

    member: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.CREATE_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.READ_PROJECTS
    ],

    viewer: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.READ_PROJECTS
    ],

    qa_tester: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.WRITE_BUGS,
        PERMISSIONS.CREATE_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.VIEW_BUG_ANALYTICS,
        PERMISSIONS.READ_PROJECTS
    ],

    developer: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.RESOLVE_BUGS,
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.WRITE_PROJECTS
    ]
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
 * Get all permissions for a user based on account type and role
 */
export const getAllUserPermissions = (userProfile) => {
    if (!userProfile) return [];

    let permissions = new Set();

    if (isIndividualAccount(userProfile)) {
        INDIVIDUAL_ADMIN_PERMISSIONS.forEach(perm => permissions.add(perm));
        
        if (userProfile.customPermissions && Array.isArray(userProfile.customPermissions)) {
            userProfile.customPermissions.forEach(perm => {
                if (!ORGANIZATION_ONLY_PERMISSIONS.includes(perm)) {
                    permissions.add(perm);
                }
            });
        }
        
        return Array.from(permissions);
    }

    if (isOrganizationAccount(userProfile)) {
        if (userProfile.role && Array.isArray(userProfile.role)) {
            userProfile.role.forEach(role => {
                const rolePerms = ROLE_PERMISSIONS[role] || [];
                rolePerms.forEach(perm => permissions.add(perm));
            });
        } else if (userProfile.role) {
            const rolePerms = ROLE_PERMISSIONS[userProfile.role] || [];
            rolePerms.forEach(perm => permissions.add(perm));
        }
        
        if (userProfile.customPermissions && Array.isArray(userProfile.customPermissions)) {
            userProfile.customPermissions.forEach(perm => permissions.add(perm));
        }
        
        return Array.from(permissions);
    }

    const accountType = userProfile.accountType || userProfile.userType || 'individual';
    if (accountType === 'trial') {
        return [
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.CREATE_CONTENT,
            PERMISSIONS.READ_BUGS,
            PERMISSIONS.CREATE_BUGS,
            PERMISSIONS.READ_PROJECTS
        ];
    }

    return INDIVIDUAL_ADMIN_PERMISSIONS;
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (userProfile, permission) => {
    const userPermissions = getAllUserPermissions(userProfile);
    return userPermissions.includes(permission);
};

/**
 * Project-specific permission checks - ALIGNED WITH PROJECT SERVICE
 */
export const canAccessProject = (userProfile, action = 'read', projectContext = {}) => {
    const { projectOwnerId, isPublic = false, organizationId } = projectContext;
    
    const permission = `${action}_projects`;
    if (!hasPermission(userProfile, permission)) {
        if (action === 'read' && isPublic) {
            return true;
        }
        return false;
    }

    // For create operations in organizations
    if (action === 'create' && organizationId) {
        // Individual accounts cannot create projects in organizations
        if (isIndividualAccount(userProfile)) {
            return false;
        }
        
        // Organization members must be part of the target organization
        if (userProfile.organizationId !== organizationId) {
            return false;
        }
    }

    // For write/update/delete operations
    if (['write', 'update', 'delete'].includes(action)) {
        // Users can always modify their own projects
        if (projectOwnerId && userProfile?.uid === projectOwnerId) {
            return true;
        }
        
        // Individual accounts can modify all their projects
        if (isIndividualAccount(userProfile)) {
            return true;
        }
        
        // Organization members with admin/manager roles
        const roles = Array.isArray(userProfile?.role) ? userProfile.role : [userProfile?.role];
        return roles.some(role => ['admin', 'manager'].includes(role));
    }

    return true;
};

/**
 * Bug-specific permission checks with context
 */
export const canAccessBugs = (userProfile, action = 'read', context = {}) => {
    const { bugOwnerId, projectId, projectOwnerId } = context;
    
    const permission = `${action}_bugs`;
    if (!hasPermission(userProfile, permission)) {
        return false;
    }

    if (action === 'update' || action === 'delete') {
        if (bugOwnerId && userProfile?.uid === bugOwnerId) {
            return true;
        }
        
        if (projectId && projectOwnerId && userProfile?.uid === projectOwnerId) {
            return true;
        }
        
        if (isIndividualAccount(userProfile)) {
            return true;
        }
        
        const roles = Array.isArray(userProfile?.role) ? userProfile.role : [userProfile?.role];
        return roles.some(role => ['admin', 'manager'].includes(role));
    }

    if (action === 'read' && projectId) {
        return canAccessProject(userProfile, 'read', { projectId, projectOwnerId });
    }

    return true;
};

/**
 * Check if a specific permission requires organization account
 */
export const requiresOrganizationAccount = (permission) => {
    return ORGANIZATION_ONLY_PERMISSIONS.includes(permission);
};

/**
 * Check if user should see upgrade prompt for a specific feature
 */
export const shouldShowUpgradePrompt = (userProfile, permission) => {
    return requiresOrganizationAccount(permission) && isIndividualAccount(userProfile);
};

/**
 * Check if user has admin role
 */
export const isAdmin = (userProfile) => {
    if (!userProfile) return false;
    if (isIndividualAccount(userProfile)) return true;

    const roles = userProfile.role || [];
    return Array.isArray(roles) ? roles.includes('admin') : roles === 'admin';
};

/**
 * Check if user is a member (non-admin)
 */
export const isMember = (userProfile) => {
    if (!userProfile) return false;
    if (isIndividualAccount(userProfile)) return false;

    const roles = userProfile.role || [];
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes('member') && !roleArray.includes('admin');
};

/**
 * Get user permissions with proper account type handling
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
            canReadBugs: false,
            canWriteBugs: false,
            canCreateBugs: false,
            canUpdateBugs: false,
            canDeleteBugs: false,
            canAssignBugs: false,
            canResolveBugs: false,
            canViewBugAnalytics: false,
            canExportBugReports: false,
            canReadProjects: false,
            canWriteProjects: false,
            canCreateProjects: false,
            canDeleteProjects: false,
            isAdmin: false,
            isMember: false,
            isOrganization: false,
            isIndividual: false,
            shouldShowUpgradePrompts: {}
        };
    }

    const isOrgAccount = isOrganizationAccount(userProfile);
    const isIndAccount = isIndividualAccount(userProfile);
    const userIsAdmin = isIndAccount || isAdmin(userProfile);
    const userIsMember = !userIsAdmin && isMember(userProfile);

    return {
        canViewSubscription: hasPermission(userProfile, PERMISSIONS.VIEW_SUBSCRIPTION),
        canManageUsers: hasPermission(userProfile, PERMISSIONS.MANAGE_USERS),
        canAssignPermissions: hasPermission(userProfile, PERMISSIONS.ASSIGN_PERMISSIONS),
        canViewUserManagement: hasPermission(userProfile, PERMISSIONS.VIEW_USER_MANAGEMENT),
        canViewTeamMembers: hasPermission(userProfile, PERMISSIONS.VIEW_TEAM_MEMBERS),
        canModifyOrganization: hasPermission(userProfile, PERMISSIONS.MODIFY_ORGANIZATION),
        canInviteUsers: hasPermission(userProfile, PERMISSIONS.INVITE_USERS),
        canReadBugs: hasPermission(userProfile, PERMISSIONS.READ_BUGS),
        canWriteBugs: hasPermission(userProfile, PERMISSIONS.WRITE_BUGS),
        canCreateBugs: hasPermission(userProfile, PERMISSIONS.CREATE_BUGS),
        canUpdateBugs: hasPermission(userProfile, PERMISSIONS.UPDATE_BUGS),
        canDeleteBugs: hasPermission(userProfile, PERMISSIONS.DELETE_BUGS),
        canAssignBugs: hasPermission(userProfile, PERMISSIONS.ASSIGN_BUGS),
        canResolveBugs: hasPermission(userProfile, PERMISSIONS.RESOLVE_BUGS),
        canViewBugAnalytics: hasPermission(userProfile, PERMISSIONS.VIEW_BUG_ANALYTICS),
        canExportBugReports: hasPermission(userProfile, PERMISSIONS.EXPORT_BUG_REPORTS),
        canManageBugWorkflow: hasPermission(userProfile, PERMISSIONS.MANAGE_BUG_WORKFLOW),
        canReadProjects: hasPermission(userProfile, PERMISSIONS.READ_PROJECTS),
        canWriteProjects: hasPermission(userProfile, PERMISSIONS.WRITE_PROJECTS),
        canCreateProjects: hasPermission(userProfile, PERMISSIONS.CREATE_PROJECTS),
        canDeleteProjects: hasPermission(userProfile, PERMISSIONS.DELETE_PROJECTS),
        canManageProjectSettings: hasPermission(userProfile, PERMISSIONS.MANAGE_PROJECT_SETTINGS),
        canViewDashboard: hasPermission(userProfile, PERMISSIONS.VIEW_DASHBOARD),
        canViewAnalytics: hasPermission(userProfile, PERMISSIONS.VIEW_ANALYTICS),
        canViewSettings: hasPermission(userProfile, PERMISSIONS.VIEW_SETTINGS),
        canViewAdminPanel: hasPermission(userProfile, PERMISSIONS.VIEW_ADMIN_PANEL),
        canViewBilling: hasPermission(userProfile, PERMISSIONS.VIEW_BILLING),
        canViewReports: hasPermission(userProfile, PERMISSIONS.VIEW_REPORTS),
        canCreateContent: hasPermission(userProfile, PERMISSIONS.CREATE_CONTENT),
        canEditContent: hasPermission(userProfile, PERMISSIONS.EDIT_CONTENT),
        canDeleteContent: hasPermission(userProfile, PERMISSIONS.DELETE_CONTENT),
        canPublishContent: hasPermission(userProfile, PERMISSIONS.PUBLISH_CONTENT),
        canViewPrivateContent: hasPermission(userProfile, PERMISSIONS.VIEW_PRIVATE_CONTENT),
        canManageSubscriptions: hasPermission(userProfile, PERMISSIONS.MANAGE_SUBSCRIPTIONS),

        isAdmin: userIsAdmin,
        isMember: userIsMember,
        isOrganization: isOrgAccount,
        isIndividual: isIndAccount,

        accountType: userProfile.accountType || userProfile.userType || 'individual',
        organizationId: userProfile.organizationId || null,
        allPermissions: getAllUserPermissions(userProfile),

        shouldShowUpgradePrompts: {
            userManagement: shouldShowUpgradePrompt(userProfile, PERMISSIONS.VIEW_USER_MANAGEMENT),
            inviteUsers: shouldShowUpgradePrompt(userProfile, PERMISSIONS.INVITE_USERS),
            teamMembers: shouldShowUpgradePrompt(userProfile, PERMISSIONS.VIEW_TEAM_MEMBERS),
            manageRoles: shouldShowUpgradePrompt(userProfile, PERMISSIONS.MANAGE_ROLES),
            assignBugs: shouldShowUpgradePrompt(userProfile, PERMISSIONS.ASSIGN_BUGS),
            manageBugWorkflow: shouldShowUpgradePrompt(userProfile, PERMISSIONS.MANAGE_BUG_WORKFLOW)
        }
    };
};

/**
 * Check specific permission before allowing action
 */
export const checkPermission = (userProfile, permissionKey) => {
    const permissions = getUserPermissions(userProfile);
    if (permissions.hasOwnProperty(permissionKey)) {
        return permissions[permissionKey];
    }
    return hasPermission(userProfile, permissionKey);
};

/**
 * Enhanced permission checker with upgrade prompts
 */
export const createPermissionChecker = (userProfile) => {
    return {
        can: (permission) => hasPermission(userProfile, permission),
        canAll: (permissions) => permissions.every(p => hasPermission(userProfile, p)),
        canAny: (permissions) => permissions.some(p => hasPermission(userProfile, p)),
        requiresUpgrade: (permission) => shouldShowUpgradePrompt(userProfile, permission),
        isAdmin: () => isAdmin(userProfile),
        isOrganization: () => isOrganizationAccount(userProfile),
        isIndividual: () => isIndividualAccount(userProfile),
        getAllPermissions: () => getAllUserPermissions(userProfile),
        canAccessBugs: (action, context) => canAccessBugs(userProfile, action, context),
        canAccessProject: (action, context) => canAccessProject(userProfile, action, context)
    };
};