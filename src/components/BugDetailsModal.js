import React, { useState } from "react";
import { X, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

const BugDetailsModal = ({ 
    bug, 
    onClose, 
    statusOptions, 
    priorityOptions, 
    severityOptions, 
    teamMembers, 
    updateBug,
    getStatusColor,
    getPriorityColor,
    getSeverityColor
}) => {
    const [editedBug, setEditedBug] = useState({...bug});
    const [showComments, setShowComments] = useState(true);
    const [newComment, setNewComment] = useState("");
    
    const handleChange = (field, value) => {
        setEditedBug({
            ...editedBug,
            [field]: value
        });
    };
    
    const handleSave = () => {
        updateBug(editedBug);
        onClose();
    };
    
    const handleAddComment = () => {
        if (!newComment.trim()) return;
        
        const updatedBug = {...editedBug};
        const newCommentObj = {
            id: Date.now(),
            author: currentUser.name,
            authorEmail: currentUser.email,
            text: newComment,
            timestamp: new Date().toISOString()
        };
        
        updatedBug.comments = updatedBug.comments || [];
        updatedBug.comments.push(newCommentObj);
        
        setEditedBug(updatedBug);
        setNewComment("");
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with Avatar */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Bug Details: #{editedBug.id}</h2>
                
                    <div className="flex items-center space-x-4">
                        <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Main content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={editedBug.title}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows="4"
                                    value={editedBug.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            
                            {/* Steps to Reproduce */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Steps to Reproduce</label>
                                <textarea
                                    rows="3"
                                    value={editedBug.stepsToReproduce}
                                    onChange={(e) => handleChange("stepsToReproduce", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            
                            {/* Comments section */}
                            <div className="mt-6">
                                <div 
                                    className="flex justify-between items-center cursor-pointer" 
                                    onClick={() => setShowComments(!showComments)}
                                >
                                    <div className="flex items-center">
                                        <MessageSquare size={18} className="mr-2" />
                                        <h3 className="text-lg font-medium">Comments ({editedBug.comments?.length || 0})</h3>
                                    </div>
                                    {showComments ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                </div>
                                
                                {showComments && (
                                    <div className="mt-3 space-y-3">
                                        {editedBug.comments?.length > 0 ? (
                                            editedBug.comments.map(comment => (
                                                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">{comment.author}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(comment.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1">{comment.text}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500">No comments yet.</p>
                                        )}
                                        
                                        <div className="flex mt-4">
                                            <input
                                                type="text"
                                                placeholder="Add a comment..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-l-md p-2"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-gray-50 p-4 border-t md:border-t-0 md:border-l overflow-y-auto">
                        <div className="space-y-4">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={editedBug.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    style={{ backgroundColor: getStatusColor(editedBug.status) }}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    value={editedBug.priority}
                                    onChange={(e) => handleChange("priority", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    style={{ backgroundColor: getPriorityColor(editedBug.priority) }}
                                >
                                    {priorityOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Severity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Severity</label>
                                <select
                                    value={editedBug.severity}
                                    onChange={(e) => handleChange("severity", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    style={{ backgroundColor: getSeverityColor(editedBug.severity) }}
                                >
                                    {severityOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Assigned To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                                <select
                                    value={editedBug.assignedTo}
                                    onChange={(e) => handleChange("assignedTo", e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="">Unassigned</option>
                                    {teamMembers.map(member => (
                                        <option key={member.id} value={member.id}>{member.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Reported By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reported By</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={editedBug.reportedBy}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                                />
                            </div>
                            
                            {/* Created Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Created On</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={new Date(editedBug.createdAt).toLocaleString()}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                                />
                            </div>
                            
                            {/* Save button */}
                            <button
                                onClick={handleSave}
                                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugDetailsModal;