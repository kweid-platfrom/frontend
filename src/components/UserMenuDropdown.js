'use client';
import ThemeToggle from '@/components/common/ThemeToggle';
import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    BuildingOffice2Icon,
    LifebuoyIcon,
} from '@heroicons/react/24/outline';

const UserMenuDropdown = ({ currentUser, accountType, userRole, setActivePage, handleSignOut, setShowUserMenu, actions }) => {
    const getUserDisplayName = () => {
        if (currentUser?.displayName) return currentUser.displayName;
        if (currentUser?.email) {
            const emailName = currentUser.email.split('@')[0];
            return emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return 'User';
    };

    const handleSupport = () => {
        setShowUserMenu(false);
        window.open('https://support.example.com', '_blank');
        actions.ui.showNotification('info', 'Opening support page...', 2000);
    };

    return (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-theme-lg z-20">
            <div className="p-4 flex flex-col gap-4">
                {/* User Info */}
                <div className="px-3 py-2 text-sm border-b border-border">
                    <p className="font-medium text-card-foreground">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                    {accountType === 'organization' && (
                        <div className="flex items-center mt-1">
                            <BuildingOffice2Icon className="h-3 w-3 text-muted-foreground mr-1" />
                            <span className="text-xs text-muted-foreground">
                                Organization {userRole && `(${userRole})`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Theme Switcher */}
                <div className="px-3 flex justify-center">
                    <ThemeToggle variant="menu" hideText onlyIcons />
                </div>

                {/* Profile, Support, Sign Out */}
                <button
                    onClick={() => {
                        setShowUserMenu(false);
                        setActivePage?.('settings');
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    Profile
                </button>
                <button
                    onClick={handleSupport}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <LifebuoyIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    Support
                </button>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default UserMenuDropdown;