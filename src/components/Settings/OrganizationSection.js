import React from 'react';
import { useOrganization } from '../../context/OrganizationContext';
import CompanyInfoForm from '../organization/CompanyInfoForm';
import TeamMembersTable from '../organization/TeamMembersTable';
import InviteUserForm from '../organization/InviteUserForm';
import LoadingSpinner from '../Settings/LoadingSpinner';
import CustomAlert from '../CustomAlert';

const OrganizationSection = () => {
    const {
        organization,
        users,
        currentUserId,
        loading,
        error,
        updateUserPermission,
        removeUser
    } = useOrganization();

    if (loading) return <LoadingSpinner />;
    if (error) return <CustomAlert message={error} />;
    if (!organization) return <CustomAlert message="No organization data found" />;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Organization Settings</h2>

            <div className="space-y-6">
                <CompanyInfoForm organization={organization} />

                <TeamMembersTable
                    users={users}
                    onPermissionChange={updateUserPermission}
                    onRemoveUser={removeUser}
                    currentUserId={currentUserId}
                />

                <InviteUserForm />
            </div>
        </div>
    );
};

export default OrganizationSection;