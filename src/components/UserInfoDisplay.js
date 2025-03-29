import React from 'react';
import UserAvatar from '../components/UserAvatar';
import { cn } from '../lib/utils';

const UserInfoDisplay = ({
    user,
    variant = 'compact',
    className
}) => {
    // Determine full name
    const fullName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.displayName || 'User';

    if (variant === 'compact') {
        return (
            <div className={cn('flex items-center space-x-2', className)}>
                <UserAvatar user={user} size="sm" />
                <div className="flex flex-col">
                    <p className="text-sm font-medium truncate">{fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'No email'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('flex items-center space-x-4', className)}>
            <UserAvatar user={user} size="lg" />
            <div>
                <h2 className="text-xl font-bold">{fullName}</h2>
                <p className="text-gray-600 dark:text-gray-300">{user?.jobRole || 'No job role'}</p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {user?.email && <div>{user.email}</div>}
                </div>
            </div>
        </div>
    );
};

export default UserInfoDisplay;