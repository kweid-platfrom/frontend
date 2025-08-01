'use client';
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import ThemeToggle from '@/components/common/ThemeToggle'; // Import the ThemeToggle component
import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    BuildingOffice2Icon,
    PlusIcon,
    LifebuoyIcon,
    ArrowUpIcon,
} from '@heroicons/react/24/outline';

const UserMenuDropdown = ({ currentUser, accountType, userRole, setActivePage, handleSignOut, setShowUserMenu, actions }) => {
    const [accounts, setAccounts] = useState([{ id: currentUser?.uid, email: currentUser?.email }]);

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

    const handleAddAccount = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const newUser = result.user;
            setAccounts([...accounts, { id: newUser.uid, email: newUser.email }]);
            actions.ui.showNotification('success', 'Account added successfully', 2000);
        } catch (error) {
            console.error('Error adding account:', error);
            actions.ui.showError('Failed to add account. Please try again.');
        }
    };

    const handleSwitchAccount = (accountId) => {
        actions.auth.switchAccount(accountId);
        setShowUserMenu(false);
        actions.ui.showNotification('info', 'Switched account', 2000);
    };

    const handleSupport = () => {
        setShowUserMenu(false);
        window.open('https://support.example.com', '_blank'); // Replace with actual support URL
        actions.ui.showNotification('info', 'Opening support page...', 2000);
    };

    const handleUpgrade = () => {
        setShowUserMenu(false);
        setActivePage?.('upgrade');
        actions.ui.showNotification('info', 'Opening upgrade page...', 2000);
    };

    // Determine if user needs upgrade (e.g., not on premium plan)
    const needsUpgrade = accountType !== 'premium';

    return (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-theme-lg z-20">
            <div className="p-3">
                {/* User Info */}
                <div className="px-3 py-2 text-sm border-b border-border mb-3">
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

                {/* Accounts Section */}
                <div className="border-b border-border mb-3">
                    <p className="px-3 py-1 text-xs font-medium text-muted-foreground">Accounts</p>
                    {accounts.map((account) => (
                        <button
                            key={account.id}
                            onClick={() => handleSwitchAccount(account.id)}
                            className={`w-full flex items-center px-3 py-2 text-sm text-card-foreground hover:bg-muted rounded-md transition-colors ${
                                account.id === currentUser?.uid ? 'bg-muted' : ''
                            }`}
                        >
                            <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs mr-2">
                                {(account.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{account.email}</span>
                        </button>
                    ))}
                    <button
                        onClick={handleAddAccount}
                        className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Account
                    </button>
                </div>

                {/* Theme Switcher - Using the reusable ThemeToggle component */}
                <div className="border-b border-border mb-3">
                    <ThemeToggle variant="menu" />
                </div>

                {/* Profile, Support, Upgrade, Sign Out */}
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
                {needsUpgrade && (
                    <button
                        onClick={handleUpgrade}
                        className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                    >
                        <ArrowUpIcon className="h-4 w-4 mr-2" />
                        Upgrade
                    </button>
                )}
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