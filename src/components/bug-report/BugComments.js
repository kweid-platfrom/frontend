// components/BugComments.js
import React, { useState } from "react";
import { Send, MessageCircle } from "lucide-react";

const BugComments = ({ comments, onAddComment, loading, formatDate }) => {
    const [newComment, setNewComment] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="bg-gray-50">
            {/* Comments Header */}
            <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Comments ({comments.length})
                    </span>
                </div>
                <div className="text-xs text-gray-500">
                    {isExpanded ? 'Click to collapse' : 'Click to expand'}
                </div>
            </div>

            {/* Comments List */}
            {isExpanded && (
                <div className="border-t border-gray-200">
                    {/* Existing Comments */}
                    {comments.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto">
                            {comments.map((comment, index) => (
                                <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-medium">
                                                    {comment.user?.charAt(0)?.toUpperCase() || 'U'}
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
                                            </div>
                                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {comment.text}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No comments yet. Be the first to add one!
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Add a comment... (Press Enter to submit, Shift+Enter for new line)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    Press Enter to submit, Shift+Enter for new line
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !newComment.trim()}
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugComments;