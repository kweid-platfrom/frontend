// components/pages/UserProfile.js
'use client'
import { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import '../app/globals.css'
import {
    CameraIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    KeyIcon,
    BellIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    EnvelopeIcon,
    UserIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    StarIcon,
    ExclamationTriangleIcon,
    UsersIcon,
    LockClosedIcon,
    ArrowUpCircleIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../components/userManagement/UserManagement';
import { getUserPermissions, hasPermission, PERMISSIONS } from '../services/permissionService';

const UserProfile = () => {
    const { userProfile, updateUserProfile } = useProject();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        timezone: '',
        bio: ''
    });
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        projectUpdates: true,
        bugAlerts: true,
        weeklyReports: false,
        marketingEmails: false
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const fileInputRef = useRef(null);

    // Get user permissions
    const permissions = getUserPermissions(userProfile);

    // Initialize edit form when editing starts
    const startEditing = () => {
        setEditForm({
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            displayName: userProfile?.displayName || '',
            email: userProfile?.email || '',
            phone: userProfile?.phone || '',
            company: userProfile?.company || '',
            jobTitle: userProfile?.jobTitle || '',
            timezone: userProfile?.timezone || 'UTC',
            bio: userProfile?.bio || ''
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile(editForm);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('Uploading image:', file);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        console.log('Changing password');
        setShowPasswordForm(false);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    // Get user display name with fallback
    const getUserDisplayName = () => {
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`;
        }
        if (userProfile?.displayName) return userProfile.displayName;
        if (userProfile?.name) return userProfile.name;
        if (userProfile?.email) {
            const emailName = userProfile.email.split('@')[0];
            return emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return 'User';
    };

    // Get user initials
    const getUserInitials = () => {
        const displayName = getUserDisplayName();
        if (!displayName || displayName === 'User') return 'U';

        const nameParts = displayName.trim().split(' ');
        return nameParts.length === 1
            ? nameParts[0].charAt(0).toUpperCase()
            : nameParts[0].charAt(0).toUpperCase() +
            nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    };

    const getSubscriptionInfo = () => {
        const { subscriptionType } = userProfile || {};
        const subscriptionData = {
            free: {
                name: 'Free Plan',
                color: 'bg-gray-100 text-gray-800',
                features: ['1 Project', 'Basic Bug Tracking', 'Community Support']
            },
            individual: {
                name: 'Individual Plan',
                color: 'bg-teal-100 text-teal-800',
                features: ['1 Project', 'Advanced Features', 'Email Support']
            },
            team: {
                name: 'Team Plan',
                color: 'bg-green-100 text-green-800',
                features: ['5 Projects', 'Team Collaboration', 'Priority Support']
            },
            enterprise: {
                name: 'Enterprise Plan',
                color: 'bg-purple-100 text-purple-800',
                features: ['Unlimited Projects', 'Advanced Analytics', '24/7 Support']
            }
        };
        return subscriptionData[subscriptionType] || subscriptionData.free;
    };

    // Updated tabs with permission checks
    const tabs = [
        { id: 'profile', name: 'Profile', icon: UserIcon, permission: PERMISSIONS.VIEW_SETTINGS },
        { id: 'security', name: 'Security', icon: ShieldCheckIcon, permission: PERMISSIONS.VIEW_SETTINGS },
        { id: 'notifications', name: 'Notifications', icon: BellIcon, permission: PERMISSIONS.VIEW_SETTINGS },
        { id: 'subscription', name: 'Subscription', icon: CreditCardIcon, permission: PERMISSIONS.VIEW_SUBSCRIPTION },
        { id: 'team', name: 'Team Management', icon: UsersIcon, permission: PERMISSIONS.VIEW_USER_MANAGEMENT }
    ].filter(tab => hasPermission(userProfile, tab.permission));

    // Upgrade to Organization Component
    const UpgradeToOrganizationBanner = ({ feature }) => (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md mx-auto p-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockClosedIcon className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Organization Account Required
                </h3>
                <p className="text-gray-600 mb-6">
                    {feature} is only available for organization accounts. Upgrade to unlock team collaboration features.
                </p>
                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Manage team members
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Invite unlimited users
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Role-based permissions
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Advanced collaboration tools
                    </div>
                </div>
                <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200 flex items-center justify-center">
                    <ArrowUpCircleIcon className="h-5 w-5 mr-2" />
                    Upgrade to Organization
                </button>
                <p className="text-xs text-gray-500 mt-3">
                    30-day free trial • Cancel anytime
                </p>
            </div>
        </div>
    );

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg mt-4 mb-4 overflow-hidden">
                        <div className="h-24 relative"></div>
                        <div className="relative px-6 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-12">
                                {/* Profile Picture */}
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-full bg-white p-2 shadow-lg">
                                        <div className="h-full w-full rounded-full bg-gradient-to-r from-teal-600 to-teal-700 flex items-center justify-center text-white text-xl font-bold">
                                            {getUserInitials()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 p-1.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                                    >
                                        <CameraIcon className="h-3 w-3 text-gray-600" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>

                                {/* User Info */}
                                <div className="flex-1 mt-4 sm:mt-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h1 className="text-xl font-bold text-gray-900">
                                                {getUserDisplayName()}
                                            </h1>
                                            <p className="text-gray-600 text-sm">{userProfile.email}</p>
                                            {userProfile.jobTitle && userProfile.company && (
                                                <p className="text-gray-500 text-xs mt-1">
                                                    {userProfile.jobTitle} at {userProfile.company}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-3 sm:mt-0">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getSubscriptionInfo().color}`}>
                                                <StarIcon className="h-3 w-3 mr-1" />
                                                {getSubscriptionInfo().name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
                    <nav className="p-4 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                <span>{tab.name}</span>
                            </button>
                        ))}

                        {/* Show disabled team management for individual accounts */}
                        {!hasPermission(userProfile, PERMISSIONS.VIEW_USER_MANAGEMENT) && permissions.shouldShowUpgradePrompts.userManagement && (
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'team'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                    }`}
                            >
                                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                                <span>Team Management</span>
                                <LockClosedIcon className="h-3 w-3 flex-shrink-0 ml-auto" />
                            </button>
                        )}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                                    {!isEditing ? (
                                        <button
                                            onClick={startEditing}
                                            className="flex items-center space-x-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                            <span>Edit</span>
                                        </button>
                                    ) : (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={cancelEditing}
                                                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                                <span>Cancel</span>
                                            </button>
                                            <button
                                                onClick={saveProfile}
                                                disabled={isSaving}
                                                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                                <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <p className="text-gray-900 py-2">{userProfile.firstName || 'Not set'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <p className="text-gray-900 py-2">{userProfile.lastName || 'Not set'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Display Name
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.displayName}
                                                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <p className="text-gray-900 py-2">{userProfile.displayName || 'Not set'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                            <p className="text-gray-900 py-2">{userProfile.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />
                                                <p className="text-gray-900 py-2">{userProfile.phone || 'Not set'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.company}
                                                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                                <p className="text-gray-900 py-2">{userProfile.company || 'Not set'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Job Title
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.jobTitle}
                                                onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        ) : (
                                            <p className="text-gray-900 py-2">{userProfile.jobTitle || 'Not set'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Timezone
                                        </label>
                                        {isEditing ? (
                                            <select
                                                value={editForm.timezone}
                                                onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            >
                                                <option value="UTC">UTC</option>
                                                <option value="America/New_York">Eastern Time</option>
                                                <option value="America/Chicago">Central Time</option>
                                                <option value="America/Denver">Mountain Time</option>
                                                <option value="America/Los_Angeles">Pacific Time</option>
                                                <option value="Europe/London">London</option>
                                                <option value="Europe/Paris">Paris</option>
                                                <option value="Asia/Tokyo">Tokyo</option>
                                            </select>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                                                <p className="text-gray-900 py-2">{userProfile.timezone || 'UTC'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bio
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            rows={4}
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            placeholder="Tell us about yourself..."
                                        />
                                    ) : (
                                        <p className="text-gray-900 py-2">{userProfile.bio || 'No bio added yet.'}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h2>
                                <p className="text-sm text-gray-600 mb-6">Secure your account access</p>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Password</h3>
                                            <p className="text-sm text-gray-500 mt-1">Last updated 30 days ago</p>
                                        </div>
                                        <button
                                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <KeyIcon className="h-4 w-4" />
                                            <span>Change Password</span>
                                        </button>
                                    </div>
                                </div>

                                {showPasswordForm && (
                                    <form onSubmit={handlePasswordChange} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 mb-6">
                                        <h3 className="font-medium text-gray-900">Change Password</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                            >
                                                Update Password
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordForm(false)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">Account Security</h3>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                We recommend enabling two-factor authentication for enhanced security.
                                            </p>
                                            <button className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900">
                                                Enable 2FA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h2>
                                <p className="text-sm text-gray-600 mb-6">Manage how you receive notifications</p>

                                <div className="space-y-6">
                                    {Object.entries(notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {key === 'emailNotifications' && <EnvelopeIcon className="h-5 w-5 text-gray-400" />}
                                                    {key === 'pushNotifications' && <BellIcon className="h-5 w-5 text-gray-400" />}
                                                    {key === 'projectUpdates' && <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />}
                                                    {key === 'bugAlerts' && <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />}
                                                    {key === 'weeklyReports' && <CalendarIcon className="h-5 w-5 text-gray-400" />}
                                                    {key === 'marketingEmails' && <StarIcon className="h-5 w-5 text-gray-400" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {key === 'emailNotifications' && 'Email Notifications'}
                                                        {key === 'pushNotifications' && 'Push Notifications'}
                                                        {key === 'projectUpdates' && 'Project Updates'}
                                                        {key === 'bugAlerts' && 'Bug Alerts'}
                                                        {key === 'weeklyReports' && 'Weekly Reports'}
                                                        {key === 'marketingEmails' && 'Marketing Emails'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {key === 'emailNotifications' && 'Receive notifications via email'}
                                                        {key === 'pushNotifications' && 'Receive push notifications in browser'}
                                                        {key === 'projectUpdates' && 'Get notified about project changes'}
                                                        {key === 'bugAlerts' && 'Receive alerts for new bugs'}
                                                        {key === 'weeklyReports' && 'Get weekly summary reports'}
                                                        {key === 'marketingEmails' && 'Receive product updates and tips'}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                                        Save Notification Preferences
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Subscription Tab */}
                        {activeTab === 'subscription' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Details</h2>
                                <p className="text-sm text-gray-600 mb-6">View and manage your subscription</p>

                                <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {getSubscriptionInfo().name}
                                            </h3>
                                            <p className="text-gray-600 mt-1">
                                                {userProfile.subscriptionType === 'free' ? 'Free forever' : '$29/month'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionInfo().color}`}>
                                                <StarIcon className="h-4 w-4 mr-1" />
                                                Current Plan
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Features included:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {getSubscriptionInfo().features.map((feature, index) => (
                                                <div key={index} className="flex items-center text-sm text-gray-600">
                                                    <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {userProfile.subscriptionType === 'free' && (
                                        <div className="mt-6 pt-4 border-t border-gray-200">
                                            <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200">
                                                Upgrade to Team Plan
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {userProfile.subscriptionType !== 'free' && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-medium text-gray-900">Next billing date</h3>
                                                <p className="text-sm text-gray-500">January 15, 2025</p>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <CalendarIcon className="h-4 w-4" />
                                                <span>Auto-renewal enabled</span>
                                            </div>
                                        </div>

                                        <div className="flex space-x-3">
                                            <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                Manage Billing
                                            </button>
                                            <button className="flex-1 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                                                Cancel Subscription
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="font-medium text-gray-900 mb-4">Usage Statistics</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-teal-600">2</div>
                                            <div className="text-sm text-gray-500">Active Projects</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-teal-600">47</div>
                                            <div className="text-sm text-gray-500">Test Cases</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">12</div>
                                            <div className="text-sm text-gray-500">Open Bugs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">156</div>
                                            <div className="text-sm text-gray-500">Tests Run</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Management Tab */}
                        {activeTab === 'team' && (
                            <div className="space-y-6">
                                {hasPermission(userProfile, PERMISSIONS.VIEW_USER_MANAGEMENT) ? (
                                    <UserManagement />
                                ) : (
                                    <UpgradeToOrganizationBanner feature="Team Management" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
