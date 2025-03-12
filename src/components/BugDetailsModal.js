import React, { useState } from 'react';
import { MessageSquare, Clock, Reply } from "lucide-react";

const BugDetailsModal = ({ 
    bug, 
    onClose, 
    onUpdate, 
    getStatusColor, 
    getPriorityColor, 
    getSeverityColor,
    statusOptions,
    priorityOptions,
    severityOptions 
}) => {
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [editedBug, setEditedBug] = useState(bug);

    const handleCommentSubmit = () => {
        if (!newComment.trim()) return;
        
        // Clone the edited bug to avoid direct state mutation
        const updatedBug = { ...editedBug };
        
        if (replyTo) {
            // Find the parent comment to reply to
            const parentComment = updatedBug.comments.find(comment => comment.id === replyTo);
            if (parentComment) {
                const newReplyId = parentComment.replies.length > 0 
                    ? Math.max(...parentComment.replies.map(r => r.id)) + 1 
                    : parentComment.id * 100 + 1;
                
                parentComment.replies.push({
                    id: newReplyId,
                    author: "Current User", // In a real app, this would be the logged-in user
                    text: newComment,
                    timestamp: new Date().toLocaleString()
                });
            }
        } else {
            // Add as a new comment
            const newCommentId = updatedBug.comments.length > 0 
                ? Math.max(...updatedBug.comments.map(c => c.id)) + 1 
                : 1;
            
            updatedBug.comments.push({
                id: newCommentId,
                author: "Current User", // In a real app, this would be the logged-in user
                text: newComment,
                timestamp: new Date().toLocaleString(),
                replies: []
            });
        }
        
        setEditedBug(updatedBug);
        onUpdate(updatedBug);
        setNewComment("");
        setReplyTo(null);
    };

    const handleSetReplyTo = (commentId) => {
        setReplyTo(commentId === replyTo ? null : commentId);
    };

    const handleStatusChange = (e) => {
        const updatedBug = { ...editedBug, status: e.target.value };
        setEditedBug(updatedBug);
        onUpdate(updatedBug);
    };

    const handlePriorityChange = (e) => {
        const updatedBug = { ...editedBug, priority: e.target.value };
        setEditedBug(updatedBug);
        onUpdate(updatedBug);
    };

    const handleSeverityChange = (e) => {
        const updatedBug = { ...editedBug, severity: e.target.value };
        setEditedBug(updatedBug);
        onUpdate(updatedBug);
    };

    return (
        <div className="fixed top-0 right-0 w-1/3 h-full bg-white shadow-lg z-20 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Bug Details</h2>
                <button 
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>
            
            <div className="overflow-y-auto flex-grow p-4">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div>
                        <p className="font-semibold">ID:</p>
                        <p>{editedBug.id}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Title:</p>
                        <p>{editedBug.title}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Category:</p>
                        <p>{editedBug.category}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Assigned To:</p>
                        <p>{editedBug.assignedTo}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Status:</p>
                        <select 
                            className={`p-1 text-white ${getStatusColor(editedBug.status)}`}
                            value={editedBug.status}
                            onChange={handleStatusChange}
                        >
                            {statusOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                            <option value="custom">+ Add New Status</option>
                        </select>
                    </div>
                    <div>
                        <p className="font-semibold">Priority:</p>
                        <select 
                            className={`p-1 text-white ${getPriorityColor(editedBug.priority)}`}
                            value={editedBug.priority}
                            onChange={handlePriorityChange}
                        >
                            {priorityOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="font-semibold">Severity:</p>
                        <select 
                            className={`p-1 text-white ${getSeverityColor(editedBug.severity)}`}
                            value={editedBug.severity}
                            onChange={handleSeverityChange}
                        >
                            {severityOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="font-semibold">Epic:</p>
                        <p>{editedBug.epic}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Test Case:</p>
                        <p>{editedBug.testCase}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Case Status:</p>
                        <p>{editedBug.caseStatus}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Due Date:</p>
                        <p>{editedBug.dueDate}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Automated:</p>
                        <p>{editedBug.automated}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Creation Log:</p>
                        <p>{editedBug.creationLog}</p>
                    </div>
                </div>
                
                <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2 flex items-center">
                        <MessageSquare size={18} className="mr-2" />
                        Comments
                    </h3>
                    
                    <div className="bg-gray-100 p-3 rounded max-h-64 overflow-y-auto mb-3">
                        {editedBug.comments.length === 0 ? (
                            <p className="text-gray-500">No comments yet.</p>
                        ) : (
                            editedBug.comments.map(comment => (
                                <div key={comment.id} className="mb-3">
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold">{comment.author}</span>
                                            <span className="text-xs text-gray-500 flex items-center">
                                                <Clock size={12} className="mr-1" />
                                                {comment.timestamp}
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.text}</p>
                                        <button 
                                            className="text-xs text-blue-500 mt-1 flex items-center"
                                            onClick={() => handleSetReplyTo(comment.id)}
                                        >
                                            <Reply size={12} className="mr-1" />
                                            {replyTo === comment.id ? "Cancel" : "Reply"}
                                        </button>
                                    </div>
                                    
                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="ml-6 mt-2">
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="bg-white p-2 rounded shadow-sm mb-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-semibold">{reply.author}</span>
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <Clock size={12} className="mr-1" />
                                                            {reply.timestamp}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{reply.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Reply form */}
                                    {replyTo === comment.id && (
                                        <div className="ml-6 mt-2">
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    className="flex-grow p-2 border rounded-l focus:outline-none"
                                                    placeholder="Type your reply..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                                />
                                                <button
                                                    className="bg-blue-500 text-white px-3 py-1 rounded-r"
                                                    onClick={handleCommentSubmit}
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* New comment form */}
                {!replyTo && (
                    <div className="border-t pt-3 mt-3">
                        <h4 className="font-semibold mb-2">Add a comment</h4>
                        <div className="flex">
                            <input
                                type="text"
                                className="flex-grow p-2 border rounded-l focus:outline-none"
                                placeholder="Type your comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                            />
                            <button
                                className="bg-blue-500 text-white px-3 py-1 rounded-r"
                                onClick={handleCommentSubmit}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Description section */}
                <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2">Description</h3>
                    <div className="bg-gray-100 p-3 rounded">
                        <p>{editedBug.description}</p>
                    </div>
                </div>
                
                {/* Steps to reproduce section */}
                <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2">Steps to Reproduce</h3>
                    <div className="bg-gray-100 p-3 rounded">
                        {editedBug.stepsToReproduce ? (
                            <ol className="list-decimal ml-4">
                                {editedBug.stepsToReproduce.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-gray-500">No steps provided.</p>
                        )}
                    </div>
                </div>
                
                {/* Attachments section */}
                <div className="mt-6">
                    <h3 className="font-bold text-lg mb-2">Attachments</h3>
                    <div className="bg-gray-100 p-3 rounded">
                        {editedBug.attachments && editedBug.attachments.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {editedBug.attachments.map((attachment, index) => (
                                    <div key={index} className="bg-white p-2 rounded flex items-center">
                                        <span className="truncate flex-grow">{attachment.name}</span>
                                        <a href={attachment.url} className="text-blue-500 ml-2" target="_blank" rel="noopener noreferrer">
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No attachments.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugDetailsModal;