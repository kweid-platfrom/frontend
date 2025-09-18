import React, { useState } from 'react';
import { X, Calendar, Target, Clock, AlertCircle } from 'lucide-react';

const CreateSprintModal = ({ isOpen, onSprintCreated, onCancel, suiteId }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        goals: '',
        status: 'planning'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Sprint name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Sprint name must be at least 2 characters';
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'Sprint name must be less than 100 characters';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }

        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end <= start) {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (!suiteId) {
            actions.ui?.showError?.('Please select a test suite first');
            return;
        }

        setLoading(true);
        
        try {
            const sprintData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                goals: formData.goals.trim(),
                status: formData.status,
                progress: {
                    totalAssets: 0,
                    completedAssets: 0,
                    percentage: 0
                }
            };

            const result = await actions.sprints?.createSprint?.(suiteId, sprintData);
            
            if (result?.success) {
                onSprintCreated?.(result.data);
                
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    goals: '',
                    status: 'planning'
                });
                setErrors({});
                
                actions.ui?.showNotification?.('success', `Sprint "${sprintData.name}" created successfully!`, 3000);
            } else {
                throw new Error(result?.error?.message || 'Failed to create sprint');
            }
            
        } catch (error) {
            console.error('Error creating sprint:', error);
            actions.ui?.showError?.(error.message || 'Failed to create sprint');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Sprint</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Sprint Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sprint Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Sprint 1, User Authentication Sprint"
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Brief description of sprint objectives and scope..."
                            disabled={loading}
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                            </div>
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.startDate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date *
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                            </div>
                            {errors.endDate && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.endDate}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Goals */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sprint Goals
                        </label>
                        <div className="relative">
                            <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <textarea
                                value={formData.goals}
                                onChange={(e) => handleChange('goals', e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Key objectives and deliverables for this sprint..."
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        >
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Sprint'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSprintModal;