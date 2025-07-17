'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Paperclip, Tag, Clock, CheckCircle, History, Eye, Folder, Terminal, Video, Network, MessageSquare, Smartphone } from 'lucide-react';
import EditableField from '../bugview/EditableField';
import BugComments from '../bug-report/BugComments';
import AttachmentsList from '../bugview/AttachmentsList';
import ActivityLog from '../bugview/ActivityLog';
import {
    getStatusColor,
    getSeverityColor,
    getPriorityColor,
    getFrequencyColor,
    getSourceColor,
    formatDate,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES,
} from '../../utils/bugUtils';

const BugDetailsModal = ({ bug, teamMembers, onUpdateBug, onClose }) => {
    const [editedBug, setEditedBug] = useState({ ...bug });
    const [comments, setComments] = useState(bug.comments || []);
    const [editingField, setEditingField] = useState(null);
    const [tempValues, setTempValues] = useState({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        setEditedBug({ ...bug });
        setComments(bug.comments || []);
    }, [bug]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);

    const handleFieldEdit = (field, value) => {
        setEditingField(field);
        setTempValues({ ...tempValues, [field]: value });
    };

    const handleFieldSave = async (field) => {
        if (!onUpdateBug) return;
        try {
            let updateData = { [field]: tempValues[field] };
            if (field === 'dueDate' && tempValues[field]) {
                updateData[field] = new Date(tempValues[field]);
            }
            if (field === 'tags') {
                updateData[field] = tempValues[field].split(',').map(item => item.trim()).filter(item => item);
            }
            const updatedBug = { ...editedBug, ...updateData };
            setEditedBug(updatedBug);
            await onUpdateBug(updatedBug);
            setEditingField(null);
            setTempValues({});
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    const handleFieldCancel = () => {
        setEditingField(null);
        setTempValues({});
    };

    const handleAddComment = async (commentText, attachments = []) => {
        if (!commentText.trim() && attachments.length === 0) return;
        if (!onUpdateBug) return;
        try {
            const newComment = {
                text: commentText,
                user: bug.reportedByEmail || 'Unknown',
                createdAt: new Date(),
                attachments,
                id: Date.now().toString(),
            };
            const updatedComments = [...comments, newComment];
            setComments(updatedComments);
            await onUpdateBug({ ...editedBug, comments: updatedComments });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const statusOptions = VALID_BUG_STATUSES.map(status => ({ value: status, label: status }));
    const severityOptions = VALID_BUG_SEVERITIES.map(severity => ({ value: severity, label: severity }));
    const priorityOptions = ['low', 'medium', 'high', 'critical'].map(priority => ({
        value: priority,
        label: priority.charAt(0).toUpperCase() + priority.slice(1),
    }));
    const assigneeOptions = teamMembers?.map(member => ({
        value: member.id || member.email,
        label: member.name || member.email?.split('@')[0] || 'Unknown',
    })) || [];
    const environmentOptions = ['production', 'staging', 'development', 'testing'].map(env => ({
        value: env,
        label: env.charAt(0).toUpperCase() + env.slice(1),
    }));
    const sourceOptions = ['manual', 'automated', 'external'].map(source => ({
        value: source,
        label: source.charAt(0).toUpperCase() + source.slice(1),
    }));
    const categoryOptions = ['UI', 'Functionality', 'Performance', 'Security', 'Compatibility', 'Other'].map(category => ({
        value: category,
        label: category,
    }));

    const editableFieldProps = (isSelect = false) => ({
        editingField,
        tempValues,
        onEdit: handleFieldEdit,
        onSave: handleFieldSave,
        onCancel: handleFieldCancel,
        setTempValues,
        disabled: !onUpdateBug,
        showEditIcon: !isSelect, // Only show edit icon for non-select fields
    });

    if (!mounted || !bug) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {mounted && (
                <motion.div
                    key={`modal-${bug.id}`}
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 right-0 w-1/2 bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200"
                >
                    <div className="flex flex-col h-full p-6">
                        <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <EditableField
                                        field="title"
                                        value={editedBug.title || 'Untitled Bug'}
                                        type="text"
                                        className="text-3xl font-bold text-gray-900 mb-2 leading-tight"
                                        {...editableFieldProps()}
                                    />
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                        <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full">
                                            Bug #{editedBug.id?.slice(-6) || 'N/A'}
                                        </span>
                                        <span className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            Created {formatDate(editedBug.createdAt) || 'Unknown'}
                                        </span>
                                        <span className="flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            Reporter: {editedBug.reportedBy || editedBug.reportedByEmail?.split('@')[0] || 'Unknown'}
                                        </span>
                                        <span className="flex items-center">
                                            <Eye className="h-4 w-4 mr-1" />
                                            Views: {editedBug.viewCount || 0}
                                        </span>
                                        <span className="flex items-center">
                                            <MessageSquare className="h-4 w-4 mr-1" />
                                            {editedBug.commentCount || 0} Comment{editedBug.commentCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-full"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                                <EditableField
                                    field="description"
                                    value={editedBug.description || 'No description provided'}
                                    type="textarea"
                                    placeholder="Enter bug description..."
                                    className="bg-gray-50 rounded-md p-3 text-sm w-full"
                                    {...editableFieldProps()}
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Actual Behavior</h3>
                                <EditableField
                                    field="actualBehavior"
                                    value={editedBug.actualBehavior || 'No actual behavior provided'}
                                    type="textarea"
                                    placeholder="Describe the actual behavior..."
                                    className="bg-gray-50 rounded-md p-3 text-sm w-full"
                                    {...editableFieldProps()}
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Steps to Reproduce</h3>
                                <EditableField
                                    field="stepsToReproduce"
                                    value={editedBug.stepsToReproduce || 'No steps provided'}
                                    type="textarea"
                                    placeholder="List steps to reproduce the bug..."
                                    className="bg-gray-50 rounded-md p-3 text-sm w-full"
                                    {...editableFieldProps()}
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Expected Behavior</h3>
                                <EditableField
                                    field="expectedBehavior"
                                    value={editedBug.expectedBehavior || 'No expected behavior provided'}
                                    type="textarea"
                                    placeholder="Describe the expected behavior..."
                                    className="bg-gray-50 rounded-md p-3 text-sm w-full"
                                    {...editableFieldProps()}
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Workaround</h3>
                                <EditableField
                                    field="workaround"
                                    value={editedBug.workaround || 'No workaround provided'}
                                    type="textarea"
                                    placeholder="Describe any workarounds..."
                                    className="bg-gray-50 rounded-md p-3 text-sm w-full"
                                    {...editableFieldProps()}
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Resolution</h3>
                                <EditableField
                                    field="resolution"
                                    value={editedBug.resolution || 'Not resolved'}
                                    type="textarea"
                                    placeholder="Describe the resolution..."
                                    className="bg-gray-50 rounded-md p-3 text-sm w-full"
                                    {...editableFieldProps()}
                                />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Details</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                                        <EditableField
                                            field="status"
                                            value={editedBug.status || 'New'}
                                            type="select"
                                            options={statusOptions}
                                            className={`text-sm rounded ${getStatusColor(editedBug.status)} w-full`}
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Severity</h4>
                                        <EditableField
                                            field="severity"
                                            value={editedBug.severity || 'Low'}
                                            type="select"
                                            options={severityOptions}
                                            className={`text-sm rounded ${getSeverityColor(editedBug.severity)} w-full`}
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Priority</h4>
                                        <EditableField
                                            field="priority"
                                            value={editedBug.priority || 'Low'}
                                            type="select"
                                            options={priorityOptions}
                                            className={`text-sm rounded ${getPriorityColor(editedBug.priority)} w-full`}
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Assignee</h4>
                                        <EditableField
                                            field="assignedTo"
                                            value={editedBug.assignedTo || 'Unassigned'}
                                            type="select"
                                            options={assigneeOptions}
                                            className="text-sm rounded w-full"
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Category</h4>
                                        <EditableField
                                            field="category"
                                            value={editedBug.category || 'Other'}
                                            type="select"
                                            options={categoryOptions}
                                            className="text-sm rounded w-full"
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Environment</h4>
                                        <EditableField
                                            field="environment"
                                            value={editedBug.environment || 'Unknown'}
                                            type="select"
                                            options={environmentOptions}
                                            className="text-sm rounded w-full"
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Source</h4>
                                        <EditableField
                                            field="source"
                                            value={editedBug.source || 'Unknown'}
                                            type="select"
                                            options={sourceOptions}
                                            className={`text-sm rounded ${getSourceColor(editedBug.source)} w-full`}
                                            {...editableFieldProps(true)}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Suite ID</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Folder className="h-4 w-4 mr-1" />
                                            {editedBug.suite_id || 'Unknown'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Created By</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            {editedBug.created_by || 'Unknown'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Updated By</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            {editedBug.updatedByName || editedBug.updated_by || 'Unknown'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Last Updated</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {formatDate(editedBug.updated_at) || 'Unknown'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Last Activity</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {formatDate(editedBug.lastActivity) || 'Unknown'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Version</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <History className="h-4 w-4 mr-1" />
                                            {editedBug.version || '1'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Resolved By</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            {editedBug.resolvedByName || editedBug.resolvedBy || 'Not resolved'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Resolved At</h4>
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {editedBug.resolvedAt ? formatDate(editedBug.resolvedAt) : 'Not resolved'}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Frequency</h4>
                                        <EditableField
                                            field="frequency"
                                            value={editedBug.frequency || 'Unknown'}
                                            type="text"
                                            icon={Clock}
                                            className={`text-sm rounded ${getFrequencyColor(editedBug.frequency)} w-full`}
                                            {...editableFieldProps()}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Tags</h4>
                                        <EditableField
                                            field="tags"
                                            value={Array.isArray(editedBug.tags) ? editedBug.tags.join(', ') : 'None'}
                                            type="text"
                                            icon={Tag}
                                            placeholder="Enter tags (comma-separated)"
                                            className="text-sm rounded w-full"
                                            {...editableFieldProps()}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Device/Browser</h4>
                                        <EditableField
                                            field="deviceInfo"
                                            value={
                                                editedBug.browserInfo || editedBug.deviceInfo
                                                    ? `${editedBug.browserInfo || 'Unknown'}, ${editedBug.deviceInfo?.split(',')[0] || 'Unknown'}`
                                                    : 'Unknown'
                                            }
                                            type="text"
                                            icon={Smartphone}
                                            className="text-sm rounded w-full"
                                            {...editableFieldProps()}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    Attachments
                                </h3>
                                <div className="bg-gray-50 rounded-md p-3 text-sm w-full flex items-center justify-center">
                                    {editedBug.attachments?.length > 0 ? (
                                        <AttachmentsList attachments={editedBug.attachments} />
                                    ) : (
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Paperclip className="h-4 w-4 mr-1 text-gray-400" />
                                            No attachments available
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    Evidence
                                </h3>
                                <div className="bg-gray-50 rounded-md p-3 text-sm w-full flex items-center justify-center">
                                    {editedBug.attachments?.length > 0 || editedBug.hasVideoEvidence || editedBug.hasNetworkLogs || editedBug.hasConsoleLogs ? (
                                        <div className="space-y-2 w-full">
                                            {editedBug.attachments?.length > 0 && (
                                                <AttachmentsList attachments={editedBug.attachments} />
                                            )}
                                            {editedBug.hasVideoEvidence && (
                                                <p className="text-sm text-gray-600 flex items-center">
                                                    <Video className="h-4 w-4 mr-1 text-purple-600" />
                                                    Video Evidence Available
                                                </p>
                                            )}
                                            {editedBug.hasNetworkLogs && (
                                                <p className="text-sm text-gray-600 flex items-center">
                                                    <Network className="h-4 w-4 mr-1 text-orange-600" />
                                                    Network Logs Available
                                                </p>
                                            )}
                                            {editedBug.hasConsoleLogs && (
                                                <p className="text-sm text-gray-600 flex items-center">
                                                    <Terminal className="h-4 w-4 mr-1 text-green-600" />
                                                    Console Logs Available
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Paperclip className="h-4 w-4 mr-1 text-gray-400" />
                                            No evidence available
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editedBug.resolutionHistory?.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                                        <History className="h-4 w-4 mr-1" />
                                        Resolution History
                                    </h3>
                                    <div className="space-y-2">
                                        {editedBug.resolutionHistory.map((entry, index) => (
                                            <div key={index} className="text-sm text-gray-600 flex items-center">
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                {entry.resolution || 'Resolution updated'} by {entry.resolvedByName || entry.resolvedBy || 'Unknown'} on {formatDate(entry.resolvedAt) || 'Unknown'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {editedBug.activities?.length > 0 && (
                                <ActivityLog activities={editedBug.activities} formatDate={formatDate} />
                            )}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Comments</h3>
                                <BugComments
                                    comments={comments}
                                    onAddComment={handleAddComment}
                                    formatDate={formatDate}
                                    teamMembers={teamMembers}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BugDetailsModal;