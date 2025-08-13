// services/firestoreService.js
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

export class BaseFirestoreService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();

        // Suite state management
        this._currentSuiteId = null;
        this._suiteStateCallbacks = new Set();
    }

    /**
     * Complete user registration with atomic transaction
     * Handles both individual and organization account types
     */
    async completeUserRegistration(registrationData) {
        const {
            userId,
            email,
            displayName,
            firstName,
            lastName,
            accountType,
            preferences,
            organizationName,
            organizationIndustry,
            organizationSize
        } = registrationData;

        if (!userId) {
            return { success: false, error: { message: 'User ID is required' } };
        }

        try {
            console.log('🔄 Starting atomic registration transaction...');

            const batch = writeBatch(this.db);
            const timestamp = serverTimestamp();
            const now = new Date(); // Use regular Date for array fields

            // 1. Create user profile document
            const userRef = this.createDocRef('users', userId);
            const userProfileData = {
                user_id: userId,
                email: email,
                display_name: displayName,
                first_name: firstName,
                last_name: lastName,
                account_type: accountType,
                role: accountType === 'organization' ? 'Admin' : 'member',
                preferences: preferences || {},
                contact_info: {
                    email: email,
                    phone: null
                },
                profile_picture: null,
                account_memberships: [], // Initialize as empty array, populate below if needed
                registrationCompleted: true,
                created_at: timestamp,
                updated_at: timestamp,
                created_by: userId,
                updated_by: userId
            };

            let organizationId = null;
            let organizationData = null;

            // 2. Handle organization-specific setup
            if (accountType === 'organization') {
                // Generate organization ID
                organizationId = this.createDocRef('organizations', 'temp').id;

                // Create organization document
                const orgRef = this.createDocRef('organizations', organizationId);
                organizationData = {
                    id: organizationId,
                    name: organizationName,
                    description: `${organizationName} organization`,
                    industry: organizationIndustry,
                    size: organizationSize || 'small',
                    ownerId: userId,
                    settings: {
                        allowPublicJoin: false,
                        requireEmailVerification: true,
                        defaultRole: 'member'
                    },
                    created_at: timestamp,
                    updated_at: timestamp,
                    created_by: userId,
                    updated_by: userId
                };
                batch.set(orgRef, organizationData);

                // Create organization member entry
                const memberRef = this.createDocRef('organizations', organizationId, 'members', userId);
                const memberData = {
                    user_id: userId,
                    email: email,
                    display_name: displayName,
                    role: 'Admin',
                    status: 'active',
                    permissions: ['all'], // Admin has all permissions - array of strings only
                    joined_at: timestamp,
                    created_at: timestamp,
                    updated_at: timestamp
                };
                batch.set(memberRef, memberData);

                // Create user membership reference
                const userMembershipRef = this.createDocRef('userMemberships', userId, 'organizations', organizationId);
                const userMembershipData = {
                    org_id: organizationId,
                    org_name: organizationName,
                    user_id: userId,
                    role: 'Admin',
                    status: 'active',
                    joined_at: timestamp,
                    created_at: timestamp,
                    updated_at: timestamp
                };
                batch.set(userMembershipRef, userMembershipData);

                // FIXED: Populate account_memberships array with regular Date objects, not serverTimestamp
                userProfileData.organizationId = organizationId;
                userProfileData.organizationName = organizationName;
                userProfileData.account_memberships = [{
                    organization_id: organizationId,
                    organization_name: organizationName,
                    role: 'Admin',
                    status: 'active',
                    joined_at: now.toISOString() // Use ISO string instead of serverTimestamp()
                }];
            }

            // Set the user profile document
            batch.set(userRef, userProfileData);

            // 3. Create subscription document
            const subscriptionRef = this.createDocRef('subscriptions', userId);
            const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const subscriptionData = {
                user_id: userId,
                organization_id: organizationId,
                plan: 'trial',
                status: 'trial_active',
                trial_starts_at: now.toISOString(),
                trial_ends_at: trialEndDate.toISOString(),
                authProvider: 'email',
                isTrialActive: true,
                daysRemainingInTrial: 30,
                features: {
                    maxSuites: accountType === 'organization' ? 10 : 5,
                    maxTestCasesPerSuite: accountType === 'organization' ? 100 : 50,
                    canCreateTestCases: true,
                    canUseRecordings: true,
                    canUseAutomation: true,
                    canInviteTeam: accountType === 'organization',
                    canExportReports: true,
                    canCreateOrganizations: accountType === 'organization',
                    advancedAnalytics: accountType === 'organization',
                    prioritySupport: false,
                    maxTeamMembers: accountType === 'organization' ? 10 : 1
                },
                created_at: timestamp,
                updated_at: timestamp,
                created_by: userId,
                updated_by: userId
            };
            batch.set(subscriptionRef, subscriptionData);

            // 4. Create account-specific document
            if (accountType === 'individual') {
                const individualRef = this.createDocRef('individualAccounts', userId);
                const individualData = {
                    user_id: userId,
                    email: email,
                    subscription_id: userId,
                    subscription_status: 'trial_active',
                    personal_workspace: {
                        name: `${firstName}'s Workspace`,
                        description: 'Personal testing workspace',
                        created_at: now.toISOString() // Use ISO string in nested objects
                    },
                    created_at: timestamp,
                    updated_at: timestamp
                };
                batch.set(individualRef, individualData);
            }

            // 5. Create initial activity log
            const activityRef = this.createDocRef('activityLogs', userId, 'logs', 'registration');
            const activityData = {
                user_id: userId,
                action: 'user_registered',
                description: `User registered with ${accountType} account`,
                metadata: {
                    account_type: accountType,
                    organization_id: organizationId,
                    organization_name: organizationName
                },
                timestamp: timestamp
            };
            batch.set(activityRef, activityData);

            // 6. Commit all operations atomically
            await batch.commit();
            console.log('✅ Registration transaction completed successfully');

            // 7. Return comprehensive result
            return {
                success: true,
                data: {
                    user: {
                        id: userId,
                        ...userProfileData
                    },
                    organization: organizationData,
                    subscription: {
                        id: userId,
                        ...subscriptionData
                    },
                    accountType: accountType
                }
            };

        } catch (error) {
            console.error('❌ Registration transaction failed:', error);
            return this.handleFirestoreError(error, 'complete user registration');
        }
    }

    /**
     * Verify and activate user account after email verification
     */
    async activateUserAccount(userId) {
        if (!userId) {
            return { success: false, error: { message: 'User ID is required' } };
        }

        try {
            const batch = writeBatch(this.db);
            const timestamp = serverTimestamp();

            // Update user profile
            const userRef = this.createDocRef('users', userId);
            batch.update(userRef, {
                emailVerified: true,
                accountStatus: 'active',
                verifiedAt: timestamp,
                updated_at: timestamp
            });

            // Update subscription if exists
            const subscriptionRef = this.createDocRef('subscriptions', userId);
            batch.update(subscriptionRef, {
                emailVerified: true,
                updated_at: timestamp
            });

            // Log activation
            const activityRef = this.createDocRef('activityLogs', userId, 'logs', `activation_${Date.now()}`);
            batch.set(activityRef, {
                user_id: userId,
                action: 'account_activated',
                description: 'User account activated after email verification',
                timestamp: timestamp
            });

            await batch.commit();

            return {
                success: true,
                message: 'Account activated successfully'
            };
        } catch (error) {
            console.error('Account activation error:', error);
            return this.handleFirestoreError(error, 'activate user account');
        }
    }

    async getAutomationsBySuite(suiteId) {
        try {
            const validSuiteId = this.validateDocId(suiteId);
            if (!validSuiteId) {
                return { success: false, error: { message: 'Invalid suite ID' } };
            }

            const result = await this.queryDocuments('automations', [
                ['suiteId', '==', validSuiteId]
            ]);

            return result;
        } catch (error) {
            return this.handleFirestoreError(error, 'get automations by suite');
        }
    }

    /**
     * Clean up partial registration data if registration fails
     */
    async cleanupPartialRegistration(userId) {
        if (!userId) return;

        try {
            console.log('🧹 Cleaning up partial registration for user:', userId);

            const batch = writeBatch(this.db);

            // List of collections to clean
            const collectionsToClean = [
                'users',
                'subscriptions',
                'individualAccounts',
                'userMemberships'
            ];

            for (const collectionName of collectionsToClean) {
                try {
                    const docRef = this.createDocRef(collectionName, userId);
                    batch.delete(docRef);
                } catch (error) {
                    console.warn(`Could not delete ${collectionName}/${userId}:`, error);
                }
            }

            await batch.commit();
            console.log('✅ Cleanup completed');

        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    // =================== CORE FIRESTORE METHODS ===================
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

    // =================== SUITE STATE MANAGEMENT ===================
    getCurrentSuiteId() {
        if (this._currentSuiteId) {
            return this._currentSuiteId;
        }

        // Try to get from sessionStorage first (for current session)
        if (typeof window !== 'undefined') {
            const sessionSuiteId = sessionStorage.getItem('currentSuiteId');
            if (sessionSuiteId && sessionSuiteId !== 'null' && sessionSuiteId !== 'undefined') {
                this._currentSuiteId = sessionSuiteId;
                return sessionSuiteId;
            }

            // Fallback to localStorage for persistence across sessions
            const localSuiteId = localStorage.getItem('currentSuiteId');
            if (localSuiteId && localSuiteId !== 'null' && localSuiteId !== 'undefined') {
                this._currentSuiteId = localSuiteId;
                // Also set in session storage
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

        // Notify listeners about suite change
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
        // Return unsubscribe function
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
}