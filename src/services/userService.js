// services/userService.js
import { BaseFirestoreService } from './firestoreService';
import { query, where, getDocs } from 'firebase/firestore';

export class UserService extends BaseFirestoreService {
    /**
     * Create or update user profile - FIXED to align with security rules
     */
    async createOrUpdateUserProfile(userData) {
        const userId = userData.user_id || this.getCurrentUserId();
        if (!userId) {
            console.error('No user ID found for createOrUpdateUserProfile');
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Check if user already exists
            const userDoc = await this.getDocument('users', userId);
            const currentUser = this.getCurrentUser();

            // Determine account type based on organization membership
            let finalAccountType = userData.account_type || userData.accountType || 'individual';
            let userOrganizationId = userData.organizationId || null;
            let userOrganizationName = userData.organizationName || null;

            // Check for existing organization memberships
            if (!userOrganizationId) {
                try {
                    const orgMembershipQuery = query(
                        this.createCollectionRef(`userMemberships/${userId}/organizations`),
                        where('status', '==', 'active')
                    );
                    const orgMembershipSnap = await getDocs(orgMembershipQuery);
                    
                    if (!orgMembershipSnap.empty) {
                        const orgMembership = orgMembershipSnap.docs[0].data();
                        userOrganizationId = orgMembership.org_id;
                        userOrganizationName = orgMembership.org_name;
                        finalAccountType = 'organization';
                    }
                } catch (error) {
                    console.warn('Could not check organization memberships:', error);
                }
            }

            // Parse display name if needed
            const displayName = userData.display_name || userData.displayName || currentUser?.displayName || '';
            const nameParts = displayName.trim().split(' ');
            const firstName = userData.first_name || userData.firstName || nameParts[0] || '';
            const lastName = userData.last_name || userData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

            if (userDoc.success) {
                // Update existing user - ONLY SEND SECURITY RULE ALLOWED FIELDS
                const updateData = this.buildUpdateUserData(userData, {
                    displayName,
                    firstName,
                    lastName,
                    finalAccountType,
                    userOrganizationId,
                    userOrganizationName
                });

                const result = await this.updateDocument('users', userId, updateData);
                if (result.success) {
                    return {
                        success: true,
                        data: {
                            id: userId,
                            ...userDoc.data,
                            ...updateData
                        }
                    };
                }
                return result;

            } else {
                // Create new user profile - ONLY SEND SECURITY RULE ALLOWED FIELDS
                const createData = this.buildCreateUserData(userData, currentUser, {
                    userId,
                    displayName,
                    firstName,
                    lastName,
                    finalAccountType,
                    userOrganizationId,
                    userOrganizationName
                });

                const result = await this.createDocument('users', createData, userId);
                return result;
            }
        } catch (error) {
            console.error('Error in createOrUpdateUserProfile:', error);
            return this.handleFirestoreError(error, 'create/update user profile');
        }
    }

    /**
     * Build create user data - ONLY fields allowed by security rules
     */
    buildCreateUserData(userData, currentUser, computed) {
        const { userId, displayName, firstName, lastName, finalAccountType, userOrganizationId, userOrganizationName } = computed;
        
        // Base data that security rules expect for creation
        const createData = {
            // PRIMARY FIELDS (required by security rules)
            user_id: userId,                    // Your code uses user_id
            email: userData.email || currentUser?.email,
            display_name: displayName,          // Your code uses display_name
            account_type: finalAccountType,     // Your code uses account_type
            
            // ADDITIONAL ALLOWED FIELDS
            first_name: firstName,
            last_name: lastName,
            role: userData.role || (finalAccountType === 'organization' ? 'Admin' : 'member'),
            preferences: userData.preferences || {},
            contact_info: userData.contact_info || {
                email: userData.email || currentUser?.email,
                phone: null
            },
            profile_picture: userData.profile_picture || currentUser?.photoURL || null,
            account_memberships: [],
            registrationCompleted: userData.registrationCompleted !== false,
            emailVerified: currentUser?.emailVerified || false,
            
            // TIMESTAMPS (handled by base service)
            // created_at and updated_at will be added by addCommonFields
        };

        // Add organization data if applicable
        if (userOrganizationId) {
            createData.organizationId = userOrganizationId;
            createData.organizationName = userOrganizationName;
            createData.account_type = 'organization';
            
            if (createData.account_memberships.length === 0) {
                createData.account_memberships = [{
                    organization_id: userOrganizationId,
                    organization_name: userOrganizationName,
                    role: userData.role || 'Admin',
                    status: 'active',
                    joined_at: new Date().toISOString()
                }];
            }
        }

        // Add Google-specific fields if present
        if (userData.google_id) {
            createData.google_id = userData.google_id;
        }

        return createData;
    }

    /**
     * Build update user data - ONLY fields allowed by security rules for updates
     */
    buildUpdateUserData(userData, computed) {
        const { displayName, firstName, lastName, finalAccountType, userOrganizationId, userOrganizationName } = computed;
        
        // Only include fields that are allowed for updates by security rules
        const allowedUpdateFields = [
            'display_name',
            'first_name', 
            'last_name',
            'organizationName',
            'organizationId',
            'preferences',
            'contact_info',
            'profile_picture',
            'account_type',
            'role',
            'account_memberships',
            'registrationCompleted',
            'emailVerified'
        ];

        const updateData = {};
        
        // Only add fields that are in the allowed list and actually provided
        allowedUpdateFields.forEach(field => {
            if (userData.hasOwnProperty(field) && userData[field] !== undefined) {
                updateData[field] = userData[field];
            }
        });

        // Add computed fields
        if (displayName) updateData.display_name = displayName;
        if (firstName) updateData.first_name = firstName;
        if (lastName) updateData.last_name = lastName;
        if (finalAccountType) updateData.account_type = finalAccountType;

        // Ensure organization data is included if user is part of org
        if (userOrganizationId) {
            updateData.organizationId = userOrganizationId;
            updateData.organizationName = userOrganizationName || updateData.organizationName;
            updateData.account_type = 'organization';
            
            // Update account memberships if not already present
            if (!updateData.account_memberships || updateData.account_memberships.length === 0) {
                updateData.account_memberships = [{
                    organization_id: userOrganizationId,
                    organization_name: userOrganizationName,
                    role: userData.role || 'Admin',
                    status: 'active',
                    joined_at: new Date().toISOString()
                }];
            }
        }

        return updateData;
    }

    /**
     * Get user profile with organization data
     */
    async getUserProfile(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            console.error('No user ID found for getUserProfile');
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const result = await this.getDocument('users', targetUserId);
            if (!result.success) {
                console.warn(`User profile not found for userId: ${targetUserId}`);
                return result;
            }

            const userData = result.data;

            // Fetch organization details if user is part of an organization
            if (userData.organizationId) {
                try {
                    const orgDoc = await this.getDocument('organizations', userData.organizationId);
                    if (orgDoc.success) {
                        userData.organization = orgDoc.data;
                    }
                } catch (error) {
                    console.warn('Could not fetch organization details:', error);
                }
            }

            // Fetch subscription details
            try {
                const subscriptionDoc = await this.getDocument('subscriptions', targetUserId);
                if (subscriptionDoc.success) {
                    userData.subscription = subscriptionDoc.data;
                }
            } catch (error) {
                console.warn('Could not fetch subscription details:', error);
            }

            return {
                success: true,
                data: userData
            };
        } catch (error) {
            console.error(`Error fetching user profile for userId: ${targetUserId}`, error);
            return this.handleFirestoreError(error, 'get user profile');
        }
    }

    /**
     * Update user's organization membership - FIXED for security rules
     */
    async updateOrganizationMembership(userId, organizationId, role = 'member') {
        if (!userId || !organizationId) {
            return { success: false, error: { message: 'User ID and Organization ID are required' } };
        }

        try {
            // Build update data with only allowed fields
            const updateData = {
                organizationId: organizationId,
                account_type: 'organization',
                role: role,
                account_memberships: [{
                    organization_id: organizationId,
                    role: role,
                    status: 'active',
                    joined_at: new Date().toISOString()
                }]
            };

            // Update user profile
            const updateResult = await this.updateDocument('users', userId, updateData);

            if (!updateResult.success) {
                return updateResult;
            }

            // Update user membership collection with allowed fields only
            const membershipData = {
                org_id: organizationId,
                user_id: userId,
                role: role,
                status: 'active'
            };

            await this.createDocument(`userMemberships/${userId}/organizations`, membershipData, organizationId);

            return {
                success: true,
                message: 'Organization membership updated successfully'
            };
        } catch (error) {
            console.error('Error updating organization membership:', error);
            return this.handleFirestoreError(error, 'update organization membership');
        }
    }

    /**
     * Check if user has specific role in organization
     */
    async hasOrganizationRole(userId, organizationId, requiredRole) {
        try {
            const userDoc = await this.getUserProfile(userId);
            if (!userDoc.success) return false;

            const userData = userDoc.data;
            if (userData.organizationId !== organizationId) return false;

            const roleHierarchy = {
                'Admin': 3,
                'Manager': 2,
                'member': 1
            };

            const userRoleLevel = roleHierarchy[userData.role] || 0;
            const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

            return userRoleLevel >= requiredRoleLevel;
        } catch (error) {
            console.error('Error checking organization role:', error);
            return false;
        }
    }
}