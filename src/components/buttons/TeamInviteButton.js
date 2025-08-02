// components/layout/TeamInviteButton.js
'use client'
import { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { X } from 'lucide-react';
import TeamInviteFormMain from "../TeamInviteFormMain";

const TeamInviteButton = ({ currentUser, actions }) => {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);

    const handleInviteClick = () => {
        setShowInviteModal(true);
    };

    const handleSendInvites = async (emails) => {
        try {
            setInviteLoading(true);
            console.log('TeamInviteButton - Invites sent to:', emails);
            
            setShowInviteModal(false);
            actions.ui.showNotification('success', `Invitations sent to ${emails.length} team member(s)!`, 4000);
            
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('usersInvited', { 
                    detail: { emails } 
                }));
            }
            
        } catch (error) {
            console.error('TeamInviteButton - Error handling invites:', error);
            actions.ui.showNotification('error', 'Failed to send invitations. Please try again.', 5000);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleSkipInvites = () => {
        setShowInviteModal(false);
    };

    return (
        <>
            <button
                onClick={handleInviteClick}
                className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                title="Invite Team Members"
            >
                <UserPlusIcon className="h-4 w-4" />
                <span className="hidden lg:inline">Add Member</span>
            </button>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold">Invite Team Members</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                                disabled={inviteLoading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <TeamInviteFormMain
                            onSendInvites={handleSendInvites}
                            onSkip={handleSkipInvites}
                            isLoading={inviteLoading}
                            userEmail={currentUser?.email}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default TeamInviteButton;