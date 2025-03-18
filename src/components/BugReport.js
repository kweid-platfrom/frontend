"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Bug, Upload, File } from "lucide-react";
import { db, storage } from "../config/firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const BugReportButton = ({ className = "" }) => {
    const [showBugForm, setShowBugForm] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("UI Issue");
    const [description, setDescription] = useState("");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [severity, setSeverity] = useState("Low");
    const [assignedTo, setAssignedTo] = useState("");
    const [error, setError] = useState("");
    const [teamMembers, setTeamMembers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);

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
                const snapshot = await getDocs(recordingsRef);
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
    }, [showBugForm]);

    const handleAttachmentChange = (event) => {
        const files = Array.from(event.target.files);
        setAttachments((prevAttachments) => [...prevAttachments, ...files]);
    };

    const handleRecordingSelect = (recordingUrl, recordingName) => {
        // Create a file object from the recording URL
        fetch(recordingUrl)
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], recordingName, { type: "video/mp4" });
                setAttachments((prevAttachments) => [...prevAttachments, file]);
            })
            .catch(error => {
                console.error("Error fetching recording:", error);
            });
    };

    const removeAttachment = (index) => {
        setAttachments(prevAttachments => prevAttachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) {
            setError("Title is required");
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload attachments to Firebase Storage
            const uploadedFiles = await Promise.all(
                attachments.map(async (file) => {
                    const storageRef = ref(storage, `bugReports/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);
                    return {
                        name: file.name,
                        url: downloadURL
                    };
                })
            );

            // Add bug report to Firestore
            await addDoc(collection(db, "bugReports"), {
                title,
                category,
                description,
                stepsToReproduce,
                severity,
                assignedTo,
                attachments: uploadedFiles,
                status: "New",
                timestamp: serverTimestamp(),
            });

            // Reset form and close modal
            setError("");
            setTitle("");
            setDescription("");
            setStepsToReproduce("");
            setAttachments([]);
            setAssignedTo("");
            setShowBugForm(false);
        } catch (error) {
            console.error("Error submitting bug report:", error);
            setError("Failed to submit bug report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                className={`px-3 py-2 text-sm rounded-xs flex items-center space-x-2 transition ${className}`}
                onClick={() => setShowBugForm(true)}
            >
                <Bug className="h-4 w-4" />
                <span className="hidden md:inline">Report A Bug</span>
            </button>

            {showBugForm &&
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="fixed inset-0 bg-black opacity-30"
                            aria-hidden="true"
                            onClick={() => setShowBugForm(false)}
                        />
                        <div className="relative bg-white border border-gray-200 rounded-sm  shadow-md p-6 w-[90%] h-[100vh] max-w-lg">
                            <button
                                onClick={() => setShowBugForm(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
                                aria-label="Close Bug Report"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-semibold mb-4 text-center">Report a Bug</h2>
                            {error && <p className="text-red-500 mb-4">{error}</p>}
                            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh] px-2">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Bug Title</label>
                                    <small className="text-gray-600">A clear title for your bug report.</small>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-2"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Bug Category</label>
                                    <small className="text-gray-600">Select the category that best describes the bug.</small>
                                    <select
                                        className="w-full border rounded p-2"
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
                                    <small className="text-gray-600">A detailed description of the issue.</small>
                                    <textarea
                                        className="w-full border rounded p-2"
                                        rows="3"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Steps To Reproduce</label>
                                    <small className="text-gray-600">Provide steps to reproduce the bug.</small>
                                    <textarea
                                        className="w-full border rounded p-2"
                                        rows="3"
                                        value={stepsToReproduce}
                                        onChange={(e) => setStepsToReproduce(e.target.value)}
                                        placeholder="Step 1:<br/>
                                        Expected Result: <br/>
                                        Actual Result: ..."
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Attachments</label>
                                    <small className="text-gray-600">Provide files to help developers better understand the issue</small>
                                    <div className="flex flex-wrap gap-3 border rounded p-12 bg-gray-100">
                                        <button type="button" className="flex items-center space-x-2 text-[#00897B]" onClick={() => document.getElementById('file-upload').click()}>
                                            <Upload className="h-5 w-5" />
                                            <span>From Device</span>
                                        </button> |
                                        <input id="file-upload" type="file" multiple className="hidden" onChange={handleAttachmentChange} />
                                        <button 
                                            type="button" 
                                            className="flex items-center space-x-2 text-[#00897B]"
                                            onClick={() => document.getElementById('recording-modal').showModal()}
                                        >
                                            <File className="h-5 w-5" />
                                            <span>From Recordings</span>
                                        </button>
                                    </div>
                                    
                                    {/* Recording selection modal */}
                                    <dialog id="recording-modal" className="rounded-md shadow-lg p-4 w-11/12 max-w-md">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Select Recording</h3>
                                            <button 
                                                type="button" 
                                                onClick={() => document.getElementById('recording-modal').close()}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        {isLoadingRecordings ? (
                                            <div className="text-center py-4">Loading recordings...</div>
                                        ) : recordings.length === 0 ? (
                                            <div className="text-center py-4">No recordings found</div>
                                        ) : (
                                            <div className="max-h-64 overflow-y-auto">
                                                {recordings.map((recording) => (
                                                    <div 
                                                        key={recording.id} 
                                                        className="p-2 border-b hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                                        onClick={() => {
                                                            handleRecordingSelect(recording.url, recording.name || `Recording-${recording.id}.mp4`);
                                                            document.getElementById('recording-modal').close();
                                                        }}
                                                    >
                                                        <div className="flex items-center">
                                                            <File className="h-4 w-4 mr-2" />
                                                            <span>{recording.name || `Recording-${recording.id}`}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {recording.timestamp ? new Date(recording.timestamp.toDate()).toLocaleDateString() : 'Unknown date'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                type="button" 
                                                onClick={() => document.getElementById('recording-modal').close()}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </dialog>
                                    
                                    {/* Display selected attachments */}
                                    {attachments.length > 0 && (
                                        <div className="mt-2 border rounded p-2">
                                            <p className="text-sm font-medium mb-1">Selected files:</p>
                                            {attachments.map((file, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                                                    <div className="flex items-center">
                                                        <File className="h-4 w-4 mr-2" />
                                                        <span className="truncate max-w-[180px]">{file.name}</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeAttachment(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium" htmlFor="severity">Severity</label>
                                    <small className="text-gray-600">Indicates the priority of this bug.</small>
                                    <select
                                        id="severity"
                                        className="w-full border rounded p-2"
                                        value={severity}
                                        onChange={(e) => setSeverity(e.target.value)}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                    <div className="text-sm mt-1" style={{ color: severity === 'High' ? 'red' : severity === 'Medium' ? 'orange' : 'green' }}>
                                        Priority: {severity === 'High' ? 'Critical' : severity === 'Medium' ? 'High' : 'Low'}
                                    </div>
                                
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium">Assigned To</label>
                                    <small className="text-gray-600">Select a team member to assign this bug.</small>
                                    <select
                                        className="w-full border rounded p-2"
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                    >
                                        <option value="">Select Team Member</option>
                                        {teamMembers.map((member) => (
                                            <option key={member.id} value={member.name || member.id}>
                                                {member.name || member.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-[#00897B] hover:bg-[#00796B] text-white py-2 rounded mt-4"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default BugReportButton;