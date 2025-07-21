/* eslint-disable @typescript-eslint/no-unused-vars */
import firestoreService from './firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { getUserCapabilities } from './accountService';

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

const getUserProfile = async (userId) => {
    try {
        const result = await firestoreService.getUserProfile(userId);
        if (!result.success) {
            const createResult = await firestoreService.createOrUpdateUserProfile({
                user_id: userId,
                preferences: {},
                contact_info: {},
                account_memberships: [],
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

const getSuiteById = async (suiteId) => {
    try {
        const result = await firestoreService.getDocument('testSuites', suiteId);
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error getting suite by ID:', error);
        return null;
    }
};

const validateSuitePermissions = async (userId, operation, context = {}) => {
    try {
        const userProfile = await getUserProfile(userId);
        const { organizationId, suiteId } = context;

        switch (operation) {
            case 'create':
                if (organizationId) {
                    const isOrgAdmin = userProfile.account_memberships?.some(
                        (membership) =>
                            membership.org_id === organizationId &&
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
                    const hasPermission =
                        suite.created_by === userId ||
                        (suite.ownerType === 'organization' &&
                            userProfile.account_memberships?.some(
                                (m) => m.org_id === suite.ownerId && m.status === 'active'
                            )) ||
                        suite.access_control?.members?.includes(userId) ||
                        suite.access_control?.admins?.includes(userId);
                    if (!hasPermission) {
                        throw new SuitePermissionError(
                            `You do not have permission to ${operation} this suite`,
                            'INSUFFICIENT_PERMISSION'
                        );
                    }
                    if (operation === 'delete' && suite.created_by !== userId) {
                        if (suite.ownerType === 'organization') {
                            const isOrgAdmin = userProfile.account_memberships?.some(
                                (m) =>
                                    m.org_id === suite.ownerId &&
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
        console.error('Error validating suite permissions:', error);
        throw error;
    }
};

const validateSuiteName = (name) => {
    const errors = [];
    if (!name || typeof name !== 'string') {
        errors.push('Suite name is required and must be a string');
    } else if (name.trim().length < 3) {
        errors.push('Suite name must be at least 3 characters long');
    } else if (name.trim().length > 100) {
        errors.push('Suite name cannot exceed 100 characters');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const checkSuiteNameExists = async (name, userId, organizationId = null) => {
    try {
        await validateSuitePermissions(userId, 'read', { organizationId });
        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }
        const ownerType = organizationId ? 'organization' : 'individual';
        const ownerId = organizationId || userId;
        const result = await firestoreService.queryDocuments('testSuites', [
            where('ownerType', '==', ownerType),
            where('ownerId', '==', ownerId),
            where('name', '==', name.trim()),
        ]);
        return result.success && result.data.length > 0;
    } catch (error) {
        console.error('Error checking suite name:', error);
        throw error;
    }
};

export const createSuite = async (suiteData, userId, _subscriptionStatus = null, organizationId = null) => {
    try {
        const { name, description = '', tags = [] } = suiteData;
        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }
        const capabilitiesResult = await getUserCapabilities(userId);
        if (!capabilitiesResult.success) {
            throw new SuiteLimitError('Unable to fetch subscription capabilities');
        }
        const { maxTestSuites, remaining } = capabilitiesResult.data;
        if (remaining.testSuites === 0 && maxTestSuites !== -1) {
            throw new SuiteLimitError(
                `You've reached your suite limit of ${maxTestSuites}. Please upgrade your plan to create more projects.`,
                'LIMIT_EXCEEDED'
            );
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
            name: name.trim(),
            description: description.trim(),
            ownerType,
            ownerId,
            tags,
            settings: {},
            access_control: {
                ownerType,
                ownerId,
                admins: [userId],
                members: [userId],
                permissions_matrix: {},
            },
        };
        const result = await firestoreService.createTestSuite(newSuite);
        if (!result.success) {
            throw new Error(result.error.message || 'Failed to create suite');
        }
        const createdSuite = {
            suite_id: result.docId,
            ...result.data,
        };
        console.log('Suite created successfully:', {
            suiteId: result.docId,
            userId,
            organizationId,
            ownerType,
            ownerId,
        });
        return {
            success: true,
            suiteId: result.docId,
            suite: createdSuite,
        };
    } catch (error) {
        console.error('Error creating suite:', error);
        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError || error instanceof SuiteLimitError) {
            return {
                success: false,
                error: error.message,
                code: error.code,
            };
        }
        return {
            success: false,
            error: `Failed to create suite: ${error.message || 'Unknown error'}`,
            code: error.code || 'UNKNOWN_ERROR',
        };
    }
};

export const getUserSuites = async (userId) => {
    try {
        const result = await firestoreService.getUserTestSuites(userId);
        if (!result.success) {
            throw new Error(result.error.message || 'Failed to fetch suites');
        }
        const userSuites = result.data.map((suite) => ({
            suite_id: suite.id,
            ...suite,
            accountType: suite.ownerType,
            organizationId: suite.ownerType === 'organization' ? suite.ownerId : null,
            membershipType: suite.ownerType,
        }));
        return {
            suites: userSuites,
            metadata: {
                totalCount: userSuites.length,
            },
        };
    } catch (error) {
        console.error('Error fetching user suites:', error);
        throw new SuiteValidationError(`Failed to fetch user suites: ${error.message || 'Unknown error'}`);
    }
};

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
        return {
            suite_id: suite.id,
            ...suite,
        };
    } catch (error) {
        console.error('Error fetching suite:', error);
        throw error;
    }
};

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
            suite: {
                suite_id: updatedSuite.id,
                ...updatedSuite,
            },
        };
    } catch (error) {
        console.error('Error updating suite:', error);
        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code,
            };
        }
        return {
            success: false,
            error: `Failed to update suite: ${error.message || 'Unknown error'}`,
            code: error.code || 'UNKNOWN_ERROR',
        };
    }
};

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
            message: 'Suite deleted successfully',
        };
    } catch (error) {
        console.error('Error deleting suite:', error);
        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError) {
            return {
                success: false,
                error: error.message,
                code: error.code,
            };
        }
        return {
            success: false,
            error: `Failed to delete suite: ${error.message || 'Unknown error'}`,
            code: error.code || 'UNKNOWN_ERROR',
        };
    }
};

export const subscribeToSuites = (callback, userId) => {
    try {
        if (!userId) {
            throw new SuiteValidationError('User ID is required for subscription');
        }
        return firestoreService.subscribeToUserTestSuites(
            (suites) => {
                const formattedSuites = suites.map((suite) => ({
                    suite_id: suite.id,
                    ...suite,
                    accountType: suite.ownerType,
                    organizationId: suite.ownerType === 'organization' ? suite.ownerId : null,
                    membershipType: suite.ownerType,
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

export const canCreateNewSuite = async (userId, _subscriptionStatus = null) => {
    try {
        const capabilitiesResult = await getUserCapabilities(userId);
        if (!capabilitiesResult.success) {
            return {
                canCreate: false,
                currentCount: 0,
                maxAllowed: 0,
                remaining: 0,
                message: 'Unable to fetch subscription capabilities',
            };
        }
        const { maxTestSuites, remaining } = capabilitiesResult.data;
        const canCreate = remaining.testSuites !== 0;
        return {
            canCreate,
            currentCount: maxTestSuites - remaining.testSuites,
            maxAllowed: maxTestSuites,
            remaining: remaining.testSuites,
            message: canCreate
                ? `You can create ${remaining.testSuites === -1 ? 'unlimited' : remaining.testSuites} more suite${remaining.testSuites !== 1 ? 's' : ''}`
                : `You've reached your limit of ${maxTestSuites} suite${maxTestSuites !== 1 ? 's' : ''}. Please upgrade to create more.`,
        };
    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 0,
            remaining: 0,
            message: `Unable to check suite creation limits: ${error.message || 'Unknown error'}`,
        };
    }
};

let currentSuiteData = {};

export const switchSuite = async (userId, suiteId) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }
        await getSuite(suiteId, userId);
        const suiteData = {
            suiteId,
            timestamp: new Date().toISOString(),
        };
        currentSuiteData[userId] = suiteData;
        await firestoreService.updateDocument('users', userId, {
            lastAccessedSuite: {
                suiteId,
                accessedAt: new Date(),
            },
        });
        return {
            success: true,
            suite: suiteData,
        };
    } catch (error) {
        console.error('Error switching suite:', error);
        return {
            success: false,
            error: `Failed to switch suite: ${error.message || 'Unknown error'}`,
            code: error.code || 'UNKNOWN_ERROR',
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

export const cleanup = () => {
    firestoreService.cleanup();
};

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
    canCreateNewSuite,
    cleanup,
};

export default suiteService;