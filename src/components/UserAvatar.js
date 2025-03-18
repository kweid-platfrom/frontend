"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "@/components/auth/SignOutButton";
import { User, Settings, HelpCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const UserAvatarDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const { user } = useAuth(); // Get the authenticated user from Firebase

    // Generate initials from user's name
    const getInitials = (name) => {
        if (!name) return "U";
        const nameParts = name.trim().split(" ");
        return nameParts.length === 1
            ? nameParts[0].charAt(0).toUpperCase()
            : nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    };

    // Close dropdown when clicking outside
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
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 focus:outline-none"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {user?.photoURL ? (
                    <Image
                        src={user.photoURL}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                        priority
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[#00897b] flex items-center justify-center text-white font-medium">
                        {getInitials(user?.displayName || "User")}
                    </div>
                )}
                <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200 min-w-[200px]"
                >
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
                    </div>

                    <div className="py-1">
                        <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <User size={16} className="mr-3 text-gray-500" />
                            Profile
                        </Link>
                        <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Settings size={16} className="mr-3 text-gray-500" />
                            Settings
                        </Link>
                        <Link href="/help" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <HelpCircle size={16} className="mr-3 text-gray-500" />
                            Help Center
                        </Link>
                    </div>

                    <div className="py-1 border-t border-gray-100">
                        <button
                            onClick={() => console.log("Logout clicked")}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            <SignOutButton variant="text" />
                            <span className="ml-2">Sign out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAvatarDropdown;
