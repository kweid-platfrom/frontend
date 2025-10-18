import React, { useState, useCallback } from 'react';
import { SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import BugReportAttachments from './BugReportAttachments';
import AIPromptBugReport from '../AIPromptBugReport';
import { Button } from '@/components/ui/button';

const BugReportForm = ({
    formData,
    updateFormData,
    attachments,
    setAttachments,
    teamMembers,
    isSubmitting,
    onSubmit,
    onAISubmit,
    onClose,
    userDisplayName,
    currentUser,
    sprints = [],
    modules = []
}) => {
    const [activeTab, setActiveTab] = useState('manual');
    const [generatedAIReport, setGeneratedAIReport] = useState(null);
    const [submitButtonState, setSubmitButtonState] = useState('idle'); // 'idle', 'loading', 'success'

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSubmitButtonState('loading');

        try {
            await onSubmit();
            setSubmitButtonState('success');
            // Reset to idle after animation
            setTimeout(() => setSubmitButtonState('idle'), 2000);
        } catch (error) {
            setSubmitButtonState('idle');
            console.error('Error submitting form:', error);
        }
    }, [onSubmit]);

    // Handle AI-generated bug report submission - now called directly from AI tab
    const handleAISubmit = useCallback(async (aiFormData) => {
        setSubmitButtonState('loading');

        try {
            // Ensure the data is marked as AI-generated
            const aiReportData = {
                ...aiFormData,
                creationType: 'ai',
                source: 'AI Generated'
            };

            await onAISubmit(aiReportData);
            setSubmitButtonState('success');
            // Clear the generated report and reset
            setGeneratedAIReport(null);
            setTimeout(() => setSubmitButtonState('idle'), 2000);
        } catch (error) {
            setSubmitButtonState('idle');
            console.error('Error submitting AI report:', error);
        }
    }, [onAISubmit]);

    const handleAIFormGeneration = useCallback((generatedForm) => {
        // Set the generated report, or clear it if null (for new generation)
        setGeneratedAIReport(generatedForm);
    }, []);

    const tabs = [
        {
            id: 'manual',
            name: 'Manual Entry',
            icon: DocumentTextIcon,
            description: 'Fill out the bug report form manually'
        },
        {
            id: 'ai',
            name: 'AI Generator',
            icon: SparklesIcon,
            description: 'Generate bug report from description or console errors'
        }
    ];

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 bg-card border-b border-border px-6 sm:px-8 shadow-theme-sm">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                                    }`}
                                disabled={isSubmitting || submitButtonState === 'loading'}
                            >
                                <div className="flex items-center">
                                    <Icon className="h-5 w-5 mr-2 transition-colors" />
                                    {tab.name}
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0">
                {activeTab === 'manual' && (
                    <div className="h-full flex flex-col">
                        {/* Scrollable Form Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-6xl mx-auto p-6 sm:p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Header Section */}
                                    <div className="bg-card rounded-xl shadow-theme-sm border border-border p-6">
                                        <h2 className="text-lg font-semibold text-foreground mb-6">Bug Details</h2>

                                        {/* Title - Full Width */}
                                        <div className="mb-6">
                                            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-3">
                                                Bug Title <span className="text-destructive">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => updateFormData('title', e.target.value)}
                                                placeholder="Brief description of the bug"
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                required
                                            />
                                        </div>

                                        {/* Description - Full Width */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-3">
                                                Description <span className="text-destructive">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => updateFormData('description', e.target.value)}
                                                placeholder="Detailed description of the bug"
                                                rows={4}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all duration-200 text-sm bg-background text-foreground"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Behavior Section */}
                                    <div className="bg-card rounded-xl shadow-theme-sm border border-border p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-6">Behavior Description</h3>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="actualBehavior" className="block text-sm font-medium text-foreground mb-3">
                                                    Actual Behavior <span className="text-destructive">*</span>
                                                </label>
                                                <textarea
                                                    id="actualBehavior"
                                                    value={formData.actualBehavior}
                                                    onChange={(e) => updateFormData('actualBehavior', e.target.value)}
                                                    placeholder="What actually happens"
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="expectedBehavior" className="block text-sm font-medium text-foreground mb-3">
                                                    Expected Behavior
                                                </label>
                                                <textarea
                                                    id="expectedBehavior"
                                                    value={formData.expectedBehavior}
                                                    onChange={(e) => updateFormData('expectedBehavior', e.target.value)}
                                                    placeholder="What should happen instead"
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Steps Section */}
                                    <div className="bg-card rounded-xl shadow-theme-sm border border-border p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-6">Steps to Reproduce</h3>

                                        <div>
                                            <textarea
                                                id="stepsToReproduce"
                                                value={formData.stepsToReproduce}
                                                onChange={(e) => updateFormData('stepsToReproduce', e.target.value)}
                                                placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..."
                                                rows={4}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all duration-200 text-sm bg-background text-foreground"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                            />
                                        </div>
                                    </div>

                                    {/* Classification Section */}
                                    <div className="bg-card rounded-xl shadow-theme-sm border border-border p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-6">Classification</h3>

                                        {/* First Row - Severity and Category */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="severity" className="block text-sm font-medium text-foreground mb-3">
                                                    Severity <span className="text-destructive">*</span>
                                                </label>
                                                <select
                                                    id="severity"
                                                    value={formData.severity}
                                                    onChange={(e) => updateFormData('severity', e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                    required
                                                >
                                                    <option value="">Select severity</option>
                                                    <option value="Critical">Critical</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="category" className="block text-sm font-medium text-foreground mb-3">
                                                    Category <span className="text-destructive">*</span>
                                                </label>
                                                <select
                                                    id="category"
                                                    value={formData.category}
                                                    onChange={(e) => updateFormData('category', e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                    required
                                                >
                                                    <option value="">Select category</option>
                                                    <option value="UI/UX">UI/UX</option>
                                                    <option value="Functional">Functional</option>
                                                    <option value="Performance">Performance</option>
                                                    <option value="Security">Security</option>
                                                    <option value="Backend">Backend</option>
                                                    <option value="Integration">Integration</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Second Row - Environment and Frequency */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="environment" className="block text-sm font-medium text-foreground mb-3">
                                                    Environment
                                                </label>
                                                <select
                                                    id="environment"
                                                    value={formData.environment}
                                                    onChange={(e) => updateFormData('environment', e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                >
                                                    <option value="Production">Production</option>
                                                    <option value="Staging">Staging</option>
                                                    <option value="Development">Development</option>
                                                    <option value="Testing">Testing</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="frequency" className="block text-sm font-medium text-foreground mb-3">
                                                    Frequency
                                                </label>
                                                <select
                                                    id="frequency"
                                                    value={formData.frequency}
                                                    onChange={(e) => updateFormData('frequency', e.target.value)}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                >
                                                    <option value="Once">Once</option>
                                                    <option value="Sometimes">Sometimes</option>
                                                    <option value="Often">Often</option>
                                                    <option value="Always">Always</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Third Row - Module (with optional custom input) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="module" className="block text-sm font-medium text-foreground mb-3">
                                                    <span className="flex items-center gap-2">
                                                        <span>📁</span>
                                                        <span>Module</span>
                                                        <span className="text-destructive">*</span>
                                                    </span>
                                                </label>
                                                <select
                                                    id="module"
                                                    value={formData.module_id || formData.moduleId || ''}
                                                    onChange={(e) => {
                                                        updateFormData('module_id', e.target.value);
                                                        updateFormData('moduleId', e.target.value);
                                                        if (e.target.value !== 'other') {
                                                            updateFormData('customModule', '');
                                                        }
                                                    }}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                    required
                                                >
                                                    <option value="">Select module</option>
                                                    {modules.map(module => (
                                                        <option key={module.id} value={module.id}>
                                                            {module.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Custom Module Input - Shows when "Other" is selected */}
                                            {(formData.module_id === 'other' || formData.moduleId === 'other') && (
                                                <div>
                                                    <label htmlFor="customModule" className="block text-sm font-medium text-foreground mb-3">
                                                        Specify Module <span className="text-destructive">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="customModule"
                                                        placeholder="Enter module name..."
                                                        value={formData.customModule || ''}
                                                        onChange={(e) => updateFormData('customModule', e.target.value)}
                                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                        disabled={isSubmitting || submitButtonState === 'loading'}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Fourth Row - Sprint (Full Width) */}
                                        <div>
                                            <label htmlFor="sprint" className="block text-sm font-medium text-foreground mb-3">
                                                <span className="flex items-center gap-2">
                                                    <span>🎯</span>
                                                    <span>Sprint (Optional)</span>
                                                </span>
                                            </label>
                                            <select
                                                id="sprint"
                                                value={formData.sprint_id || formData.sprintId || ''}
                                                onChange={(e) => {
                                                    updateFormData('sprint_id', e.target.value);
                                                    updateFormData('sprintId', e.target.value);
                                                }}
                                                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                            >
                                                <option value="">No Sprint</option>
                                                {sprints && sprints.length > 0 ? (
                                                    sprints.map(sprint => (
                                                        <option key={sprint.id} value={sprint.id}>
                                                            {sprint.name}
                                                            {sprint.status && ` (${sprint.status})`}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>No sprints available</option>
                                                )}
                                            </select>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {sprints && sprints.length > 0 
                                                    ? 'Assign to a sprint for tracking'
                                                    : 'No sprints configured yet'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Additional Information Section */}
                                    <div className="bg-card rounded-xl shadow-theme-sm border border-border p-6">
                                        <h3 className="text-lg font-semibold text-foreground mb-6">Additional Information</h3>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="workaround" className="block text-sm font-medium text-foreground mb-3">
                                                    Workaround (Optional)
                                                </label>
                                                <textarea
                                                    id="workaround"
                                                    value={formData.workaround}
                                                    onChange={(e) => updateFormData('workaround', e.target.value)}
                                                    placeholder="Any temporary solutions or workarounds"
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical transition-all duration-200 text-sm bg-background text-foreground"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                {teamMembers.length > 0 && (
                                                    <div>
                                                        <label htmlFor="assignedTo" className="block text-sm font-medium text-foreground mb-3">
                                                            Assign To
                                                        </label>
                                                        <select
                                                            id="assignedTo"
                                                            value={formData.assignedTo || ''}
                                                            onChange={(e) => updateFormData('assignedTo', e.target.value)}
                                                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-sm bg-background text-foreground"
                                                            disabled={isSubmitting || submitButtonState === 'loading'}
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {teamMembers.map(member => (
                                                                <option key={member.id} value={member.id}>
                                                                    {member.name} ({member.email})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-4">
                                                        Log Information
                                                    </label>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id="hasConsoleLogs"
                                                                checked={formData.hasConsoleLogs}
                                                                onChange={(e) => updateFormData('hasConsoleLogs', e.target.checked)}
                                                                className="h-4 w-4 text-primary focus:ring-primary border-border rounded transition-colors accent-primary"
                                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                            />
                                                            <label htmlFor="hasConsoleLogs" className="ml-3 block text-sm text-foreground">
                                                                Console errors are available
                                                            </label>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id="hasNetworkLogs"
                                                                checked={formData.hasNetworkLogs}
                                                                onChange={(e) => updateFormData('hasNetworkLogs', e.target.checked)}
                                                                className="h-4 w-4 text-primary focus:ring-primary border-border rounded transition-colors accent-primary"
                                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                            />
                                                            <label htmlFor="hasNetworkLogs" className="ml-3 block text-sm text-foreground">
                                                                Network logs are available
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="bg-card rounded-xl shadow-theme-sm border border-border p-6">
                                        <BugReportAttachments
                                            attachments={attachments}
                                            setAttachments={setAttachments}
                                            isSubmitting={isSubmitting || submitButtonState === 'loading'}
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Fixed Bottom Section - Submit Only */}
                        <div className="flex-shrink-0 bg-card border-t border-border px-6 sm:px-8 py-4 shadow-theme-lg">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex justify-end space-x-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={isSubmitting || submitButtonState === 'loading'}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        loading={submitButtonState === 'loading'}
                                        morphLoading={true}
                                        fullWidth={false}
                                        className="min-w-[9rem]"
                                    >
                                        Submit Report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="h-full overflow-y-auto">
                        <div className="max-w-6xl mx-auto p-6 sm:p-8">
                            <AIPromptBugReport
                                onSubmit={handleAISubmit}
                                isProcessing={isSubmitting || submitButtonState === 'loading'}
                                teamMembers={teamMembers}
                                userDisplayName={userDisplayName}
                                currentUser={currentUser}
                                onFormGeneration={handleAIFormGeneration}
                                generatedReport={generatedAIReport}
                                onSubmitAIReport={handleAISubmit}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugReportForm;