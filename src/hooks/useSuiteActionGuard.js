// hooks/useSuiteActionGuard.js
import { useCallback, useMemo } from 'react';
import { useSuite } from '../context/SuiteContext';
import { useAuth } from '../context/AuthProvider';
import { useUserProfile } from '../context/userProfileContext';

/**
 * Hook to guard suite-specific actions and provide validation utilities
 * Ensures a suite is selected and user has proper permissions before allowing actions
 * ALIGNED with SuiteContext structure and data flow
 */
export const useSuiteActionGuard = () => {
    const { 
        activeSuite, 
        suites, 
        isLoading, 
        loading, // SuiteContext provides both isLoading and loading
        error,
        canCreateSuite,
        shouldFetchSuites,
        subscriptionStatus,
        getFeatureLimits
    } = useSuite();
    const { user } = useAuth();
    const { userProfile } = useUserProfile();

    // ALIGNED: Use the loading state that SuiteContext provides
    const contextLoading = isLoading || loading;

    // ALIGNED: Enhanced validation state that matches SuiteContext structure
    const validationState = useMemo(() => {
        // Basic authentication checks
        const hasUser = !!user;
        const hasProfile = !!userProfile;
        const hasSuite = !!activeSuite;
        const isUserVerified = user?.emailVerified || false;

        // ALIGNED: Check if user should have access (matches SuiteContext logic)
        const hasAccess = shouldFetchSuites && hasUser;

        // Suite-specific validation
        let suiteValidation = { isValid: true, error: null, code: null };
        
        if (!hasUser) {
            suiteValidation = {
                isValid: false,
                error: 'User not authenticated',
                code: 'USER_NOT_AUTHENTICATED'
            };
        } else if (!hasAccess) {
            suiteValidation = {
                isValid: false,
                error: 'Access denied - authentication required',
                code: 'ACCESS_DENIED'
            };
        } else if (!hasSuite && !contextLoading) {
            suiteValidation = {
                isValid: false,
                error: 'No test suite selected',
                code: 'NO_SUITE_SELECTED'
            };
        } else if (hasSuite && activeSuite) {
            // ALIGNED: Validate suite structure matches new testSuites collection format
            if (!activeSuite.suite_id || !activeSuite.ownerType || !activeSuite.ownerId) {
                suiteValidation = {
                    isValid: false,
                    error: 'Invalid suite structure',
                    code: 'INVALID_SUITE_STRUCTURE'
                };
            }
        }

        return {
            isValid: suiteValidation.isValid,
            error: suiteValidation.error,
            code: suiteValidation.code,
            hasSuite,
            hasUser,
            hasProfile,
            isUserVerified,
            hasAccess,
            isLoading: contextLoading,
            suiteCount: suites?.length || 0,
            canCreateSuite, // ALIGNED: Use SuiteContext's canCreateSuite logic
            featureLimits: getFeatureLimits ? getFeatureLimits() : null
        };
    }, [
        activeSuite, 
        user, 
        userProfile, 
        contextLoading, 
        shouldFetchSuites, 
        suites?.length,
        canCreateSuite,
        getFeatureLimits
    ]);

    // ALIGNED: Enhanced permission checking based on new suite structure
    const getUserPermissionLevel = useCallback((suite = activeSuite) => {
        if (!suite || !user) return null;

        // ALIGNED: Check permissions from new testSuites structure
        const permissions = suite.permissions || {};
        const userPermission = permissions[user.uid];

        if (userPermission) {
            return userPermission; // admin, editor, viewer, etc.
        }

        // ALIGNED: Check if user is the creator
        if (suite.createdBy === user.uid) {
            return 'admin';
        }

        // ALIGNED: For organization suites, check user's org membership
        if (suite.ownerType === 'organization' && suite.ownerId) {
            const orgMembership = userProfile?.account_memberships?.find(
                membership => membership.org_id === suite.ownerId && 
                           membership.status === 'active'
            );

            if (orgMembership) {
                // Convert org role to suite permission level
                const roleToPermission = {
                    'Admin': 'admin',
                    'Editor': 'editor',
                    'Viewer': 'viewer'
                };
                return roleToPermission[orgMembership.role] || 'viewer';
            }
        }

        // ALIGNED: For individual suites, check ownership
        if (suite.ownerType === 'individual' && suite.ownerId === user.uid) {
            return 'admin';
        }

        return null; // No permission
    }, [activeSuite, user, userProfile]);

    // ALIGNED: Action validation that considers new suite structure and permissions
    const validateAction = useCallback((action, suite = activeSuite) => {
        // Define permission requirements for each action
        const actionPermissions = {
            'view': ['viewer', 'editor', 'admin'],
            'edit': ['editor', 'admin'],
            'delete': ['admin'],
            'manage': ['admin'],
            'create': ['admin'], // For creating sub-resources within suite
            'invite': ['admin'],
            'export': ['editor', 'admin']
        };

        const requiredPermissions = actionPermissions[action];
        if (!requiredPermissions) {
            return {
                isValid: false,
                error: `Unknown action: ${action}`,
                code: 'INVALID_ACTION'
            };
        }

        // Check basic authentication
        if (!user) {
            return {
                isValid: false,
                error: 'Authentication required',
                code: 'USER_NOT_AUTHENTICATED',
                requiredPermission: requiredPermissions,
                userPermission: null
            };
        }

        // Check suite availability
        if (!suite) {
            return {
                isValid: false,
                error: 'No suite selected',
                code: 'NO_SUITE_SELECTED',
                requiredPermission: requiredPermissions,
                userPermission: null
            };
        }

        // ALIGNED: Check email verification for write operations
        const writeActions = ['edit', 'delete', 'manage', 'create', 'invite'];
        if (writeActions.includes(action) && !user.emailVerified) {
            return {
                isValid: false,
                error: 'Email verification required for this action',
                code: 'EMAIL_VERIFICATION_REQUIRED',
                requiredPermission: requiredPermissions,
                userPermission: null
            };
        }

        // Get user's permission level
        const userPermission = getUserPermissionLevel(suite);
        
        if (!userPermission) {
            return {
                isValid: false,
                error: 'Access denied - no permissions for this suite',
                code: 'ACCESS_DENIED',
                requiredPermission: requiredPermissions,
                userPermission: null
            };
        }

        // Check if user has required permission level
        const hasPermission = requiredPermissions.includes(userPermission);
        
        if (!hasPermission) {
            return {
                isValid: false,
                error: `Insufficient permissions - ${userPermission} level required, but you have ${userPermission}`,
                code: 'INSUFFICIENT_PERMISSION',
                requiredPermission: requiredPermissions,
                userPermission
            };
        }

        return {
            isValid: true,
            error: null,
            code: 'ALLOWED',
            requiredPermission: requiredPermissions,
            userPermission
        };
    }, [activeSuite, user, getUserPermissionLevel]);

    // Guard function for actions - ALIGNED with context loading states
    const guardAction = useCallback((action, options = {}) => {
        const { 
            onError, 
            onSuccess, 
            returnValidation = false,
            silent = false,
            suite = activeSuite
        } = options;

        // Check loading state - ALIGNED with SuiteContext loading logic
        if (contextLoading && !silent) {
            const loadingResult = {
                allowed: false,
                error: error || 'Loading suite data...',
                code: 'LOADING',
                isLoading: true
            };
            
            if (returnValidation) return loadingResult;
            if (onError) onError(loadingResult);
            return false;
        }

        // Validate the action
        const validation = validateAction(action, suite);
        
        const result = {
            allowed: validation.isValid,
            error: validation.error,
            code: validation.code,
            permission: validation.userPermission,
            requiredPermission: validation.requiredPermission,
            userPermission: validation.userPermission,
            suite: suite || activeSuite,
            action
        };

        if (returnValidation) {
            return result;
        }

        if (validation.isValid) {
            if (onSuccess) onSuccess(result);
            return true;
        } else {
            if (!silent) {
                console.warn(`Action '${action}' blocked for suite ${suite?.name || 'unknown'}:`, validation.error);
            }
            if (onError) onError(result);
            return false;
        }
    }, [activeSuite, contextLoading, error, validateAction]);

    // Permission check shortcuts - ALIGNED with new structure
    const canView = useCallback((suite) => guardAction('view', { silent: true, suite }), [guardAction]);
    const canEdit = useCallback((suite) => guardAction('edit', { silent: true, suite }), [guardAction]);
    const canDelete = useCallback((suite) => guardAction('delete', { silent: true, suite }), [guardAction]);
    const canManage = useCallback((suite) => guardAction('manage', { silent: true, suite }), [guardAction]);
    const canCreate = useCallback((suite) => guardAction('create', { silent: true, suite }), [guardAction]);
    const canInvite = useCallback((suite) => guardAction('invite', { silent: true, suite }), [guardAction]);
    const canExport = useCallback((suite) => guardAction('export', { silent: true, suite }), [guardAction]);

    // Execute action with validation - ALIGNED with context error handling
    const executeIfAllowed = useCallback(async (action, callback, options = {}) => {
        const { suite = activeSuite, ...guardOptions } = options;
        
        const isAllowed = guardAction(action, {
            ...guardOptions,
            suite,
            onError: (result) => {
                if (options.onError) {
                    options.onError(result);
                } else if (!options.silent) {
                    console.error(`Cannot ${action} on suite ${suite?.name || 'unknown'}:`, result.error);
                }
            }
        });

        if (isAllowed && callback) {
            try {
                return await callback(suite || activeSuite);
            } catch (error) {
                console.error(`Error executing ${action}:`, error);
                if (options.onError) {
                    options.onError({ 
                        allowed: false, 
                        error: error.message, 
                        code: 'EXECUTION_ERROR',
                        suite: suite || activeSuite
                    });
                }
                throw error;
            }
        }

        return null;
    }, [guardAction, activeSuite]);

    // ALIGNED: Require suite with better integration to context
    const requireSuite = useCallback((options = {}) => {
        const { 
            message = 'Please select a test suite to continue',
            onMissing,
            redirectTo 
        } = options;

        if (!activeSuite) {
            const result = {
                allowed: false,
                error: message,
                code: 'NO_SUITE_SELECTED',
                availableSuites: suites?.length || 0,
                canCreateSuite: validationState.canCreateSuite,
                hasUser: validationState.hasUser
            };

            if (onMissing) {
                onMissing(result);
            } else {
                console.warn(message, { 
                    availableSuites: result.availableSuites,
                    canCreate: result.canCreateSuite 
                });
            }

            if (redirectTo && typeof redirectTo === 'function') {
                redirectTo();
            }

            return false;
        }

        return true;
    }, [activeSuite, suites, validationState]);

    // ALIGNED: Enhanced error messages that match context structure
    const getErrorMessage = useCallback((code) => {
        const messages = {
            'NO_SUITE_SELECTED': 'Please select a test suite to continue',
            'USER_NOT_AUTHENTICATED': 'Please log in to access this feature',
            'INVALID_SUITE_STRUCTURE': 'Selected suite has invalid structure',
            'ACCESS_DENIED': 'You don\'t have permission to access this suite',
            'INSUFFICIENT_PERMISSION': 'You don\'t have sufficient permissions for this action',
            'EMAIL_VERIFICATION_REQUIRED': 'Please verify your email to perform this action',
            'LOADING': 'Loading suite data...',
            'EXECUTION_ERROR': 'An error occurred while performing this action',
            'INVALID_ACTION': 'Invalid action specified'
        };

        return messages[code] || 'An unknown error occurred';
    }, []);

    // ALIGNED: Return comprehensive state that matches context capabilities
    return {
        // Validation state - ALIGNED with context
        ...validationState,
        
        // Guard functions
        guardAction,
        requireSuite,
        executeIfAllowed,
        validateAction,
        
        // Permission checks - enhanced with suite parameter
        canView,
        canEdit,
        canDelete,
        canManage,
        canCreate,
        canInvite,
        canExport,
        
        // Permission utilities
        getUserPermissionLevel,
        
        // Utilities
        getErrorMessage,
        
        // Context data - ALIGNED with SuiteContext exports
        activeSuite,
        suites,
        user,
        userProfile,
        subscriptionStatus,
        
        // Additional context alignment
        contextError: error,
        contextLoading,
        shouldFetchSuites
    };
};