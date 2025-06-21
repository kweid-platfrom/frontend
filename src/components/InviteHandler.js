import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, User, Lock, X } from 'lucide-react';

// Import Invite Modal Component
import InviteAcceptModal from './pages/InviteAcceptModal';

// Import services
import { inviteUserService } from '../services/inviteUserService';

// Import auth context
import { useAuth } from '../context/AuthProvider';

// Import DashboardContent
import DashboardContent from './DashboardContent';

const InviteHandler = () => {
    const { currentUser, userProfile } = useAuth();

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState(null);
    const [hasValidAccess, setHasValidAccess] = useState(false);

    const [showProfileBanner, setShowProfileBanner] = useState(false);

    // Helper function to normalize invite data for backward compatibility
    const normalizeInviteData = (rawInvite) => {
        if (!rawInvite) return null;

        // Handle different data structures from old vs new invites
        return {
            id: rawInvite.id || rawInvite.inviteId,
            token: rawInvite.token,
            email: rawInvite.email,
            role: rawInvite.role || 'member',
            status: rawInvite.status || 'pending',

            // ✅ Organization info - handle multiple possible field names (email service uses organizationId)
            organizationId: rawInvite.organizationId || rawInvite.orgId,
            organizationName: rawInvite.organizationName || rawInvite.organization?.name || rawInvite.orgName,

            // ✅ Inviter info - handle multiple possible structures
            inviterName: rawInvite.inviterName || rawInvite.inviter?.name || rawInvite.invitedBy?.name,
            inviterEmail: rawInvite.inviterEmail || rawInvite.inviter?.email || rawInvite.invitedBy?.email,

            // ✅ Project info - handle different structures (email service sends projectIds array)
            projects: rawInvite.projects || [],
            projectIds: rawInvite.projectIds || rawInvite.projects?.map(p => p.id) || [],

            // ✅ Timestamps - handle both Firestore timestamps and regular dates
            createdAt: rawInvite.createdAt || rawInvite.invitedAt,
            expiresAt: rawInvite.expiresAt,

            // Keep original data for debugging
            _original: rawInvite
        };
    };

    useEffect(() => {
        const checkAccess = async () => {
            setInviteLoading(true);
            setInviteError(null);

            try {
                const urlParams = new URLSearchParams(window.location.search);
                // ✅ Check for both 'token' and 'invite' parameters (email service uses 'token')
                const inviteToken = urlParams.get('token') || urlParams.get('invite');
                // ✅ Get orgId from URL (email service sends this)
                const orgId = urlParams.get('orgId') || urlParams.get('organizationId');
                // ✅ Get email from URL (email service sends this)
                const inviteEmail = urlParams.get('email');

                console.log('Checking access with:', { inviteToken, orgId, inviteEmail }); // Debug log

                if (inviteToken) {
                    try {
                        const rawInvite = await inviteUserService.findInvitationByToken(inviteToken);
                        console.log('Raw invite data:', rawInvite); // Debug log

                        if (rawInvite) {
                            const normalizedInvite = normalizeInviteData(rawInvite);
                            console.log('Normalized invite data:', normalizedInvite); // Debug log

                            // ✅ Verify the orgId matches (security check)
                            if (orgId && normalizedInvite.organizationId !== orgId) {
                                console.warn('Organization ID mismatch:', {
                                    fromToken: normalizedInvite.organizationId,
                                    fromUrl: orgId
                                });
                            }

                            // ✅ Verify email matches (security check)
                            if (inviteEmail && normalizedInvite.email !== inviteEmail) {
                                console.warn('Email mismatch:', {
                                    fromToken: normalizedInvite.email,
                                    fromUrl: inviteEmail
                                });
                            }

                            // Check if invite is expired
                            const isExpired = normalizedInvite.expiresAt &&
                                (normalizedInvite.expiresAt.toDate ?
                                    normalizedInvite.expiresAt.toDate() < new Date() :
                                    new Date(normalizedInvite.expiresAt) < new Date());

                            if (isExpired) {
                                setInviteError('This invitation has expired. Please request a new invitation.');
                                setHasValidAccess(false);
                            } else if (normalizedInvite.status !== 'pending') {
                                setInviteError('This invitation has already been used or is no longer valid.');
                                setHasValidAccess(false);
                            } else {
                                setInviteData(normalizedInvite);
                                setShowInviteModal(true);
                            }
                        } else {
                            setInviteError('Invalid invitation link. The invitation may have been deleted or never existed.');
                            setHasValidAccess(false);
                        }
                    } catch (inviteError) {
                        console.error('Error finding invitation:', inviteError);
                        setInviteError('Unable to verify invitation. Please check the link and try again.');
                        setHasValidAccess(false);
                    }
                } else {
                    // No invite token - check if user has direct access
                    setHasValidAccess(true);
                }
            } catch (generalError) {
                console.error('General access check error:', generalError);
                setInviteError('Failed to verify access permissions. Please try refreshing the page.');
                setHasValidAccess(false);
            } finally {
                setInviteLoading(false);
            }
        };

        checkAccess();
    }, []);

    useEffect(() => {
        if (hasValidAccess && currentUser) {
            const needsProfileCompletion =
                (!currentUser.displayName && (!userProfile?.name && !userProfile?.displayName)) ||
                (!currentUser.emailVerified && currentUser.providerData?.some(p => p.providerId === 'password')) ||
                (!currentUser.providerData || currentUser.providerData.length === 0) ||
                (userProfile && !userProfile.setupCompleted && userProfile.setupStep !== 'completed') ||
                (userProfile && !userProfile.onboardingStatus?.onboardingComplete);

            setShowProfileBanner(needsProfileCompletion);
        } else {
            setShowProfileBanner(false);
        }
    }, [hasValidAccess, currentUser, userProfile]);

    const handleAcceptInvite = async (invite) => {
        try {
            setInviteError(null);
            console.log('Accepting invite:', invite); // Debug log

            const userData = {
                email: invite.email,
                role: invite.role || 'member',
                organizationId: invite.organizationId,
                projectIds: invite.projectIds || []
            };

            console.log('Sending userData:', userData); // Debug log

            const result = await inviteUserService.acceptInvitation(invite.token, userData);
            console.log('Accept result:', result); // Debug log

            if (result.success) {
                setHasValidAccess(true);
                setShowInviteModal(false);

                // ✅ Clean up ALL URL parameters that email service might send
                const url = new URL(window.location);
                url.searchParams.delete('token');
                url.searchParams.delete('invite');
                url.searchParams.delete('orgId');
                url.searchParams.delete('organizationId'); // Clean both variations
                url.searchParams.delete('email');
                window.history.replaceState({}, '', url);

                setShowProfileBanner(true);
            } else {
                throw new Error(result.error || 'Failed to accept invitation');
            }

        } catch (err) {
            console.error('Error accepting invitation:', err);
            const errorMessage = err.message || 'Failed to accept invitation. Please try again.';
            setInviteError(errorMessage);
            throw err;
        }
    };

    const handleDeclineInvite = async () => {
        try {
            setInviteError(null);
            console.log('Declining invite'); // Debug log

            // Optionally mark invite as declined in database
            // await inviteUserService.declineInvitation(inviteData.token);

            window.location.href = '/';
        } catch (err) {
            console.error('Error declining invitation:', err);
            setInviteError('Failed to decline invitation. Please try again.');
            throw err;
        }
    };

    // Show invite modal with blurred dashboard background
    if (showInviteModal && inviteData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="transition-all duration-300 blur-sm pointer-events-none">
                    <div className="space-y-6 max-w-8xl mx-auto px-4 py-6">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                QA Intelligence Dashboard
                            </h1>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-teal-600">---</div>
                                    <div className="text-sm text-teal-600">Total Test Cases</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-green-600">---%</div>
                                    <div className="text-sm text-green-600">Pass Rate</div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-orange-600">---</div>
                                    <div className="text-sm text-orange-600">Active Bugs</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-red-600">---</div>
                                    <div className="text-sm text-red-600">Critical Issues</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <InviteAcceptModal
                    inviteData={inviteData}
                    onAccept={handleAcceptInvite}
                    onDecline={handleDeclineInvite}
                    isLoading={inviteLoading}
                    error={inviteError}
                />
            </div>
        );
    }

    // Show access required screen
    if (!hasValidAccess && !inviteLoading && !showInviteModal) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Access Required</h2>
                        <p className="text-yellow-700 mb-4">
                            You need an invitation to access this dashboard. Please contact your team administrator.
                        </p>
                        {inviteError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-red-600 text-sm">{inviteError}</p>
                                <p className="text-red-500 text-xs mt-2">
                                    If you have an old invitation link, please request a new one.
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading screen
    if (inviteLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Activity className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg text-gray-600 mb-2">Loading QAID Dashboard</p>
                    <p className="text-sm text-gray-500">Verifying access permissions...</p>
                </div>
            </div>
        );
    }

    // Show dashboard with profile banner if needed
    return (
        <div className="min-h-screen bg-gray-50">
            {showProfileBanner && (
                <div className="space-y-6 max-w-8xl mx-auto px-4 py-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-blue-900">Complete Your Profile</h3>
                                    <div className="mt-1 text-sm text-blue-700">
                                        <p className="mb-1">Welcome! To get the most out of your dashboard, please complete your profile setup.</p>
                                        <div className="flex items-center space-x-4 text-xs">
                                            <span className="flex items-center space-x-1">
                                                <Lock className="w-3 h-3" />
                                                <span>Set a password to secure your account</span>
                                            </span>
                                            <span>•</span>
                                            <span>Add your name and preferences</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {/* Navigate to profile setup */ }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Complete Profile
                                </button>
                                <button
                                    onClick={() => setShowProfileBanner(false)}
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DashboardContent hasValidAccess={hasValidAccess} />
        </div>
    );
};

export default InviteHandler;