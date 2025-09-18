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
    onAISubmit,
    onClose,
    userDisplayName,
    currentUser
}) => {
    const [activeTab, setActiveTab] = useState('manual');
    const [generatedAIReport, setGeneratedAIReport] = useState(null);
    const [submitButtonState, setSubmitButtonState] = useState('idle'); // 'idle', 'loading', 'success'

    const features = [
        'Authentication',
        'User Management',
        'Dashboard',
        'Reports',
        'Settings',
        'File Upload',
        'Search',
        'Notifications',
        'API Integration',
        'Database',
        'UI Components',
        'Performance',
        'Security',
        'Other'
    ];

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

    const SubmitButton = ({ onClick, disabled, children, className, type = "button" }) => {
        const baseSize = 'w-36 h-11'; // Base button size
        const loadingSize = 'w-11 h-11'; // Circular size when loading
        
        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled || submitButtonState === 'loading'}
                className={`
                    relative
                    ${submitButtonState === 'loading' ? loadingSize : baseSize}
                    ${submitButtonState === 'loading' ? 'rounded-full' : 'rounded-lg'}
                    text-sm font-semibold
                    transition-all duration-300 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                    shadow-sm
                    ${className}
                    ${disabled && submitButtonState !== 'loading' 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : submitButtonState === 'success'
                            ? 'bg-green-600 text-white'
                            : submitButtonState === 'loading'
                                ? 'bg-teal-600 text-white'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }
                `}
                style={{
                    minWidth: submitButtonState === 'loading' ? '2.75rem' : '9rem',
                }}
            >
                {submitButtonState === 'loading' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-5 h-5">
                            {/* Snake-like loading animation */}
                            <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                            <div className="absolute inset-1 border-2 border-transparent border-t-white/70 rounded-full animate-spin animation-delay-150"></div>
                        </div>
                    </div>
                ) : submitButtonState === 'success' ? (
                    <div className="flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                ) : (
                    <span className="block w-full text-center">{children}</span>
                )}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 sm:px-8 shadow-sm">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Bug Details</h2>
                                        
                                        {/* Title - Full Width */}
                                        <div className="mb-6">
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-3">
                                                Bug Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => updateFormData('title', e.target.value)}
                                                placeholder="Brief description of the bug"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                required
                                            />
                                        </div>

                                        {/* Description - Full Width */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => updateFormData('description', e.target.value)}
                                                placeholder="Detailed description of the bug"
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical transition-all duration-200 text-sm"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Behavior Section */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Behavior Description</h3>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Actual Behavior <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    id="actualBehavior"
                                                    value={formData.actualBehavior}
                                                    onChange={(e) => updateFormData('actualBehavior', e.target.value)}
                                                    placeholder="What actually happens"
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical transition-all duration-200 text-sm"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Expected Behavior
                                                </label>
                                                <textarea
                                                    id="expectedBehavior"
                                                    value={formData.expectedBehavior}
                                                    onChange={(e) => updateFormData('expectedBehavior', e.target.value)}
                                                    placeholder="What should happen instead"
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical transition-all duration-200 text-sm"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Steps Section */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Steps to Reproduce</h3>
                                        
                                        <div>
                                            <textarea
                                                id="stepsToReproduce"
                                                value={formData.stepsToReproduce}
                                                onChange={(e) => updateFormData('stepsToReproduce', e.target.value)}
                                                placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe..."
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical transition-all duration-200 text-sm"
                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                            />
                                        </div>
                                    </div>

                                    {/* Classification Section */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Classification</h3>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div>
                                                <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Severity <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="severity"
                                                    value={formData.severity}
                                                    onChange={(e) => updateFormData('severity', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
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
                                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="category"
                                                    value={formData.category}
                                                    onChange={(e) => updateFormData('category', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
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

                                            <div>
                                                <label htmlFor="feature" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Feature/Module <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    id="feature"
                                                    value={formData.feature || ''}
                                                    onChange={(e) => updateFormData('feature', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                    required
                                                >
                                                    <option value="">Select feature</option>
                                                    {features.map(feature => (
                                                        <option key={feature} value={feature}>{feature}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                                            <div>
                                                <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Environment
                                                </label>
                                                <select
                                                    id="environment"
                                                    value={formData.environment}
                                                    onChange={(e) => updateFormData('environment', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                >
                                                    <option value="Production">Production</option>
                                                    <option value="Staging">Staging</option>
                                                    <option value="Development">Development</option>
                                                    <option value="Testing">Testing</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Frequency
                                                </label>
                                                <select
                                                    id="frequency"
                                                    value={formData.frequency}
                                                    onChange={(e) => updateFormData('frequency', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                >
                                                    <option value="Once">Once</option>
                                                    <option value="Sometimes">Sometimes</option>
                                                    <option value="Often">Often</option>
                                                    <option value="Always">Always</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information Section */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h3>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="workaround" className="block text-sm font-medium text-gray-700 mb-3">
                                                    Workaround (Optional)
                                                </label>
                                                <textarea
                                                    id="workaround"
                                                    value={formData.workaround}
                                                    onChange={(e) => updateFormData('workaround', e.target.value)}
                                                    placeholder="Any temporary solutions or workarounds"
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical transition-all duration-200 text-sm"
                                                    disabled={isSubmitting || submitButtonState === 'loading'}
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                {teamMembers.length > 0 && (
                                                    <div>
                                                        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-3">
                                                            Assign To
                                                        </label>
                                                        <select
                                                            id="assignedTo"
                                                            value={formData.assignedTo || ''}
                                                            onChange={(e) => updateFormData('assignedTo', e.target.value)}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm bg-white"
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                                        Log Information
                                                    </label>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id="hasConsoleLogs"
                                                                checked={formData.hasConsoleLogs}
                                                                onChange={(e) => updateFormData('hasConsoleLogs', e.target.checked)}
                                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded transition-colors"
                                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                            />
                                                            <label htmlFor="hasConsoleLogs" className="ml-3 block text-sm text-gray-700">
                                                                Console errors are available
                                                            </label>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                id="hasNetworkLogs"
                                                                checked={formData.hasNetworkLogs}
                                                                onChange={(e) => updateFormData('hasNetworkLogs', e.target.checked)}
                                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded transition-colors"
                                                                disabled={isSubmitting || submitButtonState === 'loading'}
                                                            />
                                                            <label htmlFor="hasNetworkLogs" className="ml-3 block text-sm text-gray-700">
                                                                Network logs are available
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments Section */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 sm:px-8 py-4 shadow-lg">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                                        disabled={isSubmitting || submitButtonState === 'loading'}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        type="submit"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        Submit Report
                                    </SubmitButton>
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

            {/* Add custom CSS for animation delay */}
            <style jsx>{`
                .animation-delay-150 {
                    animation-delay: 150ms;
                }
            `}</style>
        </div>
    );
};

export default BugReportForm;