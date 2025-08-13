import { BaseFirestoreService } from './firestoreService';
import { writeBatch, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export class OrganizationService extends BaseFirestoreService {
    /**
     * Validate user's access to organization
     */
    async validateOrganizationAccess(orgId, requiredRole = 'member') {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error('No authenticated user found for organization access validation');
            return false;
        }

        try {
            // Check if user is owner
            const orgDoc = await this.getDocument('organizations', orgId);
            if (orgDoc.success && (orgDoc.data.ownerId === userId || orgDoc.data.created_by === userId)) {
                return true;
            }

            // Check membership
            const memberDoc = await this.getDocument(`organizations/${orgId}/members`, userId);
            if (!memberDoc.success) {
                console.warn(`User ${userId} is not a member of organization ${orgId}`);
                return false;
            }

            const memberData = memberDoc.data;
            const roleHierarchy = {
                'admin': 3,     // Lowercase for consistency
                'Admin': 3,     // Support both cases
                'manager': 2,
                'Manager': 2,
                'member': 1,
                'Member': 1
            };

            const userRoleLevel = roleHierarchy[memberData.role] || 0;
            const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

            return userRoleLevel >= requiredRoleLevel;
        } catch (error) {
            console.error('Error validating organization access:', error);
            return false;
        }
    }

    /**
     * Create organization with proper user setup and enhanced error handling
     * FIXED: Removed user profile verification that was causing the circular dependency
     */
    async createOrganization(orgData, userId = null) {
        const currentUserId = userId || this.getCurrentUserId();
        if (!currentUserId) {
            return { 
                success: false, 
                error: { message: 'User authentication required to create organization' } 
            };
        }

        if (!orgData.name || !orgData.name.trim()) {
            return { 
                success: false, 
                error: { message: 'Organization name is required' } 
            };
        }

        try {
            console.log('🏢 Starting organization creation process...');
            console.log('📋 Organization data:', { name: orgData.name, industry: orgData.industry, size: orgData.size });

            // Step 1: Check for existing organization name
            console.log('🔍 Checking for existing organization name...');
            try {
                const nameQuery = query(
                    this.createCollectionRef('organizations'),
                    where('name', '==', orgData.name.trim())
                );
                const existingOrgs = await getDocs(nameQuery);

                if (!existingOrgs.empty) {
                    console.error('❌ Organization name already exists');
                    return {
                        success: false,
                        error: { message: 'Organization name already exists. Please choose a different name.' }
                    };
                }
            } catch (error) {
                console.warn('⚠️ Could not check for existing organization names:', error.message);
                // Continue anyway - the unique constraint will catch duplicates
            }

            // Step 2: Create organization with atomic batch transaction
            console.log('💾 Creating organization with atomic transaction...');
            
            const batch = writeBatch(this.db);
            
            // Generate a proper organization ID
            const tempOrgRef = this.createDocRef('organizations', 'temp');
            const orgId = tempOrgRef.id.replace('temp', '') + Date.now().toString(36);
            
            const now = new Date().toISOString();
            const serverTime = serverTimestamp();

            // Organization document with all required fields for security rules
            const organizationData = {
                // Primary fields
                id: orgId,
                name: orgData.name.trim(),
                description: orgData.description || `${orgData.name.trim()} organization`,
                industry: orgData.industry || 'other',
                size: orgData.size || 'small',
                
                // Ownership and permissions - use both formats for compatibility
                ownerId: currentUserId,        // For business logic
                created_by: currentUserId,     // For security rules
                owner_id: currentUserId,       // Alternative format
                
                // Member management
                memberCount: 1,
                
                // Settings
                settings: {
                    isPublic: false,
                    allowMemberInvites: true,
                    requireApproval: false,
                    allowPublicJoin: false,
                    requireEmailVerification: true,
                    defaultRole: 'member',
                    ...orgData.settings
                },
                
                // Timestamps - provide both formats
                created_at: now,
                updated_at: now,
                createdAt: serverTime,    // Firestore server timestamp
                updatedAt: serverTime,    // Firestore server timestamp
                
                // Status and metadata
                status: 'active',
                type: 'organization'
            };

            console.log('📄 Organization document to create:', {
                id: organizationData.id,
                name: organizationData.name,
                created_by: organizationData.created_by,
                ownerId: organizationData.ownerId
            });

            // Add organization document to batch
            batch.set(
                this.createDocRef('organizations', orgId),
                organizationData
            );

            // Member document with consistent field naming
            const memberData = {
                // User identification - multiple formats for compatibility
                user_id: currentUserId,
                userId: currentUserId,
                uid: currentUserId,
                
                // User details - we'll get these from the user after creation
                email: null, // Will be populated after user creation
                display_name: null, // Will be populated after user creation
                first_name: null, // Will be populated after user creation
                last_name: null, // Will be populated after user creation
                
                // Role and permissions - use consistent lowercase
                role: 'admin',
                status: 'active',
                permissions: ['all'],
                
                // Timestamps
                joined_at: now,
                joinedAt: serverTime,
                created_at: now,
                updated_at: now,
                
                // Metadata
                addedBy: currentUserId,
                isOwner: true
            };

            console.log('👥 Member document to create:', {
                user_id: memberData.user_id,
                role: memberData.role,
                status: memberData.status
            });

            // Add member document to batch
            batch.set(
                this.createDocRef(`organizations/${orgId}/members`, currentUserId),
                memberData
            );

            // Step 3: Commit the batch transaction
            console.log('🚀 Committing batch transaction...');
            await batch.commit();

            console.log(`✅ Organization "${orgData.name}" created successfully with ID: ${orgId}`);

            return {
                success: true,
                data: {
                    id: orgId,
                    ...organizationData,
                    // Replace server timestamps with actual dates for response
                    createdAt: now,
                    updatedAt: now
                }
            };

        } catch (error) {
            console.error('❌ Organization creation failed:', {
                error: error.message,
                code: error.code,
                details: error.details || 'No additional details'
            });

            // Enhanced error handling with specific messages
            let errorMessage = 'Failed to create organization. Please try again.';
            let errorCode = 'creation-failed';

            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied: Your account does not have the required permissions to create organizations. Please ensure you have an organization account type.';
                errorCode = 'permission-denied';
            } else if (error.code === 'failed-precondition') {
                errorMessage = 'Failed precondition: Please ensure your user profile is properly set up with organization account type.';
                errorCode = 'failed-precondition';
            } else if (error.code === 'not-found') {
                errorMessage = 'User profile not found. Please complete your registration first.';
                errorCode = 'user-not-found';
            } else if (error.code === 'already-exists') {
                errorMessage = 'Organization name already exists. Please choose a different name.';
                errorCode = 'name-exists';
            } else if (error.code === 'invalid-argument') {
                errorMessage = 'Invalid organization data provided. Please check all required fields.';
                errorCode = 'invalid-data';
            }

            return {
                success: false,
                error: {
                    message: errorMessage,
                    code: errorCode,
                    details: error.message,
                    originalError: error.code
                }
            };
        }
    }

    // [Rest of the methods remain unchanged...]
    /**
     * Get organization with member details
     */
    async getOrganization(orgId) {
        try {
            const orgDoc = await this.getDocument('organizations', orgId);
            if (!orgDoc.success) {
                return orgDoc;
            }

            // Get member count from members subcollection
            const membersQuery = query(
                this.createCollectionRef(`organizations/${orgId}/members`),
                where('status', '==', 'active')
            );
            const membersSnapshot = await getDocs(membersQuery);
            const actualMemberCount = membersSnapshot.size;

            return {
                success: true,
                data: {
                    ...orgDoc.data,
                    memberCount: actualMemberCount
                }
            };
        } catch (error) {
            console.error('Error getting organization:', error);
            return {
                success: false,
                error: { message: 'Failed to get organization' }
            };
        }
    }

    /**
     * Update organization
     */
    async updateOrganization(orgId, updateData) {
        const hasAccess = await this.validateOrganizationAccess(orgId, 'admin');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Insufficient permissions to update organization' }
            };
        }

        try {
            const data = {
                ...updateData,
                updated_at: new Date().toISOString(),
                updatedAt: serverTimestamp()
            };

            // Remove fields that shouldn't be updated directly
            delete data.id;
            delete data.ownerId;
            delete data.created_by;
            delete data.createdAt;
            delete data.created_at;
            delete data.memberCount;

            const result = await this.updateDocument('organizations', orgId, data);

            if (result.success) {
                console.log(`✅ Organization ${orgId} updated successfully`);
            }

            return result;
        } catch (error) {
            console.error('Error updating organization:', error);
            return {
                success: false,
                error: { message: 'Failed to update organization' }
            };
        }
    }

    /**
     * Delete organization (owner only)
     */
    async deleteOrganization(orgId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            // Verify user is the owner
            const orgDoc = await this.getDocument('organizations', orgId);
            if (!orgDoc.success) {
                return { success: false, error: { message: 'Organization not found' } };
            }

            const isOwner = orgDoc.data.ownerId === userId || orgDoc.data.created_by === userId;
            if (!isOwner) {
                return {
                    success: false,
                    error: { message: 'Only the organization owner can delete the organization' }
                };
            }

            const batch = writeBatch(this.db);

            // Get all members to update their user documents
            const membersSnapshot = await getDocs(
                this.createCollectionRef(`organizations/${orgId}/members`)
            );

            // Update each member's user document to remove organization reference
            membersSnapshot.docs.forEach(memberDoc => {
                const memberId = memberDoc.id;
                batch.update(
                    this.createDocRef('users', memberId),
                    {
                        [`organizations.${orgId}`]: null,
                        organizationId: null,
                        organizationName: null,
                        organizationRole: null,
                        updated_at: new Date().toISOString(),
                        updatedAt: serverTimestamp()
                    }
                );

                // Delete member document
                batch.delete(memberDoc.ref);
            });

            // Delete the organization document
            batch.delete(this.createDocRef('organizations', orgId));

            await batch.commit();

            console.log(`✅ Organization ${orgId} deleted successfully`);
            return { success: true };

        } catch (error) {
            console.error('Error deleting organization:', error);
            return {
                success: false,
                error: { message: 'Failed to delete organization' }
            };
        }
    }

    /**
     * Get user's organizations
     */
    async getUserOrganizations(userId = null) {
        const currentUserId = userId || this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        try {
            const userDoc = await this.getDocument('users', currentUserId);
            if (!userDoc.success) {
                return { success: false, error: { message: 'User not found' } };
            }

            const organizations = userDoc.data.organizations || {};
            const orgIds = Object.keys(organizations);

            if (orgIds.length === 0) {
                return { success: true, data: [] };
            }

            // Fetch organization details
            const orgPromises = orgIds.map(async (orgId) => {
                const orgDoc = await this.getDocument('organizations', orgId);
                if (orgDoc.success) {
                    return {
                        ...orgDoc.data,
                        userRole: organizations[orgId].role,
                        userStatus: organizations[orgId].status
                    };
                }
                return null;
            });

            const orgResults = await Promise.all(orgPromises);
            const validOrgs = orgResults.filter(org => org !== null);

            return { success: true, data: validOrgs };

        } catch (error) {
            console.error('Error getting user organizations:', error);
            return {
                success: false,
                error: { message: 'Failed to get user organizations' }
            };
        }
    }
}