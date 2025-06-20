/* eslint-disable @typescript-eslint/no-unused-vars */
// services/InviteUserService.js
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';


class InviteUserService {
    constructor() {
        this.baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
    }

    /**
     * Send invitation emails to users
     * @param {string} organizationId - The organization ID
     * @param {Array} inviteData - Array of {email, role} objects
     * @param {string} inviterName - Name of the person sending invites
     * @param {string} inviterEmail - Email of the person sending invites
     * @param {string} organizationName - Name of the organization
     */
    async sendInvites(organizationId, inviteData, inviterName, inviterEmail, organizationName) {
        try {
            const results = [];

            for (const invite of inviteData) {
                const { email, role } = invite;

                // Check if user is already invited or exists
                const existingInvite = await this.checkExistingInvite(organizationId, email);
                if (existingInvite) {
                    results.push({
                        email,
                        status: 'already_invited',
                        message: 'User already invited or exists'
                    });
                    continue;
                }

                // Generate invitation token
                const inviteToken = this.generateInviteToken();

                // Save invitation to database
                const inviteDoc = await this.saveInvitation({
                    organizationId,
                    email,
                    role,
                    inviterEmail,
                    inviterName,
                    organizationName,
                    token: inviteToken,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    lastActive: null
                });

                // Send email
                const emailSent = await this.sendInvitationEmail({
                    email,
                    role,
                    inviterName,
                    organizationName,
                    inviteToken,
                    inviteId: inviteDoc.id
                });

                results.push({
                    email,
                    status: emailSent ? 'sent' : 'failed',
                    message: emailSent ? 'Invitation sent successfully' : 'Failed to send email',
                    inviteId: inviteDoc.id
                });
            }

            return {
                success: true,
                results,
                summary: {
                    sent: results.filter(r => r.status === 'sent').length,
                    failed: results.filter(r => r.status === 'failed').length,
                    alreadyInvited: results.filter(r => r.status === 'already_invited').length
                }
            };
        } catch (error) {
            console.error('Error sending invites:', error);
            throw new Error('Failed to send invitations');
        }
    }

    /**
     * Check if user already has a pending invitation or is already a member
     */
    async checkExistingInvite(organizationId, email) {
        try {
            // Check existing invitations
            const invitesRef = collection(db, 'organizations', organizationId, 'invitations');
            const inviteQuery = query(
                invitesRef,
                where('email', '==', email),
                where('status', 'in', ['pending', 'accepted'])
            );
            const inviteSnapshot = await getDocs(inviteQuery);
            
            if (!inviteSnapshot.empty) {
                return true;
            }

            // Check existing users
            const usersRef = collection(db, 'organizations', organizationId, 'users');
            const userQuery = query(
                usersRef,
                where('email', '==', email),
                where('status', 'in', ['active', 'pending'])
            );
            const userSnapshot = await getDocs(userQuery);
            
            return !userSnapshot.empty;
        } catch (error) {
            console.error('Error checking existing invite:', error);
            return false;
        }
    }

    /**
     * Save invitation to database
     */
    async saveInvitation(inviteData) {
        try {
            const invitesRef = collection(db, 'organizations', inviteData.organizationId, 'invitations');
            const docRef = await addDoc(invitesRef, inviteData);
            return docRef;
        } catch (error) {
            console.error('Error saving invitation:', error);
            throw error;
        }
    }

    /**
     * Send invitation email (integrate with your email service)
     */
    async sendInvitationEmail({ email, role, inviterName, organizationName, inviteToken, inviteId }) {
        try {
            const inviteUrl = `${this.baseUrl}/accept-invite/${inviteToken}`;

            // Replace this with your actual email service (SendGrid, AWS SES, etc.)
            const emailData = {
                to: email,
                subject: `You're invited to join ${organizationName}`,
                template: 'user-invitation',
                data: {
                    inviterName,
                    organizationName,
                    role,
                    inviteUrl,
                    expiresIn: '7 days'
                }
            };

            // Example API call to your email service
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            return true;
        } catch (error) {
            console.error('Error sending invitation email:', error);
            return false;
        }
    }

    /**
     * Generate a secure invitation token
     */
    generateInviteToken() {
        return crypto.randomUUID() + '-' + Date.now().toString(36);
    }

    /**
     * Accept invitation and create user account
     */
    async acceptInvitation(token, userData) {
        try {
            // Find invitation by token
            const invitation = await this.findInvitationByToken(token);
            if (!invitation) {
                throw new Error('Invalid or expired invitation');
            }

            // Check if invitation is still valid
            if (invitation.expiresAt.toDate() < new Date()) {
                throw new Error('Invitation has expired');
            }

            if (invitation.status !== 'pending') {
                throw new Error('Invitation already used');
            }

            // Create user account in organization
            const usersRef = collection(db, 'organizations', invitation.organizationId, 'users');
            const userDoc = await addDoc(usersRef, {
                ...userData,
                email: invitation.email,
                role: invitation.role,
                status: 'active',
                joinedAt: serverTimestamp(),
                lastActive: serverTimestamp(),
                invitedBy: invitation.inviterEmail
            });

            // Update invitation status
            const inviteRef = doc(db, 'organizations', invitation.organizationId, 'invitations', invitation.id);
            await updateDoc(inviteRef, {
                status: 'accepted',
                acceptedAt: serverTimestamp(),
                userId: userDoc.id
            });

            return {
                success: true,
                userId: userDoc.id,
                organizationId: invitation.organizationId
            };
        } catch (error) {
            console.error('Error accepting invitation:', error);
            throw error;
        }
    }

    /**
     * Find invitation by token across all organizations
     */
    async findInvitationByToken(token) {
        try {
            // Create a global invitations collection to store all invites with organization reference
            const globalInvitesRef = collection(db, 'invitations');
            const q = query(
                globalInvitesRef,
                where('token', '==', token),
                where('status', '==', 'pending')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            const inviteDoc = snapshot.docs[0];
            return {
                id: inviteDoc.id,
                ...inviteDoc.data(),
                createdAt: inviteDoc.data().createdAt,
                expiresAt: inviteDoc.data().expiresAt,
                acceptedAt: inviteDoc.data().acceptedAt
            };
        } catch (error) {
            console.error('Error finding invitation:', error);
            return null;
        }
    }

    /**
     * Get all users for an organization (including pending invitations)
     */
    async getOrganizationUsers(organizationId) {
        try {
            const users = [];

            // Get active users
            const usersRef = collection(db, 'organizations', organizationId, 'users');
            const usersQuery = query(usersRef, orderBy('joinedAt', 'desc'));
            const usersSnapshot = await getDocs(usersQuery);

            usersSnapshot.docs.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data(),
                    joinedAt: doc.data().joinedAt?.toDate()?.toISOString().split('T')[0],
                    lastActive: doc.data().lastActive?.toDate()?.toISOString().split('T')[0]
                });
            });

            // Get pending invitations
            const invitesRef = collection(db, 'organizations', organizationId, 'invitations');
            const invitesQuery = query(
                invitesRef, 
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc')
            );
            const invitesSnapshot = await getDocs(invitesQuery);

            invitesSnapshot.docs.forEach(doc => {
                const inviteData = doc.data();
                users.push({
                    id: doc.id,
                    name: inviteData.email.split('@')[0], // Use email prefix as temporary name
                    email: inviteData.email,
                    role: inviteData.role,
                    status: 'pending',
                    joinedAt: inviteData.createdAt?.toDate()?.toISOString().split('T')[0],
                    lastActive: null,
                    isInvitation: true,
                    invitationId: doc.id
                });
            });

            return users;
        } catch (error) {
            console.error('Error fetching organization users:', error);
            throw error;
        }
    }

    /**
     * Get all invitations for an organization
     */
    async getOrganizationInvitations(organizationId) {
        try {
            const invitesRef = collection(db, 'organizations', organizationId, 'invitations');
            const q = query(invitesRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                expiresAt: doc.data().expiresAt?.toDate(),
                acceptedAt: doc.data().acceptedAt?.toDate()
            }));
        } catch (error) {
            console.error('Error fetching invitations:', error);
            throw error;
        }
    }

    /**
     * Resend invitation
     */
    async resendInvitation(organizationId, invitationId) {
        try {
            const inviteRef = doc(db, 'organizations', organizationId, 'invitations', invitationId);
            const inviteDoc = await getDoc(inviteRef);

            if (!inviteDoc.exists()) {
                throw new Error('Invitation not found');
            }

            const inviteData = inviteDoc.data();

            // Check if invitation is still pending
            if (inviteData.status !== 'pending') {
                throw new Error('Cannot resend non-pending invitation');
            }

            // Generate new token and extend expiry
            const newToken = this.generateInviteToken();
            const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Update invitation
            await updateDoc(inviteRef, {
                token: newToken,
                expiresAt: newExpiryDate,
                status: 'pending',
                resentAt: serverTimestamp()
            });

            // Resend email
            const emailSent = await this.sendInvitationEmail({
                email: inviteData.email,
                role: inviteData.role,
                inviterName: inviteData.inviterName,
                organizationName: inviteData.organizationName,
                inviteToken: newToken,
                inviteId: invitationId
            });

            return {
                success: emailSent,
                message: emailSent ? 'Invitation resent successfully' : 'Failed to resend invitation'
            };
        } catch (error) {
            console.error('Error resending invitation:', error);
            throw error;
        }
    }

    /**
     * Cancel invitation
     */
    async cancelInvitation(organizationId, invitationId) {
        try {
            const inviteRef = doc(db, 'organizations', organizationId, 'invitations', invitationId);
            await updateDoc(inviteRef, {
                status: 'cancelled',
                cancelledAt: serverTimestamp()
            });

            return { success: true, message: 'Invitation cancelled successfully' };
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            throw error;
        }
    }

    /**
     * Delete user from organization
     */
    async deleteUser(organizationId, userId) {
        try {
            // Check if it's an invitation or actual user
            const user = await this.getUserById(organizationId, userId);
            
            if (user?.isInvitation) {
                // Delete invitation
                const inviteRef = doc(db, 'organizations', organizationId, 'invitations', userId);
                await deleteDoc(inviteRef);
            } else {
                // Delete user
                const userRef = doc(db, 'organizations', organizationId, 'users', userId);
                await deleteDoc(userRef);
            }

            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Update user role
     */
    async updateUserRole(organizationId, userId, newRole) {
        try {
            const userRef = doc(db, 'organizations', organizationId, 'users', userId);
            await updateDoc(userRef, {
                role: newRole,
                updatedAt: serverTimestamp()
            });

            return { success: true, message: 'User role updated successfully' };
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }

    /**
     * Get user by ID (checks both users and invitations)
     */
    async getUserById(organizationId, userId) {
        try {
            // Try users collection first
            const userRef = doc(db, 'organizations', organizationId, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                return {
                    id: userDoc.id,
                    ...userDoc.data(),
                    isInvitation: false
                };
            }

            // Try invitations collection
            const inviteRef = doc(db, 'organizations', organizationId, 'invitations', userId);
            const inviteDoc = await getDoc(inviteRef);
            
            if (inviteDoc.exists()) {
                return {
                    id: inviteDoc.id,
                    ...inviteDoc.data(),
                    isInvitation: true
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }

    /**
     * Get user statistics for an organization
     */
    async getUserStats(organizationId) {
        try {
            const users = await this.getOrganizationUsers(organizationId);
            
            const stats = {
                total: users.length,
                active: users.filter(u => u.status === 'active').length,
                pending: users.filter(u => u.status === 'pending').length,
                inactive: users.filter(u => u.status === 'inactive').length,
                admins: users.filter(u => u.role === 'admin').length,
                members: users.filter(u => u.role === 'member').length,
                viewers: users.filter(u => u.role === 'viewer').length
            };

            return stats;
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    /**
     * Validate team member limits
     */
    validateTeamLimits(currentMemberCount, maxMembers, newInviteCount = 0) {
        const totalAfterInvites = currentMemberCount + newInviteCount;
        
        return {
            isValid: totalAfterInvites <= maxMembers,
            currentCount: currentMemberCount,
            maxCount: maxMembers,
            remainingSlots: Math.max(0, maxMembers - currentMemberCount),
            exceedsBy: Math.max(0, totalAfterInvites - maxMembers)
        };
    }
}

// Export singleton instance
export const inviteUserService = new InviteUserService();
export default inviteUserService;