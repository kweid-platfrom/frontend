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
    const { user, userProfile, activeSuite } = useSuite();

    const [showBugForm, setShowBugForm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

    // Form state - using utility default
    const [formData, setFormData] = useState(DEFAULT_BUG_FORM_DATA);
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get the effective suite ID
    const effectiveSuiteId = activeSuite?.suite_id;

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

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                // Check if user is part of an organization
                if (userProfile?.account_memberships?.length > 0) {
                    const activeOrg = userProfile.account_memberships.find(m => m.status === 'active');
                    if (activeOrg) {
                        // Fetch from organization subcollection
                        const teamRef = collection(db, "organizations", activeOrg.org_id, "teamMembers");
                        const snapshot = await getDocs(teamRef);
                        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setTeamMembers(members);
                    } else {
                        setTeamMembers([]);
                    }
                } else {
                    // For individual users, no team members
                    setTeamMembers([]);
                }
            } catch (error) {
                console.error("Error fetching team members:", error);
                setTeamMembers([]);
            }
        };

        const fetchRecordings = async () => {
            if (!effectiveSuiteId) return;
            
            setIsLoadingRecordings(true);
            try {
                // Fetch recordings from suite's testing_assets
                const recordingsRef = collection(db, "testSuites", effectiveSuiteId, "recordings");
                const q = user
                    ? query(recordingsRef, where("metadata.created_by", "==", user.uid))
                    : recordingsRef;
                const snapshot = await getDocs(q);
                const recordingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecordings(recordingData);
            } catch (error) {
                console.error("Error fetching recordings:", error);
                setRecordings([]);
            } finally {
                setIsLoadingRecordings(false);
            }
        };

        if (showBugForm && user && effectiveSuiteId) {
            fetchTeamMembers();
            fetchRecordings();
            
            // Auto-populate browser and device info
            setFormData(prev => ({
                ...prev,
                userAgent: navigator.userAgent,
                browserInfo: getBrowserInfo(),
                deviceInfo: getDeviceInfo()
            }));
        }
    }, [showBugForm, user, userProfile, effectiveSuiteId]);

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const validation = validateBugForm(formData);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return false;
        }
        setError("");
        return true;
    };

    const closeForm = () => {
        setFormData(DEFAULT_BUG_FORM_DATA);
        setAttachments([]);
        setError("");
        setSuccess(false);
        setShowBugForm(false);
    };

    // Updated bug saving logic with proper suite context
    const saveBugToFirestore = async (bugData) => {
        try {
            // Validate authentication
            if (!user?.uid) {
                throw new Error('User not authenticated. Please log in again.');
            }

            if (!effectiveSuiteId) {
                throw new Error('No test suite selected. Please select a test suite first.');
            }

            // Validate suite access
            if (!activeSuite) {
                throw new Error('Test suite not found. Please refresh and try again.');
            }

            const bugId = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const bugRef = doc(db, 'testSuites', effectiveSuiteId, 'bugs', bugId);

            // Get organization context from active suite or user profile
            const organizationId = activeSuite.organizationId || 
                                 activeSuite.access_control?.owner_id !== user.uid ? activeSuite.access_control?.owner_id : 
                                 userProfile?.account_memberships?.find(m => m.status === 'active')?.org_id || 
                                 null;

            // Prepare bug data with proper suite context
            const firestoreData = {
                ...bugData,
                id: bugId,
                suiteId: effectiveSuiteId,
                
                // User context
                createdBy: user.uid,
                createdByName: userDisplayName,
                
                // Organization context (critical for security rules)
                organizationId: organizationId,
                
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
            
            // Enhanced error handling
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

        if (!effectiveSuiteId) {
            const errorMsg = 'Please select a test suite first';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (!activeSuite) {
            const errorMsg = 'Test suite not found. Please refresh and try again.';
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
                // Core bug information
                title: formData.title.trim(),
                description: formData.description.trim(),
                actualBehavior: formData.actualBehavior.trim(),
                
                // Optional detailed fields
                stepsToReproduce: formData.stepsToReproduce.trim() || "",
                expectedBehavior: formData.expectedBehavior.trim() || "",
                workaround: formData.workaround.trim() || "",
                
                // Assignment and reporting
                assignedTo: formData.assignedTo || null,
                reportedBy: userDisplayName,
                reportedByEmail: user.email || "",
                
                // Classification (required by security rules)
                status: "New",
                priority: priority,
                severity: formData.severity,
                category: formData.category,
                tags: [formData.category.toLowerCase().replace(/\s+/g, '_')],
                
                // Technical details
                source: formData.source || "Manual",
                environment: formData.environment || "Production",
                browserInfo: formData.browserInfo || {},
                deviceInfo: formData.deviceInfo || {},
                userAgent: formData.userAgent || navigator.userAgent,
                frequency: formData.frequency || "Once",
                
                // Evidence flags
                hasVideoEvidence,
                hasConsoleLogs: formData.hasConsoleLogs || false,
                hasNetworkLogs: formData.hasNetworkLogs || false,
                hasAttachments,
                
                // Attachments
                attachments: attachments.map(att => ({
                    name: att.name,
                    url: att.url || null,
                    type: att.type || null,
                    size: att.size || null,
                    isRecording: att.isRecording || false,
                    recordingId: att.recordingId || null
                })),
                
                // Resolution fields (empty for new bugs)
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
            setFormData(DEFAULT_BUG_FORM_DATA);
            setAttachments([]);
            setError("");

            // Auto-close after 3 seconds
            setTimeout(() => {
                closeForm();
            }, 3000);

        } catch (error) {
            console.error("Error submitting bug report:", error);
            
            // Set error for display
            setError(error.message || 'Failed to submit bug report');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't show button if not authenticated
    if (!user) {
        return null;
    }

    // Show disabled state if no suite selected
    if (!effectiveSuiteId || !activeSuite) {
        return (
            <button
                className={`group px-3 py-2 text-sm rounded-lg flex items-center space-x-2 transition-all duration-200 opacity-50 cursor-not-allowed ${className}`}
                disabled
                title="Please select a test suite to report bugs"
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
                        {/* Header with suite info */}
                        <div className="flex-shrink-0 border-b px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Report Bug
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        Test Suite: {activeSuite?.metadata?.name || effectiveSuiteId}
                                        {activeSuite?.isOrganizationSuite && (
                                            <span className="ml-2 text-blue-600">
                                                (Organization)
                                            </span>
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
                                suiteId={effectiveSuiteId}
                                suiteName={activeSuite?.metadata?.name}
                                userProfile={userProfile}
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