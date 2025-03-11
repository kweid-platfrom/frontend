"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

const BugReportForm = ({ show, onClose }) => {
    const [bugTitle, setBugTitle] = useState("");
    const [bugCategory, setBugCategory] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState("");
    const [expectedResults, setExpectedResults] = useState("");
    const [actualResults, setActualResults] = useState("");
    const [attachments, setAttachments] = useState(null);
    const [severity, setSeverity] = useState("Low");
    const [assignTo, setAssignTo] = useState("");

    if (!show) return null;

    const handleFileChange = (event) => {
        setAttachments(event.target.files[0]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Handle form submission logic here
        console.log({
            bugTitle,
            bugCategory,
            description,
            steps,
            expectedResults,
            actualResults,
            attachments,
            severity,
            assignTo,
        });
        onClose(); // Close the modal after submission
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[80vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold text-center mb-4">Report a Bug</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Bug Title</label>
                        <input type="text" className="w-full border rounded p-2" value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Bug Category</label>
                        <select className="w-full border rounded p-2" value={bugCategory} onChange={(e) => setBugCategory(e.target.value)} required>
                            <option value="">Select Category</option>
                            <option value="UI Issue">UI Issue</option>
                            <option value="Performance">Performance</option>
                            <option value="Security">Security</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Description</label>
                        <textarea className="w-full border rounded p-2" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Steps to Reproduce</label>
                        <textarea className="w-full border rounded p-2" rows="3" placeholder="Steps" value={steps} onChange={(e) => setSteps(e.target.value)} required></textarea>
                        <textarea className="w-full border rounded p-2 mt-2" rows="2" placeholder="Expected Results" value={expectedResults} onChange={(e) => setExpectedResults(e.target.value)} required></textarea>
                        <textarea className="w-full border rounded p-2 mt-2" rows="2" placeholder="Actual Results" value={actualResults} onChange={(e) => setActualResults(e.target.value)} required></textarea>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Attachments</label>
                        <input type="file" className="w-full border rounded p-2" onChange={handleFileChange} />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Severity</label>
                        <select className="w-full border rounded p-2" value={severity} onChange={(e) => setSeverity(e.target.value)} required>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Assign To</label>
                        <select className="w-full border rounded p-2" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} required>
                            <option value="">Select Assignee</option>
                            <option value="Developer A">Developer A</option>
                            <option value="Developer B">Developer B</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BugReportForm;