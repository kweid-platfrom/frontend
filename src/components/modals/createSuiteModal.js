'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppProvider';
import { toast } from 'sonner';
import { useFirebaseOperation } from '../../utils/firebaseErrorHandler';
import firestoreService from '../../services/firestoreService';

const CreateSuiteModal = ({
    isOpen,
    onSuiteCreated,
    onCancel,
    isRequired = false,
    accountType,
}) => {
    const { actions, state } = useApp();
    const { executeOperation, loading: isSubmitting } = useFirebaseOperation();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false,
        tags: [],
    });
    const [errors, setErrors] = useState({});

    const planLimits = state?.subscription?.planLimits || {
        maxSuites: 999,
        maxTestCasesPerSuite: 999,
        canCreateTestCases: true,
        canUseRecordings: true,
        canUseAutomation: true,
        canInviteTeam: true,
        canExportReports: true,
        canCreateOrganizations: true,
        advancedAnalytics: true,
        prioritySupport: true,
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Suite name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Suite name must be at least 3 characters';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = 'Suite name must be less than 50 characters';
        }

        if (formData.description && formData.description.length > 200) {
            newErrors.description = 'Description must be less than 200 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const currentSuites = state?.suites?.testSuites || [];
        if (currentSuites.length >= planLimits.maxSuites && !isRequired) {
            actions.ui.showNotification({
                id: 'max-suites-reached',
                type: 'warning',
                message: `You have reached the maximum number of test suites (${planLimits.maxSuites}) for your plan.`,
                duration: 10000,
            });
            return;
        }

        const suiteData = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            ownerType: accountType || state?.auth?.accountType || 'individual',
            ownerId: state?.auth?.currentUser?.uid,
            tags: formData.tags.filter((tag) => tag.trim() !== ''),
            status: 'active',
        };

        await executeOperation(
            () => firestoreService.createTestSuite(suiteData),
            () => {
                toast.success('Test suite created successfully', { duration: 5000 });
                onSuiteCreated?.(suiteData);
                setFormData({ name: '', description: '', isPublic: false, tags: [] });
                if (!isRequired) {
                    onCancel?.();
                }
            },
            (errorMessage) => {
                setErrors({ submit: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
            }
        );
    };

    const handleCancel = () => {
        if (!isRequired) {
            onCancel?.();
        }
    };

    if (!isOpen || state?.subscription?.loading) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={handleCancel}
                ></div>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {isRequired ? 'Create Your First Test Suite' : 'Create New Test Suite'}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {isRequired
                                            ? 'A test suite is required to access the platform. Create your workspace to get started.'
                                            : 'Create a new test suite to organize your test cases, bugs, and reports.'}
                                    </p>
                                    <p className="text-xs text-teal-600 mt-1">
                                        You can create up to {planLimits.maxSuites === Infinity ? 'unlimited' : planLimits.maxSuites} test suites
                                    </p>
                                </div>
                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Suite Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="e.g., Web App Testing, Mobile QA, API Tests"
                                            disabled={isSubmitting}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Brief description of what you'll test in this suite..."
                                            disabled={isSubmitting}
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>
                                    {(accountType || state?.auth?.accountType) === 'organization' && (
                                        <div className="flex items-center">
                                            <input
                                                id="isPublic"
                                                name="isPublic"
                                                type="checkbox"
                                                checked={formData.isPublic}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                disabled={isSubmitting}
                                            />
                                            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                                                Make this suite accessible to all organization members
                                            </label>
                                        </div>
                                    )}
                                    {errors.submit && (
                                        <p className="mt-1 text-sm text-red-600">{errors.submit}</p>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                'Create Test Suite'
                            )}
                        </button>
                        {!isRequired && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSuiteModal;