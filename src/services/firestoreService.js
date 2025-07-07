// services/firestoreService.js - Centralized Firestore Service
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
    runTransaction
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Centralized Firestore Service Class
 * Handles all database operations with proper error handling and context integration
 */
class FirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
    }

    // ===== UTILITY METHODS =====

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.auth.currentUser?.uid;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * Create document reference
     */
    createDocRef(collectionPath, docId) {
        return doc(this.db, collectionPath, docId);
    }

    /**
     * Create collection reference
     */
    createCollectionRef(collectionPath) {
        return collection(this.db, collectionPath);
    }

    /**
     * Handle Firestore errors with user-friendly messages
     */
    handleFirestoreError(error, operation = 'operation') {
        console.error(`Firestore ${operation} error:`, error);
        
        const errorMessages = {
            'permission-denied': 'You do not have permission to perform this action.',
            'not-found': 'The requested document was not found.',
            'already-exists': 'This document already exists.',
            'resource-exhausted': 'Too many requests. Please try again later.',
            'unauthenticated': 'You must be signed in to perform this action.',
            'unavailable': 'Service temporarily unavailable. Please try again.',
            'invalid-argument': 'Invalid data provided.',
            'deadline-exceeded': 'Request timed out. Please try again.',
            'aborted': 'Operation was aborted. Please try again.'
        };

        const userMessage = errorMessages[error.code] || `Failed to ${operation}. Please try again.`;
        
        return {
            success: false,
            error: {
                code: error.code,
                message: userMessage,
                originalError: error
            }
        };
    }

    /**
     * Add common fields to documents
     */
    addCommonFields(data, isUpdate = false) {
        const commonFields = {
            ...(isUpdate ? { updated_at: serverTimestamp() } : {
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            })
        };

        if (!isUpdate && this.getCurrentUserId()) {
            commonFields.created_by = this.getCurrentUserId();
        }

        return { ...data, ...commonFields };
    }

    // ===== GENERIC CRUD OPERATIONS =====

    /**
     * Generic create document
     */
    async createDocument(collectionPath, data, docId = null) {
        try {
            const documentData = this.addCommonFields(data);
            
            if (docId) {
                const docRef = this.createDocRef(collectionPath, docId);
                await setDoc(docRef, documentData);
                return { success: true, id: docId, data: documentData };
            } else {
                const colRef = this.createCollectionRef(collectionPath);
                const docRef = await addDoc(colRef, documentData);
                return { success: true, id: docRef.id, data: documentData };
            }
        } catch (error) {
            return this.handleFirestoreError(error, 'create document');
        }
    }

    /**
     * Generic read document
     */
    async getDocument(collectionPath, docId) {
        try {
            const docRef = this.createDocRef(collectionPath, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { 
                    success: true, 
                    data: { id: docSnap.id, ...docSnap.data() } 
                };
            } else {
                return { success: false, error: { message: 'Document not found' } };
            }
        } catch (error) {
            return this.handleFirestoreError(error, 'get document');
        }
    }

    /**
     * Generic update document
     */
    async updateDocument(collectionPath, docId, data) {
        try {
            const docRef = this.createDocRef(collectionPath, docId);
            const updateData = this.addCommonFields(data, true);
            await updateDoc(docRef, updateData);
            return { success: true, data: updateData };
        } catch (error) {
            return this.handleFirestoreError(error, 'update document');
        }
    }

    /**
     * Generic delete document
     */
    async deleteDocument(collectionPath, docId) {
        try {
            const docRef = this.createDocRef(collectionPath, docId);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            return this.handleFirestoreError(error, 'delete document');
        }
    }

    /**
     * Generic query documents
     */
    async queryDocuments(collectionPath, constraints = [], orderByField = null, limitCount = null) {
        try {
            const colRef = this.createCollectionRef(collectionPath);
            let q = colRef;

            // Apply constraints
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }

            // Apply ordering
            if (orderByField) {
                q = query(q, orderBy(orderByField));
            }

            // Apply limit
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

    /**
     * Real-time listener for documents
     */
    subscribeToDocument(collectionPath, docId, callback, errorCallback = null) {
        const docRef = this.createDocRef(collectionPath, docId);
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
                console.error('Document subscription error:', error);
                if (errorCallback) {
                    errorCallback(this.handleFirestoreError(error, 'subscribe to document'));
                }
            }
        );

        const subscriptionKey = `${collectionPath}/${docId}`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    /**
     * Real-time listener for collections
     */
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
                console.error('Collection subscription error:', error);
                if (errorCallback) {
                    errorCallback(this.handleFirestoreError(error, 'subscribe to collection'));
                }
            }
        );

        const subscriptionKey = `${collectionPath}_collection`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    /**
     * Unsubscribe from all listeners
     */
    unsubscribeAll() {
        this.unsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribes.clear();
    }

    // ===== USER OPERATIONS =====

    /**
     * Create or update user profile
     */
    async createOrUpdateUserProfile(userData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const userRef = this.createDocRef('users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                // Update existing user
                const updateData = this.addCommonFields(userData, true);
                await updateDoc(userRef, updateData);
                return { success: true, data: { id: userId, ...updateData } };
            } else {
                // Create new user
                const newUserData = this.addCommonFields({
                    user_id: userId,
                    email: this.getCurrentUser()?.email,
                    ...userData
                });
                await setDoc(userRef, newUserData);
                return { success: true, data: { id: userId, ...newUserData } };
            }
        } catch (error) {
            return this.handleFirestoreError(error, 'create/update user profile');
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.getDocument('users', targetUserId);
    }

    /**
     * Subscribe to user profile changes
     */
    subscribeToUserProfile(callback, errorCallback = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        return this.subscribeToDocument('users', userId, callback, errorCallback);
    }

    // ===== ORGANIZATION OPERATIONS =====

    /**
     * Create organization
     */
    async createOrganization(orgData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const batch = writeBatch(this.db);
            
            // Create organization
            const orgRef = this.createDocRef('organizations', orgData.orgId || `org_${userId}`);
            const organizationData = this.addCommonFields({
                ownerId: userId,
                ...orgData
            });
            batch.set(orgRef, organizationData);

            // Add creator as admin member
            const memberRef = this.createDocRef('organizations', orgRef.id, 'members', userId);
            const memberData = this.addCommonFields({
                user_id: userId,
                role: 'Admin',
                joined_at: serverTimestamp()
            });
            batch.set(memberRef, memberData);

            await batch.commit();
            
            return { success: true, data: { id: orgRef.id, ...organizationData } };
        } catch (error) {
            return this.handleFirestoreError(error, 'create organization');
        }
    }

    /**
     * Get user organizations
     */
    async getUserOrganizations() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Get organizations where user is owner
            const ownedOrgsQuery = query(
                this.createCollectionRef('organizations'),
                where('ownerId', '==', userId)
            );

            const ownedOrgs = await getDocs(ownedOrgsQuery);
            const organizations = [];

            ownedOrgs.forEach((doc) => {
                organizations.push({ id: doc.id, ...doc.data(), userRole: 'Owner' });
            });

            // Get organizations where user is a member
            const userMembershipsRef = this.createDocRef('userMemberships', userId);
            const userMembershipsSnap = await getDoc(userMembershipsRef);

            if (userMembershipsSnap.exists()) {
                const memberships = userMembershipsSnap.data().organizations || [];
                
                for (const membership of memberships) {
                    const orgDoc = await getDoc(this.createDocRef('organizations', membership.orgId));
                    if (orgDoc.exists()) {
                        organizations.push({
                            id: orgDoc.id,
                            ...orgDoc.data(),
                            userRole: membership.role
                        });
                    }
                }
            }

            return { success: true, data: organizations };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user organizations');
        }
    }

    // ===== TEST SUITE OPERATIONS =====

    /**
     * Create test suite
     */
    async createTestSuite(suiteData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const testSuiteData = this.addCommonFields({
            ownerType: 'individual',
            ownerId: userId,
            ...suiteData
        });

        return await this.createDocument('testSuites', testSuiteData);
    }

    /**
     * Get user test suites
     */
    async getUserTestSuites() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Get individual test suites
            const individualSuites = await this.queryDocuments(
                'testSuites',
                [
                    where('ownerType', '==', 'individual'),
                    where('ownerId', '==', userId)
                ],
                'created_at',
                50
            );

            // Get organization test suites (if user is part of organizations)
            const userOrgs = await this.getUserOrganizations();
            let organizationSuites = [];

            if (userOrgs.success && userOrgs.data.length > 0) {
                const orgIds = userOrgs.data.map(org => org.id);
                const orgSuitesQuery = await this.queryDocuments(
                    'testSuites',
                    [
                        where('ownerType', '==', 'organization'),
                        where('ownerId', 'in', orgIds)
                    ],
                    'created_at',
                    50
                );

                if (orgSuitesQuery.success) {
                    organizationSuites = orgSuitesQuery.data;
                }
            }

            const allSuites = [
                ...(individualSuites.success ? individualSuites.data : []),
                ...organizationSuites
            ];

            return { success: true, data: allSuites };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user test suites');
        }
    }

    /**
     * Subscribe to user test suites
     */
    subscribeToUserTestSuites(callback, errorCallback = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        return this.subscribeToCollection(
            'testSuites',
            [
                where('ownerType', '==', 'individual'),
                where('ownerId', '==', userId)
            ],
            callback,
            errorCallback
        );
    }

    // ===== SUITE ASSETS OPERATIONS =====

    /**
     * Create suite asset (bug, testCase, recording, automatedScript)
     */
    async createSuiteAsset(suiteId, assetType, assetData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const collectionPath = sprintId 
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const data = this.addCommonFields({
            suite_id: suiteId,
            created_by: userId,
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        return await this.createDocument(collectionPath, data);
    }

    /**
     * Get suite assets
     */
    async getSuiteAssets(suiteId, assetType, sprintId = null) {
        const collectionPath = sprintId 
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return await this.queryDocuments(collectionPath, [], 'created_at');
    }

    /**
     * Subscribe to suite assets
     */
    subscribeToSuiteAssets(suiteId, assetType, callback, errorCallback = null, sprintId = null) {
        const collectionPath = sprintId 
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return this.subscribeToCollection(collectionPath, [], callback, errorCallback);
    }

    // ===== SPRINT OPERATIONS =====

    /**
     * Create sprint
     */
    async createSprint(suiteId, sprintData) {
        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.createDocument(collectionPath, sprintData);
    }

    /**
     * Get suite sprints
     */
    async getSuiteSprints(suiteId) {
        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.queryDocuments(collectionPath, [], 'created_at');
    }

    // ===== ACTIVITY LOGS =====

    /**
     * Create activity log
     */
    async createActivityLog(suiteId, logData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const collectionPath = `testSuites/${suiteId}/activityLogs`;
        const data = this.addCommonFields({
            suite_id: suiteId,
            user_id: userId,
            ...logData
        });

        return await this.createDocument(collectionPath, data);
    }

    // ===== BATCH OPERATIONS =====

    /**
     * Execute batch operations
     */
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

    // ===== TRANSACTION OPERATIONS =====

    /**
     * Execute transaction
     */
    async executeTransaction(transactionFunction) {
        try {
            const result = await runTransaction(this.db, transactionFunction);
            return { success: true, data: result };
        } catch (error) {
            return this.handleFirestoreError(error, 'execute transaction');
        }
    }

    // ===== CLEANUP =====

    /**
     * Cleanup service (call when component unmounts)
     */
    cleanup() {
        this.unsubscribeAll();
    }
}

// Create and export singleton instance
const firestoreService = new FirestoreService();
export default firestoreService;

// Export the class for testing or multiple instances
export { FirestoreService };