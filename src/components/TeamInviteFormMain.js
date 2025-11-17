// TeamInviteFormMain.jsx - Complete working component
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, Folder, Plus, Users, Mail, Building2, ChevronDown, Check, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useApp } from '@/context/AppProvider';

const TeamInviteFormMain = ({
    onSendInvites,
    onSkip,
    isLoading,
    userEmail: propUserEmail,
    organizationName: propOrganizationName,
    organizationId: propOrganizationId,
    organizationSuites: propOrganizationSuites = [],
    defaultRole = 'member',
    isPortal = true
}) => {
    const { currentUser } = useApp();
    const userEmail = propUserEmail;
    const organizationId = propOrganizationId;
    const organizationName = propOrganizationName;

    const organizationSuites = useMemo(
        () => propOrganizationSuites || [],
        [propOrganizationSuites]
    );

    // Form state
    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const [selectedSuites, setSelectedSuites] = useState([]);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Dialog states
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showResultsDialog, setShowResultsDialog] = useState(false);
    const [showSuiteDropdown, setShowSuiteDropdown] = useState(false);
    const [externalEmails, setExternalEmails] = useState([]);
    const [inviteResults, setInviteResults] = useState(null);

    const suiteDropdownRef = useRef(null);
    const suiteButtonRef = useRef(null);

    useEffect(() => {
        if (userEmail) {
            setOrgDomain(userEmail.split("@")[1]);
        }
    }, [userEmail]);

    useEffect(() => {
        if (organizationSuites.length === 1) {
            setSelectedSuites([organizationSuites[0].id]);
        } else if (organizationSuites.length > 1) {
            setSelectedSuites([]);
        }
    }, [organizationSuites]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suiteDropdownRef.current?.contains(e.target) || suiteButtonRef.current?.contains(e.target)) return;
            setShowSuiteDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddField = () => setEmails([...emails, ""]);

    const handleRemoveField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const validateEmails = (emailList) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailList.every((email) => !email.trim() || emailRegex.test(email));
    };

    const handleSuiteToggle = (suiteId) => {
        setSelectedSuites(prev =>
            prev.includes(suiteId)
                ? prev.filter(id => id !== suiteId)
                : [...prev, suiteId]
        );
    };

    const handleSelectAllSuites = () => {
        setSelectedSuites(prev =>
            prev.length === organizationSuites.length
                ? []
                : organizationSuites.map(s => s.id)
        );
    };

    const handleSendInvitesClick = (e) => {
        e.preventDefault();

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

            for (const email of inviteEmails) {
                try {
                    const requestBody = {
                        email: email.trim(),
                        organizationId,
                        organizationName,
                        inviterEmail: userEmail,
                        inviterName: userEmail?.split('@')[0] || 'Team Admin',
                        role: defaultRole,
                        suiteIds: selectedSuites.length > 0 ? selectedSuites : undefined,
                        userId: currentUser?.uid  // ← ADD THIS
                    };

                    console.log('📧 Sending invite request:', {
                        email: email.trim(),
                        organizationId,
                        userId: currentUser?.uid?.substring(0, 8) + '...'
                    });

                    const response = await fetch('/api/send-invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    });

                    const contentType = response.headers.get('content-type');
                    const result = contentType?.includes('application/json') ? await response.json() : null;

                    if (response.ok) {
                        results.push({
                            email: email.trim(),
                            status: 'sent',
                            message: result?.message || 'Invitation sent successfully',
                            inviteId: result?.invitationToken || null
                        });
                        sent++;
                    } else if (response.status === 409) {
                        results.push({
                            email: email.trim(),
                            status: 'already_invited',
                            message: result?.message || 'User already has a pending invitation',
                            inviteId: result?.invitationToken || null
                        });
                        alreadyInvited++;
                    } else {
                        results.push({
                            email: email.trim(),
                            status: 'failed',
                            message: result?.message || `Server error: ${response.status}`,
                            inviteId: null
                        });
                        failed++;
                    }
                } catch (error) {
                    console.error('Error sending invite to', email, ':', error);
                    results.push({
                        email: email.trim(),
                        status: 'failed',
                        message: `Network error: ${error.message}`,
                        inviteId: null
                    });
                    failed++;
                }
            }

            const finalResult = {
                success: sent > 0 || alreadyInvited > 0,
                results,
                summary: { sent, failed, alreadyInvited }
            };

            setInviteResults(finalResult);
            handleInviteResults(finalResult);

            if (onSendInvites) {
                await onSendInvites(inviteEmails, finalResult);
            }
        } catch (error) {
            console.error("Error sending invites:", error);
            toast.error(`Failed to send invitations: ${error.message}`);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleInviteResults = (results) => {
        const { summary, results: resultsList } = results;

        if (summary.sent > 0) {
            const msg = `Sent ${summary.sent} invitation${summary.sent !== 1 ? 's' : ''}`;
            if (summary.failed > 0 || summary.alreadyInvited > 0) {
                toast.warning(msg + ` (${summary.failed} failed, ${summary.alreadyInvited} already invited)`);
            } else {
                toast.success(msg + '!');
            }
        } else {
            toast.error("No invitations were sent successfully.");
        }

        if (summary.failed > 0 || summary.alreadyInvited > 0) {
            setShowResultsDialog(true);
        }

        const failedEmails = resultsList.filter(r => r.status === 'failed').map(r => r.email);
        setEmails(failedEmails.length > 0 ? failedEmails : [""]);
    };

    const filledEmailsCount = emails.filter(email => email.trim()).length;
    const selectedSuiteNames = selectedSuites.map(id => organizationSuites.find(s => s.id === id)?.name).filter(Boolean);
    const externalEmailsList = externalEmails.filter(email => !email.endsWith(`@${orgDomain}`));
    const allSuitesSelected = selectedSuites.length === organizationSuites.length;
    const someSuitesSelected = selectedSuites.length > 0 && !allSuitesSelected;

    const getStatusIcon = (status) => {
        if (status === 'sent') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (status === 'already_invited') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        return null;
    };

    const getStatusText = (status) => {
        const statuses = {
            'sent': 'Sent successfully',
            'failed': 'Failed to send',
            'already_invited': 'Already invited'
        };
        return statuses[status] || status;
    };

    const innerContent = (
        <div className="w-full">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-teal-100 rounded-full mb-3 sm:mb-4">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-teal-600" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">
                    Invite Your Team
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-slate-600">
                    Collaborate seamlessly with your teammates.
                </p>
                {organizationName && (
                    <p className="text-xs text-slate-500 mt-2">
                        Organization: <span className="font-medium">{organizationName}</span>
                    </p>
                )}
            </div>

            {/* Suite Selection */}
            {organizationSuites.length > 1 && (
                <div className="mb-6 sm:mb-8">
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">
                        Select Suites for Invited Members <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <button
                            ref={suiteButtonRef}
                            onClick={() => setShowSuiteDropdown(!showSuiteDropdown)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm border border-slate-200 rounded bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center justify-between"
                        >
                            <span className={selectedSuites.length === 0 ? "text-slate-400" : "text-slate-900"}>
                                {selectedSuites.length === 0 ? "Select Suites" : selectedSuites.length === organizationSuites.length ? "All Suites" : `${selectedSuites.length} Suite${selectedSuites.length !== 1 ? 's' : ''}`}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSuiteDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showSuiteDropdown && (
                            <div
                                ref={suiteDropdownRef}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded shadow-lg z-50"
                            >
                                <button
                                    onClick={handleSelectAllSuites}
                                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-slate-50 border-b flex items-center gap-2"
                                >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${allSuitesSelected ? 'bg-teal-600 border-teal-600' : someSuitesSelected ? 'bg-teal-200 border-teal-400' : 'border-slate-300'}`}>
                                        {(allSuitesSelected || someSuitesSelected) && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="font-medium">Select All</span>
                                </button>

                                <div className="max-h-48 overflow-y-auto">
                                    {organizationSuites.map((suite) => {
                                        const isSelected = selectedSuites.includes(suite.id);
                                        return (
                                            <button
                                                key={suite.id}
                                                onClick={() => handleSuiteToggle(suite.id)}
                                                className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-slate-50 border-b last:border-b-0 flex items-center gap-2"
                                            >
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate font-medium">{suite.name}</p>
                                                    {suite.description && <p className="truncate text-xs text-slate-500">{suite.description}</p>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Single Suite Info */}
            {organizationSuites.length === 1 && (
                <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-teal-700">
                        <Folder className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Suite:</span>
                        <span className="truncate">{organizationSuites[0].name}</span>
                    </div>
                    <p className="text-xs text-teal-600 mt-2">Users will be invited to this suite automatically.</p>
                </div>
            )}

            {/* Email Count & Add Button */}
            <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
                {filledEmailsCount > 0 && (
                    <span className="text-xs sm:text-sm text-slate-500 inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                        {filledEmailsCount} email{filledEmailsCount !== 1 ? 's' : ''}
                    </span>
                )}
                <button
                    onClick={handleAddField}
                    className="ml-auto inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 transition-colors"
                >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add Email</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Email Inputs */}
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="email"
                                placeholder="teammate@company.com"
                                value={email}
                                onChange={(e) => handleChange(index, e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-200 rounded bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                            />
                            {email && email.includes("@") && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className={`w-2 h-2 rounded-full ${email.endsWith(`@${orgDomain}`) ? 'bg-green-400' : 'bg-yellow-400'}`} title={email.endsWith(`@${orgDomain}`) ? 'Internal' : 'External'} />
                                </div>
                            )}
                        </div>
                        {emails.length > 1 && (
                            <button onClick={() => handleRemoveField(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={onSkip} className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-700 bg-white border-2 border-slate-200 rounded hover:bg-slate-50 transition-colors disabled:opacity-50" disabled={isLoading || inviteLoading}>
                    Cancel
                </button>
                <button onClick={handleSendInvitesClick} className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2" disabled={isLoading || inviteLoading}>
                    {inviteLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                        </>
                    ) : (
                        <>
                            <Mail className="w-4 h-4" />
                            <span>Send Invites</span>
                        </>
                    )}
                </button>
            </div>

            {/* Legend */}
            {emails.some(e => e.includes("@")) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span>Internal ({orgDomain})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        <span>External</span>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-sm w-full">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Invite External Members?</h3>
                        <div className="space-y-3 mb-6">
                            <p className="text-xs sm:text-sm text-slate-600">{externalEmailsList.length} email{externalEmailsList.length !== 1 ? 's are' : ' is'} outside your organization ({orgDomain}).</p>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="text-xs sm:text-sm font-medium text-yellow-900 mb-2">External emails:</div>
                                <div className="space-y-1">
                                    {externalEmailsList.map((email, idx) => (
                                        <div key={idx} className="text-xs sm:text-sm text-yellow-800 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                                            <span className="truncate">{email}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedSuiteNames.length > 0 && (
                                <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                                    <div className="text-xs sm:text-sm font-medium text-teal-900 mb-2">Selected suites:</div>
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
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => { setShowConfirmDialog(false); sendInvites(externalEmails); }} className="flex-1 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-colors">
                                Yes, Send Invites
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Dialog */}
            {showResultsDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-sm w-full max-h-96 overflow-y-auto">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Invitation Results</h3>
                        {inviteResults?.summary && (
                            <div className="flex flex-wrap gap-2 text-xs bg-slate-100 p-3 rounded mb-4">
                                <span className="text-green-600 font-medium">✓ {inviteResults.summary.sent} sent</span>
                                {inviteResults.summary.failed > 0 && <span className="text-red-600 font-medium">✗ {inviteResults.summary.failed} failed</span>}
                                {inviteResults.summary.alreadyInvited > 0 && <span className="text-yellow-600 font-medium">⚠ {inviteResults.summary.alreadyInvited} already invited</span>}
                            </div>
                        )}
                        {inviteResults?.results && (
                            <div className="space-y-2 mb-4">
                                {inviteResults.results.map((result, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded text-xs">
                                        <div className="flex-shrink-0 mt-0.5">{getStatusIcon(result.status)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{result.email}</div>
                                            <div className="text-slate-500">{getStatusText(result.status)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => { setShowResultsDialog(false); setInviteResults(null); }} className="w-full px-4 py-2 text-xs sm:text-sm font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-colors">
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (isPortal) {
        const portalContent = (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl p-4 sm:p-6 md:p-8">
                    {innerContent}
                </div>
            </div>
        );
        return typeof window !== 'undefined' ? createPortal(portalContent, document.body) : null;
    }

    return innerContent;
};

export default TeamInviteFormMain;