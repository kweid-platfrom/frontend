"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useSuite } from "../context/SuiteContext";
import { useUserProfile } from "../context/userProfileContext";
import { useAuth } from "../context/AuthProvider"; // Import useAuth directly
import BugReportForm from "./create-bug/BugReportForm";
import BugReportSuccess from "./create-bug/BugReportSuccess";
import { toast } from "sonner";
import { BugAntIcon } from "@heroicons/react/24/outline";
import { validateSuiteAccess } from "../utils/suiteValidation"; // Import validation utility
import {
    getBrowserInfo,
    getDeviceInfo,
    getPriorityFromSeverity,
    validateBugForm,
    DEFAULT_BUG_FORM_DATA
} from "../utils/bugUtils";

const BugReportButton = ({ className = "" }) => {
    // Get auth state directly from AuthProvider for most reliable user state
    const { user: authUser } = useAuth();
    
    // Get suite context (which also provides user, but might have timing issues)
    const { user: suiteUser, activeSuite, suites, loading: suiteLoading, shouldFetchSuites } = useSuite();
    
    // Get user profile
    const { userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile();

    // Use the most reliable user source (prefer authUser over suiteUser)
    const user = authUser || suiteUser;

    const [showBugForm, setShowBugForm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [mounted, setMounted] = useState(false);

    // Form state - using utility default
    const [formData, setFormData] = useState({
        ...DEFAULT_BUG_FORM_DATA,
        selectedSuiteId: null 
    });
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get user display name with proper fallback chain
    const userDisplayName = useCallback(() => {
        if (userProfile?.profile_info?.name) return userProfile.profile_info.name;
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email;
        return 'Unknown User';
    }, [userProfile?.profile_info?.name, user?.displayName, user?.email]);

    // Handle mounting
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

    // Debug logging for authentication state
    useEffect(() => {
        console.log('BugReportButton Auth Debug:', {
            authUser: authUser ? { uid: authUser.uid, email: authUser.email, emailVerified: authUser.emailVerified } : null,
            suiteUser: suiteUser ? { uid: suiteUser.uid, email: suiteUser.email } : null,
            finalUser: user ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified } : null,
            userProfile: userProfile ? { loaded: true, accountType: userProfile.accountType } : null,
            suiteLoading,
            isProfileLoading,
            profileError,
            shouldFetchSuites,
            suitesCount: suites?.length || 0
        });
    }, [authUser, suiteUser, user, userProfile, suiteLoading, isProfileLoading, profileError, shouldFetchSuites, suites]);

    // Set default suite when form opens - only after mounting
    useEffect(() => {
        if (mounted && showBugForm && activeSuite && !formData.selectedSuiteId) {
            setFormData(prev => ({
                ...prev,
                selectedSuiteId: activeSuite.suite_id
            }));
        }
    }, [mounted, showBugForm, activeSuite, formData.selectedSuiteId]);

    // Fetch team members when suite is selected - only after mounting
    useEffect(() => {
        const fetchSuiteData = async () => {
            if (!mounted || !showBugForm || !user || !formData.selectedSuiteId || !suites) return;

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

                // Auto-populate browser and device info
                setFormData(prev => ({
                    ...prev,
                    userAgent: navigator.userAgent,
                    browserInfo: getBrowserInfo(),
                    deviceInfo: getDeviceInfo()
                }));
            } catch (error) {
                console.error("Error fetching suite data:", error);
                setTeamMembers([]);
                toast.error("Failed to load team members");
            }
        };

        fetchSuiteData();
    }, [mounted, showBugForm, user, formData.selectedSuiteId, suites]);

    const updateFormData = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const validateForm = useCallback(() => {
        // Check if suite is selected
        if (!formData.selectedSuiteId) {
            setError("Please select a test suite");
            return false;
        }

        // Validate suite access using the validation utility
        const selectedSuite = suites?.find(suite => suite.suite_id === formData.selectedSuiteId);
        if (selectedSuite) {
            const accessValidation = validateSuiteAccess(selectedSuite, user, userProfile);
            if (!accessValidation.isValid) {
                setError(accessValidation.error);
                return false;
            }
        }

        // Validate other form fields
        const validation = validateBugForm(formData);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return false;
        }
        setError("");
        return true;
    }, [formData, suites, user, userProfile]);

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

    // Updated bug saving logic with proper Firestore security rules compliance
    const saveBugToFirestore = async (bugData) => {
        try {
            if (!user?.uid) {
                throw new Error('User not authenticated. Please log in again.');
            }

            if (!formData.selectedSuiteId) {
                throw new Error('No test suite selected. Please select a test suite first.');
            }

            // Find the selected suite
            const selectedSuite = suites?.find(suite => suite.suite_id === formData.selectedSuiteId);
            if (!selectedSuite) {
                throw new Error('Selected test suite not found. Please refresh and try again.');
            }

            // Validate access using the validation utility
            const accessValidation = validateSuiteAccess(selectedSuite, user, userProfile);
            if (!accessValidation.isValid) {
                throw new Error(accessValidation.error);
            }

            const isOrganizationSuite = selectedSuite.accountType === 'organization';
            const organizationId = selectedSuite.organizationId;

            // Validate user access based on suite type
            if (isOrganizationSuite && !organizationId) {
                throw new Error('Invalid organization suite configuration.');
            }

            const bugId = `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            let bugRef;
            
            // Create bug reference following security rules structure
            if (isOrganizationSuite && organizationId) {
                // For organization suites: /organizations/{orgId}/testSuites/{suiteId}/bugs/{bugId}
                bugRef = doc(db, 'organizations', organizationId, 'testSuites', formData.selectedSuiteId, 'bugs', bugId);
            } else {
                // For individual suites: /individualAccounts/{userId}/testSuites/{suiteId}/bugs/{bugId}
                bugRef = doc(db, 'individualAccounts', user.uid, 'testSuites', formData.selectedSuiteId, 'bugs', bugId);
            }

            // Prepare bug data following the expected structure and security rules requirements
            const firestoreData = {
                // Core identification
                id: bugId,
                suiteId: formData.selectedSuiteId,

                // User context (required by security rules - created_by must match authenticated user)
                created_by: user.uid, // This is critical for security rules
                reportedBy: userDisplayName(),
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
                updatedBy: user.uid, // Must match authenticated user
                updatedByName: userDisplayName(),

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
                lastActivityBy: user.uid // Must match authenticated user
            };

            // Save to Firestore
            await setDoc(bugRef, firestoreData);

            console.log('Bug saved successfully:', bugId);
            toast.success('Bug report created successfully');

            return { success: true, data: firestoreData };
        } catch (error) {
            console.error('Error saving bug to Firestore:', error);

            let errorMessage = 'Failed to save bug report';

            // Handle specific Firestore errors
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. You may not have access to this test suite or organization.';
            } else if (error.code === 'unauthenticated') {
                errorMessage = 'Authentication required. Please log in and try again.';
            } else if (error.code === 'not-found') {
                errorMessage = 'Test suite or organization not found. Please select a valid test suite.';
            } else if (error.code === 'failed-precondition') {
                errorMessage = 'Invalid request. Please check your permissions and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const handleSubmit = async () => {
        // Pre-submission validation - check for authentication and profile
        if (!user?.uid) {
            const errorMsg = 'Please log in to submit bug reports';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        // Wait for user profile to load if it's still loading
        if (isProfileLoading) {
            toast.error('Loading user profile. Please wait...');
            return;
        }

        if (profileError) {
            toast.error('Failed to load user profile. Please refresh and try again.');
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setError("");

        try {
            // Calculate additional fields
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

    const handleButtonClick = useCallback(() => {
        console.log('Bug Report Button clicked - Current state:', {
            user: user ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified } : null,
            suiteLoading,
            isProfileLoading,
            profileError,
            shouldFetchSuites,
            suitesCount: suites?.length || 0
        });

        // Check if still loading authentication
        if (suiteLoading && !user) {
            toast.error('Loading authentication. Please wait...');
            return;
        }

        // Check authentication first
        if (!user) {
            console.log('No user found - redirecting to login');
            toast.error('Please log in to report bugs');
            return;
        }

        // Check email verification (required by Firestore rules)
        if (!user.emailVerified) {
            toast.error('Please verify your email address before reporting bugs');
            return;
        }

        // Check if user profile is loading
        if (isProfileLoading) {
            toast.error('Loading user profile. Please wait...');
            return;
        }

        // Check for profile errors
        if (profileError) {
            console.error('Profile error:', profileError);
            toast.error('Failed to load user profile. Please refresh and try again.');
            return;
        }
        
        // Check if suites are available
        if (!suites || suites.length === 0) {
            if (suiteLoading) {
                toast.error('Loading test suites. Please wait...');
                return;
            }
            toast.error('No test suites available. Create a test suite first.');
            return;
        }
        
        setShowBugForm(true);
    }, [user, suiteLoading, isProfileLoading, profileError, suites, shouldFetchSuites]);

    // Determine loading state
    const isLoading = suiteLoading || isProfileLoading;

    // Loading state while profile/suites load
    if (isLoading && (!user || !userProfile)) {
        return (
            <button
                className={`group px-3 py-2 text-sm bg-gray-50 text-gray-400 border border-gray-200 rounded flex items-center space-x-2 cursor-not-allowed ${className}`}
                disabled
            >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="hidden sm:inline font-medium">Loading...</span>
            </button>
        );
    }

    // Error state
    if (profileError) {
        return (
            <button
                className={`group px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded flex items-center space-x-2 cursor-not-allowed ${className}`}
                disabled
                title={`Profile Error: ${profileError}`}
            >
                <span className="text-red-500">⚠️</span>
                <span className="hidden sm:inline font-medium">Error</span>
            </button>
        );
    }

    // Don't render until mounted to prevent hydration issues
    if (!mounted) {
        return null;
    }

    // Determine button state
    const isButtonDisabled = isSubmitting || isLoading || !user || !user.emailVerified;
    const buttonTitle = !user ? 'Please log in to report bugs' :
                       !user.emailVerified ? 'Please verify your email address' :
                       isLoading ? 'Loading...' : 'Report a bug';

    return (
        <>
            <button
                className={`group px-3 py-2 text-sm ${
                    isButtonDisabled 
                        ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed' 
                        : 'bg-teal-50 text-teal-700 border border-blue-200 hover:bg-teal-100 hover:border-teal-300 hover:shadow-md'
                } rounded flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${className}`}
                onClick={handleButtonClick}
                disabled={isButtonDisabled}
                title={buttonTitle}
            >
                <BugAntIcon className={`h-4 w-4 transition-transform ${!isButtonDisabled ? 'group-hover:scale-110' : ''}`} />
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
                                                Test Suite: {suites?.find(s => s.suite_id === formData.selectedSuiteId)?.metadata?.name || formData.selectedSuiteId}
                                                {suites?.find(s => s.suite_id === formData.selectedSuiteId)?.accountType === 'organization' && (
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
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default BugReportButton;