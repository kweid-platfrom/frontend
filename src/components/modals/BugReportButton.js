"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Timestamp } from "firebase/firestore";
import { useApp } from "../../context/AppProvider";
import BugReportForm from "../create-bug/BugReportForm";
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
    const [teamMembers, setTeamMembers] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        ...DEFAULT_BUG_FORM_DATA,
        selectedSuiteId: null
    });
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Memoized data from context
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

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showBugForm) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showBugForm]);

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
        setShowBugForm(false);
        setIsSubmitting(false);
    }, []);

    // Handle backdrop click
    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            closeForm();
        }
    }, [closeForm]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showBugForm) {
                closeForm();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showBugForm, closeForm]);

    // Helper function for safe lowercase conversion
    const safeToLowerCase = (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') return value.toLowerCase();
        if (typeof value === 'object' && value.toString) return value.toString().toLowerCase();
        return String(value).toLowerCase();
    };

    const handleSubmit = async (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

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
                tags: [safeToLowerCase(formData.category).replace(/\s+/g, '_')],
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
                suiteId: formData.selectedSuiteId,
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
                    safeToLowerCase(formData.title),
                    safeToLowerCase(formData.description),
                    safeToLowerCase(formData.category),
                    safeToLowerCase(formData.severity),
                    "new",
                    safeToLowerCase(formData.source),
                    safeToLowerCase(formData.environment)
                ].filter(Boolean)
            };

            console.log('Submitting bug with user UID:', currentUser.uid);
            console.log('Bug data keys:', Object.keys(bugData));

            const result = await actions.bugs.createBug(bugData);
            
            await new Promise(resolve => setTimeout(resolve, 100));

            if (onCreateBug && typeof onCreateBug === 'function') {
                try {
                    await onCreateBug(result);
                } catch (callbackError) {
                    console.warn('Callback error:', callbackError);
                }
            }

            actions.ui.showNotification({
                type: 'success',
                title: 'Bug Created Successfully',
                message: `Bug "${formData.title.trim()}" has been created and assigned.`
            });

            closeForm();

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

    const handleButtonClick = useCallback((event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

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
            <style jsx global>{`
                .bug-report-modal textarea,
                .bug-report-modal input,
                .bug-report-modal select {
                    background-color: rgb(var(--color-background)) !important;
                    color: rgb(var(--color-foreground)) !important;
                    border: 1px solid rgb(var(--color-border)) !important;
                }
                .bug-report-modal textarea:focus,
                .bug-report-modal input:focus,
                .bug-report-modal select:focus {
                    outline: none !important;
                    border-color: rgb(var(--color-primary)) !important;
                    box-shadow: 0 0 0 2px rgb(var(--color-primary)) !important;
                }
                .bug-report-modal textarea::placeholder,
                .bug-report-modal input::placeholder {
                    color: rgb(var(--color-muted-foreground)) !important;
                }
                .bug-report-modal label {
                    color: rgb(var(--color-foreground)) !important;
                }
            `}</style>
            <button
                type="button"
                className={`group px-3 py-2 text-sm bg-primary text-primary-foreground border border-border hover:bg-primary/80 hover:border-border/80 hover:shadow-md rounded flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                onClick={handleButtonClick}
                disabled={isSubmitting || !canCreateBugs || !hasActiveSubscription}
            >
                <BugAntIcon className="h-4 w-4 text-primary-foreground transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline font-medium">Report Bug</span>
            </button>

            {showBugForm && createPortal(
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={handleBackdropClick}
                >
                    <div className="relative bg-card rounded-lg shadow-theme-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col z-[10000] bug-report-modal">
                        <div className="flex-shrink-0 border-b border-border px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                                        Report Bug
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedSuiteInfo ? (
                                            <>
                                                Suite: <span className="font-medium text-foreground">{selectedSuiteInfo.name}</span>
                                                {selectedSuiteInfo.isOrganization && (
                                                    <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
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
                                    className="text-muted-foreground hover:text-foreground text-2xl p-1"
                                    type="button"
                                    disabled={isSubmitting}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 sm:p-6">
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
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default BugReportButton;