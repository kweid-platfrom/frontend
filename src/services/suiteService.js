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
import { accountService } from './accountService';

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
 * ALIGNED: Get user profile using accountService architecture
 */
const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        
        // Process with accountService to get current capabilities
        const processedProfile = accountService.checkAndUpdateTrialStatus(userData);
        
        return processedProfile;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

/**
 * ALIGNED: Get user capabilities and check suite limits
 */
const getUserCapabilitiesAndLimits = async (userId) => {
    try {
        const userProfile = await getUserProfile(userId);
        const capabilities = accountService.getUserCapabilities(userProfile);
        
        return {
            userProfile,
            capabilities,
            canCreateSuites: capabilities.canCreateMultipleSuites || capabilities.limits.suites > 0,
            suitesLimit: capabilities.limits.suites,
            isTrialActive: capabilities.isTrialActive,
            accountType: capabilities.accountType
        };
    } catch (error) {
        console.error('Error getting user capabilities:', error);
        throw error;
    }
};

/**
 * ALIGNED: Count user's current suites across all memberships
 */
const getCurrentSuiteCount = async (userId, userProfile = null) => {
    try {
        const profile = userProfile || await getUserProfile(userId);
        let totalSuites = 0;

        if (!profile.account_memberships || !Array.isArray(profile.account_memberships)) {
            return 0;
        }

        // Count suites from individual accounts
        for (const membership of profile.account_memberships) {
            if (membership.account_type === 'individual' && membership.owned_test_suites) {
                totalSuites += Array.isArray(membership.owned_test_suites) ? 
                    membership.owned_test_suites.length : 0;
            }
        }

        // Count suites from organization memberships
        const orgMemberships = profile.account_memberships.filter(m => m.org_id);
        
        for (const membership of orgMemberships) {
            try {
                const orgSuites = await getOrganizationSuites(membership.org_id, userId, false);
                // Only count suites created by this user
                const userCreatedSuites = orgSuites.filter(suite => suite.createdBy === userId);
                totalSuites += userCreatedSuites.length;
            } catch (error) {
                console.warn(`Error counting suites for org ${membership.org_id}:`, error);
            }
        }

        return totalSuites;
    } catch (error) {
        console.error('Error counting user suites:', error);
        return 0;
    }
};

/**
 * ALIGNED: Validate user permissions for suite operations with subscription checks
 */
const validateSuitePermissions = async (userId, operation, context = {}) => {
    try {
        const { capabilities, userProfile, canCreateSuites, suitesLimit } = 
            await getUserCapabilitiesAndLimits(userId);
        
        const { organizationId, suiteId } = context;

        switch (operation) {
            case 'create':
                // Check if user can create suites based on subscription
                if (!canCreateSuites) {
                    throw new SuitePermissionError(
                        'Your current plan does not support creating multiple suites. Please upgrade to create more projects.',
                        'UPGRADE_REQUIRED'
                    );
                }

                // Check suite limits
                if (suitesLimit > 0) { // -1 means unlimited
                    const currentCount = await getCurrentSuiteCount(userId, userProfile);
                    if (currentCount >= suitesLimit) {
                        const trialMessage = capabilities.isTrialActive ? 
                            ` You have ${capabilities.trialDaysRemaining} days remaining in your trial.` : '';
                        
                        throw new SuiteLimitError(
                            `You've reached your suite limit of ${suitesLimit}.${trialMessage} Please upgrade your plan to create more projects.`,
                            'LIMIT_EXCEEDED'
                        );
                    }
                }

                // Organization-specific validations
                if (organizationId) {
                    const hasOrgMembership = userProfile.account_memberships?.some(
                        m => m.org_id === organizationId && m.status === 'active'
                    );
                    
                    if (!hasOrgMembership) {
                        throw new SuitePermissionError(
                            'You are not a member of this organization',
                            'NOT_ORGANIZATION_MEMBER'
                        );
                    }

                    // Check if organization allows team collaboration
                    if (!capabilities.canInviteTeamMembers && capabilities.accountType === 'individual') {
                        throw new SuitePermissionError(
                            'Team collaboration is not available on your current plan. Please upgrade to access organization features.',
                            'UPGRADE_REQUIRED'
                        );
                    }
                }
                break;

            case 'read':
                // Basic read permission - most users can read their own suites
                break;

            case 'update':
                // Check if user can write to projects
                if (suiteId) {
                    const suite = await getSuiteById(suiteId, organizationId);
                    if (!suite) {
                        throw new SuiteValidationError('Suite not found');
                    }

                    // Check ownership or membership
                    if (suite.createdBy !== userId && 
                        (!suite.members || !suite.members.includes(userId))) {
                        throw new SuitePermissionError(
                            'You do not have permission to update this suite',
                            'NOT_SUITE_MEMBER'
                        );
                    }
                }
                break;

            case 'delete':
                if (suiteId) {
                    const suite = await getSuiteById(suiteId, organizationId);
                    if (!suite) {
                        throw new SuiteValidationError('Suite not found');
                    }

                    // Only suite creator can delete (stricter than update)
                    if (suite.createdBy !== userId) {
                        throw new SuitePermissionError(
                            'Only the suite creator can delete this suite',
                            'NOT_SUITE_OWNER'
                        );
                    }
                }
                break;

            default:
                throw new SuiteValidationError(`Invalid operation: ${operation}`);
        }

        return { userProfile, capabilities };
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
 * Helper function to get suite by ID
 */
const getSuiteById = async (suiteId, organizationId = null) => {
    try {
        let suiteRef;
        if (organizationId) {
            suiteRef = doc(db, 'organizations', organizationId, 'suites', suiteId);
        } else {
            suiteRef = doc(db, 'suites', suiteId);
        }

        const suiteDoc = await getDoc(suiteRef);
        return suiteDoc.exists() ? { id: suiteDoc.id, ...suiteDoc.data() } : null;
    } catch (error) {
        console.error('Error getting suite by ID:', error);
        return null;
    }
};

/**
 * ALIGNED: Check if suite name exists (case-insensitive)
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
            // Check in organization's subcollection
            const suitesRef = collection(db, 'organizations', organizationId, 'suites');
            q = query(
                suitesRef,
                where('normalizedName', '==', validation.normalizedName)
            );
        } else {
            // Check in flat suites collection
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
 * ALIGNED: Create a new suite with subscription limit validation
 */
export const createSuite = async (suiteData, userId, organizationId = null) => {
    try {
        const { name, description = '' } = suiteData;
        
        // Validate suite name
        const validation = validateSuiteName(name);
        if (!validation.isValid) {
            throw new SuiteValidationError(validation.errors[0]);
        }

        // ALIGNED: Validate permissions and limits
        const { userProfile, capabilities } = await validateSuitePermissions(userId, 'create', { 
            organizationId, 
            suiteData 
        });

        // Check if name already exists
        const nameExists = await checkSuiteNameExists(name, userId, organizationId);
        if (nameExists) {
            throw new SuiteValidationError(
                'A suite with this name already exists. Please choose a different name.'
            );
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
                enableAIGeneration: capabilities.canUseAutomation || false,
                enableScreenRecording: true
            },
            stats: {
                totalTestCases: 0,
                totalBugReports: 0,
                automatedTests: 0,
                lastActivity: serverTimestamp()
            },
            // ALIGNED: Add subscription context
            createdUnderPlan: capabilities.subscriptionType,
            createdDuringTrial: capabilities.isTrialActive
        };

        let docRef;
        if (organizationId) {
            // Create in organization's subcollection
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
            // Create in flat suites collection
            docRef = await addDoc(collection(db, 'suites'), baseSuiteData);
            
            // ALIGNED: Update user's owned_test_suites array
            await updateUserOwnedSuites(userId, docRef.id, 'add');
        }

        console.log('Suite created successfully:', {
            suiteId: docRef.id,
            userId,
            organizationId,
            subscriptionType: capabilities.subscriptionType,
            isTrialActive: capabilities.isTrialActive
        });

        return {
            success: true,
            suiteId: docRef.id,
            suite: { id: docRef.id, ...baseSuiteData },
            subscriptionInfo: {
                type: capabilities.subscriptionType,
                isTrialActive: capabilities.isTrialActive,
                remainingSlots: capabilities.limits.suites > 0 ? 
                    capabilities.limits.suites - (await getCurrentSuiteCount(userId, userProfile) + 1) : -1
            }
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
 * ALIGNED: Update user's owned_test_suites array in account_memberships
 */
const updateUserOwnedSuites = async (userId, suiteId, operation = 'add') => {
    try {
        const userProfile = await getUserProfile(userId);
        
        if (!userProfile.account_memberships || !Array.isArray(userProfile.account_memberships)) {
            return;
        }

        const updatedMemberships = userProfile.account_memberships.map(membership => {
            if (membership.account_type === 'individual') {
                const ownedSuites = Array.isArray(membership.owned_test_suites) ? 
                    membership.owned_test_suites : [];
                
                if (operation === 'add' && !ownedSuites.includes(suiteId)) {
                    return {
                        ...membership,
                        owned_test_suites: [...ownedSuites, suiteId]
                    };
                } else if (operation === 'remove') {
                    return {
                        ...membership,
                        owned_test_suites: ownedSuites.filter(id => id !== suiteId)
                    };
                }
            }
            return membership;
        });

        await updateDoc(doc(db, 'users', userId), {
            account_memberships: updatedMemberships,
            updated_at: new Date()
        });
    } catch (error) {
        console.error('Error updating user owned suites:', error);
        // Don't throw - this is a secondary operation
    }
};

/**
 * ALIGNED: Get all suites for a specific organization
 */
export const getOrganizationSuites = async (organizationId, userId, validatePermissions = true) => {
    try {
        if (!organizationId) {
            throw new SuiteValidationError('Organization ID is required');
        }

        // Validate permissions if requested
        if (validatePermissions) {
            await validateSuitePermissions(userId, 'read', { organizationId });
        }

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
 * ALIGNED: Get all suites for a user across all organizations and personal suites
 */
export const getUserSuites = async (userId) => {
    try {
        // Get user capabilities to determine what they can access
        const { userProfile, capabilities } = await getUserCapabilitiesAndLimits(userId);
        const userSuites = [];

        // Get personal suites (flat structure) - for individual accounts
        if (userProfile.account_memberships) {
            for (const membership of userProfile.account_memberships) {
                if (membership.account_type === 'individual' && membership.owned_test_suites) {
                    try {
                        // Fetch actual suite documents
                        for (const suiteId of membership.owned_test_suites) {
                            const suiteRef = doc(db, 'suites', suiteId);
                            const suiteDoc = await getDoc(suiteRef);
                            
                            if (suiteDoc.exists()) {
                                userSuites.push({
                                    id: suiteDoc.id,
                                    ...suiteDoc.data(),
                                    organizationName: null,
                                    organizationId: null,
                                    membershipType: 'individual'
                                });
                            }
                        }
                    } catch (error) {
                        console.warn('Error fetching personal suites:', error);
                    }
                }

                // Get organization suites
                if (membership.org_id && membership.status === 'active') {
                    try {
                        const orgSuites = await getOrganizationSuites(membership.org_id, userId, false);
                        
                        // Get organization details
                        const orgRef = doc(db, 'organizations', membership.org_id);
                        const orgDoc = await getDoc(orgRef);
                        const orgName = orgDoc.exists() ? orgDoc.data().organization_profile?.name : 'Unknown Organization';
                        
                        // Filter suites user has access to
                        const accessibleSuites = orgSuites.filter(suite => 
                            suite.members && suite.members.includes(userId)
                        );
                        
                        accessibleSuites.forEach(suite => {
                            userSuites.push({
                                ...suite,
                                organizationName: orgName,
                                organizationId: membership.org_id,
                                membershipType: 'organization',
                                userRole: membership.role
                            });
                        });
                    } catch (error) {
                        console.warn(`Error fetching suites for org ${membership.org_id}:`, error);
                    }
                }
            }
        }

        // Sort all suites by creation date
        const sortedSuites = userSuites.sort((a, b) => {
            const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bDate - aDate;
        });

        // Add metadata about user's subscription
        return {
            suites: sortedSuites,
            metadata: {
                totalCount: sortedSuites.length,
                limit: capabilities.limits.suites,
                remaining: capabilities.limits.suites > 0 ? 
                    Math.max(0, capabilities.limits.suites - sortedSuites.length) : -1,
                isTrialActive: capabilities.isTrialActive,
                trialDaysRemaining: capabilities.trialDaysRemaining,
                subscriptionType: capabilities.subscriptionType,
                canCreateMore: capabilities.limits.suites === -1 || 
                    sortedSuites.length < capabilities.limits.suites
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
export const getSuite = async (suiteId, organizationId = null, userId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        const suite = await getSuiteById(suiteId, organizationId);
        
        if (!suite) {
            throw new SuiteValidationError('Suite not found');
        }

        // Validate permissions if userId is provided
        if (userId) {
            await validateSuitePermissions(userId, 'read', {
                suiteId,
                organizationId,
                suiteOwnerId: suite.createdBy,
                isPublic: suite.isPublic || false
            });
        }

        return suite;
    } catch (error) {
        console.error('Error fetching suite:', error);
        throw error;
    }
};

/**
 * Update suite
 */
export const updateSuite = async (suiteId, updates, userId, organizationId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        // Validate permissions
        await validateSuitePermissions(userId, 'update', {
            suiteId,
            organizationId
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
        
        const updatedSuite = await getSuiteById(suiteId, organizationId);
        
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
 * ALIGNED: Delete suite with proper cleanup
 */
export const deleteSuite = async (suiteId, userId, organizationId = null) => {
    try {
        if (!suiteId) {
            throw new SuiteValidationError('Suite ID is required');
        }

        // Validate permissions
        await validateSuitePermissions(userId, 'delete', {
            suiteId,
            organizationId
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
            
            // ALIGNED: Remove from user's owned_test_suites array
            await updateUserOwnedSuites(userId, suiteId, 'remove');
        }

        await deleteDoc(suiteRef);
        
        console.log('Suite deleted successfully:', {
            suiteId,
            userId,
            organizationId
        });
        
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
 * ALIGNED: Check if user can create a new suite
 */
export const canCreateNewSuite = async () => {
    try {
        const result = await accountService.canCreateNewProject(null);
        
        return {
            canCreate: result.canCreate,
            currentCount: result.currentCount,
            maxAllowed: result.maxAllowed,
            remaining: result.remaining,
            isTrialActive: result.isTrialActive,
            subscriptionType: result.subscriptionType,
            message: result.canCreate ? 
                `You can create ${result.remaining} more suite${result.remaining !== 1 ? 's' : ''}` :
                `You've reached your limit of ${result.maxAllowed} suite${result.maxAllowed !== 1 ? 's' : ''}. Please upgrade to create more.`
        };
    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 0,
            remaining: 0,
            isTrialActive: false,
            subscriptionType: 'free',
            message: 'Unable to check suite creation limits'
        };
    }
};

/**
 * Switch user's active suite (memory-based for Claude.ai compatibility)
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

/**
 * Get user's current suite selection
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
    getCurrentSuite,
    canCreateNewSuite
};

// Default export for backward compatibility
export default suiteService;