import { UserService } from './userService';
import { OrganizationService } from './OrganizationService';
import { TestSuiteService } from './TestSuiteService';
import { AssetService } from './AssetService';
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
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

class FirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
        
        this.organization = new OrganizationService();
        this.user = new UserService();
        this.testSuite = new TestSuiteService(this.organization);
        this.assets = new AssetService(this.testSuite);
        
        // Initialize recordings methods
        this.recordings = {
            createRecording: (recordingData) => {
                return this.assets.createRecording(recordingData.suiteId, recordingData);
            },
            
            linkRecordingToBug: async (recordingId, bugId) => {
                // You'll need to implement this in AssetService or handle it here
                // For now, returning a placeholder
                return { success: true, data: { recordingId, bugId } };
            },
            
            subscribeToRecordings: (suiteId, callback, errorCallback) => {
                return this.assets.subscribeToRecordings(suiteId, callback, errorCallback);
            }
        };

        // Initialize reports methods
        this.reports = {
            getReports: async (orgId) => {
                // Implement this based on your organization service or base firestore service
                try {
                    return await this.organization.getReports?.(orgId) || { success: true, data: [] };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            
            saveReport: async (reportData) => {
                // Implement this based on your organization service or base firestore service
                try {
                    return await this.organization.saveReport?.(reportData) || { success: true, data: reportData };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            
            deleteReport: async (reportId) => {
                // Implement this based on your organization service or base firestore service
                try {
                    return await this.organization.deleteReport?.(reportId) || { success: true };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            
            toggleSchedule: async ({ organizationId, enabled }) => {
                // Implement this based on your organization service
                try {
                    return await this.organization.toggleSchedule?.({ organizationId, enabled }) || { success: true, data: { enabled } };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            
            subscribeToTriggers: (orgId, callback) => {
                // Implement this based on your organization service
                try {
                    return this.organization.subscribeToTriggers?.(orgId, callback) || (() => {});
                } catch (error) {
                    console.error('Error subscribing to triggers:', error);
                    return () => {};
                }
            },
            
            generatePDF: async (report) => {
                // Implement PDF generation
                try {
                    return await this.organization.generatePDF?.(report) || { success: true, data: { url: `/pdf/${report.id}` } };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            }
        };
    }

    // ADDED: Base FirestoreService methods that were missing
    getCurrentUserId() {
        return this.auth.currentUser?.uid || null;
    }

    getCurrentUser() {
        return this.auth.currentUser || null;
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

    // User service methods
    getUserProfile(userId) {
        return this.user.getUserProfile(userId);
    }

    createOrUpdateUserProfile(userData) {
        return this.user.createOrUpdateUserProfile(userData);
    }

    // Test suite service methods
    subscribeToUserTestSuites(onSuccess, onError) {
        return this.testSuite.subscribeToUserTestSuites(onSuccess, onError);
    }

    createTestSuite(suiteData) {
        return this.testSuite.createTestSuite(suiteData);
    }

    // Asset creation methods
    createBug(suiteId, bugData, sprintId = null) {
        return this.assets.createBug(suiteId, bugData, sprintId);
    }

    createTestCase(suiteId, testCaseData, sprintId = null) {
        return this.assets.createTestCase(suiteId, testCaseData, sprintId);
    }

    createRecording(suiteId, recordingData, sprintId = null) {
        return this.assets.createRecording(suiteId, recordingData, sprintId);
    }

    createSprint(suiteId, sprintData) {
        return this.assets.createSprint(suiteId, sprintData);
    }

    // Asset update methods - THESE WERE MISSING!
    updateBug(bugId, updates, suiteId = null, sprintId = null) {
        return this.assets.updateBug(bugId, updates, suiteId, sprintId);
    }

    updateTestCase(testCaseId, updates, suiteId = null, sprintId = null) {
        return this.assets.updateTestCase(testCaseId, updates, suiteId, sprintId);
    }

    updateRecording(recordingId, updates, suiteId = null, sprintId = null) {
        return this.assets.updateRecording(recordingId, updates, suiteId, sprintId);
    }

    updateSprint(sprintId, updates, suiteId = null) {
        return this.assets.updateSprint(sprintId, updates, suiteId);
    }

    // Asset deletion methods
    deleteBug(bugId, suiteId, sprintId = null) {
        return this.assets.deleteBug(bugId, suiteId, sprintId);
    }

    deleteTestCase(testCaseId, suiteId, sprintId = null) {
        return this.assets.deleteTestCase(testCaseId, suiteId, sprintId);
    }

    deleteRecording(recordingId, suiteId, sprintId = null) {
        return this.assets.deleteRecording(recordingId, suiteId, sprintId);
    }

    deleteSprint(sprintId, suiteId) {
        return this.assets.deleteSprint(sprintId, suiteId);
    }

    // Asset retrieval methods
    getBug(bugId, suiteId, sprintId = null) {
        return this.assets.getBug(bugId, suiteId, sprintId);
    }

    getTestCase(testCaseId, suiteId, sprintId = null) {
        return this.assets.getTestCase(testCaseId, suiteId, sprintId);
    }

    getRecording(recordingId, suiteId, sprintId = null) {
        return this.assets.getRecording(recordingId, suiteId, sprintId);
    }

    getSprint(sprintId, suiteId) {
        return this.assets.getSprint(sprintId, suiteId);
    }

    getTestCases(suiteId, sprintId = null) {
        return this.assets.getTestCases(suiteId, sprintId);
    }

    getBugs(suiteId, sprintId = null) {
        return this.assets.getBugs(suiteId, sprintId);
    }

    // Batch operations
    batchLinkTestCasesToBug(bugId, testCaseIds) {
        return this.assets.batchLinkTestCasesToBug(bugId, testCaseIds);
    }

    batchUnlinkTestCaseFromBug(bugId, testCaseId) {
        return this.assets.batchUnlinkTestCaseFromBug(bugId, testCaseId);
    }

    batchLinkBugsToTestCase(testCaseId, bugIds) {
        return this.assets.batchLinkBugsToTestCase(testCaseId, bugIds);
    }

    batchUnlinkBugFromTestCase(testCaseId, bugId) {
        return this.assets.batchUnlinkBugFromTestCase(testCaseId, bugId);
    }

    addTestCasesToSprint(sprintId, testCaseIds) {
        return this.assets.addTestCasesToSprint(sprintId, testCaseIds);
    }

    addBugsToSprint(sprintId, bugIds) {
        return this.assets.addBugsToSprint(sprintId, bugIds);
    }

    // Subscription methods
    subscribeToTestCases(suiteId, onSuccess, onError) {
        return this.assets.subscribeToTestCases(suiteId, onSuccess, onError);
    }

    subscribeToBugs(suiteId, onSuccess, onError) {
        return this.assets.subscribeToBugs(suiteId, onSuccess, onError);
    }

    subscribeToRecordings(suiteId, onSuccess, onError) {
        return this.assets.subscribeToRecordings(suiteId, onSuccess, onError);
    }

    subscribeToSprints(suiteId, onSuccess, onError) {
        return this.assets.subscribeToSprints(suiteId, onSuccess, onError);
    }

    cleanup() {
        this.user.cleanup?.();
        this.organization.cleanup?.();
        this.testSuite.cleanup?.();
        this.assets.cleanup?.();
        this.unsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribes.clear();
    }
}

const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };