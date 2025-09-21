// services/BaseFirestoreService.js - FIXED to preserve required fields
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
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

export class BaseFirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
        this._currentSuiteId = null;
        this._suiteStateCallbacks = new Set();
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

    // FIXED: Preserve required fields and handle suite_id correctly
    addCommonFields(data, isUpdate = false) {
        const userId = this.getCurrentUserId();
        
        // Clean data but preserve required fields like suite_id
        const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
            // Preserve important fields even if null
            const preserveFields = ['suite_id', 'suiteId', 'sprint_id', 'sprintId', 'status', 'title', 'description'];
            if (preserveFields.includes(key)) {
                return value; // Keep these fields even if null/empty
            }
            // Filter out null/undefined for other fields
            if (value === null || value === undefined) return undefined;
            return value;
        }));

        // Use serverTimestamp for better consistency with security rules
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

        // CRITICAL: Ensure suite_id is always present for recordings
        const finalData = { ...cleanData, ...commonFields };
        
        // For recordings, ensure suite_id is preserved
        if (cleanData.suite_id && !finalData.suite_id) {
            finalData.suite_id = cleanData.suite_id;
        }
        if (cleanData.suiteId && !finalData.suite_id) {
            finalData.suite_id = cleanData.suiteId;
        }

        console.log('BaseFirestoreService.addCommonFields result:', {
            operation: isUpdate ? 'update' : 'create',
            hasSuiteId: !!finalData.suite_id,
            suite_id: finalData.suite_id,
            hasCreatedAt: !!finalData.created_at,
            hasUserId: !!userId,
            keys: Object.keys(finalData)
        });

        return finalData;
    }

    async createDocument(collectionPath, data, customDocId = null) {
        try {
            console.log('BaseFirestoreService.createDocument called:', {
                collectionPath,
                customDocId,
                dataKeys: Object.keys(data),
                hasSuiteId: !!data.suite_id,
                suite_id: data.suite_id,
                hasUserId: !!this.getCurrentUserId()
            });

            const collectionRef = this.createCollectionRef(collectionPath);
            let docRef;
            const validatedData = this.addCommonFields(data);

            // CRITICAL: Log the final data being sent to Firestore
            console.log('Final data for Firestore:', {
                collectionPath,
                hasSuiteId: !!validatedData.suite_id,
                suite_id: validatedData.suite_id,
                hasCreatedAt: !!validatedData.created_at,
                hasCreatedBy: !!validatedData.created_by,
                dataStructure: {
                    title: validatedData.title,
                    suite_id: validatedData.suite_id,
                    status: validatedData.status,
                    created_by: validatedData.created_by,
                    // Show other key fields
                    youtubeId: validatedData.youtubeId,
                    videoUrl: validatedData.videoUrl
                }
            });

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

            console.log('Document created successfully:', {
                docId: docRef.id,
                collectionPath,
                finalSuiteId: validatedData.suite_id
            });

            return { success: true, data: { id: docRef.id, ...validatedData }, docId: docRef.id };
        } catch (error) {
            console.error('createDocument error:', error);
            
            // Log specific details for debugging
            if (error.code === 'permission-denied') {
                console.error('Permission denied details:', {
                    collectionPath,
                    userId: this.getCurrentUserId(),
                    suite_id: data.suite_id,
                    errorMessage: error.message
                });
            }
            
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
            
            console.log('Updating document:', {
                collectionPath,
                docId: validDocId,
                updateKeys: Object.keys(updateData),
                hasSuiteId: !!updateData.suite_id
            });
            
            await updateDoc(docRef, updateData);
            return { success: true, data: updateData };
        } catch (error) {
            console.error('updateDocument error:', error);
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
            console.log('Querying documents:', {
                collectionPath,
                constraintsCount: constraints.length,
                orderByField,
                limitCount
            });

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

            console.log('Query results:', {
                collectionPath,
                documentsFound: documents.length,
                sampleDoc: documents[0] ? {
                    id: documents[0].id,
                    hasSuiteId: !!documents[0].suite_id,
                    hasTitle: !!documents[0].title
                } : null
            });

            return { success: true, data: documents };
        } catch (error) {
            console.error('queryDocuments error:', error);
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
                console.error('Document subscription error:', error);
                errorCallback?.(this.handleFirestoreError(error, 'subscribe to document'));
            }
        );

        const subscriptionKey = `${collectionPath}/${validDocId}`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    subscribeToCollection(collectionPath, constraints = [], callback, errorCallback = null) {
        console.log('Setting up collection subscription:', {
            collectionPath,
            constraintsCount: constraints.length
        });

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
                
                console.log('Collection subscription update:', {
                    collectionPath,
                    documentsReceived: documents.length,
                    sampleDoc: documents[0] ? {
                        id: documents[0].id,
                        hasSuiteId: !!documents[0].suite_id,
                        hasTitle: !!documents[0].title
                    } : null
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

    // =================== SUITE STATE MANAGEMENT ===================

    getCurrentSuiteId() {
        if (this._currentSuiteId) {
            return this._currentSuiteId;
        }

        if (typeof window !== 'undefined') {
            const sessionSuiteId = sessionStorage.getItem('currentSuiteId');
            if (sessionSuiteId && sessionSuiteId !== 'null' && sessionSuiteId !== 'undefined') {
                this._currentSuiteId = sessionSuiteId;
                return sessionSuiteId;
            }

            const localSuiteId = localStorage.getItem('currentSuiteId');
            if (localSuiteId && localSuiteId !== 'null' && localSuiteId !== 'undefined') {
                this._currentSuiteId = localSuiteId;
                sessionStorage.setItem('currentSuiteId', localSuiteId);
                return localSuiteId;
            }
        }

        return null;
    }

    setCurrentSuiteId(suiteId) {
        const validSuiteId = this.validateDocId(suiteId);
        this._currentSuiteId = validSuiteId;

        if (typeof window !== 'undefined') {
            if (validSuiteId) {
                sessionStorage.setItem('currentSuiteId', validSuiteId);
                localStorage.setItem('currentSuiteId', validSuiteId);
            } else {
                sessionStorage.removeItem('currentSuiteId');
                localStorage.removeItem('currentSuiteId');
            }
        }

        this._notifySuiteChange(validSuiteId);
        return validSuiteId;
    }

    clearCurrentSuiteId() {
        this._currentSuiteId = null;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('currentSuiteId');
            localStorage.removeItem('currentSuiteId');
        }
        this._notifySuiteChange(null);
    }

    onSuiteChange(callback) {
        this._suiteStateCallbacks.add(callback);
        return () => {
            this._suiteStateCallbacks.delete(callback);
        };
    }

    _notifySuiteChange(suiteId) {
        this._suiteStateCallbacks.forEach(callback => {
            try {
                callback(suiteId);
            } catch (error) {
                console.error('Error in suite change callback:', error);
            }
        });
    }

    // =================== CLEANUP ===================

    cleanup() {
        this.unsubscribeAll();
        this._suiteStateCallbacks.clear();
        this._currentSuiteId = null;
    }

    // =================== DEBUGGING UTILITIES ===================

    async testFirestoreConnection() {
        try {
            const userId = this.getCurrentUserId();
            console.log('Testing Firestore connection:', {
                hasAuth: !!this.auth.currentUser,
                userId,
                hasDb: !!this.db
            });

            // Test with a simple read operation
            const testQuery = query(collection(this.db, 'testSuites'), limit(1));
            const testSnapshot = await getDocs(testQuery);
            
            console.log('Firestore connection test result:', {
                success: true,
                canRead: true,
                docsFound: testSnapshot.size
            });

            return { success: true, message: 'Firestore connection successful' };
        } catch (error) {
            console.error('Firestore connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    async debugRecordingCreation(suiteId, sampleData) {
        console.log('=== DEBUG: Recording Creation ===');
        
        const userId = this.getCurrentUserId();
        console.log('1. Auth Status:', {
            hasUser: !!this.auth.currentUser,
            userId,
            userEmail: this.auth.currentUser?.email
        });

        console.log('2. Input Data:', {
            suiteId,
            hasSuiteId: !!sampleData.suite_id,
            suite_id: sampleData.suite_id,
            title: sampleData.title,
            inputKeys: Object.keys(sampleData)
        });

        const processedData = this.addCommonFields(sampleData);
        console.log('3. Processed Data:', {
            hasSuiteId: !!processedData.suite_id,
            suite_id: processedData.suite_id,
            hasCreatedAt: !!processedData.created_at,
            hasCreatedBy: !!processedData.created_by,
            processedKeys: Object.keys(processedData)
        });

        const collectionPath = `testSuites/${suiteId}/recordings`;
        console.log('4. Collection Path:', collectionPath);

        try {
            // Test if we can access the collection
            const collectionRef = collection(this.db, collectionPath);
            const testQuery = query(collectionRef, limit(1));
            const testSnapshot = await getDocs(testQuery);
            
            console.log('5. Collection Access Test:', {
                success: true,
                existingDocs: testSnapshot.size
            });

            return {
                success: true,
                canAccess: true,
                processedData,
                collectionPath
            };
        } catch (error) {
            console.error('6. Collection Access Error:', error);
            return {
                success: false,
                error: error.message,
                processedData,
                collectionPath
            };
        }
    }
}