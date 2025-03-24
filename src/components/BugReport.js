"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Bug, Upload, File, CheckCircle } from "lucide-react";
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
import { getAuth } from "firebase/auth";

const BugReportButton = ({ className = "" }) => {
    const auth = getAuth();
    const user = auth.currentUser;
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

    useEffect(() => {
        document.body.style.overflow = showBugForm ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showBugForm]);

    useEffect(() => {
        // Fetch team members dynamically from Firestore
        const fetchTeamMembers = async () => {
            try {
                const teamRef = collection(db, "teamMembers");
                const snapshot = await getDocs(teamRef);
                const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeamMembers(members);
            } catch (error) {
                console.error("Error fetching team members:", error);
            }
        };

        // Fetch recordings from Firestore
        const fetchRecordings = async () => {
            setIsLoadingRecordings(true);
            try {
                const recordingsRef = collection(db, "recordings");
                // If user is authenticated, get their recordings
                const q = user
                    ? query(recordingsRef, where("createdBy", "==", user.uid))
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

        if (showBugForm) {
            fetchTeamMembers();
            fetchRecordings();
        }
    }, [showBugForm, user]);

    const handleAttachmentChange = (event) => {
        const files = Array.from(event.target.files);
        setAttachments((prevAttachments) => [...prevAttachments, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(prevAttachments => prevAttachments.filter((_, i) => i !== index));
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
        // Convert selected recordings to file objects or URLs that can be handled like attachments
        const recordingFiles = selectedRecordings.map(recording => ({
            name: recording.title || `Recording-${recording.id}`,
            url: recording.url,
            isRecording: true,
            id: recording.id
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
        // Reset form
        setTitle("");
        setDescription("");
        setStepsToReproduce("");
        setAttachments([]);
        setAssignedTo("");
        setError("");
        setSuccess(false);
        setShowBugForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!user) {
            setError("You must be logged in to submit a bug report");
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload file attachments to Firebase Storage
            const uploadedFiles = await Promise.all(
                attachments.map(async (file) => {
                    // If it's already a recording with a URL, just return the existing data
                    if (file.isRecording && file.url) {
                        return {
                            name: file.name,
                            url: file.url,
                            isRecording: true,
                            recordingId: file.id
                        };
                    }

                    // Otherwise upload the file to storage
                    const storageRef = ref(storage, `bugs/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);
                    return {
                        name: file.name,
                        url: downloadURL
                    };
                })
            );

            // Add bug report to Firestore with all required fields
            const bugData = {
                title,
                category,
                description,
                stepsToReproduce,
                severity,
                assignedTo: assignedTo || null,
                reportedBy: user.displayName || user.email || user.uid,
                createdBy: user.uid,
                attachments: uploadedFiles,
                status: "New",
                createdAt: Timestamp.now(), // Make sure to use createdAt instead of timestamp to match your security rules
                organizationId: user.organizationId || null
            };

            await addDoc(collection(db, "bugs"), bugData);

            // Show success message
            setSuccess(true);

            // Reset the form fields but keep the modal open to show the success message
            setTitle("");
            setDescription("");
            setStepsToReproduce("");
            setAttachments([]);
            setAssignedTo("");
            setError("");

            // Auto-close after 3 seconds
            setTimeout(() => {
                closeForm();
            }, 3000);

        } catch (error) {
            console.error("Error submitting bug report:", error);
            setError("Failed to submit bug report. Please check your permissions.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                className={`px-3 py-2 text-sm rounded flex items-center space-x-2 transition ${className}`}
                onClick={() => setShowBugForm(true)}
            >
                <Bug className="h-4 w-4" />
                <span className="hidden md:inline">Report A Bug</span>
            </button>

            {showBugForm &&
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black opacity-30"
                            aria-hidden="true"
                            onClick={() => !isSubmitting && !success && closeForm()}
                        />
                        <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                            <button
                                onClick={() => !isSubmitting && !success && closeForm()}
                                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                                aria-label="Close Bug Report"
                                disabled={isSubmitting || success}
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-semibold mb-4 text-center">Report a Bug</h2>

                            {/* Success message */}
                            {success ? (
                                <div className="text-center py-8 flex flex-col items-center">
                                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                    <h3 className="text-xl font-medium text-green-600 mb-2">Bug Report Submitted</h3>
                                    <p className="text-gray-600">Thank you for helping improve our application!</p>
                                    <button
                                        onClick={closeForm}
                                        className="mt-6 px-6 py-2 bg-[#00897B] text-white rounded hover:bg-[#00796B]"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

                                    <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Bug Title</label>
                                            <small className="text-gray-600 text-xs">A clear title for your bug report.</small>
                                            <input
                                                type="text"
                                                className="w-full border rounded p-2 mt-1"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Bug Category</label>
                                            <small className="text-gray-600 text-xs">Select the category that best describes the bug.</small>
                                            <select
                                                className="w-full border rounded p-2 mt-1"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                            >
                                                <option value="UI Issue">UI Issue</option>
                                                <option value="Performance">Performance</option>
                                                <option value="Security">Security</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Description</label>
                                            <small className="text-gray-600 text-xs">A detailed description of the issue.</small>
                                            <textarea
                                                className="w-full border rounded p-2 mt-1"
                                                rows="3"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Steps To Reproduce</label>
                                            <small className="text-gray-600 text-xs">Provide steps to reproduce the bug.</small>
                                            <textarea
                                                className="w-full border rounded p-2 mt-1"
                                                rows="3"
                                                value={stepsToReproduce}
                                                onChange={(e) => setStepsToReproduce(e.target.value)}
                                                placeholder="Step 1:
Expected Result: 
Actual Result: ..."
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Attachments</label>
                                            <small className="text-gray-600 text-xs">Provide files to help developers better understand the issue</small>
                                            <div className="flex flex-wrap gap-2 border rounded p-4 sm:p-6 bg-gray-100 mt-1">
                                                <button type="button" className="flex items-center space-x-1 text-sm text-[#00897B]" onClick={() => document.getElementById('file-upload').click()}>
                                                    <Upload className="h-4 w-4" />
                                                    <span>From Device</span>
                                                </button>
                                                <span className="text-gray-400">|</span>
                                                <input id="file-upload" type="file" multiple className="hidden" onChange={handleAttachmentChange} />
                                                <button
                                                    type="button"
                                                    className="flex items-center space-x-1 text-sm text-[#00897B]"
                                                    onClick={() => setShowRecordingModal(true)}
                                                >
                                                    <File className="h-4 w-4" />
                                                    <span>From Recordings</span>
                                                </button>
                                            </div>

                                            {/* Display selected attachments */}
                                            {attachments.length > 0 && (
                                                <div className="mt-2 border rounded p-2">
                                                    <p className="text-xs font-medium mb-1">Selected files:</p>
                                                    <div className="max-h-32 overflow-y-auto">
                                                        {attachments.map((file, index) => (
                                                            <div key={index} className="flex justify-between items-center text-xs py-1 border-b last:border-0">
                                                                <div className="flex items-center">
                                                                    <File className="h-3 w-3 mr-2 flex-shrink-0" />
                                                                    <span className="truncate max-w-[180px]">{file.name}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAttachment(index)}
                                                                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium" htmlFor="severity">Severity</label>
                                            <small className="text-gray-600 text-xs">Indicates the priority of this bug.</small>
                                            <select
                                                id="severity"
                                                className="w-full border rounded p-2 mt-1"
                                                value={severity}
                                                onChange={(e) => setSeverity(e.target.value)}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                            <div className="text-xs mt-1" style={{ color: severity === 'High' ? 'red' : severity === 'Medium' ? 'orange' : 'green' }}>
                                                Priority: {severity === 'High' ? 'Critical' : severity === 'Medium' ? 'High' : 'Low'}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium">Assigned To</label>
                                            <small className="text-gray-600 text-xs">Select a team member to assign this bug.</small>
                                            <select
                                                className="w-full border rounded p-2 mt-1"
                                                value={assignedTo}
                                                onChange={(e) => setAssignedTo(e.target.value)}
                                            >
                                                <option value="">Select Team Member</option>
                                                {teamMembers.map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.name || member.id}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-[#00897B] hover:bg-[#00796B] text-white py-2 rounded mt-4"
                                            disabled={isSubmitting || !user}
                                        >
                                            {isSubmitting ? "Submitting..." : "Submit"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

            {/* Recording Selection Modal */}
            {showRecordingModal &&
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black opacity-30"
                            aria-hidden="true"
                            onClick={() => setShowRecordingModal(false)}
                        />
                        <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-lg">
                            <button
                                onClick={() => setShowRecordingModal(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                                aria-label="Close Recordings Modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-semibold mb-4 text-center">Select Recordings</h2>

                            {isLoadingRecordings ? (
                                <div className="text-center py-8">Loading recordings...</div>
                            ) : recordings.length === 0 ? (
                                <div className="text-center py-8">No recordings found</div>
                            ) : (
                                <div className="max-h-[50vh] overflow-y-auto">
                                    {recordings.map(recording => (
                                        <div
                                            key={recording.id}
                                            className={`p-3 border mb-2 rounded cursor-pointer ${selectedRecordings.some(r => r.id === recording.id)
                                                    ? 'bg-[#E0F2F1] border-[#00897B]'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleRecordingSelection(recording)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm">{recording.title || `Recording ${recording.id.slice(0, 6)}`}</div>
                                                    <div className="text-xs text-gray-600">
                                                        {recording.createdAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecordings.some(r => r.id === recording.id)}
                                                    readOnly
                                                    className="h-5 w-5 text-[#00897B]"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex justify-end space-x-3">
                                <button
                                    className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
                                    onClick={() => setShowRecordingModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-[#00897B] text-white rounded hover:bg-[#00796B] disabled:opacity-50 text-sm"
                                    onClick={addSelectedRecordings}
                                    disabled={selectedRecordings.length === 0}
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