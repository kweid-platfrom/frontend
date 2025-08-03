import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

export class UserService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.unsubscribes = new Map();
        this.userCache = new Map();
    }

    getCurrentUserId() {
        return this.auth.currentUser?.uid || null;
    }

    getCurrentUser() {
        return this.auth.currentUser || null;
    }

    validateUserId(userId) {
        if (!userId || userId === null || userId === undefined) {
            return null;
        }
        const stringId = String(userId).trim();
        if (stringId === '' || stringId === 'null' || stringId === 'undefined') {
            return null;
        }
        return stringId;
    }

    handleFirestoreError(error, operation = 'operation') {
        console.error(`UserService ${operation} error:`, error);
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

    /**
     * Get user profile data
     * @param {string} userId - User ID to fetch profile for (defaults to current user)
     * @returns {Promise} - Success/error object with user data
     */
    async getUserProfile(userId = null) {
        try {
            const targetUserId = userId || this.getCurrentUserId();
            const validUserId = this.validateUserId(targetUserId);
            
            if (!validUserId) {
                return { 
                    success: false, 
                    error: { message: 'Invalid or missing user ID' } 
                };
            }

            // Check cache first
            if (this.userCache.has(validUserId)) {
                const cachedData = this.userCache.get(validUserId);
                // Return cached data if it's less than 5 minutes old
                if (Date.now() - cachedData.timestamp < 300000) {
                    return { success: true, data: cachedData.data };
                }
            }

            const userRef = doc(this.db, 'users', validUserId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = { id: userSnap.id, ...userSnap.data() };
                
                // Cache the user data
                this.userCache.set(validUserId, {
                    data: userData,
                    timestamp: Date.now()
                });

                return { success: true, data: userData };
            }
            
            return { 
                success: false, 
                error: { message: 'User profile not found' } 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user profile');
        }
    }

    /**
     * Create or update user profile
     * @param {Object} userData - User data to create/update
     * @returns {Promise} - Success/error object
     */
    async createOrUpdateUserProfile(userData) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { 
                    success: false, 
                    error: { message: 'User must be authenticated' } 
                };
            }

            const userRef = doc(this.db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            let processedData;
            let operation;

            if (userSnap.exists()) {
                // Update existing profile
                processedData = this.addCommonFields(userData, true);
                await updateDoc(userRef, processedData);
                operation = 'update';
            } else {
                // Create new profile
                const requiredFields = {
                    user_id: userId,
                    email: this.getCurrentUser()?.email || '',
                    ...userData
                };
                processedData = this.addCommonFields(requiredFields, false);
                await setDoc(userRef, processedData);
                operation = 'create';
            }

            // Clear cache for this user
            this.userCache.delete(userId);

            const finalData = { id: userId, ...processedData };
            return { 
                success: true, 
                data: finalData,
                operation: operation 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'create/update user profile');
        }
    }

    /**
     * Subscribe to user profile changes
     * @param {string} userId - User ID to subscribe to (defaults to current user)
     * @param {Function} callback - Callback function for profile updates
     * @param {Function} errorCallback - Error callback function
     * @returns {Function} - Unsubscribe function
     */
    subscribeToUserProfile(userId = null, callback, errorCallback = null) {
        const targetUserId = userId || this.getCurrentUserId();
        const validUserId = this.validateUserId(targetUserId);
        
        if (!validUserId) {
            errorCallback?.({ 
                success: false, 
                error: { message: 'Invalid or missing user ID' } 
            });
            return () => {};
        }

        const userRef = doc(this.db, 'users', validUserId);
        const unsubscribe = onSnapshot(
            userRef,
            (doc) => {
                if (doc.exists()) {
                    const userData = { id: doc.id, ...doc.data() };
                    
                    // Update cache
                    this.userCache.set(validUserId, {
                        data: userData,
                        timestamp: Date.now()
                    });
                    
                    callback(userData);
                } else {
                    callback(null);
                }
            },
            (error) => {
                errorCallback?.(this.handleFirestoreError(error, 'subscribe to user profile'));
            }
        );

        const subscriptionKey = `user_profile_${validUserId}`;
        this.unsubscribes.set(subscriptionKey, unsubscribe);
        return unsubscribe;
    }

    /**
     * Update specific user profile fields
     * @param {Object} fieldsToUpdate - Object containing fields to update
     * @returns {Promise} - Success/error object
     */
    async updateUserProfileFields(fieldsToUpdate) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { 
                    success: false, 
                    error: { message: 'User must be authenticated' } 
                };
            }

            // Validate allowed fields based on security rules
            const allowedFields = [
                'preferences', 
                'contact_info', 
                'profile_picture', 
                'display_name', 
                'account_memberships'
            ];
            
            const invalidFields = Object.keys(fieldsToUpdate).filter(
                field => !allowedFields.includes(field)
            );
            
            if (invalidFields.length > 0) {
                return {
                    success: false,
                    error: { 
                        message: `Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}` 
                    }
                };
            }

            const userRef = doc(this.db, 'users', userId);
            const updateData = this.addCommonFields(fieldsToUpdate, true);
            
            await updateDoc(userRef, updateData);

            // Clear cache for this user
            this.userCache.delete(userId);

            return { 
                success: true, 
                data: updateData 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'update user profile fields');
        }
    }

    /**
     * Get user's organization memberships
     * @param {string} userId - User ID (defaults to current user)
     * @returns {Promise} - Success/error object with memberships data
     */
    async getUserMemberships(userId = null) {
        try {
            const targetUserId = userId || this.getCurrentUserId();
            const validUserId = this.validateUserId(targetUserId);
            
            if (!validUserId) {
                return { 
                    success: false, 
                    error: { message: 'Invalid or missing user ID' } 
                };
            }

            const membershipRef = doc(this.db, 'userMemberships', validUserId);
            const membershipSnap = await getDoc(membershipRef);

            if (membershipSnap.exists()) {
                return { 
                    success: true, 
                    data: { id: membershipSnap.id, ...membershipSnap.data() } 
                };
            }
            
            return { 
                success: true, 
                data: { organizations: [] } 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user memberships');
        }
    }

    /**
     * Search users by email (for invitations, etc.)
     * @param {string} email - Email to search for
     * @returns {Promise} - Success/error object with user data
     */
    async searchUserByEmail(email) {
        try {
            if (!email || typeof email !== 'string') {
                return { 
                    success: false, 
                    error: { message: 'Valid email is required' } 
                };
            }

            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = { id: userDoc.id, ...userDoc.data() };
                return { success: true, data: userData };
            }
            
            return { 
                success: false, 
                error: { message: 'User not found' } 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'search user by email');
        }
    }

    /**
     * Delete user profile (self-deletion only)
     * @returns {Promise} - Success/error object
     */
    async deleteUserProfile() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { 
                    success: false, 
                    error: { message: 'User must be authenticated' } 
                };
            }

            const batch = writeBatch(this.db);
            
            // Delete user profile
            const userRef = doc(this.db, 'users', userId);
            batch.delete(userRef);
            
            // Delete user memberships
            const membershipRef = doc(this.db, 'userMemberships', userId);
            batch.delete(membershipRef);
            
            // Delete individual account if exists
            const individualAccountRef = doc(this.db, 'individualAccounts', userId);
            batch.delete(individualAccountRef);

            await batch.commit();

            // Clear cache
            this.userCache.delete(userId);

            return { success: true };
        } catch (error) {
            return this.handleFirestoreError(error, 'delete user profile');
        }
    }

    /**
     * Get current user's full profile with memberships
     * @returns {Promise} - Success/error object with complete profile data
     */
    async getCurrentUserFullProfile() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return { 
                    success: false, 
                    error: { message: 'User must be authenticated' } 
                };
            }

            // Get user profile
            const profileResult = await this.getUserProfile(userId);
            if (!profileResult.success) {
                return profileResult;
            }

            // Get user memberships
            const membershipsResult = await this.getUserMemberships(userId);
            
            const fullProfile = {
                ...profileResult.data,
                memberships: membershipsResult.success ? membershipsResult.data : { organizations: [] }
            };

            return { 
                success: true, 
                data: fullProfile 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'get current user full profile');
        }
    }

    /**
     * Clear user cache
     * @param {string} userId - Specific user ID to clear, or null for all
     */
    clearUserCache(userId = null) {
        if (userId) {
            this.userCache.delete(userId);
        } else {
            this.userCache.clear();
        }
    }

    /**
     * Unsubscribe from a specific subscription
     * @param {string} subscriptionKey - Key of the subscription to cancel
     */
    unsubscribe(subscriptionKey) {
        const unsubscribe = this.unsubscribes.get(subscriptionKey);
        if (unsubscribe) {
            unsubscribe();
            this.unsubscribes.delete(subscriptionKey);
        }
    }

    /**
     * Cleanup all subscriptions and clear cache
     */
    cleanup() {
        this.unsubscribes.forEach((unsubscribe) => {
            unsubscribe();
        });
        this.unsubscribes.clear();
        this.userCache.clear();
    }
}