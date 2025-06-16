"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bug } from "lucide-react";
import { collection, addDoc, getDocs, Timestamp, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthProvider";
import { useProject } from "../context/ProjectContext";
import BugReportForm from "../components/create-bug/BugReportForm";
import BugReportSuccess from "../components/create-bug/BugReportSuccess";
import {
    getBrowserInfo,
    getDeviceInfo,
    getPriorityFromSeverity,
    validateBugForm,
    DEFAULT_BUG_FORM_DATA
} from "../utils/bugUtils";

const BugReportButton = ({ className = "" }) => {
    const { currentUser } = useAuth();
    const { userProfile, activeProject } = useProject();

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

    useEffect(() => {
        document.body.style.overflow = showBugForm ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showBugForm]);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const teamRef = collection(db, "teamMembers");
                const q = userProfile?.organizationId
                    ? query(teamRef, where("organizationId", "==", userProfile.organizationId))
                    : teamRef;

                const snapshot = await getDocs(q);
                const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeamMembers(members);
            } catch (error) {
                console.error("Error fetching team members:", error);
            }
        };

        const fetchRecordings = async () => {
            setIsLoadingRecordings(true);
            try {
                const recordingsRef = collection(db, "recordings");
                const q = currentUser
                    ? query(recordingsRef, where("createdBy", "==", currentUser.uid))
                    : recordingsRef;
                const snapshot = await getDocs(q);
                const recordingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecordings(recordingData);
            } catch (error) {
                console.error("Error fetching recordings:", error);
            } finally {
                setIsLoadingRecordings(false);
            }
        };

        if (showBugForm && currentUser) {
            fetchTeamMembers();
            fetchRecordings();
            
            // Auto-populate browser and device info using utilities
            setFormData(prev => ({
                ...prev,
                userAgent: navigator.userAgent,
                browserInfo: getBrowserInfo(),
                deviceInfo: getDeviceInfo()
            }));
        }
    }, [showBugForm, currentUser, userProfile]);

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const validation = validateBugForm(formData);
        if (!validation.isValid) {
            setError(validation.errors[0]); // Show first error
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

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (!currentUser) {
            setError("You must be logged in to submit a bug report");
            return;
        }

        setIsSubmitting(true);

        try {
            // Calculate additional fields based on attachments
            const hasVideoEvidence = attachments.some(att => 
                att.isRecording || att.type?.startsWith('video/')
            );
            const hasAttachments = attachments.length > 0;

            // Use utility function to determine priority based on severity
            const priority = getPriorityFromSeverity(formData.severity);

            const bugData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                stepsToReproduce: formData.stepsToReproduce.trim() || "",
                expectedBehavior: formData.expectedBehavior.trim() || "",
                actualBehavior: formData.actualBehavior.trim(),
                workaround: formData.workaround.trim() || "",
                
                // IDs and References
                projectId: activeProject?.id || null,
                organizationId: userProfile?.organizationId || null,
                createdBy: currentUser.uid,
                assignedTo: formData.assignedTo || null,
                
                // Reporter Info
                reportedBy: currentUser.displayName || currentUser.uid,
                reportedByEmail: currentUser.email || "",
                
                // Classification
                status: "New",
                priority: priority,
                severity: formData.severity,
                category: formData.category,
                tags: [formData.category.toLowerCase().replace(/\s+/g, '_')],
                
                // Technical Details
                source: formData.source,
                environment: formData.environment,
                browserInfo: formData.browserInfo,
                deviceInfo: formData.deviceInfo,
                userAgent: formData.userAgent,
                frequency: formData.frequency,
                
                // Evidence Flags
                hasVideoEvidence,
                hasConsoleLogs: formData.hasConsoleLogs,
                hasNetworkLogs: formData.hasNetworkLogs,
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
                
                // Timestamps
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                
                // Resolution fields (empty for new bugs)
                resolution: "",
                resolvedAt: null,
                resolvedBy: null,
                comments: []
            };

            await addDoc(collection(db, "bugs"), bugData);
            setSuccess(true);
            
            // Reset form using utility default
            setFormData(DEFAULT_BUG_FORM_DATA);
            setAttachments([]);
            setError("");

            setTimeout(() => {
                closeForm();
            }, 3000);

        } catch (error) {
            console.error("Error submitting bug report:", error);

            if (error.code === 'permission-denied') {
                setError("Permission denied. Please check your account permissions.");
            } else if (error.code === 'unauthenticated') {
                setError("Authentication required. Please log in and try again.");
            } else {
                setError(`Failed to submit bug report: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) return null;

    return (
        <>
            <button
                className={`group px-4 py-2 text-sm rounded-lg flex items-center space-x-2 transition-all duration-200 hover:shadow-md ${className}`}
                onClick={() => setShowBugForm(true)}
            >
                <Bug className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="hidden md:inline font-medium">Report Bug</span>
            </button>

            {showBugForm && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
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