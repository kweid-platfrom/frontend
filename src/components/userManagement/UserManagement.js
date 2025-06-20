// Fixed UserManagementPage.jsx with proper permission handling
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Lock, Crown, AlertTriangle } from 'lucide-react';
import UserTable from './UserTable';
import UserStats from './UserStats';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthProvider';

// Mock data for demonstration - replace with your actual data fetching
const mockUsers = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'admin',
        status: 'active',
        joinedAt: '2024-01-15',
        lastActive: '2024-06-19',
        organizationId: 'org1'
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@company.com',
        role: 'member',
        status: 'active',
        joinedAt: '2024-02-20',
        lastActive: '2024-06-18',
        organizationId: 'org1'
    },
    {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@external.com',
        role: 'member',
        status: 'pending',
        joinedAt: '2024-06-15',
        lastActive: null,
        organizationId: 'org1'
    }
];

const roles = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features' },
    { value: 'member', label: 'Member', description: 'Standard user access' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
];

const UserManagementPage = () => {
    const [users, setUsers] = useState(mockUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [loading, setLoading] = useState(false);
    const [permissionError, setPermissionError] = useState(null);

    const { user, userProfile, userPermissions, hasPermission } = useAuth();
    const {
        hasFeatureAccess,
        getFeatureLimits,
        subscriptionStatus
    } = useProject();

    // Helper function to get user's primary role
    const getUserPrimaryRole = useCallback(() => {
        if (!userProfile) return null;
        
        // Handle both string and array role formats
        if (typeof userProfile.role === 'string') {
            return userProfile.role;
        }
        
        if (Array.isArray(userProfile.role)) {
            // Return the highest priority role
            const rolePriority = ['super_admin', 'admin', 'organization_admin', 'project_manager', 'lead', 'developer', 'tester', 'member', 'viewer'];
            for (const role of rolePriority) {
                if (userProfile.role.includes(role)) {
                    return role;
                }
            }
            return userProfile.role[0]; // fallback to first role
        }
        
        return 'member'; // default fallback
    }, [userProfile]);

    // Enhanced permission checks
    const canManageUsers = useCallback(() => {
        // Must be authenticated
        if (!user || !userProfile || !userPermissions) {
            console.log('Permission denied: Missing user data', {
                hasUser: !!user,
                hasProfile: !!userProfile,
                hasPermissions: !!userPermissions
            });
            return false;
        }

        // Check if user has manage_users permission
        if (!hasPermission('manage_users')) {
            console.log('Permission denied: No manage_users permission');
            return false;
        }

        // Must be organization account
        if (userProfile.accountType !== 'organization') {
            console.log('Permission denied: Not organization account', {
                accountType: userProfile.accountType
            });
            return false;
        }

        // Must have team collaboration feature access
        if (!hasFeatureAccess('teamCollaboration')) {
            console.log('Permission denied: No team collaboration feature access');
            return false;
        }

        console.log('Permission granted: User can manage users');
        return true;
    }, [user, userProfile, userPermissions, hasPermission, hasFeatureAccess]);

    const canInviteUsers = useCallback(() => {
        if (!canManageUsers()) return false;

        const limits = getFeatureLimits();
        if (!limits) return false;

        // Check if we're at the team member limit
        const currentMemberCount = users.filter(u => u.status === 'active').length;
        return currentMemberCount < limits.teamMembers;
    }, [canManageUsers, getFeatureLimits, users]);

    const canViewUsers = useCallback(() => {
        // Basic checks
        if (!user || !userProfile || !userPermissions) return false;

        // Must be organization account
        if (userProfile.accountType !== 'organization') return false;

        // Must have team collaboration feature OR be admin
        if (!hasFeatureAccess('teamCollaboration') && !userPermissions.isAdmin) return false;

        // Check for read permissions
        return hasPermission('read_tests') || hasPermission('manage_users') || userPermissions.isAdmin;
    }, [user, userProfile, userPermissions, hasFeatureAccess, hasPermission]);

    const getPermissionMessage = useCallback(() => {
        if (!user) return "Please log in to access user management.";

        if (!userProfile) return "Loading user profile...";

        if (userProfile.accountType !== 'organization') {
            return "User management is only available for organization accounts.";
        }

        const userRole = getUserPrimaryRole();
        
        // Check if user can at least view users
        if (!canViewUsers()) {
            if (!hasFeatureAccess('teamCollaboration')) {
                if (subscriptionStatus?.isTrial) {
                    return `Team collaboration is available during your trial (${subscriptionStatus.trialDaysRemaining} days remaining).`;
                } else {
                    return "Team collaboration requires a premium subscription. Please upgrade to access user management.";
                }
            }
            return "You don't have permission to view user management.";
        }

        // If user can view but not manage
        if (!canManageUsers()) {
            if (!hasPermission('manage_users')) {
                return `You have read-only access to user management. Your role (${userRole}) doesn't include user management permissions.`;
            }
        }

        return null;
    }, [user, userProfile, getUserPrimaryRole, canViewUsers, canManageUsers, hasFeatureAccess, hasPermission, subscriptionStatus]);

    // Check permissions on component mount and when dependencies change
    useEffect(() => {
        const permissionMsg = getPermissionMessage();
        setPermissionError(permissionMsg);
        
        console.log('Permission check result:', {
            permissionError: permissionMsg,
            canView: canViewUsers(),
            canManage: canManageUsers(),
            userRole: getUserPrimaryRole(),
            accountType: userProfile?.accountType,
            permissions: userPermissions
        });
    }, [getPermissionMessage, canViewUsers, canManageUsers, getUserPrimaryRole, userProfile, userPermissions]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleDeleteUser = (userId) => {
        if (!canManageUsers()) {
            alert('You do not have permission to delete users.');
            return;
        }

        // Additional check: prevent deleting the last admin
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete?.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin' && u.id !== userId).length;
            if (adminCount === 0) {
                alert('Cannot delete the last administrator.');
                return;
            }
        }

        // Prevent self-deletion
        if (userId === user?.uid) {
            alert('You cannot delete your own account.');
            return;
        }

        setUsers(users.filter(user => user.id !== userId));
    };

    const handleUpdateUserRole = (userId, newRole) => {
        if (!canManageUsers()) {
            alert('You do not have permission to update user roles.');
            return;
        }

        // Additional check: prevent removing the last admin
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate?.role === 'admin' && newRole !== 'admin') {
            const adminCount = users.filter(u => u.role === 'admin' && u.id !== userId).length;
            if (adminCount === 0) {
                alert('Cannot remove admin role from the last administrator.');
                return;
            }
        }

        // Prevent self-demotion from admin
        if (userId === user?.uid && userToUpdate?.role === 'admin' && newRole !== 'admin') {
            alert('You cannot remove your own admin privileges.');
            return;
        }

        setUsers(users.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        ));
    };

    const handleResendInvite = async (userId) => {
        if (!canManageUsers()) {
            alert('You do not have permission to resend invites.');
            return;
        }

        try {
            setLoading(true);
            // Implement resend invite logic
            console.log('Resending invite for user:', userId);
        } catch (error) {
            console.error('Error resending invite:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteClick = () => {
        if (!canInviteUsers()) {
            const limits = getFeatureLimits();
            const currentMemberCount = users.filter(u => u.status === 'active').length;

            if (currentMemberCount >= limits?.teamMembers) {
                alert(`You've reached your team member limit (${limits.teamMembers}). Please upgrade to invite more users.`);
            } else {
                alert('You do not have permission to invite users.');
            }
            return;
        }

        // setShowInviteModal(true);
        console.log('Open invite modal');
    };

    // Render permission error state - but allow read-only access for viewers
    if (permissionError && !canViewUsers()) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                        {userProfile?.accountType !== 'organization' ? (
                            <Crown className="w-12 h-12 text-yellow-500" />
                        ) : !hasFeatureAccess('teamCollaboration') ? (
                            <Lock className="w-12 h-12 text-yellow-500" />
                        ) : (
                            <AlertTriangle className="w-12 h-12 text-yellow-500" />
                        )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Access Restricted
                    </h2>
                    <p className="text-gray-600 mb-4">
                        {permissionError}
                    </p>

                    {/* Show upgrade button for trial users */}
                    {subscriptionStatus?.isTrial && subscriptionStatus.trialDaysRemaining <= 0 && (
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                            Upgrade to Premium
                        </button>
                    )}

                    {/* Show trial info for active trial users */}
                    {subscriptionStatus?.isTrial && subscriptionStatus.trialDaysRemaining > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-800">
                                Trial Active: {subscriptionStatus.trialDaysRemaining} days remaining
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Get current usage info for limits display
    const limits = getFeatureLimits();
    const currentMemberCount = users.filter(u => u.status === 'active').length;
    const isReadOnly = !canManageUsers();

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        User Management
                        {isReadOnly && <span className="text-sm text-gray-500 ml-2">(Read Only)</span>}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {isReadOnly ? 'View your team members and their information' : 'Manage your team members and their permissions'}
                    </p>

                    {/* Usage info */}
                    {limits && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>
                                Team Members: {currentMemberCount} / {limits.teamMembers}
                            </span>
                            {subscriptionStatus?.isTrial && (
                                <span className="text-blue-600">
                                    Trial: {subscriptionStatus.trialDaysRemaining} days left
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {!isReadOnly && (
                    <button
                        onClick={handleInviteClick}
                        disabled={!canInviteUsers()}
                        className={`mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md ${canInviteUsers()
                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Invite Users
                        {!canInviteUsers() && limits && currentMemberCount >= limits.teamMembers && (
                            <span className="ml-1 text-xs">(Limit Reached)</span>
                        )}
                    </button>
                )}
            </div>

            {/* Read-only banner */}
            {isReadOnly && permissionError && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                            Limited Access
                        </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                        {permissionError}
                    </p>
                </div>
            )}

            {/* Trial Banner */}
            {subscriptionStatus?.showTrialBanner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                                Premium Trial Active
                            </span>
                        </div>
                        <span className="text-sm text-blue-600">
                            {subscriptionStatus.trialDaysRemaining} days remaining
                        </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                        You&apos;re currently enjoying premium features including team collaboration.
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                            <option value="all">All Roles</option>
                            {roles.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* User Stats */}
            <UserStats users={users} />

            {/* Users Table */}
            <UserTable
                users={filteredUsers}
                onDeleteUser={handleDeleteUser}
                onUpdateUserRole={handleUpdateUserRole}
                onResendInvite={handleResendInvite}
                loading={loading}
                canManageUsers={canManageUsers()}
                currentUserRole={getUserPrimaryRole()}
                currentUserId={user?.uid}
                isReadOnly={isReadOnly}
            />
        </div>
    );
};

export default UserManagementPage;