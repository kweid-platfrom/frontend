// services/OrganizationService.js - ALIGNED WITH SECURITY RULES
import { BaseFirestoreService } from './firestoreService';
import { serverTimestamp, query, where, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export class OrganizationService extends BaseFirestoreService {
    /**
     * Validate user's access to organization - ALIGNED WITH SECURITY RULES
     */
    async validateOrganizationAccess(orgId, requiredRole = 'member') {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error('No authenticated user found for organization access validation');
            return false;
        }

        try {
            // Check if user is owner - MATCHES isOrgOwner() function
            const orgDoc = await this.getDocument('organizations', orgId);
            if (orgDoc.success && (orgDoc.data.ownerId === userId || orgDoc.data.created_by === userId)) {
                return true;
            }

            // Check membership - MATCHES isOrgMember() and role functions
            const memberDoc = await this.getDocument(`organizations/${orgId}/members`, userId);
            if (!memberDoc.success) {
                console.warn(`User ${userId} is not a member of organization ${orgId}`);
                return false;
            }

            const memberData = memberDoc.data;
            const roleHierarchy = {
                'owner': 4,     // Highest level
                'admin': 3,     // MATCHES security rules role check
                'manager': 2,   // MATCHES security rules role check  
                'member': 1     // MATCHES security rules role check
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
     * Create organization with proper validation - FULLY ALIGNED WITH SECURITY RULES
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

        // Validate name length - MATCHES security rules validation
        const orgName = orgData.name.trim();
        if (orgName.length < 2 || orgName.length > 100) {
            return {
                success: false,
                error: { message: 'Organization name must be between 2 and 100 characters' }
            };
        }

        try {
            console.log('🏢 Starting organization creation process...');

            // Step 1: Validate user can create organization - MATCHES isValidOrgCreation()
            console.log('🔍 Validating user eligibility...');
            const userDoc = await getDoc(this.createDocRef('users', currentUserId));
            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User profile not found. Please complete registration first.' }
                };
            }

            const userData = userDoc.data();
            
            // Check if user already belongs to organization - MATCHES userBelongsToOrganization()
            if (userData.organizationId || (userData.organizations && userData.organizations.length > 0)) {
                return {
                    success: false,
                    error: { message: 'User already belongs to an organization. Each user can only be part of one organization.' }
                };
            }

            // Check if user has correct account type for new registration OR individual upgrade
            if (userData.account_type === 'organization') {
                return {
                    success: false,
                    error: { message: 'Organization account already exists for this user.' }
                };
            }

            // Step 2: Check for existing organization name
            console.log('🔍 Checking for existing organization name...');
            try {
                const nameQuery = query(
                    this.createCollectionRef('organizations'),
                    where('name', '==', orgName)
                );
                const existingOrgs = await getDocs(nameQuery);

                if (!existingOrgs.empty) {
                    return {
                        success: false,
                        error: { message: 'Organization name already exists. Please choose a different name.' }
                    };
                }
            } catch (error) {
                console.warn('⚠️ Could not check for existing organization names:', error.message);
            }

            // Step 3: Check for existing organization with same ID - MATCHES hasNoDuplicateOrg
            const orgId = currentUserId; // Use userId as orgId per security rules expectation
            const existingOrgDoc = await getDoc(this.createDocRef('organizations', orgId));
            if (existingOrgDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'Organization already exists for this user.' }
                };
            }

            console.log('✅ User validation passed. Creating organization...');

            const timestamp = serverTimestamp();
            const now = new Date().toISOString();

            // Step 4: Create organization document - EXACTLY MATCHES isValidOrgCreation()
            const organizationData = {
                // REQUIRED fields by isValidOrgCreation()
                name: orgName,                    // Required - hasAll(['name', 'ownerId'])
                ownerId: currentUserId,           // Required - data.ownerId == getUserId()
                created_by: currentUserId,        // Required - data.created_by == getUserId() OR null

                // Additional organization fields
                id: orgId,
                description: orgData.description || `${orgName} organization`,
                industry: orgData.industry || 'other',
                size: orgData.size || 'small',
                memberCount: 1,
                
                // Settings
                settings: {
                    allowPublicJoin: false,
                    requireEmailVerification: true,
                    defaultRole: 'member',
                    isPublic: false,
                    allowMemberInvites: true,
                    requireApproval: false,
                    ...orgData.settings
                },
                
                // Status and timestamps
                status: 'active',
                type: 'organization',
                created_at: timestamp,
                updated_at: timestamp,
                updated_by: currentUserId
            };

            console.log('📄 Creating organization document...');
            await setDoc(this.createDocRef('organizations', orgId), organizationData);
            console.log('✅ Organization document created');

            // Step 5: Create organization member entry - MATCHES security rules for member creation
            console.log('👥 Creating organization member entry...');
            const memberData = {
                // REQUIRED by security rules
                user_id: currentUserId,           // Required - request.resource.data.user_id == memberId
                role: 'owner',                   // Required - role in ['admin', 'manager', 'member', 'owner']
                added_at: timestamp,             // Required - request.resource.data.added_at == request.time
                added_by: currentUserId,         // Required for org creation case

                // User details - populate from userData
                email: userData.email,
                display_name: userData.display_name,
                first_name: userData.first_name,
                last_name: userData.last_name,
                
                // Additional member fields
                status: 'active',
                permissions: ['all'],
                joined_at: timestamp,
                created_at: timestamp,
                updated_at: timestamp,
                isOwner: true
            };

            await setDoc(this.createDocRef(`organizations/${orgId}/members`, currentUserId), memberData);
            console.log('✅ Organization member entry created');

            // Step 6: Update user profile - MATCHES security rules for org creation update
            console.log('🔄 Updating user profile...');
            
            // For individual -> organization upgrade, we need to update account_type and organizationId
            const userUpdateData = {
                // MATCHES Case 3: Individual to Organization upgrade OR Case 2: Organization creation
                account_type: 'organization',     // individual -> organization upgrade allowed
                organizationId: orgId,           // Setting organizationId (was null before)
                updated_at: timestamp,           // Required field
                
                // Additional fields allowed by onlyUpdatingAllowedUserFields()
                organizationName: orgName,
                role: 'admin',
                account_memberships: [{
                    organization_id: orgId,
                    organization_name: orgName,
                    role: 'admin', 
                    status: 'active',
                    joined_at: now
                }],
                organizations: [orgId] // For security rules compatibility
            };

            await updateDoc(this.createDocRef('users', currentUserId), userUpdateData);
            console.log('✅ User profile updated');

            // Step 7: Create user membership reference
            console.log('📋 Creating user membership reference...');
            const userMembershipData = {
                org_id: orgId,
                org_name: orgName,
                user_id: currentUserId,
                role: 'admin',
                status: 'active',
                joined_at: timestamp,
                created_at: timestamp,
                updated_at: timestamp
            };

            await setDoc(
                this.createDocRef(`userMemberships/${currentUserId}/organizations`, orgId),
                userMembershipData
            );
            console.log('✅ User membership reference created');

            // Step 8: Update subscription for organization features
            console.log('💳 Updating subscription...');
            try {
                await updateDoc(this.createDocRef('subscriptions', currentUserId), {
                    organization_id: orgId,
                    'features.maxSuites': 10,
                    'features.maxTestCasesPerSuite': 100,
                    'features.canInviteTeam': true,
                    'features.canCreateOrganizations': true,
                    'features.advancedAnalytics': true,
                    'features.maxTeamMembers': 10,
                    updated_at: timestamp
                });
                console.log('✅ Subscription updated');
            } catch (error) {
                console.warn('⚠️ Could not update subscription:', error.message);
            }

            console.log(`🎉 Organization "${orgName}" created successfully with ID: ${orgId}`);

            return {
                success: true,
                data: {
                    id: orgId,
                    ...organizationData,
                    // Replace server timestamps for response
                    created_at: now,
                    updated_at: now
                }
            };

        } catch (error) {
            console.error('❌ Organization creation failed:', error);

            // Enhanced error handling with specific messages
            let errorMessage = 'Failed to create organization. Please try again.';
            let errorCode = 'creation-failed';

            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied: Your account may not have the required permissions. Please ensure you have completed registration properly.';
                errorCode = 'permission-denied';
            } else if (error.code === 'failed-precondition') {
                errorMessage = 'Failed precondition: Please ensure your user profile is properly set up.';
                errorCode = 'failed-precondition';
            } else if (error.code === 'not-found') {
                errorMessage = 'User profile not found. Please complete your registration first.';
                errorCode = 'user-not-found';
            } else if (error.code === 'already-exists') {
                errorMessage = 'Organization already exists. Please choose a different name.';
                errorCode = 'name-exists';
            }

            return {
                success: false,
                error: {
                    message: errorMessage,
                    code: errorCode,
                    details: error.message
                }
            };
        }
    }

    /**
     * Get organization with member details - RESPECTS SECURITY RULES
     */
    async getOrganization(orgId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        try {
            // Security check - MATCHES organization read rules
            const hasAccess = await this.validateOrganizationAccess(orgId, 'member');
            if (!hasAccess) {
                return { 
                    success: false, 
                    error: { message: 'Access denied. You are not a member of this organization.' } 
                };
            }

            const orgDoc = await this.getDocument('organizations', orgId);
            if (!orgDoc.success) {
                return orgDoc;
            }

            // Get active member count from members subcollection
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
                error: { message: 'Failed to get organization details' }
            };
        }
    }

    /**
     * Update organization - MATCHES security rules restrictions
     */
    async updateOrganization(orgId, updateData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        // Validate access - MATCHES isOrgAdmin() requirement
        const hasAccess = await this.validateOrganizationAccess(orgId, 'admin');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Insufficient permissions. Only organization admins can update organization details.' }
            };
        }

        try {
            const timestamp = serverTimestamp();
            
            // Create update data - MATCHES onlyUpdatingAllowedOrgFields()
            const allowedFields = {
                // ALLOWED fields from security rules
                name: updateData.name,
                industry: updateData.industry,
                description: updateData.description,
                settings: updateData.settings,
                
                // REQUIRED fields
                updated_at: timestamp,
                updated_by: userId
            };

            // Remove undefined values and restricted fields
            const cleanUpdateData = {};
            Object.keys(allowedFields).forEach(key => {
                if (allowedFields[key] !== undefined) {
                    cleanUpdateData[key] = allowedFields[key];
                }
            });

            // Validate name length if being updated - MATCHES security rules validation
            if (cleanUpdateData.name) {
                const nameLength = cleanUpdateData.name.trim().length;
                if (nameLength < 2 || nameLength > 100) {
                    return {
                        success: false,
                        error: { message: 'Organization name must be between 2 and 100 characters' }
                    };
                }
                cleanUpdateData.name = cleanUpdateData.name.trim();
            }

            const result = await this.updateDocument('organizations', orgId, cleanUpdateData);

            if (result.success) {
                console.log(`✅ Organization ${orgId} updated successfully`);
                
                // Update organizationName in user profiles if name changed
                if (cleanUpdateData.name) {
                    await this.updateMemberOrganizationName(orgId, cleanUpdateData.name);
                }
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
     * Update organization name in all member profiles
     */
    async updateMemberOrganizationName(orgId, newName) {
        try {
            const membersSnapshot = await getDocs(
                this.createCollectionRef(`organizations/${orgId}/members`)
            );

            const updatePromises = membersSnapshot.docs.map(async (memberDoc) => {
                const memberId = memberDoc.id;
                try {
                    await updateDoc(this.createDocRef('users', memberId), {
                        organizationName: newName,
                        updated_at: serverTimestamp()
                    });
                } catch (error) {
                    console.warn(`Could not update organizationName for user ${memberId}:`, error);
                }
            });

            await Promise.all(updatePromises);
            console.log('✅ Updated organization name in member profiles');
        } catch (error) {
            console.error('Error updating member organization names:', error);
        }
    }

    /**
     * Delete organization - OWNER ONLY, MATCHES SECURITY RULES
     */
    async deleteOrganization(orgId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        try {
            // Verify user is the owner - MATCHES isOrgOwner() check
            const orgDoc = await this.getDocument('organizations', orgId);
            if (!orgDoc.success) {
                return { success: false, error: { message: 'Organization not found' } };
            }

            const isOwner = orgDoc.data.ownerId === userId || orgDoc.data.created_by === userId;
            if (!isOwner) {
                return {
                    success: false,
                    error: { message: 'Access denied. Only the organization owner can delete the organization.' }
                };
            }

            console.log(`🗑️ Deleting organization ${orgId}...`);

            // Get all members to update their user documents
            const membersSnapshot = await getDocs(
                this.createCollectionRef(`organizations/${orgId}/members`)
            );

            // Update each member's user document to remove organization reference
            const memberUpdatePromises = membersSnapshot.docs.map(async (memberDoc) => {
                const memberId = memberDoc.id;
                try {
                    await updateDoc(this.createDocRef('users', memberId), {
                        account_type: 'individual',  // Revert to individual account
                        organizationId: null,
                        organizationName: null,
                        role: 'member',
                        organizations: [],
                        account_memberships: [],
                        updated_at: serverTimestamp()
                    });

                    // Delete member document
                    await deleteDoc(memberDoc.ref);
                    
                    // Delete user membership reference
                    try {
                        await deleteDoc(this.createDocRef(`userMemberships/${memberId}/organizations`, orgId));
                    } catch (error) {
                        console.warn(`Could not delete membership reference for user ${memberId}:`, error);
                    }
                } catch (error) {
                    console.error(`Error updating user ${memberId} during org deletion:`, error);
                }
            });

            await Promise.all(memberUpdatePromises);

            // Delete the organization document
            await deleteDoc(this.createDocRef('organizations', orgId));

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
     * Get user's organizations - RESPECTS SECURITY RULES
     */
    async getUserOrganizations(userId = null) {
        const currentUserId = userId || this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        try {
            const userDoc = await this.getDocument('users', currentUserId);
            if (!userDoc.success) {
                return { success: false, error: { message: 'User not found' } };
            }

            const userData = userDoc.data;
            
            // Handle single organization (current structure)
            if (userData.organizationId) {
                const orgDoc = await this.getDocument('organizations', userData.organizationId);
                if (orgDoc.success) {
                    // Get user's role in this organization
                    const memberDoc = await this.getDocument(
                        `organizations/${userData.organizationId}/members`, 
                        currentUserId
                    );
                    
                    return {
                        success: true,
                        data: [{
                            ...orgDoc.data,
                            userRole: memberDoc.success ? memberDoc.data.role : 'member',
                            userStatus: memberDoc.success ? memberDoc.data.status : 'unknown'
                        }]
                    };
                }
            }

            // Handle multiple organizations (legacy support)
            const organizations = userData.organizations || [];
            if (organizations.length === 0) {
                return { success: true, data: [] };
            }

            const orgPromises = organizations.map(async (orgId) => {
                try {
                    const orgDoc = await this.getDocument('organizations', orgId);
                    if (orgDoc.success) {
                        const memberDoc = await this.getDocument(
                            `organizations/${orgId}/members`, 
                            currentUserId
                        );
                        
                        return {
                            ...orgDoc.data,
                            userRole: memberDoc.success ? memberDoc.data.role : 'member',
                            userStatus: memberDoc.success ? memberDoc.data.status : 'unknown'
                        };
                    }
                } catch (error) {
                    console.warn(`Could not fetch organization ${orgId}:`, error);
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

    /**
     * Add member to organization - RESPECTS SECURITY RULES
     */
    async addOrganizationMember(orgId, memberData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        // Validate admin access - MATCHES isOrgAdmin() requirement
        const hasAccess = await this.validateOrganizationAccess(orgId, 'admin');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Insufficient permissions. Only organization admins can add members.' }
            };
        }

        const { userId: newMemberId, role = 'member', email } = memberData;

        if (!newMemberId || !email) {
            return {
                success: false,
                error: { message: 'User ID and email are required' }
            };
        }

        try {
            const timestamp = serverTimestamp();

            // Check if member already exists
            const existingMemberDoc = await getDoc(
                this.createDocRef(`organizations/${orgId}/members`, newMemberId)
            );

            if (existingMemberDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User is already a member of this organization' }
                };
            }

            // Create member document - MATCHES security rules for member creation
            const newMemberData = {
                // REQUIRED by security rules
                user_id: newMemberId,           // Required field
                role: role,                     // Must be in allowed roles
                added_at: timestamp,            // Required field  
                added_by: userId,               // Required field

                // Additional member information
                email: email,
                display_name: memberData.displayName || null,
                first_name: memberData.firstName || null,
                last_name: memberData.lastName || null,
                status: 'active',
                permissions: role === 'admin' ? ['all'] : ['read', 'write'],
                joined_at: timestamp,
                created_at: timestamp,
                updated_at: timestamp
            };

            await setDoc(
                this.createDocRef(`organizations/${orgId}/members`, newMemberId),
                newMemberData
            );

            // Update organization member count
            const orgDoc = await this.getDocument('organizations', orgId);
            if (orgDoc.success) {
                await updateDoc(this.createDocRef('organizations', orgId), {
                    memberCount: (orgDoc.data.memberCount || 0) + 1,
                    updated_at: timestamp
                });
            }

            console.log(`✅ Member ${newMemberId} added to organization ${orgId}`);

            return {
                success: true,
                data: { 
                    memberId: newMemberId,
                    role: role,
                    status: 'active'
                }
            };

        } catch (error) {
            console.error('Error adding organization member:', error);
            return {
                success: false,
                error: { message: 'Failed to add organization member' }
            };
        }
    }

    /**
     * Remove member from organization - RESPECTS SECURITY RULES
     */
    async removeOrganizationMember(orgId, memberId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        // Validate admin access - MATCHES isOrgAdmin() requirement
        const hasAccess = await this.validateOrganizationAccess(orgId, 'admin');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Insufficient permissions. Only organization admins can remove members.' }
            };
        }

        try {
            // Prevent owner from removing themselves
            const orgDoc = await this.getDocument('organizations', orgId);
            if (orgDoc.success && (orgDoc.data.ownerId === memberId || orgDoc.data.created_by === memberId) && memberId === userId) {
                return {
                    success: false,
                    error: { message: 'Organization owner cannot remove themselves. Transfer ownership first or delete the organization.' }
                };
            }

            // Check if member exists
            const memberDoc = await getDoc(this.createDocRef(`organizations/${orgId}/members`, memberId));
            if (!memberDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'Member not found in organization' }
                };
            }

            // Remove member document - ALLOWED by security rules for admins
            await deleteDoc(this.createDocRef(`organizations/${orgId}/members`, memberId));

            // Update member count
            if (orgDoc.success) {
                await updateDoc(this.createDocRef('organizations', orgId), {
                    memberCount: Math.max((orgDoc.data.memberCount || 1) - 1, 0),
                    updated_at: serverTimestamp()
                });
            }

            console.log(`✅ Member ${memberId} removed from organization ${orgId}`);

            return { success: true };

        } catch (error) {
            console.error('Error removing organization member:', error);
            return {
                success: false,
                error: { message: 'Failed to remove organization member' }
            };
        }
    }

    /**
     * Get organization members - RESPECTS SECURITY RULES
     */
    async getOrganizationMembers(orgId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        // Validate member access - MATCHES isOrgMember() requirement
        const hasAccess = await this.validateOrganizationAccess(orgId, 'member');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Access denied. You are not a member of this organization.' }
            };
        }

        try {
            const membersSnapshot = await getDocs(
                query(
                    this.createCollectionRef(`organizations/${orgId}/members`),
                    where('status', '==', 'active')
                )
            );

            const members = [];
            membersSnapshot.forEach((doc) => {
                members.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return {
                success: true,
                data: members
            };

        } catch (error) {
            console.error('Error getting organization members:', error);
            return {
                success: false,
                error: { message: 'Failed to get organization members' }
            };
        }
    }

    
/**
 * Create organization invitation - RESPECTS SECURITY RULES
 */
async createInvitation(organizationId, invitationData) {
    const userId = this.getCurrentUserId();
    if (!userId) {
        return { 
            success: false, 
            error: { message: 'Authentication required to create invitation' } 
        };
    }

    if (!organizationId) {
        return { 
            success: false, 
            error: { message: 'Organization ID is required' } 
        };
    }

    if (!invitationData.email) {
        return { 
            success: false, 
            error: { message: 'Recipient email is required' } 
        };
    }

    try {
        console.log('📧 Starting invitation creation process...');

        // Step 1: Validate user is admin/manager of organization
        console.log('🔍 Validating user permissions...');
        const hasAccess = await this.validateOrganizationAccess(organizationId, 'manager');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Insufficient permissions. Only organization managers can send invitations.' }
            };
        }

        // Step 2: Verify organization exists
        console.log('🔍 Verifying organization...');
        const orgDoc = await this.getDocument('organizations', organizationId);
        if (!orgDoc.success) {
            return {
                success: false,
                error: { message: 'Organization not found' }
            };
        }

        // Step 3: Create invitation document in subcollection using token as ID
        console.log('📄 Creating invitation document...');
        const timestamp = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const completeInvitationData = {
            // REQUIRED fields
            email: invitationData.email.toLowerCase().trim(),
            organizationId: organizationId,
            organizationName: orgDoc.data.name,
            inviterEmail: this.getCurrentUser()?.email || userId,
            inviterName: invitationData.inviterName || 'Team Member',
            
            // Invitation details
            token: invitationData.token,
            role: invitationData.role || 'member',
            suiteIds: Array.isArray(invitationData.suiteIds) ? invitationData.suiteIds : [],
            
            // Status and timestamps
            status: 'pending',
            createdAt: timestamp,
            expiresAt: expiresAt.toISOString(),
            acceptedAt: null,
            created_by: userId,
            created_at: timestamp,
            updated_at: timestamp,
            updated_by: userId
        };

        // Create invitation using inherited createDocument method
        const invitationPath = `organizations/${organizationId}/invitations`;
        const result = await this.createDocument(invitationPath, completeInvitationData, invitationData.token);

        if (!result.success) {
            console.error('❌ Failed to create invitation document:', result.error);
            return result;
        }

        console.log('✅ Invitation document created with token:', invitationData.token.substring(0, 8) + '...');

        // Step 4: Update organization stats
        console.log('📊 Updating organization stats...');
        try {
            await this.updateDocument('organizations', organizationId, {
                lastInvitationSent: timestamp,
                updated_at: timestamp
            });
            console.log('✅ Organization stats updated');
        } catch (error) {
            console.warn('⚠️ Could not update organization stats:', error.message);
        }

        console.log('🎉 Invitation created successfully');

        return {
            success: true,
            data: {
                id: invitationData.token,
                email: completeInvitationData.email,
                organizationId: organizationId,
                status: 'pending',
                expiresAt: completeInvitationData.expiresAt,
                createdAt: timestamp
            }
        };

    } catch (error) {
        console.error('❌ Invitation creation failed:', error);

        let errorMessage = 'Failed to create invitation. Please try again.';
        let errorCode = 'creation-failed';

        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied: You do not have permission to send invitations.';
            errorCode = 'permission-denied';
        } else if (error.code === 'not-found') {
            errorMessage = 'Organization not found.';
            errorCode = 'org-not-found';
        } else if (error.code === 'already-exists') {
            errorMessage = 'Invitation already exists for this email.';
            errorCode = 'duplicate-invite';
        }

        return {
            success: false,
            error: {
                message: errorMessage,
                code: errorCode,
                details: error.message
            }
        };
    }
}
}