// components/Sidebar.jsx
import React from 'react';
import {
    User,
    Bell,
    Shield,
    Building,
    Palette,
    UploadCloud
} from 'lucide-react';
import Image from 'next/image';

const Sidebar = ({ user, activeSection, onSectionChange, onAvatarUpload }) => {
    // Generate avatar initials if no avatar URL exists
    const getInitials = () => {
        if (user.name) {
            const nameParts = user.name.split(' ');
            if (nameParts.length >= 2) {
                return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
            }
            return nameParts[0][0].toUpperCase();
        }
        return 'U';
    };

    const navItems = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'organization', icon: Building, label: 'Organization' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'theme', icon: Palette, label: 'Theme' },
        { id: 'security', icon: Shield, label: 'Security' },
    ];

    return (
        <div className="md:w-1/4 bg-gray-50 p-6 border-r">
            <div className="relative w-32 h-32 mx-auto mb-4">
                {user.avatarUrl ? (
                    <Image
                        src={user.avatarUrl}
                        alt="Profile"
                        fill
                        className="rounded-full object-cover border-4 border-white shadow"
                        sizes="(max-width: 768px) 100vw, 128px"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-[#00897b] text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow">
                        {getInitials()}
                    </div>
                )}
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[#00897b] text-white p-2 rounded-full cursor-pointer shadow-md z-10">
                    <UploadCloud size={16} />
                    <input
                        id="avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={onAvatarUpload}
                    />
                </label>
            </div>
            
            <div className="text-center mb-4">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.role}</p>
            </div>
            
            <nav>
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button 
                                type="button"
                                onClick={() => onSectionChange(item.id)}
                                className={`w-full flex items-center p-2 rounded hover:bg-gray-200 ${
                                    activeSection === item.id 
                                        ? 'text-[#00897b] font-medium bg-gray-200' 
                                        : 'text-gray-700'
                                }`}
                            >
                                <item.icon size={18} className="mr-2" />
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;