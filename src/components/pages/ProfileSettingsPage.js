'use client'
import React from 'react';
import { useApp } from '@/context/AppProvider';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Import the separated components
import Profile from '../Profile';
import Settings from '../Settings';

// Main Profile Settings Page
const ProfileSettingsPage = () => {
    const { profileSubscriptionActive } = useApp();

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
                    <div className="flex items-center">
                        <p className="text-muted-foreground">Manage your account and preferences</p>
                        <div className="ml-4 flex items-center">
                            {profileSubscriptionActive ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-xs text-green-600">Synced</span>
                                </>
                            ) : (
                                <>
                                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="text-xs text-yellow-600">Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Profile Sections */}
                    <Profile />
                    
                    {/* Settings Sections */}
                    <Settings />
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;