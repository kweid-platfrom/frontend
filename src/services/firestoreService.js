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
    runTransaction,
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
        const errorMessages = {
            'permission-denied': 'Access denied. Check your permissions.',
            'not-found': 'Document not found.',
            'already-exists': 'Document already exists.',
            'unauthenticated': 'Authentication required.',
            'unavailable': 'Service temporarily unavailable.',
            'invalid-argument': 'Invalid data provided.',
            'resource-exhausted': 'Rate limit exceeded.',
            'deadline-exceeded': 'Request timeout.',
            'aborted': 'Operation aborted.',
            'failed-precondition': 'Operation failed due to invalid state.',
            'out-of-range': 'Data out of acceptable range.'
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

    // ===== VALIDATION METHODS =====

    validateTestSuiteData(data) {
        const requiredFields = ['name', 'ownerType', 'ownerId'];
        return requiredFields.every(field => field in data && data[field] !== null && data[field] !== undefined);
    }

    validateSprintData(data) {
        const requiredFields = ['suite_id', 'metadata'];
        const requiredMetadataFields = ['name', 'status'];
        return requiredFields.every(field => field in data && data[field] !== null && data[field] !== undefined) &&
               requiredMetadataFields.every(field => field in data.metadata && data.metadata[field] !== null && data.metadata[field] !== undefined);
    }

    validateAssetData(assetType, data) {
        const requiredFields = {
            bugs: ['suite_id', 'title', 'severity', 'priority', 'status'],
            testCases: ['suite_id', 'title', 'status'],
            recordings: ['suite_id', 'title', 'file_path'],
            automatedScripts: ['suite_id', 'name', 'framework', 'language']
        };
        return requiredFields[assetType]?.every(field => field in data && data[field] !== null && data[field] !== undefined) || false;
    }

    // ===== GENERIC CRUD OPERATIONS =====

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

    // ===== REAL-TIME SUBSCRIPTIONS =====

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
            const updateData = this.addCommonFields(userData, userDoc.exists());
            if (userDoc.exists()) {
                await updateDoc(userRef, updateData);
            } else {
                await setDoc(userRef, { user_id: userId, email: this.getCurrentUser()?.email, ...updateData });
            }
            return { success: true, data: { id: userId, ...updateData } };
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
        if (!orgData.name) {
            return { success: false, error: { message: 'Organization name is required' } };
        }
        try {
            const batch = writeBatch(this.db);
            const orgId = orgData.orgId || doc(this.createCollectionRef('organizations')).id;
            const orgRef = this.createDocRef('organizations', orgId);
            const organizationData = this.addCommonFields({
                name: orgData.name,
                description: orgData.description || '',
                ownerId: userId,
                settings: orgData.settings || {}
            });
            batch.set(orgRef, organizationData);

            const memberRef = this.createDocRef('organizations', orgId, 'members', userId);
            const memberData = this.addCommonFields({
                user_id: userId,
                role: 'owner',
                status: 'active',
                joined_at: serverTimestamp()
            });
            batch.set(memberRef, memberData);

            const userMembershipRef = this.createDocRef('userMemberships', userId, 'organizations', orgId);
            const userMembershipData = this.addCommonFields({
                user_id: userId,
                role: 'owner',
                org_id: orgId,
                status: 'active'
            });
            batch.set(userMembershipRef, userMembershipData);

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

    async createTestSuite(suiteData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        if (!this.validateTestSuiteData(suiteData)) {
            return { success: false, error: { message: 'Missing required test suite fields' } };
        }
        try {
            await this.auth.currentUser.getIdToken(true);
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
                    ownerId: suiteData.ownerId || userId,
                    admins: suiteData.access_control?.admins || [],
                    members: suiteData.access_control?.members || [userId],
                    permissions_matrix: suiteData.access_control?.permissions_matrix || {}
                }
            });
            return await this.createDocument('testSuites', testSuiteData, suiteData.id);
        } catch (error) {
            return this.handleFirestoreError(error, 'create test suite');
        }
    }

    async getUserTestSuites() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        try {
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
            [where('members', 'array-contains', userId), orderBy('created_at', 'desc')],
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
        if (!this.validateAssetData(assetType, assetData)) {
            return { success: false, error: { message: `Missing required fields for ${assetType}` } };
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
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }
        if (!this.validateSprintData(sprintData)) {
            return { success: false, error: { message: 'Missing required sprint fields' } };
        }
        const collectionPath = `testSuites/${suiteId}/sprints`;
        const data = this.addCommonFields(sprintData);
        return await this.createDocument(collectionPath, data);
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
            ...logData,
            timestamp: serverTimestamp()
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

    // ===== DEPRECATED METHODS =====

    async testFetchTestCases(suiteId) {
        console.warn('testFetchTestCases is deprecated. Use getSuiteAssets(suiteId, "testCases") instead.');
        return await this.getSuiteAssets(suiteId, 'testCases');
    }

    // ===== CLEANUP =====

    cleanup() {
        this.unsubscribeAll();
    }
}

const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };