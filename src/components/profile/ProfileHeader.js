// components/profile/ProfileHeader.js
'use client';
import { useRef } from 'react';
import { CameraIcon, StarIcon } from '@heroicons/react/24/outline';

const ProfileHeader = ({ userProfile }) => {
    const fileInputRef = useRef(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('Uploading image:', file);
        }
    };

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
            free: { name: 'Free Plan', color: 'bg-gray-100 text-gray-800' },
            individual: { name: 'Individual Plan', color: 'bg-teal-100 text-teal-800' },
            team: { name: 'Team Plan', color: 'bg-green-100 text-green-800' },
            enterprise: { name: 'Enterprise Plan', color: 'bg-purple-100 text-purple-800' }
        };
        return subscriptionData[subscriptionType] || subscriptionData.free;
    };

    return (
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
    );
};

export default ProfileHeader