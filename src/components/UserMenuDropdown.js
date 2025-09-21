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
    ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const UserMenuDropdown = ({ setShowUserMenu }) => {
    const router = useRouter();
    const {
        state,
        actions,
        currentUser,
        activeSuite,
        profileSubscriptionActive
    } = useApp();

    const profileData = state.auth.profile;
    const accountType = state.auth.accountType;

    const getUserDisplayName = () => {
        if (profileData?.display_name?.trim()) return profileData.display_name.trim();
        if (profileData?.name?.trim()) return profileData.name.trim();
        if (currentUser?.displayName?.trim()) return currentUser.displayName.trim();
        if (currentUser?.name?.trim()) return currentUser.name.trim();

        if (currentUser?.firstName || currentUser?.lastName) {
            const firstName = currentUser.firstName || '';
            const lastName = currentUser.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) return fullName;
        }

        if (profileData?.first_name || profileData?.last_name) {
            const firstName = profileData.first_name || '';
            const lastName = profileData.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) return fullName;
        }

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
        router.push('/profile-settings');
        actions.ui.showNotification?.({
            id: 'profile-opened',
            type: 'info',
            message: 'Opening profile settings...',
            duration: 2000,
        });
    };

    const handleArchiveTrash = () => {
        setShowUserMenu(false);
        router.push('/archive-trash');
        actions.ui.showNotification?.({
            id: 'archive-opened',
            type: 'info',
            message: 'Opening archive & trash...',
            duration: 2000,
        });
    };

    const organizationInfo = getOrganizationInfo();
    const hasActiveSuite = Boolean(activeSuite?.id);

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

                    <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            {accountType === 'organization' ? 'Team Account' : 'Individual Account'}
                        </span>
                    </div>

                    {hasActiveSuite && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Active Suite:</span>
                            <div className="truncate">{activeSuite.name}</div>
                        </div>
                    )}
                </div>

                {/* Theme Switcher */}
                {/* <div className="px-3 flex justify-center">
                    <ThemeToggle variant="menu" hideText onlyIcons />
                </div> */}

                {/* Theme Switcher */}
                <div className="px-3 flex justify-center">
                    <ThemeToggle
                        variant="menu"
                        className="w-full justify-center"
                    />
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

                    {hasActiveSuite && (
                        <button
                            onClick={handleArchiveTrash}
                            className="w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors"
                            title="Manage archived and deleted items"
                        >
                            <ArchiveBoxIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            Archive & Trash
                        </button>
                    )}

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

                {!hasActiveSuite && (
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md">
                        <div className="flex items-center">
                            <ArchiveBoxIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>Select a test suite to access archive & trash</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMenuDropdown;