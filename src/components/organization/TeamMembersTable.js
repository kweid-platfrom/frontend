"use client"
import React, {useState} from 'react';
import UserPermissionsToggle from './UserPermissionsToggle';
import StatusBadge from './StatusBadge';

const TeamMembersTable = ({ users, onPermissionChange, onRemoveUser, currentUserId }) => {
    const [userToRemove, setUserToRemove] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemoveUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to remove ${userName} from the organization?`)) {
            setUserToRemove(userId); // Set the user being removed
            setIsRemoving(true);
            try {
                await onRemoveUser(userId);
            } catch (error) {
                console.error('Error removing user:', error);
                alert('Failed to remove user. Please try again.');
            } finally {
                setIsRemoving(false);
                setUserToRemove(null); // Reset after removal process completes
            }
        }
    };
    

    return (
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
                                    <StatusBadge status={user.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {user.status === 'accepted' && (
                                        <UserPermissionsToggle 
                                            userId={user.id}
                                            permissions={user.permissions}
                                            onPermissionChange={onPermissionChange}
                                            disabled={user.id === currentUserId}
                                        />
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {user.id !== currentUserId && (
                                        <button
                                            type="button"
                                            className="text-red-600 hover:text-red-900"
                                            onClick={() => handleRemoveUser(user.id, user.name)}
                                            disabled={isRemoving}
                                        >
                                            {isRemoving && userToRemove === user.id ? 'Removing...' : 'Remove'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamMembersTable;
