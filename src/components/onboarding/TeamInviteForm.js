"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Plus, Users, Mail } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import "../../app/globals.css";

const TeamInviteForm = ({ onSendInvites, onSkip, isLoading, userEmail }) => {
    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const [externalEmails, setExternalEmails] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);

    useEffect(() => {
        if (userEmail) {
            setOrgDomain(userEmail.split("@")[1]);
        }
    }, [userEmail]);

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

    const handleSkipClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading || inviteLoading) return;
        onSkip();
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
            await sendInviteEmails(inviteEmails);
            onSendInvites(inviteEmails);
        } catch (error) {
            console.error("Error sending invites:", error);
            toast.error("Failed to send some invites. Please try again.");
        } finally {
            setInviteLoading(false);
        }
    };

    const confirmExternalInvite = () => {
        setShowConfirmDialog(false);
        sendInvites(externalEmails);
    };

    const sendInviteEmails = async (inviteEmails) => {
        try {
            const response = await fetch('/api/send-invites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: inviteEmails,
                    inviterName: userEmail.split('@')[0],
                    inviterEmail: userEmail,
                    organizationName: orgDomain,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send invites');
            }

            const result = await response.json();
            toast.success(`Invites sent successfully to ${result.sentCount} recipients`);
        } catch (error) {
            console.error('Error sending invite emails:', error);
            throw error;
        }
    };

    const filledEmailsCount = emails.filter(email => email.trim()).length;

    return (
        <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 rounded-full mb-4">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    Invite Your Team
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                    Collaborate seamlessly with your teammates. You can always invite more people later.
                </p>
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
                                        <div className={`w-2 h-2 rounded-full ${
                                            email.endsWith(`@${orgDomain}`) 
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
                            <span>Send</span>
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

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="mx-4 max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl">
                            Invite External Members?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm sm:text-base">
                            {externalEmails.length} email{externalEmails.length !== 1 ? 's are' : ' is'} outside your organization ({orgDomain}). 
                            External members will have the same access as internal team members.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel 
                            onClick={() => setShowConfirmDialog(false)}
                            className="w-full sm:w-auto order-2 sm:order-1"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmExternalInvite}
                            className="w-full sm:w-auto order-1 sm:order-2 bg-teal-600 hover:bg-teal-700"
                        >
                            Yes, Send Invites
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TeamInviteForm