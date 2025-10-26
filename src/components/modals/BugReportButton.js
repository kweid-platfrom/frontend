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

export const STANDARD_SOFTWARE_MODULES = [
    { id: 'authentication', name: 'Authentication' },
    { id: 'user-management', name: 'User Management' },
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'reporting', name: 'Reporting' },
    { id: 'settings', name: 'Settings' },
    { id: 'file-upload', name: 'File Upload' },
    { id: 'search', name: 'Search' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'api-integration', name: 'API Integration' },
    { id: 'ui-components', name: 'UI Components' },
    { id: 'performance', name: 'Performance' },
    { id: 'security', name: 'Security' },
    { id: 'other', name: 'Other (Specify below)' }
];


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
        selectedSuiteId: null,
        creationType: 'manual' // Default to manual
    });
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Memoized data from context
    const suites = useMemo(() => state.suites.testSuites || [], [state.suites.testSuites]);
    const userProfile = useMemo(() => state.auth.profile, [state.auth.profile]);

    // Memoized sprints and modules from context
    const sprints = useMemo(() => {
        const sprintsList = state.sprints?.sprints || state.sprints?.list || [];
        console.log('Sprints available for bug report:', sprintsList);
        return sprintsList;
    }, [state.sprints]);

    const modules = useMemo(() => STANDARD_SOFTWARE_MODULES, []);

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

    const validateForm = useCallback((bugData) => {
        if (!formData.selectedSuiteId) {
            setError("Please select a test suite");
            return false;
        }

        // For AI-generated reports, we already have the data validated
        if (bugData?.creationType === 'ai') {
            return true;
        }

        // For manual reports, validate the form data
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
            selectedSuiteId: null,
            creationType: 'manual'
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
    const safeToLowerCase = useCallback((value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') return value.toLowerCase();
        if (typeof value === 'object' && value.toString) return value.toString().toLowerCase();
        return String(value).toLowerCase();
    }, []);

    // Generic submit handler that works for both manual and AI reports
    const handleSubmit = useCallback(async (bugDataOverride) => {
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

        const isAIReport = bugDataOverride?.creationType === 'ai';
        const sourceData = isAIReport ? bugDataOverride : formData;

        if (!validateForm(bugDataOverride)) return;

        setIsSubmitting(true);
        setError("");

        try {
            const hasAttachments = attachments.length > 0;
            const priority = getPriorityFromSeverity(sourceData.severity);
            const currentTimestamp = Timestamp.fromDate(new Date());

            if (!currentUser?.uid) {
                throw new Error('User authentication required');
            }

            // Handle module - use custom module if "other" is selected
            const moduleId = sourceData.module_id || sourceData.moduleId || null;
            const finalModule = moduleId === 'other'
                ? (sourceData.customModule || 'Other')
                : moduleId;

            // Handle sprint
            const sprintId = sourceData.sprint_id || sourceData.sprintId || null;

            // CRITICAL FIX: Normalize stepsToReproduce - handle both array and string
            let stepsToReproduce = sourceData.stepsToReproduce;
            if (Array.isArray(stepsToReproduce)) {
                // Convert array to numbered string
                stepsToReproduce = stepsToReproduce
                    .map((step, index) => {
                        const cleanStep = typeof step === 'string'
                            ? step.replace(/^\d+\.\s*/, '').trim()
                            : String(step);
                        return `${index + 1}. ${cleanStep}`;
                    })
                    .join('\n');
            } else if (typeof stepsToReproduce === 'string') {
                stepsToReproduce = stepsToReproduce.trim();
            } else {
                stepsToReproduce = '';
            }

            const bugData = {
                title: String(sourceData.title || '').trim(),
                description: String(sourceData.description || '').trim(),
                actualBehavior: String(sourceData.actualBehavior || '').trim(),
                stepsToReproduce: stepsToReproduce,
                expectedBehavior: String(sourceData.expectedBehavior || '').trim(),
                workaround: String(sourceData.workaround || '').trim(),
                assignedTo: sourceData.assignedTo || null,
                assigned_to: sourceData.assignedTo || null,
                status: "New",
                priority: priority,
                severity: sourceData.severity,
                category: sourceData.category,
                module: finalModule,
                module_id: moduleId,
                customModule: moduleId === 'other' ? sourceData.customModule : null,
                sprint_id: sprintId,
                sprintId: sprintId,
                tags: [safeToLowerCase(sourceData.category).replace(/\s+/g, '_')],
                source: isAIReport ? "AI Generated" : "Manual",
                creationType: isAIReport ? "ai" : "manual",
                environment: sourceData.environment || "Production",
                frequency: sourceData.frequency || "Once",
                browserInfo: formData.browserInfo || getBrowserInfo(),
                deviceInfo: formData.deviceInfo || getDeviceInfo(),
                userAgent: formData.userAgent || navigator.userAgent,
                hasConsoleLogs: sourceData.hasConsoleLogs || false,
                hasNetworkLogs: sourceData.hasNetworkLogs || false,
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
                    safeToLowerCase(sourceData.title),
                    safeToLowerCase(sourceData.description),
                    safeToLowerCase(sourceData.category),
                    safeToLowerCase(sourceData.severity),
                    finalModule ? safeToLowerCase(finalModule) : null,
                    "new",
                    isAIReport ? "ai_generated" : "manual",
                    safeToLowerCase(sourceData.environment)
                ].filter(Boolean)
            };

            // If AI-generated, preserve AI metadata
            if (isAIReport && sourceData.ai_metadata) {
                bugData.ai_metadata = sourceData.ai_metadata;
            }

            console.log('Submitting bug with user UID:', currentUser.uid);
            console.log('Bug creation type:', bugData.creationType);
            console.log('Bug stepsToReproduce type:', typeof bugData.stepsToReproduce);
            console.log('Bug module:', bugData.module);
            console.log('Bug sprint:', bugData.sprint_id);

            const result = await actions.bugs.createBug(bugData);

            await new Promise(resolve => setTimeout(resolve, 100));

            if (onCreateBug && typeof onCreateBug === 'function') {
                try {
                    await onCreateBug(result);
                } catch (callbackError) {
                    console.warn('Callback error:', callbackError);
                }
            }

            const reportTypeDisplay = isAIReport ? 'AI-generated' : 'Manual';
            actions.ui.showNotification({
                type: 'success',
                title: 'Bug Created Successfully',
                message: `${reportTypeDisplay} bug "${sourceData.title.trim()}" has been created and assigned.`
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
    }, [
        canCreateBugs,
        hasActiveSubscription,
        formData,
        attachments,
        validateForm,
        currentUser,
        userDisplayName,
        actions.ui,
        actions.bugs,
        onCreateBug,
        closeForm,
        safeToLowerCase
    ]);

    // Manual form submit handler
    const handleManualSubmit = useCallback(() => {
        handleSubmit();
    }, [handleSubmit]);

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
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/50"
                    onClick={handleBackdropClick}
                >
                    <div className="relative bg-card rounded-lg shadow-theme-xl w-[95vw] max-w-4xl min-w-[300px] max-h-[90vh] sm:max-h-[95vh] flex flex-col">
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
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <BugReportForm
                                formData={formData}
                                updateFormData={updateFormData}
                                attachments={attachments}
                                setAttachments={setAttachments}
                                teamMembers={teamMembers}
                                error={error}
                                setError={setError}
                                isSubmitting={isSubmitting}
                                onSubmit={handleManualSubmit}
                                onAISubmit={handleSubmit}
                                onClose={closeForm}
                                suites={suites}
                                activeSuite={activeSuite}
                                userProfile={userProfile}
                                userDisplayName={userDisplayName}
                                currentUser={currentUser}
                                showSuiteSelector={true}
                                sprints={sprints}
                                modules={modules}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default BugReportButton;