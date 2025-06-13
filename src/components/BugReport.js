"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Bug,
    Upload,
    CheckCircle,
    AlertCircle,
    Paperclip,
    Trash2,
    Play,
    FileText,
    Image as ImageIcon,
    Video
} from "lucide-react";
import { db, storage } from "../config/firebase";
import {
    collection,
    addDoc,
    getDocs,
    Timestamp,
    query,
    where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthProvider";
import { useProject } from "../context/ProjectContext";

const BugReportButton = ({ className = "" }) => {
    const { currentUser } = useAuth();
    const { userProfile, activeProject } = useProject();

    const [showBugForm, setShowBugForm] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("UI Issue");
    const [description, setDescription] = useState("");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [severity, setSeverity] = useState("Low");
    const [assignedTo, setAssignedTo] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRecordingModal, setShowRecordingModal] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
    const [selectedRecordings, setSelectedRecordings] = useState([]);
    const [, setUploadProgress] = useState({});
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

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
        }
    }, [showBugForm, currentUser, userProfile]);

    // File upload handling
    const handleFiles = async (files) => {
        const fileArray = Array.from(files);
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/', 'video/', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/json'
        ];

        const validFiles = fileArray.filter(file => {
            if (file.size > maxSize) {
                setError(`File ${file.name} is too large. Maximum size is 10MB.`);
                return false;
            }

            if (!allowedTypes.some(type => file.type.startsWith(type))) {
                setError(`File ${file.name} is not a supported format.`);
                return false;
            }

            return true;
        });

        if (validFiles.length > 0) {
            setError("");
            const newAttachments = validFiles.map(file => ({
                file,
                name: file.name,
                size: file.size,
                type: file.type,
                id: Date.now() + Math.random(),
                isUploaded: false
            }));

            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const handleAttachmentChange = (event) => {
        handleFiles(event.target.files);
        event.target.value = ''; // Reset input
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZoneRef.current?.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files?.length > 0) {
            handleFiles(files);
        }
    };

    const removeAttachment = (attachmentId) => {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
        if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const toggleRecordingSelection = (recording) => {
        setSelectedRecordings(prev => {
            if (prev.some(r => r.id === recording.id)) {
                return prev.filter(r => r.id !== recording.id);
            } else {
                return [...prev, recording];
            }
        });
    };

    const addSelectedRecordings = () => {
        const recordingFiles = selectedRecordings.map(recording => ({
            name: recording.title || `Recording-${recording.id.slice(0, 8)}`,
            url: recording.url,
            isRecording: true,
            id: recording.id,
            isUploaded: true
        }));

        setAttachments(prev => [...prev, ...recordingFiles]);
        setShowRecordingModal(false);
        setSelectedRecordings([]);
    };

    const validateForm = () => {
        if (!title.trim()) {
            setError("Title is required");
            return false;
        }
        if (!description.trim()) {
            setError("Description is required");
            return false;
        }
        setError("");
        return true;
    };

    const closeForm = () => {
        setTitle("");
        setDescription("");
        setStepsToReproduce("");
        setAttachments([]);
        setAssignedTo("");
        setSeverity("Low");
        setCategory("UI Issue");
        setError("");
        setSuccess(false);
        setShowBugForm(false);
        setUploadProgress({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (!currentUser) {
            setError("You must be logged in to submit a bug report");
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload file attachments to Firebase Storage
            const uploadedFiles = await Promise.all(
                attachments.map(async (attachment) => {
                    if (attachment.isRecording && attachment.url) {
                        return {
                            name: attachment.name,
                            url: attachment.url,
                            isRecording: true,
                            recordingId: attachment.id
                        };
                    }

                    if (attachment.isUploaded) {
                        return attachment;
                    }

                    // Upload new files
                    const storageRef = ref(storage, `bugs/${Date.now()}_${attachment.file.name}`);

                    setUploadProgress(prev => ({ ...prev, [attachment.id]: 0 }));

                    await uploadBytes(storageRef, attachment.file);
                    const downloadURL = await getDownloadURL(storageRef);

                    setUploadProgress(prev => ({ ...prev, [attachment.id]: 100 }));

                    return {
                        name: attachment.name,
                        url: downloadURL,
                        size: attachment.size,
                        type: attachment.type,
                        isRecording: false
                    };
                })
            );

            const bugData = {
                title: title.trim(),
                description: description.trim(),
                createdBy: currentUser.uid,
                createdAt: Timestamp.now(),
                status: "New",
                projectId: activeProject?.id || null,
                category,
                stepsToReproduce: stepsToReproduce.trim() || "",
                severity,
                assignedTo: assignedTo || null,
                reportedBy: currentUser.displayName || currentUser.uid,
                reportedByEmail: currentUser.email || "",
                organizationId: userProfile?.organizationId || null,
                attachments: uploadedFiles,
                priority: severity === 'High' ? 'Critical' : severity === 'Medium' ? 'High' : 'Low',
                tags: [category.toLowerCase().replace(/\s+/g, '_')],
                updatedAt: Timestamp.now(),
                comments: [],
                resolution: "",
                resolvedAt: null,
                resolvedBy: null
            };

            await addDoc(collection(db, "bugs"), bugData);
            setSuccess(true);

            // Reset form
            setTitle("");
            setDescription("");
            setStepsToReproduce("");
            setAttachments([]);
            setAssignedTo("");
            setSeverity("Low");
            setCategory("UI Issue");
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
            setUploadProgress({});
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
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <Bug className="h-5 w-5 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Report a Bug</h2>
                            </div>
                            <button
                                onClick={() => !isSubmitting && !success && closeForm()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                disabled={isSubmitting || success}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 min-h-0">
                            {success ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Bug Report Submitted!</h3>
                                    <p className="text-gray-600 mb-6">Thank you for helping us improve the application.</p>
                                    <button
                                        onClick={closeForm}
                                        className="px-6 py-2 bg-[#00897B] text-white rounded-lg hover:bg-[#00796B] transition-colors duration-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Scrollable Form Content */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                        {error && (
                                            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-red-700 text-sm">{error}</p>
                                            </div>
                                        )}

                                        {/* Title */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-900">
                                                Bug Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Brief, clear title describing the issue"
                                                required
                                            />
                                        </div>

                                        {/* Category and Severity */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-900">Category</label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                >
                                                    <option value="UI Issue">UI Issue</option>
                                                    <option value="Performance">Performance</option>
                                                    <option value="Security">Security</option>
                                                    <option value="Functionality">Functionality</option>
                                                    <option value="Integration">Integration</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-900">Severity</label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                                                    value={severity}
                                                    onChange={(e) => setSeverity(e.target.value)}
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                                <div className={`text-xs font-medium ${severity === 'High' ? 'text-red-600' :
                                                        severity === 'Medium' ? 'text-orange-600' : 'text-green-600'
                                                    }`}>
                                                    Priority: {severity === 'High' ? 'Critical' : severity === 'Medium' ? 'High' : 'Low'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-900">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                                                rows="4"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Describe what happened and what you expected to happen..."
                                                required
                                            />
                                        </div>

                                        {/* Steps to Reproduce */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-900">Steps to Reproduce</label>
                                            <textarea
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                                                rows="3"
                                                value={stepsToReproduce}
                                                onChange={(e) => setStepsToReproduce(e.target.value)}
                                                placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Expected: ...&#10;4. Actual: ..."
                                            />
                                        </div>

                                        {/* Attachments */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-900">Attachments</label>

                                            {/* Drop Zone */}
                                            <div
                                                ref={dropZoneRef}
                                                onDragEnter={handleDragEnter}
                                                onDragLeave={handleDragLeave}
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${isDragging
                                                        ? 'border-[#00897B] bg-[#E0F2F1]'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex justify-center">
                                                        <Paperclip className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">
                                                            Drag and drop files here, or{" "}
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="text-[#00897B] hover:text-[#00796B] font-medium"
                                                            >
                                                                browse
                                                            </button>
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Images, videos, documents up to 10MB
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-center space-x-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors duration-200"
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                            <span>Upload Files</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowRecordingModal(true)}
                                                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors duration-200"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                            <span>From Recordings</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleAttachmentChange}
                                                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.json"
                                            />

                                            {/* Attachment List */}
                                            {attachments.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700">Attached Files ({attachments.length})</p>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {attachments.map((attachment) => (
                                                            <div
                                                                key={attachment.id}
                                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                                                            >
                                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                                    <div className="flex-shrink-0">
                                                                        {attachment.isRecording ? (
                                                                            <Play className="h-4 w-4 text-blue-600" />
                                                                        ) : (
                                                                            getFileIcon(attachment.type || '')
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                                            {attachment.name}
                                                                        </p>
                                                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                                            {attachment.size && (
                                                                                <span>{formatFileSize(attachment.size)}</span>
                                                                            )}
                                                                            {attachment.isRecording && (
                                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                                                    Recording
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAttachment(attachment.id)}
                                                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Assign To */}
                                        {teamMembers.length > 0 && (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-900">Assign To</label>
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                                                    value={assignedTo}
                                                    onChange={(e) => setAssignedTo(e.target.value)}
                                                >
                                                    <option value="">Select team member (optional)</option>
                                                    {teamMembers.map((member) => (
                                                        <option key={member.id} value={member.id}>
                                                            {member.name || member.email || member.id}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fixed Footer */}
                                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                                        <button
                                            type="submit"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !currentUser}
                                            className="w-full bg-[#00897B] hover:bg-[#00796B] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Submitting...</span>
                                                </div>
                                            ) : (
                                                "Submit Bug Report"
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Recording Selection Modal */}
            {showRecordingModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Select Recordings</h2>
                            <button
                                onClick={() => setShowRecordingModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            {isLoadingRecordings ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-[#00897B] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600">Loading recordings...</span>
                                </div>
                            ) : recordings.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No recordings found</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {recordings.map(recording => (
                                        <div
                                            key={recording.id}
                                            onClick={() => toggleRecordingSelection(recording)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedRecordings.some(r => r.id === recording.id)
                                                    ? 'border-[#00897B] bg-[#E0F2F1]'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                    <div className="flex-shrink-0">
                                                        <Play className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {recording.title || `Recording ${recording.id.slice(0, 8)}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {recording.createdAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedRecordings.some(r => r.id === recording.id)
                                                            ? 'border-[#00897B] bg-[#00897B]'
                                                            : 'border-gray-300'
                                                        }`}>
                                                        {selectedRecordings.some(r => r.id === recording.id) && (
                                                            <CheckCircle className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setShowRecordingModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={addSelectedRecordings}
                                disabled={selectedRecordings.length === 0}
                                className="px-4 py-2 bg-[#00897B] text-white rounded-lg hover:bg-[#00796B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Add Selected ({selectedRecordings.length})
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default BugReportButton;