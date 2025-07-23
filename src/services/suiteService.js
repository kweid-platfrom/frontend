/* eslint-disable @typescript-eslint/no-unused-vars */
import firestoreService from './firestoreService';
import { where } from 'firebase/firestore';
import { getUserCapabilities } from './accountService';

class SuiteError extends Error {
    constructor(message, code = 'ERROR') {
        super(message);
        this.name = 'SuiteError';
        this.code = code;
    }
}

const handleError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    const message = error instanceof SuiteError ? error.message : defaultMessage;
    return { success: false, error: message, code: error.code || 'UNKNOWN_ERROR' };
};

const formatSuite = (suite, id) => ({
    suite_id: id,
    ...suite,
    accountType: suite.ownerType,
    organizationId: suite.ownerType === 'organization' ? suite.ownerId : null,
    membershipType: suite.ownerType
});

const getUserProfile = async (userId) => {
    try {
        const result = await firestoreService.getUserProfile(userId);
        if (result.success) return result.data;

        console.log('User profile not found, creating minimal profile for:', userId);
        const createResult = await firestoreService.createOrUpdateUserProfile({
            user_id: userId,
            email: firestoreService.getCurrentUser()?.email || '',
            preferences: {},
            contact_info: {},
            account_memberships: []
        });

        return createResult.success ? createResult.data : {
            user_id: userId,
            account_memberships: [],
            preferences: {},
            contact_info: {}
        };
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        return {
            user_id: userId,
            account_memberships: [],
            preferences: {},
            contact_info: {}
        };
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

        if (operation === 'create' && organizationId) {
            const isOrgAdmin = userProfile.account_memberships?.some(
                m => m.org_id === organizationId && m.status === 'active' && m.role === 'Admin'
            );
            if (!isOrgAdmin) {
                throw new SuiteError('Only organization admins can create suites', 'NOT_ORGANIZATION_ADMIN');
            }
        }

        if (['update', 'delete'].includes(operation) && suiteId) {
            const suite = await getSuiteById(suiteId);
            if (!suite) {
                throw new SuiteError('Suite not found', 'SUITE_NOT_FOUND');
            }

            const hasAccess = suite.members?.includes(userId) ||
                suite.access_control?.admins?.includes(userId) ||
                suite.access_control?.members?.includes(userId) ||
                (suite.ownerType === 'individual' && suite.ownerId === userId);

            if (!hasAccess) {
                throw new SuiteError('Access denied to suite', 'ACCESS_DENIED');
            }

            if (operation === 'delete') {
                const isAdmin = suite.access_control?.admins?.includes(userId) ||
                    (suite.ownerType === 'individual' && suite.ownerId === userId) ||
                    (suite.ownerType === 'organization' && userProfile.account_memberships?.some(
                        m => m.org_id === suite.ownerId && m.role === 'Admin'
                    ));
                if (!isAdmin) {
                    throw new SuiteError('Admin access required for deletion', 'ADMIN_REQUIRED');
                }
            }
        }

        return { success: true, userProfile };
    } catch (error) {
        return handleError(error, 'Permission validation failed');
    }
};

const validateSuiteName = (name) => {
    if (!name || typeof name !== 'string') {
        return { isValid: false, errors: ['Suite name required'] };
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
        return { isValid: false, errors: ['Suite name must be at least 3 characters'] };
    }
    if (trimmedName.length > 100) {
        return { isValid: false, errors: ['Suite name must be less than 100 characters'] };
    }
    return { isValid: true, errors: [] };
};

export const checkSuiteNameExists = async (name, userId, organizationId = null) => {
    try {
        const nameValidation = validateSuiteName(name);
        if (!nameValidation.isValid) {
            return { exists: false, error: nameValidation.errors[0] };
        }

        const ownerType = organizationId ? 'organization' : 'individual';
        const ownerId = organizationId || userId;

        const result = await firestoreService.queryDocuments('testSuites', [
            where('ownerType', '==', ownerType),
            where('ownerId', '==', ownerId),
            where('name', '==', name.trim())
        ]);

        return result.success ? { exists: result.data.length > 0 } : { exists: false, error: result.error?.message };
    } catch (error) {
        console.error('Error checking suite name:', error);
        return { exists: false, error: 'Unable to verify suite name' };
    }
};

export const createIndividualSuite = async (suiteData, userId) => {
    try {
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');
        if (!suiteData?.name) throw new SuiteError('Suite name required', 'MISSING_SUITE_NAME');

        const nameValidation = validateSuiteName(suiteData.name);
        if (!nameValidation.isValid) throw new SuiteError(nameValidation.errors[0], 'INVALID_NAME');

        const nameExists = await checkSuiteNameExists(suiteData.name, userId);
        if (nameExists.exists) throw new SuiteError('Suite name already exists for your account', 'NAME_EXISTS');

        const newSuite = {
            name: suiteData.name.trim(),
            description: suiteData.description?.trim() || '',
            ownerType: 'individual',
            ownerId: userId,
            tags: Array.isArray(suiteData.tags) ? suiteData.tags : [],
            settings: suiteData.settings || {},
            access_control: {
                ownerType: 'individual',
                ownerId: userId,
                admins: [userId],
                members: [userId],
                permissions_matrix: suiteData.access_control?.permissions_matrix || {}
            }
        };

        const result = await firestoreService.createTestSuite(newSuite);
        if (!result.success) throw new SuiteError(result.error?.message || 'Failed to create suite', 'DATABASE_ERROR');

        return {
            success: true,
            suiteId: result.docId,
            suite: formatSuite(result.data, result.docId)
        };
    } catch (error) {
        return handleError(error, 'Error creating individual suite');
    }
};

export const createOrganizationSuite = async (suiteData, userId, organizationId) => {
    try {
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');
        if (!organizationId) throw new SuiteError('Organization ID required', 'MISSING_ORGANIZATION_ID');
        if (!suiteData?.name) throw new SuiteError('Suite name required', 'MISSING_SUITE_NAME');

        const nameValidation = validateSuiteName(suiteData.name);
        if (!nameValidation.isValid) throw new SuiteError(nameValidation.errors[0], 'INVALID_NAME');

        const validation = await validateSuitePermissions(userId, 'create', { organizationId });
        if (!validation.success) throw new SuiteError(validation.error, validation.code);

        const nameExists = await checkSuiteNameExists(suiteData.name, userId, organizationId);
        if (nameExists.exists) throw new SuiteError('Suite name already exists for this organization', 'NAME_EXISTS');

        const newSuite = {
            name: suiteData.name.trim(),
            description: suiteData.description?.trim() || '',
            ownerType: 'organization',
            ownerId: organizationId,
            tags: Array.isArray(suiteData.tags) ? suiteData.tags : [],
            settings: suiteData.settings || {},
            access_control: {
                ownerType: 'organization',
                ownerId: organizationId,
                admins: [userId],
                members: [userId],
                permissions_matrix: suiteData.access_control?.permissions_matrix || {}
            }
        };

        const result = await firestoreService.createTestSuite(newSuite);
        if (!result.success) throw new SuiteError(result.error?.message || 'Failed to create suite', 'DATABASE_ERROR');

        return {
            success: true,
            suiteId: result.docId,
            suite: formatSuite(result.data, result.docId)
        };
    } catch (error) {
        return handleError(error, 'Error creating organization suite');
    }
};

export const createSuite = async (suiteData, userId, organizationId = null) => {
    return organizationId
        ? await createOrganizationSuite(suiteData, userId, organizationId)
        : await createIndividualSuite(suiteData, userId);
};

export const getUserSuites = async (userId) => {
    try {
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');

        const result = await firestoreService.getUserTestSuites();
        if (!result.success) throw new SuiteError(result.error?.message || 'Failed to fetch suites', 'DATABASE_ERROR');

        return {
            success: true,
            suites: result.data.map(suite => formatSuite(suite, suite.id)),
            metadata: { totalCount: result.data.length }
        };
    } catch (error) {
        return handleError(error, 'Error fetching user suites');
    }
};

export const getSuite = async (suiteId, userId = null) => {
    try {
        if (!suiteId) throw new SuiteError('Suite ID required', 'MISSING_SUITE_ID');

        const suite = await getSuiteById(suiteId);
        if (!suite) throw new SuiteError('Suite not found', 'SUITE_NOT_FOUND');

        if (userId) {
            const hasAccess = suite.members?.includes(userId) ||
                suite.access_control?.admins?.includes(userId) ||
                suite.access_control?.members?.includes(userId) ||
                (suite.ownerType === 'individual' && suite.ownerId === userId);
            if (!hasAccess) throw new SuiteError('Access denied to suite', 'ACCESS_DENIED');
        }

        return {
            success: true,
            suite: formatSuite(suite, suite.id)
        };
    } catch (error) {
        return handleError(error, 'Error fetching suite');
    }
};

export const updateSuite = async (suiteId, updates, userId) => {
    try {
        if (!suiteId) throw new SuiteError('Suite ID required', 'MISSING_SUITE_ID');
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');

        const validation = await validateSuitePermissions(userId, 'update', { suiteId });
        if (!validation.success) throw new SuiteError(validation.error, validation.code);

        const allowedUpdates = {
            name: updates.name?.trim(),
            description: updates.description?.trim(),
            tags: Array.isArray(updates.tags) ? updates.tags : undefined,
            settings: updates.settings
        };
        const cleanUpdates = Object.fromEntries(
            Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
        );

        const result = await firestoreService.updateDocument('testSuites', suiteId, cleanUpdates);
        if (!result.success) throw new SuiteError(result.error?.message || 'Failed to update suite', 'DATABASE_ERROR');

        const updatedSuite = await getSuiteById(suiteId);
        return {
            success: true,
            suite: formatSuite(updatedSuite, suiteId)
        };
    } catch (error) {
        return handleError(error, 'Error updating suite');
    }
};

export const deleteSuite = async (suiteId, userId) => {
    try {
        if (!suiteId) throw new SuiteError('Suite ID required', 'MISSING_SUITE_ID');
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');

        const validation = await validateSuitePermissions(userId, 'delete', { suiteId });
        if (!validation.success) throw new SuiteError(validation.error, validation.code);

        const result = await firestoreService.deleteDocument('testSuites', suiteId);
        if (!result.success) throw new SuiteError(result.error?.message || 'Failed to delete suite', 'DATABASE_ERROR');

        return { success: true, message: 'Suite deleted successfully' };
    } catch (error) {
        return handleError(error, 'Error deleting suite');
    }
};

export const subscribeToSuites = (callback, userId) => {
    try {
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');

        return firestoreService.subscribeToUserTestSuites(
            suites => callback(suites.map(suite => formatSuite(suite, suite.id))),
            () => callback([]) // Return empty array on error to prevent UI crashes
        );
    } catch (error) {
        console.error('Error subscribing to suites:', error);
        callback([]);
        return null;
    }
};

export const canCreateNewSuite = async (userId, organizationId = null) => {
    try {
        if (!userId) {
            return {
                canCreate: false,
                currentCount: 0,
                maxAllowed: 0,
                remaining: 0,
                message: 'User ID required'
            };
        }

        const result = await getUserCapabilities(organizationId || userId);
        const canCreate = result.success && result.data.remaining.testSuites !== 0;

        return {
            canCreate,
            currentCount: result.success ? result.data.maxTestSuites - result.data.remaining.testSuites : 0,
            maxAllowed: result.success ? result.data.maxTestSuites : -1,
            remaining: result.success ? result.data.remaining.testSuites : -1,
            accountType: organizationId ? 'organization' : 'individual',
            message: canCreate ? 'Can create suite' : 'Suite limit reached'
        };
    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: true,
            currentCount: 0,
            maxAllowed: -1,
            remaining: -1,
            accountType: organizationId ? 'organization' : 'individual',
            message: 'Unable to check limits'
        };
    }
};

let currentSuiteData = {};

export const switchSuite = async (userId, suiteId) => {
    try {
        if (!suiteId) throw new SuiteError('Suite ID required', 'MISSING_SUITE_ID');
        if (!userId) throw new SuiteError('User ID required', 'MISSING_USER_ID');

        const suiteResult = await getSuite(suiteId, userId);
        if (!suiteResult.success) throw new SuiteError(suiteResult.error, suiteResult.code);

        currentSuiteData[userId] = { suiteId, timestamp: new Date().toISOString() };
        await firestoreService.updateDocument('users', userId, {
            lastAccessedSuite: { suiteId, accessedAt: new Date() }
        });

        return { success: true, suite: currentSuiteData[userId] };
    } catch (error) {
        return handleError(error, 'Error switching suite');
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
    try {
        firestoreService.cleanup();
        currentSuiteData = {};
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
};

export const suiteService = {
    createSuite,
    createIndividualSuite,
    createOrganizationSuite,
    checkSuiteNameExists,
    getUserSuites,
    getSuite,
    updateSuite,
    deleteSuite,
    subscribeToSuites,
    switchSuite,
    getCurrentSuite,
    canCreateNewSuite,
    cleanup
};

export default suiteService;