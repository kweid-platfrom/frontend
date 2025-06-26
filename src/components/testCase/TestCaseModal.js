    // components/TestCases/TestCaseModal.js
    'use client'

    import { useState, useEffect } from 'react';
    import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
    import { toast } from 'sonner';
    import { db } from '../../config/firebase';
    import { useProject } from '../../context/SuiteContext';

    export default function TestCaseModal({ testCase, onClose, onSave, projectId }) {
        // Use useProject instead of useAuth
        const { user, userProfile, activeProject } = useProject();
        
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
            attachments: []
        });
        const [tagInput, setTagInput] = useState('');
        const [loading, setLoading] = useState(false);

        // Get the project ID from props or active project
        const effectiveProjectId = projectId || activeProject?.id;

        useEffect(() => {
            if (testCase) {
                setFormData({
                    ...testCase,
                    testSteps: testCase.testSteps || [{ action: '', expectedResult: '' }]
                });
            }
        }, [testCase]);

        const handleInputChange = (field, value) => {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleAddTag = () => {
            if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }));
                setTagInput('');
            }
        };

        const handleRemoveTag = (tagToRemove) => {
            setFormData(prev => ({
                ...prev,
                tags: prev.tags.filter(tag => tag !== tagToRemove)
            }));
        };

        const handleAddTestStep = () => {
            setFormData(prev => ({
                ...prev,
                testSteps: [...prev.testSteps, { action: '', expectedResult: '' }]
            }));
        };

        const handleUpdateTestStep = (index, field, value) => {
            setFormData(prev => ({
                ...prev,
                testSteps: prev.testSteps.map((step, i) => 
                    i === index ? { ...step, [field]: value } : step
                )
            }));
        };

        const handleRemoveTestStep = (index) => {
            if (formData.testSteps.length > 1) {
                setFormData(prev => ({
                    ...prev,
                    testSteps: prev.testSteps.filter((_, i) => i !== index)
                }));
            }
        };

        const saveToFirestore = async (testCaseData) => {
            try {
                // Better validation with specific error messages
                if (!user?.uid) {
                    throw new Error('User not authenticated. Please log in again.');
                }

                if (!effectiveProjectId) {
                    throw new Error('No project selected. Please select a project first.');
                }

                const testCaseId = testCase?.id || `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const testCaseRef = doc(db, 'projects', effectiveProjectId, 'testCases', testCaseId);

                // Get user display name
                const userDisplayName = userProfile?.displayName || 
                                    `${userProfile?.firstName} ${userProfile?.lastName}`.trim() || 
                                    user.email || 
                                    'Unknown User';

                const firestoreData = {
                    ...testCaseData,
                    id: testCaseId,
                    projectId: effectiveProjectId,
                    createdBy: user.uid,
                    createdByName: userDisplayName,
                    createdAt: testCase ? undefined : serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid,
                    updatedByName: userDisplayName,
                    version: (testCase?.version || 0) + 1,
                    // Add search-friendly fields
                    searchTerms: [
                        testCaseData.title?.toLowerCase(),
                        testCaseData.description?.toLowerCase(),
                        ...testCaseData.tags.map(tag => tag.toLowerCase()),
                        testCaseData.assignee?.toLowerCase(),
                        testCaseData.environment?.toLowerCase()
                    ].filter(Boolean),
                    // Add execution tracking
                    executionHistory: testCase?.executionHistory || [],
                    lastExecuted: testCase?.lastExecuted || null,
                    executionCount: testCase?.executionCount || 0
                };

                if (testCase) {
                    // Update existing test case
                    const updateData = { ...firestoreData };
                    delete updateData.createdAt;
                    delete updateData.createdBy;
                    delete updateData.createdByName;
                    
                    await updateDoc(testCaseRef, updateData);
                    toast.success('Test case updated successfully');
                } else {
                    // Create new test case
                    await setDoc(testCaseRef, firestoreData);
                    toast.success('Test case created successfully');
                }

                return { success: true, data: firestoreData };
            } catch (error) {
                console.error('Error saving test case to Firestore:', error);
                
                // Show user-friendly error message
                const errorMessage = error.message || 'Failed to save test case';
                toast.error(errorMessage);
                
                throw new Error(errorMessage);
            }
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            
            // Early validation to prevent submission
            if (!user?.uid) {
                toast.error('Please log in to save test cases');
                return;
            }

            if (!effectiveProjectId) {
                toast.error('Please select a project first');
                return;
            }

            setLoading(true);
            
            try {
                // Validate required fields
                if (!formData.title.trim()) {
                    toast.error('Test case title is required');
                    return;
                }

                // Clean and validate test steps
                const validTestSteps = formData.testSteps.filter(step => 
                    step.action.trim() || step.expectedResult.trim()
                );

                if (validTestSteps.length === 0) {
                    toast.error('At least one test step with action or expected result is required');
                    return;
                }

                const dataToSave = {
                    ...formData,
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    assignee: formData.assignee.trim(),
                    preconditions: formData.preconditions.trim(),
                    environment: formData.environment.trim(),
                    testData: formData.testData.trim(),
                    testSteps: validTestSteps.map(step => ({
                        action: step.action.trim(),
                        expectedResult: step.expectedResult.trim()
                    })),
                    estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null
                };

                const result = await saveToFirestore(dataToSave);
                
                if (onSave) {
                    await onSave(result.data);
                }
                
                onClose();
            } catch (error) {
                console.error('Error saving test case:', error);
                // Error toast is already shown in saveToFirestore
            } finally {
                setLoading(false);
            }
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && e.target.name === 'tagInput') {
                e.preventDefault();
                handleAddTag();
            }
        };

        // Show loading or error state if user/project data is not available
        if (!user) {
            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Required</h2>
                        <p className="text-gray-600 mb-4">Please log in to create or edit test cases.</p>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 border-b px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {testCase ? 'Edit Test Case' : 'Create Test Case'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl p-1"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                        {/* Show project info */}
                        {effectiveProjectId && (
                            <p className="text-sm text-gray-500 mt-1">
                                Project: {activeProject?.name || effectiveProjectId}
                            </p>
                        )}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                            placeholder="Enter test case title"
                                        />
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

                                {/* Tags */}
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

                                {/* Test Configuration */}
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
                                            placeholder="Required test data or data set reference"
                                        />
                                    </div>
                                </div>

                                {/* Preconditions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preconditions
                                    </label>
                                    <textarea
                                        value={formData.preconditions}
                                        onChange={(e) => handleInputChange('preconditions', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                                        placeholder="What needs to be set up or configured before executing this test"
                                    />
                                </div>

                                {/* Test Steps */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Test Steps
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddTestStep}
                                            className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                                        >
                                            Add Step
                                        </button>
                                    </div>
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
                                                            value={step.action}
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
                                                            value={step.expectedResult}
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

                    {/* Fixed Footer */}
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
                                disabled={loading || !user || !effectiveProjectId}
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