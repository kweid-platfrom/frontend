import { UserPlus } from 'lucide-react';
import { Button } from '../../ui/button';

const AddUserButton = ({ 
    accountType, 
    userRole, 
    currentUser, 
    actions, 
    disabled = false 
}) => {
    const isOrganizationAdmin = accountType === 'organization' && userRole === 'admin';

    const handleAddUser = () => {
        if (disabled) return;
        
        if (isOrganizationAdmin) {
            // Organization admin - allow team invite
            // You can implement actual team invite logic here
            actions.ui.showNotification('info', 'Team invite functionality coming soon!', 3000);
        } else {
            // Individual account or non-admin - show upgrade message
            actions.ui.showNotification(
                'info', 
                'Upgrade to an organization plan to collaborate with team members!', 
                5000
            );
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleAddUser}
            disabled={disabled}
            leftIcon={<UserPlus className="h-4 w-4" />}
            title={isOrganizationAdmin ? "Add team member" : "Upgrade to collaborate"}
            className="text-foreground hover:bg-accent/50"
        >
        </Button>
    );
};

export default AddUserButton;