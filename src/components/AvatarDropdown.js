'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider'; // ✅ Update to actual path
import UserAvatar from '@/components/UserAvatar';

const UserAvatarDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const { userProfile, signOut } = useAuth(); // ✅ destructure signOut

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!userProfile) return null; // ✅ Prevents crash on first render

    const fullName = userProfile.displayName || 'User'; // ✅ Trust displayName from Firestore
    const email = userProfile.email || 'No email';

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 focus:outline-none"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <UserAvatar size="sm" />
                <ChevronDown
                    size={16}
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200"
                >
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3">
                        <UserAvatar size="md" />
                        <div className="flex flex-col truncate">
                            <span className="font-semibold text-sm truncate">{fullName}</span>
                            <span className="text-xs text-gray-500 truncate">{email}</span>
                        </div>
                    </div>

                    <div className="py-1">
                        <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <User size={16} className="mr-3 text-gray-500" />
                            Profile
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <Settings size={16} className="mr-3 text-gray-500" />
                            Settings
                        </Link>
                        <Link
                            href="/help"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <HelpCircle size={16} className="mr-3 text-gray-500" />
                            Help Center
                        </Link>
                    </div>

                    <div className="py-1 border-t border-gray-100">
                        <button
                            onClick={signOut}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            <span className="ml-2">Sign out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAvatarDropdown;
