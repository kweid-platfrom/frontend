import React, { useRef, useState } from "react";
import {
    Upload,
    Paperclip,
    Trash2,
    Play,
    FileText,
    Image as ImageIcon,
    Video,
    CheckCircle,
    X
} from "lucide-react";
import { createPortal } from "react-dom";

const BugReportAttachments = ({
    attachments,
    setAttachments,
    recordings,
    isLoadingRecordings,
    setError,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showRecordingModal, setShowRecordingModal] = useState(false);
    const [selectedRecordings, setSelectedRecordings] = useState([]);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

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

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Attachments</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Add screenshots, videos, or documents to help illustrate the bug. You can also attach screen recordings.
                </p>
            </div>

            {/* Drop Zone */}
            <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded p-8 text-center transition-all duration-200 ${
                    isDragging
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
            >
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="p-3 bg-gray-100 rounded">
                            <Paperclip className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <p className="text-base text-gray-600 mb-2">
                            Drag and drop files here, or{" "}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[#00897B] hover:text-[#00796B] font-medium underline"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-sm text-gray-500">
                            Images, videos, documents up to 10MB each
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Supported formats: JPG, PNG, GIF, MP4, PDF, DOC, DOCX, TXT, JSON
                        </p>
                    </div>
                    <div className="flex justify-center space-x-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors duration-200"
                        >
                            <Upload className="h-4 w-4" />
                            <span>Upload Files</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRecordingModal(true)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm font-medium transition-colors duration-200"
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
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                            Attached Files ({attachments.length})
                        </h4>
                        <button
                            type="button"
                            onClick={() => setAttachments([])}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors duration-200"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="flex-shrink-0">
                                        {attachment.isRecording ? (
                                            <div className="p-1 bg-blue-100 rounded">
                                                <Play className="h-4 w-4 text-blue-600" />
                                            </div>
                                        ) : (
                                            <div className="p-1 bg-gray-100 rounded">
                                                {getFileIcon(attachment.type || '')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {attachment.name}
                                        </p>
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                            {attachment.size && (
                                                <span>{formatFileSize(attachment.size)}</span>
                                            )}
                                            {attachment.isRecording && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-teal-700 rounded font-medium">
                                                    Recording
                                                </span>
                                            )}
                                            {attachment.isUploaded && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                                    Ready
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(attachment.id)}
                                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                                    title="Remove attachment"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recording Selection Modal */}
            {showRecordingModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <h2 className="text-lg font-semibold text-gray-900">Select Recordings</h2>
                            <button
                                onClick={() => {
                                    setShowRecordingModal(false);
                                    setSelectedRecordings([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded transition-colors duration-200"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {isLoadingRecordings ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-[#00897B] border-t-transparent rounded animate-spin"></div>
                                    <span className="ml-3 text-gray-600">Loading recordings...</span>
                                </div>
                            ) : recordings.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="p-4 bg-gray-100 rounded w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Play className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium mb-2">No recordings found</p>
                                    <p className="text-sm">Create some screen recordings first to attach them to bug reports.</p>
                                </div>
                            ) : (
                                <div className="p-6 overflow-y-auto max-h-96">
                                    <div className="space-y-3">
                                        {recordings.map(recording => (
                                            <div
                                                key={recording.id}
                                                onClick={() => toggleRecordingSelection(recording)}
                                                className={`p-4 border rounded cursor-pointer transition-all duration-200 ${
                                                    selectedRecordings.some(r => r.id === recording.id)
                                                        ? 'border-[#00897B] bg-[#E0F2F1] shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        <div className="flex-shrink-0">
                                                            <div className={`p-2 rounded ${
                                                                selectedRecordings.some(r => r.id === recording.id)
                                                                    ? 'bg-[#00897B]'
                                                                    : 'bg-blue-100'
                                                            }`}>
                                                                <Play className={`h-4 w-4 ${
                                                                    selectedRecordings.some(r => r.id === recording.id)
                                                                        ? 'text-white'
                                                                        : 'text-teal-600'
                                                                }`} />
                                                            </div>
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
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                            selectedRecordings.some(r => r.id === recording.id)
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
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                            <p className="text-sm text-gray-600">
                                {selectedRecordings.length} recording{selectedRecordings.length !== 1 ? 's' : ''} selected
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRecordingModal(false);
                                        setSelectedRecordings([]);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={addSelectedRecordings}
                                    disabled={selectedRecordings.length === 0}
                                    className="px-4 py-2 bg-[#00897B] text-white rounded hover:bg-[#00796B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    Add Selected ({selectedRecordings.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BugReportAttachments;