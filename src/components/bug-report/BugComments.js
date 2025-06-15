/* eslint-disable @next/next/no-img-element */
// components/BugComments.js
import React, { useState, useRef } from "react";
import { Send, MessageCircle, Paperclip, Image, X } from "lucide-react";
import CommentItem from "../bugview/CommentItem";
import ImageUpload from "../bugview/ImageUpload";

const BugComments = ({ comments, onAddComment, loading, formatDate }) => {
    const [newComment, setNewComment] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim() || attachments.length > 0) {
            onAddComment(newComment, attachments);
            setNewComment("");
            setAttachments([]);
            setShowImageUpload(false);
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
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAttachment = {
                    name: file.name,
                    url: event.target.result,
                    size: file.size,
                    type: file.type
                };
                setAttachments(prev => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    const newAttachment = {
                        name: `pasted-image-${Date.now()}.png`,
                        url: event.target.result,
                        size: file.size,
                        type: file.type
                    };
                    setAttachments(prev => [...prev, newAttachment]);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
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
        <div className="space-y-4">
            {/* Comments List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
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

            {/* Add Comment Form */}
            <div className="border-t border-gray-200 pt-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onPaste={handlePaste}
                            placeholder="Add a comment... (Press Enter to submit, Shift+Enter for new line, Ctrl+V to paste images)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Upload file"
                            >
                                <Paperclip className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowImageUpload(!showImageUpload)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Upload image"
                            >
                                <Image className="h-4 w-4" alt="" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,application/pdf,.doc,.docx,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <div className="text-xs text-gray-500">
                                Enter to submit, Shift+Enter for new line
                            </div>
                            <button
                                type="submit"
                                disabled={loading || (!newComment.trim() && attachments.length === 0)}
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Send</span>
                                    </>
                                )}
                            </button>
                        </div>
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