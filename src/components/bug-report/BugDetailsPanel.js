// components/BugDetailsPanel.js
import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, Timestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { toast } from "sonner";
import BugComments from "../bug-report/BugComments";
import { Edit, Save, X, Calendar, User, Flag, AlertCircle } from "lucide-react";

const BugItemDetails = ({ 
    bug, 
    teamMembers, 
    sprints, 
    onBugUpdate, 
    formatDate 
}) => {
    const [editedBug, setEditedBug] = useState({ ...bug });
    const [comments, setComments] = useState(bug.messages || []);
    const [loading, setLoading] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [tempValues, setTempValues] = useState({});

    // Listen for real-time updates to this specific bug
    useEffect(() => {
        const bugRef = doc(db, "bugs", bug.id);
        
        const unsubscribe = onSnapshot(bugRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const bugData = docSnapshot.data();
                setEditedBug({ id: docSnapshot.id, ...bugData });
                setComments(bugData.messages || []);
            }
        }, (error) => {
            console.error("Error listening to bug updates:", error);
            toast.error("Error loading bug data: " + error.message);
        });

        return () => unsubscribe();
    }, [bug.id]);

    const handleFieldEdit = (field, value) => {
        setEditingField(field);
        setTempValues({ ...tempValues, [field]: value });
    };

    const handleFieldSave = async (field) => {
        try {
            setLoading(true);
            const bugRef = doc(db, "bugs", bug.id);
            
            let updateData = { [field]: tempValues[field] };
            
            // Handle date fields
            if (field === 'dueDate' && tempValues[field]) {
                updateData[field] = Timestamp.fromDate(new Date(tempValues[field]));
            }

            // Update the bug data
            await updateDoc(bugRef, {
                ...updateData,
                lastUpdated: Timestamp.now()
            });

            // Add to activity log
            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: `updated ${field}`,
                    user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid,
                    createdAt: Timestamp.now()
                })
            });

            onBugUpdate({ ...editedBug, ...updateData });
            toast.success(`${field} updated successfully!`);
            setEditingField(null);
            setTempValues({});
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            toast.error(`Error updating ${field}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldCancel = () => {
        setEditingField(null);
        setTempValues({});
    };

    const handleAddComment = async (commentText) => {
        if (!commentText.trim()) return;

        setLoading(true);
        const newMessage = {
            text: commentText,
            user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid,
            createdAt: Timestamp.now()
        };

        try {
            const bugRef = doc(db, "bugs", bug.id);
            
            await updateDoc(bugRef, {
                messages: arrayUnion(newMessage)
            });

            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: "commented",
                    user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid,
                    createdAt: Timestamp.now()
                })
            });
            
            toast.success("Comment added successfully");
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(`Error sending message: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const EditableField = ({ field, value, type = "text", options = null, icon: Icon }) => {
        const isEditing = editingField === field;
        
        return (
            <div className="group relative">
                <div className="flex items-center space-x-2">
                    {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="flex items-center space-x-2">
                                {type === "select" ? (
                                    <select
                                        value={tempValues[field] || value}
                                        onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    >
                                        {options?.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : type === "textarea" ? (
                                    <textarea
                                        value={tempValues[field] || value}
                                        onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={3}
                                        disabled={loading}
                                    />
                                ) : (
                                    <input
                                        type={type}
                                        value={tempValues[field] || value}
                                        onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                )}
                                <button
                                    onClick={() => handleFieldSave(field)}
                                    disabled={loading}
                                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleFieldCancel}
                                    disabled={loading}
                                    className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                                    {value || 'Not set'}
                                </span>
                                <button
                                    onClick={() => handleFieldEdit(field, value)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                                >
                                    <Edit className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const statusOptions = [
        { value: 'Open', label: 'Open' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Testing', label: 'Testing' },
        { value: 'Resolved', label: 'Resolved' },
        { value: 'Closed', label: 'Closed' }
    ];

    const severityOptions = [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Critical', label: 'Critical' }
    ];

    const assigneeOptions = teamMembers?.map(member => ({
        value: member.id,
        label: member.name || member.email
    })) || [];

    const sprintOptions = sprints?.map(sprint => ({
        value: sprint.id,
        label: sprint.name
    })) || [];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b bg-white">
                <div className="mb-4">
                    <EditableField
                        field="title"
                        value={editedBug.title}
                        type="text"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Bug #{editedBug.id?.slice(-6)}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Description */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <EditableField
                        field="description"
                        value={editedBug.description}
                        type="textarea"
                    />
                </div>

                {/* Bug Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                        <EditableField
                            field="status"
                            value={editedBug.status}
                            type="select"
                            options={statusOptions}
                            icon={Flag}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Severity</h4>
                        <EditableField
                            field="severity"
                            value={editedBug.severity}
                            type="select"
                            options={severityOptions}
                            icon={AlertCircle}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Assignee</h4>
                        <EditableField
                            field="assignedTo"
                            value={editedBug.assignedTo}
                            type="select"
                            options={assigneeOptions}
                            icon={User}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sprint</h4>
                        <EditableField
                            field="sprint"
                            value={editedBug.sprint}
                            type="select"
                            options={sprintOptions}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Due Date</h4>
                        <EditableField
                            field="dueDate"
                            value={editedBug.dueDate ? (editedBug.dueDate.toDate ? editedBug.dueDate.toDate().toISOString().split('T')[0] : editedBug.dueDate) : ''}
                            type="date"
                            icon={Calendar}
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Environment</h4>
                        <EditableField
                            field="environment"
                            value={editedBug.environment}
                            type="text"
                        />
                    </div>
                </div>

                {/* Steps to Reproduce */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Steps to Reproduce</h4>
                    <EditableField
                        field="stepsToReproduce"
                        value={editedBug.stepsToReproduce}
                        type="textarea"
                    />
                </div>

                {/* Expected vs Actual Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Result</h4>
                        <EditableField
                            field="expectedResult"
                            value={editedBug.expectedResult}
                            type="textarea"
                        />
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Actual Result</h4>
                        <EditableField
                            field="actualResult"
                            value={editedBug.actualResult}
                            type="textarea"
                        />
                    </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                    <p>Created: {formatDate(editedBug.createdAt)}</p>
                    <p>Last Updated: {formatDate(editedBug.lastUpdated)}</p>
                    <p>Reporter: {editedBug.reporter}</p>
                </div>
            </div>

            {/* Comments Section */}
            <div className="flex-shrink-0 border-t bg-white">
                <BugComments
                    comments={comments}
                    onAddComment={handleAddComment}
                    loading={loading}
                    formatDate={formatDate}
                />
            </div>
        </div>
    );
};

export default BugItemDetails;