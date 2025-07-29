import { FirestoreService } from './firestoreService';
import { query, where, getDocs } from 'firebase/firestore';

export class UserService extends FirestoreService {
    async createOrUpdateUserProfile(userData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error('No authenticated user found for createOrUpdateUserProfile');
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const userDoc = await this.getDocument('users', userId);
            const currentUser = this.getCurrentUser();

            const orgMembershipQuery = query(
                this.createCollectionRef(`userMemberships/${userId}/organizations`),
                where('status', '==', 'active')
            );
            const orgMembershipSnap = await getDocs(orgMembershipQuery);
            const isOrgMember = !orgMembershipSnap.empty;

            let userOrganizationId = null;
            if (isOrgMember) {
                const orgMembershipDoc = orgMembershipSnap.docs[0];
                userOrganizationId = orgMembershipDoc.data().org_id;
            }

            let finalAccountType = userData.account_type || 'individual';
            if (isOrgMember || userData.account_type === 'organization') {
                finalAccountType = 'organization';
            }

            if (userDoc.success) {
                const allowedFields = [
                    'preferences', 'contact_info', 'profile_picture', 'display_name',
                    'first_name', 'last_name', 'account_memberships', 'account_type',
                    'organizationId', 'organizationName'
                ];

                const filteredData = {};
                allowedFields.forEach(field => {
                    if (userData.hasOwnProperty(field)) {
                        filteredData[field] = userData[field];
                    }
                });

                filteredData.account_type = finalAccountType;
                if (userOrganizationId) {
                    filteredData.organizationId = userOrganizationId;
                    try {
                        const orgDoc = await this.getDocument('organizations', userOrganizationId);
                        if (orgDoc.success) {
                            filteredData.organizationName = orgDoc.data.name;
                        }
                    } catch (error) {
                        console.warn('Could not fetch organization name:', error);
                    }
                }

                const result = await this.updateDocument('users', userId, filteredData);
                if (result.success) {
                    const existingData = userDoc.data;
                    const finalData = {
                        user_id: userId,
                        email: currentUser?.email,
                        ...existingData,
                        ...filteredData
                    };
                    return { success: true, data: { id: userId, ...finalData } };
                }
                return result;
            } else {
                const displayName = userData.display_name || currentUser?.displayName || '';
                const nameParts = displayName.trim().split(' ');
                const firstName = userData.first_name || nameParts[0] || '';
                const lastName = userData.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

                const createData = {
                    user_id: userId,
                    email: currentUser?.email,
                    display_name: displayName,
                    first_name: firstName,
                    last_name: lastName,
                    account_type: finalAccountType,
                    organizationId: userOrganizationId,
                    organizationName: null,
                    preferences: userData.preferences || {},
                    contact_info: userData.contact_info || {
                        email: currentUser?.email,
                        phone: null
                    },
                    profile_picture: userData.profile_picture || currentUser?.photoURL || null,
                    account_memberships: userData.account_memberships || []
                };

                if (userOrganizationId) {
                    try {
                        const orgDoc = await this.getDocument('organizations', userOrganizationId);
                        if (orgDoc.success) {
                            createData.organizationName = orgDoc.data.name;
                        }
                    } catch (error) {
                        console.warn('Could not fetch organization name during user creation:', error);
                    }
                }

                const result = await this.createDocument('users', createData, userId);
                return result;
            }
        } catch (error) {
            console.error('Error in createOrUpdateUserProfile:', error);
            return this.handleFirestoreError(error, 'create/update user profile');
        }
    }

    async getUserProfile(userId = null) {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) {
            console.error('No authenticated user found for getUserProfile');
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const result = await this.getDocument('users', targetUserId);
            if (!result.success) {
                console.warn(`User profile not found for userId: ${targetUserId}`);
                return result;
            }
            return result;
        } catch (error) {
            console.error(`Error fetching user profile for userId: ${targetUserId}`, error);
            return this.handleFirestoreError(error, 'get user profile');
        }
    }
}