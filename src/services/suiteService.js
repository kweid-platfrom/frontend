// services/suiteService.js
import { db } from '../config/firebase';
import { 
    collection, 
    doc,
    addDoc, 
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    query, 
    where, 
    orderBy,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { validateSuiteName } from '../utils/onboardingUtils';
import { 
    createPermissionChecker,
    PERMISSIONS,
    isIndividualAccount,
    isOrganizationAccount
} from './permissionService';

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

/**
 * Get user profile - This should be implemented based on your user service
 * For now, assuming it exists or needs to be implemented
 */
const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        return { uid: userId, ...userDoc.data() };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * Validate user permissions for suite operations
 */
const validateSuitePermissions = async (userId, operation, context = {}) => {
    try {
        const userProfile = await getUserProfile(userId);
        const permissionChecker = createPermissionChecker(userProfile);
        const { organizationId, suiteId } = context;

        switch (operation) {
            case 'create':
                if (!permissionChecker.can(PERMISSIONS.CREATE_PROJECTS)) {
                    throw new SuitePermissionError('You do not have permission to create suites');
                }

                // Individual users cannot create suites in organizations
                if (organizationId && isIndividualAccount(userProfile)) {
                    throw new SuitePermissionError(
                        'Individual accounts cannot create suites in organizations. Upgrade to an organization account to access team features.',
                        'UPGRADE_REQUIRED'
                    );
                }

                // Organization users must be members of the target org
                if (organizationId && userProfile.organizationId !== organizationId) {
                    throw new SuitePermissionError('You are not a member of this organization');
                }
                break;

            case 'read':
                if (!permissionChecker.can(PERMISSIONS.READ_PROJECTS)) {
                    throw new SuitePermissionError('You do not have permission to view suites');
                }
                break;

            case 'update':
                if (!permissionChecker.can(PERMISSIONS.WRITE_PROJECTS)) {
                    throw new SuitePermissionError('You do not have permission to update suites');
                }

                // Additional context-based validation for specific suite
                if (suiteId && !permissionChecker.canAccessSuite('write', context)) {
                    throw new SuitePermissionError('You do not have permission to update this suite');
                }
                break;

            case 'delete':
                if (!permissionChecker.can(PERMISSIONS.DELETE_PROJECTS)) {
                    throw new SuitePermissionError('You do not have permission to delete suites');
                }

                // Additional context-based validation for specific suite
                if (suiteId && !permissionChecker.canAccessSuite('delete', context)) {
                    throw new SuitePermissionError('You do not have permission to delete this suite');
                }
                break;

            default:
                throw new SuiteValidationError(`Invalid operation: ${operation}`);
        }

        return { userProfile, permissionChecker };
    } catch (error) {
        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError) {
            throw error;
        }
        console.error('Error validating suite permissions:', error);
        throw new SuitePermissionError('Permission validation failed');
    }
};

/**
 * Check if suite name exists (case-insensitive)
 * Supports both flat structure and subcollection structure
 */
export const checkSuiteNameExists = async (name, userId, organizationId = null) => {
    try {
        // Validate permissions first
        await validateSuitePermissions(userId, 'read', { organizationId });

        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }

        let q;
        if (organizationId) {
            // Check in organization's subcollection (new structure)
            const suitesRef = collection(db, 'organizations', organizationId, 'suites');
            q = query(
                suitesRef,
                where('normalizedName', '==', validation.normalizedName)
            );
        } else {
            // Check in flat suites collection (existing structure)
            q = query(
                collection(db, 'suites'),
                where('normalizedName', '==', validation.normalizedName),
                where('createdBy', '==', userId),
                where('organizationId', '==', null)
            );
        }

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking suite name:', error);
        throw error;
    }
};

/**
 * Create a new suite
 * Supports both flat structure and subcollection structure
 */
export const createSuite = async (suiteData, userId, organizationId = null) => {
    try {
        const { name, description = '' } = suiteData;
        
        // Validate suite name
        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }

        // Validate permissions
        await validateSuitePermissions(userId, 'create', { 
            organizationId, 
            suiteData 
        });

        // Check if name already exists
        const nameExists = await checkSuiteNameExists(name, userId, organizationId);
        if (nameExists) {
            throw new SuiteValidationError('A suite with this name already exists. Please choose a different name.');
        }

        const baseSuiteData = {
            name: name.trim(),
            normalizedName: validation.normalizedName,
            description: description.trim(),
            createdBy: userId,
            organizationId: organizationId || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            members: [userId], // Creator is automatically a member
            status: 'active',
            settings: {
                defaultAssignee: userId,
                testCasePrefix: 'TC',
                bugReportPrefix: 'BUG',
                enableAIGeneration: true,
                enableScreenRecording: true
            },
            stats: {
                totalTestCases: 0,
                totalBugReports: 0,
                automatedTests: 0,
                lastActivity: serverTimestamp()
            }
        };

        let docRef;
        if (organizationId) {
            // Create in organization's subcollection (new structure)
            const suitesRef = collection(db, 'organizations', organizationId, 'suites');
            docRef = await addDoc(suitesRef, baseSuiteData);
            
            // Update organization's suite count
            const orgRef = doc(db, 'organizations', organizationId);
            const orgDoc = await getDoc(orgRef);
            
            if (orgDoc.exists()) {
                const currentSuiteCount = orgDoc.data().suiteCount || 0;
                await updateDoc(orgRef, {
                    suiteCount: currentSuiteCount + 1,
                    updatedAt: serverTimestamp()
                });
            }
        } else {
            // Create in flat suites collection (existing structure)
            docRef = await addDoc(collection(db, 'suites'), baseSuiteData);
        }

        return {
            success: true,
            suiteId: docRef.id,
            suite: { id: docRef.id, ...baseSuiteData }
        };
    } catch (error) {
        console.error('Error creating suite:', error);
        
        if (error instanceof SuitePermissionError || error instanceof SuiteValidationError) {
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
 * Get all suites for a specific organization
 */
export const getOrganizationSuites = async (organizationId, userId) => {
    try {
        if (!organizationId) {
            throw new SuiteValidationError('Organization ID is required');
        }

        // Validate permissions
        await validateSuitePermissions(userId, 'read', { organizationId });

        const suitesRef = collection(db, 'organizations', organizationId, 'suites');
        const q = query(suitesRef, orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const suites = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return suites;
    } catch (error) {
        console.error('Error fetching organization suites:', error);
        throw error;
    }
};

/**
 * Get all suites for a user across all organizations and personal suites
 */
export const getUserSuites = async (userId) => {
    try {
        // Validate permissions
        const { userProfile } = await validateSuitePermissions(userId, 'read');
        const userSuites = [];

        // Get personal suites (flat structure) - only for individual accounts
        if (isIndividualAccount(userProfile) || !userProfile.organizationId) {
            try {
                const personalSuitesQuery = query(
                    collection(db, 'suites'),
                    where('createdBy', '==', userId),
                    where('organizationId', '==', null),
                    orderBy('createdAt', 'desc')
                );
                
                const personalSnapshot = await getDocs(personalSuitesQuery);
                personalSnapshot.docs.forEach(suiteDoc => {
                    userSuites.push({
                        id: suiteDoc.id,
                        ...suiteDoc.data(),
                        organizationName: null,
                        organizationId: null
                    });
                });
            } catch (error) {
                console.warn('Error fetching personal suites:', error);
                // Continue execution even if personal suites fail
            }
        }

        // Get organization suites (subcollection structure)
        if (isOrganizationAccount(userProfile)) {
            try {
                const orgsQuery = query(
                    collection(db, 'organizations'),
                    where('members', 'array-contains', userId)
                );
                
                const orgsSnapshot = await getDocs(orgsQuery);

                for (const orgDoc of orgsSnapshot.docs) {
                    const orgId = orgDoc.id;
                    const orgData = orgDoc.data();
                    
                    const suitesRef = collection(db, 'organizations', orgId, 'suites');
                    const suitesQuery = query(
                        suitesRef, 
                        where('members', 'array-contains', userId),
                        orderBy('createdAt', 'desc')
                    );
                    
                    const suitesSnapshot = await getDocs(suitesQuery);
                    
                    suitesSnapshot.docs.forEach(suiteDoc => {
                        userSuites.push({
                            id: suiteDoc.id,
                            ...suiteDoc.data(),
                            organizationName: orgData.name,
                            organizationId: orgId
                        });
                    });
                }
            } catch (error) {
                console.warn('Error fetching organization suites:', error);
                // Continue execution even if org suites fail
            }
        }

        // Sort all suites by creation date
        return userSuites.sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bDate - aDate;
        });
    } catch (error) {
        console.error('Error fetching user suites:', error);
        throw error;
    }
};

/**
 * Get a specific suite
 * Supports both flat structure and subcollection structure
 */
export const getSuite = async (suiteId, organizationId = null, userId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        let suiteRef;
        if (organizationId) {
            // Get from organization's subcollection
            suiteRef = doc(db, 'organizations', organizationId, 'suites', suiteId);
        } else {
            // Get from flat suites collection
            suiteRef = doc(db, 'suites', suiteId);
        }

        const suiteDoc = await getDoc(suiteRef);

        if (!suiteDoc.exists()) {
            throw new SuiteValidationError('Suite not found');
        }

        const suiteData = {
            id: suiteDoc.id,
            ...suiteDoc.data()
        };

        // Validate permissions if userId is provided
        if (userId) {
            await validateSuitePermissions(userId, 'read', {
                suiteId,
                organizationId,
                suiteOwnerId: suiteData.createdBy,
                isPublic: suiteData.isPublic || false
            });
        }

        return suiteData;
    } catch (error) {
        console.error('Error fetching suite:', error);
        throw error;
    }
};

/**
 * Update suite
 * Supports both flat structure and subcollection structure
 */
export const updateSuite = async (suiteId, updates, userId, organizationId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        // Get existing suite first to validate ownership
        const existingSuite = await getSuite(suiteId, organizationId);

        // Validate permissions
        await validateSuitePermissions(userId, 'update', {
            suiteId,
            organizationId,
            suiteOwnerId: existingSuite.createdBy,
            isPublic: existingSuite.isPublic || false
        });

        let suiteRef;
        if (organizationId) {
            suiteRef = doc(db, 'organizations', organizationId, 'suites', suiteId);
        } else {
            suiteRef = doc(db, 'suites', suiteId);
        }

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        await updateDoc(suiteRef, updateData);
        
        return {
            success: true,
            suite: {
                id: suiteId,
                ...existingSuite,
                ...updateData
            }
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
 * Delete suite
 * Supports both flat structure and subcollection structure
 */
export const deleteSuite = async (suiteId, userId, organizationId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        // Get existing suite first to validate ownership
        const existingSuite = await getSuite(suiteId, organizationId);

        // Validate permissions
        await validateSuitePermissions(userId, 'delete', {
            suiteId,
            organizationId,
            suiteOwnerId: existingSuite.createdBy,
            isPublic: existingSuite.isPublic || false
        });

        let suiteRef;
        if (organizationId) {
            suiteRef = doc(db, 'organizations', organizationId, 'suites', suiteId);
            
            // Update organization's suite count
            const orgRef = doc(db, 'organizations', organizationId);
            const orgDoc = await getDoc(orgRef);
            
            if (orgDoc.exists()) {
                const currentSuiteCount = orgDoc.data().suiteCount || 0;
                await updateDoc(orgRef, {
                    suiteCount: Math.max(0, currentSuiteCount - 1),
                    updatedAt: serverTimestamp()
                });
            }
        } else {
            suiteRef = doc(db, 'suites', suiteId);
        }

        await deleteDoc(suiteRef);
        
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
 * Listen to suite changes
 * Supports both flat structure and subcollection structure
 */
export const subscribeToSuites = (callback, organizationId = null, userId = null) => {
    try {
        if (!userId) {
            throw new SuiteValidationError('User ID is required for subscription');
        }

        let q;
        
        if (organizationId) {
            // Subscribe to organization suites
            const suitesRef = collection(db, 'organizations', organizationId, 'suites');
            q = query(suitesRef, orderBy('createdAt', 'desc'));
        } else {
            // Subscribe to personal suites
            q = query(
                collection(db, 'suites'),
                where('createdBy', '==', userId),
                where('organizationId', '==', null),
                orderBy('createdAt', 'desc')
            );
        }
        
        return onSnapshot(q, 
            (querySnapshot) => {
                const suites = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(suites);
            },
            (error) => {
                console.error('Error in suite subscription:', error);
                callback([]); // Return empty array on error
            }
        );
    } catch (error) {
        console.error('Error subscribing to suites:', error);
        throw error;
    }
};

/**
 * Switch user's active suite (NEW FUNCTIONALITY)
 * Note: This uses in-memory storage instead of localStorage for Claude.ai compatibility
 */
let currentSuiteData = {};

export const switchSuite = async (userId, suiteId, organizationId = null) => {
    try {
        // Validate that user can access this suite
        await getSuite(suiteId, organizationId, userId);

        const suiteData = {
            organizationId,
            suiteId,
            timestamp: new Date().toISOString()
        };

        // Store in memory instead of localStorage
        currentSuiteData[userId] = suiteData;

        // Update user's profile with last accessed suite
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastAccessedSuite: {
                organizationId,
                suiteId,
                accessedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
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

/**
 * Get user's current suite selection (NEW FUNCTIONALITY)
 */
export const getCurrentSuite = (userId) => {
    try {
        return currentSuiteData[userId] || null;
    } catch (error) {
        console.error('Error getting current suite:', error);
        return null;
    }
};

// Export all functions in an object for backward compatibility
export const suiteService = {
    createSuite,
    checkSuiteNameExists,
    getOrganizationSuites,
    getUserSuites,
    getSuite,
    updateSuite,
    deleteSuite,
    subscribeToSuites,
    switchSuite,
    getCurrentSuite
};

// Default export for backward compatibility
export default suiteService;