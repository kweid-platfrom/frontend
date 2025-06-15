// components/layout/UserProfile.js
'use client'
import { useProject } from '../../context/ProjectContext';
import SignOutButton from '../auth/SignOutButton';

const UserAvatarClip = ({ isCollapsed }) => {
    const { userProfile } = useProject();

    // Get user display name with proper fallback logic
    const getUserDisplayName = () => {
        // Priority: firstName + lastName > displayName > name > extract from email > 'User'
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`;
        }
        if (userProfile?.displayName) return userProfile.displayName;
        if (userProfile?.name) return userProfile.name;
        if (userProfile?.email) {
            // Extract name from email (part before @)
            const emailName = userProfile.email.split('@')[0];
            // Convert to title case and replace dots/underscores with spaces
            return emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return 'User';
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        const displayName = getUserDisplayName();
        if (!displayName || displayName === 'User') return 'U';

        const nameParts = displayName.trim().split(' ');
        return nameParts.length === 1
            ? nameParts[0].charAt(0).toUpperCase()
            : nameParts[0].charAt(0).toUpperCase() +
            nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    };

    if (!userProfile) return null;

    return (
        <div className={`p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <div className="relative group">
                <div className={`w-full flex items-center p-2 rounded-xl hover:bg-gray-50/80 transition-all duration-200 ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
                    <div className="min-w-0 flex-1 flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-accent-600 to-teal-700 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                <span className="text-sm font-bold text-white">
                                    {getUserInitials()}
                                </span>
                            </div>
                        </div>
                        <div className={`ml-3 min-w-0 transition-all duration-300 ease-out ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {userProfile.email}
                            </p>
                        </div>
                    </div>

                    {/* Sign Out Icon Button */}
                    <div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100 w-auto'}`}>
                        <SignOutButton variant="icon" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" />
                    </div>
                </div>

                {/* Collapsed state tooltip for user profile */}
                {isCollapsed && (
                    <div className="hidden group-hover:block absolute left-full bottom-4 ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none transition-all duration-200">
                        <div className="font-medium">{getUserDisplayName()}</div>
                        <div className="text-xs opacity-75">{userProfile.email}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAvatarClip;