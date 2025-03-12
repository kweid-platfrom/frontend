import React, { useState } from "react";
import { X, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

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
            author: "Current User", // This would normally come from auth context
            text: newComment,
            timestamp: new Date().toLocaleString(),
            replies: []
        };
        
        updatedBug.comments = [...updatedBug.comments, newCommentObj];
        setEditedBug(updatedBug);
        setNewComment("");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{bug.id} - Bug Details</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    {/* Title */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input 
                            type="text" 
                            value={editedBug.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    
                    {/* Two column layout for main details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Left column */}
                        <div>
                            {/* Status */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    value={editedBug.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    className="w-full p-2 border rounded"
                                    style={{ backgroundColor: getStatusColor(editedBug.status) }}
                                >
                                    {statusOptions.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Priority */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select 
                                    value={editedBug.priority}
                                    onChange={(e) => handleChange("priority", e.target.value)}
                                    className="w-full p-2 border rounded"
                                    style={{ backgroundColor: getPriorityColor(editedBug.priority) }}
                                >
                                    {priorityOptions.map(priority => (
                                        <option key={priority} value={priority}>{priority}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Severity */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select 
                                    value={editedBug.severity}
                                    onChange={(e) => handleChange("severity", e.target.value)}
                                    className="w-full p-2 border rounded"
                                    style={{ backgroundColor: getSeverityColor(editedBug.severity) }}
                                >
                                    {severityOptions.map(severity => (
                                        <option key={severity} value={severity}>{severity}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Category */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input 
                                    type="text" 
                                    value={editedBug.category}
                                    onChange={(e) => handleChange("category", e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                        
                        {/* Right column */}
                        <div>
                            {/* Assigned To */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                                <select 
                                    value={editedBug.assignedTo}
                                    onChange={(e) => handleChange("assignedTo", e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    {teamMembers.map(member => (
                                        <option key={member} value={member}>{member}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Epic */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Epic</label>
                                <input 
                                    type="text" 
                                    value={editedBug.epic}
                                    onChange={(e) => handleChange("epic", e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            
                            {/* Test Case */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Case</label>
                                <input 
                                    type="text" 
                                    value={editedBug.testCase}
                                    onChange={(e) => handleChange("testCase", e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            
                            {/* Due Date */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input 
                                    type="text" 
                                    value={editedBug.dueDate}
                                    onChange={(e) => handleChange("dueDate", e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Automation Info */}
                    <div className="mb-6 p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Automation</h3>
                            <span className={`px-2 py-0.5 rounded ${editedBug.automated === "Yes" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {editedBug.automated}
                            </span>
                        </div>
                        
                        {editedBug.automated === "Yes" && editedBug.automationLink && (
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Automation Link</label>
                                <input 
                                    type="text" 
                                    value={editedBug.automationLink}
                                    onChange={(e) => handleChange("automationLink", e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Creation Log */}
                    <div className="mb-6">
                        <div className="text-sm text-gray-500">
                            <span>Created: {editedBug.creationLog}</span>
                        </div>
                    </div>
                    
                    {/* Comments Section */}
                    <div className="mt-8 border-t pt-4">
                        <div 
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <div className="flex items-center">
                                <MessageSquare size={18} className="mr-2" />
                                <h3 className="font-medium">Comments ({editedBug.comments?.length || 0})</h3>
                            </div>
                            {showComments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                        
                        {showComments && (
                            <div className="mt-4">
                                {/* Comment list */}
                                {editedBug.comments && editedBug.comments.length > 0 ? (
                                    <div className="space-y-4 mb-4">
                                        {editedBug.comments.map(comment => (
                                            <div key={comment.id} className="bg-gray-50 p-3 rounded">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium">{comment.author}</span>
                                                    <span className="text-sm text-gray-500">{comment.timestamp}</span>
                                                </div>
                                                <p className="text-gray-700">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 mb-4">No comments yet.</p>
                                )}
                                
                                {/* Add comment */}
                                <div className="flex">
                                    <textarea 
                                        className="flex-grow p-2 border rounded-l"
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <button 
                                        className="px-4 bg-blue-500 text-white rounded-r hover:bg-blue-600"
                                        onClick={handleAddComment}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Description */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            value={editedBug.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="w-full p-2 border rounded h-32"
                        />
                    </div>
                    
                    {/* Steps to Reproduce */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
                        <textarea 
                            value={editedBug.stepsToReproduce}
                            onChange={(e) => handleChange("stepsToReproduce", e.target.value)}
                            className="w-full p-2 border rounded h-32"
                        />
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-2">
                    <button 
                        className="px-4 py-2 border rounded hover:bg-gray-100"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={handleSave}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BugDetailsModal;