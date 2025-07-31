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
    onSnapshot,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

export class FirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
    }

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

    subscribeToDocument(collectionPath, docId, callback, errorCallback = null) {
        const validDocId = this.validateDocId(docId);
        if (!validDocId) {
            errorCallback?.({ success: false, error: { message: 'Invalid or missing document ID' } });
            return () => { };
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

    recordings = {
        createRecording: async (recordingData) => {
            try {
                const suiteId = this.validateDocId(recordingData.suiteId);
                if (!suiteId) {
                    return { success: false, error: { message: 'Invalid suite ID' } };
                }
                const collectionPath = `suites/${suiteId}/recordings`;
                const result = await this.createDocument(collectionPath, recordingData);
                return result;
            } catch (error) {
                return this.handleFirestoreError(error, 'create recording');
            }
        },

        linkRecordingToBug: async (recordingId, bugId) => {
            try {
                const suiteId = this.validateDocId(this.getCurrentSuiteId());
                if (!suiteId || !recordingId || !bugId) {
                    return { success: false, error: { message: 'Invalid IDs provided' } };
                }

                const batch = writeBatch(this.db);
                const recordingRef = this.createDocRef(`suites/${suiteId}/recordings`, recordingId);
                const bugRef = this.createDocRef(`suites/${suiteId}/bugs`, bugId);

                batch.update(recordingRef, { bugId, updated_at: serverTimestamp() });
                batch.update(bugRef, {
                    recordingIds: arrayUnion(recordingId),
                    updated_at: serverTimestamp()
                });

                await batch.commit();
                return { success: true };
            } catch (error) {
                return this.handleFirestoreError(error, 'link recording to bug');
            }
        },

        subscribeToRecordings: (suiteId, callback, errorCallback) => {
            const collectionPath = `suites/${suiteId}/recordings`;
            return this.subscribeToCollection(
                collectionPath,
                [orderBy('created_at', 'desc')],
                callback,
                errorCallback
            );
        },
    };

    reports = {
        getReports: async (orgId) => {
            const collectionPath = `organizations/${orgId}/reports`;
            return await this.queryDocuments(collectionPath, [], 'created_at', 100);
        },
        saveReport: async (reportData) => {
            const collectionPath = `organizations/${reportData.organizationId}/reports`;
            return await this.createDocument(collectionPath, reportData);
        },
        deleteReport: async (reportId) => {
            const orgId = this.getCurrentUser()?.organizationId;
            const collectionPath = `organizations/${orgId}/reports`;
            return await this.deleteDocument(collectionPath, reportId);
        },
        toggleSchedule: async ({ organizationId, enabled }) => {
            return await this.updateDocument(`organizations/${organizationId}/settings`, 'reportSchedule', { enabled });
        },
        subscribeToTriggers: (orgId, callback) => {
            const collectionPath = `organizations/${orgId}/triggers`;
            return this.subscribeToCollection(collectionPath, [], callback);
        },
        generatePDF: async (report) => {
            // Placeholder for PDF generation logic
            return { success: true, data: { url: `/pdf/${report.id}` } };
        },
    };


    cleanup() {
        this.unsubscribeAll();
    }
}