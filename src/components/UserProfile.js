// components/pages/UserProfile.js
'use client'
import { useState } from 'react';
import { useSuite } from '../context/SuiteContext';
import '../app/globals.css'
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileContent from '../components/profile/ProfileContent';
import { getUserPermissions } from '../services/permissionService';

const UserProfile = () => {
    const { userProfile, updateUserProfile } = useSuite();
    const [activeTab, setActiveTab] = useState('profile');
    const permissions = getUserPermissions(userProfile);

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <ProfileHeader userProfile={userProfile} />
            
            <div className="flex-1 flex overflow-hidden">
                <ProfileSidebar 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userProfile={userProfile}
                    permissions={permissions}
                />
                
                <ProfileContent 
                    activeTab={activeTab}
                    userProfile={userProfile}
                    updateUserProfile={updateUserProfile}
                    permissions={permissions}
                />
            </div>
        </div>
    );
};

export default UserProfile;