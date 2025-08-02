import { useState, useEffect, useMemo } from "react";
import { Loader2, X, Folder, Plus, Users, Mail } from "lucide-react";
import { toast } from "sonner";
// import { useAuth } from "../context/AuthProvider";
import InviteDialogs from "./InviteDialogs";
// import SuiteSelector from "./SuiteSelector";
import "../app/globals.css";

const TeamInviteFormMain = ({
    onSendInvites,
    onSkip,
    isLoading,
    userEmail: propUserEmail,
    organizationName: propOrganizationName,
    organizationId: propOrganizationId,
    organizationSuites: propOrganizationSuites = [],
    defaultRole = 'member'
}) => {
    const { userProfile, currentUser } = useAuth();

    // Use props first, then fall back to user profile data
    const userEmail = propUserEmail || currentUser?.email;
    const organizationId = propOrganizationId || userProfile?.organizationId;
    const organizationName = propOrganizationName || userProfile?.organizationName || userProfile?.organization?.name;
    
    // Memoize organizationSuites to prevent unnecessary re-renders
    const organizationSuites = useMemo(() => 
        propOrganizationSuites.length > 0 
            ? propOrganizationSuites 
            : userProfile?.organizationSuites || [],
        [propOrganizationSuites, userProfile?.organizationSuites]
    );

    // Form state
    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const [externalEmails, setExternalEmails] = useState([]);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteResults, setInviteResults] = useState(null);
    
    // Dialog states
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showResultsDialog, setShowResultsDialog] = useState(false);
    
    // Suite selection states
    const [selectedSuites, setSelectedSuites] = useState([]);

    // Set organization domain when userEmail changes
    useEffect(() => {
        if (userEmail) {
            setOrgDomain(userEmail.split("@")[1]);
        }
    }, [userEmail]);

    // Initialize suite selection based on available suites
    useEffect(() => {
        if (organizationSuites.length === 1) {
            // If only one suite, auto-select it
            setSelectedSuites([organizationSuites[0].id]);
        } else if (organizationSuites.length > 1) {
            // If multiple suites, start with none selected (admin must choose)
            setSelectedSuites([]);
        }
    }, [organizationSuites]);

    // Show loading state if required props are missing
    if (!userEmail || !organizationId) {
        return (
            <div className="w-full max-w-md mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <div className="ml-2 text-sm text-slate-600">
                        Loading team invite form...
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

    // const handleSuiteSelection = (suiteId) => {
    //     setSelectedSuites(prev => {
    //         if (prev.includes(suiteId)) {
    //             return prev.filter(id => id !== suiteId);
    //         } else {
    //             return [...prev, suiteId];
    //         }
    //     });
    // };

    // const handleSelectAllSuites = () => {
    //     if (selectedSuites.length === organizationSuites.length) {
    //         setSelectedSuites([]);
    //     } else {
    //         setSelectedSuites(organizationSuites.map(p => p.id));
    //     }
    // };

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

        // Validate suite selection for organizations with multiple suites
        if (organizationSuites.length > 1 && selectedSuites.length === 0) {
            toast.error("Please select at least one suite to invite users to.");
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
            const results = [];
            let sent = 0, failed = 0, alreadyInvited = 0;

            // Send individual requests for each email
            for (const email of inviteEmails) {
                try {
                    const requestBody = {
                        email: email.trim(),
                        organizationId,
                        organizationName,
                        inviterEmail: userEmail,
                        inviterName: userEmail?.split('@')[0] || 'Team Admin',
                        role: defaultRole,
                        suiteIds: selectedSuites.length > 0 ? selectedSuites : undefined
                    };

                    const response = await fetch('/api/send-invite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });

                    const contentType = response.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {
                        const result = await response.json();

                        if (response.ok) {
                            results.push({
                                email: email.trim(),
                                status: 'sent',
                                message: result.message || 'Invitation sent successfully',
                                inviteId: result.inviteId || null,
                                suiteIds: selectedSuites
                            });
                            sent++;
                        } else if (response.status === 409) {
                            results.push({
                                email: email.trim(),
                                status: 'already_invited',
                                message: result.message || 'User already has a pending invitation',
                                inviteId: result.inviteId || null,
                                suiteIds: selectedSuites
                            });
                            alreadyInvited++;
                        } else {
                            results.push({
                                email: email.trim(),
                                status: 'failed',
                                message: result.message || `Server error: ${response.status}`,
                                inviteId: null,
                                suiteIds: selectedSuites
                            });
                            failed++;
                        }
                    } else {
                        results.push({
                            email: email.trim(),
                            status: 'failed',
                            message: 'API endpoint not found (404)',
                            inviteId: null,
                            suiteIds: selectedSuites
                        });
                        failed++;
                    }

                } catch (emailError) {
                    results.push({
                        email: email.trim(),
                        status: 'failed',
                        message: `Network error: ${emailError.message}`,
                        inviteId: null,
                        suiteIds: selectedSuites
                    });
                    failed++;
                }
            }

            const finalResult = {
                success: sent > 0 || alreadyInvited > 0,
                results,
                summary: {
                    sent,
                    failed,
                    alreadyInvited
                }
            };

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
            setEmails(failedEmails.length > 0 ? failedEmails : [""]);
        }
    };

    const handleConfirmExternalInvite = () => {
        setShowConfirmDialog(false);
        sendInvites(externalEmails);
    };

    const handleCloseResultsDialog = () => {
        setShowResultsDialog(false);
        setInviteResults(null);
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

                {/* Suite Selection - Only show if there are multiple suites */}
                {/* {organizationSuites.length > 1 && (
                    <SuiteSelector
                        organizationSuites={organizationSuites}
                        selectedSuites={selectedSuites}
                        onSuiteSelection={handleSuiteSelection}
                        onSelectAllSuites={handleSelectAllSuites}
                    />
                )} */}

                {/* Single suite info */}
                {organizationSuites.length === 1 && (
                    <div className="mb-6 sm:mb-8 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-teal-700">
                            <Folder className="w-4 h-4" />
                            <span className="font-medium">Suite:</span>
                            <span>{organizationSuites[0].name}</span>
                        </div>
                        <p className="text-xs text-teal-600 mt-1">Users will be invited to this suite automatically.</p>
                    </div>
                )}

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

            {/* Invite Dialogs Component */}
            <InviteDialogs
                showConfirmDialog={showConfirmDialog}
                setShowConfirmDialog={setShowConfirmDialog}
                showResultsDialog={showResultsDialog}
                setShowResultsDialog={setShowResultsDialog}
                externalEmails={externalEmails}
                orgDomain={orgDomain}
                selectedSuites={selectedSuites}
                organizationSuites={organizationSuites}
                inviteResults={inviteResults}
                onConfirmExternalInvite={handleConfirmExternalInvite}
                onCloseResultsDialog={handleCloseResultsDialog}
            />
        </>
    );
};

export default TeamInviteFormMain;