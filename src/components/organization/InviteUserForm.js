"use client"
import React, { useState } from 'react';
import { useOrganization } from '../../context/OrganizationContext';

const InviteUserForm = () => {
    const { inviteUser } = useOrganization();
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('Developer');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inviteStatus, setInviteStatus] = useState(null);

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setInviteStatus('sending');

        try {
            await inviteUser(inviteEmail, selectedRole);
            setInviteStatus('success');
            setInviteEmail('');
            setTimeout(() => setInviteStatus(null), 3000);
        } catch (error) {
            console.error('Error sending invitation:', error);
            setInviteStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-medium mb-3">Invite Team Member</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="inviteEmail"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                            placeholder="colleague@example.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            id="role"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                            disabled={isSubmitting}
                        >
                            <option value="Admin">Admin</option>
                            <option value="Developer">Developer</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-[#00897b] text-white font-medium rounded hover:bg-[#00796B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897b] disabled:opacity-50"
                    >
                        {isSubmitting ? 'Sending...' : 'Send Invitation'}
                    </button>
                    {inviteStatus === 'success' && (
                        <span className="text-green-600 text-sm">Invitation sent successfully!</span>
                    )}
                    {inviteStatus === 'error' && (
                        <span className="text-red-600 text-sm">Error sending invitation</span>
                    )}
                </div>
            </form>
        </div>
    );
};

export default InviteUserForm;
