// InviteDialogs.jsx
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
} from "@/components/ui/alert-dialog";

const InviteDialogs = ({
    showConfirmDialog,
    setShowConfirmDialog,
    showResultsDialog,
    setShowResultsDialog,
    externalEmails = [],
    orgDomain = "",
    selectedSuites = [],
    organizationSuites = [],
    inviteResults,
    onConfirmExternalInvite,
    onCloseResultsDialog
}) => {
    const selectedSuiteNames = selectedSuites
        .map(id => organizationSuites.find(s => s.id === id)?.name)
        .filter(Boolean);

    const externalEmailsList = externalEmails.filter(email => !email.endsWith(`@${orgDomain}`));

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
            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Invite External Members?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 mt-4">
                            <p>
                                {externalEmailsList.length} email{externalEmailsList.length !== 1 ? 's are' : ' is'} outside your organization ({orgDomain}).
                            </p>

                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="text-sm font-medium text-yellow-900 mb-2">External emails:</div>
                                <div className="space-y-1">
                                    {externalEmailsList.map((email, idx) => (
                                        <div key={idx} className="text-sm text-yellow-800 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                                            <span className="truncate">{email}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedSuiteNames.length > 0 && (
                                <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                                    <div className="text-sm font-medium text-teal-900 mb-2">Selected suites:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSuiteNames.map((name, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                                                <Folder className="w-3 h-3" />
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onConfirmExternalInvite}>
                            Yes, Send Invites
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Results Dialog */}
            <AlertDialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Invitation Results</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 mt-4">
                                {inviteResults?.summary && (
                                    <div className="flex gap-3 text-xs bg-slate-100 p-3 rounded">
                                        <span className="text-green-600 font-medium">✓ {inviteResults.summary.sent} sent</span>
                                        {inviteResults.summary.failed > 0 && (
                                            <span className="text-red-600 font-medium">✗ {inviteResults.summary.failed} failed</span>
                                        )}
                                        {inviteResults.summary.alreadyInvited > 0 && (
                                            <span className="text-yellow-600 font-medium">⚠ {inviteResults.summary.alreadyInvited} already invited</span>
                                        )}
                                    </div>
                                )}

                                {inviteResults?.results && (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {inviteResults.results.map((result, idx) => (
                                            <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded text-xs">
                                                <div className="flex-shrink-0 mt-0.5">{getStatusIcon(result.status)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{result.email}</div>
                                                    <div className="text-slate-500">{getStatusText(result.status)}</div>
                                                    {result.message && result.message !== getStatusText(result.status) && (
                                                        <div className="text-slate-500 mt-1 break-words">{result.message}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={onCloseResultsDialog}>
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default InviteDialogs;