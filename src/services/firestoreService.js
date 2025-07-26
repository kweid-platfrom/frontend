import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import FirestoreDebugger from '../components/FirestoreDebugger';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

class FirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
    }

    getCurrentUserId() {
        return this.auth.currentUser?.uid;
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    validateDocId(docId) {
        if (!docId || docId === null || docId === undefined) {
            return null;
        }
        const stringId = String(docId).trim();
        if (stringId === '' || stringId === 'null' || stringId === 'undefined') {
            return null;
        }
        return stringId;
    }

    createDocRef(collectionPath, ...pathSegments) {
        const validSegments = pathSegments
            .filter(segment => segment !== null && segment !== undefined && segment !== '')
            .map(segment => {
                const stringSegment = String(segment).trim();
                if (stringSegment === '' || stringSegment === 'null' || stringSegment === 'undefined') {
                    throw new Error(`Invalid path segment: ${segment}`);
                }
                return stringSegment;
            });

        if (validSegments.length === 0) {
            throw new Error('Document ID is required');
        }

        return doc(this.db, collectionPath, ...validSegments);
    }

    createCollectionRef(collectionPath) {
        if (!collectionPath || typeof collectionPath !== 'string') {
            throw new Error('Collection path must be a non-empty string');
        }
        return collection(this.db, collectionPath);
    }

    handleFirestoreError(error, operation = 'operation') {
        console.error(`Firestore ${operation} error:`, error);
        const userMessage = getFirebaseErrorMessage(error);
        return {
            success: false,
            error: {
                code: error.code || 'unknown',
                message: userMessage,
                originalError: error
            }
        };
    }
    addCommonFields(data, isUpdate = false) {
        const userId = this.getCurrentUserId();
        const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
            if (value === null || value === undefined) return undefined;
            return value;
        }));

        const commonFields = {
            updated_at: serverTimestamp(),
            ...(userId && { updated_by: userId })
        };

        if (!isUpdate) {
            commonFields.created_at = serverTimestamp();
            if (userId) {
                commonFields.created_by = userId;
            }
        }

        return { ...cleanData, ...commonFields };
    }

    async validateOrganizationAccess(orgId, requiredRole = 'member') {
        const userId = this.getCurrentUserId();
        if (!userId) return false;

        try {
            const orgDoc = await getDoc(this.createDocRef('organizations', orgId));
            if (orgDoc.exists() && orgDoc.data().ownerId === userId) {
                return true;
            }

            const memberDoc = await getDoc(this.createDocRef('organizations', orgId, 'members', userId));
            if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                if (requiredRole === 'member') return true;
                if (requiredRole === 'admin' && memberData.role === 'Admin') return true;
            }

            return false;
        } catch (error) {
            console.error('Error validating organization access:', error);
            return false;
        }
    }

    async validateTestSuiteAccess(suiteId, accessType = 'read') {
        const userId = this.getCurrentUserId();
        if (!userId) return false;

        try {
            const suiteDoc = await getDoc(this.createDocRef('testSuites', suiteId));
            if (!suiteDoc.exists()) return false;

            const suiteData = suiteDoc.data();

            if (suiteData.ownerType === 'individual' && suiteData.ownerId === userId) {
                return true;
            }

            if (suiteData.ownerType === 'organization') {
                const hasOrgAccess = await this.validateOrganizationAccess(suiteData.ownerId, 'member');
                if (hasOrgAccess) return true;
            }

            if (suiteData.admins && suiteData.admins.includes(userId)) return true;
            if (accessType === 'read' && suiteData.members && suiteData.members.includes(userId)) return true;

            return false;
        } catch (error) {
            console.error('Error validating test suite access:', error);
            return false;
        }
    }

    // Fixed createOrUpdateUserProfile method in firestoreService.js
    async createOrUpdateUserProfile(userData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        try {
            const userRef = this.createDocRef('users', userId);
            const userDoc = await getDoc(userRef);

            const currentUser = this.getCurrentUser();

            if (userDoc.exists()) {
                console.log('User document exists, updating...', { userId, userData });

                // FIXED: Include 'account_type' in allowed fields for updates
                const allowedFields = [
                    'preferences',
                    'contact_info',
                    'profile_picture',
                    'display_name',
                    'account_memberships',
                    'account_type'  // This was already here, which is good
                ];

                const filteredData = {};
                allowedFields.forEach(field => {
                    if (userData.hasOwnProperty(field)) {
                        filteredData[field] = userData[field];
                    }
                });

                const updateData = this.addCommonFields(filteredData, true);
                await updateDoc(userRef, updateData);

                // Return the updated data
                const existingData = userDoc.data();
                const finalData = {
                    user_id: userId,
                    email: currentUser?.email,
                    ...existingData,  // Keep existing data
                    ...filteredData   // Override with new data
                };

                return { success: true, data: { id: userId, ...finalData } };

            } else {
                console.log('Creating new user document...', { userId, userData });

                // FIXED: For new users, preserve the account_type from userData
                const createData = this.addCommonFields({
                    user_id: userId,
                    email: currentUser?.email,
                    display_name: userData.display_name,
                    account_type: userData.account_type,  // Explicitly preserve this
                    preferences: userData.preferences || {},
                    contact_info: userData.contact_info || {},
                    profile_picture: userData.profile_picture || null,
                    account_memberships: userData.account_memberships || []
                });

                console.log('Final createData before setDoc:', createData);

                await setDoc(userRef, createData);
                return { success: true, data: { id: userId, ...createData } };
            }
        } catch (error) {
            console.error('Error in createOrUpdateUserProfile:', error);
            return this.handleFirestoreError(error, 'create/update user profile');
        }
    }

    async getIndividualAccount(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        return await this.getDocument('individualAccounts', targetUserId);
    }

    async deleteIndividualAccount() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        return await this.deleteDocument('individualAccounts', userId);
    }

    async getUserProfile(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        return await this.getDocument('users', targetUserId);
    }
    // Updated createOrganization method in FirestoreService

    async createOrganization(orgData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        if (!orgData.name) {
            return { success: false, error: { message: 'Organization name is required' } };
        }

        try {
            console.log('Creating organization with userId:', userId, 'orgData:', orgData);

            const batch = writeBatch(this.db);

            // Generate organization ID if not provided
            const orgId = orgData.orgId || doc(this.createCollectionRef('organizations')).id;
            const orgRef = this.createDocRef('organizations', orgId);

            // Prepare organization data with required fields
            const organizationData = this.addCommonFields({
                name: orgData.name,
                description: orgData.description || '',
                ownerId: userId, // Ensure ownerId is set
                settings: orgData.settings || {},
                ...(orgData.customDomain && { customDomain: orgData.customDomain })
            });

            console.log('Setting organization document with data:', organizationData);
            batch.set(orgRef, organizationData);

            // Create member document for the creator with Admin role
            const memberRef = this.createDocRef('organizations', orgId, 'members', userId);
            const memberData = this.addCommonFields({
                user_id: userId,
                role: 'Admin', // Set as Admin for organization creator
                status: 'active',
                joined_at: serverTimestamp()
            });

            console.log('Setting member document with data:', memberData);
            batch.set(memberRef, memberData);

            // Create user membership document
            const userMembershipRef = this.createDocRef('userMemberships', userId, 'organizations', orgId);
            const userMembershipData = this.addCommonFields({
                user_id: userId,
                role: 'Admin', // Set as Admin for organization creator
                org_id: orgId,
                status: 'active'
            });

            console.log('Setting user membership document with data:', userMembershipData);
            batch.set(userMembershipRef, userMembershipData);

            // Execute the batch
            console.log('Executing batch write...');
            await batch.commit();

            console.log('Organization created successfully with ID:', orgId);
            return {
                success: true,
                data: {
                    id: orgId,
                    ...organizationData,
                    memberRole: 'Admin'
                }
            };

        } catch (error) {
            console.error('Error in createOrganization:', error);
            return this.handleFirestoreError(error, 'create organization');
        }
    }

    async createTestSuite(suiteData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteData.name || !['individual', 'organization'].includes(suiteData.ownerType) || !suiteData.ownerId) {
            return { success: false, error: { message: 'Invalid test suite data: name, ownerType, and ownerId required' } };
        }

        if (suiteData.ownerType === 'organization') {
            const hasOrgAccess = await this.validateOrganizationAccess(suiteData.ownerId, 'admin');
            if (!hasOrgAccess) {
                return { success: false, error: { message: 'Insufficient permissions to create test suite for this organization' } };
            }
        }

        if (suiteData.ownerType === 'individual' && suiteData.ownerId !== userId) {
            return { success: false, error: { message: 'Cannot create test suite for another individual' } };
        }

        try {
            const testSuiteData = this.addCommonFields({
                name: suiteData.name,
                description: suiteData.description || '',
                ownerType: suiteData.ownerType,
                ownerId: suiteData.ownerId,
                access_control: {
                    ownerType: suiteData.ownerType,
                    ownerId: suiteData.ownerId,
                    admins: suiteData.access_control?.admins || [userId],
                    members: suiteData.access_control?.members || [userId],
                    permissions_matrix: suiteData.access_control?.permissions_matrix || {}
                },
                isPublic: suiteData.isPublic || false,
                settings: suiteData.settings || {},
                tags: suiteData.tags || [],
                admins: suiteData.admins || [userId],
                members: suiteData.members || [userId]
            });

            return await this.createDocument('testSuites', testSuiteData, suiteData.id);
        } catch (error) {
            return this.handleFirestoreError(error, 'create test suite');
        }
    }

    async getUserTestSuites() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            const errorMessage = getFirebaseErrorMessage('User not authenticated');
            return { success: false, error: { message: errorMessage } };
        }

        try {
            console.log('Fetching test suites for user:', userId);

            const individualSuitesQuery = query(
                this.createCollectionRef('testSuites'),
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId),
                orderBy('created_at', 'desc')
            );

            const memberSuitesQuery = query(
                this.createCollectionRef('testSuites'),
                where('members', 'array-contains', userId),
                orderBy('created_at', 'desc')
            );

            const adminSuitesQuery = query(
                this.createCollectionRef('testSuites'),
                where('admins', 'array-contains', userId),
                orderBy('created_at', 'desc')
            );

            const results = await Promise.allSettled([
                getDocs(individualSuitesQuery),
                getDocs(memberSuitesQuery),
                getDocs(adminSuitesQuery)
            ]);

            const suiteMap = new Map();
            let errorCount = 0;

            if (results[0].status === 'fulfilled') {
                results[0].value.forEach((doc) => {
                    suiteMap.set(doc.id, { id: doc.id, ...doc.data() });
                });
            } else if (results[0].reason.code === 'permission-denied') {
                console.debug('Permission denied for individual suites (unexpected)');
                errorCount++;
            } else {
                throw results[0].reason;
            }

            if (results[1].status === 'fulfilled') {
                results[1].value.forEach((doc) => {
                    suiteMap.set(doc.id, { id: doc.id, ...doc.data() });
                });
            } else if (results[1].reason.code === 'permission-denied') {
                console.debug('Permission denied for member suites (expected if no memberships)');
                errorCount++;
            } else {
                throw results[1].reason;
            }

            if (results[2].status === 'fulfilled') {
                results[2].value.forEach((doc) => {
                    suiteMap.set(doc.id, { id: doc.id, ...doc.data() });
                });
            } else if (results[2].reason.code === 'permission-denied') {
                console.debug('Permission denied for admin suites (expected if no admin role)');
                errorCount++;
            } else {
                throw results[2].reason;
            }

            const testSuites = Array.from(suiteMap.values()).sort((a, b) => {
                const aTime = a.created_at?.toMillis?.() || 0;
                const bTime = b.created_at?.toMillis?.() || 0;
                return bTime - aTime;
            });

            console.log('Successfully fetched test suites, count:', testSuites.length, {
                individual: results[0].status === 'fulfilled' ? results[0].value.size : 0,
                member: results[1].status === 'fulfilled' ? results[1].value.size : 0,
                admin: results[2].status === 'fulfilled' ? results[2].value.size : 0
            });

            return {
                success: true,
                data: testSuites,
                message: testSuites.length === 0 ? 'No suites found for this user' : undefined,
                partialFailure: errorCount > 0
            };

        } catch (error) {
            console.error('Error fetching user test suites:', error);
            return this.handleFirestoreError(error, 'get user test suites');
        }
    }

    async createSuiteAsset(suiteId, assetType, assetData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create assets in this test suite' } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const data = this.addCommonFields({
            suite_id: suiteId,
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        return await this.createDocument(collectionPath, data);
    }

    async createSprint(suiteId, sprintData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!sprintData.metadata?.name || !sprintData.metadata?.status) {
            return { success: false, error: { message: 'Missing required sprint metadata fields' } };
        }

        const validStatuses = ['planned', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(sprintData.metadata.status)) {
            return { success: false, error: { message: 'Invalid sprint status' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create sprints in this test suite' } };
        }

        const collectionPath = `testSuites/${suiteId}/sprints`;
        const data = this.addCommonFields({
            suite_id: suiteId,
            metadata: {
                ...sprintData.metadata,
                created_date: serverTimestamp()
            }
        });

        return await this.createDocument(collectionPath, data);
    }

    async getSubscription(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        const result = await this.getDocument('subscriptions', targetUserId);
        if (!result.success) {
            return {
                success: true,
                data: {
                    plan: 'free',
                    trialEndsAt: null,
                    trialStartsAt: null,
                    isTrialActive: false,
                    isSubscriptionActive: false,
                    free_tier_features: {
                        maxSuites: 1,
                        maxTestCasesPerSuite: 10,
                        canCreateTestCases: true,
                        canUseRecordings: false,
                        canUseAutomation: false,
                        canInviteTeam: false,
                        canExportReports: false,
                        canCreateOrganizations: false,
                        advancedAnalytics: false,
                        prioritySupport: false,
                    },
                },
            };
        }
        return result;
    }

    async getSubscriptionWithStatus(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const subscriptionResult = await this.getSubscription(targetUserId);
            if (!subscriptionResult.success) {
                return subscriptionResult;
            }

            const subscription = subscriptionResult.data;
            const now = new Date();
            const trialEndDate = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;

            if (subscription.status === 'trial_active' && trialEndDate && now > trialEndDate) {
                const updateData = {
                    status: 'free',
                    plan: 'free',
                    features: subscription.free_tier_features || {
                        maxSuites: 1,
                        maxTestCasesPerSuite: 10,
                        canCreateTestCases: true,
                        canUseRecordings: false,
                        canUseAutomation: false,
                        canInviteTeam: false,
                        canExportReports: false,
                        canCreateOrganizations: false,
                        advancedAnalytics: false,
                        prioritySupport: false,
                    },
                    trial_expired_at: now.toISOString(),
                };

                await this.updateDocument('subscriptions', targetUserId, updateData);

                const individualAccount = await this.getDocument('individualAccounts', targetUserId);
                if (individualAccount.success) {
                    await this.updateDocument('individualAccounts', targetUserId, {
                        subscription: {
                            ...individualAccount.data.subscription,
                            plan: 'free',
                            status: 'free',
                            features: updateData.features,
                        }
                    });
                }

                return {
                    success: true,
                    data: {
                        ...subscription,
                        ...updateData,
                        isTrialExpired: true,
                        daysInTrial: subscription.trial_starts_at
                            ? Math.floor((now - new Date(subscription.trial_starts_at)) / (1000 * 60 * 60 * 24))
                            : 0
                    }
                };
            }

            const isTrialActive = subscription.status === 'trial_active' && trialEndDate && now <= trialEndDate;
            const daysRemainingInTrial = isTrialActive
                ? Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))
                : 0;
            const daysInTrial = subscription.trial_starts_at
                ? Math.floor((now - new Date(subscription.trial_starts_at)) / (1000 * 60 * 60 * 24))
                : 0;

            return {
                success: true,
                data: {
                    ...subscription,
                    isTrialActive,
                    daysRemainingInTrial,
                    daysInTrial,
                    isTrialExpired: subscription.status === 'free' && subscription.trial_expired_at,
                }
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'get subscription with status');
        }
    }

    async createActivityLog(suiteId, logData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create activity logs in this test suite' } };
        }

        const collectionPath = `testSuites/${suiteId}/activityLogs`;
        const data = this.addCommonFields({
            suite_id: suiteId,
            user_id: userId,
            timestamp: serverTimestamp(),
            ...logData
        });

        return await this.createDocument(collectionPath, data);
    }

    async createComment(suiteId, commentData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create comments in this test suite' } };
        }

        const collectionPath = `testSuites/${suiteId}/comments`;
        const data = this.addCommonFields({
            suite_id: suiteId,
            ...commentData
        });

        return await this.createDocument(collectionPath, data);
    }

    async updateComment(suiteId, commentId, commentData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const commentDoc = await this.getDocument(`testSuites/${suiteId}/comments`, commentId);
        if (!commentDoc.success) {
            return commentDoc;
        }

        if (commentDoc.data.created_by !== userId) {
            return { success: false, error: { message: 'Can only update your own comments' } };
        }

        return await this.updateDocument(`testSuites/${suiteId}/comments`, commentId, commentData);
    }

    async createDocument(collectionPath, data, customDocId = null) {
        try {
            const collectionRef = this.createCollectionRef(collectionPath);
            let docRef;
            const validatedData = this.addCommonFields(data);

            if (customDocId) {
                const validDocId = this.validateDocId(customDocId);
                if (!validDocId) {
                    return { success: false, error: { message: 'Invalid custom document ID provided' } };
                }
                docRef = doc(collectionRef, validDocId);
                await setDoc(docRef, validatedData);
            } else {
                docRef = await addDoc(collectionRef, validatedData);
            }

            return { success: true, data: { id: docRef.id, ...validatedData }, docId: docRef.id };
        } catch (error) {
            return this.handleFirestoreError(error, 'create document');
        }
    }

    async getDocument(collectionPath, docId) {
        try {
            const validDocId = this.validateDocId(docId);
            if (!validDocId) {
                return { success: false, error: { message: 'Invalid or missing document ID' } };
            }
            const docRef = this.createDocRef(collectionPath, validDocId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
            }
            return { success: false, error: { message: 'Document not found' } };
        } catch (error) {
            return this.handleFirestoreError(error, 'get document');
        }
    }

    async updateDocument(collectionPath, docId, data) {
        try {
            const validDocId = this.validateDocId(docId);
            if (!validDocId) {
                return { success: false, error: { message: 'Invalid or missing document ID' } };
            }
            const docRef = this.createDocRef(collectionPath, validDocId);
            const updateData = this.addCommonFields(data, true);
            await updateDoc(docRef, updateData);
            return { success: true, data: updateData };
        } catch (error) {
            return this.handleFirestoreError(error, 'update document');
        }
    }

    // Method to subscribe to test cases specifically
    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'testCases', callback, errorCallback, sprintId);
    }

    // Method to subscribe to other common asset types
    subscribeToTestPlans(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'testPlans', callback, errorCallback, sprintId);
    }

    subscribeToBugReports(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'bugReports', callback, errorCallback, sprintId);
    }

    subscribeToTestResults(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'testResults', callback, errorCallback, sprintId);
    }

    // Method to get test cases (non-subscription)
    async getTestCases(suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to access test cases in this test suite' } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        return await this.queryDocuments(
            collectionPath,
            [],
            'created_at',
            null
        );
    }

    // Method to create a test case
    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId);
    }

    // Method to update a test case
    async updateTestCase(suiteId, testCaseId, testCaseData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to update test cases in this test suite' } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        return await this.updateDocument(collectionPath, testCaseId, testCaseData);
    }

    // Method to delete a test case
    async deleteTestCase(suiteId, testCaseId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete test cases in this test suite' } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        return await this.deleteDocument(collectionPath, testCaseId);
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'bugs', callback, errorCallback, sprintId);
    }

    // Method to subscribe to recordings  
    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'recordings', callback, errorCallback, sprintId);
    }

    // Method to subscribe to sprints
    subscribeToSprints(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'sprints', callback, errorCallback, sprintId);
    }

    // Batch operations for linking/unlinking
    async batchLinkTestCasesToBug(bugId, testCaseIds) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const batch = writeBatch(this.db);

            // Update bug with linked test cases
            const bugRef = this.createDocRef('bugs', bugId);
            const bugDoc = await getDoc(bugRef);
            if (!bugDoc.exists()) {
                return { success: false, error: { message: 'Bug not found' } };
            }

            const bugData = bugDoc.data();
            const updatedBug = {
                ...bugData,
                linkedTestCases: [...(bugData.linkedTestCases || []), ...testCaseIds],
                updated_at: serverTimestamp(),
                updated_by: userId
            };
            batch.update(bugRef, updatedBug);

            // Update each test case with linked bug
            const updatedTestCases = [];
            for (const testCaseId of testCaseIds) {
                const testCaseRef = this.createDocRef('testCases', testCaseId);
                const testCaseDoc = await getDoc(testCaseRef);
                if (testCaseDoc.exists()) {
                    const testCaseData = testCaseDoc.data();
                    const updatedTestCase = {
                        ...testCaseData,
                        linkedBugs: [...(testCaseData.linkedBugs || []), bugId],
                        updated_at: serverTimestamp(),
                        updated_by: userId
                    };
                    batch.update(testCaseRef, updatedTestCase);
                    updatedTestCases.push({ id: testCaseId, ...updatedTestCase });
                }
            }

            await batch.commit();
            return {
                success: true,
                data: {
                    bug: { id: bugId, ...updatedBug },
                    testCases: updatedTestCases
                }
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'batch link test cases to bug');
        }
    }

    async batchUnlinkTestCaseFromBug(bugId, testCaseId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const batch = writeBatch(this.db);

            // Update bug
            const bugRef = this.createDocRef('bugs', bugId);
            const bugDoc = await getDoc(bugRef);
            if (!bugDoc.exists()) {
                return { success: false, error: { message: 'Bug not found' } };
            }

            const bugData = bugDoc.data();
            const updatedBug = {
                ...bugData,
                linkedTestCases: (bugData.linkedTestCases || []).filter(id => id !== testCaseId),
                updated_at: serverTimestamp(),
                updated_by: userId
            };
            batch.update(bugRef, updatedBug);

            // Update test case
            const testCaseRef = this.createDocRef('testCases', testCaseId);
            const testCaseDoc = await getDoc(testCaseRef);
            if (!testCaseDoc.exists()) {
                return { success: false, error: { message: 'Test case not found' } };
            }

            const testCaseData = testCaseDoc.data();
            const updatedTestCase = {
                ...testCaseData,
                linkedBugs: (testCaseData.linkedBugs || []).filter(id => id !== bugId),
                updated_at: serverTimestamp(),
                updated_by: userId
            };
            batch.update(testCaseRef, updatedTestCase);

            await batch.commit();
            return {
                success: true,
                data: {
                    bug: { id: bugId, ...updatedBug },
                    testCase: { id: testCaseId, ...updatedTestCase }
                }
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'batch unlink test case from bug');
        }
    }

    async batchLinkBugsToTestCase(testCaseId, bugIds) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const batch = writeBatch(this.db);

            // Update test case with linked bugs
            const testCaseRef = this.createDocRef('testCases', testCaseId);
            const testCaseDoc = await getDoc(testCaseRef);
            if (!testCaseDoc.exists()) {
                return { success: false, error: { message: 'Test case not found' } };
            }

            const testCaseData = testCaseDoc.data();
            const updatedTestCase = {
                ...testCaseData,
                linkedBugs: [...(testCaseData.linkedBugs || []), ...bugIds],
                updated_at: serverTimestamp(),
                updated_by: userId
            };
            batch.update(testCaseRef, updatedTestCase);

            // Update each bug with linked test case
            const updatedBugs = [];
            for (const bugId of bugIds) {
                const bugRef = this.createDocRef('bugs', bugId);
                const bugDoc = await getDoc(bugRef);
                if (bugDoc.exists()) {
                    const bugData = bugDoc.data();
                    const updatedBug = {
                        ...bugData,
                        linkedTestCases: [...(bugData.linkedTestCases || []), testCaseId],
                        updated_at: serverTimestamp(),
                        updated_by: userId
                    };
                    batch.update(bugRef, updatedBug);
                    updatedBugs.push({ id: bugId, ...updatedBug });
                }
            }

            await batch.commit();
            return {
                success: true,
                data: {
                    testCase: { id: testCaseId, ...updatedTestCase },
                    bugs: updatedBugs
                }
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'batch link bugs to test case');
        }
    }

    async batchUnlinkBugFromTestCase(testCaseId, bugId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const batch = writeBatch(this.db);

            // Update test case
            const testCaseRef = this.createDocRef('testCases', testCaseId);
            const testCaseDoc = await getDoc(testCaseRef);
            if (!testCaseDoc.exists()) {
                return { success: false, error: { message: 'Test case not found' } };
            }

            const testCaseData = testCaseDoc.data();
            const updatedTestCase = {
                ...testCaseData,
                linkedBugs: (testCaseData.linkedBugs || []).filter(id => id !== bugId),
                updated_at: serverTimestamp(),
                updated_by: userId
            };
            batch.update(testCaseRef, updatedTestCase);

            // Update bug
            const bugRef = this.createDocRef('bugs', bugId);
            const bugDoc = await getDoc(bugRef);
            if (!bugDoc.exists()) {
                return { success: false, error: { message: 'Bug not found' } };
            }

            const bugData = bugDoc.data();
            const updatedBug = {
                ...bugData,
                linkedTestCases: (bugData.linkedTestCases || []).filter(id => id !== testCaseId),
                updated_at: serverTimestamp(),
                updated_by: userId
            };
            batch.update(bugRef, updatedBug);

            await batch.commit();
            return {
                success: true,
                data: {
                    testCase: { id: testCaseId, ...updatedTestCase },
                    bug: { id: bugId, ...updatedBug }
                }
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'batch unlink bug from test case');
        }
    }

    async addTestCasesToSprint(sprintId, testCaseIds) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const sprintRef = this.createDocRef('sprints', sprintId);
            const sprintDoc = await getDoc(sprintRef);
            if (!sprintDoc.exists()) {
                return { success: false, error: { message: 'Sprint not found' } };
            }

            const sprintData = sprintDoc.data();
            const updatedSprint = {
                ...sprintData,
                testCases: [...(sprintData.testCases || []), ...testCaseIds],
                updated_at: serverTimestamp(),
                updated_by: userId
            };

            await updateDoc(sprintRef, updatedSprint);
            return { success: true, data: { id: sprintId, ...updatedSprint } };
        } catch (error) {
            return this.handleFirestoreError(error, 'add test cases to sprint');
        }
    }

    async addBugsToSprint(sprintId, bugIds) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const sprintRef = this.createDocRef('sprints', sprintId);
            const sprintDoc = await getDoc(sprintRef);
            if (!sprintDoc.exists()) {
                return { success: false, error: { message: 'Sprint not found' } };
            }

            const sprintData = sprintDoc.data();
            const updatedSprint = {
                ...sprintData,
                bugs: [...(sprintData.bugs || []), ...bugIds],
                updated_at: serverTimestamp(),
                updated_by: userId
            };

            await updateDoc(sprintRef, updatedSprint);
            return { success: true, data: { id: sprintId, ...updatedSprint } };
        } catch (error) {
            return this.handleFirestoreError(error, 'add bugs to sprint');
        }
    }

    async deleteDocument(collectionPath, docId) {
        try {
            const validDocId = this.validateDocId(docId);
            if (!validDocId) {
                return { success: false, error: { message: 'Invalid or missing document ID' } };
            }
            const docRef = this.createDocRef(collectionPath, validDocId);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            return this.handleFirestoreError(error, 'delete document');
        }
    }

    async queryDocuments(collectionPath, constraints = [], orderByField = null, limitCount = null) {
        try {
            const colRef = this.createCollectionRef(collectionPath);
            let q = colRef;

            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }
            if (orderByField) {
                q = query(q, orderBy(orderByField));
            }
            if (limitCount) {
                q = query(q, limit(limitCount));
            }

            const querySnapshot = await getDocs(q);
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: documents };
        } catch (error) {
            return this.handleFirestoreError(error, 'query documents');
        }
    }

    subscribeToDocument(collectionPath, docId, callback, errorCallback = null) {
        const validDocId = this.validateDocId(docId);
        if (!validDocId) {
            errorCallback?.({ success: false, error: { message: 'Invalid or missing document ID' } });
            return null;
        }

        const docRef = this.createDocRef(collectionPath, validDocId);
        const unsubscribe = onSnapshot(
            docRef,
            (doc) => {
                if (doc.exists()) {
                    callback({ id: doc.id, ...doc.data() });
                } else {
                    callback(null);
                }
            },
            (error) => {
                errorCallback?.(this.handleFirestoreError(error, 'subscribe to document'));
            }
        );

        const subscriptionKey = `${collectionPath}/${validDocId}`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    subscribeToCollection(collectionPath, constraints = [], callback, errorCallback = null) {
        const colRef = this.createCollectionRef(collectionPath);
        let q = colRef;

        if (constraints.length > 0) {
            q = query(q, ...constraints);
        }

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const documents = [];
                querySnapshot.forEach((doc) => {
                    documents.push({ id: doc.id, ...doc.data() });
                });
                callback(documents);
            },
            (error) => {
                errorCallback?.(this.handleFirestoreError(error, 'subscribe to collection'));
            }
        );

        const subscriptionKey = `${collectionPath}_collection`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    // Also update the subscription method to use multiple subscriptions
    subscribeToUserTestSuites(callback, errorCallback = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            const errorMessage = getFirebaseErrorMessage('User not authenticated');
            errorCallback?.({ success: false, error: { message: errorMessage } });
            return null;
        }

        console.log('Setting up multiple test suite subscriptions for user:', userId);

        const suiteMap = new Map();
        let errorCount = 0;
        const totalSubscriptions = 3;

        const updateCallback = () => {
            const testSuites = Array.from(suiteMap.values()).sort((a, b) => {
                const aTime = a.created_at?.toMillis?.() || 0;
                const bTime = b.created_at?.toMillis?.() || 0;
                return bTime - aTime;
            });
            console.log('Sending updated suites to callback, count:', testSuites.length);
            callback(testSuites);
        };

        const handleSubscriptionError = (error, type) => {
            const userMessage = getFirebaseErrorMessage(error);
            if (error.code === 'permission-denied') {
                console.debug(`${type} subscription: Permission denied (expected if user has no ${type.toLowerCase()})`);
                errorCount++;
                if (errorCount === totalSubscriptions) {
                    console.error(`All test suite subscriptions failed for user ${userId}`);
                    errorCallback?.({
                        success: false,
                        error: { code: error.code, message: userMessage, originalError: error }
                    });
                }
            } else {
                console.error(`${type} subscription error:`, error);
                errorCallback?.({
                    success: false,
                    error: { code: error.code, message: userMessage, originalError: error }
                });
            }
        };

        const unsubscribeIndividual = this.subscribeToCollection(
            'testSuites',
            [
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId),
                orderBy('created_at', 'desc')
            ],
            (documents) => {
                console.log('Individual suites updated, count:', documents.length);
                for (const [key, suite] of suiteMap.entries()) {
                    if (suite.ownerType === 'individual' && suite.ownerId === userId) {
                        suiteMap.delete(key);
                    }
                }
                documents.forEach(doc => suiteMap.set(doc.id, doc));
                updateCallback();
            },
            (error) => handleSubscriptionError(error, 'Individual suites')
        );

        const unsubscribeMembers = this.subscribeToCollection(
            'testSuites',
            [
                where('members', 'array-contains', userId),
                orderBy('created_at', 'desc')
            ],
            (documents) => {
                console.log('Member suites updated, count:', documents.length);
                documents.forEach(doc => {
                    if (doc.members && Array.isArray(doc.members) && doc.members.includes(userId)) {
                        suiteMap.set(doc.id, doc);
                    }
                });
                updateCallback();
            },
            (error) => handleSubscriptionError(error, 'Member suites')
        );

        const unsubscribeAdmins = this.subscribeToCollection(
            'testSuites',
            [
                where('admins', 'array-contains', userId),
                orderBy('created_at', 'desc')
            ],
            (documents) => {
                console.log('Admin suites updated, count:', documents.length);
                documents.forEach(doc => {
                    if (doc.admins && Array.isArray(doc.admins) && doc.admins.includes(userId)) {
                        suiteMap.set(doc.id, doc);
                    }
                });
                updateCallback();
            },
            (error) => handleSubscriptionError(error, 'Admin suites')
        );

        const unsubscribeAll = () => {
            console.log('Cleaning up all test suite subscriptions');
            try {
                if (unsubscribeIndividual) unsubscribeIndividual();
                if (unsubscribeMembers) unsubscribeMembers();
                if (unsubscribeAdmins) unsubscribeAdmins();
                this.unsubscribes.delete(`testSuites_user_${userId}`);
            } catch (error) {
                console.error('Error cleaning up test suite subscriptions:', error);
            }
        };

        const subscriptionKey = `testSuites_user_${userId}`;
        this.unsubscribes.set(subscriptionKey, unsubscribeAll);

        return unsubscribeAll;
    }

    subscribeToSuiteAssets(suiteId, assetType, callback, errorCallback = null, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;
        return this.subscribeToCollection(
            collectionPath,
            [orderBy('created_at', 'desc')],
            callback,
            errorCallback
        );
    }

    async executeBatch(operations) {
        try {
            const batch = writeBatch(this.db);
            operations.forEach(operation => {
                const { type, ref, data } = operation;
                switch (type) {
                    case 'set':
                        batch.set(ref, this.addCommonFields(data));
                        break;
                    case 'update':
                        batch.update(ref, this.addCommonFields(data, true));
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                }
            });
            await batch.commit();
            return { success: true };
        } catch (error) {
            return this.handleFirestoreError(error, 'execute batch operations');
        }
    }

    unsubscribeAll() {
        this.unsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribes.clear();
    }

    cleanup() {
        this.unsubscribeAll();
    }

} < FirestoreDebugger />

const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };