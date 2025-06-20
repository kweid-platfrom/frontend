// components/UserManagement/UserTable.jsx
import React, { useState, useEffect } from 'react';
import {
    MoreVertical,
    Mail,
    Trash2,
    UserCheck,
    Shield,
    Eye,
    AlertTriangle,
    Lock,
    X
} from 'lucide-react';

const UserTable = ({
    users,
    onDeleteUser,
    onUpdateUserRole,
    onResendInvite,
    loading,
    canManageUsers = false,
    currentUserRole = null,
    currentUserId = null
}) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown && !event.target.closest('.dropdown-container')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <Shield className="w-4 h-4 text-red-500" />;
            case 'member':
                return <UserCheck className="w-4 h-4 text-blue-500" />;
            case 'viewer':
                return <Eye className="w-4 h-4 text-gray-500" />;
            default:
                return <UserCheck className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' }
        };

        const config = statusConfig[status] || statusConfig.inactive;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const canModifyUser = (user) => {
        // Must have general management permissions
        if (!canManageUsers) return false;

        // Cannot modify yourself
        if (user.id === currentUserId) return false;

        // Only admins can modify other users
        if (currentUserRole !== 'admin') return false;

        return true;
    };

    const canDeleteUser = (user) => {
        if (!canModifyUser(user)) return false;

        // Cannot delete if it would leave no admins
        if (user.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin' && u.id !== user.id).length;
            return adminCount > 0;
        }

        return true;
    };

    const canChangeRole = (user, newRole) => {
        if (!canModifyUser(user)) return false;

        // Cannot remove admin role if it would leave no admins
        if (user.role === 'admin' && newRole !== 'admin') {
            const adminCount = users.filter(u => u.role === 'admin' && u.id !== user.id).length;
            return adminCount > 0;
        }

        return true;
    };

    const handleRoleChange = (user, newRole) => {
        if (!canChangeRole(user, newRole)) {
            if (user.role === 'admin' && newRole !== 'admin') {
                alert('Cannot remove admin role from the last administrator.');
            } else {
                alert('You do not have permission to change this user\'s role.');
            }
            return;
        }

        onUpdateUserRole(user.id, newRole);
        setActiveDropdown(null);
    };

    const handleDeleteClick = (user) => {
        if (!canDeleteUser(user)) {
            if (user.id === currentUserId) {
                alert('You cannot delete your own account.');
            } else if (user.role === 'admin') {
                alert('Cannot delete the last administrator.');
            } else {
                alert('You do not have permission to delete this user.');
            }
            return;
        }

        setConfirmDelete(user);
        setActiveDropdown(null);
    };

    const confirmDeleteUser = () => {
        if (confirmDelete) {
            onDeleteUser(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    const cancelDelete = () => {
        setConfirmDelete(null);
    };

    const handleResendInvite = (user) => {
        if (!canManageUsers) {
            alert('You do not have permission to resend invites.');
            return;
        }

        onResendInvite(user.id);
        setActiveDropdown(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString();
    };

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                    {canManageUsers
                        ? "Start by inviting team members to your organization."
                        : "No users match your current filters."
                    }
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-teal-800">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    {user.name}
                                                    {user.id === currentUserId && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getRoleIcon(user.role)}
                                            <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(user.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.joinedAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(user.lastActive)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="relative dropdown-container">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                                                disabled={!canManageUsers}
                                                className={`p-2 rounded-lg transition-colors ${canManageUsers
                                                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                        : 'text-gray-300 cursor-not-allowed'
                                                    }`}
                                            >
                                                {canManageUsers ? (
                                                    <MoreVertical className="w-4 h-4" />
                                                ) : (
                                                    <Lock className="w-4 h-4" />
                                                )}
                                            </button>

                                            {activeDropdown === user.id && canManageUsers && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                    {/* Role Change Options */}
                                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                        Change Role
                                                    </div>
                                                    {['admin', 'member', 'viewer'].map((role) => (
                                                        <button
                                                            key={role}
                                                            onClick={() => handleRoleChange(user, role)}
                                                            disabled={user.role === role || !canChangeRole(user, role)}
                                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${user.role === role
                                                                    ? 'text-gray-400 cursor-not-allowed'
                                                                    : canChangeRole(user, role)
                                                                        ? 'text-gray-700'
                                                                        : 'text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {getRoleIcon(role)}
                                                            <span className="capitalize">{role}</span>
                                                            {user.role === role && (
                                                                <span className="ml-auto text-xs text-gray-400">(Current)</span>
                                                            )}
                                                            {!canChangeRole(user, role) && user.role !== role && (
                                                                <AlertTriangle className="w-3 h-3 ml-auto text-yellow-500" />
                                                            )}
                                                        </button>
                                                    ))}

                                                    {/* Divider */}
                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    {/* Resend Invite (for pending users) */}
                                                    {user.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleResendInvite(user)}
                                                            disabled={loading}
                                                            className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                            Resend Invite
                                                        </button>
                                                    )}

                                                    {/* Delete User */}
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={!canDeleteUser(user)}
                                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${canDeleteUser(user)
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-gray-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete User
                                                        {!canDeleteUser(user) && user.id !== currentUserId && (
                                                            <AlertTriangle className="w-3 h-3 ml-auto text-yellow-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Delete User
                                </h3>
                                <button
                                    onClick={cancelDelete}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {confirmDelete.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {confirmDelete.email}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete this user? This action cannot be undone.
                                    The user will lose access to the organization and all associated data.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={cancelDelete}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteUser}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Deleting...' : 'Delete User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserTable;