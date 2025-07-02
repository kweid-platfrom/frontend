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
    limit,
    onSnapshot,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
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
 * ALIGNED: Get user profile to determine capabilities
 */
const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            // Ensure user document exists
            await setDoc(userRef, {
                user_id: userId,
                created_at: serverTimestamp(),
                preferences: {},
                contact_info: {}
            }, { merge: true });
            
            return { user_id: userId, account_memberships: [] };
        }
        
        return userDoc.data();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * ALIGNED: Get feature limits based on subscription context
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

    // Check if user is on trial
    const isTrialActive = subscriptionStatus.isTrialActive ||
        subscriptionStatus.subscriptionStatus === 'trial';

    if (isTrialActive) {
        const accountType = userProfile?.accountType || 'individual';
        
        if (accountType === 'organization') {
            const orgType = subscriptionStatus.subscriptionType || 'organization_trial';
            if (orgType.includes('enterprise')) {
                return {
                    suites: -1, // unlimited
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1
                };
            } else {
                return {
                    suites: 10, // team level
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1
                };
            }
        } else {
            return {
                suites: 5, // individual trial
                testCases: -1,
                recordings: -1,
                automatedScripts: -1
            };
        }
    }

    // Non-trial limits
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
 * ALIGNED: Count user's current suites from testSuites collection
 */
const getCurrentSuiteCount = async (userId, userProfile = null) => {
    try {
        const profile = userProfile || await getUserProfile(userId);
        let totalSuites = 0;

        // Count individual suites
        const individualQuery = query(
            collection(db, 'testSuites'),
            where('ownerType', '==', 'individual'),
            where('ownerId', '==', userId)
        );
        
        const individualSnapshot = await getDocs(individualQuery);
        totalSuites += individualSnapshot.size;

        // Count organization suites where user is creator
        if (profile.account_memberships?.length > 0) {
            for (const membership of profile.account_memberships) {
                if (membership.org_id && membership.status === 'active') {
                    try {
                        const orgQuery = query(
                            collection(db, 'testSuites'),
                            where('ownerType', '==', 'organization'),
                            where('ownerId', '==', membership.org_id),
                            where('createdBy', '==', userId)
                        );
                        
                        const orgSnapshot = await getDocs(orgQuery);
                        totalSuites += orgSnapshot.size;
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
 * ALIGNED: Validate user permissions with new structure
 */
const validateSuitePermissions = async (userId, operation, context = {}) => {
    try {
        const userProfile = await getUserProfile(userId);
        const { organizationId, suiteId } = context;

        switch (operation) {
            case 'create':
                // For organization suites, verify admin permissions
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
                // Basic read permission validation
                break;

            case 'update':
            case 'delete':
                if (suiteId) {
                    const suite = await getSuiteById(suiteId);
                    if (!suite) {
                        throw new SuiteValidationError('Suite not found');
                    }

                    // Check if user has permission
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

                    // For delete, require creator or admin
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
 * ALIGNED: Get suite by ID from testSuites collection
 */
const getSuiteById = async (suiteId) => {
    try {
        const suiteRef = doc(db, 'testSuites', suiteId);
        const suiteDoc = await getDoc(suiteRef);
        return suiteDoc.exists() ? { suite_id: suiteDoc.id, ...suiteDoc.data() } : null;
    } catch (error) {
        console.error('Error getting suite by ID:', error);
        return null;
    }
};

/**
 * ALIGNED: Check if suite name exists
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

        const q = query(
            collection(db, 'testSuites'),
            where('ownerType', '==', ownerType),
            where('ownerId', '==', ownerId),
            where('name', '==', name.trim())
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking suite name:', error);
        throw error;
    }
};

/**
 * ALIGNED: Create a new suite using testSuites collection
 */
export const createSuite = async (suiteData, userId, subscriptionStatus = null, organizationId = null) => {
    try {
        const { name, description = '', tags = [] } = suiteData;
        
        // Validate suite name
        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }

        // Validate permissions
        const { userProfile } = await validateSuitePermissions(userId, 'create', { 
            organizationId, 
            suiteData 
        });

        // Check limits
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

        // Check if name already exists
        const nameExists = await checkSuiteNameExists(name, userId, organizationId);
        if (nameExists) {
            throw new SuiteValidationError(
                'A suite with this name already exists. Please choose a different name.'
            );
        }

        // ALIGNED: Create suite with new structure
        const ownerType = organizationId ? 'organization' : 'individual';
        const ownerId = organizationId || userId;

        const newSuite = {
            // Core identification
            ownerType,
            ownerId,
            
            // Metadata
            name: name.trim(),
            description: description.trim(),
            status: 'active',
            tags: tags || [],
            
            // Audit fields
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            
            // Access control
            permissions: {
                [userId]: 'admin'
            },
            
            // Testing assets structure
            testingAssets: {
                bugs: [],
                testCases: [],
                recordings: [],
                automatedScripts: [],
                dashboardMetrics: {},
                reports: [],
                settings: {}
            },
            
            // Collaboration
            collaboration: {
                activityLog: [],
                comments: [],
                notifications: []
            }
        };

        // Create in testSuites collection
        const collectionRef = collection(db, 'testSuites');
        const docRef = await addDoc(collectionRef, newSuite);
        
        // Update with document ID
        await updateDoc(docRef, {
            suite_id: docRef.id,
            updatedAt: serverTimestamp()
        });

        const createdSuite = { ...newSuite, suite_id: docRef.id };

        console.log('Suite created successfully:', {
            suiteId: docRef.id,
            userId,
            organizationId,
            ownerType,
            ownerId
        });

        return {
            success: true,
            suiteId: docRef.id,
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
 * ALIGNED: Get all suites for a user using testSuites collection
 */
export const getUserSuites = async (userId) => {
    try {
        const userProfile = await getUserProfile(userId);
        const userSuites = [];

        // Get individual suites
        try {
            const individualQuery = query(
                collection(db, 'testSuites'),
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const individualSnapshot = await getDocs(individualQuery);
            const individualSuites = individualSnapshot.docs.map(doc => ({
                suite_id: doc.id,
                ...doc.data(),
                accountType: 'individual',
                membershipType: 'individual'
            }));

            userSuites.push(...individualSuites);
        } catch (error) {
            console.error('Error fetching individual suites:', error);
        }

        // Get organization suites
        if (userProfile.account_memberships?.length > 0) {
            for (const membership of userProfile.account_memberships) {
                if (membership.org_id && membership.status === 'active') {
                    try {
                        const orgQuery = query(
                            collection(db, 'testSuites'),
                            where('ownerType', '==', 'organization'),
                            where('ownerId', '==', membership.org_id),
                            orderBy('createdAt', 'desc'),
                            limit(25)
                        );

                        const orgSnapshot = await getDocs(orgQuery);
                        const orgSuites = orgSnapshot.docs.map(doc => ({
                            suite_id: doc.id,
                            ...doc.data(),
                            accountType: 'organization',
                            organizationId: membership.org_id,
                            membershipType: 'organization',
                            userRole: membership.role
                        }));

                        userSuites.push(...orgSuites);
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
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
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
 * Get a specific suite
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

        // Validate permissions if userId is provided
        if (userId) {
            await validateSuitePermissions(userId, 'read', {
                suiteId
            });
        }

        return suite;
    } catch (error) {
        console.error('Error fetching suite:', error);
        throw error;
    }
};

/**
 * ALIGNED: Update suite in testSuites collection
 */
export const updateSuite = async (suiteId, updates, userId) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        // Validate permissions
        await validateSuitePermissions(userId, 'update', { suiteId });

        const suiteRef = doc(db, 'testSuites', suiteId);

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        await updateDoc(suiteRef, updateData);
        
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
 * ALIGNED: Delete suite from testSuites collection
 */
export const deleteSuite = async (suiteId, userId) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        // Validate permissions
        await validateSuitePermissions(userId, 'delete', { suiteId });

        const suiteRef = doc(db, 'testSuites', suiteId);
        await deleteDoc(suiteRef);
        
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
 * ALIGNED: Listen to suite changes in testSuites collection
 */
export const subscribeToSuites = (callback, userId) => {
    try {
        if (!userId) {
            throw new SuiteValidationError('User ID is required for subscription');
        }

        // Subscribe to individual suites
        const individualQuery = query(
            collection(db, 'testSuites'),
            where('ownerType', '==', 'individual'),
            where('ownerId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        return onSnapshot(individualQuery, 
            (querySnapshot) => {
                const suites = querySnapshot.docs.map(doc => ({
                    suite_id: doc.id,
                    ...doc.data()
                }));
                callback(suites);
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
        // Validate that user can access this suite
        await getSuite(suiteId, userId);

        const suiteData = {
            suiteId,
            timestamp: new Date().toISOString()
        };

        // Store in memory
        currentSuiteData[userId] = suiteData;

        // Update user's profile with last accessed suite
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastAccessedSuite: {
                suiteId,
                accessedAt: serverTimestamp()
            },
            updated_at: serverTimestamp()
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