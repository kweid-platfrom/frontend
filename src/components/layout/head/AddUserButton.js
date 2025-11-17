import { useState, useRef, useEffect } from 'react';
import { UserPlus, X, Crown, Lock } from 'lucide-react';
import { Button } from '../../ui/button';
import TeamInviteFormMain from '../../TeamInviteFormMain';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from "@/components/ui/dialog";

const AddUserButton = ({
    accountType,
    userRole,
    actions,
    disabled = false,
    // Props needed for TeamInviteFormMain
    userEmail,
    organizationName,
    organizationId,
    organizationSuites = [],
    onInviteSuccess
}) => {
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showUpgradeDropdown, setShowUpgradeDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const isOrganizationAdmin = accountType === 'organization' && (userRole === 'admin' || userRole === 'owner');
    const isOrganizationNonAdmin = accountType === 'organization' && userRole !== 'admin' && userRole !== 'owner';
    const isIndividual = accountType === 'individual' || !accountType;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowUpgradeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddUser = () => {
        if (disabled) return;

        if (isOrganizationAdmin) {
            // Organization admin - show team invite modal
            setShowInviteDialog(true);
        } else if (isOrganizationNonAdmin) {
            // Organization member/non-admin - show no access message
            if (actions?.ui?.showNotification) {
                actions.ui.showNotification(
                    'warning',
                    'Only organization admins can invite team members',
                    3000
                );
            } else if (actions?.ui?.showError) {
                actions.ui.showError('Only organization admins can invite team members');
            }
        } else {
            // Individual account - toggle upgrade dropdown
            setShowUpgradeDropdown(!showUpgradeDropdown);
        }
    };

    const handleSendInvites = async (emails, results) => {
        setIsLoading(true);
        try {
            // Show success notification
            if (results.summary.sent > 0) {
                actions.ui.showNotification(
                    'success',
                    `Successfully sent ${results.summary.sent} invitation${results.summary.sent !== 1 ? 's' : ''}!`,
                    4000
                );
            }

            // Call parent callback if provided
            if (onInviteSuccess) {
                await onInviteSuccess(results);
            }

            // Close dialog after successful invites
            if (results.summary.sent > 0 && results.summary.failed === 0) {
                setTimeout(() => {
                    setShowInviteDialog(false);
                }, 1500);
            }
        } catch (error) {
            console.error('Error in handleSendInvites:', error);
            actions.ui.showNotification('error', 'Failed to process invitations', 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        setShowInviteDialog(false);
        actions.ui.showNotification('info', 'You can invite team members anytime!', 3000);
    };

    return (
        <>
            <div className="relative">
                <Button
                    ref={buttonRef}
                    variant="ghost"
                    onClick={handleAddUser}
                    disabled={disabled}
                    leftIcon={<UserPlus className="h-4 w-4" />}
                    title={
                        isOrganizationAdmin
                            ? "Add team member"
                            : isOrganizationNonAdmin
                                ? "Admin access required"
                                : "Upgrade to collaborate"
                    }
                    className="text-foreground hover:bg-accent/50"
                >
                </Button>

                {/* Upgrade Dropdown for Individual Users */}
                {isIndividual && showUpgradeDropdown && (
                    <div
                        ref={dropdownRef}
                        className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                    <Crown className="w-5 h-5 text-teal-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                                        Upgrade to Add Team
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                        Collaborate with your team members
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setShowUpgradeDropdown(false);
                                    // Navigate to pricing/upgrade page
                                    if (actions?.ui?.showNotification) {
                                        actions.ui.showNotification('info', 'Redirecting to upgrade page...', 2000);
                                    }
                                    // Add your upgrade navigation logic here
                                    // router.push('/pricing');
                                }}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
                            >
                                View Plans
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Team Invite Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogOverlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <DialogContent className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[90vh] overflow-y-auto">

                    <div className="px-2">
                        <TeamInviteFormMain
                            onSendInvites={handleSendInvites}
                            onSkip={handleSkip}
                            isLoading={isLoading}
                            userEmail={userEmail}
                            organizationName={organizationName}
                            organizationId={organizationId}
                            organizationSuites={organizationSuites}
                            defaultRole="member"
                            isPortal={false}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddUserButton;