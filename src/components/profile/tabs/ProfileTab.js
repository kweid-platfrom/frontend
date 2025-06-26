// components/UserProfile/ProfileTab.js
import React from 'react';
import {
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    EnvelopeIcon,
    DevicePhoneMobileIcon,
    BuildingOfficeIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

const ProfileTab = ({
    userProfile,
    isEditing,
    isSaving,
    editForm,
    setEditForm,
    startEditing,
    cancelEditing,
    saveProfile
}) => {
    return (
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
    );
};

export default ProfileTab;