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

class FirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
    }

    // ===== UTILITY METHODS =====

    getCurrentUserId() {
        return this.auth.currentUser?.uid;
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    createDocRef(collectionPath, ...pathSegments) {
        const validSegments = pathSegments.filter(segment =>
            segment !== null && segment !== undefined && segment !== ''
        ).map(segment => String(segment));

        if (validSegments.length === 0) {
            throw new Error('Document ID is required');
        }

        // If we have only one segment (document ID), use collection + doc ID
        if (validSegments.length === 1) {
            const colRef = this.createCollectionRef(collectionPath);
            return doc(colRef, validSegments[0]);
        }

        // For multiple segments, build the full path
        const fullPath = `${collectionPath}/${validSegments.join('/')}`;
        const pathParts = fullPath.split('/').filter(part => part !== '');

        console.log('Creating doc ref with path parts:', pathParts); // Debug log

        return doc(this.db, ...pathParts);
    }

    createCollectionRef(collectionPath) {
        return collection(this.db, collectionPath);
    }

    handleFirestoreError(error, operation = 'operation') {
        console.error(`Firestore ${operation} error:`, error);

        const errorMessages = {
            'permission-denied': 'Access denied. Check your permissions.',
            'not-found': 'Document not found.',
            'already-exists': 'Document already exists.',
            'unauthenticated': 'Authentication required.',
            'unavailable': 'Service temporarily unavailable.',
            'invalid-argument': 'Invalid data provided.',
            'resource-exhausted': 'Rate limit exceeded.',
            'deadline-exceeded': 'Request timeout.',
            'aborted': 'Operation aborted.'
        };

        const userMessage = errorMessages[error.code] || `${operation} failed. Please try again.`;

        return {
            success: false,
            error: {
                code: error.code,
                message: userMessage,
                originalError: error
            }
        };
    }

    addCommonFields(data, isUpdate = false) {
        const userId = this.getCurrentUserId();
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

        return { ...data, ...commonFields };
    }

    // ===== GENERIC CRUD OPERATIONS =====

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

    async getDocument(collectionPath, docId) {
        try {
            if (!docId) {
                return { success: false, error: { message: 'Document ID is required' } };
            }

            // Create collection reference first, then document reference
            const colRef = collection(this.db, collectionPath);
            const docRef = doc(colRef, docId);

            console.log('Getting document with path:', `${collectionPath}/${docId}`); // Debug log

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
            console.error('getDocument error:', error);
            return this.handleFirestoreError(error, 'get document');
        }
    }

    async updateDocument(collectionPath, docId, data) {
        try {
            if (!docId) {
                return { success: false, error: { message: 'Document ID is required' } };
            }

            // Create collection reference first, then document reference
            const colRef = collection(this.db, collectionPath);
            const docRef = doc(colRef, docId);

            console.log('Updating document with path:', `${collectionPath}/${docId}`); // Debug log

            const updateData = this.addCommonFields(data, true);
            await updateDoc(docRef, updateData);
            return { success: true, data: updateData };
        } catch (error) {
            console.error('updateDocument error:', error);
            return this.handleFirestoreError(error, 'update document');
        }
    }

    async deleteDocument(collectionPath, docId) {
        try {
            if (!docId) {
                return { success: false, error: { message: 'Document ID is required' } };
            }

            // Create collection reference first, then document reference
            const colRef = collection(this.db, collectionPath);
            const docRef = doc(colRef, docId);

            console.log('Deleting document with path:', `${collectionPath}/${docId}`); // Debug log

            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            console.error('deleteDocument error:', error);
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

    // ===== REAL-TIME SUBSCRIPTIONS =====

    subscribeToDocument(collectionPath, docId, callback, errorCallback = null) {
        if (!docId) {
            errorCallback?.({ success: false, error: { message: 'Document ID is required' } });
            return null;
        }

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
                errorCallback?.(this.handleFirestoreError(error, 'subscribe to document'));
            }
        );

        const subscriptionKey = `${collectionPath}/${docId}`;
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
                console.error('Collection subscription error:', error);
                errorCallback?.(this.handleFirestoreError(error, 'subscribe to collection'));
            }
        );

        const subscriptionKey = `${collectionPath}_collection`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    unsubscribeAll() {
        this.unsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribes.clear();
    }

    // ===== USER OPERATIONS =====

    async createOrUpdateUserProfile(userData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const userRef = this.createDocRef('users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const updateData = this.addCommonFields(userData, true);
                await updateDoc(userRef, updateData);
                return { success: true, data: { id: userId, ...updateData } };
            } else {
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

    async getUserProfile(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.getDocument('users', targetUserId);
    }

    subscribeToUserProfile(callback, errorCallback = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            errorCallback?.({ success: false, error: { message: 'User not authenticated' } });
            return null;
        }

        return this.subscribeToDocument('users', userId, callback, errorCallback);
    }

    // ===== ORGANIZATION OPERATIONS =====

    async createOrganization(orgData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const batch = writeBatch(this.db);

            // Create organization with user as owner
            const orgId = orgData.orgId || doc(this.createCollectionRef('organizations')).id;
            const orgRef = this.createDocRef('organizations', orgId);
            const organizationData = this.addCommonFields({
                name: orgData.name,
                description: orgData.description || '',
                ownerId: userId,
                members: [userId], // Initialize with creator
                memberCount: 1,
                settings: orgData.settings || {}
            });
            batch.set(orgRef, organizationData);

            // Add member document
            const memberRef = this.createDocRef('organizations', orgId, 'members', userId);
            const memberData = this.addCommonFields({
                user_id: userId,
                role: 'owner',
                status: 'active',
                joined_at: serverTimestamp()
            });
            batch.set(memberRef, memberData);

            await batch.commit();

            return { success: true, data: { id: orgId, ...organizationData } };
        } catch (error) {
            return this.handleFirestoreError(error, 'create organization');
        }
    }

    async getUserOrganizations() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Get organizations where user is a member
            const orgsQuery = query(
                this.createCollectionRef('organizations'),
                where('members', 'array-contains', userId)
            );

            const orgsSnapshot = await getDocs(orgsQuery);
            const organizations = [];

            orgsSnapshot.forEach((doc) => {
                const orgData = doc.data();
                organizations.push({
                    id: doc.id,
                    ...orgData,
                    userRole: orgData.ownerId === userId ? 'owner' : 'member'
                });
            });

            return { success: true, data: organizations };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user organizations');
        }
    }

    // ===== TEST SUITE OPERATIONS =====

    // services/firestoreService.js
    async createTestSuite(suiteData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Refresh auth token
            await this.auth.currentUser.getIdToken(true);
            console.log('Firebase auth token refreshed');
        } catch (error) {
            console.error('Error refreshing auth token:', error);
            return this.handleFirestoreError(error, 'refresh auth token');
        }

        try {
            const testSuiteData = this.addCommonFields({
                name: suiteData.name,
                description: suiteData.description || '',
                ownerType: suiteData.ownerType || 'individual',
                ownerId: suiteData.ownerId || userId,
                members: [userId],
                isPublic: suiteData.isPublic || false,
                settings: suiteData.settings || {},
                tags: suiteData.tags || [],
                access_control: {
                    ownerType: suiteData.ownerType || 'individual',
                    ownerId: suiteData.ownerId || userId
                }
            });

            return await this.createDocument('testSuites', testSuiteData, suiteData.id);
        } catch (error) {
            console.error('Detailed createTestSuite error:', {
                errorCode: error.code,
                errorMessage: error.message,
                suiteData
            });
            return this.handleFirestoreError(error, 'create test suite');
        }
    }

    async getUserTestSuites() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Get test suites where user is a member
            const suitesQuery = query(
                this.createCollectionRef('testSuites'),
                where('members', 'array-contains', userId),
                orderBy('created_at', 'desc')
            );

            const suitesSnapshot = await getDocs(suitesQuery);
            const testSuites = [];

            suitesSnapshot.forEach((doc) => {
                testSuites.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: testSuites };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user test suites');
        }
    }

    subscribeToUserTestSuites(callback, errorCallback = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            errorCallback?.({ success: false, error: { message: 'User not authenticated' } });
            return null;
        }

        return this.subscribeToCollection(
            'testSuites',
            [
                where('members', 'array-contains', userId),
                orderBy('created_at', 'desc')
            ],
            callback,
            errorCallback
        );
    }

    // ===== SUITE ASSETS OPERATIONS =====

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
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        return await this.createDocument(collectionPath, data);
    }

    async getSuiteAssets(suiteId, assetType, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return await this.queryDocuments(collectionPath, [], 'created_at');
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

    // ===== SPRINT OPERATIONS =====

    async createSprint(suiteId, sprintData) {
        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.createDocument(collectionPath, sprintData);
    }

    async getSuiteSprints(suiteId) {
        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.queryDocuments(collectionPath, [], 'created_at');
    }

    // ===== ACTIVITY LOGS =====

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

    async executeTransaction(transactionFunction) {
        try {
            const result = await runTransaction(this.db, transactionFunction);
            return { success: true, data: result };
        } catch (error) {
            return this.handleFirestoreError(error, 'execute transaction');
        }
    }

    // ===== CLEANUP =====

    cleanup() {
        this.unsubscribeAll();
    }
}

// Create and export singleton instance
const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };