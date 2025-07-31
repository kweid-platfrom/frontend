'use client'
import React, { useState, useCallback } from 'react';
import {
    Wand2,
    X,
    Settings,
    Save,
    Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppProvider'; // Import real useApp hook

// TestCaseCard component (unchanged)
const TestCaseCard = ({ testCase, onToggleSelect, isSelected, onEdit }) => {
    const priorityColors = {
        Critical: 'text-red-600 bg-red-50 border-red-200',
        High: 'text-orange-600 bg-orange-50 border-orange-200',
        Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        Low: 'text-green-600 bg-green-50 border-green-200'
    };

    const typeColors = {
        Functional: 'text-blue-600 bg-blue-50',
        Integration: 'text-purple-600 bg-purple-50',
        Negative: 'text-red-600 bg-red-50',
        'Edge Case': 'text-orange-600 bg-orange-50',
        Performance: 'text-green-600 bg-green-50',
        Security: 'text-indigo-600 bg-indigo-50'
    };

    return (
        <div className={`border rounded-lg p-4 transition-all ${isSelected ? 'border-teal-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(testCase.id)}
                    className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{testCase.title}</h4>
                        <div className="flex gap-1 ml-2">
                            <span className={`px-2 py-1 text-xs rounded-full border ${priorityColors[testCase.priority] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                {testCase.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${typeColors[testCase.type] || 'text-gray-600 bg-gray-50'}`}>
                                {testCase.type}
                            </span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{testCase.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <span className="ml-1 text-gray-600">{testCase.category}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Estimated Time:</span>
                            <span className="ml-1 text-gray-600">{testCase.estimatedTime}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Automation:</span>
                            <span className="ml-1 text-gray-600">{testCase.automationPotential}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Risk Level:</span>
                            <span className="ml-1 text-gray-600">{testCase.riskLevel}</span>
                        </div>
                    </div>

                    {testCase.tags && testCase.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {testCase.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => onEdit(testCase)}
                            className="text-teal-600 hover:text-teal-800 text-xs font-medium"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// TestCaseDetailModal component (unchanged)
const TestCaseDetailModal = ({ testCase, onClose, onSave }) => {
    const [editedTestCase, setEditedTestCase] = useState(testCase);

    const handleFieldChange = (field, value) => {
        setEditedTestCase(prev => ({ ...prev, [field]: value }));
    };

    const handleStepsChange = (index, value) => {
        const newSteps = [...editedTestCase.steps];
        newSteps[index] = value;
        setEditedTestCase(prev => ({ ...prev, steps: newSteps }));
    };

    const addStep = () => {
        setEditedTestCase(prev => ({
            ...prev,
            steps: [...prev.steps, '']
        }));
    };

    const removeStep = (index) => {
        setEditedTestCase(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Test Case Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={editedTestCase.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={editedTestCase.priority}
                                onChange={(e) => handleFieldChange('priority', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={editedTestCase.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preconditions</label>
                        <textarea
                            value={editedTestCase.preconditions}
                            onChange={(e) => handleFieldChange('preconditions', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-16 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Test Steps</label>
                            <button
                                onClick={addStep}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Add Step
                            </button>
                        </div>
                        <div className="space-y-2">
                            {editedTestCase.steps.map((step, index) => (
                                <div key={index} className="flex gap-2">
                                    <span className="text-sm text-gray-500 mt-2 min-w-[20px]">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={step}
                                        onChange={(e) => handleStepsChange(index, e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Step ${index + 1}`}
                                    />
                                    <button
                                        onClick={() => removeStep(index)}
                                        className="text-red-600 hover:text-red-800 px-2"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
                        <textarea
                            value={editedTestCase.expectedResult}
                            onChange={(e) => handleFieldChange('expectedResult', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-16 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Data</label>
                        <textarea
                            value={editedTestCase.testData}
                            onChange={(e) => handleFieldChange('testData', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-16 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(editedTestCase)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// AIGenerationModal component
export default function AIGenerationModal({ onClose, onGenerationComplete }) {
    const { actions, state } = useApp(); // Use real AppProvider context
    const [step, setStep] = useState('input'); // 'input', 'generating', 'review', 'saving'
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTestCases, setGeneratedTestCases] = useState([]);
    const [selectedTestCases, setSelectedTestCases] = useState(new Set());
    const [generationSummary, setGenerationSummary] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);

    const [templateConfig, setTemplateConfig] = useState({
        format: 'Given-When-Then',
        priorities: 'Critical, High, Medium, Low',
        types: 'Functional, Integration, Edge Case, Negative, Performance',
        includeTestData: true,
        framework: 'Generic',
        coverage: 'Standard',
        temperature: 0.6,
        maxTokens: 3000
    });
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Prompt is required for test case generation'
            });
            return;
        }

        setIsGenerating(true);
        setStep('generating');

        try {
            const result = await actions.ai.generateTestCasesWithAI(
                prompt,
                'AI Generated Test Cases',
                templateConfig
            );

            if (result.success && result.data?.testCases?.length > 0) {
                setGeneratedTestCases(result.data.testCases);
                setGenerationSummary(result.data.summary || null);
                setSelectedTestCases(new Set(result.data.testCases.map(tc => tc.id)));
                setStep('review');

                actions.ui.showNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Generated ${result.data.testCases.length} test cases`
                });
            } else {
                throw new Error(result.error || 'Failed to generate test cases');
            }
        } catch (error) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Generation Error',
                message: error.message
            });
            setStep('input');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, templateConfig, actions]);

    const handleToggleSelect = useCallback((testCaseId) => {
        setSelectedTestCases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testCaseId)) {
                newSet.delete(testCaseId);
            } else {
                newSet.add(testCaseId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedTestCases.size === generatedTestCases.length) {
            setSelectedTestCases(new Set());
        } else {
            setSelectedTestCases(new Set(generatedTestCases.map(tc => tc.id)));
        }
    }, [selectedTestCases.size, generatedTestCases]);

    const handleSaveSelected = useCallback(async () => {
        const testCasesToSave = generatedTestCases.filter(tc => selectedTestCases.has(tc.id));

        if (testCasesToSave.length === 0) {
            actions.ui.showNotification({
                type: 'warning',
                title: 'No Selection',
                message: 'Please select at least one test case to save'
            });
            return;
        }

        setIsSaving(true);
        setStep('saving');
        setSavedCount(0);

        try {
            let successCount = 0;
            let failCount = 0;

            for (const testCase of testCasesToSave) {
                try {
                    const result = await actions.testCases.createTestCase({
                        ...testCase,
                        suiteId: state.suites.activeSuite?.id,
                        source: 'ai_generated',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                    if (result.success) {
                        successCount++;
                        setSavedCount(successCount);
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    console.error('Error saving test case:', error);
                    failCount++;
                }
            }

            if (successCount > 0) {
                actions.ui.showNotification({
                    type: 'success',
                    title: 'Test Cases Saved',
                    message: `Successfully saved ${successCount} test case${successCount === 1 ? '' : 's'}${failCount > 0 ? `, ${failCount} failed` : ''}`
                });

                if (onGenerationComplete) {
                    onGenerationComplete(testCasesToSave);
                }

                onClose();
            } else {
                throw new Error('Failed to save any test cases');
            }
        } catch (error) {
            actions.ui.showNotification({
                type: 'error',
                title: 'Save Error',
                message: error.message || 'Failed to save test cases'
            });
            setStep('review');
        } finally {
            setIsSaving(false);
        }
    }, [generatedTestCases, selectedTestCases, actions, state.suites.activeSuite?.id, onGenerationComplete, onClose]);

    const handleEditTestCase = useCallback((testCase) => {
        setSelectedTestCase(testCase);
        setShowDetailModal(true);
    }, []);

    const handleSaveTestCase = useCallback((editedTestCase) => {
        setGeneratedTestCases(prev =>
            prev.map(tc => tc.id === editedTestCase.id ? editedTestCase : tc)
        );
        setShowDetailModal(false);
        setSelectedTestCase(null);
    }, []);

    const handleConfigChange = useCallback((field, value) => {
        setTemplateConfig(prev => ({ ...prev, [field]: value }));
    }, []);

    const renderInputStep = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements / User Story *
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter requirements, user story, or feature description for test case generation..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-40 resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                />
            </div>

            <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                disabled={isGenerating}
            >
                <Settings size={16} />
                {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>

            {showAdvancedSettings && (
                <div className="border border-gray-200 rounded-md p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                            <select
                                value={templateConfig.format}
                                onChange={(e) => handleConfigChange('format', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="Given-When-Then">Given-When-Then</option>
                                <option value="BDD">BDD</option>
                                <option value="Standard">Standard</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                            <select
                                value={templateConfig.framework}
                                onChange={(e) => handleConfigChange('framework', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="Generic">Generic</option>
                                <option value="Cypress">Cypress</option>
                                <option value="Selenium">Selenium</option>
                                <option value="Playwright">Playwright</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Types</label>
                        <input
                            type="text"
                            value={templateConfig.types}
                            onChange={(e) => handleConfigChange('types', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={templateConfig.includeTestData}
                            onChange={(e) => handleConfigChange('includeTestData', e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">Include Test Data</label>
                    </div>
                </div>
            )}
        </div>
    );

    const renderGeneratingStep = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-pulse">
                <Wand2 className="h-12 w-12 text-purple-600 mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Test Cases...</h3>
            <p className="text-gray-600 text-center">
                AI is analyzing your requirements and creating comprehensive test cases.
                <br />
                This may take a few moments.
            </p>
            <div className="mt-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-500">Please wait...</span>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-4">
            {generationSummary && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Generation Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Total Tests:</span>
                            <span className="ml-2 font-medium">{generationSummary.totalTests}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Functional:</span>
                            <span className="ml-2 font-medium">{generationSummary.breakdown?.functional || 0}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Integration:</span>
                            <span className="ml-2 font-medium">{generationSummary.breakdown?.integration || 0}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Edge Cases:</span>
                            <span className="ml-2 font-medium">{generationSummary.breakdown?.edgeCase || 0}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">Generated Test Cases ({generatedTestCases.length})</h4>
                    <span className="text-sm text-gray-500">
                        {selectedTestCases.size} selected
                    </span>
                </div>
                <button
                    onClick={handleSelectAll}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                    {selectedTestCases.size === generatedTestCases.length ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
                {generatedTestCases.map((testCase) => (
                    <TestCaseCard
                        key={testCase.id}
                        testCase={testCase}
                        isSelected={selectedTestCases.has(testCase.id)}
                        onToggleSelect={handleToggleSelect}
                        onEdit={handleEditTestCase}
                    />
                ))}
            </div>
        </div>
    );

    const renderSavingStep = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-pulse">
                <Save className="h-12 w-12 text-green-600 mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Saving Test Cases...</h3>
            <p className="text-gray-600 text-center mb-4">
                Saving {selectedTestCases.size} test case{selectedTestCases.size === 1 ? '' : 's'} to your test suite.
            </p>
            <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-sm text-gray-500">
                    Saved {savedCount} of {selectedTestCases.size} test cases
                </span>
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-purple-600" />
                            <h2 className="text-lg font-semibold">AI Test Case Generation</h2>
                            {step === 'review' && (
                                <span className="text-sm text-gray-500">
                                    - Review and Save
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isGenerating || isSaving}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {step === 'input' && renderInputStep()}
                        {step === 'generating' && renderGeneratingStep()}
                        {step === 'review' && renderReviewStep()}
                        {step === 'saving' && renderSavingStep()}
                    </div>

                    <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                        <div>
                            {step === 'generating' && (
                                <div className="text-sm text-gray-600">
                                    Generating test cases with AI...
                                </div>
                            )}
                            {step === 'review' && (
                                <div className="text-sm text-gray-600">
                                    {selectedTestCases.size} of {generatedTestCases.length} test cases selected
                                </div>
                            )}
                            {step === 'saving' && (
                                <div className="text-sm text-gray-600">
                                    Saving to {state.suites.activeSuite?.name || 'Active Suite'}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {step === 'input' && (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                        disabled={isGenerating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isGenerating || !prompt.trim()}
                                    >
                                        <Wand2 size={16} />
                                        Generate Test Cases
                                    </button>
                                </>
                            )}

                            {step === 'review' && (
                                <>
                                    <button
                                        onClick={() => setStep('input')}
                                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Back to Edit
                                    </button>
                                    <button
                                        onClick={handleSaveSelected}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={selectedTestCases.size === 0}
                                    >
                                        <Save size={16} />
                                        Save Selected ({selectedTestCases.size})
                                    </button>
                                </>
                            )}

                            {(step === 'generating' || step === 'saving') && (
                                <button
                                    disabled
                                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed flex items-center gap-2"
                                >
                                    <Loader2 size={16} className="animate-spin" />
                                    {step === 'generating' ? 'Generating...' : 'Saving...'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDetailModal && selectedTestCase && (
                <TestCaseDetailModal
                    testCase={selectedTestCase}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedTestCase(null);
                    }}
                    onSave={handleSaveTestCase}
                />
            )}
        </>
    );
}