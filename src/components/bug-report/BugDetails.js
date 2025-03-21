"use client"

import React, { useState } from "react";
import { X, AlertCircle, CheckCircle, Clock, User, Edit, Send } from "lucide-react";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";

const BugDetailsOverlay = ({ bug, onClose, updateBugStatus, setBugs }) => {
    const [activeTab, setActiveTab] = useState("details");
    const [editMode, setEditMode] = useState(false);
    const [editedBug, setEditedBug] = useState({ ...bug });
    const [chatMessage, setChatMessage] = useState("");
    const [messages, setMessages] = useState(bug.messages || []);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "High":
                return "text-red-600 bg-red-50";
            case "Medium":
                return "text-orange-600 bg-orange-50";
            case "Low":
                return "text-green-600 bg-green-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "New":
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case "In Progress":
                return <Clock className="h-4 w-4 text-orange-500" />;
            case "Resolved":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const handleSaveChanges = async () => {
        try {
            const bugRef = doc(db, "bugReports", bug.id);
            await updateDoc(bugRef, {
                title: editedBug.title,
                description: editedBug.description,
                stepsToReproduce: editedBug.stepsToReproduce,
                severity: editedBug.severity,
                category: editedBug.category,
                assignedTo: editedBug.assignedTo
            });

            // Update local state
            setBugs((prevBugs) =>
                prevBugs.map((b) =>
                    b.id === bug.id ? { ...b, ...editedBug } : b
                )
            );
            
            setEditMode(false);
        } catch (error) {
            console.error("Error updating bug:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        
        const newMessage = {
            text: chatMessage,
            sender: "Current User", // Placeholder - would normally use authenticated user
            timestamp: Timestamp.now()
        };
        
        try {
            const bugRef = doc(db, "bugReports", bug.id);
            await updateDoc(bugRef, {
                messages: arrayUnion(newMessage)
            });
            
            // Update local state
            setMessages(prev => [...prev, newMessage]);
            setChatMessage("");
            
            // Update bugs state to include new message
            setBugs((prevBugs) =>
                prevBugs.map((b) =>
                    b.id === bug.id ? { 
                        ...b, 
                        messages: [...(b.messages || []), newMessage] 
                    } : b
                )
            );
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-25">
            <div className="bg-white w-full max-w-xl h-full overflow-auto shadow-lg flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-medium text-lg">{editMode ? "Edit Bug" : bug.title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b">
                    <button 
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </button>
                    <button 
                        className={`px-4 py-2 text-sm font-medium ${activeTab === 'chat' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Chat
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-grow overflow-auto">
                    {activeTab === 'details' ? (
                        <div className="p-4">
                            {editMode ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border rounded"
                                            value={editedBug.title}
                                            onChange={(e) => setEditedBug({...editedBug, title: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            className="w-full p-2 border rounded min-h-24"
                                            value={editedBug.description}
                                            onChange={(e) => setEditedBug({...editedBug, description: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
                                        <textarea 
                                            className="w-full p-2 border rounded min-h-24"
                                            value={editedBug.stepsToReproduce}
                                            onChange={(e) => setEditedBug({...editedBug, stepsToReproduce: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                            <select 
                                                className="w-full p-2 border rounded"
                                                value={editedBug.severity}
                                                onChange={(e) => setEditedBug({...editedBug, severity: e.target.value})}
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <select 
                                                className="w-full p-2 border rounded"
                                                value={editedBug.category}
                                                onChange={(e) => setEditedBug({...editedBug, category: e.target.value})}
                                            >
                                                <option value="UI">UI</option>
                                                <option value="Functionality">Functionality</option>
                                                <option value="Performance">Performance</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border rounded"
                                            value={editedBug.assignedTo || ""}
                                            onChange={(e) => setEditedBug({...editedBug, assignedTo: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-2 mt-4">
                                        <button 
                                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                            onClick={() => setEditMode(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            onClick={handleSaveChanges}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                                                {bug.severity}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {bug.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex items-center">
                                                {getStatusIcon(bug.status)}
                                                <span className="ml-1 text-sm">{bug.status}</span>
                                            </div>
                                            <button 
                                                onClick={() => setEditMode(true)}
                                                className="p-1 rounded-full hover:bg-gray-100"
                                            >
                                                <Edit className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{bug.description}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Steps to Reproduce</h4>
                                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{bug.stepsToReproduce}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Reported By</h4>
                                        <p className="mt-1 text-sm text-gray-700">{bug.reportedBy || "Unknown"}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                                        <p className="mt-1 text-sm text-gray-700">{bug.assignedTo || "Unassigned"}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Date Reported</h4>
                                        <p className="mt-1 text-sm text-gray-700">
                                            {bug.dateReported ? new Date(bug.dateReported.seconds * 1000).toLocaleString() : "Unknown"}
                                        </p>
                                    </div>
                                    
                                    <div className="border-t pt-4">
                                        <div className="flex space-x-2">
                                            <button 
                                                className={`px-3 py-1 text-sm rounded ${bug.status === "New" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-blue-50"}`}
                                                onClick={() => updateBugStatus(bug.id, "New")}
                                            >
                                                New
                                            </button>
                                            <button 
                                                className={`px-3 py-1 text-sm rounded ${bug.status === "In Progress" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600 hover:bg-orange-50"}`}
                                                onClick={() => updateBugStatus(bug.id, "In Progress")}
                                            >
                                                In Progress
                                            </button>
                                            <button 
                                                className={`px-3 py-1 text-sm rounded ${bug.status === "Resolved" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600 hover:bg-green-50"}`}
                                                onClick={() => updateBugStatus(bug.id, "Resolved")}
                                            >
                                                Resolved
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex-grow p-4 overflow-y-auto">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        No messages yet. Start the conversation.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message, index) => (
                                            <div key={index} className={`flex ${message.sender === "Current User" ? "justify-end" : "justify-start"}`}>
                                                <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                                                    message.sender === "Current User" 
                                                        ? "bg-blue-100 text-blue-900" 
                                                        : "bg-gray-100 text-gray-900"
                                                }`}>
                                                    <div className="flex items-center space-x-1 mb-1">
                                                        <User className="h-3 w-3" />
                                                        <span className="text-xs font-medium">{message.sender}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {message.timestamp?.seconds 
                                                                ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                                                : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{message.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        className="flex-grow p-2 border rounded-lg"
                                        placeholder="Type a message..."
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button 
                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        onClick={handleSendMessage}
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                                {/* Footer if needed */}
                                <div className="p-4 border-t bg-gray-50">
                                    <div className="text-xs text-gray-500">
                                        Bug ID: {bug.id} | Last Updated: {bug.lastUpdated ? new Date(bug.lastUpdated.seconds * 1000).toLocaleString() : "Never"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                };
                
                export default BugDetailsOverlay;
                                                
                                                