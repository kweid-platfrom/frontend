// components/userProfile/tabs/TeamManagementTab.js
'use client'
import {
    LockClosedIcon,
    ArrowUpCircleIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import UserManagement from '../../userManagement/UserManagement';

const TeamManagementTab = ({ hasUserManagementPermission }) => {
    const UpgradeToOrganizationBanner = ({ feature }) => (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md mx-auto p-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LockClosedIcon className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Organization Account Required
                </h3>
                <p className="text-gray-600 mb-6">
                    {feature} is only available for organization accounts. Upgrade to unlock team collaboration features.
                </p>
                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Manage team members
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Invite unlimited users
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Role-based permissions
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                        Advanced collaboration tools
                    </div>
                </div>
                <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200 flex items-center justify-center">
                    <ArrowUpCircleIcon className="h-5 w-5 mr-2" />
                    Upgrade to Organization
                </button>
                <p className="text-xs text-gray-500 mt-3">
                    30-day free trial • Cancel anytime
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {hasUserManagementPermission ? (
                <UserManagement />
            ) : (
                <UpgradeToOrganizationBanner feature="Team Management" />
            )}
        </div>
    );
};

export default TeamManagementTab;