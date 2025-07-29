"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Timestamp } from "firebase/firestore";
import { useApp } from "../../context/AppProvider";
import BugReportForm from "../create-bug/BugReportForm";
import BugReportSuccess from "../create-bug/BugReportSuccess";
import { BugAntIcon } from "@heroicons/react/24/outline";
import {
    getBrowserInfo,
    getDeviceInfo,
    getPriorityFromSeverity,
    validateBugForm,
    DEFAULT_BUG_FORM_DATA
} from "../../utils/bugUtils";

const BugReportButton = ({ className = "", onCreateBug }) => {
    const {
        state,
        actions,
        currentUser,
        activeSuite,
        isAuthenticated
    } = useApp();

    const [showBugForm, setShowBugForm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        ...DEFAULT_BUG_FORM_DATA,
        selectedSuiteId: null
    });
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get data from context - memoized to prevent re-renders
    const suites = useMemo(() => state.suites.testSuites || [], [state.suites.testSuites]);
    const userProfile = useMemo(() => state.auth.profile, [state.auth.profile]);

    // Permission checks
    const canCreateBugs = useMemo(() => {
        return state.subscription?.planLimits?.canCreateBugs !== false;
    }, [state.subscription?.planLimits?.canCreateBugs]);

    const hasActiveSubscription = useMemo(() => {
        return state.subscription?.isTrialActive || state.subscription?.isSubscriptionActive;
    }, [state.subscription?.isTrialActive, state.subscription?.isSubscriptionActive]);

    const userDisplayName = useCallback(() => {
        return userProfile?.displayName ||
            userProfile?.name ||
            currentUser?.displayName ||
            currentUser?.email ||
            'Unknown User';
    }, [userProfile, currentUser]);

    const getSelectedSuiteInfo = useCallback(() => {
        if (!formData.selectedSuiteId || !suites) return null;
        const selectedSuite = suites.find(suite => suite.id === formData.selectedSuiteId);
        if (!selectedSuite) return null;

        return {
            name: selectedSuite.name || formData.selectedSuiteId,
            isOrganization: state.auth.accountType === 'organization',
            organizationName: selectedSuite.organizationName || state.auth.currentUser?.organizationName
        };
    }, [formData.selectedSuiteId, suites, state.auth.accountType, state.auth.currentUser]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            document.body.style.overflow = showBugForm ? "hidden" : "auto";
        }
        return () => {
            if (mounted) {
                document.body.style.overflow = "auto";
            }
        };
    }, [showBugForm, mounted]);

    useEffect(() => {
        if (mounted && showBugForm && activeSuite && !formData.selectedSuiteId) {
            setFormData(prev => ({
                ...prev,
                selectedSuiteId: activeSuite.id
            }));
        }
    }, [mounted, showBugForm, activeSuite, formData.selectedSuiteId]);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (!mounted || !showBugForm || !currentUser || !formData.selectedSuiteId || !suites) return;

            const selectedSuite = suites.find(suite => suite.id === formData.selectedSuiteId);
            if (!selectedSuite) return;

            const isOrganizationSuite = state.auth.accountType === 'organization';

            try {
                if (isOrganizationSuite && state.team.members) {
                    setTeamMembers(state.team.members.map(member => ({
                        id: member.id,
                        name: member.name || member.email || member.id,
                        email: member.email || member.id
                    })));
                } else {
                    setTeamMembers([]);
                }

                setFormData(prev => ({
                    ...prev,
                    userAgent: navigator.userAgent,
                    browserInfo: getBrowserInfo(),
                    deviceInfo: getDeviceInfo()
                }));
            } catch (error) {
                console.error("Error setting up team members:", error);
                actions.ui.showNotification({
                    type: 'error',
                    title: 'Team Members Error',
                    message: 'Failed to load team members'
                });
            }
        };

        fetchTeamMembers();
    }, [mounted, showBugForm, currentUser, formData.selectedSuiteId, suites, state.auth.accountType, state.team.members, actions.ui]);

    const updateFormData = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.selectedSuiteId) {
            setError("Please select a test suite");
            return false;
        }

        const validation = validateBugForm(formData);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return false;
        }
        setError("");
        return true;
    }, [formData]);

    const closeForm = useCallback(() => {
        setFormData({
            ...DEFAULT_BUG_FORM_DATA,
            selectedSuiteId: null
        });
        setAttachments([]);
        setError("");
        setSuccess(false);
        setShowBugForm(false);
    }, []);

    const handleSubmit = async () => {
        if (!canCreateBugs) {
            setError("Bug creation is not available with your current plan. Please upgrade.");
            actions.ui.showNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'Bug creation requires a higher subscription plan'
            });
            return;
        }

        if (!hasActiveSubscription) {
            setError("An active subscription is required to create bugs.");
            actions.ui.showNotification({
                type: 'error',
                title: 'Subscription Required',
                message: 'Please activate your subscription to create bugs'
            });
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setError("");

        try {
            const hasAttachments = attachments.length > 0;
            const priority = getPriorityFromSeverity(formData.severity);
            const currentTimestamp = Timestamp.fromDate(new Date());

            // FIX: Ensure we have the current user
            if (!currentUser?.uid) {
                throw new Error('User authentication required');
            }

            const bugData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                actualBehavior: formData.actualBehavior.trim(),
                stepsToReproduce: formData.stepsToReproduce.trim() || "",
                expectedBehavior: formData.expectedBehavior.trim() || "",
                workaround: formData.workaround.trim() || "",
                assignedTo: formData.assignedTo || null,
                assigned_to: formData.assignedTo || null,
                status: "New",
                priority: priority,
                severity: formData.severity,
                category: formData.category,
                tags: [formData.category.toLowerCase().replace(/\s+/g, '_')],
                source: formData.source || "Manual",
                environment: formData.environment || "Production",
                frequency: formData.frequency || "Once",
                browserInfo: formData.browserInfo || getBrowserInfo(),
                deviceInfo: formData.deviceInfo || getDeviceInfo(),
                userAgent: formData.userAgent || navigator.userAgent,
                hasConsoleLogs: formData.hasConsoleLogs || false,
                hasNetworkLogs: formData.hasNetworkLogs || false,
                hasAttachments,
                attachments: attachments.map(att => ({
                    name: att.name,
                    url: att.url || null,
                    type: att.type || null,
                    size: att.size || null
                })),
                resolution: "",
                resolvedAt: null,
                resolvedBy: null,
                resolvedByName: null,
                comments: [],
                resolutionHistory: [],
                commentCount: 0,
                viewCount: 0,
                // FIX: Only include suiteId (will be removed in reducer)
                suiteId: formData.selectedSuiteId,
                // FIX: Ensure correct user fields
                created_by: currentUser.uid,
                created_at: currentTimestamp,
                updated_at: currentTimestamp,
                lastActivity: currentTimestamp,
                lastActivityBy: currentUser.uid,
                reportedBy: userDisplayName(),
                reportedByEmail: currentUser.email || "",
                updated_by: currentUser.uid,
                updatedByName: userDisplayName(),
                version: 1,
                searchTerms: [
                    formData.title?.toLowerCase(),
                    formData.description?.toLowerCase(),
                    formData.category?.toLowerCase(),
                    formData.severity?.toLowerCase(),
                    "new",
                    formData.source?.toLowerCase(),
                    formData.environment?.toLowerCase()
                ].filter(Boolean)
            };

            console.log('Submitting bug with user UID:', currentUser.uid);
            console.log('Bug data keys:', Object.keys(bugData));

            await actions.bugs.createBug(bugData);

            if (onCreateBug) {
                onCreateBug();
            }

            actions.ui.showNotification({
                type: 'success',
                title: 'Bug Created',
                message: 'Bug report created successfully'
            });

            setSuccess(true);
            setFormData({
                ...DEFAULT_BUG_FORM_DATA,
                selectedSuiteId: null
            });
            setAttachments([]);
            setError("");

            setTimeout(() => {
                closeForm();
            }, 3000);

        } catch (error) {
            console.error("Error submitting bug report:", error);
            const errorMessage = error.message || 'Failed to submit bug report';
            setError(errorMessage);

            actions.ui.showNotification({
                type: 'error',
                title: 'Bug Creation Failed',
                message: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleButtonClick = useCallback(() => {
        console.log('handleButtonClick - Auth state:', { isAuthenticated, currentUser: { uid: currentUser?.uid, email: currentUser?.email } });
        if (!isAuthenticated) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Authentication Required',
                message: 'Please log in to report bugs'
            });
            return;
        }

        if (!activeSuite) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Test Suite Required',
                message: 'Please select a test suite to report bugs'
            });
            return;
        }

        if (!canCreateBugs) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'Bug creation requires a higher subscription plan'
            });
            return;
        }

        if (!hasActiveSubscription) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Subscription Required',
                message: 'Please activate your subscription to create bugs'
            });
            return;
        }

        setShowBugForm(true);
    }, [isAuthenticated, activeSuite, canCreateBugs, hasActiveSubscription, actions.ui, currentUser?.email, currentUser?.uid]);

    if (!mounted) {
        return null;
    }

    const selectedSuiteInfo = getSelectedSuiteInfo();

    return (
        <>
            <button
                className={`group px-3 py-2 text-sm bg-teal-50 text-teal-700 border border-blue-200 hover:bg-teal-100 hover:border-teal-300 hover:shadow-md rounded flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                onClick={handleButtonClick}
                disabled={isSubmitting || !canCreateBugs || !hasActiveSubscription}
            >
                <BugAntIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline font-medium">Report Bug</span>
            </button>

            {showBugForm && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl animate-in fade-in-0 zoom-in-95 duration-200"
                        style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-shrink-0 border-b px-4 sm:px-6 py-4 bg-white rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Report Bug
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        {selectedSuiteInfo ? (
                                            <>
                                                Test Suite: <span className="font-medium text-gray-700">{selectedSuiteInfo.name}</span>
                                                {selectedSuiteInfo.isOrganization && (
                                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                        Organization
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            "Select a test suite to report a bug"
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={closeForm}
                                    className="text-gray-400 hover:text-gray-600 text-2xl p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    type="button"
                                    disabled={isSubmitting}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden"
                            style={{ height: 'calc(100% - 80px)' }}>
                            {success ? (
                                <div className="h-full flex items-center justify-center p-6">
                                    <BugReportSuccess onClose={closeForm} />
                                </div>
                            ) : (
                                <div className="h-full">
                                    <BugReportForm
                                        formData={formData}
                                        updateFormData={updateFormData}
                                        attachments={attachments}
                                        setAttachments={setAttachments}
                                        teamMembers={teamMembers}
                                        error={error}
                                        setError={setError}
                                        isSubmitting={isSubmitting}
                                        onSubmit={handleSubmit}
                                        onClose={closeForm}
                                        suites={suites}
                                        activeSuite={activeSuite}
                                        userProfile={userProfile}
                                        showSuiteSelector={true}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default BugReportButton;