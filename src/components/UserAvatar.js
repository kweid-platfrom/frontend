import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Assume you have a utility for class name merging

const UserAvatar = ({
    user,
    size = 'md',
    className
}) => {
    // Generate initials from name
    const getInitials = (name) => {
        if (!name) return 'U';
        const nameParts = name.trim().split(' ');
        return nameParts.length === 1
            ? nameParts[0].charAt(0).toUpperCase()
            : nameParts[0].charAt(0).toUpperCase() +
            nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    };

    // Determine avatar size classes
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    // Determine full name or fallback
    const fullName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.displayName || 'User';

    return (
        <div
            className={cn(
                'rounded-full bg-[#00897b] flex items-center justify-center text-white font-medium',
                sizeClasses[size],
                className
            )}
        >
            {user?.photoURL ? (
                <Image
                    src={user.photoURL}
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