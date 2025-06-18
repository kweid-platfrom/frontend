/* eslint-disable @next/next/no-img-element */
// components/BugComments.js
import React, { useState, useRef } from "react";
import { Send, MessageCircle, Paperclip, Image, X } from "lucide-react";
import { toast } from "sonner";
import CommentItem from "../bugview/CommentItem";
import ImageUpload from "../bugview/ImageUpload";

const BugComments = ({ comments, onAddComment, loading, formatDate }) => {
    const [newComment, setNewComment] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim() || attachments.length > 0) {
            try {
                await onAddComment(newComment, attachments);
                setNewComment("");
                setAttachments([]);
                setShowImageUpload(false);
                toast.success("Comment added successfully!");
            } catch (error) {
                toast.error("Failed to add comment. Please try again.");
                console.error("Error adding comment:", error);
            }
        } else {
            toast.warning("Please add a comment or attachment before submitting.");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxFileSize = 10 * 1024 * 1024; // 10MB limit
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        
        files.forEach(file => {
            // Validate file size
            if (file.size > maxFileSize) {
                toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
                return;
            }
            
            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                toast.error(`File type "${file.type}" is not supported.`);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAttachment = {
                    name: file.name,
                    url: event.target.result,
                    size: file.size,
                    type: file.type
                };
                setAttachments(prev => [...prev, newAttachment]);
                toast.success(`File "${file.name}" uploaded successfully!`);
            };
            reader.onerror = () => {
                toast.error(`Failed to read file "${file.name}".`);
            };
            reader.readAsDataURL(file);
        });
        
        // Reset file input
        e.target.value = '';
    };

    const handlePaste = async (e) => {
        // For regular paste events (Ctrl+V), we can still access clipboardData
        if (e.clipboardData) {
            const items = e.clipboardData.items;
            let hasImage = false;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    hasImage = true;
                    const file = items[i].getAsFile();
                    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
                    
                    if (file.size > maxFileSize) {
                        toast.error("Pasted image is too large. Maximum size is 10MB.");
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const newAttachment = {
                            name: `pasted-image-${Date.now()}.png`,
                            url: event.target.result,
                            size: file.size,
                            type: file.type
                        };
                        setAttachments(prev => [...prev, newAttachment]);
                        toast.success("Image pasted successfully!");
                    };
                    reader.onerror = () => {
                        toast.error("Failed to process pasted image.");
                    };
                    reader.readAsDataURL(file);
                }
            }
            
            if (!hasImage && items.length > 0) {
                const hasText = Array.from(items).some(item => item.type === 'text/plain');
                if (!hasText) {
                    toast.info("Only images and text can be pasted.");
                }
            }
        }
    };

    const handleClipboardAccess = async () => {
        try {
            // Check if clipboard API is supported
            if (!navigator.clipboard || !navigator.clipboard.read) {
                toast.info("Clipboard access not supported in this browser. Use Ctrl+V to paste images.");
                return;
            }

            // Check clipboard permission without triggering permission dialog
            const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });
            
            if (permissionStatus.state === 'denied') {
                toast.error("Clipboard access denied. Please enable clipboard permissions or use Ctrl+V to paste images.");
                return;
            }
            
            if (permissionStatus.state === 'prompt') {
                toast.info("Click here to grant clipboard access, or use Ctrl+V to paste images.");
                return;
            }

            // If permission is granted, read clipboard
            if (permissionStatus.state === 'granted') {
                const clipboardItems = await navigator.clipboard.read();
                let hasImage = false;
                
                for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                        if (type.startsWith('image/')) {
                            hasImage = true;
                            const blob = await clipboardItem.getType(type);
                            const maxFileSize = 10 * 1024 * 1024; // 10MB limit
                            
                            if (blob.size > maxFileSize) {
                                toast.error("Clipboard image is too large. Maximum size is 10MB.");
                                return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const newAttachment = {
                                    name: `clipboard-image-${Date.now()}.${type.split('/')[1]}`,
                                    url: event.target.result,
                                    size: blob.size,
                                    type: type
                                };
                                setAttachments(prev => [...prev, newAttachment]);
                                toast.success("Image from clipboard added successfully!");
                            };
                            reader.onerror = () => {
                                toast.error("Failed to process clipboard image.");
                            };
                            reader.readAsDataURL(blob);
                        }
                    }
                }
                
                if (!hasImage) {
                    toast.info("No images found in clipboard.");
                }
            }
        } catch (error) {
            console.error('Clipboard access error:', error);
            if (error.name === 'NotAllowedError') {
                toast.error("Clipboard access denied. Use Ctrl+V to paste images instead.");
            } else {
                toast.info("Unable to access clipboard. Use Ctrl+V to paste images.");
            }
        }
    };

    const removeAttachment = (index) => {
        const attachment = attachments[index];
        setAttachments(prev => prev.filter((_, i) => i !== index));
        toast.success(`Removed "${attachment.name}"`);
    };

    const getUserInitials = (userName) => {
        if (!userName) return 'U';
        return userName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
    };

    const getUserColor = (userName) => {
        if (!userName) return 'bg-gray-500';
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
        ];
        const index = userName.length % colors.length;
        return colors[index];
    };

    return (
        <div className="flex flex-col h-full">
            {/* Comments List - Scrollable */}
            <div className="flex-1 space-y-4 max-h-80 overflow-y-auto py-4">
                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <CommentItem
                            key={comment.id || index}
                            comment={comment}
                            formatDate={formatDate}
                            getUserInitials={getUserInitials}
                            getUserColor={getUserColor}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        No comments yet. Be the first to add one!
                    </div>
                )}
            </div>

            {/* Sticky Comment Input Section */}
            <div className="flex-shrink-0 pt-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Attachment Buttons - Above Input */}
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                            title="Upload file"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImageUpload(!showImageUpload)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                            title="Upload image"
                        >
                            <Image className="h-4 w-4" alt="" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClipboardAccess}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                            title="Paste from clipboard"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </button>
                    </div>

                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="relative group">
                                    {attachment.type?.startsWith('image/') ? (
                                        <div className="relative">
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="w-16 h-16 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 bg-white rounded border p-2 pr-6 relative">
                                            <Paperclip className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs text-gray-700 truncate max-w-20">
                                                {attachment.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comment Input with Inline Send Button */}
                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onPaste={handlePaste}
                            placeholder="Add a comment..."
                            className="w-full pl-3 pr-12 py-5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent resize-none"
                            rows={2}
                            disabled={loading}
                        />
                        
                        {/* Inline Send Button */}
                        <button
                            type="submit"
                            disabled={loading || (!newComment.trim() && attachments.length === 0)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Send comment"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send className="h-8 w-8" />
                            )}
                        </button>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    {/* Helper Text */}
                    <div className="text-xs text-gray-500 px-1">
                        Enter to submit, Shift+Enter for new line, Ctrl+V to paste images, or use clipboard button
                    </div>
                </form>

                {/* Image Upload Component */}
                {showImageUpload && (
                    <div className="mt-3">
                        <ImageUpload
                            onImageUpload={(imageData) => {
                                setAttachments(prev => [...prev, imageData]);
                                setShowImageUpload(false);
                            }}
                            onClose={() => setShowImageUpload(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugComments;