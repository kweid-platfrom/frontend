'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthProvider';

const UserAvatar = ({ size = 'md', className }) => {
    const { userProfile } = useAuth(); // ✅ Get authenticated user profile

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

    const fullName =
        userProfile?.firstName && userProfile?.lastName
            ? `${userProfile.firstName} ${userProfile.lastName}`
            : userProfile?.displayName || 'User';

    return (
        <div
            className={cn(
                'rounded-full bg-[#00897b] flex items-center justify-center text-white font-medium',
                sizeClasses[size],
                className
            )}
        >
            {userProfile?.avatarURL ? (
                <Image
                    src={userProfile.avatarURL}
                    alt={`${fullName}'s avatar`}
                    width={48}
                    height={48}
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
