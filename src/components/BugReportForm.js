"use client"
import React, { useState, useRef, useEffect } from "react";
import { X, Upload, ChevronDown } from "lucide-react";
import Image from "next/image";
import "../app/globals.css"

const BugReportForm = ({ isOpen, onClose }) => {
    const [bugTitle, setBugTitle] = useState("");
    const [bugCategory, setBugCategory] = useState("");
    const [bugDescription, setBugDescription] = useState("");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [expectedResults, setExpectedResults] = useState("");
    const [actualResults, setActualResults] = useState("");
    const [severity, setSeverity] = useState("");
    const [priority, setPriority] = useState("");
    const [assignee, setAssignee] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [fileSource, setFileSource] = useState("device");
    
    const formRef = useRef(null);
    const contentRef = useRef(null);

    // Update priority based on severity
    useEffect(() => {
        switch(severity) {
            case "critical":
                setPriority("high");
                break;
            case "major":
                setPriority("high");
                break;
            case "moderate":
                setPriority("medium");
                break;
            case "minor":
                setPriority("low");
                break;
            case "cosmetic":
                setPriority("low");
                break;
            default:
                setPriority("");
        }
    }, [severity]);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (formRef.current && !formRef.current.contains(event.target) && isOpen) {
                // Keep form open if clicking inside it
                if (!event.target.closest('.bug-report-form')) {
                    onClose();
                }
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle file uploads
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles([...selectedFiles, ...files]);
        
        // Create preview URLs for images and videos
        const newPreviewUrls = files.map(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                return URL.createObjectURL(file);
            }
            return null;
        });
        
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    };

    const removeFile = (index) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        
        const newPreviewUrls = [...previewUrls];
        if (newPreviewUrls[index]) {
            URL.revokeObjectURL(newPreviewUrls[index]);
        }
        newPreviewUrls.splice(index, 1);
        setPreviewUrls(newPreviewUrls);
    };

    const handleBugSubmit = (e) => {
        e.preventDefault();
        // Here you would handle the submission of the bug report
        console.log({
            title: bugTitle,
            category: bugCategory,
            description: bugDescription,
            stepsToReproduce: stepsToReproduce,
            expectedResults: expectedResults,
            actualResults: actualResults,
            severity: severity,
            priority: priority,
            assignee: assignee,
            files: selectedFiles
        });
        
        // Reset form
        setBugTitle("");
        setBugCategory("");
        setBugDescription("");
        setStepsToReproduce("");
        setExpectedResults("");
        setActualResults("");
        setSeverity("");
        setPriority("");
        setAssignee("");
        setSelectedFiles([]);
        setPreviewUrls([]);
        onClose();
    };

    // Mock data for dropdowns
    const categories = ["UI/UX", "Functionality", "Performance", "Security", "Compatibility", "Other"];
    const severityOptions = ["Critical", "Major", "Moderate", "Minor", "Cosmetic"];
    const assigneeOptions = ["John Doe", "Jane Smith", "Alex Johnson", "Team Lead", "Unassigned"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-50 pt-16">
            <div 
                ref={formRef}
                className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[calc(100vh-6rem)] bug-report-form"
            >
                <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-semibold text-gray-800">Report Bug</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div 
                    ref={contentRef}
                    className="overflow-y-auto max-h-[calc(100vh-10rem)]"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style jsx>{`
                        div::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    
                    <form onSubmit={handleBugSubmit} className="p-4 space-y-6">
                        {/* Title Field */}
                        <div>
                            <label htmlFor="bugTitle" className="block text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                Provide a brief, descriptive title for this bug
                            </p>
                            <input
                                id="bugTitle"
                                type="text"
                                value={bugTitle}
                                onChange={(e) => setBugTitle(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                placeholder="e.g., 'Login button not working in Safari'"
                                required
                            />
                        </div>
                        
                        {/* Category Dropdown */}
                        <div>
                            <label htmlFor="bugCategory" className="block text-sm font-medium text-gray-700">
                                Bug/Issue Category
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                Select the type of issue you are experiencing
                            </p>
                            <div className="relative">
                                <select
                                    id="bugCategory"
                                    value={bugCategory}
                                    onChange={(e) => setBugCategory(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent appearance-none pr-8"
                                    required
                                >
                                    <option value="" disabled>Select category</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Description Field */}
                        <div>
                            <label htmlFor="bugDescription" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                Describe the issue in detail
                            </p>
                            <textarea
                                id="bugDescription"
                                value={bugDescription}
                                onChange={(e) => setBugDescription(e.target.value)}
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                placeholder="Provide a detailed description of the issue"
                                required
                            />
                        </div>
                        
                        {/* Steps to Reproduce Field */}
                        <div>
                            <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700">
                                Steps to Reproduce
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                List the steps needed to reproduce this issue
                            </p>
                            <textarea
                                id="stepsToReproduce"
                                value={stepsToReproduce}
                                onChange={(e) => setStepsToReproduce(e.target.value)}
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                placeholder="1. Navigate to...\n2. Click on...\n3. Observe that..."
                            />
                        </div>
                        
                        {/* Expected Results Field */}
                        <div>
                            <label htmlFor="expectedResults" className="block text-sm font-medium text-gray-700">
                                Expected Results
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                What should happen when following the steps above
                            </p>
                            <textarea
                                id="expectedResults"
                                value={expectedResults}
                                onChange={(e) => setExpectedResults(e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                placeholder="The login form should submit and redirect to dashboard"
                            />
                        </div>
                        
                        {/* Actual Results Field */}
                        <div>
                            <label htmlFor="actualResults" className="block text-sm font-medium text-gray-700">
                                Actual Results
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                What actually happens when following the steps
                            </p>
                            <textarea
                                id="actualResults"
                                value={actualResults}
                                onChange={(e) => setActualResults(e.target.value)}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                placeholder="The form submits but shows an error message"
                            />
                        </div>
                        
                        {/* Assignee Dropdown */}
                        <div>
                            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                                Assignee
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                Who should handle this issue
                            </p>
                            <div className="relative">
                                <select
                                    id="assignee"
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent appearance-none pr-8"
                                >
                                    <option value="" disabled>Select assignee</option>
                                    {assigneeOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Severity Dropdown */}
                        <div>
                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                                Severity
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                How severe is this issue (sets priority automatically)
                            </p>
                            <div className="relative">
                                <select
                                    id="severity"
                                    value={severity}
                                    onChange={(e) => setSeverity(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent appearance-none pr-8"
                                    required
                                >
                                    <option value="" disabled>Select severity</option>
                                    {severityOptions.map((option) => (
                                        <option key={option.toLowerCase()} value={option.toLowerCase()}>{option}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </div>
                            </div>
                            
                            {/* Display priority (read-only) */}
                            {priority && (
                                <div className="mt-2">
                                    <span className="text-xs text-gray-500">Priority (auto-set): </span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        priority === "high" ? "bg-red-100 text-red-800" : 
                                        priority === "medium" ? "bg-yellow-100 text-yellow-800" : 
                                        "bg-green-100 text-green-800"
                                    }`}>
                                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Attachments
                            </label>
                            <p className="text-xs text-gray-500 mb-1">
                                Upload screenshots or videos to help explain the issue
                            </p>
                            
                            {/* File source toggle */}
                            <div className="flex space-x-4 mb-3">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="fileSource"
                                        value="device"
                                        checked={fileSource === "device"}
                                        onChange={() => setFileSource("device")}
                                        className="h-4 w-4 text-[#00897B] focus:ring-[#00897B]"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">From Device</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="fileSource"
                                        value="recorded"
                                        checked={fileSource === "recorded"}
                                        onChange={() => setFileSource("recorded")}
                                        className="h-4 w-4 text-[#00897B] focus:ring-[#00897B]"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">In-app Recordings</span>
                                </label>
                            </div>
                            
                            {fileSource === "device" ? (
                                <div className="mt-1 flex justify-center px-4 py-4 border-2 border-gray-300 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#00897B] hover:text-[#00796B]">
                                                <span>Upload files</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    className="sr-only"
                                                    multiple
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, GIF, MP4 up to 10MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-gray-300 rounded-md p-3">
                                    <p className="text-sm text-gray-500 text-center">
                                        No in-app recordings available
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* File Preview Section */}
                        {selectedFiles.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="relative border rounded-md p-2">
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            
                                            {file.type.startsWith('image/') && previewUrls[index] && (
                                                <div className="h-20 w-full">
                                                    <Image
                                                        src={previewUrls[index]}
                                                        alt={`Preview ${index}`}
                                                        className="h-full w-full object-cover rounded"
                                                        width={150}
                                                        height={80}
                                                    />
                                                </div>
                                            )}
                                            
                                            {file.type.startsWith('video/') && previewUrls[index] && (
                                                <div className="h-20 w-full">
                                                    <video
                                                        src={previewUrls[index]}
                                                        className="h-full w-full object-cover rounded"
                                                        controls
                                                    />
                                                </div>
                                            )}
                                            
                                            <p className="mt-1 text-xs truncate">{file.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
                
                <div className="flex justify-end p-4 border-t sticky bottom-0 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mr-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleBugSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#00897B] rounded-md hover:bg-[#00796B]"
                    >
                        Submit Bug Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BugReportForm;