// Enhanced permissionService.js - Fully Aligned with Account Service Architecture

import accountService  from './accountService';

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

    // Project/Test Suite Permissions - Aligned with Account Service
    READ_PROJECTS: 'read_projects',
    WRITE_PROJECTS: 'write_projects',
    CREATE_PROJECTS: 'create_projects',
    DELETE_PROJECTS: 'delete_projects',
    MANAGE_PROJECT_SETTINGS: 'manage_project_settings',
    CREATE_TEST_SUITES: 'create_test_suites', // Added to match account service
    DELETE_TEST_SUITES: 'delete_test_suites', // Added to match account service

    // Advanced Features - Based on Subscription
    USE_ADVANCED_REPORTS: 'use_advanced_reports',
    USE_API_ACCESS: 'use_api_access',
    USE_AUTOMATION: 'use_automation',
    USE_CUSTOM_INTEGRATIONS: 'use_custom_integrations',
    EXPORT_DATA: 'export_data',

    // System
    SYSTEM_ADMIN: 'system_admin',
    MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    VIEW_SYSTEM_LOGS: 'view_system_logs'
};

// Define which permissions are ORGANIZATION ONLY (requires multi-user setup)
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

// Define which permissions are SUBSCRIPTION-DEPENDENT
const SUBSCRIPTION_DEPENDENT_PERMISSIONS = [
    PERMISSIONS.USE_ADVANCED_REPORTS,
    PERMISSIONS.USE_API_ACCESS,
    PERMISSIONS.USE_AUTOMATION,
    PERMISSIONS.USE_CUSTOM_INTEGRATIONS,
    PERMISSIONS.CREATE_PROJECTS, // Limited by subscription
    PERMISSIONS.CREATE_TEST_SUITES, // Limited by subscription
    PERMISSIONS.INVITE_USERS // Limited by subscription in organizations
];

// Role-based permission matrix (only applies to organization accounts with multiple users)
const ROLE_PERMISSIONS = {
    'Admin': [
        // All UI permissions
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.VIEW_ADMIN_PANEL,
        PERMISSIONS.VIEW_BILLING,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.VIEW_SUBSCRIPTION,
        
        // All user management permissions
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.INVITE_USERS,
        PERMISSIONS.REMOVE_USERS,
        PERMISSIONS.VIEW_USER_PROFILES,
        PERMISSIONS.VIEW_USER_MANAGEMENT,
        PERMISSIONS.VIEW_TEAM_MEMBERS,
        PERMISSIONS.ASSIGN_PERMISSIONS,
        
        // All organization permissions
        PERMISSIONS.MANAGE_ORGANIZATION,
        PERMISSIONS.VIEW_ORGANIZATION_SETTINGS,
        PERMISSIONS.MANAGE_ROLES,
        PERMISSIONS.MODIFY_ORGANIZATION,
        
        // All content permissions
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
        PERMISSIONS.DELETE_CONTENT,
        PERMISSIONS.PUBLISH_CONTENT,
        PERMISSIONS.VIEW_PRIVATE_CONTENT,
        
        // All bug permissions
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
        
        // All project permissions
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.WRITE_PROJECTS,
        PERMISSIONS.CREATE_PROJECTS,
        PERMISSIONS.DELETE_PROJECTS,
        PERMISSIONS.MANAGE_PROJECT_SETTINGS,
        PERMISSIONS.CREATE_TEST_SUITES,
        PERMISSIONS.DELETE_TEST_SUITES,
        
        // Subscription management
        PERMISSIONS.MANAGE_SUBSCRIPTIONS,
        
        // Advanced features (subscription dependent)
        PERMISSIONS.USE_ADVANCED_REPORTS,
        PERMISSIONS.USE_API_ACCESS,
        PERMISSIONS.USE_AUTOMATION,
        PERMISSIONS.USE_CUSTOM_INTEGRATIONS,
        PERMISSIONS.EXPORT_DATA
    ],

    'Manager': [
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
        PERMISSIONS.CREATE_PROJECTS,
        PERMISSIONS.CREATE_TEST_SUITES,
        PERMISSIONS.USE_ADVANCED_REPORTS,
        PERMISSIONS.EXPORT_DATA
    ],

    'Member': [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.CREATE_CONTENT,
        PERMISSIONS.EDIT_CONTENT,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.CREATE_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.CREATE_PROJECTS,
        PERMISSIONS.CREATE_TEST_SUITES
    ],

    'Viewer': [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.READ_PROJECTS
    ],

    'QA_Tester': [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.WRITE_BUGS,
        PERMISSIONS.CREATE_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.VIEW_BUG_ANALYTICS,
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.CREATE_TEST_SUITES
    ],

    'Developer': [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.UPDATE_BUGS,
        PERMISSIONS.RESOLVE_BUGS,
        PERMISSIONS.READ_PROJECTS,
        PERMISSIONS.WRITE_PROJECTS,
        PERMISSIONS.CREATE_TEST_SUITES
    ]
};

/**
 * ALIGNED: Check if user has organization account using account service logic
 */
export const isOrganizationAccount = (userProfile) => {
    return accountService.getUserCapabilities(userProfile).accountType === 'organization';
};

/**
 * ALIGNED: Check if user has individual account using account service logic
 */
export const isIndividualAccount = (userProfile) => {
    return accountService.getUserCapabilities(userProfile).accountType === 'individual';
};

/**
 * ALIGNED: Get user's subscription capabilities from account service
 */
export const getUserSubscriptionCapabilities = (userProfile) => {
    return accountService.getUserCapabilities(userProfile);
};

/**
 * ALIGNED: Get all permissions for a user based on account type, role, and subscription
 */
export const getAllUserPermissions = (userProfile) => {
    if (!userProfile) return [];

    const capabilities = getUserSubscriptionCapabilities(userProfile);
    const isOrgAccount = capabilities.accountType === 'organization';
    const isIndividualAccount = capabilities.accountType === 'individual';
    
    let permissions = new Set();

    // Individual accounts get all permissions except organization-only ones
    if (isIndividualAccount) {
        // Add all basic permissions
        Object.values(PERMISSIONS).forEach(permission => {
            if (!ORGANIZATION_ONLY_PERMISSIONS.includes(permission)) {
                permissions.add(permission);
            }
        });
        
        // Apply subscription-based restrictions
        applySubscriptionPermissions(permissions, capabilities);
        
        // Add custom permissions if they exist
        if (userProfile.customPermissions && Array.isArray(userProfile.customPermissions)) {
            userProfile.customPermissions.forEach(perm => {
                if (!ORGANIZATION_ONLY_PERMISSIONS.includes(perm)) {
                    permissions.add(perm);
                }
            });
        }
        
        return Array.from(permissions);
    }

    // Organization accounts use role-based permissions
    if (isOrgAccount) {
        // Get permissions based on role(s)
        const userRoles = getUserRoles(userProfile);
        
        userRoles.forEach(role => {
            const rolePerms = ROLE_PERMISSIONS[role] || [];
            rolePerms.forEach(perm => permissions.add(perm));
        });
        
        // Apply subscription-based restrictions
        applySubscriptionPermissions(permissions, capabilities);
        
        // Add custom permissions if they exist
        if (userProfile.customPermissions && Array.isArray(userProfile.customPermissions)) {
            userProfile.customPermissions.forEach(perm => permissions.add(perm));
        }
        
        return Array.from(permissions);
    }

    // Default case - basic permissions
    return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.READ_BUGS,
        PERMISSIONS.READ_PROJECTS
    ];
};

/**
 * ALIGNED: Apply subscription-based permission restrictions
 */
const applySubscriptionPermissions = (permissions, capabilities) => {
    // Remove advanced features if not available in subscription
    if (!capabilities.canAccessAdvancedReports) {
        permissions.delete(PERMISSIONS.USE_ADVANCED_REPORTS);
    }
    
    if (!capabilities.canUseAPI) {
        permissions.delete(PERMISSIONS.USE_API_ACCESS);
    }
    
    if (!capabilities.canUseAutomation) {
        permissions.delete(PERMISSIONS.USE_AUTOMATION);
    }
    
    // Handle team collaboration features
    if (!capabilities.canInviteTeamMembers) {
        permissions.delete(PERMISSIONS.INVITE_USERS);
        permissions.delete(PERMISSIONS.VIEW_TEAM_MEMBERS);
    }
    
    // Project creation is handled separately by limits, but permission still needed
    // The actual enforcement happens in canAccessProject function
};

/**
 * ALIGNED: Get user roles from account service structure
 */
const getUserRoles = (userProfile) => {
    // Check for roles in account memberships (organization structure)
    if (userProfile.account_memberships && Array.isArray(userProfile.account_memberships)) {
        for (const membership of userProfile.account_memberships) {
            if (membership.org_id) {
                // This is an organization membership
                return Array.isArray(membership.role) ? membership.role : [membership.role || 'Member'];
            }
        }
    }
    
    // Fallback to direct role property
    if (userProfile.role) {
        return Array.isArray(userProfile.role) ? userProfile.role : [userProfile.role];
    }
    
    // Default role
    return ['Member'];
};

/**
 * ALIGNED: Check if user has a specific permission
 */
export const hasPermission = (userProfile, permission) => {
    const userPermissions = getAllUserPermissions(userProfile);
    return userPermissions.includes(permission);
};

/**
 * ALIGNED: Project-specific permission checks with subscription limits
 */
export const canAccessProject = async (userProfile, action = 'read', projectContext = {}) => {
    const { projectOwnerId, isPublic = false, organizationId } = projectContext;
    
    // Basic permission check
    const permission = `${action}_projects`;
    if (!hasPermission(userProfile, permission) && action !== 'read') {
        return { allowed: false, reason: 'insufficient_permissions' };
    }
    
    // Public read access
    if (action === 'read' && isPublic) {
        return { allowed: true, reason: 'public_access' };
    }
    
    const capabilities = getUserSubscriptionCapabilities(userProfile);
    
    // For create operations, check subscription limits
    if (action === 'create') {
        const projectCheck = await accountService.canCreateNewProject(userProfile);
        
        if (!projectCheck.canCreate) {
            return { 
                allowed: false, 
                reason: 'subscription_limit_reached',
                currentCount: projectCheck.currentCount,
                maxAllowed: projectCheck.maxAllowed,
                upgradeRequired: !projectCheck.isTrialActive
            };
        }
        
        // For create operations in organizations
        if (organizationId) {
            // Individual accounts cannot create projects in organizations
            if (capabilities.accountType === 'individual') {
                return { allowed: false, reason: 'individual_cannot_create_in_org' };
            }
            
            // Organization members must be part of the target organization
            if (userProfile.organizationId !== organizationId) {
                return { allowed: false, reason: 'not_org_member' };
            }
        }
    }

    // For write/update/delete operations
    if (['write', 'update', 'delete'].includes(action)) {
        // Users can always modify their own projects
        if (projectOwnerId && userProfile?.user_id === projectOwnerId) {
            return { allowed: true, reason: 'owner_access' };
        }
        
        // Individual accounts can modify all their projects
        if (capabilities.accountType === 'individual') {
            return { allowed: true, reason: 'individual_admin' };
        }
        
        // Organization members with admin/manager roles
        const roles = getUserRoles(userProfile);
        if (roles.some(role => ['Admin', 'Manager'].includes(role))) {
            return { allowed: true, reason: 'admin_access' };
        }
        
        return { allowed: false, reason: 'insufficient_role' };
    }

    return { allowed: true, reason: 'default_access' };
};

/**
 * ALIGNED: Bug-specific permission checks with context
 */
export const canAccessBugs = (userProfile, action = 'read', context = {}) => {
    const { bugOwnerId, projectId, projectOwnerId } = context;
    
    const permission = `${action}_bugs`;
    if (!hasPermission(userProfile, permission)) {
        return { allowed: false, reason: 'insufficient_permissions' };
    }

    const capabilities = getUserSubscriptionCapabilities(userProfile);

    if (action === 'update' || action === 'delete') {
        if (bugOwnerId && userProfile?.user_id === bugOwnerId) {
            return { allowed: true, reason: 'owner_access' };
        }
        
        if (projectId && projectOwnerId && userProfile?.user_id === projectOwnerId) {
            return { allowed: true, reason: 'project_owner_access' };
        }
        
        if (capabilities.accountType === 'individual') {
            return { allowed: true, reason: 'individual_admin' };
        }
        
        const roles = getUserRoles(userProfile);
        if (roles.some(role => ['Admin', 'Manager'].includes(role))) {
            return { allowed: true, reason: 'admin_access' };
        }
        
        return { allowed: false, reason: 'insufficient_role' };
    }

    if (action === 'read' && projectId) {
        return canAccessProject(userProfile, 'read', { projectId, projectOwnerId });
    }

    return { allowed: true, reason: 'default_access' };
};

/**
 * Check if a specific permission requires organization account
 */
export const requiresOrganizationAccount = (permission) => {
    return ORGANIZATION_ONLY_PERMISSIONS.includes(permission);
};

/**
 * Check if a specific permission requires subscription upgrade
 */
export const requiresSubscriptionUpgrade = (userProfile, permission) => {
    if (!SUBSCRIPTION_DEPENDENT_PERMISSIONS.includes(permission)) {
        return false;
    }
    
    const capabilities = getUserSubscriptionCapabilities(userProfile);
    
    switch (permission) {
        case PERMISSIONS.USE_ADVANCED_REPORTS:
            return !capabilities.canAccessAdvancedReports;
        case PERMISSIONS.USE_API_ACCESS:
            return !capabilities.canUseAPI;
        case PERMISSIONS.USE_AUTOMATION:
            return !capabilities.canUseAutomation;
        case PERMISSIONS.INVITE_USERS:
            return !capabilities.canInviteTeamMembers;
        case PERMISSIONS.CREATE_PROJECTS:
        case PERMISSIONS.CREATE_TEST_SUITES:
            // This is handled by limits check, not direct capability
            return false;
        default:
            return false;
    }
};

/**
 * ALIGNED: Check if user should see upgrade prompt for a specific feature
 */
export const shouldShowUpgradePrompt = (userProfile, permission) => {
    const requiresOrg = requiresOrganizationAccount(permission);
    const requiresSub = requiresSubscriptionUpgrade(userProfile, permission);
    const capabilities = getUserSubscriptionCapabilities(userProfile);
    
    // Show org upgrade prompt for individual accounts trying to access org features
    if (requiresOrg && capabilities.accountType === 'individual') {
        return { type: 'organization', reason: 'requires_organization_account' };
    }
    
    // Show subscription upgrade prompt for features not available in current plan
    if (requiresSub && !capabilities.isTrialActive) {
        return { type: 'subscription', reason: 'requires_subscription_upgrade' };
    }
    
    return null;
};

/**
 * ALIGNED: Check if user has admin role
 */
export const isAdmin = (userProfile) => {
    if (!userProfile) return false;
    
    const capabilities = getUserSubscriptionCapabilities(userProfile);
    
    // Individual accounts are always admin of their own account
    if (capabilities.accountType === 'individual') return true;

    // Check organization roles
    const roles = getUserRoles(userProfile);
    return roles.includes('Admin');
};

/**
 * ALIGNED: Check if user is a member (non-admin)
 */
export const isMember = (userProfile) => {
    if (!userProfile) return false;
    
    const capabilities = getUserSubscriptionCapabilities(userProfile);
    
    // Individual accounts are not "members"
    if (capabilities.accountType === 'individual') return false;

    const roles = getUserRoles(userProfile);
    return roles.includes('Member') && !roles.includes('Admin');
};

/**
 * ALIGNED: Get comprehensive user permissions with subscription awareness
 */
export const getUserPermissions = (userProfile) => {
    if (!userProfile) {
        return createEmptyPermissions();
    }

    const capabilities = getUserSubscriptionCapabilities(userProfile);
    const allPermissions = getAllUserPermissions(userProfile);
    const isOrgAccount = capabilities.accountType === 'organization';
    const isIndAccount = capabilities.accountType === 'individual';
    const userIsAdmin = isAdmin(userProfile);
    const userIsMember = isMember(userProfile);

    return {
        // UI Permissions
        canViewSubscription: allPermissions.includes(PERMISSIONS.VIEW_SUBSCRIPTION),
        canViewDashboard: allPermissions.includes(PERMISSIONS.VIEW_DASHBOARD),
        canViewAnalytics: allPermissions.includes(PERMISSIONS.VIEW_ANALYTICS),
        canViewSettings: allPermissions.includes(PERMISSIONS.VIEW_SETTINGS),
        canViewAdminPanel: allPermissions.includes(PERMISSIONS.VIEW_ADMIN_PANEL),
        canViewBilling: allPermissions.includes(PERMISSIONS.VIEW_BILLING),
        canViewReports: allPermissions.includes(PERMISSIONS.VIEW_REPORTS),

        // User Management Permissions
        canManageUsers: allPermissions.includes(PERMISSIONS.MANAGE_USERS),
        canAssignPermissions: allPermissions.includes(PERMISSIONS.ASSIGN_PERMISSIONS),
        canViewUserManagement: allPermissions.includes(PERMISSIONS.VIEW_USER_MANAGEMENT),
        canViewTeamMembers: allPermissions.includes(PERMISSIONS.VIEW_TEAM_MEMBERS),
        canInviteUsers: allPermissions.includes(PERMISSIONS.INVITE_USERS) && capabilities.canInviteTeamMembers,

        // Organization Permissions
        canModifyOrganization: allPermissions.includes(PERMISSIONS.MODIFY_ORGANIZATION),
        canManageOrganization: allPermissions.includes(PERMISSIONS.MANAGE_ORGANIZATION),
        canViewOrganizationSettings: allPermissions.includes(PERMISSIONS.VIEW_ORGANIZATION_SETTINGS),
        canManageRoles: allPermissions.includes(PERMISSIONS.MANAGE_ROLES),

        // Content Permissions
        canCreateContent: allPermissions.includes(PERMISSIONS.CREATE_CONTENT),
        canEditContent: allPermissions.includes(PERMISSIONS.EDIT_CONTENT),
        canDeleteContent: allPermissions.includes(PERMISSIONS.DELETE_CONTENT),
        canPublishContent: allPermissions.includes(PERMISSIONS.PUBLISH_CONTENT),
        canViewPrivateContent: allPermissions.includes(PERMISSIONS.VIEW_PRIVATE_CONTENT),

        // Bug Permissions
        canReadBugs: allPermissions.includes(PERMISSIONS.READ_BUGS),
        canWriteBugs: allPermissions.includes(PERMISSIONS.WRITE_BUGS),
        canCreateBugs: allPermissions.includes(PERMISSIONS.CREATE_BUGS),
        canUpdateBugs: allPermissions.includes(PERMISSIONS.UPDATE_BUGS),
        canDeleteBugs: allPermissions.includes(PERMISSIONS.DELETE_BUGS),
        canAssignBugs: allPermissions.includes(PERMISSIONS.ASSIGN_BUGS),
        canResolveBugs: allPermissions.includes(PERMISSIONS.RESOLVE_BUGS),
        canViewBugAnalytics: allPermissions.includes(PERMISSIONS.VIEW_BUG_ANALYTICS),
        canExportBugReports: allPermissions.includes(PERMISSIONS.EXPORT_BUG_REPORTS),
        canManageBugWorkflow: allPermissions.includes(PERMISSIONS.MANAGE_BUG_WORKFLOW),

        // Project Permissions
        canReadProjects: allPermissions.includes(PERMISSIONS.READ_PROJECTS),
        canWriteProjects: allPermissions.includes(PERMISSIONS.WRITE_PROJECTS),
        canCreateProjects: allPermissions.includes(PERMISSIONS.CREATE_PROJECTS),
        canDeleteProjects: allPermissions.includes(PERMISSIONS.DELETE_PROJECTS),
        canManageProjectSettings: allPermissions.includes(PERMISSIONS.MANAGE_PROJECT_SETTINGS),
        canCreateTestSuites: allPermissions.includes(PERMISSIONS.CREATE_TEST_SUITES),
        canDeleteTestSuites: allPermissions.includes(PERMISSIONS.DELETE_TEST_SUITES),

        // Advanced Feature Permissions (Subscription-dependent)
        canUseAdvancedReports: allPermissions.includes(PERMISSIONS.USE_ADVANCED_REPORTS) && capabilities.canAccessAdvancedReports,
        canUseAPIAccess: allPermissions.includes(PERMISSIONS.USE_API_ACCESS) && capabilities.canUseAPI,
        canUseAutomation: allPermissions.includes(PERMISSIONS.USE_AUTOMATION) && capabilities.canUseAutomation,
        canUseCustomIntegrations: allPermissions.includes(PERMISSIONS.USE_CUSTOM_INTEGRATIONS),
        canExportData: allPermissions.includes(PERMISSIONS.EXPORT_DATA),

        // Subscription Management
        canManageSubscriptions: allPermissions.includes(PERMISSIONS.MANAGE_SUBSCRIPTIONS),

        // Account Information
        isAdmin: userIsAdmin,
        isMember: userIsMember,
        isOrganization: isOrgAccount,
        isIndividual: isIndAccount,
        accountType: capabilities.accountType,
        organizationId: userProfile.organizationId || null,
        
        // Subscription Information
        subscriptionType: capabilities.subscriptionType,
        subscriptionStatus: capabilities.subscriptionStatus,
        isTrialActive: capabilities.isTrialActive,
        trialDaysRemaining: capabilities.trialDaysRemaining,
        showTrialBanner: capabilities.showTrialBanner,

        // Limits
        limits: capabilities.limits,

        // All permissions list
        allPermissions: allPermissions,

        // Upgrade Prompts
        shouldShowUpgradePrompts: {
            userManagement: shouldShowUpgradePrompt(userProfile, PERMISSIONS.VIEW_USER_MANAGEMENT),
            inviteUsers: shouldShowUpgradePrompt(userProfile, PERMISSIONS.INVITE_USERS),
            teamMembers: shouldShowUpgradePrompt(userProfile, PERMISSIONS.VIEW_TEAM_MEMBERS),
            manageRoles: shouldShowUpgradePrompt(userProfile, PERMISSIONS.MANAGE_ROLES),
            assignBugs: shouldShowUpgradePrompt(userProfile, PERMISSIONS.ASSIGN_BUGS),
            manageBugWorkflow: shouldShowUpgradePrompt(userProfile, PERMISSIONS.MANAGE_BUG_WORKFLOW),
            advancedReports: shouldShowUpgradePrompt(userProfile, PERMISSIONS.USE_ADVANCED_REPORTS),
            apiAccess: shouldShowUpgradePrompt(userProfile, PERMISSIONS.USE_API_ACCESS),
            automation: shouldShowUpgradePrompt(userProfile, PERMISSIONS.USE_AUTOMATION)
        }
    };
};

/**
 * Create empty permissions object for null/undefined profiles
 */
const createEmptyPermissions = () => {
    return {
        canViewSubscription: false,
        canViewDashboard: false,
        canViewAnalytics: false,
        canViewSettings: false,
        canViewAdminPanel: false,
        canViewBilling: false,
        canViewReports: false,
        canManageUsers: false,
        canAssignPermissions: false,
        canViewUserManagement: false,
        canViewTeamMembers: false,
        canInviteUsers: false,
        canModifyOrganization: false,
        canManageOrganization: false,
        canViewOrganizationSettings: false,
        canManageRoles: false,
        canCreateContent: false,
        canEditContent: false,
        canDeleteContent: false,
        canPublishContent: false,
        canViewPrivateContent: false,
        canReadBugs: false,
        canWriteBugs: false,
        canCreateBugs: false,
        canUpdateBugs: false,
        canDeleteBugs: false,
        canAssignBugs: false,
        canResolveBugs: false,
        canViewBugAnalytics: false,
        canExportBugReports: false,
        canManageBugWorkflow: false,
        canReadProjects: false,
        canWriteProjects: false,
        canCreateProjects: false,
        canDeleteProjects: false,
        canManageProjectSettings: false,
        canCreateTestSuites: false,
        canDeleteTestSuites: false,
        canUseAdvancedReports: false,
        canUseAPIAccess: false,
        canUseAutomation: false,
        canUseCustomIntegrations: false,
        canExportData: false,
        canManageSubscriptions: false,
        isAdmin: false,
        isMember: false,
        isOrganization: false,
        isIndividual: false,
        accountType: 'individual',
        organizationId: null,
        subscriptionType: 'free',
        subscriptionStatus: 'inactive',
        isTrialActive: false,
        trialDaysRemaining: 0,
        showTrialBanner: false,
        limits: {
            suites: 1,
            test_scripts: 25,
            automated_tests: 10,
            recordings: 5,
            report_exports: 2,
            team_members: 1
        },
        allPermissions: [],
        shouldShowUpgradePrompts: {
            userManagement: null,
            inviteUsers: null,
            teamMembers: null,
            manageRoles: null,
            assignBugs: null,
            manageBugWorkflow: null,
            advancedReports: null,
            apiAccess: null,
            automation: null
        }
    };
};

/**
 * ALIGNED: Check specific permission before allowing action
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