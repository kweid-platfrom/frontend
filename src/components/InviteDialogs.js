import { AlertCircle, CheckCircle, Folder } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogOverlay,
} from "@/components/ui/alert-dialog";

const InviteDialogs = ({
    showConfirmDialog,
    setShowConfirmDialog,
    showResultsDialog,
    setShowResultsDialog,
    externalEmails,
    orgDomain,
    selectedProjects,
    organizationProjects,
    inviteResults,
    onConfirmExternalInvite,
    onCloseResultsDialog
}) => {
    const selectedProjectNames = selectedProjects.map(id => 
        organizationProjects.find(p => p.id === id)?.name
    ).filter(Boolean);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'already_invited':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'sent':
                return 'Sent successfully';
            case 'failed':
                return 'Failed to send';
            case 'already_invited':
                return 'Already invited';
            default:
                return status;
        }
    };

    return (
        <>
            {/* External Email Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogOverlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg mx-4">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl font-semibold text-slate-900">
                            Invite External Members?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm sm:text-base text-slate-600 mt-2">
                            {externalEmails.filter(email => !email.endsWith(`@${orgDomain}`)).length} email{externalEmails.filter(email => !email.endsWith(`@${orgDomain}`)).length !== 1 ? 's are' : ' is'} outside your organization ({orgDomain}).
                            External members will have the same access as internal team members.
                            
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                <div className="text-sm font-medium text-slate-700 mb-2">External emails:</div>
                                <div className="space-y-1">
                                    {externalEmails.filter(email => !email.endsWith(`@${orgDomain}`)).map((email, index) => (
                                        <div key={index} className="text-sm text-slate-600 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            {email}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Show selected projects in confirmation */}
                            {selectedProjects.length > 0 && (
                                <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                                    <div className="text-sm font-medium text-teal-700 mb-2">Selected projects:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedProjectNames.map((name, index) => (
                                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                                                <Folder className="w-3 h-3" />
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 mt-6">
                        <AlertDialogCancel
                            onClick={() => setShowConfirmDialog(false)}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmExternalInvite}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Yes, Send Invites
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Invitation Results Dialog */}
            <AlertDialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <AlertDialogOverlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg mx-4">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl font-semibold text-slate-900">
                            Invitation Results
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 mt-2">
                                {inviteResults?.summary && (
                                    <div className="text-sm text-slate-600">
                                        <div className="flex gap-4 text-xs bg-slate-50 p-3 rounded-lg">
                                            <span className="text-green-600 font-medium">✓ {inviteResults.summary.sent} sent</span>
                                            {inviteResults.summary.failed > 0 && (
                                                <span className="text-red-600 font-medium">✗ {inviteResults.summary.failed} failed</span>
                                            )}
                                            {inviteResults.summary.alreadyInvited > 0 && (
                                                <span className="text-yellow-600 font-medium">⚠ {inviteResults.summary.alreadyInvited} already invited</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {inviteResults?.results && (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {inviteResults.results.map((result, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                                                {getStatusIcon(result.status)}
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-900">{result.email}</div>
                                                    <div className="text-xs text-slate-500">{getStatusText(result.status)}</div>
                                                    {result.message && result.message !== getStatusText(result.status) && (
                                                        <div className="text-xs text-slate-500 mt-1">{result.message}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogAction
                            onClick={onCloseResultsDialog}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default InviteDialogs;