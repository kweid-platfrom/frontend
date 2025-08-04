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
    getDocs,
    runTransaction,
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
     * Get user profile data with multi-tenancy support
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
                
                // Ensure availableAccounts is always an array
                userData.availableAccounts = userData.availableAccounts || [];
                
                // Validate and clean up available accounts
                userData.availableAccounts = await this.validateAvailableAccounts(validUserId, userData.availableAccounts);
                
                // Normalize field names for consistency
                userData.displayName = userData.displayName || userData.display_name || userData.name;
                userData.firstName = userData.firstName || userData.first_name;
                userData.lastName = userData.lastName || userData.last_name;
                userData.accountType = userData.accountType || userData.account_type || 'individual';
                
                // Cache the user data
                this.userCache.set(validUserId, {
                    data: userData,
                    timestamp: Date.now()
                });

                return { success: true, data: userData };
            }
            
            return { 
                success: false, 
                error: { message: 'User profile not found', code: 'not-found' } 
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'get user profile');
        }
    }

    /**
     * Validate available accounts and clean up invalid ones
     * @param {string} userId - User ID
     * @param {Array} availableAccounts - Array of available accounts
     * @returns {Array} - Validated accounts array
     */
    async validateAvailableAccounts(userId, availableAccounts) {
        try {
            if (!Array.isArray(availableAccounts) || availableAccounts.length === 0) {
                return [];
            }

            const validatedAccounts = [];
            
            for (const account of availableAccounts) {
                // Basic validation
                if (!account.accountType || !account.id) {
                    continue;
                }

                // For organization accounts, verify the organization still exists and user has access
                if (account.accountType === 'organization' && account.organizationId) {
                    const orgAccess = await this.validateOrganizationAccess(userId, account.organizationId);
                    if (orgAccess.success) {
                        validatedAccounts.push({
                            ...account,
                            organizationName: orgAccess.data.organizationName || account.organizationName,
                            role: orgAccess.data.role || account.role
                        });
                    }
                } else if (account.accountType === 'individual') {
                    // Individual accounts are always valid for the same user
                    if (account.id === userId) {
                        validatedAccounts.push(account);
                    }
                }
            }

            return validatedAccounts;
        } catch (error) {
            console.error('Error validating available accounts:', error);
            return availableAccounts; // Return original array if validation fails
        }
    }

    /**
     * Validate organization access for a user
     * @param {string} userId - User ID
     * @param {string} organizationId - Organization ID
     * @returns {Promise} - Success/error object with organization data
     */
    async validateOrganizationAccess(userId, organizationId) {
        try {
            // Check if user has membership in the organization
            const membershipRef = doc(this.db, 'userMemberships', userId);
            const membershipSnap = await getDoc(membershipRef);
            
            if (membershipSnap.exists()) {
                const membershipData = membershipSnap.data();
                const orgMembership = membershipData.organizations?.find(
                    org => org.organizationId === organizationId
                );
                
                if (orgMembership && orgMembership.status === 'active') {
                    // Also verify the organization still exists
                    const orgRef = doc(this.db, 'organizations', organizationId);
                    const orgSnap = await getDoc(orgRef);
                    
                    if (orgSnap.exists()) {
                        return {
                            success: true,
                            data: {
                                organizationName: orgSnap.data().name,
                                role: orgMembership.role
                            }
                        };
                    }
                }
            }
            
            return {
                success: false,
                error: 'No valid organization access found'
            };
        } catch (error) {
            console.error('Error validating organization access:', error);
            return {
                success: false,
                error: getFirebaseErrorMessage(error)
            };
        }
    }

    /**
     * Create or update user profile with multi-tenancy support
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
                // Create new profile with default multi-tenancy fields
                const requiredFields = {
                    user_id: userId,
                    email: this.getCurrentUser()?.email || '',
                    accountType: 'individual', // Default to individual
                    availableAccounts: [], // Initialize empty available accounts
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
     * Update user profile for account switching
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise} - Success/error object
     */
    async updateUserProfile(userId, updateData) {
        try {
            const validUserId = this.validateUserId(userId);
            if (!validUserId) {
                return {
                    success: false,
                    error: { message: 'Invalid user ID' }
                };
            }

            // Security check: only allow users to update their own profile
            const currentUserId = this.getCurrentUserId();
            if (currentUserId !== validUserId) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Cannot update another user\'s profile' }
                };
            }

            const userRef = doc(this.db, 'users', validUserId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                return {
                    success: false,
                    error: { message: 'User profile not found' }
                };
            }

            const processedData = this.addCommonFields(updateData, true);
            await updateDoc(userRef, processedData);

            // Clear cache for this user
            this.userCache.delete(validUserId);

            const updatedData = {
                ...userSnap.data(),
                ...updateData,
                updated_at: new Date().toISOString()
            };

            return {
                success: true,
                data: updatedData
            };
        } catch (error) {
            return this.handleFirestoreError(error, 'update user profile');
        }
    }

    /**
     * Add an organization account to user's available accounts
     * @param {string} userId - User ID
     * @param {Object} organizationData - Organization account data
     * @returns {Promise} - Success/error object
     */
    async addOrganizationAccount(userId, organizationData) {
        try {
            const validUserId = this.validateUserId(userId);
            if (!validUserId) {
                return {
                    success: false,
                    error: { message: 'Invalid user ID' }
                };
            }

            // Security check
            const currentUserId = this.getCurrentUserId();
            if (currentUserId !== validUserId) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Cannot modify another user\'s accounts' }
                };
            }

            // Validate organization access
            const orgValidation = await this.validateOrganizationAccess(validUserId, organizationData.organizationId);
            if (!orgValidation.success) {
                return {
                    success: false,
                    error: { message: 'No valid access to organization' }
                };
            }

            const userRef = doc(this.db, 'users', validUserId);

            // Use transaction to ensure data consistency
            const result = await runTransaction(this.db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error('User profile not found');
                }
                
                const userData = userDoc.data();
                const availableAccounts = userData.availableAccounts || [];
                
                // Check if organization account already exists
                const existingOrgAccount = availableAccounts.find(acc => 
                    acc.accountType === 'organization' && 
                    acc.organizationId === organizationData.organizationId
                );
                
                if (existingOrgAccount) {
                    throw new Error('Organization account already exists');
                }
                
                // Create new organization account entry
                const newOrgAccount = {
                    id: validUserId, // Same user, different context
                    email: userData.email,
                    accountType: 'organization',
                    organizationId: organizationData.organizationId,
                    organizationName: orgValidation.data.organizationName,
                    role: orgValidation.data.role,
                    addedAt: new Date().toISOString(),
                };
                
                const updatedAvailableAccounts = [...availableAccounts, newOrgAccount];
                
                // Update user document
                transaction.update(userRef, {
                    availableAccounts: updatedAvailableAccounts,
                    updated_at: serverTimestamp()
                });
                
                return newOrgAccount;
            });

            // Clear cache
            this.userCache.delete(validUserId);

            console.log('✅ Organization account added successfully');
            return { success: true, data: result };
            
        } catch (error) {
            console.error('❌ Error adding organization account:', error);
            return this.handleFirestoreError(error, 'add organization account');
        }
    }

    /**
     * Remove an account from user's available accounts
     * @param {string} userId - User ID
     * @param {Object} accountToRemove - Account to remove
     * @returns {Promise} - Success/error object
     */
    async removeAvailableAccount(userId, accountToRemove) {
        try {
            const validUserId = this.validateUserId(userId);
            if (!validUserId) {
                return {
                    success: false,
                    error: { message: 'Invalid user ID' }
                };
            }

            // Security check
            const currentUserId = this.getCurrentUserId();
            if (currentUserId !== validUserId) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Cannot modify another user\'s accounts' }
                };
            }

            const userRef = doc(this.db, 'users', validUserId);

            const result = await runTransaction(this.db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error('User profile not found');
                }
                
                const userData = userDoc.data();
                const availableAccounts = userData.availableAccounts || [];
                
                // Filter out the account to remove
                const updatedAvailableAccounts = availableAccounts.filter(acc => 
                    !(acc.accountType === accountToRemove.accountType &&
                      acc.organizationId === accountToRemove.organizationId)
                );

                // Prevent removing if this would leave no accounts
                if (updatedAvailableAccounts.length === 0 && userData.accountType === accountToRemove.accountType) {
                    throw new Error('Cannot remove the only available account');
                }
                
                // Update user document
                transaction.update(userRef, {
                    availableAccounts: updatedAvailableAccounts,
                    updated_at: serverTimestamp()
                });
                
                return updatedAvailableAccounts;
            });

            // Clear cache
            this.userCache.delete(validUserId);

            console.log('✅ Available account removed successfully');
            return { success: true, data: result };
            
        } catch (error) {
            console.error('❌ Error removing available account:', error);
            return this.handleFirestoreError(error, 'remove available account');
        }
    }

    /**
     * Switch user's active account context
     * @param {string} userId - User ID
     * @param {Object} targetAccount - Target account to switch to
     * @returns {Promise} - Success/error object
     */
    async switchAccountContext(userId, targetAccount) {
        try {
            const validUserId = this.validateUserId(userId);
            if (!validUserId) {
                return {
                    success: false,
                    error: { message: 'Invalid user ID' }
                };
            }

            // Security check
            const currentUserId = this.getCurrentUserId();
            if (currentUserId !== validUserId) {
                return {
                    success: false,
                    error: { message: 'Unauthorized: Cannot switch another user\'s account' }
                };
            }

            const userRef = doc(this.db, 'users', validUserId);

            const result = await runTransaction(this.db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error('User profile not found');
                }
                
                const userData = userDoc.data();
                const availableAccounts = userData.availableAccounts || [];
                
                // Validate target account exists in available accounts or is the user's own account
                const isValidSwitch = 
                    targetAccount.id === validUserId || // Same user, different context
                    availableAccounts.some(acc => 
                        acc.id === targetAccount.id && 
                        acc.accountType === targetAccount.accountType &&
                        acc.organizationId === targetAccount.organizationId
                    );

                if (!isValidSwitch) {
                    throw new Error('Unauthorized account access');
                }

                // For organization accounts, validate current access
                if (targetAccount.accountType === 'organization' && targetAccount.organizationId) {
                    const orgAccess = await this.validateOrganizationAccess(validUserId, targetAccount.organizationId);
                    if (!orgAccess.success) {
                        throw new Error('No longer have access to this organization');
                    }
                }

                // Update account context
                const updateData = {
                    accountType: targetAccount.accountType,
                    organizationId: targetAccount.organizationId || null,
                    organizationName: targetAccount.organizationName || null,
                    activeAccountId: targetAccount.id,
                    updated_at: serverTimestamp()
                };
                
                transaction.update(userRef, updateData);
                
                return {
                    ...userData,
                    ...updateData,
                    updated_at: new Date().toISOString()
                };
            });

            // Clear cache
            this.userCache.delete(validUserId);

            console.log('✅ Account context switched successfully');
            return { success: true, data: result };
            
        } catch (error) {
            console.error('❌ Error switching account context:', error);
            return this.handleFirestoreError(error, 'switch account context');
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
                    
                    // Ensure availableAccounts is always an array
                    userData.availableAccounts = userData.availableAccounts || [];
                    
                    // Normalize field names
                    userData.displayName = userData.displayName || userData.display_name || userData.name;
                    userData.accountType = userData.accountType || userData.account_type || 'individual';
                    
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

            // Validate allowed fields based on security rules (updated for multi-tenancy)
            const allowedFields = [
                'preferences', 
                'contact_info', 
                'profile_picture', 
                'display_name', 
                'account_memberships',
                'accountType',
                'organizationId',
                'organizationName',
                'availableAccounts',
                'activeAccountId'
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