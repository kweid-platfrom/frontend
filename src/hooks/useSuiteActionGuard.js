// hooks/useSuiteActionGuard.js
import { useCallback, useMemo } from 'react';
import { useSuite } from '../context/SuiteContext';
import { useAuth } from '../context/AuthProvider';
import { useUserProfile } from '../context/userProfileContext';
import { validateSuiteForAction, validateSuiteAccess } from '../utils/suiteValidation';

/**
 * Hook to guard suite-specific actions and provide validation utilities
 * Ensures a suite is selected and user has proper permissions before allowing actions
 */
export const useSuiteActionGuard = () => {
    const { activeSuite, suites, isLoading } = useSuite();
    const { user } = useAuth();
    const { userProfile } = useUserProfile();

    // Memoized validation state
    const validationState = useMemo(() => {
        const validation = validateSuiteAccess(activeSuite, user, userProfile);
        return {
            isValid: validation.isValid,
            error: validation.error,
            code: validation.code,
            hasSuite: !!activeSuite,
            hasUser: !!user,
            hasProfile: !!userProfile,
            isLoading
        };
    }, [activeSuite, user, userProfile, isLoading]);

    // Guard function for actions
    const guardAction = useCallback((action, options = {}) => {
        const { 
            onError, 
            onSuccess, 
            returnValidation = false,
            silent = false 
        } = options;

        // Check loading state
        if (isLoading && !silent) {
            const loadingResult = {
                allowed: false,
                error: 'Loading suite data...',
                code: 'LOADING',
                isLoading: true
            };
            
            if (returnValidation) return loadingResult;
            if (onError) onError(loadingResult);
            return false;
        }

        // Validate suite for specific action
        const validation = validateSuiteForAction(activeSuite, user, userProfile, action);
        
        const result = {
            allowed: validation.isValid,
            error: validation.error,
            code: validation.code,
            permission: validation.permission,
            requiredPermission: validation.requiredPermission,
            userPermission: validation.userPermission,
            suite: activeSuite,
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
                console.warn(`Action '${action}' blocked:`, validation.error);
            }
            if (onError) onError(result);
            return false;
        }
    }, [activeSuite, user, userProfile, isLoading]);

    // Check if specific actions are allowed
    const canView = useCallback(() => guardAction('view', { silent: true }), [guardAction]);
    const canEdit = useCallback(() => guardAction('edit', { silent: true }), [guardAction]);
    const canDelete = useCallback(() => guardAction('delete', { silent: true }), [guardAction]);
    const canManage = useCallback(() => guardAction('manage', { silent: true }), [guardAction]);
    const canCreate = useCallback(() => guardAction('create', { silent: true }), [guardAction]);

    // Execute action with validation
    const executeIfAllowed = useCallback(async (action, callback, options = {}) => {
        const isAllowed = guardAction(action, {
            ...options,
            onError: (result) => {
                if (options.onError) {
                    options.onError(result);
                } else if (!options.silent) {
                    console.error(`Cannot ${action}:`, result.error);
                }
            }
        });

        if (isAllowed && callback) {
            try {
                return await callback(activeSuite);
            } catch (error) {
                console.error(`Error executing ${action}:`, error);
                if (options.onError) {
                    options.onError({ 
                        allowed: false, 
                        error: error.message, 
                        code: 'EXECUTION_ERROR' 
                    });
                }
                throw error;
            }
        }

        return null;
    }, [guardAction, activeSuite]);

    // Require suite selection with user feedback
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
                availableSuites: suites?.length || 0
            };

            if (onMissing) {
                onMissing(result);
            } else {
                console.warn(message);
            }

            if (redirectTo && typeof redirectTo === 'function') {
                redirectTo();
            }

            return false;
        }

        return true;
    }, [activeSuite, suites]);

    // Get user-friendly error messages
    const getErrorMessage = useCallback((code) => {
        const messages = {
            'NO_SUITE_SELECTED': 'Please select a test suite to continue',
            'USER_NOT_AUTHENTICATED': 'Please log in to access this feature',
            'INVALID_SUITE_ID': 'Selected suite is invalid',
            'ACCESS_DENIED': 'You don\'t have permission to access this suite',
            'INSUFFICIENT_PERMISSION': 'You don\'t have sufficient permissions for this action',
            'INSUFFICIENT_PERMISSION_FOR_ACTION': 'You don\'t have permission to perform this action',
            'LOADING': 'Loading suite data...',
            'EXECUTION_ERROR': 'An error occurred while performing this action'
        };

        return messages[code] || 'An unknown error occurred';
    }, []);

    return {
        // Validation state
        ...validationState,
        
        // Guard functions
        guardAction,
        requireSuite,
        executeIfAllowed,
        
        // Permission checks
        canView,
        canEdit,
        canDelete,
        canManage,
        canCreate,
        
        // Utilities
        getErrorMessage,
        
        // Context data
        activeSuite,
        suites,
        user,
        userProfile
    };
};