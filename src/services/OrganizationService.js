import { FirestoreService } from './firestoreService';
import { writeBatch, serverTimestamp, doc } from 'firebase/firestore';

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
            
            // FIXED: Generate orgId properly using collection reference
            const orgCollectionRef = this.createCollectionRef('organizations');
            const orgRef = doc(orgCollectionRef); // This generates a new document reference with auto-ID
            const orgId = orgRef.id;
            
            // FIXED: Create organization data with proper structure
            const organizationData = this.addCommonFields({
                name: orgData.name,
                description: orgData.description || '',
                industry: orgData.industry || 'technology', // FIXED: Add industry field
                ownerId: userId,
                settings: orgData.settings || {},
                ...(orgData.customDomain && { customDomain: orgData.customDomain })
            });

            batch.set(orgRef, organizationData);

            // FIXED: Create member document with proper path
            const memberRef = this.createDocRef('organizations', orgId, 'members', userId);
            const memberData = this.addCommonFields({
                user_id: userId,
                role: 'Admin',
                status: 'active',
                joined_at: serverTimestamp()
            });
            batch.set(memberRef, memberData);

            // FIXED: Create user membership document with proper path
            const userMembershipRef = this.createDocRef('userMemberships', userId);
            
            // Get existing memberships or create new structure
            const existingMemberships = await this.getDocument('userMemberships', userId);
            const currentOrganizations = existingMemberships.success ? 
                (existingMemberships.data.organizations || []) : [];

            const userMembershipData = this.addCommonFields({
                user_id: userId,
                organizations: [
                    ...currentOrganizations,
                    {
                        organizationId: orgId,
                        role: 'Admin',
                        status: 'active',
                        joinedAt: new Date().toISOString()
                    }
                ]
            }, existingMemberships.success); // true if updating, false if creating

            if (existingMemberships.success) {
                batch.update(userMembershipRef, userMembershipData);
            } else {
                batch.set(userMembershipRef, userMembershipData);
            }

            // FIXED: Update user profile to organization account type
            const userRef = this.createDocRef('users', userId);
            const userUpdateData = this.addCommonFields({ 
                account_type: 'organization',
                organizationId: orgId,
                organizationName: orgData.name
            }, true);
            batch.update(userRef, userUpdateData);

            await batch.commit();

            console.log('✅ Organization created successfully:', {
                id: orgId,
                name: orgData.name,
                industry: orgData.industry
            });

            return {
                success: true,
                data: {
                    id: orgId,
                    ...organizationData,
                    memberRole: 'Admin'
                }
            };
        } catch (error) {
            console.error('❌ Error in createOrganization:', error);
            return this.handleFirestoreError(error, 'create organization');
        }
    }

    // FIXED: Add missing methods that might be called
    async getOrganization(orgId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateOrganizationAccess(orgId, 'member');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to access this organization' } };
        }

        return await this.getDocument('organizations', orgId);
    }

    async updateOrganization(orgId, updates) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateOrganizationAccess(orgId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to update this organization' } };
        }

        return await this.updateDocument('organizations', orgId, updates);
    }

    async deleteOrganization(orgId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.validateOrganizationAccess(orgId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete this organization' } };
        }

        try {
            // This would need more complex logic to clean up organization data
            // For now, just delete the organization document
            return await this.deleteDocument('organizations', orgId);
        } catch (error) {
            return this.handleFirestoreError(error, 'delete organization');
        }
    }

    // Add other organization-related methods as needed
    async getOrganizationMembers(orgId) {
        const hasAccess = await this.validateOrganizationAccess(orgId, 'member');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to view organization members' } };
        }

        return await this.queryDocuments(`organizations/${orgId}/members`);
    }

    // Add placeholder methods for reports functionality
    async getReports(orgId) {
        try {
            const collectionPath = `organizations/${orgId}/reports`;
            return await this.queryDocuments(collectionPath, [], 'created_at', 100);
        } catch (error) {
            return this.handleFirestoreError(error, 'get reports');
        }
    }

    async saveReport(reportData) {
        try {
            const collectionPath = `organizations/${reportData.organizationId}/reports`;
            return await this.createDocument(collectionPath, reportData);
        } catch (error) {
            return this.handleFirestoreError(error, 'save report');
        }
    }

    async deleteReport(reportId) {
        try {
            const userId = this.getCurrentUserId();
            const userProfile = await this.getDocument('users', userId);
            if (!userProfile.success) {
                return { success: false, error: { message: 'User profile not found' } };
            }

            const orgId = userProfile.data.organizationId;
            if (!orgId) {
                return { success: false, error: { message: 'No organization context found' } };
            }

            const collectionPath = `organizations/${orgId}/reports`;
            return await this.deleteDocument(collectionPath, reportId);
        } catch (error) {
            return this.handleFirestoreError(error, 'delete report');
        }
    }

    async toggleSchedule({ organizationId, enabled }) {
        try {
            return await this.updateDocument(`organizations/${organizationId}/settings`, 'reportSchedule', { enabled });
        } catch (error) {
            return this.handleFirestoreError(error, 'toggle schedule');
        }
    }

    subscribeToTriggers(orgId, callback) {
        try {
            const collectionPath = `organizations/${orgId}/triggers`;
            return this.subscribeToCollection(collectionPath, [], callback);
        } catch (error) {
            console.error('Error subscribing to triggers:', error);
            return () => {};
        }
    }

    async generatePDF(report) {
        try {
            // Placeholder for PDF generation logic
            return { success: true, data: { url: `/pdf/${report.id}` } };
        } catch (error) {
            return this.handleFirestoreError(error, 'generate PDF');
        }
    }
}