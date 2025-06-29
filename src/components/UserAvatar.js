'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthProvider';
import { getUserDisplayName } from '../services/userService';

const UserAvatar = ({ size = 'md', className }) => {
    const { userProfile } = useAuth();

    const getInitials = (name) => {
        if (!name) return 'U';
        const nameParts = name.trim().split(' ');
        return nameParts.length === 1
            ? nameParts[0].charAt(0).toUpperCase()
            : nameParts[0].charAt(0).toUpperCase() +
            nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    // Use the helper function from userService to get display name
    const fullName = getUserDisplayName(userProfile);

    // Get avatar URL - handle both new and legacy formats
    const getAvatarUrl = () => {
        if (!userProfile) return null;
        
        // New format
        if (userProfile.profile_info?.avatar_url) {
            return userProfile.profile_info.avatar_url;
        }
        
        // Legacy format
        return userProfile.avatarURL || null;
    };

    const avatarUrl = getAvatarUrl();

    return (
        <div
            className={cn(
                'rounded-full bg-gradient-to-r from-accent-600 to-teal-700 flex items-center justify-center text-white font-medium',
                sizeClasses[size],
                className
            )}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={`${fullName}'s avatar`}
                    width={45}
                    height={45}
                    className="rounded-full object-cover"
                    priority
                />
            ) : (
                getInitials(fullName)
            )}
        </div>
    );
};

export default UserAvatar;