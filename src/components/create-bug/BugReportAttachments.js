import React, { useRef, useState } from "react";
import {
    Upload,
    Paperclip,
    Trash2,
    Play,
    FileText,
    Image as ImageIcon,
    Video,
    Link2
} from "lucide-react";
import BugRecordingLinker from './BugRecordingLinker';

const BugReportAttachments = ({
    attachments,
    setAttachments,
    recordings,
    isLoadingRecordings,
    setError,
    linkedRecordings = [],
    setLinkedRecordings,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showRecordingLinker, setShowRecordingLinker] = useState(false);
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

    // Handle linking recordings
    const handleLinkRecordings = (selectedRecordings) => {
        const recordingIds = selectedRecordings.map(r => r.id);
        setLinkedRecordings(prev => [...prev, ...recordingIds]);
        
        // Optionally, add recording info to attachments for display
        const recordingAttachments = selectedRecordings.map(recording => ({
            name: recording.title || `Recording-${recording.id.slice(0, 8)}`,
            url: recording.videoUrl || recording.url,
            isRecording: true,
            id: recording.id,
            isUploaded: true,
            recordingData: recording
        }));

        setAttachments(prev => [...prev, ...recordingAttachments]);
    };

    // Remove linked recording
    const removeLinkedRecording = (recordingId) => {
        setLinkedRecordings(prev => prev.filter(id => id !== recordingId));
        setAttachments(prev => prev.filter(att => att.id !== recordingId));
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Attachments</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Add screenshots, videos, or documents to help illustrate the bug. You can also link existing recordings.
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
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                }`}
            >
                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="p-3 bg-secondary rounded">
                            <Paperclip className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                    <div>
                        <p className="text-base text-muted-foreground mb-2">
                            Drag and drop files here, or{" "}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-primary hover:text-primary/80 font-medium underline"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Images, videos, documents up to 10MB each
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Supported formats: JPG, PNG, GIF, MP4, PDF, DOC, DOCX, TXT, JSON
                        </p>
                    </div>
                    <div className="flex justify-center space-x-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-secondary hover:bg-secondary/80 rounded text-sm font-medium transition-colors duration-200"
                        >
                            <Upload className="h-4 w-4" />
                            <span>Upload Files</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRecordingLinker(true)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded text-sm font-medium transition-colors duration-200"
                        >
                            <Link2 className="h-4 w-4" />
                            <span>Link Recordings</span>
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
                        <h4 className="text-sm font-medium text-foreground">
                            Attached Files ({attachments.length})
                        </h4>
                        <button
                            type="button"
                            onClick={() => {
                                setAttachments([]);
                                setLinkedRecordings([]);
                            }}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors duration-200"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 hover:bg-secondary transition-colors duration-200"
                            >
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="flex-shrink-0">
                                        {attachment.isRecording ? (
                                            <div className="p-1 bg-primary/10 rounded">
                                                <Play className="h-4 w-4 text-primary" />
                                            </div>
                                        ) : (
                                            <div className="p-1 bg-secondary rounded">
                                                {getFileIcon(attachment.type || '')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {attachment.name}
                                        </p>
                                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                            {attachment.size && (
                                                <span>{formatFileSize(attachment.size)}</span>
                                            )}
                                            {attachment.isRecording && (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                                                    Linked Recording
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
                                    onClick={() => {
                                        if (attachment.isRecording) {
                                            removeLinkedRecording(attachment.id);
                                        } else {
                                            removeAttachment(attachment.id);
                                        }
                                    }}
                                    className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all duration-200"
                                    title={attachment.isRecording ? "Unlink recording" : "Remove attachment"}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recording Linker Modal */}
            {showRecordingLinker && (
                <BugRecordingLinker
                    recordings={recordings}
                    isLoadingRecordings={isLoadingRecordings}
                    linkedRecordings={linkedRecordings}
                    onLinkRecordings={handleLinkRecordings}
                    onClose={() => setShowRecordingLinker(false)}
                />
            )}
        </div>
    );
};

export default BugReportAttachments;