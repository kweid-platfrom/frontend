// components/BugDetailsPanel.js
import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, Timestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { toast } from "sonner";
import BugComments from "../bug-report/BugComments";
import EditableField from "../bugview/EditableField";
import AttachmentsList from "../bugview/AttachmentsList";
import ActivityLog from "../bugview/ActivityLog";
import { 
    Calendar, User, Flag, AlertCircle, 
    Paperclip
} from "lucide-react";

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

    // Default formatDate function if not provided
    const defaultFormatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        try {
            let date;
            if (timestamp?.toDate) {
                // Firestore Timestamp
                date = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                return 'Invalid Date';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    // Use provided formatDate or fallback to default
    const safeFormatDate = formatDate && typeof formatDate === 'function' ? formatDate : defaultFormatDate;

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

    const handleAddComment = async (commentText, attachments = []) => {
        if (!commentText.trim() && attachments.length === 0) return;

        setLoading(true);
        const newMessage = {
            text: commentText,
            user: auth.currentUser?.displayName || auth.currentUser?.email || auth.currentUser?.uid,
            createdAt: Timestamp.now(),
            attachments: attachments,
            id: Date.now().toString()
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

    const editableFieldProps = {
        editingField,
        tempValues,
        loading,
        onEdit: handleFieldEdit,
        onSave: handleFieldSave,
        onCancel: handleFieldCancel,
        setTempValues
    };

    return (
        <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="space-y-2">
                    <EditableField
                        field="title"
                        value={editedBug.title}
                        type="text"
                        {...editableFieldProps}
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                            Bug #{editedBug.id?.slice(-6)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {safeFormatDate(editedBug.createdAt)}</span>
                            <span>•</span>
                            <span>Reporter: {editedBug.reporter}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-8">
                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center">
                            Description
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <EditableField
                                field="description"
                                value={editedBug.description}
                                type="textarea"
                                {...editableFieldProps}
                            />
                        </div>
                    </div>

                    {/* Bug Details Grid */}
                    <div className="space-y-6">
                        <h3 className="text-base font-semibold text-gray-900">Details</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Status</h4>
                                    <EditableField
                                        field="status"
                                        value={editedBug.status}
                                        type="select"
                                        options={statusOptions}
                                        icon={Flag}
                                        {...editableFieldProps}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Severity</h4>
                                    <EditableField
                                        field="severity"
                                        value={editedBug.severity}
                                        type="select"
                                        options={severityOptions}
                                        icon={AlertCircle}
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Assignee</h4>
                                    <EditableField
                                        field="assignedTo"
                                        value={editedBug.assignedTo}
                                        type="select"
                                        options={assigneeOptions}
                                        icon={User}
                                        {...editableFieldProps}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Sprint</h4>
                                    <EditableField
                                        field="sprint"
                                        value={editedBug.sprint}
                                        type="select"
                                        options={sprintOptions}
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
                                    <EditableField
                                        field="dueDate"
                                        value={editedBug.dueDate ? (editedBug.dueDate.toDate ? editedBug.dueDate.toDate().toISOString().split('T')[0] : editedBug.dueDate) : ''}
                                        type="date"
                                        icon={Calendar}
                                        {...editableFieldProps}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Environment</h4>
                                    <EditableField
                                        field="environment"
                                        value={editedBug.environment}
                                        type="text"
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Steps to Reproduce */}
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900">Steps to Reproduce</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <EditableField
                                field="stepsToReproduce"
                                value={editedBug.stepsToReproduce}
                                type="textarea"
                                {...editableFieldProps}
                            />
                        </div>
                    </div>

                    {/* Expected vs Actual Results */}
                    <div className="space-y-6">
                        <h3 className="text-base font-semibold text-gray-900">Results</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Expected Result</h4>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <EditableField
                                        field="expectedResult"
                                        value={editedBug.expectedResult}
                                        type="textarea"
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Actual Result</h4>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <EditableField
                                        field="actualResult"
                                        value={editedBug.actualResult}
                                        type="textarea"
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    {editedBug.attachments && editedBug.attachments.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Attachments ({editedBug.attachments.length})
                            </h3>
                            <AttachmentsList attachments={editedBug.attachments} />
                        </div>
                    )}

                    {/* Activity Log */}
                    {editedBug.activityLog && editedBug.activityLog.length > 0 && (
                        <ActivityLog activities={editedBug.activityLog} formatDate={safeFormatDate} />
                    )}

                    {/* Comments Section */}
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900">Comments</h3>
                        <BugComments
                            comments={comments}
                            onAddComment={handleAddComment}
                            loading={loading}
                            formatDate={safeFormatDate}
                            teamMembers={teamMembers}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugItemDetails;