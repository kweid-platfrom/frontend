import React, { useState, useRef, useEffect } from "react";
import { UserCircle, Settings, CreditCard, Building } from "lucide-react";

const UserAvatar = ({ user, size = 40 }) => {
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleUserDropdown = () => {
        setShowUserDropdown(!showUserDropdown);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleUserDropdown}
                className="flex items-center focus:outline-none"
            >
                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt={user.name}
                        className={`w-${size / 4} h-${size / 4} rounded-full`}
                        style={{ width: `${size}px`, height: `${size}px` }}
                    />
                ) : (
                    <UserCircle size={size} />
                )}
            </button>

            {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border">
                    <div className="p-3 border-b">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <ul>
                        <li className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <Settings size={18} className="mr-2" />
                            <span>Settings</span>
                        </li>
                        <li className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <CreditCard size={18} className="mr-2" />
                            <span>Subscription: {user.subscription}</span>
                        </li>
                        <li className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <Building size={18} className="mr-2" />
                            <span>Company: {user.company}</span>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserAvatar;