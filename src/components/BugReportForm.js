"use client"
import React, { useState, useRef, useEffect } from "react";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import "../app/globals.css"

const BugReportForm = ({ isOpen, onClose }) => {
    const [bugTitle, setBugTitle] = useState("");
    const [bugDescription, setBugDescription] = useState("");
    const [priority, setPriority] = useState("medium");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    
    const formRef = useRef(null);

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
            description: bugDescription,
            priority,
            files: selectedFiles
        });
        
        // Reset form
        setBugTitle("");
        setBugDescription("");
        setPriority("medium");
        setSelectedFiles([]);
        setPreviewUrls([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
                ref={formRef}
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto bug-report-form"
            >
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-lg font-semibold text-gray-800">Report Bug</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleBugSubmit} className="p-4 space-y-4">
                    <div>
                        <label htmlFor="bugTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Bug Title
                        </label>
                        <input
                            id="bugTitle"
                            type="text"
                            value={bugTitle}
                            onChange={(e) => setBugTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                            placeholder="Enter a clear title for the bug"
                            required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="bugDescription" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="bugDescription"
                            value={bugDescription}
                            onChange={(e) => setBugDescription(e.target.value)}
                            rows={4}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                            placeholder="Describe the bug in detail. Include steps to reproduce, expected behavior, and actual behavior."
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priority
                        </label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="priority"
                                    value="low"
                                    checked={priority === "low"}
                                    onChange={() => setPriority("low")}
                                    className="h-4 w-4 text-[#00897B] focus:ring-[#00897B]"
                                />
                                <span className="ml-2 text-sm text-gray-700">Low</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="priority"
                                    value="medium"
                                    checked={priority === "medium"}
                                    onChange={() => setPriority("medium")}
                                    className="h-4 w-4 text-[#00897B] focus:ring-[#00897B]"
                                />
                                <span className="ml-2 text-sm text-gray-700">Medium</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="priority"
                                    value="high"
                                    checked={priority === "high"}
                                    onChange={() => setPriority("high")}
                                    className="h-4 w-4 text-[#00897B] focus:ring-[#00897B]"
                                />
                                <span className="ml-2 text-sm text-gray-700">High</span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Screenshots/Videos
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#00897B] hover:text-[#00796B] focus-within:outline-none">
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
                    </div>
                    
                    {/* File Preview Section */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                            <div className="h-24 w-full">
                                                <Image
                                                    src={previewUrls[index]}
                                                    alt={`Preview ${index}`}
                                                    className="h-full w-full object-cover rounded"
                                                />
                                            </div>
                                        )}
                                        
                                        {file.type.startsWith('video/') && previewUrls[index] && (
                                            <div className="h-24 w-full">
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
                    
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#00897B] rounded-md hover:bg-[#00796B]"
                        >
                            Submit Bug Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default BugReportForm;