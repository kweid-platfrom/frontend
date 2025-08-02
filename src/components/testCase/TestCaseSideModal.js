'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

const TestCaseSideModal = ({ isOpen, testCase, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        preconditions: '',
        steps: [{ action: '', expectedResult: '' }],
        priority: 'medium',
        severity: 'medium',
        status: 'draft',
        assignee: '',
        component: '',
        testType: 'functional',
        environment: 'testing',
        estimatedTime: '',
        tags: [],
        executionStatus: 'not_executed',
    });

    const [originalData, setOriginalData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form data when testCase changes
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
            };
            setFormData(data);
            setOriginalData(data);
            setHasChanges(false);
        }
    }, [testCase]);

    // Check for changes
    useEffect(() => {
        const hasChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
        setHasChanges(hasChanged);
    }, [formData, originalData]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleStepChange = useCallback((index, field, value) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.map((step, i) => 
                i === index ? { ...step, [field]: value } : step
            )
        }));
    }, []);

    const addStep = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { action: '', expectedResult: '' }]
        }));
    }, []);

    const removeStep = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    }, []);

    const handleTagsChange = useCallback((value) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
        handleInputChange('tags', tags);
    }, [handleInputChange]);

    const handleSave = useCallback(() => {
        const updatedTestCase = {
            ...testCase,
            ...formData,
        };
        onSave(updatedTestCase);
    }, [testCase, formData, onSave]);

    const handleCancel = useCallback(() => {
        setFormData(originalData);
        setHasChanges(false);
    }, [originalData]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {testCase?.title || 'Test Case Details'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Enter test case title..."
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Enter test case description..."
                            />
                        </div>

                        {/* Preconditions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preconditions
                            </label>
                            <textarea
                                value={formData.preconditions}
                                onChange={(e) => handleInputChange('preconditions', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="Enter preconditions..."
                            />
                        </div>

                        {/* Test Steps */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Test Steps
                                </label>
                                <button
                                    onClick={addStep}
                                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                                >
                                    + Add Step
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.steps.map((step, index) => (
                                    <div key={index} className="border border-gray-200 rounded-md p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                Step {index + 1}
                                            </span>
                                            {formData.steps.length > 1 && (
                                                <button
                                                    onClick={() => removeStep(index)}
                                                    className="text-sm text-red-600 hover:text-red-700"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <textarea
                                                value={step.action}
                                                onChange={(e) => handleStepChange(index, 'action', e.target.value)}
                                                rows={2}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                placeholder="Action to perform..."
                                            />
                                            <textarea
                                                value={step.expectedResult}
                                                onChange={(e) => handleStepChange(index, 'expectedResult', e.target.value)}
                                                rows={2}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                placeholder="Expected result..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Priority and Severity */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => handleInputChange('priority', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Severity
                                </label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => handleInputChange('severity', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Status and Assignee */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                    <option value="deprecated">Deprecated</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assignee
                                </label>
                                <input
                                    type="text"
                                    value={formData.assignee}
                                    onChange={(e) => handleInputChange('assignee', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Assign to..."
                                />
                            </div>
                        </div>

                        {/* Component and Test Type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Component
                                </label>
                                <input
                                    type="text"
                                    value={formData.component}
                                    onChange={(e) => handleInputChange('component', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="Component name..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Test Type
                                </label>
                                <select
                                    value={formData.testType}
                                    onChange={(e) => handleInputChange('testType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="functional">Functional</option>
                                    <option value="integration">Integration</option>
                                    <option value="unit">Unit</option>
                                    <option value="regression">Regression</option>
                                    <option value="performance">Performance</option>
                                    <option value="security">Security</option>
                                    <option value="ui">UI</option>
                                    <option value="api">API</option>
                                </select>
                            </div>
                        </div>

                        {/* Environment and Estimated Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Environment
                                </label>
                                <select
                                    value={formData.environment}
                                    onChange={(e) => handleInputChange('environment', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="testing">Testing</option>
                                    <option value="staging">Staging</option>
                                    <option value="production">Production</option>
                                    <option value="development">Development</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Est. Time (min)
                                </label>
                                <input
                                    type="number"
                                    value={formData.estimatedTime}
                                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="15"
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <input
                                type="text"
                                value={formData.tags.join(', ')}
                                onChange={(e) => handleTagsChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="tag1, tag2, tag3"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex justify-between">
                            <button
                                onClick={handleCancel}
                                disabled={!hasChanges}
                                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md transition-colors ${
                                    hasChanges 
                                        ? 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                }`}
                            >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                                    hasChanges
                                        ? 'text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                <Save className="w-4 h-4 mr-1" />
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TestCaseSideModal;