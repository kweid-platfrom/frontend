import React, { useState, useCallback } from 'react';
import { SparklesIcon, ClipboardDocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AIPromptBugReport = ({ onFormGeneration, isProcessing }) => {
    const [prompt, setPrompt] = useState('');
    const [consoleError, setConsoleError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() && !consoleError.trim()) return;

        setIsGenerating(true);
        
        try {
            // Simulate AI processing - replace with actual AI service call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const combinedInput = `${prompt}\n\nConsole Error:\n${consoleError}`.trim();
            
            // Mock AI response - replace with actual AI service
            const generatedForm = {
                title: extractTitle(combinedInput),
                description: prompt.trim() || "Issue description generated from console error",
                actualBehavior: extractActualBehavior(combinedInput),
                stepsToReproduce: extractStepsToReproduce(combinedInput),
                expectedBehavior: extractExpectedBehavior(combinedInput),
                severity: determineSeverity(combinedInput),
                category: determineCategory(combinedInput),
                workaround: "",
                hasConsoleLogs: !!consoleError.trim(),
                hasNetworkLogs: false
            };

            onFormGeneration(generatedForm);
            
            // Clear the form after successful generation
            setPrompt('');
            setConsoleError('');
            
        } catch (error) {
            console.error('Error generating bug report:', error);
            // Handle error appropriately
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, consoleError, onFormGeneration]);

    const extractTitle = (input) => {
        const lines = input.split('\n');
        const errorLine = lines.find(line => 
            line.includes('Error:') || 
            line.includes('TypeError:') || 
            line.includes('ReferenceError:') ||
            line.includes('Cannot read property') ||
            line.includes('is not defined')
        );
        
        if (errorLine) {
            return errorLine.split(':')[0] + ': ' + errorLine.split(':')[1]?.trim().substring(0, 50) + '...';
        }
        
        return input.split('\n')[0].substring(0, 60) + '...';
    };

    const extractActualBehavior = (input) => {
        if (input.includes('Error:') || input.includes('TypeError:') || input.includes('ReferenceError:')) {
            return "Application throws an error and functionality is broken.";
        }
        return "The application is not behaving as expected.";
    };

    const extractStepsToReproduce = () => {
        return `1. Navigate to the affected area\n2. Perform the action that triggers the issue\n3. Observe the error or unexpected behavior`;
    };

    const extractExpectedBehavior = () => {
        return "The application should function normally without errors.";
    };

    const determineSeverity = (input) => {
        if (input.toLowerCase().includes('critical') || input.toLowerCase().includes('crash')) {
            return 'Critical';
        }
        if (input.toLowerCase().includes('error') || input.toLowerCase().includes('exception')) {
            return 'High';
        }
        if (input.toLowerCase().includes('warning')) {
            return 'Medium';
        }
        return 'Low';
    };

    const determineCategory = (input) => {
        if (input.toLowerCase().includes('ui') || input.toLowerCase().includes('interface')) {
            return 'UI/UX';
        }
        if (input.toLowerCase().includes('api') || input.toLowerCase().includes('network')) {
            return 'Backend';
        }
        if (input.toLowerCase().includes('performance') || input.toLowerCase().includes('slow')) {
            return 'Performance';
        }
        return 'Functional';
    };

    const handlePasteConsoleError = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setConsoleError(text);
        } catch (error) {
            console.error('Failed to read clipboard:', error);
        }
    }, []);

    const isDisabled = isProcessing || isGenerating || (!prompt.trim() && !consoleError.trim());

    return (
        <div className="space-y-6">
            <div className="text-center">
                <SparklesIcon className="mx-auto h-12 w-12 text-purple-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Bug Report Generator</h3>
                <p className="text-sm text-gray-500">
                    Describe the issue or paste console errors, and AI will generate a detailed bug report
                </p>
            </div>

            <div className="space-y-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
                        disabled={isProcessing || isGenerating}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="console-error" className="block text-sm font-medium text-gray-700">
                            Console Error (Optional)
                        </label>
                        <button
                            type="button"
                            onClick={handlePasteConsoleError}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                            disabled={isProcessing || isGenerating}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical font-mono text-sm"
                        disabled={isProcessing || isGenerating}
                    />
                </div>

                {(prompt.trim() || consoleError.trim()) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-700">
                                <p className="font-medium">AI will analyze your input and generate:</p>
                                <ul className="mt-1 list-disc list-inside space-y-1">
                                    <li>Bug title and description</li>
                                    <li>Steps to reproduce</li>
                                    <li>Expected vs actual behavior</li>
                                    <li>Severity and category classification</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isDisabled}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            isDisabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="h-4 w-4 mr-2" />
                                Generate Bug Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIPromptBugReport;