
'use client';
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    BuildingOffice2Icon,
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
    PlusIcon,
    LifebuoyIcon,
    ArrowUpIcon,
} from '@heroicons/react/24/outline';

const UserMenuDropdown = ({ currentUser, accountType, userRole, setActivePage, handleSignOut, setShowUserMenu, actions }) => {
    const [theme, setTheme] = useState('system');
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

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        if (newTheme === 'system') {
            document.documentElement.classList.remove('dark', 'light');
        } else {
            document.documentElement.classList.remove('dark', 'light');
            document.documentElement.classList.add(newTheme);
        }
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
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3">
                {/* User Info */}
                <div className="px-3 py-2 text-sm border-b border-gray-200 mb-3">
                    <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                    {accountType === 'organization' && (
                        <div className="flex items-center mt-1">
                            <BuildingOffice2Icon className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-400">
                                Organization {userRole && `(${userRole})`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Accounts Section */}
                <div className="border-b border-gray-200 mb-3">
                    <p className="px-3 py-1 text-xs font-medium text-gray-600">Accounts</p>
                    {accounts.map((account) => (
                        <button
                            key={account.id}
                            onClick={() => handleSwitchAccount(account.id)}
                            className={`w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors ${
                                account.id === currentUser?.uid ? 'bg-gray-50' : ''
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
                        className="w-full flex items-center px-3 py-2 text-sm text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Account
                    </button>
                </div>

                {/* Theme Switcher */}
                <div className="border-b border-gray-200 mb-3">
                    <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-xs font-medium text-gray-600">Theme:</p>
                        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md">
                            {[
                                { value: 'light', icon: <SunIcon className="h-4 w-4" /> },
                                { value: 'dark', icon: <MoonIcon className="h-4 w-4" /> },
                                { value: 'system', icon: <ComputerDesktopIcon className="h-4 w-4" /> },
                            ].map(({ value, icon }) => (
                                <button
                                    key={value}
                                    onClick={() => handleThemeChange(value)}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        theme === value ? 'bg-teal-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                    title={value.charAt(0).toUpperCase() + value.slice(1)}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profile, Support, Upgrade, Sign Out */}
                <button
                    onClick={() => {
                        setShowUserMenu(false);
                        setActivePage?.('settings');
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Profile
                </button>
                <button
                    onClick={handleSupport}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <LifebuoyIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Support
                </button>
                {needsUpgrade && (
                    <button
                        onClick={handleUpgrade}
                        className="w-full flex items-center px-3 py-2 text-sm text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                    >
                        <ArrowUpIcon className="h-4 w-4 mr-2" />
                        Upgrade
                    </button>
                )}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default UserMenuDropdown;