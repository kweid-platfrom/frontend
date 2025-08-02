import React, { useState, useCallback } from 'react';
import { SparklesIcon, ClipboardDocumentIcon, ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAIBugService } from '../hooks/useAIBugService';

const AIPromptBugReport = ({ onFormGeneration, isProcessing }) => {
    const [prompt, setPrompt] = useState('');
    const [consoleError, setConsoleError] = useState('');
    
    // Use the AI Bug Service hook
    const {
        isInitialized,
        isGenerating,
        isHealthy,
        error,
        provider,
        model,
        canGenerate,
        generateBugReport,
        initialize,
        clearError
    } = useAIBugService();

    // Helper function to ensure evidence is properly formatted
    const formatEvidenceForForm = useCallback((evidence) => {
        if (!evidence || typeof evidence !== 'object') {
            return evidence;
        }

        // Convert object evidence to a string format that can be safely rendered
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
                
                // CRITICAL FIX: Ensure evidence field is properly formatted
                const processedData = {
                    ...result.data,
                    // Convert evidence object to string if it exists
                    evidence: result.data.evidence ? formatEvidenceForForm(result.data.evidence) : undefined
                };
                
                // Pass the processed form data to parent component
                onFormGeneration(processedData);
                
                // Clear the form after successful generation
                setPrompt('');
                setConsoleError('');
            }
            
        } catch (err) {
            console.error('❌ Bug report generation failed:', err);
        }
    }, [prompt, consoleError, generateBugReport, onFormGeneration, clearError, formatEvidenceForForm]);

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

    const isDisabled = isProcessing || isGenerating || !canGenerate || (!prompt.trim() && !consoleError.trim());
    const hasInput = prompt.trim() || consoleError.trim();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <SparklesIcon className="mx-auto h-12 w-12 text-teal-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Bug Report Generator</h3>
                <p className="text-sm text-gray-500">
                    Describe the issue or paste console errors, and AI will generate a detailed bug report
                </p>
                
                {/* Service Status Indicator */}
                <div className="mt-3 flex items-center justify-center space-x-2">
                    {!isInitialized ? (
                        <>
                            <div className="animate-spin rounded h-4 w-4 border-b-2 border-teal-500"></div>
                            <span className="text-xs text-gray-500">Initializing AI service...</span>
                        </>
                    ) : isHealthy ? (
                        <>
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600">
                                AI Ready ({provider} - {model})
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">AI Service Issues</span>
                            <button
                                onClick={initialize}
                                className="text-xs text-teal-600 hover:text-teal-700 underline ml-2"
                            >
                                Retry
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-start">
                        <XCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700 flex-1">
                            <p className="font-medium">Error</p>
                            <p>{error}</p>
                        </div>
                        <button
                            onClick={clearError}
                            className="text-red-400 hover:text-red-600 ml-2"
                        >
                            <XCircleIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Issue Description Input */}
                <div>
                    <label htmlFor="issue-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Description
                    </label>
                    <textarea
                        id="issue-description"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the issue you're experiencing... (e.g., 'The submit button doesn't work when I click it', 'Page crashes when loading user profile')"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical"
                        disabled={isProcessing || isGenerating || !isInitialized}
                    />
                </div>

                {/* Console Error Input */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="console-error" className="block text-sm font-medium text-gray-700">
                            Console Error (Optional)
                        </label>
                        <button
                            type="button"
                            onClick={handlePasteConsoleError}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-vertical font-mono text-sm"
                        disabled={isProcessing || isGenerating || !isInitialized}
                    />
                </div>

                {/* AI Analysis Preview */}
                {hasInput && isHealthy && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-700">
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
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex">
                            <XCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-700">
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
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating AI Report...
                            </>
                        ) : !isInitialized ? (
                            <>
                                <div className="animate-spin rounded h-4 w-4 border-b-2 border-white mr-2"></div>
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
                    <div className="text-xs text-gray-500 text-center">
                        Powered by {provider} ({model})
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPromptBugReport;