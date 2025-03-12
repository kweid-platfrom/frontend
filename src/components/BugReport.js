"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Bug, Upload, File } from "lucide-react";

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

    const teamMembers = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
    ];

    useEffect(() => {
        document.body.style.overflow = showBugForm ? "hidden" : "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showBugForm]);

    const handleAttachmentChange = (event) => {
        const files = Array.from(event.target.files);
        setAttachments((prevAttachments) => [...prevAttachments, ...files]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title) {
            setError("Title is required");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("category", category);
        formData.append("description", description);
        formData.append("stepsToReproduce", stepsToReproduce);
        formData.append("severity", severity);
        formData.append("assignedTo", assignedTo);

        attachments.forEach((file) => {
            formData.append("attachments", file);
        });

        // Example API call (make sure to change the URL to your API endpoint)  
        // fetch('YOUR_API_ENDPOINT', {  
        //     method: 'POST',  
        //     body: formData,  
        // })  
        // .then((response) => {  
        //     if (response.ok) {  
        //         // Reset form  
        //         setError('');  
        //         setTitle('');  
        //         setDescription('');  
        //         setStepsToReproduce('');  
        //         setAttachments([]);  
        //         setAssignedTo('');  
        //         setShowBugForm(false);  
        //     } else {  
        //         setError('Failed to submit bug report.');  
        //     }  
        // })  
        // .catch((error) => {  
        //     setError('An error occurred while submitting the bug report.');  
        // });  

        // Clear the form and close the modal after submission  

        setError("");
        setTitle("");
        setDescription("");
        setStepsToReproduce("");
        setAttachments([]);
        setAssignedTo("");
        setShowBugForm(false);
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
                        <div className="relative bg-white border border-gray-200 rounded-sm  shadow-md p-6 w-[90%] h-[90vh] max-w-lg">
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
                                        <button type="button" className="flex items-center space-x-2 text-[#00897B]">
                                            <File className="h-5 w-5" />
                                            <span>From Recordings</span>
                                        </button>
                                    </div>
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
                                            <option key={member.id} value={member.name}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="w-full bg-[#00897B] hover:bg-[#00796B] text-white py-2 rounded mt-4">
                                    Submit
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
