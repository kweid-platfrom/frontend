// components/profile/ProfileContent.js
import ProfileTab from '../profile/tabs/ProfileTab';
import SecurityTab from '../profile/tabs/SecurityTab';
import NotificationsTab from '../profile/tabs/NotificationsTab';
import SubscriptionTab from '../profile/tabs/SubscriptionTab';
import TeamManagementTab from '../profile/tabs/TeamManagementTab';

const ProfileContent = ({ activeTab, userProfile, updateUserProfile, permissions }) => {
    return (
        <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
                {activeTab === 'profile' && (
                    <ProfileTab 
                        userProfile={userProfile} 
                        updateUserProfile={updateUserProfile} 
                    />
                )}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'subscription' && (
                    <SubscriptionTab userProfile={userProfile} />
                )}
                {activeTab === 'team' && (
                    <TeamManagementTab userProfile={userProfile} permissions={permissions} />
                )}
            </div>
        </div>
    );
};

export default ProfileContent;