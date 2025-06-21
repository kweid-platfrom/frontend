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
    orderBy,
    setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Custom error classes for better error handling
class InvitationError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'InvitationError';
    }
}

class InviteUserService {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
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
                const { email, role = 'member' } = invite;

                // Check if user is already invited or exists
                const existingInvite = await this.checkExistingInvite(organizationId, email);
                if (existingInvite) {
                    results.push({
                        email,
                        status: 'already_invited',
                        message: 'User already invited or exists',
                        inviteId: null
                    });
                    continue;
                }

                // Generate invitation token
                const inviteToken = this.generateInviteToken();

                // Save invitation to organization subcollection
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
                    lastActive: null,
                    acceptedAt: null,
                    cancelledAt: null,
                    declinedAt: null,
                    resentAt: null
                });

                // Also save to global invitations collection for token lookup
                await this.saveGlobalInvitation({
                    organizationId,
                    email,
                    role,
                    inviterEmail,
                    inviterName,
                    organizationName,
                    token: inviteToken,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    orgInviteId: inviteDoc.id
                });

                // Send email
                const emailSent = await this.sendInvitationEmail({
                    email,
                    role,
                    inviterName,
                    organizationName,
                    inviteToken,
                    inviteId: inviteDoc.id,
                    organizationId
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
            throw new InvitationError('Failed to send invitations: ' + error.message, 'SEND_FAILED');
        }
    }

    /**
     * Check if user already has a pending invitation or is already a member
     */
    async checkExistingInvite(organizationId, email) {
        try {
            // Check existing invitations in organization subcollection
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

            // Check existing users in organization subcollection
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
     * Save invitation to organization subcollection
     */
    async saveInvitation(inviteData) {
        try {
            const invitesRef = collection(db, 'organizations', inviteData.organizationId, 'invitations');
            const docRef = await addDoc(invitesRef, {
                email: inviteData.email,
                role: inviteData.role,
                inviterEmail: inviteData.inviterEmail,
                inviterName: inviteData.inviterName,
                organizationName: inviteData.organizationName,
                token: inviteData.token,
                status: inviteData.status,
                createdAt: inviteData.createdAt,
                expiresAt: inviteData.expiresAt,
                lastActive: inviteData.lastActive,
                acceptedAt: inviteData.acceptedAt,
                cancelledAt: inviteData.cancelledAt,
                declinedAt: inviteData.declinedAt,
                resentAt: inviteData.resentAt
            });
            return docRef;
        } catch (error) {
            console.error('Error saving invitation to organization:', error);
            throw error;
        }
    }

    /**
     * Save invitation to global collection for token lookup
     */
    async saveGlobalInvitation(inviteData) {
        try {
            const globalInvitesRef = collection(db, 'invitations');
            const docRef = await addDoc(globalInvitesRef, inviteData);
            return docRef;
        } catch (error) {
            console.error('Error saving global invitation:', error);
            throw error;
        }
    }

    /**
     * Send invitation email
     */
    async sendInvitationEmail({ email, role, inviterName, organizationName, inviteToken, inviteId, organizationId }) {
        try {
            const inviteUrl = `${this.baseUrl}/invite?token=${inviteToken}&email=${encodeURIComponent(email)}&orgId=${organizationId}`;

            // This should match your actual email service implementation
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

            // If you have an email service endpoint
            const response = await fetch('/api/send-invites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                console.error('Email service responded with error:', await response.text());
                return false;
            }

            const result = await response.json();
            return result.success !== false;

        } catch (error) {
            console.error('Error sending invitation email:', error);
            // Don't fail the entire process if email fails
            // You might want to add email to a retry queue here
            return false;
        }
    }

    /**
     * Generate a secure invitation token
     */
    generateInviteToken() {
        // Use crypto.randomUUID if available, fallback to alternative
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID() + '-' + Date.now().toString(36);
        } else {
            // Fallback for environments without crypto.randomUUID
            return Math.random().toString(36).substring(2) + '-' + Date.now().toString(36);
        }
    }

    /**
     * Find invitation by token - Returns consistent data structure
     */
    async findInvitationByToken(token) {
        try {
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
            const data = inviteDoc.data();
            
            // Return consistent data structure for InviteHandler
            return {
                id: inviteDoc.id,
                token: data.token,
                email: data.email,
                role: data.role || 'member',
                status: data.status || 'pending',
                
                // Organization info
                organizationId: data.organizationId,
                organizationName: data.organizationName,
                orgId: data.organizationId, // Backward compatibility
                orgName: data.organizationName, // Backward compatibility
                
                // Inviter info  
                inviterName: data.inviterName,
                inviterEmail: data.inviterEmail,
                inviter: { // Backward compatibility
                    name: data.inviterName,
                    email: data.inviterEmail
                },
                invitedBy: { // Backward compatibility
                    name: data.inviterName,
                    email: data.inviterEmail
                },
                
                // Project info (if available)
                projects: data.projects || [],
                projectIds: data.projectIds || [],
                
                // Timestamps
                createdAt: data.createdAt,
                expiresAt: data.expiresAt,
                acceptedAt: data.acceptedAt,
                invitedAt: data.createdAt, // Backward compatibility
                
                // Internal references
                orgInviteId: data.orgInviteId,
                
                // Keep original data for debugging
                _original: data
            };
        } catch (error) {
            console.error('Error finding invitation:', error);
            return null;
        }
    }

    /**
     * Accept invitation and create user account
     */
    async acceptInvitation(token, userData) {
        try {
            // Find invitation by token
            const invitation = await this.findInvitationByToken(token);
            if (!invitation) {
                throw new InvitationError('Invalid or expired invitation', 'INVALID_TOKEN');
            }

            // Check if invitation is still valid
            const expiryDate = invitation.expiresAt.toDate ? invitation.expiresAt.toDate() : new Date(invitation.expiresAt);
            if (expiryDate < new Date()) {
                throw new InvitationError('Invitation has expired', 'EXPIRED');
            }

            if (invitation.status !== 'pending') {
                throw new InvitationError('Invitation already used', 'ALREADY_USED');
            }

            // Create user account in organization subcollection
            const usersRef = collection(db, 'organizations', invitation.organizationId, 'users');
            const userDoc = await addDoc(usersRef, {
                email: invitation.email,
                role: invitation.role,
                name: userData.userName || userData.displayName || invitation.email.split('@')[0],
                displayName: userData.displayName || userData.userName || invitation.email.split('@')[0],
                status: 'active',
                joinedAt: serverTimestamp(),
                lastActive: serverTimestamp(),
                invitedBy: invitation.inviterEmail,
                organizationId: invitation.organizationId,
                projectIds: userData.projectIds || [],
                // Include any additional user data
                ...userData
            });

            // Update organization invitation status
            if (invitation.orgInviteId) {
                const orgInviteRef = doc(db, 'organizations', invitation.organizationId, 'invitations', invitation.orgInviteId);
                await updateDoc(orgInviteRef, {
                    status: 'accepted',
                    acceptedAt: serverTimestamp(),
                    userId: userDoc.id
                });
            }

            // Update global invitation status
            const globalInviteRef = doc(db, 'invitations', invitation.id);
            await updateDoc(globalInviteRef, {
                status: 'accepted',
                acceptedAt: serverTimestamp(),
                userId: userDoc.id
            });

            return {
                success: true,
                userId: userDoc.id,
                organizationId: invitation.organizationId,
                organizationName: invitation.organizationName,
                message: 'Invitation accepted successfully'
            };
        } catch (error) {
            console.error('Error accepting invitation:', error);
            if (error instanceof InvitationError) {
                throw error;
            }
            throw new InvitationError('Failed to accept invitation: ' + error.message, 'ACCEPT_FAILED');
        }
    }

    /**
     * Decline invitation - NEW METHOD
     */
    async declineInvitation(token) {
        try {
            // Find invitation by token
            const invitation = await this.findInvitationByToken(token);
            if (!invitation) {
                throw new InvitationError('Invalid or expired invitation', 'INVALID_TOKEN');
            }

            if (invitation.status !== 'pending') {
                throw new InvitationError('Invitation already processed', 'ALREADY_PROCESSED');
            }

            // Update organization invitation status
            if (invitation.orgInviteId) {
                const orgInviteRef = doc(db, 'organizations', invitation.organizationId, 'invitations', invitation.orgInviteId);
                await updateDoc(orgInviteRef, {
                    status: 'declined',
                    declinedAt: serverTimestamp()
                });
            }

            // Update global invitation status
            const globalInviteRef = doc(db, 'invitations', invitation.id);
            await updateDoc(globalInviteRef, {
                status: 'declined',
                declinedAt: serverTimestamp()
            });

            return {
                success: true,
                message: 'Invitation declined successfully'
            };
        } catch (error) {
            console.error('Error declining invitation:', error);
            if (error instanceof InvitationError) {
                throw error;
            }
            throw new InvitationError('Failed to decline invitation: ' + error.message, 'DECLINE_FAILED');
        }
    }

    /**
     * Get all users for an organization (including pending invitations)
     */
    async getOrganizationUsers(organizationId) {
        try {
            const users = [];

            // Get active users from organization subcollection
            const usersRef = collection(db, 'organizations', organizationId, 'users');
            const usersQuery = query(usersRef, orderBy('joinedAt', 'desc'));
            const usersSnapshot = await getDocs(usersQuery);

            usersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    ...data,
                    joinedAt: data.joinedAt?.toDate()?.toISOString().split('T')[0],
                    lastActive: data.lastActive?.toDate()?.toISOString().split('T')[0],
                    isInvitation: false
                });
            });

            // Get pending invitations from organization subcollection
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
                    invitationId: doc.id,
                    expiresAt: inviteData.expiresAt?.toDate()?.toISOString()
                });
            });

            return users;
        } catch (error) {
            console.error('Error fetching organization users:', error);
            throw new InvitationError('Failed to fetch organization users: ' + error.message, 'FETCH_FAILED');
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
                throw new InvitationError('Invitation not found', 'NOT_FOUND');
            }

            const inviteData = inviteDoc.data();

            // Check if invitation is still pending
            if (inviteData.status !== 'pending') {
                throw new InvitationError('Cannot resend non-pending invitation', 'INVALID_STATUS');
            }

            // Generate new token and extend expiry
            const newToken = this.generateInviteToken();
            const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Update organization invitation
            await updateDoc(inviteRef, {
                token: newToken,
                expiresAt: newExpiryDate,
                resentAt: serverTimestamp()
            });

            // Update global invitation
            const globalInvitesRef = collection(db, 'invitations');
            const globalQuery = query(
                globalInvitesRef,
                where('orgInviteId', '==', invitationId),
                where('organizationId', '==', organizationId)
            );
            const globalSnapshot = await getDocs(globalQuery);
            
            if (!globalSnapshot.empty) {
                const globalInviteRef = doc(db, 'invitations', globalSnapshot.docs[0].id);
                await updateDoc(globalInviteRef, {
                    token: newToken,
                    expiresAt: newExpiryDate,
                    resentAt: serverTimestamp()
                });
            }

            // Resend email
            const emailSent = await this.sendInvitationEmail({
                email: inviteData.email,
                role: inviteData.role,
                inviterName: inviteData.inviterName,
                organizationName: inviteData.organizationName,
                inviteToken: newToken,
                inviteId: invitationId,
                organizationId: organizationId
            });

            return {
                success: emailSent,
                message: emailSent ? 'Invitation resent successfully' : 'Failed to resend invitation'
            };
        } catch (error) {
            console.error('Error resending invitation:', error);
            if (error instanceof InvitationError) {
                throw error;
            }
            throw new InvitationError('Failed to resend invitation: ' + error.message, 'RESEND_FAILED');
        }
    }

    /**
     * Cancel invitation
     */
    async cancelInvitation(organizationId, invitationId) {
        try {
            // Update organization invitation
            const inviteRef = doc(db, 'organizations', organizationId, 'invitations', invitationId);
            await updateDoc(inviteRef, {
                status: 'cancelled',
                cancelledAt: serverTimestamp()
            });

            // Update global invitation
            const globalInvitesRef = collection(db, 'invitations');
            const globalQuery = query(
                globalInvitesRef,
                where('orgInviteId', '==', invitationId),
                where('organizationId', '==', organizationId)
            );
            const globalSnapshot = await getDocs(globalQuery);
            
            if (!globalSnapshot.empty) {
                const globalInviteRef = doc(db, 'invitations', globalSnapshot.docs[0].id);
                await updateDoc(globalInviteRef, {
                    status: 'cancelled',
                    cancelledAt: serverTimestamp()
                });
            }

            return { success: true, message: 'Invitation cancelled successfully' };
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            throw new InvitationError('Failed to cancel invitation: ' + error.message, 'CANCEL_FAILED');
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
                // Cancel invitation instead of deleting
                return await this.cancelInvitation(organizationId, userId);
            } else {
                // Delete user from organization
                const userRef = doc(db, 'organizations', organizationId, 'users', userId);
                await deleteDoc(userRef);
            }

            return { success: true, message: 'User removed successfully' };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new InvitationError('Failed to delete user: ' + error.message, 'DELETE_FAILED');
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