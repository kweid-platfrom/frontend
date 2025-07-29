import { FirestoreService } from './firestoreService';
import { writeBatch, serverTimestamp } from 'firebase/firestore';

export class OrganizationService extends FirestoreService {
    async validateOrganizationAccess(orgId, requiredRole = 'member') {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error('No authenticated user found for organization access validation');
            return false;
        }

        try {
            const orgDoc = await this.getDocument('organizations', orgId);
            if (orgDoc.success && orgDoc.data.ownerId === userId) {
                return true;
            }

            const memberDoc = await this.getDocument(`organizations/${orgId}/members`, userId);
            if (memberDoc.success) {
                const memberData = memberDoc.data;
                if (requiredRole === 'member') return true;
                if (requiredRole === 'admin' && memberData.role === 'Admin') return true;
            }

            console.warn(`User ${userId} lacks access to organization ${orgId}`);
            return false;
        } catch (error) {
            console.error('Error validating organization access:', error);
            return false;
        }
    }

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
            const orgId = orgData.orgId || this.createDocRef('organizations', 'temp').id;
            
            const orgRef = this.createDocRef('organizations', orgId);
            const organizationData = this.addCommonFields({
                name: orgData.name,
                description: orgData.description || '',
                ownerId: userId,
                settings: orgData.settings || {},
                ...(orgData.customDomain && { customDomain: orgData.customDomain })
            });

            batch.set(orgRef, organizationData);

            const memberRef = this.createDocRef('organizations', orgId, 'members', userId);
            const memberData = this.addCommonFields({
                user_id: userId,
                role: 'Admin',
                status: 'active',
                joined_at: serverTimestamp()
            });
            batch.set(memberRef, memberData);

            const userMembershipRef = this.createDocRef('userMemberships', userId, 'organizations', orgId);
            const userMembershipData = this.addCommonFields({
                user_id: userId,
                role: 'Admin',
                org_id: orgId,
                status: 'active'
            });
            batch.set(userMembershipRef, userMembershipData);

            const userRef = this.createDocRef('users', userId);
            const userUpdateData = this.addCommonFields({ account_type: 'organization' }, true);
            batch.update(userRef, userUpdateData);

            await batch.commit();

            return {
                success: true,
                data: {
                    id: orgId,
                    ...organizationData,
                    memberRole: 'Admin'
                }
            };
        } catch (error) {
            console.error('Error in createOrganization:', error);
            return this.handleFirestoreError(error, 'create organization');
        }
    }
}