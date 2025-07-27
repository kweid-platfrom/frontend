/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
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
    const [organizationData, setOrganizationData] = useState(null);
    const [syncingOrgData, setSyncingOrgData] = useState(false);

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

    // Sync organization data when modal opens
    useEffect(() => {
        if (isOpen && state?.auth?.isAuthenticated) {
            syncOrganizationData();
        }
    }, [isOpen, state?.auth?.isAuthenticated]);

    const syncOrganizationData = async () => {
        try {
            setSyncingOrgData(true);
            console.log('Syncing organization data...');
            
            // First, try to sync the user's organization data
            const syncResult = await firestoreService.syncUserOrganizationData();
            
            if (syncResult.success) {
                console.log('Organization data sync result:', syncResult);
                
                // Get the updated user profile
                const profileResult = await firestoreService.getUserProfile();
                if (profileResult.success) {
                    const profile = profileResult.data;
                    console.log('Updated user profile:', {
                        account_type: profile.account_type,
                        organizationId: profile.organizationId,
                        organizationName: profile.organizationName,
                        role: profile.role
                    });
                    
                    if (profile.account_type === 'organization' && profile.organizationId) {
                        setOrganizationData({
                            id: profile.organizationId,
                            name: profile.organizationName,
                            role: profile.role
                        });
                    }
                    
                    // Update auth context if needed
                    if (syncResult.updated && actions?.auth?.updateUserProfile) {
                        actions.auth.updateUserProfile(profile);
                    }
                }
            } else {
                console.warn('Failed to sync organization data:', syncResult.error);
            }
        } catch (error) {
            console.error('Error syncing organization data:', error);
        } finally {
            setSyncingOrgData(false);
        }
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

        // Get the most current user profile to determine ownership
        const profileResult = await firestoreService.getUserProfile();
        if (!profileResult.success) {
            setErrors({ submit: 'Failed to get user profile. Please try again.' });
            return;
        }

        const userProfile = profileResult.data;
        const currentUser = state?.auth?.currentUser;
        
        console.log('=== COMPREHENSIVE SUITE CREATION DEBUG ===');
        console.log('1. Props and State:');
        console.log('   - accountType prop:', accountType);
        console.log('   - state.auth.accountType:', state?.auth?.accountType);
        console.log('   - final userAccountType:', userProfile.account_type);
        console.log('');
        console.log('2. Current User Object:');
        console.log('   - currentUser:', currentUser);
        console.log('   - currentUser keys:', currentUser ? Object.keys(currentUser) : 'null');
        console.log('');
        console.log('3. User Profile from DB:');
        console.log('   - userProfile:', userProfile);
        console.log('   - userProfile.account_type:', userProfile.account_type);
        console.log('   - userProfile.organizationId:', userProfile.organizationId);
        console.log('   - userProfile.organizationName:', userProfile.organizationName);
        console.log('');
        console.log('4. Organization Data State:');
        console.log('   - organizationData:', organizationData);
        
        let suiteOwnerType, suiteOwnerId;
        
        if (userProfile.account_type === 'organization') {
            // For organization users, the suite should be owned by the organization
            suiteOwnerType = 'organization';
            
            // Use organization ID from the synced data or user profile
            suiteOwnerId = organizationData?.id || userProfile.organizationId;
            
            // Fallback validation - if no org ID found, this is an error
            if (!suiteOwnerId) {
                console.error('Organization user missing organizationId:', {
                    userProfile,
                    organizationData,
                    currentUser
                });
                
                // Try to sync organization data one more time
                await syncOrganizationData();
                
                // Check again after sync
                const retryProfileResult = await firestoreService.getUserProfile();
                if (retryProfileResult.success && retryProfileResult.data.organizationId) {
                    suiteOwnerId = retryProfileResult.data.organizationId;
                    console.log('Found organizationId after retry sync:', suiteOwnerId);
                } else {
                    setErrors({ 
                        submit: 'Organization ID not found. Your account may not be properly linked to an organization. Please contact support.' 
                    });
                    return;
                }
            }
            
            console.log('5. Creating organization-owned suite:', { 
                suiteOwnerType, 
                suiteOwnerId,
                organizationName: organizationData?.name || userProfile.organizationName
            });
        } else {
            // For individual users, the suite is owned by the individual
            suiteOwnerType = 'individual';
            suiteOwnerId = currentUser?.uid;
            console.log('5. Creating individual-owned suite:', { suiteOwnerType, suiteOwnerId });
        }

        const suiteData = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            ownerType: suiteOwnerType,
            ownerId: suiteOwnerId,
            // Add the creator information separately from owner
            createdBy: currentUser?.uid,
            creatorAccountType: userProfile.account_type,
            tags: formData.tags.filter((tag) => tag.trim() !== ''),
            status: 'active',
        };

        console.log('6. Final Suite Data:');
        console.log('   - suiteData:', suiteData);
        console.log('=== END DEBUG ===');

        await executeOperation(
            () => firestoreService.createTestSuite(suiteData),
            (result) => {
                console.log('Suite creation successful:', result);
                toast.success('Test suite created successfully', { duration: 5000 });
                
                // FIX 4: Ensure the suite is properly added to state before calling onSuiteCreated
                if (result && actions?.suites?.addSuite) {
                    // Add the suite to local state immediately
                    actions.suites.addSuite(result);
                    
                    // Also set it as active if it's the first suite
                    if (!state.suites.activeSuite && (!state.suites.testSuites || state.suites.testSuites.length === 0)) {
                        actions.suites.activateSuite(result);
                    }
                }
                
                // Call the parent callback with the result
                onSuiteCreated?.(result || suiteData);
                
                // Reset form
                setFormData({ name: '', description: '', isPublic: false, tags: [] });
                setErrors({});
                
                // Close modal if not required
                if (!isRequired) {
                    onCancel?.();
                }
            },
            (errorMessage) => {
                console.error('Suite creation failed with error:', errorMessage);
                setErrors({ submit: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
                
                // If it's an organization-related error, try syncing again
                if (errorMessage.includes('organization') || errorMessage.includes('Organization')) {
                    console.log('Attempting to re-sync organization data due to error...');
                    syncOrganizationData();
                }
            }
        );
    };

    const handleCancel = () => {
        if (!isRequired) {
            setFormData({ name: '', description: '', isPublic: false, tags: [] });
            setErrors({});
            onCancel?.();
        }
    };

    if (!isOpen || state?.subscription?.loading) return null;

    // Get the current account type for display logic
    const currentAccountType = organizationData ? 'organization' : (accountType || state?.auth?.accountType || 'individual');

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
                                    {syncingOrgData && (
                                        <p className="text-xs text-blue-600 mt-1 animate-pulse">
                                            Syncing organization data...
                                        </p>
                                    )}
                                    {organizationData && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            This test suite will be owned by <strong>{organizationData.name}</strong> and accessible to authorized members.
                                        </p>
                                    )}
                                    {currentAccountType === 'organization' && !organizationData && !syncingOrgData && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            Organization data not found. Attempting to sync...
                                        </p>
                                    )}
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
                                            disabled={isSubmitting || syncingOrgData}
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
                                            disabled={isSubmitting || syncingOrgData}
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>
                                    {organizationData && (
                                        <div className="flex items-center">
                                            <input
                                                id="isPublic"
                                                name="isPublic"
                                                type="checkbox"
                                                checked={formData.isPublic}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                disabled={isSubmitting || syncingOrgData}
                                            />
                                            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                                                Make this suite accessible to all organization members
                                            </label>
                                        </div>
                                    )}
                                    {errors.submit && (
                                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                            <p className="text-sm text-red-600">{errors.submit}</p>
                                            <button
                                                type="button"
                                                onClick={syncOrganizationData}
                                                className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
                                                disabled={syncingOrgData}
                                            >
                                                {syncingOrgData ? 'Syncing...' : 'Try syncing organization data'}
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || syncingOrgData}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${(isSubmitting || syncingOrgData) ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : syncingOrgData ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Syncing...
                                </>
                            ) : (
                                'Create Test Suite'
                            )}
                        </button>
                        {!isRequired && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting || syncingOrgData}
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