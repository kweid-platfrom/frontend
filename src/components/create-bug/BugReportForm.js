import React, { useState, useCallback } from 'react';
import { SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import BugReportAttachments from './BugReportAttachments';
import AIPromptBugReport from '../AIPromptBugReport';

const BugReportForm = ({
    formData,
    updateFormData,
    attachments,
    setAttachments,
    teamMembers,
    isSubmitting,
    onSubmit,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState('manual');

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        onSubmit();
    }, [onSubmit]);

    const handleAIFormGeneration = useCallback((generatedForm) => {
        // Update form data with AI generated content
        Object.keys(generatedForm).forEach(key => {
            updateFormData(key, generatedForm[key]);
        });
        
        // Switch to manual tab to show the generated form
        setActiveTab('manual');
    }, [updateFormData]);

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
        <div className="flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 sm:px-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                disabled={isSubmitting}
                            >
                                <div className="flex items-center">
                                    <Icon className="h-5 w-5 mr-2" />
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
                            <div className="p-4 sm:p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title - Full Width */}
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                            Bug Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => updateFormData('title', e.target.value)}
                                            placeholder="Brief description of the bug"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>

                                    {/* Description - Full Width */}
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => updateFormData('description', e.target.value)}
                                            placeholder="Detailed description of the bug"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>

                                    {/* Two Column Layout - Actual and Expected Behavior */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-2">
                                                Actual Behavior <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="actualBehavior"
                                                value={formData.actualBehavior}
                                                onChange={(e) => updateFormData('actualBehavior', e.target.value)}
                                                placeholder="What actually happens"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-2">
                                                Expected Behavior
                                            </label>
                                            <textarea
                                                id="expectedBehavior"
                                                value={formData.expectedBehavior}
                                                onChange={(e) => updateFormData('expectedBehavior', e.target.value)}
                                                placeholder="What should happen instead"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Steps to Reproduce - Full Width */}
                                    <div>
                                        <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-2">
                                            Steps to Reproduce
                                        </label>
                                        <textarea
                                            id="stepsToReproduce"
                                            value={formData.stepsToReproduce}
                                            onChange={(e) => updateFormData('stepsToReproduce', e.target.value)}
                                            placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Four Column Layout - Severity, Category, Environment, Frequency */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                                                Severity <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="severity"
                                                value={formData.severity}
                                                onChange={(e) => updateFormData('severity', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                disabled={isSubmitting}
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
                                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="category"
                                                value={formData.category}
                                                onChange={(e) => updateFormData('category', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                disabled={isSubmitting}
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

                                        <div>
                                            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
                                                Environment
                                            </label>
                                            <select
                                                id="environment"
                                                value={formData.environment}
                                                onChange={(e) => updateFormData('environment', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                disabled={isSubmitting}
                                            >
                                                <option value="Production">Production</option>
                                                <option value="Staging">Staging</option>
                                                <option value="Development">Development</option>
                                                <option value="Testing">Testing</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                                                Frequency
                                            </label>
                                            <select
                                                id="frequency"
                                                value={formData.frequency}
                                                onChange={(e) => updateFormData('frequency', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                disabled={isSubmitting}
                                            >
                                                <option value="Once">Once</option>
                                                <option value="Sometimes">Sometimes</option>
                                                <option value="Often">Often</option>
                                                <option value="Always">Always</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Two Column Layout - Workaround and Assign To */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="workaround" className="block text-sm font-medium text-gray-700 mb-2">
                                                Workaround (Optional)
                                            </label>
                                            <textarea
                                                id="workaround"
                                                value={formData.workaround}
                                                onChange={(e) => updateFormData('workaround', e.target.value)}
                                                placeholder="Any temporary solutions or workarounds"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {/* Assign To and Log Checkboxes */}
                                        <div className="space-y-6">
                                            {teamMembers.length > 0 && (
                                                <div>
                                                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Assign To
                                                    </label>
                                                    <select
                                                        id="assignedTo"
                                                        value={formData.assignedTo || ''}
                                                        onChange={(e) => updateFormData('assignedTo', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                        disabled={isSubmitting}
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

                                            {/* Log Checkboxes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Additional Information
                                                </label>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id="hasConsoleLogs"
                                                            checked={formData.hasConsoleLogs}
                                                            onChange={(e) => updateFormData('hasConsoleLogs', e.target.checked)}
                                                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                            disabled={isSubmitting}
                                                        />
                                                        <label htmlFor="hasConsoleLogs" className="ml-2 block text-sm text-gray-700">
                                                            Console errors are available
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id="hasNetworkLogs"
                                                            checked={formData.hasNetworkLogs}
                                                            onChange={(e) => updateFormData('hasNetworkLogs', e.target.checked)}
                                                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                            disabled={isSubmitting}
                                                        />
                                                        <label htmlFor="hasNetworkLogs" className="ml-2 block text-sm text-gray-700">
                                                            Network logs are available
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="border-t pt-6">
                                        <BugReportAttachments
                                            attachments={attachments}
                                            setAttachments={setAttachments}
                                            isSubmitting={isSubmitting}
                                        />
                                    </div>

                                    {/* Add some bottom spacing to ensure form content doesn't get cut off */}
                                    <div className="pb-6"></div>
                                </form>
                            </div>
                        </div>

                        {/* Fixed Bottom Section - Submit Only */}
                        <div className="flex-shrink-0 bg-white border-t px-4 sm:px-6 py-4 shadow-lg">
                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                                        isSubmitting
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-teal-600 hover:bg-teal-700'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Bug Report'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="h-full overflow-y-auto p-4 sm:p-6">
                        <AIPromptBugReport
                            onFormGeneration={handleAIFormGeneration}
                            isProcessing={isSubmitting}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugReportForm;