"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bug } from "lucide-react";
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useSuite } from "../context/SuiteContext";
import BugReportForm from "../components/create-bug/BugReportForm";
import BugReportSuccess from "../components/create-bug/BugReportSuccess";
import { toast } from "sonner";
import {
    getBrowserInfo,
    getDeviceInfo,
    getPriorityFromSeverity,
    validateBugForm,
    DEFAULT_BUG_FORM_DATA
} from "../utils/bugUtils";

const BugReportButton = ({ className = "" }) => {
    const { user, userProfile, activeSuite, suites } = useSuite();

    const [showBugForm, setShowBugForm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

    // Form state - using utility default
    const [formData, setFormData] = useState({
        ...DEFAULT_BUG_FORM_DATA,
        selectedSuiteId: null // Add suite selection to form data
    });
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get user display name
    const userDisplayName = userProfile?.profile_info?.name ||
        user?.displayName ||
        user?.email ||
        'Unknown User';

    useEffect(() => {
        document.body.style.overflow = showBugForm ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showBugForm]);

    // Set default suite when form opens
    useEffect(() => {
        if (showBugForm && activeSuite && !formData.selectedSuiteId) {
            setFormData(prev => ({
                ...prev,
                selectedSuiteId: activeSuite.suite_id
            }));
        }
    }, [showBugForm, activeSuite, formData.selectedSuiteId]);

    // Fetch team members and recordings when suite is selected
    useEffect(() => {
        const fetchSuiteData = async () => {
            if (!showBugForm || !user || !formData.selectedSuiteId) return;

            // Find the selected suite
            const selectedSuite = suites.find(suite => suite.suite_id === formData.selectedSuiteId);
            if (!selectedSuite) return;

            const isOrganizationSuite = selectedSuite.accountType === 'organization';
            const organizationId = selectedSuite.organizationId;

            try {
                // Fetch team members
                if (isOrganizationSuite && organizationId) {
                    const membersRef = collection(db, "organizations", organizationId, "members");
                    const snapshot = await getDocs(membersRef);
                    const members = snapshot.docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data(),
                        name: doc.data().profile?.name || doc.data().email || doc.id,
                        email: doc.data().email || doc.id
                    }));
                    setTeamMembers(members);
                } else {
                    setTeamMembers([]);
                }

                // Fetch recordings
                setIsLoadingRecordings(true);
                let recordingsRef;
                
                if (isOrganizationSuite && organizationId) {
                    recordingsRef = collection(db, "organizations", organizationId, "testSuites", formData.selectedSuiteId, "recordings");
                } else {
                    recordingsRef = collection(db, "individualAccounts", user.uid, "testSuites", formData.selectedSuiteId, "recordings");
                }

                const q = query(recordingsRef, where("metadata.created_by", "==", user.uid));
                const snapshot = await getDocs(q);
                const recordingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecordings(recordingData);
            } catch (error) {
                console.error("Error fetching suite data:", error);
                setTeamMembers([]);
                setRecordings([]);
            } finally {
                setIsLoadingRecordings(false);
            }
        };

        if (showBugForm && user && formData.selectedSuiteId) {
            fetchSuiteData();

            // Auto-populate browser and device info
            setFormData(prev => ({
                ...prev,
                userAgent: navigator.userAgent,
                browserInfo: getBrowserInfo(),
                deviceInfo: getDeviceInfo()
            }));
        }
    }, [showBugForm, user, formData.selectedSuiteId, suites]);

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        // Check if suite is selected
        if (!formData.selectedSuiteId) {
            setError("Please select a test suite");
            return false;
        }

        // Validate other form fields
        const validation = validateBugForm(formData);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return false;
        }
        setError("");
        return true;
    };

    const closeForm = () => {
        setFormData({
            ...DEFAULT_BUG_FORM_DATA,
            selectedSuiteId: null
        });
        setAttachments([]);
        setError("");
        setSuccess(false);
        setShowBugForm(false);
    };

    // Updated bug saving logic
    const saveBugToFirestore = async (bugData) => {
        try {
            if (!user?.uid) {
                throw new Error('User not authenticated. Please log in again.');
            }

            if (!formData.selectedSuiteId) {
                throw new Error('No test suite selected. Please select a test suite first.');
            }

            // Find the selected suite
            const selectedSuite = suites.find(suite => suite.suite_id === formData.selectedSuiteId);
            if (!selectedSuite) {
                throw new Error('Selected test suite not found. Please refresh and try again.');
            }

            const isOrganizationSuite = selectedSuite.accountType === 'organization';
            const organizationId = selectedSuite.organizationId;

            const bugId = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            let bugRef;
            
            // Create bug reference following security rules structure
            if (isOrganizationSuite && organizationId) {
                bugRef = doc(db, 'organizations', organizationId, 'testSuites', formData.selectedSuiteId, 'bugs', bugId);
            } else {
                bugRef = doc(db, 'individualAccounts', user.uid, 'testSuites', formData.selectedSuiteId, 'bugs', bugId);
            }

            // Prepare bug data following the expected structure
            const firestoreData = {
                // Core identification
                id: bugId,
                suiteId: formData.selectedSuiteId,

                // User context (required by security rules)
                created_by: user.uid,
                reportedBy: userDisplayName,
                reportedByEmail: user.email || "",

                // Bug details
                title: bugData.title,
                description: bugData.description,
                actualBehavior: bugData.actualBehavior,
                stepsToReproduce: bugData.stepsToReproduce,
                expectedBehavior: bugData.expectedBehavior,
                workaround: bugData.workaround,

                // Classification
                status: bugData.status,
                priority: bugData.priority,
                severity: bugData.severity,
                category: bugData.category,
                tags: bugData.tags,

                // Assignment
                assignedTo: bugData.assignedTo,

                // Technical details
                source: bugData.source,
                environment: bugData.environment,
                browserInfo: bugData.browserInfo,
                deviceInfo: bugData.deviceInfo,
                userAgent: bugData.userAgent,
                frequency: bugData.frequency,

                // Evidence flags
                hasVideoEvidence: bugData.hasVideoEvidence,
                hasConsoleLogs: bugData.hasConsoleLogs,
                hasNetworkLogs: bugData.hasNetworkLogs,
                hasAttachments: bugData.hasAttachments,

                // Attachments
                attachments: bugData.attachments,

                // Resolution fields
                resolution: bugData.resolution,
                resolvedAt: bugData.resolvedAt,
                resolvedBy: bugData.resolvedBy,
                resolvedByName: bugData.resolvedByName,
                comments: bugData.comments,

                // Timestamps
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy: user.uid,
                updatedByName: userDisplayName,

                // Version control
                version: 1,

                // Search optimization
                searchTerms: [
                    bugData.title?.toLowerCase(),
                    bugData.description?.toLowerCase(),
                    bugData.category?.toLowerCase(),
                    bugData.severity?.toLowerCase(),
                    bugData.status?.toLowerCase(),
                    bugData.source?.toLowerCase(),
                    bugData.environment?.toLowerCase()
                ].filter(Boolean),

                // Tracking fields
                resolutionHistory: [],
                commentCount: 0,
                viewCount: 0,

                // Activity tracking
                lastActivity: serverTimestamp(),
                lastActivityBy: user.uid
            };

            // Save to Firestore
            await setDoc(bugRef, firestoreData);

            console.log('Bug saved successfully:', bugId);
            toast.success('Bug report created successfully');

            return { success: true, data: firestoreData };
        } catch (error) {
            console.error('Error saving bug to Firestore:', error);

            let errorMessage = 'Failed to save bug report';

            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. You may not have access to this test suite.';
            } else if (error.code === 'unauthenticated') {
                errorMessage = 'Authentication required. Please log in and try again.';
            } else if (error.code === 'not-found') {
                errorMessage = 'Test suite not found. Please select a valid test suite.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const handleSubmit = async () => {
        // Pre-submission validation
        if (!user?.uid) {
            const errorMsg = 'Please log in to submit bug reports';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setError("");

        try {
            // Calculate additional fields
            const hasVideoEvidence = attachments.some(att =>
                att.isRecording || att.type?.startsWith('video/')
            );
            const hasAttachments = attachments.length > 0;
            const priority = getPriorityFromSeverity(formData.severity);

            // Prepare bug data with all required fields
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
                hasVideoEvidence,
                hasConsoleLogs: formData.hasConsoleLogs || false,
                hasNetworkLogs: formData.hasNetworkLogs || false,
                hasAttachments,
                attachments: attachments.map(att => ({
                    name: att.name,
                    url: att.url || null,
                    type: att.type || null,
                    size: att.size || null,
                    isRecording: att.isRecording || false,
                    recordingId: att.recordingId || null
                })),
                resolution: "",
                resolvedAt: null,
                resolvedBy: null,
                resolvedByName: null,
                comments: []
            };

            // Save to Firestore
            await saveBugToFirestore(bugData);

            // Show success state
            setSuccess(true);

            // Reset form
            setFormData({
                ...DEFAULT_BUG_FORM_DATA,
                selectedSuiteId: null
            });
            setAttachments([]);
            setError("");

            // Auto-close after 3 seconds
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

    // Don't show button if not authenticated
    if (!user) {
        return null;
    }

    // Show disabled state if no suites available
    if (suites.length === 0) {
        return (
            <button
                className={`group px-3 py-2 text-sm rounded-lg flex items-center space-x-2 transition-all duration-200 opacity-50 cursor-not-allowed ${className}`}
                disabled
                title="No test suites available. Create a test suite first."
            >
                <Bug className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Report Bug</span>
            </button>
        );
    }

    return (
        <>
            <button
                className={`group px-3 py-2 text-sm rounded-lg flex items-center space-x-2 transition-all duration-200 hover:shadow-md ${className}`}
                onClick={() => setShowBugForm(true)}
            >
                <Bug className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline font-medium">Report Bug</span>
            </button>

            {showBugForm && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex-shrink-0 border-b px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Report Bug
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        {formData.selectedSuiteId ? (
                                            <>
                                                Test Suite: {suites.find(s => s.suite_id === formData.selectedSuiteId)?.metadata?.name || formData.selectedSuiteId}
                                                {suites.find(s => s.suite_id === formData.selectedSuiteId)?.accountType === 'organization' && (
                                                    <span className="ml-2 text-blue-600">
                                                        (Organization)
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

                        {/* Form content */}
                        {success ? (
                            <BugReportSuccess onClose={closeForm} />
                        ) : (
                            <BugReportForm
                                formData={formData}
                                updateFormData={updateFormData}
                                attachments={attachments}
                                setAttachments={setAttachments}
                                teamMembers={teamMembers}
                                recordings={recordings}
                                isLoadingRecordings={isLoadingRecordings}
                                error={error}
                                setError={setError}
                                isSubmitting={isSubmitting}
                                onSubmit={handleSubmit}
                                onClose={closeForm}
                                suites={suites} // Pass all available suites
                                activeSuite={activeSuite}
                                userProfile={userProfile}
                                showSuiteSelector={true} // Enable suite selection in form
                            />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default BugReportButton;