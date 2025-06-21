import { useState, useEffect } from "react";
import { Loader2, X, Plus, Users, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
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
import { useAuth } from "../context/AuthProvider";
import "../app/globals.css";

const TeamInviteFormMain = ({
    onSendInvites,
    onSkip,
    isLoading,
    userEmail: propUserEmail,
    organizationName: propOrganizationName,
    organizationId: propOrganizationId,
    defaultRole = 'member'
}) => {
    const { userProfile, currentUser } = useAuth(); // Get user data from auth context

    // Use props first, then fall back to user profile data
    const userEmail = propUserEmail || currentUser?.email;
    const organizationId = propOrganizationId || userProfile?.organizationId;
    const organizationName = propOrganizationName || userProfile?.organizationName || userProfile?.organization?.name;

    // Add debug logging
    console.log('TeamInviteFormMain props and derived values:', {
        propUserEmail,
        propOrganizationId,
        propOrganizationName,
        userEmail,
        organizationId,
        organizationName,
        userProfile,
        isLoading
    });

    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const [externalEmails, setExternalEmails] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showResultsDialog, setShowResultsDialog] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteResults, setInviteResults] = useState(null);

    useEffect(() => {
        console.log('UserEmail changed:', userEmail);
        if (userEmail) {
            setOrgDomain(userEmail.split("@")[1]);
        }
    }, [userEmail]);

    // Show loading state if required props are missing
    if (!userEmail || !organizationId) {
        console.log('Missing required data - showing loading state:', {
            userEmail: !!userEmail,
            organizationId: !!organizationId,
            userProfileLoaded: !!userProfile,
            currentUserLoaded: !!currentUser
        });

        return (
            <div className="w-full max-w-md mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <div className="ml-2 text-sm text-slate-600">
                        Loading team invite form...
                        <br />
                        <span className="text-xs">
                            {!userEmail && 'Missing: userEmail '}
                            {!organizationId && 'Missing: organizationId '}
                            {!userProfile && 'Missing: userProfile '}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const handleAddField = () => setEmails([...emails, ""]);

    const handleRemoveField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const handleSkipClick = () => {
        if (onSkip) {
            onSkip();
        }
    };

    const validateEmails = (emailList) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailList.every((email) => !email.trim() || emailRegex.test(email));
    };

    const handleSendInvitesClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading || inviteLoading) return;

        const filtered = emails.filter((email) => email.trim());

        if (filtered.length === 0) {
            toast.error("Please enter at least one email address.");
            return;
        }

        if (!validateEmails(filtered)) {
            toast.error("One or more email addresses are invalid.");
            return;
        }

        const external = filtered.filter((email) => !email.endsWith(`@${orgDomain}`));
        if (external.length > 0) {
            setExternalEmails(filtered);
            setShowConfirmDialog(true);
        } else {
            sendInvites(filtered);
        }
    };

    const sendInvites = async (inviteEmails) => {
        setInviteLoading(true);
        try {
            console.log('TeamInviteForm - Sending invites to:', inviteEmails);

            const results = [];
            let sent = 0, failed = 0, alreadyInvited = 0;

            // Send individual requests for each email
            for (const email of inviteEmails) {
                try {
                    console.log('🔍 Attempting to send invite to:', email);
                    console.log('🔍 API URL:', '/api/send-invite');
                    console.log('🔍 Request body:', {
                        email: email.trim(),
                        organizationId,
                        organizationName,
                        inviterEmail: userEmail,
                        inviterName: userEmail?.split('@')[0] || 'Team Admin',
                        role: defaultRole
                    });

                    const response = await fetch('/api/send-invite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: email.trim(),
                            organizationId,
                            organizationName,
                            inviterEmail: userEmail,
                            inviterName: userEmail?.split('@')[0] || 'Team Admin',
                            role: defaultRole
                        }),
                    });

                    console.log('🔍 Response status:', response.status);
                    console.log('🔍 Response headers:', [...response.headers.entries()]);

                    // Check if response is HTML (404 page) or JSON
                    const contentType = response.headers.get('content-type');
                    console.log('🔍 Content-Type:', contentType);

                    if (contentType && contentType.includes('application/json')) {
                        const result = await response.json();
                        console.log('🔍 JSON Response:', result);

                        // Handle different response statuses
                        if (response.ok) {
                            // Success case (200-299 status codes)
                            results.push({
                                email: email.trim(),
                                status: 'sent',
                                message: result.message || 'Invitation sent successfully',
                                inviteId: result.inviteId || null
                            });
                            sent++;
                        } else if (response.status === 409) {
                            // Conflict - user already invited
                            results.push({
                                email: email.trim(),
                                status: 'already_invited',
                                message: result.message || 'User already has a pending invitation',
                                inviteId: result.inviteId || null
                            });
                            alreadyInvited++;
                        } else {
                            // Other error responses
                            results.push({
                                email: email.trim(),
                                status: 'failed',
                                message: result.message || `Server error: ${response.status}`,
                                inviteId: null
                            });
                            failed++;
                        }
                    } else {
                        // It's likely an HTML error page
                        const htmlText = await response.text();
                        console.log('🔍 HTML Response (first 200 chars):', htmlText.substring(0, 200));
                        console.error('❌ Received HTML instead of JSON - API endpoint not found');

                        results.push({
                            email: email.trim(),
                            status: 'failed',
                            message: 'API endpoint not found (404)',
                            inviteId: null
                        });
                        failed++;
                    }

                } catch (emailError) {
                    console.error(`Network error for ${email}:`, emailError);
                    results.push({
                        email: email.trim(),
                        status: 'failed',
                        message: `Network error: ${emailError.message}`,
                        inviteId: null
                    });
                    failed++;
                }
            }

            const finalResult = {
                success: sent > 0 || alreadyInvited > 0, // Consider already invited as partial success
                results,
                summary: {
                    sent,
                    failed,
                    alreadyInvited
                }
            };

            console.log('Combined API Results:', finalResult);
            setInviteResults(finalResult);
            handleInviteResults(finalResult);

            // Call the parent callback if provided
            if (onSendInvites) {
                await onSendInvites(inviteEmails, finalResult);
            }

        } catch (error) {
            console.error("TeamInviteForm - Error sending invites:", error);
            toast.error(`Failed to send invitations: ${error.message}`);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleInviteResults = (results) => {
        const { summary, results: inviteResults } = results;

        // Show summary toast
        if (summary.sent > 0) {
            if (summary.failed > 0 || summary.alreadyInvited > 0) {
                toast.warning(
                    `Sent ${summary.sent} invitation${summary.sent !== 1 ? 's' : ''}. ` +
                    `${summary.failed > 0 ? `${summary.failed} failed. ` : ''}` +
                    `${summary.alreadyInvited > 0 ? `${summary.alreadyInvited} already invited.` : ''}`
                );
            } else {
                toast.success(`Successfully sent ${summary.sent} invitation${summary.sent !== 1 ? 's' : ''}!`);
            }
        } else if (summary.alreadyInvited > 0 && summary.failed === 0) {
            toast.info(`${summary.alreadyInvited} user${summary.alreadyInvited !== 1 ? 's are' : ' is'} already invited.`);
        } else {
            toast.error("No invitations were sent successfully.");
        }

        // Show detailed results if there are failures or mixed results
        if (summary.failed > 0 || summary.alreadyInvited > 0) {
            setShowResultsDialog(true);
        }

        // Clear successful emails from the form
        const failedEmails = inviteResults
            .filter(r => r.status === 'failed')
            .map(r => r.email);

        if (failedEmails.length < inviteResults.length) {
            // Keep only failed emails for retry
            setEmails(failedEmails.length > 0 ? failedEmails : [""]);
        }
    };

    const confirmExternalInvite = () => {
        setShowConfirmDialog(false);
        sendInvites(externalEmails);
    };

    const closeResultsDialog = () => {
        setShowResultsDialog(false);
        setInviteResults(null);
    };

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

    const filledEmailsCount = emails.filter(email => email.trim()).length;

    return (
        <>
            <div className="w-full max-w-md mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 rounded-full mb-4">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                        Invite Your Team
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                        Collaborate seamlessly with your teammates.
                    </p>
                    {organizationName && (
                        <p className="text-xs text-slate-500 mt-2">
                            Organization: {organizationName}
                        </p>
                    )}
                </div>

                {/* Add Button - Mobile Optimized */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <div className="text-sm text-slate-500">
                        {filledEmailsCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {filledEmailsCount} email{filledEmailsCount !== 1 ? 's' : ''} added
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddField}
                        className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 hover:border-teal-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Email</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Email Input Fields */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {emails.map((email, index) => (
                        <div key={index} className="group relative">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="email"
                                        placeholder="teammate@company.com"
                                        value={email}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        className="w-full px-3 py-3 sm:px-4 sm:py-3 text-sm sm:text-base border border-slate-200 rounded text-slate-900 placeholder-slate-400 bg-white transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 hover:border-slate-300"
                                    />
                                    {/* Email domain indicator */}
                                    {email && email.includes("@") && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className={`w-2 h-2 rounded-full ${email.endsWith(`@${orgDomain}`)
                                                ? 'bg-green-400'
                                                : 'bg-yellow-400'
                                                }`} title={
                                                    email.endsWith(`@${orgDomain}`)
                                                        ? 'Internal email'
                                                        : 'External email'
                                                } />
                                        </div>
                                    )}
                                </div>

                                {emails.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveField(index)}
                                        className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        aria-label="Remove email"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons - Responsive Layout */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={handleSkipClick}
                        className="order-2 sm:order-1 flex-1 px-6 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-slate-700 bg-white border-2 border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || inviteLoading}
                    >
                        Skip
                    </button>

                    <button
                        type="button"
                        onClick={handleSendInvitesClick}
                        className="order-1 sm:order-2 flex-1 px-6 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                        disabled={isLoading || inviteLoading}
                    >
                        {isLoading || inviteLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Send Invites</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Legend for email indicators */}
                {emails.some(email => email.includes("@")) && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Internal ({orgDomain})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                <span>External domain</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
                            onClick={confirmExternalInvite}
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
                            onClick={closeResultsDialog}
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

export default TeamInviteFormMain;