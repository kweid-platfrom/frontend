"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthProvider';

export default function TeamSection({ orgData, teamMembers: initialTeamMembers }) {
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [sending, setSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Update local state when prop changes
    useEffect(() => {
        setTeamMembers(initialTeamMembers);
    }, [initialTeamMembers]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setSending(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            // Check if user is already a member
            const existingMember = teamMembers.find(member => member.email === inviteEmail);
            if (existingMember) {
                setErrorMessage('This user is already a team member');
                setSending(false);
                return;
            }

            // Add invite to database
            await addDoc(collection(db, 'invites'), {
                email: inviteEmail,
                role: inviteRole,
                organizationId: orgData.id,
                organizationName: orgData.name,
                invitedBy: user.uid,
                invitedAt: new Date(),
                status: 'pending'
            });

            setSuccessMessage(`Invite sent to ${inviteEmail}`);
            setInviteEmail('');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error sending invite:', error);
            setErrorMessage('Failed to send invite. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await updateDoc(doc(db, 'organizations', orgData.id, 'members', memberId), {
                role: newRole,
                updatedAt: new Date(),
                updatedBy: user.uid
            });

            // Update local state to reflect the change
            const updatedMembers = teamMembers.map(member =>
                member.id === memberId ? { ...member, role: newRole } : member
            );
            
            // Fix: Actually use the updatedMembers variable by updating state
            setTeamMembers(updatedMembers);

            setSuccessMessage('Member role updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error updating member role:', error);
            setErrorMessage('Failed to update member role. Please try again.');
        }
    };

    const handleRemoveMember = async (memberId, memberEmail) => {
        if (!confirm(`Are you sure you want to remove ${memberEmail} from your team?`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'organizations', orgData.id, 'members', memberId));

            // Update local state to reflect the removal
            setTeamMembers(teamMembers.filter(member => member.id !== memberId));

            setSuccessMessage(`${memberEmail} has been removed from the team`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error removing team member:', error);
            setErrorMessage('Failed to remove team member. Please try again.');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Team Members</h2>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}

            {/* Current team members */}
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Current Members</h3>

                {teamMembers.length === 0 ? (
                    <p className="text-gray-500 italic">No team members yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {teamMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                                    {member.displayName ? member.displayName.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium">
                                                        {member.displayName || 'No name set'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-200">{member.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                disabled={member.id === user.uid} // Can't change own role
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="editor">Editor</option>
                                                <option value="member">Member</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {member.id !== user.uid && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id, member.email)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invite new members */}
            <div>
                <h3 className="text-lg font-medium mb-4">Invite New Members</h3>
                <form onSubmit={handleInvite} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label htmlFor="invite-email" className="block text-sm font-medium mb-1">
                                Email Address
                            </label>
                            <input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="colleague@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="invite-role" className="block text-sm font-medium mb-1">
                                Role
                            </label>
                            <select
                                id="invite-role"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="member">Member</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={sending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {sending ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}