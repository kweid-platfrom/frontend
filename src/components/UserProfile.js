// components/pages/UserProfile.js
'use client'
import { useState } from 'react';
import { useUserProfile } from '../context/userProfileContext';
import { useSuite } from '../context/SuiteContext';
import '../app/globals.css'
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileContent from '../components/profile/ProfileContent';
import { getUserPermissions } from '../services/permissionService';

const UserProfile = () => {
    // Fixed: Get userProfile and updateProfile from useUserProfile context
    const { 
        userProfile, 
        updateProfile, 
        isLoading, 
        error,
        displayName,
        email,
        accountType,
        isAdmin,
        currentAccount,
        hasAdminPermission
    } = useUserProfile();
    
    // Access suite context for suite-related functionality
    const { 
        activeSuite, 
        suites, 
        canCreateSuite,
        getFeatureLimits 
    } = useSuite();
    
    const [activeTab, setActiveTab] = useState('profile');
    const permissions = getUserPermissions(userProfile);

    // Show loading state while profile is being fetched
    if (isLoading || !userProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                {isLoading && (
                    <span className="ml-3 text-gray-600">Loading profile...</span>
                )}
            </div>
        );
    }

    // Show error state if there's an error loading the profile
    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-500 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loading Profile</h3>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <ProfileHeader 
                userProfile={userProfile}
                displayName={displayName}
                email={email}
                accountType={accountType}
            />
            
            <div className="flex-1 flex overflow-hidden">
                <ProfileSidebar 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userProfile={userProfile}
                    permissions={permissions}
                    isAdmin={isAdmin}
                    hasAdminPermission={hasAdminPermission}
                />
                
                <ProfileContent 
                    activeTab={activeTab}
                    userProfile={userProfile}
                    updateUserProfile={updateProfile} // Fixed: Use updateProfile from useUserProfile
                    permissions={permissions}
                    currentAccount={currentAccount}
                    accountType={accountType}
                    isAdmin={isAdmin}
                    // Suite context data
                    activeSuite={activeSuite}
                    suites={suites}
                    canCreateSuite={canCreateSuite}
                    getFeatureLimits={getFeatureLimits}
                />
            </div>
        </div>
    );
};

export default UserProfile;