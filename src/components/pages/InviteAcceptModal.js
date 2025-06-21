import React, { useState, useEffect } from 'react';
import { Users, Mail, CheckCircle, XCircle, Loader2, Building, FolderOpen, Clock, AlertCircle } from 'lucide-react';

const InviteAcceptModal = ({ 
    inviteData, 
    onAccept, 
    onDecline, 
    isLoading = false,
    error = null 
}) => {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);

    // Calculate time remaining for invite expiration
    useEffect(() => {
        if (inviteData?.expiresAt) {
            const calculateTimeLeft = () => {
                const now = new Date().getTime();
                // Handle both Firestore timestamp and regular date
                const expiry = inviteData.expiresAt.toDate ? 
                    inviteData.expiresAt.toDate().getTime() : 
                    new Date(inviteData.expiresAt).getTime();
                const difference = expiry - now;

                if (difference > 0) {
                    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

                    if (days > 0) {
                        setTimeLeft(`${days} day${days !== 1 ? 's' : ''}`);
                    } else if (hours > 0) {
                        setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''}`);
                    } else {
                        setTimeLeft(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
                    }
                } else {
                    setTimeLeft('Expired');
                }
            };

            calculateTimeLeft();
            const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

            return () => clearInterval(interval);
        }
    }, [inviteData?.expiresAt]);

    const handleAccept = async () => {
        if (!inviteData || isAccepting || isDeclining) return;
        
        setIsAccepting(true);
        try {
            // Call the parent handler with the invite data
            await onAccept(inviteData);
        } catch (error) {
            console.error('Error accepting invite:', error);
            // Error handling is managed by parent component
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        if (!inviteData || isAccepting || isDeclining) return;
        
        setIsDeclining(true);
        try {
            await onDecline();
        } catch (error) {
            console.error('Error declining invite:', error);
            // Error handling is managed by parent component
        } finally {
            setIsDeclining(false);
        }
    };

    // Don't render if no invite data
    if (!inviteData) {
        return null;
    }

    const isExpired = timeLeft === 'Expired';

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Invitation</h2>
                        <p className="text-gray-600">Please wait while we verify your invitation...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-white bg-opacity-20 rounded-full p-3">
                            <Users className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">
                        You&apos;re Invited!
                    </h1>
                    <p className="text-teal-100 text-center">
                        Join your team and start collaborating
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-red-800">Error Processing Invitation</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Expiration Warning */}
                    {isExpired && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-red-800">Invitation Expired</h3>
                                <p className="text-red-700 text-sm mt-1">
                                    This invitation has expired. Please contact your team admin for a new invitation.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Organization Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-teal-100 rounded-lg p-2">
                                <Building className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {inviteData.organizationName || inviteData.organization?.name || 'Organization'}
                                </h3>
                                <p className="text-sm text-gray-600">Organization</p>
                            </div>
                        </div>
                    </div>

                    {/* Inviter Info */}
                    <div className="border-l-4 border-teal-200 pl-4">
                        <div className="flex items-center space-x-3 mb-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Invited by</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {inviteData.inviterName || inviteData.inviter?.name || 'Team Admin'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {inviteData.inviterEmail || inviteData.inviter?.email || inviteData.email}
                            </p>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Your Role</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {inviteData.role || 'Member'}
                        </span>
                    </div>

                    {/* Projects */}
                    {inviteData.projects && inviteData.projects.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <FolderOpen className="w-4 h-4 mr-2 text-gray-500" />
                                Projects you&apos;ll have access to:
                            </h4>
                            <div className="space-y-2">
                                {inviteData.projects.map((project, index) => (
                                    <div key={project.id || index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                                        <span className="text-gray-800 font-medium">
                                            {typeof project === 'string' ? project : project.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Project IDs as fallback if no project names */}
                    {inviteData.projectIds && inviteData.projectIds.length > 0 && (!inviteData.projects || inviteData.projects.length === 0) && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <FolderOpen className="w-4 h-4 mr-2 text-gray-500" />
                                You&apos;ll have access to {inviteData.projectIds.length} project{inviteData.projectIds.length !== 1 ? 's' : ''}
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">
                                    Project details will be available after accepting the invitation.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Time Left */}
                    {timeLeft && !isExpired && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-yellow-50 rounded-lg p-3">
                            <Clock className="w-4 h-4" />
                            <span>Invitation expires in {timeLeft}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {!isExpired ? (
                            <>
                                <button
                                    onClick={handleAccept}
                                    disabled={isAccepting || isDeclining}
                                    className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {isAccepting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Accepting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Accept Invitation</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDecline}
                                    disabled={isAccepting || isDeclining}
                                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {isDeclining ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Declining...</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            <span>Decline</span>
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                            >
                                Return to Home
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
                    <p className="text-xs text-gray-500 text-center">
                        By accepting this invitation, you agree to join {inviteData.organizationName || inviteData.organization?.name || 'the organization'} and 
                        collaborate on the assigned projects.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InviteAcceptModal;