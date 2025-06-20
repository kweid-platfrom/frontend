// components/TestCases/AIGenerationModal.js
'use client'

import { useState } from 'react';
import { X, Wand2, FileText, Settings, Zap } from 'lucide-react';

export default function AIGenerationModal({ onClose, onGenerationComplete }) {
    const [step, setStep] = useState(1); // 1: Configuration, 2: Generating, 3: Review
    const [config, setConfig] = useState({
        feature: '',
        testType: 'functional',
        priority: 'medium',
        count: 10,
        includeNegative: true,
        includeEdgeCases: true,
        includeApiTests: false,
        includeUiTests: true,
        framework: 'generic',
        additionalContext: ''
    });
    const [generatedTestCases, setGeneratedTestCases] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [selectedTestCases, setSelectedTestCases] = useState(new Set());

    const testTypes = [
        { value: 'functional', label: 'Functional Testing' },
        { value: 'integration', label: 'Integration Testing' },
        { value: 'unit', label: 'Unit Testing' },
        { value: 'e2e', label: 'End-to-End Testing' },
        { value: 'performance', label: 'Performance Testing' },
        { value: 'security', label: 'Security Testing' },
        { value: 'accessibility', label: 'Accessibility Testing' }
    ];

    const frameworks = [
        { value: 'generic', label: 'Generic Test Cases' },
        { value: 'selenium', label: 'Selenium WebDriver' },
        { value: 'cypress', label: 'Cypress' },
        { value: 'playwright', label: 'Playwright' },
        { value: 'jest', label: 'Jest' },
        { value: 'postman', label: 'Postman/API Testing' }
    ];

    const handleGenerate = async () => {
        setGenerating(true);
        setStep(2);

        try {
            // Simulate AI generation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Generate mock test cases based on config
            const mockTestCases = generateMockTestCases(config);
            setGeneratedTestCases(mockTestCases);
            setSelectedTestCases(new Set(mockTestCases.map(tc => tc.id)));
            setStep(3);
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate test cases. Please try again.');
            setStep(1);
        } finally {
            setGenerating(false);
        }
    };

    const generateMockTestCases = (config) => {
        const feature = config.feature || 'Feature';
        
        // Basic positive test cases
        const positiveTests = [
            {
                title: `${feature} - Valid Input Acceptance`,
                description: `Verify that ${feature} accepts valid input data and processes it correctly`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'User is logged in and has necessary permissions',
                steps: [
                    'Navigate to the feature page',
                    'Enter valid input data',
                    'Click submit/save button',
                    'Verify success message appears'
                ],
                expectedResult: 'Feature accepts valid input and displays success confirmation'
            },
            {
                title: `${feature} - Data Persistence`,
                description: `Verify that data entered in ${feature} is properly saved and retrievable`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'Database is accessible and user has write permissions',
                steps: [
                    'Enter data in the feature form',
                    'Save the data',
                    'Navigate away from the page',
                    'Return to the feature page',
                    'Verify data is still present'
                ],
                expectedResult: 'Data is properly saved and can be retrieved'
            }
        ];

        // Negative test cases
        const negativeTests = config.includeNegative ? [
            {
                title: `${feature} - Invalid Input Handling`,
                description: `Verify that ${feature} properly handles invalid input data`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'User is on the feature page',
                steps: [
                    'Enter invalid data (empty, special characters, etc.)',
                    'Attempt to submit',
                    'Verify error message appears',
                    'Verify data is not saved'
                ],
                expectedResult: 'System displays appropriate error message and prevents invalid data submission'
            },
            {
                title: `${feature} - Unauthorized Access`,
                description: `Verify that ${feature} prevents unauthorized access`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'User is not logged in or lacks permissions',
                steps: [
                    'Attempt to access the feature directly',
                    'Verify access is denied',
                    'Check for appropriate error message'
                ],
                expectedResult: 'Access is denied and appropriate error message is displayed'
            }
        ] : [];

        // Edge case tests
        const edgeCaseTests = config.includeEdgeCases ? [
            {
                title: `${feature} - Boundary Value Testing`,
                description: `Verify that ${feature} handles boundary values correctly`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'Feature is accessible',
                steps: [
                    'Test with minimum allowed values',
                    'Test with maximum allowed values',
                    'Test with values just outside boundaries',
                    'Verify appropriate handling in each case'
                ],
                expectedResult: 'Boundary values are handled correctly with appropriate validation'
            }
        ] : [];

        // API tests
        const apiTests = config.includeApiTests ? [
            {
                title: `${feature} API - Successful Response`,
                description: `Verify that ${feature} API returns correct response for valid requests`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'API is running and accessible',
                steps: [
                    'Send valid API request',
                    'Verify response status code is 200',
                    'Verify response contains expected data',
                    'Verify response time is acceptable'
                ],
                expectedResult: 'API returns successful response with correct data'
            }
        ] : [];

        // UI tests
        const uiTests = config.includeUiTests ? [
            {
                title: `${feature} UI - Element Visibility`,
                description: `Verify that all UI elements in ${feature} are properly displayed`,
                priority: config.priority,
                status: 'draft',
                preconditions: 'Browser is open and feature is loaded',
                steps: [
                    'Load the feature page',
                    'Verify all buttons are visible',
                    'Verify all input fields are present',
                    'Verify page layout is correct'
                ],
                expectedResult: 'All UI elements are properly displayed and accessible'
            }
        ] : [];

        // Combine all test types
        const allTests = [...positiveTests, ...negativeTests, ...edgeCaseTests, ...apiTests, ...uiTests];
        
        // Return requested number of tests
        return allTests.slice(0, config.count).map((test, index) => ({
            ...test,
            id: `generated-${index + 1}`,
            tags: [config.testType, 'generated', 'ai'],
            assignee: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
    };

    const handleTestCaseSelection = (testCaseId) => {
        setSelectedTestCases(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testCaseId)) {
                newSet.delete(testCaseId);
            } else {
                newSet.add(testCaseId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedTestCases.size === generatedTestCases.length) {
            setSelectedTestCases(new Set());
        } else {
            setSelectedTestCases(new Set(generatedTestCases.map(tc => tc.id)));
        }
    };

    const handleSaveSelected = () => {
        const selectedTests = generatedTestCases.filter(tc => selectedTestCases.has(tc.id));
        onGenerationComplete(selectedTests);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <Wand2 className="h-6 w-6 text-purple-600" />
                        <h2 className="text-xl font-semibold">AI Test Case Generation</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                                <Settings size={16} />
                            </div>
                            <span className="text-sm font-medium">Configure</span>
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                                <Zap size={16} />
                            </div>
                            <span className="text-sm font-medium">Generate</span>
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                                <FileText size={16} />
                            </div>
                            <span className="text-sm font-medium">Review</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Step 1: Configuration */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Configure Test Generation</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Feature/Component Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={config.feature}
                                            onChange={(e) => setConfig(prev => ({ ...prev, feature: e.target.value }))}
                                            placeholder="e.g., User Registration, Shopping Cart"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Test Type
                                        </label>
                                        <select
                                            value={config.testType}
                                            onChange={(e) => setConfig(prev => ({ ...prev, testType: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            {testTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Priority Level
                                        </label>
                                        <select
                                            value={config.priority}
                                            onChange={(e) => setConfig(prev => ({ ...prev, priority: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Number of Test Cases
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={config.count}
                                            onChange={(e) => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Test Framework
                                        </label>
                                        <select
                                            value={config.framework}
                                            onChange={(e) => setConfig(prev => ({ ...prev, framework: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            {frameworks.map(framework => (
                                                <option key={framework.value} value={framework.value}>
                                                    {framework.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Test Options */}
                                <div className="mt-6">
                                    <h4 className="text-md font-medium mb-3">Test Coverage Options</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={config.includeNegative}
                                                onChange={(e) => setConfig(prev => ({ ...prev, includeNegative: e.target.checked }))}
                                                className="mr-3"
                                            />
                                            <span className="text-sm">Include negative test cases</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={config.includeEdgeCases}
                                                onChange={(e) => setConfig(prev => ({ ...prev, includeEdgeCases: e.target.checked }))}
                                                className="mr-3"
                                            />
                                            <span className="text-sm">Include edge cases and boundary testing</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={config.includeApiTests}
                                                onChange={(e) => setConfig(prev => ({ ...prev, includeApiTests: e.target.checked }))}
                                                className="mr-3"
                                            />
                                            <span className="text-sm">Include API testing scenarios</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={config.includeUiTests}
                                                onChange={(e) => setConfig(prev => ({ ...prev, includeUiTests: e.target.checked }))}
                                                className="mr-3"
                                            />
                                            <span className="text-sm">Include UI testing scenarios</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Additional Context */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Context (Optional)
                                    </label>
                                    <textarea
                                        value={config.additionalContext}
                                        onChange={(e) => setConfig(prev => ({ ...prev, additionalContext: e.target.value }))}
                                        placeholder="Provide any additional context, requirements, or specific scenarios you want to include..."
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Generating */}
                    {step === 2 && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <h3 className="text-xl font-semibold mb-2">Generating Test Cases</h3>
                            <p className="text-gray-600">
                                AI is analyzing your requirements and generating {config.count} test cases...
                            </p>
                            <div className="mt-6 max-w-md mx-auto">
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Generated Test Cases</h3>
                                    <p className="text-sm text-gray-600">
                                        Review and select the test cases you want to add to your project
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-sm text-purple-600 hover:text-purple-700"
                                    >
                                        {selectedTestCases.size === generatedTestCases.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <div className="text-sm text-gray-600">
                                        {selectedTestCases.size} of {generatedTestCases.length} selected
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {generatedTestCases.map((testCase) => (
                                    <div
                                        key={testCase.id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                            selectedTestCases.has(testCase.id)
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleTestCaseSelection(testCase.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedTestCases.has(testCase.id)}
                                                onChange={() => handleTestCaseSelection(testCase.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium">{testCase.title}</h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        testCase.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {testCase.priority}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{testCase.description}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {testCase.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                    <div>
                        {step === 3 && (
                            <button
                                onClick={() => setStep(1)}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                ← Back to Configuration
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={generating}
                        >
                            Cancel
                        </button>
                        {step === 1 && (
                            <button
                                onClick={handleGenerate}
                                disabled={!config.feature.trim() || generating}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Generate Test Cases
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                onClick={handleSaveSelected}
                                disabled={selectedTestCases.size === 0}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Selected ({selectedTestCases.size})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}