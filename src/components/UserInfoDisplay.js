'use client';

import React from 'react';
import UserAvatar from '../components/UserAvatar';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthProvider';

const UserInfoDisplay = ({ variant = 'compact', className }) => {
    const { userProfile, loading } = useAuth();

    if (loading || !userProfile) return null; // ✅ prevent early render

    const fullName =
        userProfile.displayName ||
        `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() ||
        'User';

    const email = userProfile.email || 'No email';

    if (variant === 'compact') {
        return (
            <div className={cn('flex items-center space-x-2', className)}>
                <UserAvatar size="sm" />
                <div className="flex flex-col">
                    <p className="text-sm font-medium truncate">{fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex items-center space-x-4', className)}>
            <UserAvatar size="lg" />
            <div>
                <h2 className="text-xl font-bold">{fullName}</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    {userProfile?.jobRole || 'No job role'}
                </p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {email && <div>{email}</div>}
                </div>
            </div>
        </div>
    );
};

export default UserInfoDisplay;
