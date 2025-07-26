"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { serverTimestamp } from "firebase/firestore";
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
import firestoreService from "../../services/firestoreService";

const BugReportButton = ({ className = "" }) => {
    const {
        user: currentUser,
        userProfile,
        activeSuite,
        suites,
        addNotification
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

    const userDisplayName = useCallback(() => {
        return userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Unknown User';
    }, [userProfile, currentUser]);

    const getSelectedSuiteInfo = useCallback(() => {
        if (!formData.selectedSuiteId || !suites) return null;
        const selectedSuite = suites.find(suite => suite.suite_id === formData.selectedSuiteId);
        if (!selectedSuite) return null;
        
        return {
            name: selectedSuite.metadata?.name || selectedSuite.name || formData.selectedSuiteId,
            isOrganization: selectedSuite.accountType === 'organization',
            organizationName: selectedSuite.organizationName
        };
    }, [formData.selectedSuiteId, suites]);

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
                selectedSuiteId: activeSuite.suite_id
            }));
        }
    }, [mounted, showBugForm, activeSuite, formData.selectedSuiteId]);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (!mounted || !showBugForm || !currentUser || !formData.selectedSuiteId || !suites) return;

            const selectedSuite = suites.find(suite => suite.suite_id === formData.selectedSuiteId);
            if (!selectedSuite) return;

            const isOrganizationSuite = selectedSuite.accountType === 'organization';
            const organizationId = selectedSuite.organizationId;

            try {
                if (isOrganizationSuite && organizationId) {
                    const membersPath = `organizations/${organizationId}/members`;
                    const result = await firestoreService.queryDocuments(membersPath);
                    if (result.success) {
                        setTeamMembers(result.data.map(doc => ({
                            id: doc.id,
                            name: doc.profile?.name || doc.email || doc.id,
                            email: doc.email || doc.id
                        })));
                    } else {
                        throw new Error(result.error.message);
                    }
                } else {
                    setTeamMembers([]); // No team members for individual suites
                }

                setFormData(prev => ({
                    ...prev,
                    userAgent: navigator.userAgent,
                    browserInfo: getBrowserInfo(),
                    deviceInfo: getDeviceInfo()
                }));
            } catch (error) {
                console.error("Error fetching team members:", error);
                addNotification({
                    type: 'error',
                    title: 'Team Members Error',
                    message: 'Failed to load team members'
                });
            }
        };

        fetchTeamMembers();
    }, [mounted, showBugForm, currentUser, formData.selectedSuiteId, suites, addNotification]);

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

    const saveBugToFirestore = async (bugData) => {
        try {
            if (!currentUser?.uid) {
                throw new Error('User not authenticated. Please log in again.');
            }

            if (!formData.selectedSuiteId) {
                throw new Error('No test suite selected. Please select a test suite first.');
            }

            const selectedSuite = suites?.find(suite => suite.suite_id === formData.selectedSuiteId);
            if (!selectedSuite) {
                throw new Error('Selected test suite not found. Please refresh and try again.');
            }

            const isOrganizationSuite = selectedSuite.accountType === 'organization';
            const organizationId = selectedSuite.organizationId;

            if (isOrganizationSuite && !organizationId) {
                throw new Error('Invalid organization suite configuration.');
            }

            // Determine the correct bugs collection path based on account type
            const bugsCollectionPath = isOrganizationSuite
                ? `organizations/${organizationId}/testSuites/${formData.selectedSuiteId}/bugs`
                : `individualAccounts/${currentUser.uid}/testSuites/${formData.selectedSuiteId}/bugs`;

            const bugId = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const firestoreData = {
                id: bugId,
                suite_id: formData.selectedSuiteId,
                created_by: currentUser.uid,
                reportedBy: userDisplayName(),
                reportedByEmail: currentUser.email || "",
                title: bugData.title,
                description: bugData.description,
                actualBehavior: bugData.actualBehavior,
                stepsToReproduce: bugData.stepsToReproduce,
                expectedBehavior: bugData.expectedBehavior,
                workaround: bugData.workaround,
                status: bugData.status,
                priority: bugData.priority,
                severity: bugData.severity,
                category: bugData.category,
                tags: bugData.tags,
                assignedTo: bugData.assignedTo,
                source: bugData.source,
                environment: bugData.environment,
                browserInfo: bugData.browserInfo,
                deviceInfo: bugData.deviceInfo,
                userAgent: bugData.userAgent,
                frequency: bugData.frequency,
                hasConsoleLogs: bugData.hasConsoleLogs,
                hasNetworkLogs: bugData.hasNetworkLogs,
                hasAttachments: bugData.hasAttachments,
                attachments: bugData.attachments,
                resolution: bugData.resolution,
                resolvedAt: bugData.resolvedAt,
                resolvedBy: bugData.resolvedBy,
                resolvedByName: bugData.resolvedByName,
                comments: bugData.comments,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                updated_by: currentUser.uid,
                updatedByName: userDisplayName(),
                version: 1,
                searchTerms: [
                    bugData.title?.toLowerCase(),
                    bugData.description?.toLowerCase(),
                    bugData.category?.toLowerCase(),
                    bugData.severity?.toLowerCase(),
                    bugData.status?.toLowerCase(),
                    bugData.source?.toLowerCase(),
                    bugData.environment?.toLowerCase()
                ].filter(Boolean),
                resolutionHistory: [],
                commentCount: 0,
                viewCount: 0,
                lastActivity: serverTimestamp(),
                lastActivityBy: currentUser.uid
            };

            console.log('Saving bug to:', bugsCollectionPath, 'Data:', firestoreData);
            const result = await firestoreService.createDocument(bugsCollectionPath, firestoreData);
            if (result.success) {
                addNotification({
                    type: 'success',
                    title: 'Bug Created',
                    message: 'Bug report created successfully'
                });
                return { success: true, data: firestoreData };
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Error saving bug to Firestore:', error);
            let errorMessage = 'Failed to save bug report';
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. You may not have access to this test suite or organization.';
            } else if (error.code === 'unauthenticated') {
                errorMessage = 'Authentication required. Please log in and try again.';
            } else if (error.code === 'not-found') {
                errorMessage = 'Test suite or organization not found. Please select a valid test suite.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            addNotification({
                type: 'error',
                title: 'Bug Creation Error',
                message: errorMessage
            });
            throw new Error(errorMessage);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError("");

        try {
            const hasAttachments = attachments.length > 0;
            const priority = getPriorityFromSeverity(formData.severity);

            const bugData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                actualBehavior: formData.actualBehavior.trim(),
                stepsToReproduce: formData.stepsToReproduce.trim() || "",
                expectedBehavior: formData.expectedBehavior.trim() || "",
                workaround: formData.workaround.trim() || "",
                assignedTo: formData.assignedTo || null,
                status: "New",
                priority: priority,
                severity: formData.severity,
                category: formData.category,
                tags: [formData.category.toLowerCase().replace(/\s+/g, '_')],
                source: formData.source || "Manual",
                environment: formData.environment || "Production",
                browserInfo: formData.browserInfo || {},
                deviceInfo: formData.deviceInfo || {},
                userAgent: formData.userAgent || navigator.userAgent,
                frequency: formData.frequency || "Once",
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
                comments: []
            };

            await saveBugToFirestore(bugData);
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
            setError(error.message || 'Failed to submit bug report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleButtonClick = useCallback(() => {
        setShowBugForm(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const selectedSuiteInfo = getSelectedSuiteInfo();

    return (
        <>
            <button
                className={`group px-3 py-2 text-sm bg-teal-50 text-teal-700 border border-blue-200 hover:bg-teal-100 hover:border-teal-300 hover:shadow-md rounded flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${className}`}
                onClick={handleButtonClick}
                disabled={isSubmitting}
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