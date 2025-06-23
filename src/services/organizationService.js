// organizationService.js - Organization-specific operations
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "../config/firebase";
import { fetchUserData } from './userService.js';
import { isAdmin, isOrganizationAccount, getUserPermissions } from './permissionService.js';

/**
 * Update user role within an organization
 * Only organization admins can perform this action
 */
export const updateUserRole = async (adminUserId, targetUserId, newRole, currentAdminProfile) => {
    // Validate admin permissions
    if (!isAdmin(currentAdminProfile)) {
        throw new Error('Only administrators can update user roles');
    }

    if (!isOrganizationAccount(currentAdminProfile)) {
        throw new Error('Only organization administrators can manage user roles');
    }

    try {
        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const targetUserData = userSnap.data();

        // Ensure users are in the same organization
        if (targetUserData.organizationId !== currentAdminProfile.organizationId) {
            throw new Error('You can only manage users in your organization');
        }

        // Validate new role
        const validRoles = ['admin', 'member'];
        if (!validRoles.includes(newRole)) {
            throw new Error('Invalid role. Must be admin or member');
        }

        // Prevent self-demotion if user is the only admin
        if (targetUserId === adminUserId && newRole !== 'admin') {
            const orgMembers = await getOrganizationMembers(currentAdminProfile);
            const adminCount = orgMembers.filter(member => isAdmin(member)).length;

            if (adminCount <= 1) {
                throw new Error('Cannot remove admin role - organization must have at least one admin');
            }
        }

        const updateData = {
            role: [newRole],
            updatedAt: serverTimestamp(),
            updatedBy: adminUserId
        };

        await setDoc(userRef, updateData, { merge: true });

        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        throw new Error(`Failed to update user role: ${error.message}`);
    }
};

/**
 * Get all members of an organization
 * Only organization users can view their team members
 */
export const getOrganizationMembers = async (userProfile) => {
    if (!isOrganizationAccount(userProfile)) {
        throw new Error('Only organization accounts can view team members');
    }

    if (!userProfile.organizationId) {
        throw new Error('User is not associated with an organization');
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('organizationId', '==', userProfile.organizationId));
        const querySnapshot = await getDocs(q);

        const members = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            members.push({
                ...userData,
                permissions: getUserPermissions(userData)
            });
        });

        // Sort members: admins first, then by name
        return members.sort((a, b) => {
            if (isAdmin(a) && !isAdmin(b)) return -1;
            if (!isAdmin(a) && isAdmin(b)) return 1;

            const nameA = `${a.firstName} ${a.lastName}`.trim();
            const nameB = `${b.firstName} ${b.lastName}`.trim();
            return nameA.localeCompare(nameB);
        });

    } catch (error) {
        console.error('Error fetching organization members:', error);
        throw new Error('Failed to fetch organization members');
    }
};

/**
 * Invite a user to join an organization
 * Only organization admins can send invitations
 */
export const inviteUserToOrganization = async (adminProfile, inviteData) => {
    if (!isAdmin(adminProfile)) {
        throw new Error('Only administrators can invite users');
    }

    if (!isOrganizationAccount(adminProfile)) {
        throw new Error('Only organization accounts can invite users');
    }

    const { email, role = 'member', firstName, lastName } = inviteData;

    if (!email || !firstName) {
        throw new Error('Email and first name are required');
    }

    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(role)) {
        throw new Error('Invalid role. Must be admin or member');
    }

    try {
        // Check if user already exists
        const usersRef = collection(db, 'users');
        const existingUserQuery = query(usersRef, where('email', '==', email.toLowerCase().trim()));
        const existingUserSnap = await getDocs(existingUserQuery);

        if (!existingUserSnap.empty) {
            const existingUser = existingUserSnap.docs[0].data();

            // If user exists and already in an organization
            if (existingUser.organizationId) {
                if (existingUser.organizationId === adminProfile.organizationId) {
                    throw new Error('User is already a member of this organization');
                } else {
                    throw new Error('User is already a member of another organization');
                }
            }

            // Add existing user to organization
            const userRef = doc(db, 'users', existingUser.uid);
            await setDoc(userRef, {
                organizationId: adminProfile.organizationId,
                role: [role],
                accountType: 'organization',
                userType: 'organization',
                updatedAt: serverTimestamp(),
                invitedBy: adminProfile.uid
            }, { merge: true });

            return { success: true, message: 'User added to organization', userId: existingUser.uid };
        }

        // Create invitation record for new users
        const inviteRef = doc(collection(db, 'invitations'));
        const inviteId = inviteRef.id;

        const invitationData = {
            id: inviteId,
            email: email.toLowerCase().trim(),
            firstName: firstName.trim(),
            lastName: (lastName || '').trim(),
            role,
            organizationId: adminProfile.organizationId,
            organizationName: adminProfile.organizationName || adminProfile.firstName || 'Organization',
            invitedBy: adminProfile.uid,
            invitedByName: `${adminProfile.firstName} ${adminProfile.lastName}`.trim(),
            status: 'pending',
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        await setDoc(inviteRef, invitationData);

        return {
            success: true,
            message: 'Invitation sent successfully',
            inviteId,
            inviteData: invitationData
        };

    } catch (error) {
        console.error('Error inviting user:', error);
        throw new Error(`Failed to invite user: ${error.message}`);
    }
};

/**
 * Remove a user from an organization
 * Only organization admins can remove users
 */
export const removeUserFromOrganization = async (adminProfile, userId) => {
    if (!isAdmin(adminProfile)) {
        throw new Error('Only administrators can remove users');
    }

    if (!isOrganizationAccount(adminProfile)) {
        throw new Error('Only organization accounts can remove users');
    }

    if (userId === adminProfile.uid) {
        throw new Error('You cannot remove yourself from the organization');
    }

    try {
        const userData = await fetchUserData(userId);
        if (!userData) {
            throw new Error('User not found');
        }

        // Ensure user is in the same organization
        if (userData.organizationId !== adminProfile.organizationId) {
            throw new Error('User is not a member of your organization');
        }

        // Check if removing the last admin
        if (isAdmin(userData)) {
            const orgMembers = await getOrganizationMembers(adminProfile);
            const adminCount = orgMembers.filter(member => isAdmin(member)).length;

            if (adminCount <= 1) {
                throw new Error('Cannot remove the last admin from the organization');
            }
        }

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            organizationId: null,
            role: ['member'],
            accountType: 'individual',
            userType: 'individual',
            updatedAt: serverTimestamp(),
            removedBy: adminProfile.uid,
            removedAt: serverTimestamp()
        }, { merge: true });

        return { success: true, message: 'User removed from organization' };

    } catch (error) {
        console.error('Error removing user:', error);
        throw new Error(`Failed to remove user: ${error.message}`);
    }
};

/**
 * Get organization statistics
 */
export const getOrganizationStats = async (userProfile) => {
    if (!isOrganizationAccount(userProfile)) {
        throw new Error('Only organization accounts can view organization stats');
    }

    try {
        const members = await getOrganizationMembers(userProfile);

        const stats = {
            totalMembers: members.length,
            adminCount: members.filter(member => isAdmin(member)).length,
            memberCount: members.filter(member => !isAdmin(member)).length,
            activeMembers: members.filter(member => {
                // Consider active if last login was within 30 days
                const lastLogin = member.lastLogin?.toDate?.() || new Date(0);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return lastLogin > thirtyDaysAgo;
            }).length,
            recentlyJoined: members.filter(member => {
                // Consider recently joined if created within 7 days
                const createdAt = member.createdAt?.toDate?.() || new Date(0);
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return createdAt > sevenDaysAgo;
            }).length
        };

        return stats;

    } catch (error) {
        console.error('Error fetching organization stats:', error);
        throw new Error('Failed to fetch organization statistics');
    }
};

/**
 * Update organization settings
 * Only organization admins can update settings
 */
export const updateOrganizationSettings = async (adminProfile, settings) => {
    if (!isAdmin(adminProfile)) {
        throw new Error('Only administrators can update organization settings');
    }

    if (!isOrganizationAccount(adminProfile)) {
        throw new Error('Only organization accounts can update settings');
    }

    try {
        // Update admin's profile with organization info
        const adminRef = doc(db, 'users', adminProfile.uid);
        const updateData = {
            ...(settings.organizationName && { organizationName: settings.organizationName.trim() }),
            ...(settings.organizationDescription && { organizationDescription: settings.organizationDescription.trim() }),
            ...(settings.organizationWebsite && { organizationWebsite: settings.organizationWebsite.trim() }),
            ...(settings.organizationIndustry && { organizationIndustry: settings.organizationIndustry }),
            updatedAt: serverTimestamp()
        };

        await setDoc(adminRef, updateData, { merge: true });

        return { success: true, message: 'Organization settings updated successfully' };

    } catch (error) {
        console.error('Error updating organization settings:', error);
        throw new Error(`Failed to update organization settings: ${error.message}`);
    }
};

/**
 * Get pending invitations for an organization
 * Only organization admins can view pending invitations
 */
export const getPendingInvitations = async (adminProfile) => {
    if (!isAdmin(adminProfile)) {
        throw new Error('Only administrators can view invitations');
    }

    if (!isOrganizationAccount(adminProfile)) {
        throw new Error('Only organization accounts can view invitations');
    }

    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(
            invitationsRef,
            where('organizationId', '==', adminProfile.organizationId),
            where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);

        const invitations = [];
        querySnapshot.forEach((doc) => {
            const inviteData = doc.data();
            // Check if invitation hasn't expired
            const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(0);
            if (expiresAt > new Date()) {
                invitations.push(inviteData);
            }
        });

        return invitations.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.());

    } catch (error) {
        console.error('Error fetching pending invitations:', error);
        throw new Error('Failed to fetch pending invitations');
    }
};

/**
 * Cancel a pending invitation
 * Only organization admins can cancel invitations
 */
export const cancelInvitation = async (adminProfile, inviteId) => {
    if (!isAdmin(adminProfile)) {
        throw new Error('Only administrators can cancel invitations');
    }

    try {
        const inviteRef = doc(db, 'invitations', inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            throw new Error('Invitation not found');
        }

        const inviteData = inviteSnap.data();

        // Ensure invitation belongs to admin's organization
        if (inviteData.organizationId !== adminProfile.organizationId) {
            throw new Error('You can only cancel invitations for your organization');
        }

        await setDoc(inviteRef, {
            status: 'cancelled',
            cancelledBy: adminProfile.uid,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        return { success: true, message: 'Invitation cancelled successfully' };

    } catch (error) {
        console.error('Error cancelling invitation:', error);
        throw new Error(`Failed to cancel invitation: ${error.message}`);
    }
};