import React, { useState } from 'react';

const OrganizationSection = ({ formData, onChange, users, onPermissionChange, currentUserId }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('Developer');

    const handleInviteSubmit = (e) => {
        e.preventDefault();
        console.log(`Inviting ${inviteEmail} as ${selectedRole}`);
        // Here you would typically make an API call to send the invitation
        setInviteEmail('');
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Organization Settings</h2>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-3">Company Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={onChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-3">Team Members</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name / Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Permissions
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                                <span className="text-sm text-gray-500">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.role}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {user.status === 'accepted' ? 'Active' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.status === 'accepted' && (
                                                <div className="space-y-1">
                                                    {Object.entries(user.permissions).map(([key, value]) => (
                                                        <div key={key} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id={`${user.id}-${key}`}
                                                                checked={value}
                                                                onChange={(e) => onPermissionChange(user.id, key, e.target.checked)}
                                                                disabled={user.id === currentUserId}
                                                                className="h-4 w-4 text-[#00897b] focus:ring-[#00897b] border-gray-300 rounded"
                                                            />
                                                            <label htmlFor={`${user.id}-${key}`} className="ml-2 block text-sm text-gray-700">
                                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {user.id !== currentUserId && (
                                                <button
                                                    type="button"
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
                </div>

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
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Developer">Developer</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#00897b] text-white font-medium rounded hover:bg-[#00796B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897b]"
                        >
                            Send Invitation
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrganizationSection;