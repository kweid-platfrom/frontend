// components/profile/ProfileSidebar.js
import {
    UserIcon,
    ShieldCheckIcon,
    BellIcon,
    CreditCardIcon,
    UsersIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import { hasPermission, PERMISSIONS } from '../../services/permissionService';

const ProfileSidebar = ({ activeTab, setActiveTab, userProfile, permissions }) => {
    const tabs = [
        { id: 'profile', name: 'Profile', icon: UserIcon, permission: PERMISSIONS.VIEW_SETTINGS },
        { id: 'security', name: 'Security', icon: ShieldCheckIcon, permission: PERMISSIONS.VIEW_SETTINGS },
        { id: 'notifications', name: 'Notifications', icon: BellIcon, permission: PERMISSIONS.VIEW_SETTINGS },
        { id: 'subscription', name: 'Subscription', icon: CreditCardIcon, permission: PERMISSIONS.VIEW_SUBSCRIPTION },
        { id: 'team', name: 'Team Management', icon: UsersIcon, permission: PERMISSIONS.VIEW_USER_MANAGEMENT }
    ].filter(tab => hasPermission(userProfile, tab.permission));

    return (
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
            <nav className="p-4 space-y-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{tab.name}</span>
                    </button>
                ))}

                {/* Show disabled team management for individual accounts */}
                {!hasPermission(userProfile, PERMISSIONS.VIEW_USER_MANAGEMENT) && 
                 permissions.shouldShowUpgradePrompts.userManagement && (
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'team'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                    >
                        <UsersIcon className="h-4 w-4 flex-shrink-0" />
                        <span>Team Management</span>
                        <LockClosedIcon className="h-3 w-3 flex-shrink-0 ml-auto" />
                    </button>
                )}
            </nav>
        </div>
    );
};

export default ProfileSidebar;