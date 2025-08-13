/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppProvider';
import { toast } from 'sonner';
import { useFirebaseOperation } from '../../utils/firebaseErrorHandler';
import firestoreService from '../../services';
import { X, Plus, Building2, User, Loader2 } from 'lucide-react';

const CreateSuiteModal = ({
    isOpen,
    onSuiteCreated,
    onCancel,
    isRequired = false,
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
    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);

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

    useEffect(() => {
        if (isOpen && state?.auth?.isAuthenticated) {
            loadUserProfile();
        }
    }, [isOpen, state?.auth?.isAuthenticated]);

    const loadUserProfile = async () => {
        try {
            setLoadingProfile(true);
            const profileResult = await firestoreService.getUserProfile(state.auth.currentUser.uid);
            
            if (profileResult.success) {
                setUserProfile(profileResult.data);
            } else {
                console.warn('Failed to get user profile:', profileResult.error);
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            setUserProfile(null);
        } finally {
            setLoadingProfile(false);
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

        if (!userProfile) {
            setErrors({ submit: 'Failed to get user profile. Please try again.' });
            return;
        }

        const currentUser = state?.auth?.currentUser;
        
        let suiteOwnerType, suiteOwnerId;
        
        if (userProfile.accountType === 'organization' || userProfile.account_type === 'organization') {
            suiteOwnerType = 'organization';
            suiteOwnerId = userProfile.organizationId;
            
            if (!suiteOwnerId) {
                await loadUserProfile();
                
                if (!userProfile?.organizationId) {
                    setErrors({ 
                        submit: 'Organization ID not found. Your account may not be properly linked to an organization. Please contact support.' 
                    });
                    return;
                }
                suiteOwnerId = userProfile.organizationId;
            }
        } else {
            suiteOwnerType = 'individual';
            suiteOwnerId = currentUser?.uid;
        }

        const suiteData = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim(),
            ownerType: suiteOwnerType,
            ownerId: suiteOwnerId,
            createdBy: currentUser?.uid,
            creatorAccountType: userProfile.accountType || userProfile.account_type,
            tags: formData.tags.filter((tag) => tag.trim() !== ''),
            status: 'active',
        };

        await executeOperation(
            () => firestoreService.createTestSuite(suiteData),
            (result) => {
                toast.success('Test suite created successfully', { duration: 5000 });
                
                if (result && actions?.suites?.addSuite) {
                    actions.suites.addSuite(result);
                    
                    if (!state.suites.activeSuite && (!state.suites.testSuites || state.suites.testSuites.length === 0)) {
                        actions.suites.activateSuite(result);
                    }
                }
                
                onSuiteCreated?.(result || suiteData);
                
                setFormData({ name: '', description: '', isPublic: false, tags: [] });
                setErrors({});
            },
            (errorMessage) => {
                setErrors({ submit: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
                
                if (errorMessage.includes('organization') || errorMessage.includes('Organization')) {
                    loadUserProfile();
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

    const isOrganizationAccount = userProfile?.accountType === 'organization' || userProfile?.account_type === 'organization';

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isRequired) {
            handleCancel();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
            />
            
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                    
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Plus className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {isRequired ? 'Create Your First Test Suite' : 'New Test Suite'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {isRequired ? 'Required to access the platform' : 'Organize your test cases and reports'}
                                </p>
                            </div>
                        </div>
                        {!isRequired && (
                            <button
                                onClick={handleCancel}
                                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                                disabled={isSubmitting || loadingProfile}
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <div className="flex items-center space-x-2 mb-2">
                                {isOrganizationAccount ? (
                                    <Building2 className="w-4 h-4 text-primary" />
                                ) : (
                                    <User className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-sm font-medium text-foreground">
                                    {isOrganizationAccount ? 'Organization Suite' : 'Personal Suite'}
                                </span>
                            </div>
                            
                            {loadingProfile && (
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Loading profile data...</span>
                                </div>
                            )}
                            
                            {userProfile && isOrganizationAccount && (
                                <p className="text-xs text-muted-foreground">
                                    This suite will be owned by <span className="font-medium text-foreground">{userProfile.organizationName || 'your organization'}</span> and accessible to authorized members.
                                </p>
                            )}
                            
                            {userProfile && !isOrganizationAccount && (
                                <p className="text-xs text-muted-foreground">
                                    This suite will be private to your account.
                                </p>
                            )}
                            
                            <div className="mt-2 text-xs text-primary">
                                Limit: {planLimits.maxSuites === Infinity ? 'Unlimited' : planLimits.maxSuites} suites
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                                    Suite Name <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2.5 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                                        errors.name ? 'border-destructive' : 'border-border hover:border-border/80'
                                    }`}
                                    placeholder="e.g., Web App Testing, Mobile QA, API Tests"
                                    disabled={isSubmitting || loadingProfile}
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2.5 bg-background border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none ${
                                        errors.description ? 'border-destructive' : 'border-border hover:border-border/80'
                                    }`}
                                    placeholder="Brief description of what you'll test in this suite..."
                                    disabled={isSubmitting || loadingProfile}
                                />
                                {errors.description && (
                                    <p className="mt-1.5 text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            {isOrganizationAccount && (
                                <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                    <input
                                        id="isPublic"
                                        name="isPublic"
                                        type="checkbox"
                                        checked={formData.isPublic}
                                        onChange={handleInputChange}
                                        className="mt-0.5 h-4 w-4 text-primary focus:ring-primary/20 border-border rounded transition-colors"
                                        disabled={isSubmitting || loadingProfile}
                                    />
                                    <div>
                                        <label htmlFor="isPublic" className="text-sm font-medium text-foreground cursor-pointer">
                                            Organization-wide Access
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Make this suite accessible to all organization members
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {errors.submit && (
                            <div className="mt-5 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-destructive mb-2">{errors.submit}</p>
                                <button
                                    type="button"
                                    onClick={loadUserProfile}
                                    className="text-xs text-primary hover:text-primary/80 underline transition-colors"
                                    disabled={loadingProfile}
                                >
                                    {loadingProfile ? 'Loading...' : 'Retry loading profile'}
                                </button>
                            </div>
                        )}

                        <div className="flex space-x-3 mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting || loadingProfile}
                                className="flex-1 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : loadingProfile ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        <span>Create Test Suite</span>
                                    </>
                                )}
                            </button>
                            
                            {!isRequired && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSubmitting || loadingProfile}
                                    className="px-4 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSuiteModal;