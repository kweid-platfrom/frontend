'use client';

import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useSuite } from '../../contexts/SuiteContext';
import { useApp } from '../../contexts/AppProvider';
import BugComments from "../bug-report/BugComments";
import EditableField from "../bugview/EditableField";
import AttachmentsList from "../bugview/AttachmentsList";
import ActivityLog from "../bugview/ActivityLog";
import { 
    Calendar, User, Flag, AlertCircle, 
    Paperclip, X
} from "lucide-react";

const BugDetailsPanel = ({ 
    bug, 
    teamMembers, 
    sprints, 
    onUpdateBug, 
    formatDate,
    onClose,
    permissions, // Now received from parent - no need to check auth here
}) => {
    const [editedBug, setEditedBug] = useState({ ...bug });
    const [comments, setComments] = useState(bug.messages || []);
    const [loading, setLoading] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [tempValues, setTempValues] = useState({});

    const { activeSuite } = useSuite();
    const { user, addNotification } = useApp();

    const defaultFormatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        try {
            let date;
            if (timestamp?.toDate) {
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

    const safeFormatDate = formatDate && typeof formatDate === 'function' ? formatDate : defaultFormatDate;

    // Real-time updates - simplified without redundant auth checks
    useEffect(() => {
        if (!activeSuite?.suite_id || !bug.id) return;

        const bugRef = doc(db, 'testSuites', activeSuite.suite_id, 'bugs', bug.id);
        
        const unsubscribe = onSnapshot(bugRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const bugData = docSnapshot.data();
                setEditedBug({ id: docSnapshot.id, ...bugData });
                setComments(bugData.messages || []);
            }
        }, (error) => {
            console.error("Error listening to bug updates:", error);
            addNotification({
                type: 'error',
                title: 'Error Loading Bug',
                message: 'Failed to load real-time updates'
            });
        });

        return () => unsubscribe();
    }, [bug.id, activeSuite?.suite_id, addNotification]);

    // Sync with parent bug updates
    useEffect(() => {
        setEditedBug({ ...bug });
        setComments(bug.messages || []);
    }, [bug]);

    const handleFieldEdit = (field, value) => {
        if (!permissions.canUpdateBugs) {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You do not have permission to edit bugs'
            });
            return;
        }
        setEditingField(field);
        setTempValues({ ...tempValues, [field]: value });
    };

    const handleFieldSave = async (field) => {
        if (!permissions.canUpdateBugs) {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You do not have permission to edit bugs'
            });
            return;
        }

        try {
            setLoading(true);
            const bugRef = doc(db, 'testSuites', activeSuite.suite_id, 'bugs', bug.id);
            
            let updateData = { [field]: tempValues[field] };
            
            if (field === 'dueDate' && tempValues[field]) {
                updateData[field] = new Date(tempValues[field]);
            }

            await updateDoc(bugRef, {
                ...updateData,
                updatedAt: serverTimestamp()
            });

            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: `updated ${field}`,
                    user: user?.displayName || user?.email || user?.uid,
                    createdAt: serverTimestamp()
                })
            });

            // Update parent component
            if (onUpdateBug) {
                onUpdateBug({ ...editedBug, ...updateData });
            }
            
            addNotification({
                type: 'success',
                title: 'Bug Updated',
                message: `${field} updated successfully`
            });
            setEditingField(null);
            setTempValues({});
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            addNotification({
                type: 'error',
                title: 'Update Failed',
                message: `Error updating ${field}: ${error.message}`
            });
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

        if (!permissions.canUpdateBugs) {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You do not have permission to add comments'
            });
            return;
        }

        setLoading(true);
        const newMessage = {
            text: commentText,
            user: user?.displayName || user?.email || user?.uid,
            createdAt: serverTimestamp(),
            attachments: attachments,
            id: Date.now().toString()
        };

        try {
            const bugRef = doc(db, 'testSuites', activeSuite.suite_id, 'bugs', bug.id);
            
            await updateDoc(bugRef, {
                messages: arrayUnion(newMessage)
            });

            await updateDoc(bugRef, {
                activityLog: arrayUnion({
                    action: "commented",
                    user: user?.displayName || user?.email || user?.uid,
                    createdAt: serverTimestamp()
                })
            });
            
            addNotification({
                type: 'success',
                title: 'Comment Added',
                message: 'Comment added successfully'
            });
        } catch (error) {
            console.error("Error sending message:", error);
            addNotification({
                type: 'error',
                title: 'Comment Failed',
                message: `Error sending message: ${error.message}`
            });
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
        value: member.id || member.uid,
        label: member.name || member.email || member.displayName
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
        setTempValues,
        disabled: !permissions.canUpdateBugs
    };

    return (
        <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3 min-w-0">
                        <div className="pr-4 font-semibold text-2xl">
                            <EditableField
                                field="title"
                                value={editedBug.title}
                                type="text"
                                className="text-2xl font-semibold text-gray-900 leading-tight"
                                placeholder="Bug title..."
                                {...editableFieldProps}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-teal-800">
                                    Bug #{editedBug.id?.slice(-6)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Created {safeFormatDate(editedBug.createdAt)}
                                </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                                <User className="h-3 w-3 mr-1" />
                                <span>Reporter: {editedBug.reporter}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
                            aria-label="Close bug details"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
                <div className="px-6 py-6 space-y-8">
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center">
                            Description
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <EditableField
                                field="description"
                                value={editedBug.description}
                                type="textarea"
                                placeholder="Enter bug description..."
                                {...editableFieldProps}
                            />
                        </div>
                    </div>
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
                                        placeholder="e.g., Production, Staging..."
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900">Steps to Reproduce</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <EditableField
                                field="stepsToReproduce"
                                value={editedBug.stepsToReproduce}
                                type="textarea"
                                placeholder="1. Step one\n2. Step two\n3. Step three..."
                                {...editableFieldProps}
                            />
                        </div>
                    </div>
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
                                        placeholder="What should have happened..."
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
                                        placeholder="What actually happened..."
                                        {...editableFieldProps}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {editedBug.attachments && editedBug.attachments.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Attachments ({editedBug.attachments.length})
                            </h3>
                            <AttachmentsList attachments={editedBug.attachments} />
                        </div>
                    )}
                    {editedBug.activityLog && editedBug.activityLog.length > 0 && (
                        <ActivityLog activities={editedBug.activityLog} formatDate={safeFormatDate} />
                    )}
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-gray-900">Comments</h3>
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                <div className="px-6">
                    <BugComments
                        comments={comments}
                        onAddComment={handleAddComment}
                        loading={loading}
                        formatDate={safeFormatDate}
                        teamMembers={teamMembers}
                        disabled={!permissions.canUpdateBugs}
                    />
                </div>
            </div>
        </div>
    );
};

export default BugDetailsPanel;