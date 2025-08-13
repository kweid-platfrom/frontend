import { BaseFirestoreService } from './firestoreService'; // Fixed import
import { query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

export class TestSuiteService extends BaseFirestoreService {
    constructor(organizationService) {
        super();
        this.organizationService = organizationService;
    }

    async validateTestSuiteAccess(suiteId, accessType = 'read') {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error('No authenticated user found for test suite access validation');
            return false;
        }

        try {
            const suiteDoc = await this.getDocument('testSuites', suiteId);
            if (!suiteDoc.success) {
                console.warn(`Test suite ${suiteId} not found`);
                return false;
            }

            const suiteData = suiteDoc.data;

            if (suiteData.ownerType === 'individual' && suiteData.ownerId === userId) {
                return true;
            }

            if (suiteData.ownerType === 'organization') {
                const hasOrgAccess = await this.organizationService.validateOrganizationAccess(suiteData.ownerId, 'member');
                if (hasOrgAccess) return true;
            }

            if (suiteData.admins?.includes(userId)) return true;
            if (accessType === 'read' && suiteData.members?.includes(userId)) return true;

            console.warn(`User ${userId} lacks access to suite ${suiteId}`);
            return false;
        } catch (error) {
            console.error('Error validating test suite access:', error);
            return false;
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

            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    result.value.forEach((doc) => {
                        suiteMap.set(doc.id, { id: doc.id, ...doc.data() });
                    });
                } else if (result.reason.code !== 'permission-denied') {
                    throw result.reason;
                } else {
                    errorCount++;
                }
            });

            const testSuites = Array.from(suiteMap.values()).sort((a, b) => {
                const aTime = a.created_at?.toMillis?.() || 0;
                const bTime = b.created_at?.toMillis?.() || 0;
                return bTime - aTime;
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

    subscribeToUserTestSuites(onSuccess, onError) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            onError?.({ success: false, error: { message: 'User not authenticated' } });
            return () => {};
        }

        const queries = [
            query(this.createCollectionRef('testSuites'), where('ownerType', '==', 'individual'), where('ownerId', '==', userId), orderBy('created_at', 'desc')),
            query(this.createCollectionRef('testSuites'), where('members', 'array-contains', userId), orderBy('created_at', 'desc')),
            query(this.createCollectionRef('testSuites'), where('admins', 'array-contains', userId), orderBy('created_at', 'desc'))
        ];

        const suiteMap = new Map();
        const unsubscribes = [];

        queries.forEach((q) => {
            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'removed') {
                            suiteMap.delete(change.doc.id);
                        } else {
                            suiteMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
                        }
                    });
                    const sortedSuites = Array.from(suiteMap.values()).sort((a, b) => {
                        const aTime = a.created_at?.toMillis?.() || 0;
                        const bTime = b.created_at?.toMillis?.() || 0;
                        return bTime - aTime;
                    });
                    onSuccess(sortedSuites);
                },
                (error) => {
                    if (error.code !== 'permission-denied') {
                        onError?.(this.handleFirestoreError(error, 'subscribe to user test suites'));
                    }
                }
            );
            unsubscribes.push(unsubscribe);
        });

        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }
}