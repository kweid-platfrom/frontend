'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppProvider';
import ThemeToggle from '@/components/common/ThemeToggle';
import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    BuildingOffice2Icon,
    LifebuoyIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const UserMenuDropdown = ({ setShowUserMenu }) => {
    const router = useRouter();
    const { 
        state, 
        actions, 
        currentUser, 
        profileSubscriptionActive 
    } = useApp();

    const profileData = state.auth.profile;
    const accountType = state.auth.accountType;

    const getUserDisplayName = () => {

        // Priority order for display name
        if (profileData?.display_name?.trim()) return profileData.display_name.trim();
        if (profileData?.name?.trim()) return profileData.name.trim();
        if (currentUser?.displayName?.trim()) return currentUser.displayName.trim();
        if (currentUser?.name?.trim()) return currentUser.name.trim();
        
        // Try currentUser first/last name (from enhanced user object)
        if (currentUser?.firstName || currentUser?.lastName) {
            const firstName = currentUser.firstName || '';
            const lastName = currentUser.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) return fullName;
        }
        
        // Fallback to profile first + last name
        if (profileData?.first_name || profileData?.last_name) {
            const firstName = profileData.first_name || '';
            const lastName = profileData.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) return fullName;
        }
        
        // Fallback to email-based name
        const email = profileData?.email || currentUser?.email;
        if (email) {
            const emailName = email.split('@')[0];
            return emailName
                .replace(/[._-]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        
        return 'User';
    };

    const getUserEmail = () => {
        return profileData?.email || currentUser?.email || '';
    };

    const getOrganizationInfo = () => {
        if (accountType !== 'organization') return null;
        
        return {
            name: profileData?.organizationName || currentUser?.organizationName || 'Organization',
            role: profileData?.role || currentUser?.role || 'member'
        };
    };

    const handleSignOut = async () => {
        try {
            setShowUserMenu(false);
            
            actions.ui.showNotification?.({
                id: 'signing-out',
                type: 'info',
                message: 'Signing out...',
                duration: 2000,
            });

            await actions.auth.logout();
            
            actions.ui.showNotification?.({
                id: 'signed-out',
                type: 'success',
                message: 'Successfully signed out',
                duration: 3000,
            });
        } catch (error) {
            console.error('Sign out error:', error);
            actions.ui.showNotification?.({
                id: 'signout-error',
                type: 'error',
                message: 'Failed to sign out',
                description: error.message,
                duration: 5000,
            });
        }
    };

    const handleSupport = () => {
        setShowUserMenu(false);
        // Navigate to support page using Next.js router
        router.push('/support');
        
        actions.ui.showNotification?.({
            id: 'support-opened',
            type: 'info',
            message: 'Opening support page...',
            duration: 2000,
        });
    };

    const handleProfile = () => {
        setShowUserMenu(false);
        // Navigate to profile/settings page using Next.js router
        router.push('/profile-settings');
        
        actions.ui.showNotification?.({
            id: 'profile-opened',
            type: 'info',
            message: 'Opening profile settings...',
            duration: 2000,
        });
    };

    const organizationInfo = getOrganizationInfo();

    return (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-theme-lg z-20">
            <div className="p-4 flex flex-col gap-4">
                {/* User Info */}
                <div className="px-3 py-2 text-sm border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-card-foreground truncate">
                                {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {getUserEmail()}
                            </p>
                        </div>
                        
                        {/* Profile sync status indicator */}
                        <div className="flex-shrink-0 ml-2">
                            {profileSubscriptionActive ? (
                                <CheckCircleIcon 
                                    className="h-4 w-4 text-green-500" 
                                    title="Profile synced"
                                />
                            ) : (
                                <ExclamationTriangleIcon 
                                    className="h-4 w-4 text-yellow-500" 
                                    title="Profile sync offline"
                                />
                            )}
                        </div>
                    </div>
                    
                    {/* Organization info */}
                    {organizationInfo && (
                        <div className="flex items-center mt-2">
                            <BuildingOffice2Icon className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                                {organizationInfo.name}
                                {organizationInfo.role && (
                                    <span className="ml-1">({organizationInfo.role})</span>
                                )}
                            </span>
                        </div>
                    )}
                    
                    {/* Account type indicator */}
                    <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            {accountType === 'organization' ? 'Team Account' : 'Individual Account'}
                        </span>
                    </div>
                </div>

                {/* Theme Switcher */}
                <div className="px-3 flex justify-center">
                    <ThemeToggle variant="menu" hideText onlyIcons />
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                    <button
                        onClick={handleProfile}
                        className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        Profile & Settings
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
                        className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors border-t border-border mt-2 pt-3"
                    >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserMenuDropdown;