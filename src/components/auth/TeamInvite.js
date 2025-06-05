"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
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

export const TeamInvite = ({ onSendInvites, onSkip, isLoading, userEmail }) => {
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

    // Prevent form submission and handle skip explicitly
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
            // Send actual invite emails
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

    // Function to send actual invitation emails
    const sendInviteEmails = async (inviteEmails) => {
        try {
            const response = await fetch('/api/send-invites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: inviteEmails,
                    inviterName: userEmail.split('@')[0], // You might want to pass actual name
                    inviterEmail: userEmail,
                    organizationName: orgDomain, // You might want to pass actual org name
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

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Invite Team Members <span className="text-sm font-normal text-slate-500">(Optional)</span>
            </h3>

            <p className="text-sm text-slate-600">Collaborate seamlessly. You can skip and invite later.</p>

            <div className="w-full flex justify-end">
                <button
                    type="button"
                    onClick={handleAddField}
                    className="bg-transparent text-teal-600 border border-teal-600 rounded px-4 py-2 text-sm cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                >
                    + Add
                </button>
            </div>

            <div className="space-y-3">
                {emails.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="email"
                            placeholder="team.member@company.com"
                            value={email}
                            onChange={(e) => handleChange(index, e.target.value)}
                            className="flex-1 px-4 py-2 border-2 border-slate-200 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                        />
                        {emails.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveField(index)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                aria-label="Remove email"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={handleSkipClick}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center"
                    disabled={isLoading || inviteLoading}
                >
                    Skip
                </button>

                <button
                    type="button"
                    onClick={handleSendInvitesClick}
                    className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading || inviteLoading}
                >
                    {isLoading || inviteLoading ? (
                        <>
                            <Loader2 className="animate-spin h-5 w-5" />
                            Sending...
                        </>
                    ) : (
                        "Send Invites"
                    )}
                </button>
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Invite External Members?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {externalEmails.length} email(s) are outside your organization. Do you still want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmExternalInvite}>Yes, Invite</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};