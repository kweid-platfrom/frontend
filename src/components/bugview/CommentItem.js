/* eslint-disable @next/next/no-img-element */
// components/CommentItem.js
import React, { useState } from "react";
import { Reply, MoreVertical, Edit, Trash2, Image as ZoomIn, X } from "lucide-react";
import AttachmentsList from "../bugview/AttachmentsList";

const CommentItem = ({ comment, formatDate, getUserInitials, getUserColor, level = 0, onReply, onEdit, onDelete }) => {
    const [showReplies, setShowReplies] = useState(true);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleReply = () => {
        if (replyText.trim() && onReply) {
            onReply(comment.id, replyText);
            setReplyText("");
            setIsReplying(false);
        }
    };

    const isImage = (attachment) => {
        return attachment.type?.startsWith('image/') || 
               ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                   attachment.name?.split('.').pop()?.toLowerCase() || ''
               );
    };

    const ImagePreviewModal = ({ imageUrl, imageName, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="relative max-w-4xl max-h-4xl m-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                >
                    <X className="h-6 w-6" />
                </button>
                <img
                    src={imageUrl}
                    alt={imageName}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
                    {imageName}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
                <div className="flex items-start space-x-3 group">
                    <div className="flex-shrink-0">
                        <div className={`w-8 h-8 ${getUserColor(comment.user)} rounded-full flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">
                                {getUserInitials(comment.user)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                                {comment.user || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                            </span>
                            {comment.edited && (
                                <span className="text-xs text-gray-400 italic">(edited)</span>
                            )}
                        </div>
                        
                        {comment.text && (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                                {comment.text}
                            </div>
                        )}
                        
                        {/* Comment Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                            <div className="mb-2">
                                {/* Image Attachments - Show as grid */}
                                {comment.attachments.filter(isImage).length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mb-2 max-w-md">
                                        {comment.attachments.filter(isImage).map((attachment, index) => (
                                            <div key={index} className="relative group cursor-pointer">
                                                <img
                                                    src={attachment.url}
                                                    alt={attachment.name}
                                                    className="w-full h-32 object-cover rounded border hover:opacity-90 transition-opacity"
                                                    onClick={() => setSelectedImage(attachment)}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                                                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Non-image Attachments */}
                                {comment.attachments.filter(att => !isImage(att)).length > 0 && (
                                    <AttachmentsList attachments={comment.attachments.filter(att => !isImage(att))} />
                                )}
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onReply && (
                                <button
                                    onClick={() => setIsReplying(!isReplying)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                                >
                                    <Reply className="h-3 w-3" />
                                    <span>Reply</span>
                                </button>
                            )}
                            
                            {(onEdit || onDelete) && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="text-xs text-gray-500 hover:text-gray-700 p-1"
                                    >
                                        <MoreVertical className="h-3 w-3" />
                                    </button>
                                    
                                    {showMenu && (
                                        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                                            {onEdit && (
                                                <button
                                                    onClick={() => {
                                                        onEdit(comment.id);
                                                        setShowMenu(false);
                                                    }}
                                                    className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    <span>Edit</span>
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => {
                                                        onDelete(comment.id);
                                                        setShowMenu(false);
                                                    }}
                                                    className="flex items-center space-x-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    <span>Delete</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Reply Form */}
                        {isReplying && (
                            <div className="mt-3 space-y-2">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={2}
                                />
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim()}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Reply
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsReplying(false);
                                            setReplyText("");
                                        }}
                                        className="px-3 py-1 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3">
                                <button
                                    onClick={() => setShowReplies(!showReplies)}
                                    className="text-xs text-blue-600 hover:text-blue-800 mb-2"
                                >
                                    {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                </button>
                                
                                {showReplies && (
                                    <div className="space-y-3">
                                        {comment.replies.map((reply, index) => (
                                            <CommentItem
                                                key={reply.id || index}
                                                comment={reply}
                                                formatDate={formatDate}
                                                getUserInitials={getUserInitials}
                                                getUserColor={getUserColor}
                                                level={level + 1}
                                                onReply={onReply}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <ImagePreviewModal
                    imageUrl={selectedImage.url}
                    imageName={selectedImage.name}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </>
    );
};

export default CommentItem;