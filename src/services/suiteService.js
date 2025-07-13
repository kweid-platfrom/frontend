// services/suiteService.js - Refactored to use centralized FirestoreService
import firestoreService from './firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { validateSuiteName } from '../utils/onboardingUtils';

/**
 * Error classes for better error handling
 */
class SuitePermissionError extends Error {
    constructor(message, code = 'PERMISSION_DENIED') {
        super(message);
        this.name = 'SuitePermissionError';
        this.code = code;
    }
}

class SuiteValidationError extends Error {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message);
        this.name = 'SuiteValidationError';
        this.code = code;
    }
}

class SuiteLimitError extends Error {
    constructor(message, code = 'LIMIT_EXCEEDED') {
        super(message);
        this.name = 'SuiteLimitError';
        this.code = code;
    }
}

/**
 * Get user profile using centralized service
 */
const getUserProfile = async (userId) => {
    try {
        const result = await firestoreService.getUserProfile(userId);

        if (!result.success) {
            // Create user profile if it doesn't exist
            const createResult = await firestoreService.createOrUpdateUserProfile({
                user_id: userId,
                preferences: {},
                contact_info: {},
                account_memberships: []
            });

            if (!createResult.success) {
                throw new Error('Failed to create user profile');
            }

            return { user_id: userId, account_memberships: [] };
        }

        return result.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * Get feature limits based on subscription context
 */
const getFeatureLimits = (subscriptionStatus, userProfile) => {
    if (!subscriptionStatus) {
        return {
            suites: 1,
            testCases: 10,
            recordings: 5,
            automatedScripts: 0
        };
    }

    const isTrialActive = subscriptionStatus.isTrialActive ||
        subscriptionStatus.subscriptionStatus === 'trial';

    if (isTrialActive) {
        const accountType = userProfile?.accountType || 'individual';

        if (accountType === 'organization') {
            const orgType = subscriptionStatus.subscriptionType || 'organization_trial';
            if (orgType.includes('enterprise')) {
                return {
                    suites: -1,
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1
                };
            } else {
                return {
                    suites: 10,
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1
                };
            }
        } else {
            return {
                suites: 5,
                testCases: -1,
                recordings: -1,
                automatedScripts: -1
            };
        }
    }

    const limits = subscriptionStatus.capabilities?.limits;
    if (!limits) {
        const accountType = userProfile?.accountType || 'individual';
        if (accountType === 'organization') {
            return {
                suites: 5,
                testCases: 50,
                recordings: 25,
                automatedScripts: 10
            };
        }
        return {
            suites: 1,
            testCases: 10,
            recordings: 5,
            automatedScripts: 0
        };
    }

    return {
        suites: limits.testSuites || 1,
        testCases: limits.testCases || 10,
        recordings: limits.recordings || 5,
        automatedScripts: limits.automatedScripts || 0
    };
};

/**
 * Count user's current suites using centralized service
 */
const getCurrentSuiteCount = async (userId, userProfile = null) => {
    try {
        const profile = userProfile || await getUserProfile(userId);
        let totalSuites = 0;

        // Count individual suites
        const individualResult = await firestoreService.queryDocuments(
            'testSuites',
            [
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId)
            ]
        );

        if (individualResult.success) {
            totalSuites += individualResult.data.length;
        }

        // Count organization suites where user is creator
        if (profile.account_memberships?.length > 0) {
            for (const membership of profile.account_memberships) {
                if (membership.org_id && membership.status === 'active') {
                    try {
                        const orgResult = await firestoreService.queryDocuments(
                            'testSuites',
                            [
                                where('ownerType', '==', 'organization'),
                                where('ownerId', '==', membership.org_id),
                                where('createdBy', '==', userId)
                            ]
                        );

                        if (orgResult.success) {
                            totalSuites += orgResult.data.length;
                        }
                    } catch (error) {
                        console.warn(`Error counting suites for org ${membership.org_id}:`, error);
                    }
                }
            }
        }

        return totalSuites;
    } catch (error) {
        console.error('Error counting user suites:', error);
        return 0;
    }
};

/**
 * Get suite by ID using centralized service
 */
const getSuiteById = async (suiteId) => {
    try {
        const result = await firestoreService.getDocument('testSuites', suiteId);
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error getting suite by ID:', error);
        return null;
    }
};

/**
 * Validate user permissions
 */
const validateSuitePermissions = async (userId, operation, context = {}) => {
    try {
        const userProfile = await getUserProfile(userId);
        const { organizationId, suiteId } = context;

        switch (operation) {
            case 'create':
                if (organizationId) {
                    const isOrgAdmin = userProfile.account_memberships?.some(
                        membership => membership.org_id === organizationId &&
                            membership.status === 'active' &&
                            membership.role === 'Admin'
                    );

                    if (!isOrgAdmin) {
                        throw new SuitePermissionError(
                            'Only organization administrators can create test suites for the organization',
                            'NOT_ORGANIZATION_ADMIN'
                        );
                    }
                }
                break;

            case 'read':
                break;

            case 'update':
            case 'delete':
                if (suiteId) {
                    const suite = await getSuiteById(suiteId);
                    if (!suite) {
                        throw new SuiteValidationError('Suite not found');
                    }

                    const hasPermission = suite.createdBy === userId ||
                        suite.permissions?.[userId] ||
                        (suite.ownerType === 'organization' &&
                            userProfile.account_memberships?.some(
                                m => m.org_id === suite.ownerId && m.status === 'active'
                            ));

                    if (!hasPermission) {
                        throw new SuitePermissionError(
                            `You do not have permission to ${operation} this suite`,
                            'INSUFFICIENT_PERMISSION'
                        );
                    }

                    if (operation === 'delete' && suite.createdBy !== userId) {
                        if (suite.ownerType === 'organization') {
                            const isOrgAdmin = userProfile.account_memberships?.some(
                                m => m.org_id === suite.ownerId &&
                                    m.status === 'active' &&
                                    m.role === 'Admin'
                            );

                            if (!isOrgAdmin) {
                                throw new SuitePermissionError(
                                    'Only the suite creator or organization admin can delete this suite',
                                    'NOT_SUITE_OWNER'
                                );
                            }
                        } else {
                            throw new SuitePermissionError(
                                'Only the suite creator can delete this suite',
                                'NOT_SUITE_OWNER'
                            );
                        }
                    }
                }
                break;

            default:
                throw new SuiteValidationError(`Invalid operation: ${operation}`);
        }

        return { userProfile };
    } catch (error) {
        if (error instanceof SuitePermissionError ||
            error instanceof SuiteValidationError ||
            error instanceof SuiteLimitError) {
            throw error;
        }
        console.error('Error validating suite permissions:', error);
        throw new SuitePermissionError('Permission validation failed');
    }
};

/**
 * Check if suite name exists using centralized service
 */
export const checkSuiteNameExists = async (name, userId, organizationId = null) => {
    try {
        await validateSuitePermissions(userId, 'read', { organizationId });

        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }

        const ownerType = organizationId ? 'organization' : 'individual';
        const ownerId = organizationId || userId;

        const result = await firestoreService.queryDocuments(
            'testSuites',
            [
                where('ownerType', '==', ownerType),
                where('ownerId', '==', ownerId),
                where('name', '==', name.trim())
            ]
        );

        return result.success && result.data.length > 0;
    } catch (error) {
        console.error('Error checking suite name:', error);
        throw error;
    }
};

/**
 * Create a new suite using centralized service
 */
export const createSuite = async (suiteData, userId, subscriptionStatus = null, organizationId = null) => {
    try {
        const { name, description = '', tags = [] } = suiteData;

        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }

        const { userProfile } = await validateSuitePermissions(userId, 'create', {
            organizationId,
            suiteData
        });

        const limits = getFeatureLimits(subscriptionStatus, userProfile);
        if (limits.suites > 0) {
            const currentCount = await getCurrentSuiteCount(userId, userProfile);
            if (currentCount >= limits.suites) {
                throw new SuiteLimitError(
                    `You've reached your suite limit of ${limits.suites}. Please upgrade your plan to create more projects.`,
                    'LIMIT_EXCEEDED'
                );
            }
        }

        const nameExists = await checkSuiteNameExists(name, userId, organizationId);
        if (nameExists) {
            throw new SuiteValidationError(
                'A suite with this name already exists. Please choose a different name.'
            );
        }

        const ownerType = organizationId ? 'organization' : 'individual';
        const ownerId = organizationId || userId;

        const newSuite = {
            ownerType,
            ownerId,
            name: name.trim(),
            description: description.trim(),
            status: 'active',
            tags: tags || [],
            createdBy: userId,
            permissions: {
                [userId]: 'admin'
            },
            testingAssets: {
                bugs: [],
                testCases: [],
                recordings: [],
                automatedScripts: [],
                dashboardMetrics: {},
                reports: [],
                settings: {}
            },
            collaboration: {
                activityLog: [],
                comments: [],
                notifications: []
            }
        };

        const result = await firestoreService.createDocument('testSuites', newSuite);

        if (!result.success) {
            throw new Error(result.error.message || 'Failed to create suite');
        }

        // Update with suite_id
        await firestoreService.updateDocument('testSuites', result.id, {
            suite_id: result.id
        });

        const createdSuite = { ...newSuite, suite_id: result.id };

        console.log('Suite created successfully:', {
            suiteId: result.id,
            userId,
            organizationId,
            ownerType,
            ownerId
        });

        return {
            success: true,
            suiteId: result.id,
            suite: createdSuite
        };
    } catch (error) {
        console.error('Error creating suite:', error);

        if (error instanceof SuitePermissionError ||
            error instanceof SuiteValidationError ||
            error instanceof SuiteLimitError) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }

        return {
            success: false,
            error: 'Failed to create suite. Please try again.',
            code: 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Get all suites for a user using centralized service
 */
export const getUserSuites = async (userId) => {
    try {
        const userProfile = await getUserProfile(userId);
        const userSuites = [];

        // Get individual suites
        const individualResult = await firestoreService.queryDocuments(
            'testSuites',
            [
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId)
            ],
            'created_at',
            50
        );

        if (individualResult.success) {
            const individualSuites = individualResult.data.map(suite => ({
                ...suite,
                suite_id: suite.id,
                accountType: 'individual',
                membershipType: 'individual'
            }));
            userSuites.push(...individualSuites);
        }

        // Get organization suites
        if (userProfile.account_memberships?.length > 0) {
            for (const membership of userProfile.account_memberships) {
                if (membership.org_id && membership.status === 'active') {
                    try {
                        const orgResult = await firestoreService.queryDocuments(
                            'testSuites',
                            [
                                where('ownerType', '==', 'organization'),
                                where('ownerId', '==', membership.org_id)
                            ],
                            'created_at',
                            25
                        );

                        if (orgResult.success) {
                            const orgSuites = orgResult.data.map(suite => ({
                                ...suite,
                                suite_id: suite.id,
                                accountType: 'organization',
                                organizationId: membership.org_id,
                                membershipType: 'organization',
                                userRole: membership.role
                            }));
                            userSuites.push(...orgSuites);
                        }
                    } catch (error) {
                        console.warn(`Error fetching suites for org ${membership.org_id}:`, error);
                    }
                }
            }
        }

        // Remove duplicates and sort
        const uniqueSuites = userSuites.reduce((acc, suite) => {
            const existingIndex = acc.findIndex(s => s.suite_id === suite.suite_id);
            if (existingIndex === -1) {
                acc.push(suite);
            }
            return acc;
        }, []);

        uniqueSuites.sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(0);
            const dateB = b.created_at?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return {
            suites: uniqueSuites,
            metadata: {
                totalCount: uniqueSuites.length
            }
        };
    } catch (error) {
        console.error('Error fetching user suites:', error);
        throw error;
    }
};

/**
 * Get a specific suite using centralized service
 */
export const getSuite = async (suiteId, userId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        const suite = await getSuiteById(suiteId);

        if (!suite) {
            throw new SuiteValidationError('Suite not found');
        }

        if (userId) {
            await validateSuitePermissions(userId, 'read', { suiteId });
        }

        return suite;
    } catch (error) {
        console.error('Error fetching suite:', error);
        throw error;
    }
};

/**
 * Update suite using centralized service
 */
export const updateSuite = async (suiteId, updates, userId) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        await validateSuitePermissions(userId, 'update', { suiteId });

        const result = await firestoreService.updateDocument('testSuites', suiteId, updates);

        if (!result.success) {
            throw new Error(result.error.message || 'Failed to update suite');
        }

        const updatedSuite = await getSuiteById(suiteId);

        return {
            success: true,
            suite: updatedSuite
        };
    } catch (error) {
        console.error('Error updating suite:', error);

        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }

        return {
            success: false,
            error: 'Failed to update suite. Please try again.',
            code: 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Delete suite using centralized service
 */
export const deleteSuite = async (suiteId, userId) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        await validateSuitePermissions(userId, 'delete', { suiteId });

        const result = await firestoreService.deleteDocument('testSuites', suiteId);

        if (!result.success) {
            throw new Error(result.error.message || 'Failed to delete suite');
        }

        console.log('Suite deleted successfully:', { suiteId, userId });

        return {
            success: true,
            message: 'Suite deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting suite:', error);

        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }

        return {
            success: false,
            error: 'Failed to delete suite. Please try again.',
            code: 'UNKNOWN_ERROR'
        };
    }
};

/**
 * Subscribe to suite changes using centralized service
 */
export const subscribeToSuites = (callback, userId) => {
    try {
        if (!userId) {
            throw new SuiteValidationError('User ID is required for subscription');
        }

        return firestoreService.subscribeToCollection(
            'testSuites',
            [
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId),
                orderBy('created_at', 'desc')
            ],
            (suites) => {
                const formattedSuites = suites.map(suite => ({
                    ...suite,
                    suite_id: suite.id
                }));
                callback(formattedSuites);
            },
            (error) => {
                console.error('Error in suite subscription:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error subscribing to suites:', error);
        throw error;
    }
};

/**
 * Check if user can create a new suite
 */
export const canCreateNewSuite = async (userId, subscriptionStatus = null) => {
    try {
        const userProfile = await getUserProfile(userId);
        const limits = getFeatureLimits(subscriptionStatus, userProfile);
        const currentCount = await getCurrentSuiteCount(userId, userProfile);

        const canCreate = limits.suites === -1 || currentCount < limits.suites;
        const remaining = limits.suites === -1 ? -1 : Math.max(0, limits.suites - currentCount);

        return {
            canCreate,
            currentCount,
            maxAllowed: limits.suites,
            remaining,
            message: canCreate ?
                `You can create ${remaining === -1 ? 'unlimited' : remaining} more suite${remaining !== 1 ? 's' : ''}` :
                `You've reached your limit of ${limits.suites} suite${limits.suites !== 1 ? 's' : ''}. Please upgrade to create more.`
        };
    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 0,
            remaining: 0,
            message: 'Unable to check suite creation limits'
        };
    }
};

// Memory-based suite switching for Claude.ai compatibility
let currentSuiteData = {};

export const switchSuite = async (userId, suiteId) => {
    try {
        await getSuite(suiteId, userId);

        const suiteData = {
            suiteId,
            timestamp: new Date().toISOString()
        };

        currentSuiteData[userId] = suiteData;

        // Update user's profile using centralized service
        await firestoreService.updateDocument('users', userId, {
            lastAccessedSuite: {
                suiteId,
                accessedAt: new Date()
            }
        });

        return {
            success: true,
            suite: suiteData
        };
    } catch (error) {
        console.error('Error switching suite:', error);

        return {
            success: false,
            error: error.message || 'Failed to switch suite'
        };
    }
};

export const getCurrentSuite = (userId) => {
    try {
        return currentSuiteData[userId] || null;
    } catch (error) {
        console.error('Error getting current suite:', error);
        return null;
    }
};

// Export service object
export const suiteService = {
    createSuite,
    checkSuiteNameExists,
    getUserSuites,
    getSuite,
    updateSuite,
    deleteSuite,
    subscribeToSuites,
    switchSuite,
    getCurrentSuite,
    canCreateNewSuite
};

export default suiteService;