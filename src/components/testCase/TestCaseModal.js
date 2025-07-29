'use client';

import { useState, useEffect, useCallback } from 'react';

export default function TestCaseModal({ testCase, onClose, onSave, activeSuite, currentUser }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'draft',
        assignee: '',
        tags: [],
        preconditions: '',
        testSteps: [{ action: '', expectedResult: '' }],
        automationStatus: 'none',
        executionType: 'manual',
        estimatedTime: '',
        environment: '',
        testData: '',
        linkedBugIds: [],
    });
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (testCase) {
            setFormData({
                ...testCase,
                testSteps: testCase.testSteps && testCase.testSteps.length > 0
                    ? testCase.testSteps
                    : [{ action: '', expectedResult: '' }],
                tags: testCase.tags || [],
                linkedBugIds: testCase.linkedBugIds || [],
            });
        }
    }, [testCase]);

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        const validTestSteps = formData.testSteps.filter(
            (step) => step.action.trim() || step.expectedResult.trim()
        );
        if (validTestSteps.length === 0) {
            newErrors.testSteps = 'At least one test step with action or expected result is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData.title, formData.testSteps]);

    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            status: 'draft',
            assignee: '',
            tags: [],
            preconditions: '',
            testSteps: [{ action: '', expectedResult: '' }],
            automationStatus: 'none',
            executionType: 'manual',
            estimatedTime: '',
            environment: '',
            testData: '',
            linkedBugIds: [],
        });
        setTagInput('');
        setErrors({});
    }, []);



    const handleInputChange = useCallback((field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    const handleAddTag = useCallback(() => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()],
            }));
            setTagInput('');
        }
    }, [tagInput, formData.tags]);

    const handleRemoveTag = useCallback((tagToRemove) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    }, []);

    const handleAddTestStep = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            testSteps: [...prev.testSteps, { action: '', expectedResult: '' }],
        }));
        if (errors.testSteps) {
            setErrors((prev) => ({ ...prev, testSteps: null }));
        }
    }, [errors]);

    const handleUpdateTestStep = useCallback((index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            testSteps: prev.testSteps.map((step, i) =>
                i === index ? { ...step, [field]: value } : step
            ),
        }));
        if (errors.testSteps) {
            setErrors((prev) => ({ ...prev, testSteps: null }));
        }
    }, [errors]);

    const handleRemoveTestStep = useCallback((index) => {
        if (formData.testSteps.length > 1) {
            setFormData((prev) => ({
                ...prev,
                testSteps: prev.testSteps.filter((_, i) => i !== index),
            }));
        }
    }, [formData.testSteps.length]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const validTestSteps = formData.testSteps.filter(
                (step) => step.action.trim() || step.expectedResult.trim()
            );

            const dataToSave = {
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim(),
                assignee: formData.assignee.trim(),
                preconditions: formData.preconditions.trim(),
                environment: formData.environment.trim(),
                testData: formData.testData.trim(),
                testSteps: validTestSteps.map((step) => ({
                    action: step.action.trim(),
                    expectedResult: step.expectedResult.trim(),
                })),
                estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime, 10) : null,
                suiteId: activeSuite.id,
                created_by: currentUser?.email || 'anonymous',
                linkedBugIds: formData.linkedBugIds || [],
                created_at: testCase ? testCase.created_at : new Date().toISOString(),
                updated_at: new Date().toISOString(),

            };

            await onSave(dataToSave);
            if (!testCase) {
                resetForm();
            }
            onClose();
        } catch (error) {
            console.error('TestCaseModal error:', {
                suiteId: activeSuite?.id,
                testCaseId: testCase?.id,
                errorMessage: error.message,
                user: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
            });
            setErrors({ submit: error.message || 'Failed to save test case' });
        } finally {
            setLoading(false);
        }
    }, [formData, testCase, onSave, validateForm, resetForm, onClose, activeSuite, currentUser]);

    console.log('Debug Info:', {
        activeSuite: activeSuite,
        currentUser: currentUser,
        formData: formData
    });


    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && e.target.name === 'tagInput') {
            e.preventDefault();
            handleAddTag();
        }
    }, [handleAddTag]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
                <div className="flex-shrink-0 border-b px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            {testCase ? 'Edit Test Case' : 'Create Test Case'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl p-1"
                            type="button"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Suite: {activeSuite?.name || activeSuite?.id}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                        <div className="space-y-6">
                            {errors.submit && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                    {errors.submit}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base`}
                                        placeholder="Enter test case title"
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        placeholder="Describe what this test case validates"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Priority
                                        </label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => handleInputChange('priority', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="active">Active</option>
                                            <option value="archived">Archived</option>
                                            <option value="deprecated">Deprecated</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Assignee
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.assignee}
                                            onChange={(e) => handleInputChange('assignee', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                            placeholder="Assign to team member"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Estimated Time (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.estimatedTime}
                                            onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                            placeholder="Execution time estimate"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 text-xs sm:text-sm rounded-full"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 text-teal-600 hover:text-teal-800"
                                                aria-label={`Remove tag ${tag}`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="tagInput"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        placeholder="Add tag and press Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm whitespace-nowrap"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Execution Type
                                    </label>
                                    <select
                                        value={formData.executionType}
                                        onChange={(e) => handleInputChange('executionType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                    >
                                        <option value="manual">Manual</option>
                                        <option value="automated">Automated</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Automation Status
                                    </label>
                                    <select
                                        value={formData.automationStatus}
                                        onChange={(e) => handleInputChange('automationStatus', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                    >
                                        <option value="none">None</option>
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Environment
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.environment}
                                        onChange={(e) => handleInputChange('environment', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        placeholder="e.g., Production, Staging, QA"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Test Data
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.testData}
                                        onChange={(e) => handleInputChange('testData', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        placeholder="Required test data or dataset reference"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preconditions
                                </label>
                                <textarea
                                    value={formData.preconditions}
                                    onChange={(e) => handleInputChange('preconditions', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                    placeholder="What needs to be set up or configured before executing this test"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Test Steps *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAddTestStep}
                                        className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                                    >
                                        Add Step
                                    </button>
                                </div>
                                {errors.testSteps && (
                                    <p className="text-red-500 text-xs mt-1">{errors.testSteps}</p>
                                )}
                                <div className="space-y-4">
                                    {formData.testSteps.map((step, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-gray-700">Step {index + 1}</h4>
                                                {formData.testSteps.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTestStep(index)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Action
                                                    </label>
                                                    <textarea
                                                        value={step.action || ''}
                                                        onChange={(e) => handleUpdateTestStep(index, 'action', e.target.value)}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                                        placeholder="Describe the action to perform"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Expected Result
                                                    </label>
                                                    <textarea
                                                        value={step.expectedResult || ''}
                                                        onChange={(e) => handleUpdateTestStep(index, 'expectedResult', e.target.value)}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                                        placeholder="What should happen"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="flex-shrink-0 border-t px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 text-sm"
                        >
                            {loading ? 'Saving...' : (testCase ? 'Update' : 'Create')} Test Case
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}