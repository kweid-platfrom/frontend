// components/TestCaseSideModal.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, AlertTriangle, Clock, Copy, FileText, Info, ListOrdered,
    Settings, Tag, TrendingUp, User, MessageSquare, Activity, ExternalLink,
    Plus, Trash2, Eye, ChevronDown, ChevronUp, Share2, Check, Play
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import EditableField from './EditableField';
import TestCaseComments from './TestCaseComments';
import TestCaseRunHistory from './TestCaseRunHistory';

// TestCaseActivityLog component defined inline
const TestCaseActivityLog = ({ activities, formatDate }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No activity recorded yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                    <Activity className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            by {activity.user} on {formatDate(activity.timestamp) || 'Unknown'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TestCaseSideModal = ({ isOpen, testCase, onUpdateTestCase, onClose, currentUser }) => {
    // ✅ Get sprints from global state using useApp (like BugDetailsModal)
    const { state } = useApp();
    const globalSprints = state?.sprints?.sprints || [];

    // ✅ Ensure arrays at the top level
    const safeSprints = Array.isArray(globalSprints) ? globalSprints : [];

    const [formData, setFormData] = useState({});
    const [activities, setActivities] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState(new Set());

    // ✅ Add editing state (like BugDetailsModal)
    const [editingField, setEditingField] = useState(null);
    const [tempValues, setTempValues] = useState({});

    // Share functionality state
    const [shareTooltip, setShareTooltip] = useState('Copy link');
    const [showShareSuccess, setShowShareSuccess] = useState(false);

    const formatDate = useCallback((date) => {
        if (!date) return 'Unknown';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-success text-success-foreground',
            active: 'bg-primary text-primary-foreground',
            archived: 'bg-muted text-muted-foreground',
            deprecated: 'bg-destructive text-destructive-foreground',
        };
        return colors[status] || 'bg-muted text-muted-foreground';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-success text-success-foreground',
            medium: 'bg-warning text-warning-foreground',
            high: 'bg-destructive text-destructive-foreground',
        };
        return colors[priority] || 'bg-muted text-muted-foreground';
    };

    const getSeverityColor = (severity) => {
        const colors = {
            low: 'bg-success text-success-foreground',
            medium: 'bg-warning text-warning-foreground',
            high: 'bg-destructive text-destructive-foreground',
            critical: 'bg-destructive text-destructive-foreground',
        };
        return colors[severity] || 'bg-muted text-muted-foreground';
    };

    const getExecutionColor = (status) => {
        const colors = {
            not_executed: 'bg-muted text-muted-foreground',
            passed: 'bg-success text-success-foreground',
            failed: 'bg-destructive text-destructive-foreground',
            skipped: 'bg-warning text-warning-foreground',
        };
        return colors[status] || 'bg-muted text-muted-foreground';
    };

    const getSeverityIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
            case 'high': return <AlertTriangle className="h-4 w-4" />;
            case 'medium':
            default: return <Info className="h-4 w-4" />;
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

    // ✅ Share functionality (like BugDetailsModal)
    const handleShareTestCase = useCallback(async () => {
        try {
            const testCaseUrl = `${window.location.origin}/testcases?id=${testCase?.id}`;
            await navigator.clipboard.writeText(testCaseUrl);

            setShareTooltip('Link copied!');
            setShowShareSuccess(true);

            setTimeout(() => {
                setShareTooltip('Copy link');
                setShowShareSuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            setShareTooltip('Failed to copy');
            setTimeout(() => {
                setShareTooltip('Copy link');
            }, 2000);
        }
    }, [testCase?.id]);

    // Initialize form data and activities when testCase changes
    useEffect(() => {
        if (testCase) {
            const data = {
                title: testCase.title || '',
                description: testCase.description || '',
                preconditions: testCase.preconditions || '',
                steps: testCase.steps && testCase.steps.length > 0
                    ? testCase.steps
                    : [{ action: '', expectedResult: '' }],
                priority: testCase.priority || 'medium',
                severity: testCase.severity || 'medium',
                status: testCase.status || 'draft',
                assignee: testCase.assignee || '',
                component: testCase.component || '',
                testType: testCase.testType || 'functional',
                environment: testCase.environment || 'testing',
                estimatedTime: testCase.estimatedTime || '',
                tags: testCase.tags || [],
                executionStatus: testCase.executionStatus || 'not_executed',
                comments: testCase.comments || [],
                sprint_id: testCase.sprint_id || testCase.sprintId || '', // ✅ Add sprint support
            };
            setFormData(data);
            setActivities(testCase.activities || []);
        }
    }, [testCase]);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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

    // ✅ Field edit handlers (like BugDetailsModal)
    const handleFieldEdit = (field, value) => {
        setEditingField(field);
        setTempValues({ ...tempValues, [field]: value });
    };

    const handleFieldSave = useCallback(async (field) => {
        if (!onUpdateTestCase || typeof onUpdateTestCase !== 'function') {
            console.error('onUpdateTestCase is not a function');
            return;
        }

        try {
            // ✅ Log sprint reassignment
            if (field === 'sprint_id') {
                console.log('🔄 Test case sprint reassignment:', {
                    testCaseId: testCase.id,
                    oldSprint: formData.sprint_id,
                    newSprint: tempValues[field],
                    sprintName: safeSprints.find(s => s.id === tempValues[field])?.name
                });
            }

            const newFormData = {
                ...formData,
                [field]: tempValues[field]
            };
            setFormData(newFormData);

            // Instant update
            await onUpdateTestCase({ ...testCase, ...newFormData });

            // Capture activity with proper user info
            const newActivity = {
                action: `Updated ${field}: ${tempValues[field]}`,
                user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
                timestamp: new Date().toISOString(),
            };
            setActivities(prev => [...prev, newActivity]);

            setEditingField(null);
            setTempValues({});
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    }, [formData, testCase, onUpdateTestCase, currentUser, tempValues, safeSprints]);

    const handleStepChange = useCallback(async (index, stepField, value) => {
        const newSteps = formData.steps.map((step, i) =>
            i === index ? { ...step, [stepField]: value } : step
        );
        const newFormData = { ...formData, steps: newSteps };
        setFormData(newFormData);

        // Instant update
        if (onUpdateTestCase) {
            await onUpdateTestCase({ ...testCase, ...newFormData });
        }

        // Capture activity with proper user info
        const newActivity = {
            action: `Updated step ${index + 1} ${stepField}`,
            user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
            timestamp: new Date().toISOString(),
        };
        setActivities(prev => [...prev, newActivity]);
    }, [formData, testCase, onUpdateTestCase, currentUser]);

    const addStep = useCallback(async () => {
        const newSteps = [...formData.steps, { action: '', expectedResult: '' }];
        const newFormData = { ...formData, steps: newSteps };
        setFormData(newFormData);

        // Instant update
        if (onUpdateTestCase) {
            await onUpdateTestCase({ ...testCase, ...newFormData });
        }

        // Capture activity with proper user info
        const newActivity = {
            action: 'Added new test step',
            user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
            timestamp: new Date().toISOString(),
        };
        setActivities(prev => [...prev, newActivity]);
    }, [formData, testCase, onUpdateTestCase, currentUser]);

    const removeStep = useCallback(async (index) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        const newFormData = { ...formData, steps: newSteps };
        setFormData(newFormData);

        // Instant update
        if (onUpdateTestCase) {
            await onUpdateTestCase({ ...testCase, ...newFormData });
        }

        // Capture activity with proper user info
        const newActivity = {
            action: `Removed test step ${index + 1}`,
            user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
            timestamp: new Date().toISOString(),
        };
        setActivities(prev => [...prev, newActivity]);
    }, [formData, testCase, onUpdateTestCase, currentUser]);

    const handleTagsChange = useCallback(async (value) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const newFormData = { ...formData, tags };
        setFormData(newFormData);

        // Instant update
        if (onUpdateTestCase) {
            await onUpdateTestCase({ ...testCase, ...newFormData });
        }

        // Capture activity with proper user info
        const newActivity = {
            action: `Updated tags: ${tags.join(', ') || 'No tags'}`,
            user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
            timestamp: new Date().toISOString(),
        };
        setActivities(prev => [...prev, newActivity]);
    }, [formData, testCase, onUpdateTestCase, currentUser]);

    const handleAddComment = useCallback(async (commentText, attachments = []) => {
        const newComment = {
            text: commentText,
            user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
            createdAt: new Date().toISOString(),
            attachments: attachments.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
            })),
            id: Date.now().toString(),
        };
        const newComments = [...(formData.comments || []), newComment];
        const newFormData = { ...formData, comments: newComments };
        setFormData(newFormData);

        // Instant update
        if (onUpdateTestCase) {
            await onUpdateTestCase({ ...testCase, ...newFormData });
        }

        // Capture activity with proper user info
        const newActivity = {
            action: 'Added new comment',
            user: currentUser?.displayName || currentUser?.email || currentUser?.name || 'Current User',
            timestamp: new Date().toISOString(),
        };
        setActivities(prev => [...prev, newActivity]);
    }, [formData, testCase, onUpdateTestCase, currentUser]);

    // ✅ Sprint options (like BugDetailsModal)
    const sprintOptions = safeSprints.map(sprint => ({
        value: sprint.id,
        label: `${sprint.name}${sprint.status ? ` (${sprint.status})` : ''}`,
    }));

    if (!mounted || !isOpen) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'details', label: 'Details', icon: Settings },
        { id: 'runs', label: 'Test Runs', icon: Play },
        { id: 'comments', label: 'Comments', icon: MessageSquare, badge: formData.comments?.length || 0 },
        { id: 'activity', label: 'Activity', icon: Activity, badge: activities.length },
    ];

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="testcase-sidebar"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`fixed inset-y-0 right-0 ${isFullscreen ? 'w-full' : 'w-3/4 max-w-4xl'} bg-background shadow-2xl z-50 overflow-hidden border-l border-border`}
                >
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex-shrink-0 border-b border-border bg-background">
                            <div className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                            <div className={`p-2.5 rounded-lg ${getSeverityColor(formData.severity)} flex items-center justify-center`}>
                                                {getSeverityIcon(formData.severity)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3">
                                                <EditableField
                                                    field="title"
                                                    value={formData.title || ''}
                                                    type="text"
                                                    placeholder="Test Case Title"
                                                    className="text-2xl md:text-3xl font-bold text-foreground leading-tight"
                                                    onSave={handleFieldSave}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                                        #{testCase?.id?.slice(-8) || 'N/A'}
                                                    </span>
                                                    {testCase?.id && (
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(testCase.id)}
                                                            className="hover:text-foreground"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {testCase?.createdAt && (
                                                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Created {formatDate(testCase.createdAt)}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                    <User className="h-4 w-4" />
                                                    <span>{formData.assignee || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* ✅ Share Button (like BugDetailsModal) */}
                                        <div className="relative group">
                                            <button
                                                onClick={handleShareTestCase}
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                                title={shareTooltip}
                                            >
                                                {showShareSuccess ? (
                                                    <Check className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <Share2 className="h-5 w-5" />
                                                )}
                                            </button>
                                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                                {shareTooltip}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
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
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                    <div className="flex items-center space-x-4">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                                            <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                                            {formData.status?.charAt(0).toUpperCase() + formData.status?.slice(1) || 'Draft'}
                                        </div>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(formData.severity)}`}>
                                            {getSeverityIcon(formData.severity)}
                                            <span className="ml-1">{formData.severity?.charAt(0).toUpperCase() + formData.severity?.slice(1) || 'Medium'}</span>
                                        </div>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {formData.priority?.charAt(0).toUpperCase() + formData.priority?.slice(1) || 'Medium'} Priority
                                        </div>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getExecutionColor(formData.executionStatus)}`}>
                                            {formData.executionStatus?.replace('_', ' ').charAt(0).toUpperCase() + formData.executionStatus?.replace('_', ' ').slice(1) || 'Not Executed'}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <div className="flex items-center space-x-1">
                                            <Eye className="h-4 w-4" />
                                            <span>{testCase?.viewCount || 0}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{formData.comments?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="px-6 border-b border-border">
                                <nav className="flex space-x-8" aria-label="Tabs">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`${activeTab === tab.id
                                                        ? 'border-primary text-primary bg-accent'
                                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                                    } whitespace-nowrap flex items-center py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all`}
                                            >
                                                <Icon className="h-4 w-4 mr-2" />
                                                {tab.label}
                                                {tab.badge > 0 && (
                                                    <span className="ml-2 bg-primary/10 text-primary py-0.5 px-2 rounded-full text-xs">
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
                            <div className="p-6">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Quick Actions - ✅ Added Sprint like BugDetailsModal */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="status"
                                                    value={formData.status || 'draft'}
                                                    type="select"
                                                    options={[
                                                        { value: 'draft', label: 'Draft' },
                                                        { value: 'active', label: 'Active' },
                                                        { value: 'archived', label: 'Archived' },
                                                        { value: 'deprecated', label: 'Deprecated' }
                                                    ]}
                                                    className="text-sm font-medium"
                                                    onSave={handleFieldSave}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Status</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="assignee"
                                                    value={formData.assignee || 'Unassigned'}
                                                    type="text"
                                                    placeholder="Assign to..."
                                                    className="text-sm font-medium"
                                                    onSave={handleFieldSave}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Assignee</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="priority"
                                                    value={formData.priority || 'medium'}
                                                    type="select"
                                                    options={[
                                                        { value: 'low', label: 'Low' },
                                                        { value: 'medium', label: 'Medium' },
                                                        { value: 'high', label: 'High' }
                                                    ]}
                                                    className="text-sm font-medium"
                                                    onSave={handleFieldSave}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Priority</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm hover:shadow-theme transition-shadow">
                                                <EditableField
                                                    field="environment"
                                                    value={formData.environment || 'testing'}
                                                    type="select"
                                                    options={[
                                                        { value: 'testing', label: 'Testing' },
                                                        { value: 'staging', label: 'Staging' },
                                                        { value: 'production', label: 'Production' },
                                                        { value: 'development', label: 'Development' }
                                                    ]}
                                                    className="text-sm font-medium"
                                                    onSave={handleFieldSave}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Environment</p>
                                            </div>
                                            {/* ✅ Sprint selector (like BugDetailsModal) */}
                                            {safeSprints.length > 0 && (
                                                <div className="bg-card border border-border rounded-lg p-4 shadow-theme-sm hover:shadow-theme transition-shadow col-span-2 md:col-span-1">
                                                    <div className="text-sm font-medium">
                                                        {editingField === 'sprint_id' ? (
                                                            <select
                                                                value={tempValues.sprint_id !== undefined ? tempValues.sprint_id : (formData.sprint_id || '')}
                                                                onChange={(e) => setTempValues({ ...tempValues, sprint_id: e.target.value })}
                                                                onBlur={() => handleFieldSave('sprint_id')}
                                                                className="w-full px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary"
                                                                autoFocus
                                                            >
                                                                <option value="">No Sprint</option>
                                                                {sprintOptions.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleFieldEdit('sprint_id', formData.sprint_id || '')}
                                                                className="w-full text-left px-2 py-1 hover:bg-accent rounded text-foreground"
                                                                disabled={!onUpdateTestCase || typeof onUpdateTestCase !== 'function'}
                                                            >
                                                                {formData.sprint_id
                                                                    ? (safeSprints.find(s => s.id === formData.sprint_id)?.name || 'Unknown Sprint')
                                                                    : 'No Sprint'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">🎯 Sprint</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                            <div className="flex items-center justify-between mb-4">
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
                                                    value={formData.description || 'No description provided'}
                                                    type="textarea"
                                                    placeholder="Enter test case description..."
                                                    className="w-full min-h-[80px] text-foreground leading-relaxed"
                                                    onSave={handleFieldSave}
                                                />
                                            )}
                                        </div>

                                        {/* Preconditions */}
                                        <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-foreground flex items-center">
                                                    <Info className="h-5 w-5 mr-2 text-primary" />
                                                    Preconditions
                                                </h3>
                                                <button
                                                    onClick={() => toggleSection('preconditions')}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {collapsedSections.has('preconditions') ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {!collapsedSections.has('preconditions') && (
                                                <EditableField
                                                    field="preconditions"
                                                    value={formData.preconditions || 'No preconditions specified'}
                                                    type="textarea"
                                                    placeholder="Enter preconditions..."
                                                    className="w-full min-h-[60px] text-foreground leading-relaxed"
                                                    onSave={handleFieldSave}
                                                />
                                            )}
                                        </div>

                                        {/* Test Steps */}
                                        <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-foreground flex items-center">
                                                    <ListOrdered className="h-5 w-5 mr-2 text-success" />
                                                    Test Steps
                                                </h3>
                                                <button
                                                    onClick={() => toggleSection('steps')}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    {collapsedSections.has('steps') ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {!collapsedSections.has('steps') && (
                                                <div className="space-y-3">
                                                    <div className="max-h-96 overflow-y-auto">
                                                        {formData.steps?.map((step, index) => (
                                                            <div key={index} className="border border-border rounded-lg p-4 bg-muted mb-3">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-sm font-medium text-foreground flex items-center">
                                                                        <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                                                            {index + 1}
                                                                        </span>
                                                                        Step {index + 1}
                                                                    </span>
                                                                    {formData.steps.length > 1 && (
                                                                        <button
                                                                            onClick={() => removeStep(index)}
                                                                            className="text-destructive hover:text-destructive/80 p-1"
                                                                            title="Remove step"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Action</label>
                                                                        <EditableField
                                                                            field={`step-${index}-action`}
                                                                            value={step.action || ''}
                                                                            type="textarea"
                                                                            placeholder="Action to perform..."
                                                                            className="w-full text-sm bg-background border border-border rounded p-2"
                                                                            onSave={(field, value) => handleStepChange(index, 'action', value)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Expected Result</label>
                                                                        <EditableField
                                                                            field={`step-${index}-expected`}
                                                                            value={step.expectedResult || ''}
                                                                            type="textarea"
                                                                            placeholder="Expected result..."
                                                                            className="w-full text-sm bg-background border border-border rounded p-2"
                                                                            onSave={(field, value) => handleStepChange(index, 'expectedResult', value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={addStep}
                                                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm text-primary hover:text-primary/80 font-medium border border-primary rounded hover:bg-accent transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add Step
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Test Configuration */}
                                        <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                <Settings className="h-5 w-5 mr-2 text-primary" />
                                                Test Configuration
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Component</label>
                                                    <EditableField
                                                        field="component"
                                                        value={formData.component || 'Not specified'}
                                                        type="text"
                                                        placeholder="Component name..."
                                                        className="text-sm w-full p-2 bg-muted rounded border"
                                                        onSave={handleFieldSave}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Test Type</label>
                                                    <EditableField
                                                        field="testType"
                                                        value={formData.testType || 'functional'}
                                                        type="select"
                                                        options={[
                                                            { value: 'functional', label: 'Functional' },
                                                            { value: 'integration', label: 'Integration' },
                                                            { value: 'unit', label: 'Unit' },
                                                            { value: 'regression', label: 'Regression' },
                                                            { value: 'performance', label: 'Performance' },
                                                            { value: 'security', label: 'Security' },
                                                            { value: 'ui', label: 'UI' },
                                                            { value: 'api', label: 'API' }
                                                        ]}
                                                        className="text-sm w-full p-2 bg-muted rounded border"
                                                        onSave={handleFieldSave}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Est. Time (min)</label>
                                                    <EditableField
                                                        field="estimatedTime"
                                                        value={formData.estimatedTime || '15'}
                                                        type="number"
                                                        placeholder="15"
                                                        className="text-sm w-full p-2 bg-muted rounded border"
                                                        onSave={handleFieldSave}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Priority & Assignment */}
                                        <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                <TrendingUp className="h-5 w-5 mr-2 text-destructive" />
                                                Priority & Assignment
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Severity</label>
                                                    <EditableField
                                                        field="severity"
                                                        value={formData.severity || 'medium'}
                                                        type="select"
                                                        options={[
                                                            { value: 'low', label: 'Low' },
                                                            { value: 'medium', label: 'Medium' },
                                                            { value: 'high', label: 'High' },
                                                            { value: 'critical', label: 'Critical' }
                                                        ]}
                                                        className="text-sm w-full p-2 bg-muted rounded border"
                                                        onSave={handleFieldSave}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Execution Status</label>
                                                    <EditableField
                                                        field="executionStatus"
                                                        value={formData.executionStatus || 'not_executed'}
                                                        type="select"
                                                        options={[
                                                            { value: 'not_executed', label: 'Not Executed' },
                                                            { value: 'passed', label: 'Passed' },
                                                            { value: 'failed', label: 'Failed' },
                                                            { value: 'skipped', label: 'Skipped' }
                                                        ]}
                                                        className="text-sm w-full p-2 bg-muted rounded border"
                                                        onSave={handleFieldSave}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ✅ Sprint Assignment Section (like BugDetailsModal) */}
                                        {safeSprints.length > 0 && (
                                            <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                    🎯 Sprint Assignment
                                                </h3>
                                                <div className="space-y-1">
                                                    <label className="text-sm font-medium text-foreground">Assigned Sprint</label>
                                                    <div className="text-sm p-2 bg-muted rounded border border-border flex items-center">
                                                        {editingField === 'sprint_id' ? (
                                                            <select
                                                                value={tempValues.sprint_id !== undefined ? tempValues.sprint_id : (formData.sprint_id || '')}
                                                                onChange={(e) => setTempValues({ ...tempValues, sprint_id: e.target.value })}
                                                                onBlur={() => handleFieldSave('sprint_id')}
                                                                className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary"
                                                                autoFocus
                                                            >
                                                                <option value="">No Sprint</option>
                                                                {sprintOptions.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleFieldEdit('sprint_id', formData.sprint_id || '')}
                                                                className="flex-1 text-left px-2 py-1 hover:bg-accent rounded text-foreground"
                                                                disabled={!onUpdateTestCase || typeof onUpdateTestCase !== 'function'}
                                                            >
                                                                {formData.sprint_id
                                                                    ? (safeSprints.find(s => s.id === formData.sprint_id)?.name || 'Unknown Sprint')
                                                                    : 'No Sprint'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Assign this test case to a sprint for better organization and tracking
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tags */}
                                        <div className="bg-card border border-border rounded-lg p-6 shadow-theme-sm">
                                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                <Tag className="h-5 w-5 mr-2 text-primary" />
                                                Tags
                                            </h3>
                                            <EditableField
                                                field="tags"
                                                value={formData.tags?.join(', ') || 'No tags'}
                                                type="text"
                                                placeholder="tag1, tag2, tag3"
                                                className="text-sm w-full p-3 bg-muted rounded border"
                                                onSave={(field, value) => handleTagsChange(value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'runs' && (
                                    <div className="space-y-6">
                                        <div className="bg-card border border-border rounded-lg shadow-theme-sm">
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                    <Play className="h-5 w-5 mr-2 text-primary" />
                                                    Test Execution History
                                                </h3>
                                                <TestCaseRunHistory testCaseId={testCase?.id} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div className="space-y-6">
                                        <div className="bg-card border border-border rounded-lg shadow-theme-sm">
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                                                    Comments & Discussion
                                                    <span className="ml-2 bg-primary/10 text-primary py-1 px-2 rounded-full text-xs">
                                                        {formData.comments?.length || 0}
                                                    </span>
                                                </h3>
                                                <TestCaseComments
                                                    comments={formData.comments || []}
                                                    onAddComment={handleAddComment}
                                                    formatDate={formatDate}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-6">
                                        <div className="bg-card border border-border rounded-lg shadow-theme-sm">
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                                                    <Activity className="h-5 w-5 mr-2 text-success" />
                                                    Activity Log
                                                    <span className="ml-2 bg-success/10 text-success py-1 px-2 rounded-full text-xs">
                                                        {activities.length}
                                                    </span>
                                                </h3>
                                                <TestCaseActivityLog activities={activities} formatDate={formatDate} />
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

export default TestCaseSideModal;