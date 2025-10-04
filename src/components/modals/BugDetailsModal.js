'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, User, Paperclip, Clock, CheckCircle, History, Eye, Folder, 
    Terminal, Video, Network, MessageSquare, AlertTriangle, Info,
    Settings, Activity, FileText, Monitor, Bug, Users, TrendingUp, ChevronDown,
    ChevronUp, ExternalLink, Copy,
} from 'lucide-react';
import EditableField from '../bugview/EditableField';
import BugComments from '../bug-report/BugComments';
import AttachmentsList from '../bugview/AttachmentsList';
import ActivityLog from '../bugview/ActivityLog';
import {
    getStatusColor,
    getSeverityColor,
    getPriorityColor,
    formatDate,
    VALID_BUG_STATUSES,
    getPriorityFromSeverity,
} from '../../utils/bugUtils';

const BugDetailsModal = ({ bug, teamMembers, onUpdateBug, onClose }) => {
    const [editedBug, setEditedBug] = useState({ ...bug });
    const [comments, setComments] = useState(bug.comments || []);
    const [editingField, setEditingField] = useState(null);
    const [tempValues, setTempValues] = useState({});
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [collapsedSections, setCollapsedSections] = useState(new Set());
    const [isFullscreen, setIsFullscreen] = useState(false);

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
        if (!onUpdateBug || typeof onUpdateBug !== 'function') {
            console.error('onUpdateBug is not a function');
            return;
        }
        
        try {
            let updateData = { [field]: tempValues[field] };
            
            if (field === 'dueDate' && tempValues[field]) {
                updateData[field] = new Date(tempValues[field]);
            }
            
            if (field === 'tags') {
                updateData[field] = tempValues[field].split(',').map(item => item.trim()).filter(item => item);
            }

            if (field === 'severity') {
                const newPriority = getPriorityFromSeverity(tempValues[field]);
                updateData.priority = newPriority;
            }
            
            const updatedBug = { ...editedBug, ...updateData };
            setEditedBug(updatedBug);
            
            await onUpdateBug(editedBug.id, updateData);
            
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
        if (!onUpdateBug || typeof onUpdateBug !== 'function') return;
        
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
            await onUpdateBug(editedBug.id, { comments: updatedComments });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const toggleSection = (sectionId) => {
        const newCollapsed = new Set(collapsedSections);
        if (newCollapsed.has(sectionId)) {
            newCollapsed.delete(sectionId);
        } else {
            newCollapsed.add(sectionId);
        }
        setCollapsedSections(newCollapsed);
    };

    const copyBugId = () => {
        navigator.clipboard.writeText(editedBug.id);
    };

    // Utility function to safely format device info
    const formatDeviceInfo = (bug) => {
        const browserInfo = bug.browserInfo || 'Unknown';
        let deviceInfo = 'Unknown';
        
        if (bug.deviceInfo) {
            if (typeof bug.deviceInfo === 'string') {
                deviceInfo = bug.deviceInfo.split(',')[0] || 'Unknown';
            } else if (typeof bug.deviceInfo === 'object') {
                deviceInfo = bug.deviceInfo.name || bug.deviceInfo.type || 'Unknown';
            } else {
                deviceInfo = String(bug.deviceInfo);
            }
        }
        
        return `${browserInfo}, ${deviceInfo}`;
    };

    const statusOptions = VALID_BUG_STATUSES.map(status => ({ value: status, label: status }));
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

    const editableFieldProps = () => ({
        editingField,
        tempValues,
        onEdit: handleFieldEdit,
        onSave: handleFieldSave,
        onCancel: handleFieldCancel,
        setTempValues,
        disabled: !onUpdateBug || typeof onUpdateBug !== 'function',
        showEditIcon: true,  // Always show edit icon by default
    });

    const getSeverityIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return <AlertTriangle className="h-4 w-4" />;
            case 'high': return <AlertTriangle className="h-4 w-4" />;
            case 'medium': return <Info className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'details', label: 'Details', icon: Settings },
        { id: 'comments', label: 'Comments', icon: MessageSquare, badge: comments.length },
        { id: 'activity', label: 'Activity', icon: Activity },
    ];

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
                    className={`fixed ${isFullscreen ? 'inset-0' : 'inset-y-0 sm:inset-y-0 right-0'} ${isFullscreen ? 'w-full' : 'w-full sm:w-3/4 sm:max-w-4xl'} bg-background shadow-2xl z-50 overflow-hidden ${isFullscreen ? 'border-0' : 'border-l border-border'}`}
                >
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex-shrink-0 border-b border-border bg-background">
                            <div className="px-4 sm:px-6 py-3 sm:py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <div className={`p-2 rounded-lg ${getSeverityColor(editedBug.severity)} flex items-center justify-center`}>
                                                {getSeverityIcon(editedBug.severity)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <EditableField
                                                    field="title"
                                                    value={editedBug.title || 'Untitled Bug'}
                                                    type="text"
                                                    className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight"
                                                    isTitle={true}
                                                    {...editableFieldProps()}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2 mt-2">
                                                <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                                                    <Bug className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                                    <span className="font-mono bg-muted px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs">
                                                        #{editedBug.id?.slice(-8) || 'N/A'}
                                                    </span>
                                                    <button onClick={copyBugId} className="hover:text-foreground">
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                                    <span>Created {formatDate(editedBug.createdAt) || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                                                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                                    <span className="truncate">{editedBug.reportedBy || editedBug.reportedByEmail?.split('@')[0] || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="hidden sm:block p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Status Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-border gap-3 sm:gap-0">
                                    <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 gap-2 sm:gap-0">
                                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(editedBug.status)}`}>
                                            <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                                            {editedBug.status || 'New'}
                                        </div>
                                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(editedBug.severity)}`}>
                                            {getSeverityIcon(editedBug.severity)}
                                            <span className="ml-1">{editedBug.severity || 'Low'}</span>
                                        </div>
                                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(editedBug.priority)}`}>
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {editedBug.priority || 'Low'} Priority
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
                                        <div className="flex items-center space-x-1">
                                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>{editedBug.viewCount || 0}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>{comments.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="px-4 sm:px-6 border-b border-border">
                                <nav className="flex overflow-x-auto scrollbar-hide space-x-2 sm:space-x-8 pb-2" aria-label="Tabs" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <style jsx>{`
                                        nav::-webkit-scrollbar {
                                            display: none;
                                        }
                                    `}</style>
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex-shrink-0 ${
                                                    activeTab === tab.id
                                                        ? 'border-primary text-primary bg-accent'
                                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                                } whitespace-nowrap flex items-center py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all min-w-max`}
                                            >
                                                <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                                                {tab.label}
                                                {tab.badge > 0 && (
                                                    <span className="ml-1 sm:ml-2 bg-primary/10 text-primary py-0.5 px-1 sm:py-0.5 sm:px-2 rounded-full text-xs">
                                                        {tab.badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 sm:p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Quick Actions */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="status"
                                                    value={editedBug.status || 'New'}
                                                    type="select"
                                                    options={statusOptions}
                                                    className="text-sm font-medium"
                                                    {...editableFieldProps()}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Status</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="assignedTo"
                                                    value={editedBug.assignedTo || 'Unassigned'}
                                                    type="select"
                                                    options={assigneeOptions}
                                                    className="text-sm font-medium"
                                                    {...editableFieldProps()}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Assignee</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <div className="text-sm font-medium text-foreground">
                                                    {editedBug.priority || 'Low'}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Priority (Auto-derived from Severity)</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="environment"
                                                    value={editedBug.environment || 'Unknown'}
                                                    type="select"
                                                    options={environmentOptions}
                                                    className="text-sm font-medium"
                                                    {...editableFieldProps()}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Environment</p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                <h3 className="text-lg font-semibold text-foreground flex items-center">
                                                    <FileText className="h-5 w-5 mr-2 text-primary" />
                                                    Description
                                                </h3>
                                                <button
                                                    onClick={() => toggleSection('description')}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {collapsedSections.has('description') ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {!collapsedSections.has('description') && (
                                                <EditableField
                                                    field="description"
                                                    value={editedBug.description || 'No description provided'}
                                                    type="textarea"
                                                    placeholder="Enter bug description..."
                                                    className="w-full min-h-[100px] text-foreground leading-relaxed"
                                                    {...editableFieldProps()}
                                                />
                                            )}
                                        </div>

                                        {/* Reproduction Steps */}
                                        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                <h3 className="text-lg font-semibold text-foreground flex items-center">
                                                    <Settings className="h-5 w-5 mr-2 text-success" />
                                                    Steps to Reproduce
                                                </h3>
                                                <button
                                                    onClick={() => toggleSection('steps')}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {collapsedSections.has('steps') ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {!collapsedSections.has('steps') && (
                                                <EditableField
                                                    field="stepsToReproduce"
                                                    value={editedBug.stepsToReproduce || 'No steps provided'}
                                                    type="textarea"
                                                    placeholder="List steps to reproduce the bug..."
                                                    className="w-full min-h-[100px] text-foreground leading-relaxed"
                                                    {...editableFieldProps()}
                                                />
                                            )}
                                        </div>

                                        {/* Expected vs Actual Behavior */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <CheckCircle className="h-5 w-5 mr-2 text-success" />
                                                    Expected Behavior
                                                </h3>
                                                <EditableField
                                                    field="expectedBehavior"
                                                    value={editedBug.expectedBehavior || 'No expected behavior provided'}
                                                    type="textarea"
                                                    placeholder="Describe the expected behavior..."
                                                    className="w-full min-h-[80px] text-foreground leading-relaxed"
                                                    {...editableFieldProps()}
                                                />
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                                                    Actual Behavior
                                                </h3>
                                                <EditableField
                                                    field="actualBehavior"
                                                    value={editedBug.actualBehavior || 'No actual behavior provided'}
                                                    type="textarea"
                                                    placeholder="Describe the actual behavior..."
                                                    className="w-full min-h-[80px] text-foreground leading-relaxed"
                                                    {...editableFieldProps()}
                                                />
                                            </div>
                                        </div>

                                        {/* Evidence */}
                                        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                            <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                <Paperclip className="h-5 w-5 mr-2 text-primary/70" />
                                                Evidence & Attachments
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                                {editedBug.hasVideoEvidence && (
                                                    <div className="flex items-center p-3 bg-accent rounded-lg border border-accent/30">
                                                        <Video className="h-5 w-5 mr-3 text-primary/70" />
                                                        <span className="text-sm font-medium text-foreground">Video Evidence</span>
                                                    </div>
                                                )}
                                                {editedBug.hasNetworkLogs && (
                                                    <div className="flex items-center p-3 bg-warning/10 rounded-lg border border-warning/30">
                                                        <Network className="h-5 w-5 mr-3 text-warning/70" />
                                                        <span className="text-sm font-medium text-foreground">Network Logs</span>
                                                    </div>
                                                )}
                                                {editedBug.hasConsoleLogs && (
                                                    <div className="flex items-center p-3 bg-success/10 rounded-lg border border-success/30">
                                                        <Terminal className="h-5 w-5 mr-3 text-success/70" />
                                                        <span className="text-sm font-medium text-foreground">Console Logs</span>
                                                    </div>
                                                )}
                                            </div>
                                            {editedBug.attachments?.length > 0 && (
                                                <div className="mt-4">
                                                    <AttachmentsList attachments={editedBug.attachments} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'details' && (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Technical Details */}
                                        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                            <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                <Monitor className="h-5 w-5 mr-2 text-primary" />
                                                Technical Information
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Category</label>
                                                    <EditableField
                                                        field="category"
                                                        value={editedBug.category || 'Other'}
                                                        type="select"
                                                        options={categoryOptions}
                                                        className="text-sm w-full"
                                                        {...editableFieldProps()}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Source</label>
                                                    <EditableField
                                                        field="source"
                                                        value={editedBug.source || 'Unknown'}
                                                        type="select"
                                                        options={sourceOptions}
                                                        className="text-sm w-full"
                                                        {...editableFieldProps()}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Frequency</label>
                                                    <EditableField
                                                        field="frequency"
                                                        value={editedBug.frequency || 'Unknown'}
                                                        type="text"
                                                        className="text-sm w-full"
                                                        {...editableFieldProps()}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Device/Browser</label>
                                                    <EditableField
                                                        field="deviceInfo"
                                                        value={formatDeviceInfo(editedBug)}
                                                        type="text"
                                                        className="text-sm w-full"
                                                        {...editableFieldProps()}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Tags</label>
                                                    <EditableField
                                                        field="tags"
                                                        value={Array.isArray(editedBug.tags) ? editedBug.tags.join(', ') : 'None'}
                                                        type="text"
                                                        placeholder="Enter tags (comma-separated)"
                                                        className="text-sm w-full"
                                                        {...editableFieldProps()}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Version</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border">
                                                        {editedBug.version || '1'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Workflow Information */}
                                        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                            <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                <Users className="h-5 w-5 mr-2 text-success" />
                                                Workflow Information
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Created By</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border flex items-center">
                                                        <User className="h-4 w-4 mr-2" />
                                                        {editedBug.created_by || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Updated By</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border flex items-center">
                                                        <User className="h-4 w-4 mr-2" />
                                                        {editedBug.updatedByName || editedBug.updated_by || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Last Updated</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border flex items-center">
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        {formatDate(editedBug.updated_at) || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Suite ID</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border flex items-center">
                                                        <Folder className="h-4 w-4 mr-2" />
                                                        {editedBug.suite_id || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Resolved By</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border flex items-center">
                                                        <User className="h-4 w-4 mr-2" />
                                                        {editedBug.resolvedByName || editedBug.resolvedBy || 'Not resolved'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Resolved At</label>
                                                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded border border-border flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        {editedBug.resolvedAt ? formatDate(editedBug.resolvedAt) : 'Not resolved'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Resolution & Workaround */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <CheckCircle className="h-5 w-5 mr-2 text-success" />
                                                    Resolution
                                                </h3>
                                                <EditableField
                                                    field="resolution"
                                                    value={editedBug.resolution || 'Not resolved'}
                                                    type="textarea"
                                                    placeholder="Describe the resolution..."
                                                    className="w-full min-h-[100px] text-foreground leading-relaxed"
                                                    {...editableFieldProps()}
                                                />
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <Settings className="h-5 w-5 mr-2 text-primary" />
                                                    Workaround
                                                </h3>
                                                <EditableField
                                                    field="workaround"
                                                    value={editedBug.workaround || 'No workaround provided'}
                                                    type="textarea"
                                                    placeholder="Describe any workarounds..."
                                                    className="w-full min-h-[100px] text-foreground leading-relaxed"
                                                    {...editableFieldProps()}
                                                />
                                            </div>
                                        </div>

                                        {/* Resolution History */}
                                        {editedBug.resolutionHistory?.length > 0 && (
                                            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-theme-sm">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <History className="h-5 w-5 mr-2 text-muted-foreground" />
                                                    Resolution History
                                                </h3>
                                                <div className="space-y-3">
                                                    {editedBug.resolutionHistory.map((entry, index) => (
                                                        <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                                            <CheckCircle className="h-5 w-5 mt-0.5 text-success flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-foreground">{entry.resolution || 'Resolution updated'}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    by {entry.resolvedByName || entry.resolvedBy || 'Unknown'} on {formatDate(entry.resolvedAt) || 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Comments Section */}
                                        <div className="bg-card border border-border rounded-lg shadow-theme-sm">
                                            <div className="p-4 sm:p-6">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                                                    Comments & Discussion
                                                    <span className="ml-2 bg-primary/10 text-primary py-1 px-2 rounded-full text-xs">
                                                        {comments.length}
                                                    </span>
                                                </h3>
                                                <BugComments
                                                    comments={comments}
                                                    onAddComment={handleAddComment}
                                                    formatDate={formatDate}
                                                    teamMembers={teamMembers}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Activity Log Section */}
                                        <div className="bg-card border border-border rounded-lg shadow-theme-sm">
                                            <div className="p-4 sm:p-6">
                                                <h3 className="text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                                                    <Activity className="h-5 w-5 mr-2 text-success" />
                                                    Activity Log
                                                </h3>
                                                {editedBug.activities?.length > 0 ? (
                                                    <ActivityLog activities={editedBug.activities} formatDate={formatDate} />
                                                ) : (
                                                    <div className="text-center py-12">
                                                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                        <p className="text-muted-foreground">No activity recorded yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
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