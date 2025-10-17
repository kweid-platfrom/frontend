import React, { useState, useCallback } from 'react';
import { SparklesIcon, ClipboardDocumentIcon, ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon, PaperAirplaneIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAIBugService } from '../hooks/useAIBugService';
import BugReportAttachments from '../components/create-bug/BugReportAttachments';

const AIPromptBugReport = ({ onSubmit, isProcessing, teamMembers, recordings, isLoadingRecordings }) => {
    const [prompt, setPrompt] = useState('');
    const [consoleError, setConsoleError] = useState('');
    const [generatedReport, setGeneratedReport] = useState(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState('');
    
    // Use the AI Bug Service hook
    const {
        isInitialized,
        isGenerating,
        isHealthy,
        error: aiError,
        provider,
        model,
        canGenerate,
        generateBugReport,
        initialize,
        clearError
    } = useAIBugService();

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

    // Helper function to ensure evidence is properly formatted
    const formatEvidenceForDisplay = useCallback((evidence) => {
        if (!evidence || typeof evidence !== 'object') {
            return evidence;
        }

        try {
            // If it's an object with browser/device info, format it nicely
            if (evidence.browser || evidence.device || evidence.os) {
                const parts = [];
                if (evidence.browser) parts.push(`Browser: ${evidence.browser}`);
                if (evidence.browserVersion || evidence.version) {
                    parts.push(`Version: ${evidence.browserVersion || evidence.version}`);
                }
                if (evidence.device) parts.push(`Device: ${evidence.device}`);
                if (evidence.os) parts.push(`OS: ${evidence.os}`);
                if (evidence.url) parts.push(`URL: ${evidence.url}`);
                
                return parts.join(' | ');
            }
            
            // For other objects, stringify safely
            return JSON.stringify(evidence, null, 2);
        } catch (error) {
            console.error('Error formatting evidence:', error);
            return 'Evidence data available';
        }
    }, []);

    // Generate bug report using the hook
    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() && !consoleError.trim()) {
            return;
        }

        clearError();
        
        try {
            // Additional context for better AI analysis
            const additionalContext = {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                hasPrompt: !!prompt.trim(),
                hasConsoleError: !!consoleError.trim()
            };

            const result = await generateBugReport(prompt, consoleError, additionalContext);

            if (result.success) {
                console.log('✅ Bug report generated successfully');
                
                // Process the evidence field for display
                const processedData = {
                    ...result.data,
                    evidence: result.data.evidence ? formatEvidenceForDisplay(result.data.evidence) : undefined,
                    creationType: 'ai'
                };
                
                // Set the generated report for display in the AI tab
                setGeneratedReport(processedData);
            }
            
        } catch (err) {
            console.error('❌ Bug report generation failed:', err);
        }
    }, [prompt, consoleError, generateBugReport, clearError, formatEvidenceForDisplay]);

    // Handle submitting the AI-generated report
    const handleSubmitGenerated = useCallback(async () => {
        if (!generatedReport) return;

        setIsSubmittingReport(true);
        try {
            // Include attachments with the generated report
            const reportWithAttachments = {
                ...generatedReport,
                attachments: attachments
            };
            
            await onSubmit(reportWithAttachments);
            // Clear the form and generated report after successful submission
            setPrompt('');
            setConsoleError('');
            setGeneratedReport(null);
            setAttachments([]);
        } catch (error) {
            console.error('Failed to submit AI-generated report:', error);
        } finally {
            setIsSubmittingReport(false);
        }
    }, [generatedReport, attachments, onSubmit]);

    // Handle editing the generated report
    const handleEditGenerated = useCallback((field, value) => {
        setGeneratedReport(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Handle clipboard paste for console errors
    const handlePasteConsoleError = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setConsoleError(text);
            clearError();
        } catch (error) {
            console.error('Failed to read clipboard:', error);
        }
    }, [clearError]);

    // Reset to input form
    const handleStartOver = useCallback(() => {
        setGeneratedReport(null);
        setAttachments([]);
        clearError();
    }, [clearError]);

    const isDisabled = isProcessing || isGenerating || !canGenerate || (!prompt.trim() && !consoleError.trim());
    const hasInput = prompt.trim() || consoleError.trim();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <SparklesIcon className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">AI Bug Report Generator</h3>
                <p className="text-sm text-muted">
                    Describe the issue or paste console errors, and AI will generate a detailed bug report
                </p>
                
                {/* Service Status Indicator */}
                <div className="mt-3 flex items-center justify-center space-x-2">
                    {!isInitialized ? (
                        <>
                            <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary"></div>
                            <span className="text-xs text-muted">Initializing AI service...</span>
                        </>
                    ) : isHealthy ? (
                        <>
                            <CheckCircleIcon className="h-4 w-4 text-success" />
                            <span className="text-xs text-success">
                                AI Ready ({provider} - {model})
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircleIcon className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">AI Service Issues</span>
                            <button
                                onClick={initialize}
                                className="text-xs text-primary hover:text-primary ml-2 underline"
                            >
                                Retry
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {(aiError || error) && (
                <div className="bg-destructive/5 border border-destructive/20 rounded p-3">
                    <div className="flex items-start">
                        <XCircleIcon className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-destructive flex-1">
                            <p className="font-medium">Error</p>
                            <p>{aiError || error}</p>
                        </div>
                        <button
                            onClick={() => {
                                clearError();
                                setError('');
                            }}
                            className="text-destructive hover:text-destructive ml-2"
                        >
                            <XCircleIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input Form - Show when no generated report */}
            {!generatedReport && (
                <div className="space-y-4">
                    {/* Issue Description Input */}
                    <div>
                        <label htmlFor="issue-description" className="block text-sm font-medium text-foreground mb-2">
                            Issue Description
                        </label>
                        <textarea
                            id="issue-description"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the issue you're experiencing... (e.g., 'The submit button doesn't work when I click it', 'Page crashes when loading user profile')"
                            rows={4}
                            className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-vertical"
                            disabled={isProcessing || isGenerating || !isInitialized}
                        />
                    </div>

                    {/* Console Error Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="console-error" className="block text-sm font-medium text-foreground">
                                Console Error (Optional)
                            </label>
                            <button
                                type="button"
                                onClick={handlePasteConsoleError}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-muted-foreground bg-secondary hover:bg-accent rounded border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isProcessing || isGenerating || !isInitialized}
                            >
                                <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
                                Paste from Clipboard
                            </button>
                        </div>
                        <textarea
                            id="console-error"
                            value={consoleError}
                            onChange={(e) => setConsoleError(e.target.value)}
                            placeholder="Paste console errors here... (e.g., 'ReferenceError: validateSuiteAccess is not defined')"
                            rows={6}
                            className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary resize-vertical font-mono text-sm"
                            disabled={isProcessing || isGenerating || !isInitialized}
                        />
                    </div>

                    {/* AI Analysis Preview */}
                    {hasInput && isHealthy && (
                        <div className="bg-warning/5 border border-warning/20 rounded p-3">
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-warning mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-warning">
                                    <p className="font-medium">AI will analyze your input and generate:</p>
                                    <ul className="mt-1 list-disc list-inside space-y-1">
                                        <li>Intelligent bug title and comprehensive description</li>
                                        <li>Detailed steps to reproduce based on context</li>
                                        <li>Expected vs actual behavior analysis</li>
                                        <li>Smart severity and category classification</li>
                                        <li>Environment detection and impact assessment</li>
                                        <li>Suggested test cases to prevent regression</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Unavailable Warning */}
                    {isInitialized && !isHealthy && (
                        <div className="bg-destructive/5 border border-destructive/20 rounded p-3">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-destructive">
                                    <p className="font-medium">AI Service Issues</p>
                                    <p>The AI service is experiencing issues. Please try again or contact support.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isDisabled}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded transition-colors ${
                                isDisabled
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary text-primary-foreground hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                                    Generating AI Report...
                                </>
                            ) : !isInitialized ? (
                                <>
                                    <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                                    Initializing...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-4 w-4 mr-2" />
                                    Generate Bug Report
                                </>
                            )}
                        </button>
                    </div>

                    {/* Additional Info */}
                    {isInitialized && isHealthy && (
                        <div className="text-xs text-muted text-center">
                            Powered by {provider} ({model})
                        </div>
                    )}
                </div>
            )}

            {/* Generated Report Display - Show when report is generated */}
            {generatedReport && (
                <div className="space-y-6">
                    {/* Header for generated report */}
                    <div className="bg-success/5 border border-success/20 rounded p-3">
                        <div className="flex items-center">
                            <CheckCircleIcon className="h-5 w-5 text-success mr-2" />
                            <div className="text-sm text-success">
                                <p className="font-medium">AI Bug Report Generated Successfully</p>
                                <p>Review the details below and submit when ready</p>
                            </div>
                        </div>
                    </div>

                    {/* Generated Report Preview */}
                    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Bug Title
                            </label>
                            <input
                                type="text"
                                value={generatedReport.title || ''}
                                onChange={(e) => handleEditGenerated('title', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isSubmittingReport}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Description
                            </label>
                            <textarea
                                value={generatedReport.description || ''}
                                onChange={(e) => handleEditGenerated('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                                disabled={isSubmittingReport}
                            />
                        </div>

                        {/* Two Column Layout - Actual and Expected Behavior */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Actual Behavior
                                </label>
                                <textarea
                                    value={generatedReport.actualBehavior || ''}
                                    onChange={(e) => handleEditGenerated('actualBehavior', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                                    disabled={isSubmittingReport}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Expected Behavior
                                </label>
                                <textarea
                                    value={generatedReport.expectedBehavior || ''}
                                    onChange={(e) => handleEditGenerated('expectedBehavior', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                                    disabled={isSubmittingReport}
                                />
                            </div>
                        </div>

                        {/* Steps to Reproduce */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Steps to Reproduce
                            </label>
                            <textarea
                                value={generatedReport.stepsToReproduce || ''}
                                onChange={(e) => handleEditGenerated('stepsToReproduce', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                                disabled={isSubmittingReport}
                            />
                        </div>

                        {/* Classification Layout - Severity, Category, Feature, Environment, Frequency */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Severity
                                </label>
                                <select
                                    value={generatedReport.severity || ''}
                                    onChange={(e) => handleEditGenerated('severity', e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmittingReport}
                                >
                                    <option value="">Select Severity</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Category
                                </label>
                                <select
                                    value={generatedReport.category || ''}
                                    onChange={(e) => handleEditGenerated('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmittingReport}
                                >
                                    <option value="">Select Category</option>
                                    <option value="UI/UX">UI/UX</option>
                                    <option value="Functional">Functional</option>
                                    <option value="Performance">Performance</option>
                                    <option value="Security">Security</option>
                                    <option value="Backend">Backend</option>
                                    <option value="Integration">Integration</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Feature/Module
                                </label>
                                <select
                                    value={generatedReport.feature || ''}
                                    onChange={(e) => handleEditGenerated('feature', e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmittingReport}
                                >
                                    <option value="">Select Feature</option>
                                    {features.map(feature => (
                                        <option key={feature} value={feature}>{feature}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Environment
                                </label>
                                <select
                                    value={generatedReport.environment || 'Production'}
                                    onChange={(e) => handleEditGenerated('environment', e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmittingReport}
                                >
                                    <option value="Production">Production</option>
                                    <option value="Staging">Staging</option>
                                    <option value="Development">Development</option>
                                    <option value="Testing">Testing</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Frequency
                                </label>
                                <select
                                    value={generatedReport.frequency || 'Once'}
                                    onChange={(e) => handleEditGenerated('frequency', e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmittingReport}
                                >
                                    <option value="Once">Once</option>
                                    <option value="Sometimes">Sometimes</option>
                                    <option value="Often">Often</option>
                                    <option value="Always">Always</option>
                                </select>
                            </div>
                        </div>

                        {/* Workaround and Assignment */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Workaround (Optional)
                                </label>
                                <textarea
                                    value={generatedReport.workaround || ''}
                                    onChange={(e) => handleEditGenerated('workaround', e.target.value)}
                                    placeholder="Any temporary solutions or workarounds"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                                    disabled={isSubmittingReport}
                                />
                            </div>

                            {teamMembers.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Assign To
                                    </label>
                                    <select
                                        value={generatedReport.assignedTo || ''}
                                        onChange={(e) => handleEditGenerated('assignedTo', e.target.value)}
                                        className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={isSubmittingReport}
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
                        </div>

                        {/* Evidence/Additional Info */}
                        {generatedReport.evidence && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Technical Evidence
                                </label>
                                <div className="bg-muted border border-border rounded p-3">
                                    <code className="text-sm text-foreground whitespace-pre-wrap">
                                        {generatedReport.evidence}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attachments Section */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <BugReportAttachments
                            attachments={attachments}
                            setAttachments={setAttachments}
                            recordings={recordings || []}
                            isLoadingRecordings={isLoadingRecordings}
                            setError={setError}
                        />
                    </div>

                    {/* Action Buttons for Generated Report */}
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={handleStartOver}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            disabled={isSubmittingReport}
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Start Over
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmitGenerated}
                            disabled={isSubmittingReport || !generatedReport.title || !generatedReport.description || !generatedReport.severity || !generatedReport.category}
                            className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded transition-colors ${
                                isSubmittingReport || !generatedReport.title || !generatedReport.description || !generatedReport.severity || !generatedReport.category
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary text-primary-foreground hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                            }`}
                        >
                            {isSubmittingReport ? (
                                <>
                                    <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                                    Submitting AI Report...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                                    Submit AI Bug Report
                                </>
                            )}
                        </button>
                    </div>

                    {/* AI Generated Badge */}
                    <div className="text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            AI Generated Report
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIPromptBugReport;